// Isi alat preset + 2 akun demo. Idempoten: aman dijalankan berkali-kali (juga dipanggil saat start di VPS).
// Akun yang sudah ada tidak disentuh (data uji di dalamnya aman).
// Data demo karangan, bukan data asli. Detail: docs/FEATURES.md § Seeder.
import bcrypt from "bcryptjs";
import { exec, pool, rows, tx } from "./db.js";

const PRESET: [string, number, number, string][] = [
  // nama, watt (kisaran umum di media & jurnal, lihat docs/FEATURES.md), jam wajar/hari (asumsi tim), kategori
  ["Lampu LED", 8, 12, "penerangan"],
  ["Kipas angin", 45, 8, "pendingin"],
  ["TV LED", 55, 6, "hiburan"],
  ["Kulkas 1 pintu (rata-rata)", 40, 24, "dapur"],
  ["Kulkas 2 pintu (rata-rata)", 60, 24, "dapur"],
  ["AC 1/2 PK", 400, 6, "pendingin"],
  ["AC 1 PK", 800, 6, "pendingin"],
  ["Pompa air", 250, 2, "air"],
  ["Mesin cuci", 300, 1.5, "cuci"],
  ["Setrika", 350, 1, "cuci"],
  ["Rice cooker (mode hangat)", 50, 6, "dapur"],
  ["Dispenser (rata-rata)", 100, 12, "dapur"],
  ["Pemanas air listrik", 350, 1, "air"],
  ["Laptop / komputer", 60, 8, "kerja"],
  ["Router WiFi", 10, 24, "kerja"],
  ["Charger HP", 10, 4, "kerja"],
];

export const DEMO = { nama: "Ibu Sri", email: "demo@hematrumah.id", password: "demo12345" };

// Alat demo sesuai contoh cerita di Konsep Final. [preset, nama, jumlah, jam, hari/minggu, watt, dari_ai]
const ALAT_DEMO: [string, string, number, number, number, number, boolean][] = [
  ["AC 1 PK", "AC 1 PK", 1, 8, 7, 800, true],
  ["Kulkas 2 pintu (rata-rata)", "Kulkas 2 pintu", 1, 24, 7, 50, false],
  ["TV LED", "TV LED", 1, 12, 7, 80, true],
  ["Lampu LED", "Lampu LED", 8, 10, 7, 10, true],
  ["Pompa air", "Pompa air", 1, 10, 7, 250, true],
  ["Mesin cuci", "Mesin cuci", 1, 1, 3, 350, false],
];
const LISTRIK_DEMO: [string, number][] = [["2026-06-01", 468000], ["2026-07-01", 475000], ["2026-08-01", 489000], ["2026-09-01", 502000], ["2026-10-01", 515000], ["2026-11-01", 521000]];
// 9 bacaan meteran = 8 minggu pemakaian: 4,1 3,9 4,2 4,0 3,8 4,1 4,0 6,2 (minggu terakhir 1,55x = lonjakan)
const AIR_PAKAI = [4.1, 3.9, 4.2, 4.0, 3.8, 4.1, 4.0, 6.2];

// Akun demo kedua: "rumah yang sudah dipakai berminggu-minggu" untuk babak lonjakan saat presentasi.
// Tanggal dihitung mundur dari HARI SEEDER DIJALANKAN, jadi lonjakan aktif selalu jatuh di minggu ini.
// Air 8 minggu: lonjakan lama di minggu ke-4 (6,0 = 1,48x, masuk Riwayat), normal lagi, lalu minggu ini 6,3 (1,41x).
export const DEMO_B = { nama: "Pak Budi", email: "budi@hematrumah.id", password: "demo12345" };
const ALAT_B: [string, string, number, number, number, number, boolean][] = [
  ["AC 1/2 PK", "AC 1/2 PK", 1, 8, 7, 400, true],
  ["Kulkas 1 pintu (rata-rata)", "Kulkas 1 pintu", 1, 24, 7, 40, false],
  ["TV LED", "TV LED", 1, 6, 7, 55, true],
  ["Lampu LED", "Lampu LED", 6, 10, 7, 8, true],
  ["Pompa air", "Pompa air", 1, 3, 7, 250, true],
  ["Mesin cuci", "Mesin cuci", 1, 1, 3, 300, false],
];
const LISTRIK_B = [468000, 475000, 489000, 502000, 515000, 521000]; // 6 bulan, berakhir di bulan ini
const AIR_PAKAI_B = [4.1, 3.9, 4.2, 6.0, 4.0, 3.8, 4.1, 6.3];

type Akun = {
  akun: { nama: string; email: string; password: string };
  alat: [string, string, number, number, number, number, boolean][];
  listrik: [string, number][];
  airMulai: Date; // tanggal bacaan meteran pertama
  airPakai: number[];
};

/** Tanggal hari ini (WIB) jam 00:00 UTC, supaya penjumlahan hari tidak bergeser zona waktu. */
function hariIniWib() {
  const d = new Date(Date.now() + 7 * 3600_000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function akunB(): Akun {
  const hari = hariIniWib();
  const airMulai = new Date(hari);
  airMulai.setUTCDate(airMulai.getUTCDate() - 7 * AIR_PAKAI_B.length);
  const listrik = LISTRIK_B.map((rp, i): [string, number] => {
    const b = new Date(Date.UTC(hari.getUTCFullYear(), hari.getUTCMonth() - (LISTRIK_B.length - 1 - i), 1));
    return [b.toISOString().slice(0, 10), rp];
  });
  return { akun: DEMO_B, alat: ALAT_B, listrik, airMulai, airPakai: AIR_PAKAI_B };
}

async function buatAkun(a: Akun, presetId: Record<string, number>) {
  const ada = await rows<{ id: number }>("SELECT id FROM users WHERE email = ?", [a.akun.email]);
  if (ada.length) {
    console.log(`seed: akun ${a.akun.email} sudah ada, dilewati`);
    return;
  }
  await tx(async (c) => {
    const hash = await bcrypt.hash(a.akun.password, 10);
    const u = await exec("INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)", [a.akun.nama, a.akun.email, hash], c);
    const r = await exec(
      "INSERT INTO rumah (user_id, penghuni, daya_va, jenis_listrik, tarif_listrik, tarif_air) VALUES (?, 4, 1300, 'token', 1444.70, 7000)",
      [u.insertId],
      c,
    );
    const rumahId = r.insertId;
    for (const [preset, nama, jumlah, jam, hari, watt, ai] of a.alat) {
      await c.query(
        "INSERT INTO rumah_alat (rumah_id, preset_id, nama, jumlah, jam_per_hari, hari_per_minggu, watt, dari_ai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [rumahId, presetId[preset] ?? null, nama, jumlah, jam, hari, watt, ai],
      );
    }
    await c.query(
      "INSERT INTO kebiasaan_air (rumah_id, mandi_per_hari, cara_mandi, cuci_baju_per_minggu, cuci_pakai_mesin, siram_tanaman_per_minggu, cuci_kendaraan_per_minggu) VALUES (?, 2, 'gayung', 3, TRUE, 0, 1)",
      [rumahId],
    );
    for (const [tgl, rp] of a.listrik) {
      await c.query("INSERT INTO catatan_pemakaian (rumah_id, jenis, tanggal, nilai) VALUES (?, 'listrik', ?, ?)", [rumahId, tgl, rp]);
    }
    let meter = 1250.0;
    const tgl = new Date(a.airMulai);
    for (let i = 0; i <= a.airPakai.length; i++) {
      await c.query("INSERT INTO catatan_pemakaian (rumah_id, jenis, tanggal, nilai) VALUES (?, 'air', ?, ?)", [rumahId, tgl.toISOString().slice(0, 10), meter.toFixed(1)]);
      if (i < a.airPakai.length) {
        meter += a.airPakai[i];
        tgl.setUTCDate(tgl.getUTCDate() + 7);
      }
    }
  });
  console.log(`seed: akun ${a.akun.email} dibuat`);
}

async function seed() {
  for (const [nama, watt, jam, kat] of PRESET) {
    await pool.query(
      "INSERT INTO alat_preset (nama, watt, jam_wajar, kategori) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE watt = VALUES(watt), jam_wajar = VALUES(jam_wajar), kategori = VALUES(kategori)",
      [nama, watt, jam, kat],
    );
  }
  const presetRows = await rows<{ id: number; nama: string }>("SELECT id, nama FROM alat_preset");
  const presetId: Record<string, number> = Object.fromEntries(presetRows.map((p) => [p.nama, p.id]));

  await buatAkun(
    { akun: DEMO, alat: ALAT_DEMO, listrik: LISTRIK_DEMO, airMulai: new Date(Date.UTC(2026, 8, 12)), airPakai: AIR_PAKAI }, // 12 Sep 2026 s.d. 7 Nov 2026
    presetId,
  );
  await buatAkun(akunB(), presetId);
}

await seed();
await pool.end();

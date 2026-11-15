// Profil & data rumah. Kontrak: docs/API.md § Profil & data rumah.
import { Router } from "express";
import { z } from "zod";
import { exec, rows, tx } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { POLA_NAMA_ALAT } from "../ai/aman.js";
import { wajibLogin } from "../lib/auth.js";

const r = Router();
r.use(wajibLogin);

export type Profil = {
  penghuni: number;
  daya_va: number;
  jenis_listrik: "token" | "pascabayar";
  tarif_listrik: number;
  tarif_air: number | null;
};

type RumahRow = Profil & { id: number };

/** id rumah milik user, atau null kalau profil belum diisi. Dipakai endpoint lain. */
export async function rumahIdUser(userId: number): Promise<number | null> {
  const [x] = await rows<{ id: number }>("SELECT id FROM rumah WHERE user_id = ?", [userId]);
  return x?.id ?? null;
}

const profilKeluar = (x: RumahRow): Profil => ({
  penghuni: x.penghuni,
  daya_va: x.daya_va,
  jenis_listrik: x.jenis_listrik,
  tarif_listrik: Number(x.tarif_listrik),
  tarif_air: x.tarif_air === null ? null : Number(x.tarif_air),
});

r.get("/", async (req, res) => {
  const [rumah] = await rows<RumahRow>(
    "SELECT id, penghuni, daya_va, jenis_listrik, tarif_listrik, tarif_air FROM rumah WHERE user_id = ?",
    [req.userId],
  );
  if (!rumah) return res.json({ profil: null, alat: [], kebiasaan_air: null });

  const alat = await rows<{ id: number; preset_id: number | null; nama: string; jumlah: number; jam_per_hari: number; hari_per_minggu: number; watt: number; dari_ai: number }>(
    "SELECT id, preset_id, nama, jumlah, jam_per_hari, hari_per_minggu, watt, dari_ai FROM rumah_alat WHERE rumah_id = ? ORDER BY id",
    [rumah.id],
  );
  const [air] = await rows<{ mandi_per_hari: number; cara_mandi: "gayung" | "shower"; cuci_baju_per_minggu: number; cuci_pakai_mesin: number; siram_tanaman_per_minggu: number; cuci_kendaraan_per_minggu: number }>(
    "SELECT mandi_per_hari, cara_mandi, cuci_baju_per_minggu, cuci_pakai_mesin, siram_tanaman_per_minggu, cuci_kendaraan_per_minggu FROM kebiasaan_air WHERE rumah_id = ?",
    [rumah.id],
  );

  res.json({
    profil: profilKeluar(rumah),
    alat: alat.map((a) => ({ ...a, dari_ai: !!a.dari_ai })),
    kebiasaan_air: air ? { ...air, cuci_pakai_mesin: !!air.cuci_pakai_mesin } : null,
  });
});

const profilSchema = z.object({
  penghuni: z.coerce.number({ error: "Harus berupa angka." }).int("Jumlah penghuni harus bilangan bulat.").min(1, "Minimal 1 orang.").max(20, "Maksimal 20 orang."),
  daya_va: z.coerce.number({ error: "Harus berupa angka." }).int().min(450, "Daya listrik minimal 450 VA.").max(200000, "Daya listrik terlalu besar."),
  jenis_listrik: z.enum(["token", "pascabayar"], { message: "Pilih token atau tagihan bulanan." }),
  tarif_listrik: z.coerce.number({ error: "Harus berupa angka." }).positive("Tarif listrik harus lebih dari 0.").max(10000, "Tarif listrik per kWh terlalu besar, cek lagi."),
  tarif_air: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.coerce.number({ error: "Harus berupa angka." }).positive("Tarif air harus lebih dari 0.").max(100000, "Tarif air per m³ terlalu besar, cek lagi.").nullable(),
  ),
});

r.put("/profil", async (req, res) => {
  const b = parse(profilSchema, req.body);
  // Satu user satu rumah (user_id UNIQUE): insert pertama kali, sesudahnya update.
  await exec(
    `INSERT INTO rumah (user_id, penghuni, daya_va, jenis_listrik, tarif_listrik, tarif_air) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE penghuni = VALUES(penghuni), daya_va = VALUES(daya_va), jenis_listrik = VALUES(jenis_listrik),
       tarif_listrik = VALUES(tarif_listrik), tarif_air = VALUES(tarif_air)`,
    [req.userId, b.penghuni, b.daya_va, b.jenis_listrik, b.tarif_listrik, b.tarif_air],
  );
  const profil: Profil = { ...b, tarif_air: b.tarif_air ?? null };
  res.json({ profil });
});

const n = (pesan?: string) => z.coerce.number({ error: pesan ?? "Harus berupa angka." });

const alatSchema = z.object({
  preset_id: z.coerce.number({ error: "Harus berupa angka." }).int().positive().nullable().optional().default(null),
  nama: z.string().trim().min(1, "Nama alat wajib diisi.").max(60, "Nama alat maksimal 60 huruf.").regex(POLA_NAMA_ALAT, "Nama alat hanya boleh huruf, angka, dan tanda baca biasa."),
  jumlah: n().int("Jumlah harus bilangan bulat.").min(1, "Minimal 1.").max(50, "Maksimal 50."),
  jam_per_hari: n().min(0, "Tidak boleh minus.").max(24, "Maksimal 24 jam."),
  hari_per_minggu: n().int("Harus bilangan bulat.").min(1, "Minimal 1 hari.").max(7, "Maksimal 7 hari."),
  watt: n().int("Watt harus bilangan bulat.").min(1, "Watt minimal 1.").max(5000, "Watt maksimal 5000."),
  dari_ai: z.boolean().optional().default(false),
});

const kali = (max: number) => n().int("Harus bilangan bulat.").min(0, "Tidak boleh minus.").max(max, `Maksimal ${max}.`);
const airSchema = z.object({
  mandi_per_hari: kali(10),
  cara_mandi: z.enum(["gayung", "shower"], { message: "Pilih gayung atau shower." }),
  cuci_baju_per_minggu: kali(21),
  cuci_pakai_mesin: z.boolean({ error: "Pilih ya atau tidak." }),
  siram_tanaman_per_minggu: kali(14),
  cuci_kendaraan_per_minggu: kali(14),
});

const dataSchema = z.object({
  alat: z.array(alatSchema).max(50, "Maksimal 50 alat."),
  kebiasaan_air: airSchema,
});

r.put("/data", async (req, res) => {
  const b = parse(dataSchema, req.body);
  const rumahId = await rumahIdUser(req.userId);
  if (!rumahId) throw new HttpError(400, "VALIDASI", "Isi profil rumah dulu sebelum data alat.");

  // preset_id harus ada di alat_preset; yang tidak dikenal dianggap Alat lain.
  const presetValid = new Set((await rows<{ id: number }>("SELECT id FROM alat_preset")).map((p) => p.id));
  const alat = b.alat.map((a) => ({ ...a, preset_id: a.preset_id && presetValid.has(a.preset_id) ? a.preset_id : null }));

  // Form = satu-satunya sumber data: ganti semua alat lama dalam satu transaksi.
  await tx(async (c) => {
    await exec("DELETE FROM rumah_alat WHERE rumah_id = ?", [rumahId], c);
    for (const a of alat) {
      await exec(
        "INSERT INTO rumah_alat (rumah_id, preset_id, nama, jumlah, jam_per_hari, hari_per_minggu, watt, dari_ai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [rumahId, a.preset_id, a.nama, a.jumlah, a.jam_per_hari, a.hari_per_minggu, a.watt, a.dari_ai],
        c,
      );
    }
    const k = b.kebiasaan_air;
    await exec(
      `INSERT INTO kebiasaan_air (rumah_id, mandi_per_hari, cara_mandi, cuci_baju_per_minggu, cuci_pakai_mesin, siram_tanaman_per_minggu, cuci_kendaraan_per_minggu)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE mandi_per_hari = VALUES(mandi_per_hari), cara_mandi = VALUES(cara_mandi), cuci_baju_per_minggu = VALUES(cuci_baju_per_minggu),
         cuci_pakai_mesin = VALUES(cuci_pakai_mesin), siram_tanaman_per_minggu = VALUES(siram_tanaman_per_minggu), cuci_kendaraan_per_minggu = VALUES(cuci_kendaraan_per_minggu)`,
      [rumahId, k.mandi_per_hari, k.cara_mandi, k.cuci_baju_per_minggu, k.cuci_pakai_mesin, k.siram_tanaman_per_minggu, k.cuci_kendaraan_per_minggu],
      c,
    );
  });

  const simpan = await rows<{ id: number; preset_id: number | null; nama: string; jumlah: number; jam_per_hari: number; hari_per_minggu: number; watt: number; dari_ai: number }>(
    "SELECT id, preset_id, nama, jumlah, jam_per_hari, hari_per_minggu, watt, dari_ai FROM rumah_alat WHERE rumah_id = ? ORDER BY id",
    [rumahId],
  );
  res.json({ alat: simpan.map((a) => ({ ...a, dari_ai: !!a.dari_ai })), kebiasaan_air: b.kebiasaan_air });
});

export default r;

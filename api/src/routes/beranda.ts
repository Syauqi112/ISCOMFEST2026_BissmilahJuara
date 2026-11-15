// Data halaman Beranda. Kontrak: docs/API.md § Beranda.
import { Router } from "express";
import { rows } from "../db.js";
import { wajibLogin } from "../lib/auth.js";
import { catatanRumah, ringkasLonjakan, seri } from "../lib/pemakaian.js";
import { hitungRumah, type KebiasaanAir } from "../hitung.js";

const r = Router();
r.use(wajibLogin);

r.get("/", async (req, res) => {
  const [rumah] = await rows<{ id: number; penghuni: number; tarif_listrik: number; tarif_air: number | null }>(
    "SELECT id, penghuni, tarif_listrik, tarif_air FROM rumah WHERE user_id = ?",
    [req.userId],
  );
  if (!rumah) return res.json({ skor: null, total_dicentang_rp: 0, listrik: [], air: [], rata_air_m3: null, lonjakan_aktif: [] });

  // Skor dari rumus (tidak perlu menunggu audit AI).
  const alat = await rows<{ nama: string; jumlah: number; jam_per_hari: number; hari_per_minggu: number; watt: number; jam_wajar: number | null }>(
    "SELECT a.nama, a.jumlah, a.jam_per_hari, a.hari_per_minggu, a.watt, p.jam_wajar FROM rumah_alat a LEFT JOIN alat_preset p ON p.id = a.preset_id WHERE a.rumah_id = ?",
    [rumah.id],
  );
  const [air] = await rows<KebiasaanAir & { cuci_pakai_mesin: number | boolean }>(
    "SELECT mandi_per_hari, cara_mandi, cuci_baju_per_minggu, cuci_pakai_mesin, siram_tanaman_per_minggu, cuci_kendaraan_per_minggu FROM kebiasaan_air WHERE rumah_id = ?",
    [rumah.id],
  );
  const skor = alat.length ? hitungRumah(rumah, alat, air ? { ...air, cuci_pakai_mesin: !!air.cuci_pakai_mesin } : null).skor : null;

  const [{ total }] = await rows<{ total: number | null }>("SELECT SUM(hemat_rp) AS total FROM misi WHERE rumah_id = ? AND selesai = TRUE", [rumah.id]);

  const sListrik = seri("listrik", await catatanRumah(rumah.id, "listrik"));
  const sAir = seri("air", await catatanRumah(rumah.id, "air")).filter((t) => t.pemakaian !== null);
  const terakhirL = sListrik.at(-1);
  const terakhirA = sAir.at(-1);

  res.json({
    skor,
    total_dicentang_rp: Number(total ?? 0),
    listrik: sListrik.slice(-6).map((t) => ({ catatan_id: t.id, periode: t.periode, rp: t.pemakaian, lonjakan: t.lonjakan })),
    air: sAir.slice(-8).map((t) => ({ catatan_id: t.id, periode: t.periode, m3: t.pemakaian, lonjakan: t.lonjakan })),
    rata_air_m3: terakhirA?.rata_rata ?? null,
    lonjakan_aktif: [
      ...(terakhirL?.lonjakan ? [ringkasLonjakan("listrik", terakhirL, rumah.tarif_air)] : []),
      ...(terakhirA?.lonjakan ? [ringkasLonjakan("air", terakhirA, rumah.tarif_air)] : []),
    ],
  });
});

export default r;

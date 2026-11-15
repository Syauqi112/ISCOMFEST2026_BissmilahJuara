// Catat & lihat pemakaian. Kontrak: docs/API.md § Pemakaian (pantau).
import { Router } from "express";
import { z } from "zod";
import { exec, rows } from "../db.js";
import { HttpError, parse, tidakDitemukan, validasi } from "../lib/http.js";
import { wajibLogin } from "../lib/auth.js";
import { catatanRumah, ringkasLonjakan, seri, type Jenis } from "../lib/pemakaian.js";
import { rumahIdUser } from "./rumah.js";

const r = Router();
r.use(wajibLogin);

async function rumahWajib(userId: number) {
  const id = await rumahIdUser(userId);
  if (!id) throw new HttpError(400, "VALIDASI", "Isi profil rumah dulu.");
  return id;
}

const fmt = (v: number, tgl: string) =>
  `${Number(v).toLocaleString("id-ID")} m³ pada ${new Date(`${tgl}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;

const hariIni = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10); // WIB

r.get("/", async (req, res) => {
  const { jenis } = parse(z.object({ jenis: z.enum(["listrik", "air"], { message: "jenis harus listrik atau air." }) }), req.query);
  const rumahId = await rumahWajib(req.userId);
  const data = seri(jenis, await catatanRumah(rumahId, jenis)).map(({ id, periode, nilai, pemakaian, lonjakan }) => ({ id, periode, nilai, pemakaian, lonjakan }));
  res.json({ data });
});

const angka = (pesan: string) => z.coerce.number({ error: "Harus berupa angka." }).positive(pesan);
const tanggalSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD.");
const catatSchema = z.discriminatedUnion("jenis", [
  z.object({
    jenis: z.literal("listrik"),
    periode: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pilih bulan (YYYY-MM)."),
    nilai_rp: angka("Total Rupiah harus lebih dari 0.").max(100_000_000, "Angka terlalu besar, cek lagi."),
  }),
  z.object({
    jenis: z.literal("air"),
    tanggal: tanggalSchema,
    angka_meteran: angka("Angka meteran harus lebih dari 0.").max(10_000_000, "Angka terlalu besar, cek lagi."),
  }),
], { message: "jenis harus listrik atau air." });

r.post("/", async (req, res) => {
  const b = parse(catatSchema, req.body);
  const rumahId = await rumahWajib(req.userId);
  const jenis: Jenis = b.jenis;

  let tanggal: string;
  let nilai: number;
  if (b.jenis === "listrik") {
    tanggal = `${b.periode}-01`;
    nilai = b.nilai_rp;
    if (b.periode > hariIni().slice(0, 7)) throw validasi("Bulan tidak boleh di masa depan.", { periode: "Bulan tidak boleh di masa depan." });
  } else {
    tanggal = b.tanggal;
    nilai = b.angka_meteran;
    if (tanggal > hariIni()) throw validasi("Tanggal tidak boleh di masa depan.", { tanggal: "Tanggal tidak boleh di masa depan." });
    // Meteran air selalu naik: harus > bacaan sebelumnya dan < bacaan sesudahnya.
    const [sebelum] = await rows<{ tanggal: string; nilai: number }>(
      "SELECT tanggal, nilai FROM catatan_pemakaian WHERE rumah_id = ? AND jenis = 'air' AND tanggal < ? ORDER BY tanggal DESC LIMIT 1", [rumahId, tanggal]);
    const [sesudah] = await rows<{ tanggal: string; nilai: number }>(
      "SELECT tanggal, nilai FROM catatan_pemakaian WHERE rumah_id = ? AND jenis = 'air' AND tanggal > ? ORDER BY tanggal LIMIT 1", [rumahId, tanggal]);
    if (sebelum && nilai <= Number(sebelum.nilai)) {
      const m = `Angka harus lebih besar dari catatan sebelumnya (${fmt(sebelum.nilai, sebelum.tanggal)}).`;
      throw validasi(m, { angka_meteran: m });
    }
    if (sesudah && nilai >= Number(sesudah.nilai)) {
      const m = `Angka harus lebih kecil dari catatan sesudahnya (${fmt(sesudah.nilai, sesudah.tanggal)}).`;
      throw validasi(m, { angka_meteran: m });
    }
  }

  // Satu catatan per bulan (listrik) / per tanggal (air): kalau sudah ada, ditimpa (koreksi).
  await exec(
    "INSERT INTO catatan_pemakaian (rumah_id, jenis, tanggal, nilai) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nilai = VALUES(nilai)",
    [rumahId, jenis, tanggal, nilai],
  );
  // Nilai berubah -> penjelasan lonjakan lama (kalau ada) tidak berlaku lagi.
  await exec(
    "DELETE l FROM lonjakan l JOIN catatan_pemakaian c ON c.id = l.catatan_id WHERE c.rumah_id = ? AND c.jenis = ? AND c.tanggal = ?",
    [rumahId, jenis, tanggal],
  );

  const [{ tarif_air }] = await rows<{ tarif_air: number | null }>("SELECT tarif_air FROM rumah WHERE id = ?", [rumahId]);
  const s = seri(jenis, await catatanRumah(rumahId, jenis));
  const t = s.find((x) => x.periode === (jenis === "listrik" ? tanggal.slice(0, 7) : tanggal))!;
  res.status(201).json({
    catatan: { id: t.id, periode: t.periode, nilai: t.nilai, pemakaian: t.pemakaian, lonjakan: t.lonjakan },
    lonjakan: t.lonjakan ? ringkasLonjakan(jenis, t, tarif_air) : null,
  });
});

r.delete("/:id", async (req, res) => {
  const id = parse(z.coerce.number().int().positive(), req.params.id);
  const rumahId = await rumahWajib(req.userId);
  const del = await exec("DELETE FROM catatan_pemakaian WHERE id = ? AND rumah_id = ?", [id, rumahId]);
  if (!del.affectedRows) throw tidakDitemukan("Catatan tidak ditemukan.");
  res.status(204).end();
});

export default r;

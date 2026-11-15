// Detail lonjakan + checklist langkah cek. Penjelasan AI dibuat lewat POST /api/ai/lonjakan (menyusul).
import { Router } from "express";
import { z } from "zod";
import { exec, rows } from "../db.js";
import { HttpError, parse, tidakDitemukan } from "../lib/http.js";
import { wajibLogin } from "../lib/auth.js";
import { catatanRumah, ringkasLonjakan, seri, type Jenis } from "../lib/pemakaian.js";
import { rumahIdUser } from "./rumah.js";

const r = Router();
r.use(wajibLogin);

export type AiLonjakan = {
  kemungkinan_penyebab: { judul: string; alasan: string }[];
  langkah_cek: string[];
  kapan_panggil_tukang: string;
};

const parseJson = <T>(v: unknown): T | null => (v == null ? null : typeof v === "string" ? (JSON.parse(v) as T) : (v as T));

/** Statistik lonjakan untuk catatan milik user. 404 kalau bukan miliknya atau bukan lonjakan. */
export async function dataLonjakan(userId: number, catatanId: number) {
  const rumahId = await rumahIdUser(userId);
  if (!rumahId) throw tidakDitemukan("Catatan tidak ditemukan.");
  const [c] = await rows<{ jenis: Jenis; tarif_air: number | null }>(
    "SELECT c.jenis, r.tarif_air FROM catatan_pemakaian c JOIN rumah r ON r.id = c.rumah_id WHERE c.id = ? AND c.rumah_id = ?",
    [catatanId, rumahId],
  );
  if (!c) throw tidakDitemukan("Catatan tidak ditemukan.");
  const t = seri(c.jenis, await catatanRumah(rumahId, c.jenis)).find((x) => x.id === catatanId);
  if (!t?.lonjakan) throw tidakDitemukan("Catatan ini tidak termasuk lonjakan.");
  return { rumahId, jenis: c.jenis, titik: t, ringkas: ringkasLonjakan(c.jenis, t, c.tarif_air) };
}

/** Bentuk respons Lonjakan (docs/API.md). ai = null kalau penjelasan AI belum dibuat. */
export async function responsLonjakan(userId: number, catatanId: number) {
  const d = await dataLonjakan(userId, catatanId);
  const [l] = await rows<{ ai_json: unknown; langkah_selesai: unknown }>("SELECT ai_json, langkah_selesai FROM lonjakan WHERE catatan_id = ?", [catatanId]);
  const ai = parseJson<AiLonjakan>(l?.ai_json);
  const selesai = parseJson<boolean[]>(l?.langkah_selesai) ?? [];
  return {
    ...d.ringkas,
    kemungkinan_penyebab: ai?.kemungkinan_penyebab ?? null,
    langkah_cek: ai ? ai.langkah_cek.map((teks, i) => ({ teks, selesai: !!selesai[i] })) : null,
    kapan_panggil_tukang: ai?.kapan_panggil_tukang ?? null,
  };
}

const idParam = z.coerce.number({ error: "id tidak valid." }).int().positive();

r.get("/:catatan_id", async (req, res) => {
  res.json(await responsLonjakan(req.userId, parse(idParam, req.params.catatan_id)));
});

r.patch("/:catatan_id/langkah", async (req, res) => {
  const catatanId = parse(idParam, req.params.catatan_id);
  const b = parse(z.object({ index: z.coerce.number().int().min(0), selesai: z.boolean() }), req.body);
  await dataLonjakan(req.userId, catatanId); // cek kepemilikan
  const [l] = await rows<{ ai_json: unknown; langkah_selesai: unknown }>("SELECT ai_json, langkah_selesai FROM lonjakan WHERE catatan_id = ?", [catatanId]);
  const ai = parseJson<AiLonjakan>(l?.ai_json);
  if (!ai) throw new HttpError(400, "VALIDASI", "Minta penjelasan AI dulu sebelum mencentang langkah.");
  if (b.index >= ai.langkah_cek.length) throw new HttpError(400, "VALIDASI", "Langkah tidak ada.");
  const selesai = ai.langkah_cek.map((_, i) => !!(parseJson<boolean[]>(l?.langkah_selesai) ?? [])[i]);
  selesai[b.index] = b.selesai;
  await exec("UPDATE lonjakan SET langkah_selesai = ? WHERE catatan_id = ?", [JSON.stringify(selesai), catatanId]);
  res.json({ langkah_cek: ai.langkah_cek.map((teks, i) => ({ teks, selesai: selesai[i] })) });
});

export default r;

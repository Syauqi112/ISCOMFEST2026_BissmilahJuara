// Seri pemakaian + deteksi lonjakan. Rumus: docs/FEATURES.md § Rumus (Lonjakan).
import { rows } from "../db.js";
import { LONJAKAN } from "../config.js";

export type Jenis = "listrik" | "air";
export type CatatanRow = { id: number; jenis: Jenis; tanggal: string; nilai: number };

export type Titik = {
  id: number;
  periode: string; // listrik "YYYY-MM", air "YYYY-MM-DD"
  nilai: number; // listrik: Rp; air: angka meteran m³
  pemakaian: number | null; // listrik: Rp bulan itu; air: m³ per 7 hari (null untuk bacaan pertama)
  rata_rata: number | null; // rata-rata pembanding sebelumnya
  rasio: number | null;
  lonjakan: boolean;
};

const hari = (a: string, b: string) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function catatanRumah(rumahId: number, jenis: Jenis) {
  return rows<CatatanRow>("SELECT id, jenis, tanggal, nilai FROM catatan_pemakaian WHERE rumah_id = ? AND jenis = ? ORDER BY tanggal", [rumahId, jenis]);
}

/** Ubah catatan (urut tanggal) jadi seri pemakaian + tanda lonjakan. */
export function seri(jenis: Jenis, catatan: CatatanRow[]): Titik[] {
  const nPembanding = jenis === "listrik" ? LONJAKAN.pembanding_listrik : LONJAKAN.pembanding_air;
  const out: Titik[] = [];
  catatan.forEach((c, i) => {
    let pemakaian: number | null;
    if (jenis === "listrik") pemakaian = Number(c.nilai);
    else if (i === 0) pemakaian = null;
    else {
      const d = hari(catatan[i - 1].tanggal, c.tanggal);
      pemakaian = d > 0 ? r2(((Number(c.nilai) - Number(catatan[i - 1].nilai)) / d) * 7) : null;
    }
    const sebelum = out.map((t) => t.pemakaian).filter((v): v is number => v !== null).slice(-nPembanding);
    const rata = sebelum.length >= LONJAKAN.minimal_pembanding ? sebelum.reduce((t, v) => t + v, 0) / sebelum.length : null;
    const rasio = rata && pemakaian !== null && rata > 0 ? r2(pemakaian / rata) : null;
    out.push({
      id: c.id,
      periode: jenis === "listrik" ? c.tanggal.slice(0, 7) : c.tanggal,
      nilai: Number(c.nilai),
      pemakaian,
      rata_rata: rata === null ? null : r2(rata),
      rasio,
      lonjakan: rasio !== null && rasio > LONJAKAN.rasio,
    });
  });
  return out;
}

/** Ringkasan lonjakan untuk banner/beranda. ekstra_rp = kelebihan dibanding rata-rata. */
export function ringkasLonjakan(jenis: Jenis, t: Titik, tarifAir: number | null) {
  const lebih = (t.pemakaian ?? 0) - (t.rata_rata ?? 0);
  return {
    catatan_id: t.id,
    jenis,
    periode: t.periode,
    pemakaian: t.pemakaian,
    rata_rata: t.rata_rata,
    rasio: t.rasio,
    satuan: jenis === "listrik" ? "rp" : "m3",
    ekstra_rp: Math.max(0, Math.round(jenis === "listrik" ? lebih : lebih * (tarifAir ?? 0))),
  };
}

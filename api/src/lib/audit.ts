// Bentuk respons Audit & Misi (docs/API.md). Dipakai POST /api/ai/audit, GET /api/audit/terbaru, /api/misi.
import { rows } from "../db.js";
import type { KebiasaanAir } from "../hitung.js";

export type AlatData = { id: number; nama: string; jumlah: number; jam_per_hari: number; hari_per_minggu: number; watt: number; jam_wajar: number | null };
export type RumahData = { id: number; penghuni: number; daya_va: number; jenis_listrik: string; tarif_listrik: number; tarif_air: number | null };

const parseJson = <T>(v: unknown): T => (typeof v === "string" ? JSON.parse(v) : v) as T;

/** Profil + alat (dengan jam_wajar preset) + kebiasaan air milik user. */
export async function dataRumah(userId: number) {
  const [rumah] = await rows<RumahData>("SELECT id, penghuni, daya_va, jenis_listrik, tarif_listrik, tarif_air FROM rumah WHERE user_id = ?", [userId]);
  if (!rumah) return null;
  const alat = await rows<AlatData>(
    "SELECT a.id, a.nama, a.jumlah, a.jam_per_hari, a.hari_per_minggu, a.watt, p.jam_wajar FROM rumah_alat a LEFT JOIN alat_preset p ON p.id = a.preset_id WHERE a.rumah_id = ? ORDER BY a.id",
    [rumah.id],
  );
  const [air] = await rows<Omit<KebiasaanAir, "cuci_pakai_mesin"> & { cuci_pakai_mesin: number }>(
    "SELECT mandi_per_hari, cara_mandi, cuci_baju_per_minggu, cuci_pakai_mesin, siram_tanaman_per_minggu, cuci_kendaraan_per_minggu FROM kebiasaan_air WHERE rumah_id = ?",
    [rumah.id],
  );
  return { rumah, alat, air: air ? ({ ...air, cuci_pakai_mesin: !!air.cuci_pakai_mesin } as KebiasaanAir) : null };
}

type AuditRow = { id: number; skor: number; kwh_bulan: number; rp_listrik: number; m3_bulan: number; rp_air: number; rincian_json: unknown; ai_json: unknown; created_at: string };

export function auditRespons(a: AuditRow) {
  const rincian = parseJson<{ rincian_alat: unknown[]; rincian_air: unknown[] }>(a.rincian_json);
  const ai = parseJson<{ ringkasan: string; biang_boros: unknown[] }>(a.ai_json);
  return {
    id: a.id,
    dibuat: a.created_at,
    skor: a.skor,
    listrik: { kwh_bulan: Number(a.kwh_bulan), rp_bulan: a.rp_listrik },
    air: { m3_bulan: Number(a.m3_bulan), rp_bulan: a.rp_air },
    rincian_alat: rincian.rincian_alat,
    rincian_air: rincian.rincian_air,
    biang_boros: ai.biang_boros,
    ringkasan: ai.ringkasan,
  };
}

export async function auditTerbaru(rumahId: number) {
  const [a] = await rows<AuditRow>("SELECT * FROM audit WHERE rumah_id = ? ORDER BY id DESC LIMIT 1", [rumahId]);
  return a ? auditRespons(a) : null;
}

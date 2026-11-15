// Rencana hemat. Kontrak: docs/API.md § Rencana hemat.
import { Router } from "express";
import { z } from "zod";
import { exec, rows } from "../db.js";
import { wajibLogin } from "../lib/auth.js";
import { parse, tidakDitemukan } from "../lib/http.js";
import { rumahIdUser } from "./rumah.js";

const r = Router();
r.use(wajibLogin);

type MisiRow = { id: number; audit_id: number; urutan: number; judul: string; deskripsi: string; target_tipe: "alat" | "air"; target_ref: string; nilai_lama: number; nilai_baru: number; hemat_rp: number; selesai: number };

const LABEL: Record<string, string> = { jam_per_hari: "jam/hari", hari_per_minggu: "hari/minggu", jumlah: "unit", watt: "watt", mandi_per_hari: "kali/hari" };

async function daftar(rumahId: number) {
  const m = await rows<MisiRow & { nama_alat: string | null }>(
    `SELECT m.*, a.nama AS nama_alat FROM misi m LEFT JOIN rumah_alat a ON m.target_tipe = 'alat' AND a.id = SUBSTRING_INDEX(m.target_ref, ':', 1)
      WHERE m.rumah_id = ? ORDER BY m.urutan`,
    [rumahId],
  );
  const misi = m.map((x) => {
    const angka = (n: number) => Number(n).toLocaleString("id-ID");
    const subjek = x.target_tipe === "alat" ? x.nama_alat ?? "Alat" : ({ mandi_per_hari: "Mandi", cuci_baju_per_minggu: "Cuci baju", siram_tanaman_per_minggu: "Siram tanaman", cuci_kendaraan_per_minggu: "Cuci kendaraan" } as Record<string, string>)[x.target_ref] ?? x.target_ref;
    const field = x.target_tipe === "alat" ? x.target_ref.split(":")[1] ?? "" : x.target_ref;
    const satuan = LABEL[field] ?? "kali/minggu";
    return {
      id: x.id,
      urutan: x.urutan,
      judul: x.judul,
      deskripsi: x.deskripsi,
      perubahan: `${subjek} ${angka(x.nilai_lama)} → ${angka(x.nilai_baru)}${satuan ? ` ${satuan}` : ""}`.trim(),
      hemat_rp: x.hemat_rp,
      selesai: !!x.selesai,
    };
  });
  const total_dicentang_rp = misi.filter((x) => x.selesai).reduce((t, x) => t + x.hemat_rp, 0);
  const total_potensi_rp = misi.reduce((t, x) => t + x.hemat_rp, 0);

  // Progres: rata-rata listrik 3 bulan sebelum audit vs catatan listrik terakhir sesudah audit.
  const [a] = await rows<{ created_at: string }>("SELECT created_at FROM audit WHERE rumah_id = ? ORDER BY id DESC LIMIT 1", [rumahId]);
  let progres = { listrik_sebelum_rp: null as number | null, listrik_terakhir_rp: null as number | null };
  if (a) {
    const bulanAudit = a.created_at.slice(0, 7);
    const sebelum = await rows<{ nilai: number }>(
      "SELECT nilai FROM catatan_pemakaian WHERE rumah_id = ? AND jenis = 'listrik' AND tanggal < ? ORDER BY tanggal DESC LIMIT 3",
      [rumahId, `${bulanAudit}-01`],
    );
    const [sesudah] = await rows<{ nilai: number }>(
      "SELECT nilai FROM catatan_pemakaian WHERE rumah_id = ? AND jenis = 'listrik' AND tanggal > ? ORDER BY tanggal DESC LIMIT 1",
      [rumahId, `${bulanAudit}-01`],
    );
    progres = {
      listrik_sebelum_rp: sebelum.length ? Math.round(sebelum.reduce((t, x) => t + Number(x.nilai), 0) / sebelum.length) : null,
      listrik_terakhir_rp: sesudah ? Number(sesudah.nilai) : null,
    };
  }
  return { misi, total_dicentang_rp, total_potensi_rp, progres };
}

r.get("/", async (req, res) => {
  const rumahId = await rumahIdUser(req.userId);
  if (!rumahId) return res.json({ misi: [], total_dicentang_rp: 0, total_potensi_rp: 0, progres: { listrik_sebelum_rp: null, listrik_terakhir_rp: null } });
  res.json(await daftar(rumahId));
});

r.patch("/:id", async (req, res) => {
  const id = parse(z.coerce.number().int().positive(), req.params.id);
  const { selesai } = parse(z.object({ selesai: z.boolean({ error: "selesai harus true/false." }) }), req.body);
  const rumahId = await rumahIdUser(req.userId);
  const up = await exec("UPDATE misi SET selesai = ?, selesai_at = IF(?, NOW(), NULL) WHERE id = ? AND rumah_id = ?", [selesai, selesai, id, rumahId ?? 0]);
  if (!up.affectedRows) throw tidakDitemukan("Misi tidak ditemukan.");
  const d = await daftar(rumahId!);
  res.json({ misi: d.misi.find((x) => x.id === id), total_dicentang_rp: d.total_dicentang_rp });
});

export default r;

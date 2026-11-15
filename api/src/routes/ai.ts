// Endpoint AI. Kontrak: docs/API.md § AI. Skema output AI: docs/AI.md.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { exec, rows, tx } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { wajibLogin } from "../lib/auth.js";
import { chatJson } from "../ai/client.js";
import { POLA_NAMA_ALAT, teksAman } from "../ai/aman.js";
import { PROMPT_AUDIT, PROMPT_CERITA, PROMPT_LONJAKAN } from "../ai/prompts.js";
import { dataLonjakan, responsLonjakan } from "./lonjakan.js";
import { catatanRumah, seri } from "../lib/pemakaian.js";
import { auditTerbaru, dataRumah } from "../lib/audit.js";
import { biayaBulan, hitungRumah, type KebiasaanAir } from "../hitung.js";

const r = Router();
r.use(wajibLogin);

// Lindungi kuota AI (situs publik): per akun 8 panggilan/menit dan 120/hari.
const pesanBatas = (_req: unknown, _res: unknown, next: (e: unknown) => void) =>
  next(new HttpError(429, "BATAS_AI", "Terlalu sering memanggil AI. Tunggu sebentar lalu coba lagi."));
r.use(rateLimit({ windowMs: 60_000, limit: 8, keyGenerator: (req) => `u${req.userId}`, handler: pesanBatas, standardHeaders: "draft-7", legacyHeaders: false }));
r.use(rateLimit({ windowMs: 24 * 3600_000, limit: 120, keyGenerator: (req) => `u${req.userId}`, handler: pesanBatas, standardHeaders: false, legacyHeaders: false }));

/** Bersihkan teks pengguna sebelum dikirim ke AI: buang karakter kontrol & tag pembatas. */
const bersihkan = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/<\/?\s*cerita\s*>/gi, "").trim();

// ---- POST /api/ai/cerita : cerita bebas -> isian form (TIDAK menyimpan) ----

const angkaLonggar = z.coerce.number().catch(NaN);
const aiCeritaSchema = z.object({
  alat: z
    .array(
      z.object({
        preset: z.string().nullable().catch(null),
        nama: z.string().min(1),
        jumlah: angkaLonggar,
        jam_per_hari: angkaLonggar,
        hari_per_minggu: angkaLonggar,
        watt: z.coerce.number().nullable().catch(null),
        perkiraan: z.array(z.string()).catch([]),
      }),
    )
    .max(50),
  kebiasaan_air: z
    .object({
      mandi_per_hari: angkaLonggar,
      cara_mandi: z.enum(["gayung", "shower"]).catch("gayung"),
      cuci_baju_per_minggu: angkaLonggar,
      cuci_pakai_mesin: z.boolean().catch(true),
      siram_tanaman_per_minggu: angkaLonggar,
      cuci_kendaraan_per_minggu: angkaLonggar,
      perkiraan: z.array(z.string()).catch([]),
    })
    .partial()
    .catch({}),
  catatan: z.array(z.string()).catch([]),
});

const clamp = (v: number, min: number, max: number, def: number, bulat = true) => {
  if (!Number.isFinite(v)) return def;
  const x = Math.min(max, Math.max(min, v));
  return bulat ? Math.round(x) : Math.round(x * 10) / 10;
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
// Sebagian model (Gemini) menyalin baris daftar preset lengkap: "TV LED (±55 W)". Buang akhiran watt itu,
// kalau tidak "±" membuat nama ditolak POLA_NAMA_ALAT dan alatnya terbuang.
const buangWatt = (s: string) => s.replace(/\s*\(\s*±?\s*[\d.,]+\s*W\s*\)\s*$/i, "").trim();

r.post("/cerita", async (req, res) => {
  const { cerita } = parse(
    z.object({ cerita: z.string().trim().min(10, "Ceritanya terlalu pendek, tambahkan alat dan kebiasaan di rumah.").max(1000, "Maksimal 1.000 huruf.") }),
    req.body,
  );
  const preset = await rows<{ id: number; nama: string; watt: number }>("SELECT id, nama, watt FROM alat_preset ORDER BY id");
  const daftar = preset.map((p) => `- ${p.nama} (±${p.watt} W)`).join("\n");

  const ai = await chatJson({
    system: PROMPT_CERITA(daftar),
    user: `<cerita>\n${bersihkan(cerita)}\n</cerita>`,
    schema: aiCeritaSchema,
    maxTokens: 8000,
  });

  // Cocokkan ke preset (persis, lalu longgar), isi watt, batasi angka ke rentang valid.
  const kolom_perkiraan: string[] = [];
  const catatan = ai.catatan.map((c) => teksAman(c, 160)).filter((c): c is string => !!c).slice(0, 3);
  const alatAi = ai.alat.map((a) => ({ ...a, nama: buangWatt(a.nama), preset: a.preset ? buangWatt(a.preset) : a.preset }));
  const alatAman = alatAi.filter((a) => (teksAman(a.nama, 60) ?? "").length > 0 && POLA_NAMA_ALAT.test(a.nama.trim()));
  if (alatAman.length < alatAi.length) catatan.push("Ada isian yang tidak dikenali sebagai alat, jadi tidak dipakai.");
  const alat = alatAman.map((a, i) => {
    const p =
      preset.find((x) => a.preset && norm(x.nama) === norm(a.preset)) ??
      preset.find((x) => a.preset && (norm(x.nama).includes(norm(a.preset)) || norm(a.preset).includes(norm(x.nama))));
    const watt = a.watt && a.watt > 0 ? clamp(a.watt, 1, 5000, 0) : p?.watt ?? null;
    if (!p && watt === null && !catatan.some((c) => c.toLowerCase().includes(a.nama.toLowerCase()))) catatan.push(`Watt ${a.nama} belum diketahui, isi sendiri ya.`);
    for (const f of a.perkiraan) if (["jumlah", "jam_per_hari", "hari_per_minggu", "watt"].includes(f)) kolom_perkiraan.push(`alat.${i}.${f}`);
    return {
      preset_id: p?.id ?? null,
      nama: a.nama.trim().slice(0, 60),
      jumlah: clamp(a.jumlah, 1, 50, 1),
      jam_per_hari: clamp(a.jam_per_hari, 0, 24, 8, false),
      hari_per_minggu: clamp(a.hari_per_minggu, 1, 7, 7),
      watt,
      dari_ai: true,
    };
  });

  const k = ai.kebiasaan_air;
  const kebiasaan_air = {
    mandi_per_hari: clamp(k.mandi_per_hari ?? NaN, 0, 10, 2),
    cara_mandi: k.cara_mandi ?? "gayung",
    cuci_baju_per_minggu: clamp(k.cuci_baju_per_minggu ?? NaN, 0, 21, 3),
    cuci_pakai_mesin: k.cuci_pakai_mesin ?? true,
    siram_tanaman_per_minggu: clamp(k.siram_tanaman_per_minggu ?? NaN, 0, 14, 0),
    cuci_kendaraan_per_minggu: clamp(k.cuci_kendaraan_per_minggu ?? NaN, 0, 14, 0),
  };
  for (const f of k.perkiraan ?? []) if (f in kebiasaan_air) kolom_perkiraan.push(`kebiasaan_air.${f}`);

  res.json({ alat, kebiasaan_air, kolom_perkiraan: [...new Set(kolom_perkiraan)], catatan });
});

// ---- POST /api/ai/audit : hitung (backend) + tafsir (AI) -> simpan audit + ganti misi ----

const aiAuditSchema = z.object({
  ringkasan: z.string().catch(""),
  biang_boros: z.array(z.object({ ref: z.string().catch(""), judul: z.string().min(1), alasan: z.string().catch("") })).min(1).max(5),
  misi: z
    .array(
      z.object({
        judul: z.string().min(1),
        deskripsi: z.string().catch(""),
        target: z.object({ tipe: z.enum(["alat", "air"]), ref: z.coerce.string(), field: z.string().optional(), nilai_baru: z.coerce.number() }),
      }),
    )
    .min(1)
    .max(8),
});

const LABEL_ALAT: Record<string, { label: string; min: number; max: number }> = {
  jam_per_hari: { label: "jam/hari", min: 0, max: 24 },
  hari_per_minggu: { label: "hari/minggu", min: 1, max: 7 },
  jumlah: { label: "unit", min: 1, max: 50 },
  watt: { label: "watt", min: 1, max: 5000 },
};
const LABEL_AIR: Record<string, { nama: string; label: string }> = {
  mandi_per_hari: { nama: "Mandi", label: "kali/hari" },
  cuci_baju_per_minggu: { nama: "Cuci baju", label: "kali/minggu" },
  siram_tanaman_per_minggu: { nama: "Siram tanaman", label: "kali/minggu" },
  cuci_kendaraan_per_minggu: { nama: "Cuci kendaraan", label: "kali/minggu" },
};
const fmtAngka = (n: number) => Number(n).toLocaleString("id-ID");

r.post("/audit", async (req, res) => {
  const d = await dataRumah(req.userId);
  if (!d) throw new HttpError(400, "VALIDASI", "Isi profil rumah dulu.");
  if (!d.alat.length) throw new HttpError(400, "VALIDASI", "Tambahkan minimal satu alat di Data Rumah dulu.");
  const { rumah, alat, air } = d;
  const h = hitungRumah(rumah, alat, air);

  // Data untuk AI: angka sudah dihitung backend. AI cuma menafsirkan.
  const dataAi = {
    penghuni: rumah.penghuni,
    daya_va: rumah.daya_va,
    jenis_listrik: rumah.jenis_listrik,
    alat: alat.map((a) => {
      const x = h.rincian_alat.find((y) => y.alat_id === a.id);
      return { id: a.id, nama: a.nama, jumlah: a.jumlah, jam_per_hari: a.jam_per_hari, hari_per_minggu: a.hari_per_minggu, watt: a.watt, jam_wajar: a.jam_wajar, persen_biaya_listrik: x?.persen ?? 0 };
    }),
    kebiasaan_air: air,
    air_per_kegiatan_m3_bulan: Object.fromEntries(h.rincian_air.map((x) => [x.kegiatan, x.m3_bulan])),
    liter_per_orang_per_hari: h.berlebih.liter_orang_hari,
  };
  const ai = await chatJson({ system: PROMPT_AUDIT, user: JSON.stringify(dataAi), schema: aiAuditSchema, maxTokens: 8000 });

  // Biang boros: rapikan ref + tempel angka biaya dari backend.
  const biang_boros = ai.biang_boros.filter((b) => teksAman(b.judul, 80)).slice(0, 3).map((b) => {
    const [jenis, id] = b.ref.split(":");
    const rAlat = jenis === "alat" ? h.rincian_alat.find((x) => String(x.alat_id) === id) : undefined;
    const rAir = jenis === "air" ? h.rincian_air.find((x) => x.kegiatan === id) : undefined;
    return {
      ref: rAlat || rAir ? b.ref : null,
      judul: teksAman(b.judul, 80)!,
      alasan: teksAman(b.alasan, 300) ?? "",
      rp_bulan: rAlat?.rp_bulan ?? rAir?.rp_bulan ?? null,
      persen_listrik: rAlat?.persen ?? null,
    };
  });

  // Misi: validasi target, hitung hemat Rp dari rumus (bukan dari AI), buang yang tidak menghemat.
  const awal = biayaBulan(rumah, alat, air);
  const totalAwal = awal.rp_listrik + awal.rp_air;
  const misi: { judul: string; deskripsi: string; target_tipe: "alat" | "air"; target_ref: string; nilai_lama: number; nilai_baru: number; hemat_rp: number; perubahan: string }[] = [];
  for (const m0 of ai.misi) {
    const judul = teksAman(m0.judul, 120);
    if (!judul) continue; // judul berisi kode / bukan kalimat: buang misinya
    const m = { ...m0, judul, deskripsi: teksAman(m0.deskripsi, 300) ?? "" };
    // AI kadang meniru format ref biang boros ("alat:105"): buang awalannya.
    const t = { ...m.target, ref: String(m.target.ref).replace(/^(alat|air):/, "") };
    if (t.tipe === "alat") {
      const a = alat.find((x) => String(x.id) === t.ref);
      const f = t.field && LABEL_ALAT[t.field] ? (t.field as keyof typeof LABEL_ALAT) : null;
      if (!a || !f) continue;
      const lama = Number(a[f as keyof typeof a]);
      const baru = Math.min(LABEL_ALAT[f].max, Math.max(LABEL_ALAT[f].min, Math.round(t.nilai_baru * 10) / 10));
      if (!(baru < lama)) continue;
      const b = biayaBulan(rumah, alat.map((x) => (x.id === a.id ? { ...x, [f]: baru } : x)), air);
      misi.push({ judul: m.judul, deskripsi: m.deskripsi, target_tipe: "alat", target_ref: `${a.id}:${f}`, nilai_lama: lama, nilai_baru: baru,
        hemat_rp: Math.round(totalAwal - b.rp_listrik - b.rp_air), perubahan: `${a.nama} ${fmtAngka(lama)} → ${fmtAngka(baru)} ${LABEL_ALAT[f].label}` });
    } else {
      if (!air || !(t.ref in LABEL_AIR)) continue;
      const f = t.ref as keyof KebiasaanAir;
      const lama = Number(air[f]);
      const baru = Math.max(0, Math.round(t.nilai_baru));
      if (!(baru < lama)) continue;
      const b = biayaBulan(rumah, alat, { ...air, [f]: baru });
      misi.push({ judul: m.judul, deskripsi: m.deskripsi, target_tipe: "air", target_ref: t.ref, nilai_lama: lama, nilai_baru: baru,
        hemat_rp: Math.round(totalAwal - b.rp_listrik - b.rp_air), perubahan: `${LABEL_AIR[t.ref].nama} ${lama} → ${baru} ${LABEL_AIR[t.ref].label}` });
    }
  }
  // Satu misi per target (ambil yang paling hemat), buang yang hematnya < Rp500, urutkan.
  const unik = new Map<string, (typeof misi)[number]>();
  for (const m of misi) {
    const k = `${m.target_tipe}:${m.target_ref}`;
    if (m.hemat_rp >= 500 && (!unik.has(k) || unik.get(k)!.hemat_rp < m.hemat_rp)) unik.set(k, m);
  }
  const misiFinal = [...unik.values()].sort((x, y) => y.hemat_rp - x.hemat_rp).slice(0, 6);

  const rincian = { rincian_alat: h.rincian_alat, rincian_air: h.rincian_air };
  const auditId = await tx(async (c) => {
    const ins = await exec(
      "INSERT INTO audit (rumah_id, skor, kwh_bulan, rp_listrik, m3_bulan, rp_air, rincian_json, ai_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [rumah.id, h.skor, h.listrik.kwh_bulan, h.listrik.rp_bulan, h.air.m3_bulan, h.air.rp_bulan, JSON.stringify(rincian), JSON.stringify({ ringkasan: teksAman(ai.ringkasan, 220) ?? "", biang_boros })],
      c,
    );
    await exec("DELETE FROM misi WHERE rumah_id = ?", [rumah.id], c); // audit baru -> rencana baru
    for (const [i, m] of misiFinal.entries()) {
      await exec(
        "INSERT INTO misi (audit_id, rumah_id, urutan, judul, deskripsi, target_tipe, target_ref, nilai_lama, nilai_baru, hemat_rp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [ins.insertId, rumah.id, i + 1, m.judul.slice(0, 120), m.deskripsi.slice(0, 300), m.target_tipe, m.target_ref, m.nilai_lama, m.nilai_baru, m.hemat_rp],
        c,
      );
    }
    return ins.insertId;
  });
  console.log(`[audit] rumah ${rumah.id} audit ${auditId}: skor ${h.skor}, ${misiFinal.length}/${ai.misi.length} misi dipakai`);
  res.json(await auditTerbaru(rumah.id));
});

// ---- POST /api/ai/lonjakan : penjelasan penyebab + langkah cek (disimpan, AI cukup sekali per lonjakan) ----

const aiLonjakanSchema = z.object({
  kemungkinan_penyebab: z.array(z.object({ judul: z.string().min(1), alasan: z.string().catch("") })).min(1).max(5),
  langkah_cek: z.array(z.string().min(1)).min(2).max(8),
  kapan_panggil_tukang: z.string().catch(""),
});

r.post("/lonjakan", async (req, res) => {
  const { catatan_id } = parse(z.object({ catatan_id: z.coerce.number({ error: "catatan_id tidak valid." }).int().positive() }), req.body);
  const lj = await dataLonjakan(req.userId, catatan_id); // cek kepemilikan + memang lonjakan (404 kalau bukan)

  const [ada] = await rows<{ ai_json: unknown }>("SELECT ai_json FROM lonjakan WHERE catatan_id = ? AND ai_json IS NOT NULL", [catatan_id]);
  if (ada) return res.json(await responsLonjakan(req.userId, catatan_id)); // sudah pernah dijelaskan: tanpa panggil AI

  const d = await dataRumah(req.userId);
  const riwayat = seri(lj.jenis, await catatanRumah(lj.rumahId, lj.jenis))
    .filter((t) => t.pemakaian !== null)
    .slice(-6)
    .map((t) => ({ periode: t.periode, pemakaian: t.pemakaian }));
  const dataAi = {
    jenis: lj.jenis,
    satuan: lj.jenis === "listrik" ? "Rupiah per bulan" : "m³ per minggu",
    periode: lj.titik.periode,
    pemakaian: lj.titik.pemakaian,
    rata_rata_sebelumnya: lj.titik.rata_rata,
    rasio: lj.titik.rasio,
    riwayat,
    rumah: d && {
      penghuni: d.rumah.penghuni,
      jenis_listrik: d.rumah.jenis_listrik,
      alat: d.alat.map((a) => ({ nama: a.nama, jumlah: a.jumlah, jam_per_hari: a.jam_per_hari, hari_per_minggu: a.hari_per_minggu })),
      kebiasaan_air: d.air,
    },
  };
  const ai = await chatJson({ system: PROMPT_LONJAKAN, user: JSON.stringify(dataAi), schema: aiLonjakanSchema, maxTokens: 8000 });
  const simpan = {
    kemungkinan_penyebab: ai.kemungkinan_penyebab
      .map((p) => ({ judul: teksAman(p.judul, 80), alasan: teksAman(p.alasan, 260) ?? "" }))
      .filter((p): p is { judul: string; alasan: string } => !!p.judul)
      .slice(0, 4),
    langkah_cek: ai.langkah_cek.map((l) => teksAman(l, 200)).filter((l): l is string => !!l).slice(0, 6),
    kapan_panggil_tukang: teksAman(ai.kapan_panggil_tukang, 260) ?? "",
  };
  if (!simpan.kemungkinan_penyebab.length || simpan.langkah_cek.length < 2) throw new HttpError(502, "AI_GAGAL", "AI memberi jawaban yang tidak bisa dipakai. Coba lagi.");
  await exec(
    "INSERT INTO lonjakan (catatan_id, rasio, ai_json, langkah_selesai) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rasio = VALUES(rasio), ai_json = VALUES(ai_json), langkah_selesai = VALUES(langkah_selesai)",
    [catatan_id, lj.titik.rasio, JSON.stringify(simpan), JSON.stringify(simpan.langkah_cek.map(() => false))],
  );
  res.json(await responsLonjakan(req.userId, catatan_id));
});

export default r;

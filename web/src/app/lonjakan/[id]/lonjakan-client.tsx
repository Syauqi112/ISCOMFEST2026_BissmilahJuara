"use client";

import Link from "next/link";
import { IlustrasiBeres } from "@/components/ilustrasi";
import { rayakan } from "@/lib/rayakan";
import { useCallback, useEffect, useState } from "react";
import { Droplet, Droplets, Toilet, Waves, Wrench, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell, PageHead } from "@/components/app-shell";
import { AiLoading, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api, ApiError } from "@/lib/api";
import { pesanError } from "@/lib/use-api";
import { angka, rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lonjakan } from "@/lib/types";

const REDUP = "text-[#5a6782]";
const PUDAR = "text-[#8a98b0]";
const KARTU = "rounded-[24px] border border-[#e3e8f0] bg-white";

/**
 * Ikon untuk kemungkinan penyebab. Ini bukan nama alat, jadi ikonAlat tidak
 * cocok (semua akan jatuh ke colokan). Dipetakan sendiri per kata kunci.
 */
function ikonPenyebab(judul: string): LucideIcon {
  const j = judul.toLowerCase();
  if (/kloset|toilet|tangki/.test(j)) return Toilet;
  if (/keran|tetes|pipa/.test(j)) return Droplets;
  if (/toren|tandon|pompa|pelampung/.test(j)) return Waves;
  return Droplet;
}

export function LonjakanClient({ id }: { id: string }) {
  const [ai, setAi] = useState<Lonjakan | null>(null);
  const [errAi, setErrAi] = useState<ApiError | null>(null);
  const [percobaan, setPercobaan] = useState(0);
  const [langkah, setLangkah] = useState<boolean[] | null>(null);

  // Endpoint ini POST (memanggil AI), jadi tidak lewat useApi yang memakai GET.
  // setState hanya terjadi setelah `await`, jadi aman dipanggil dari effect.
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const hasil = await api<Lonjakan>("/ai/lonjakan", { method: "POST", json: { catatan_id: Number(id) } });
        if (batal) return;
        setAi(hasil);
        setLangkah(hasil.langkah_cek.map((l) => l.selesai));
      } catch (e) {
        if (batal) return;
        setErrAi(e instanceof ApiError ? e : new ApiError("AI_GAGAL", "Penjelasan belum bisa dimuat. Coba lagi.", 0));
        setAi(null);
      }
    })();
    return () => {
      batal = true;
    };
  }, [id, percobaan]);

  const coba = useCallback(() => {
    setAi(null);
    setErrAi(null);
    setLangkah(null);
    setPercobaan((p) => p + 1);
  }, []);

  // Belum ada hasil dan belum ada error = masih memuat.
  const sedangAi = ai === null && errAi === null;

  async function toggleLangkah(i: number, selesai: boolean) {
    if (!ai || !langkah) return;
    const baru = langkah.map((v, j) => (j === i ? selesai : v));
    setLangkah(baru);
    if (selesai && baru.every(Boolean)) void rayakan();
    try {
      await api(`/lonjakan/${ai.catatan_id}/langkah`, { method: "PATCH", json: { index: i, selesai } });
    } catch {
      // Gagal simpan: kembalikan centang supaya tidak terlihat tersimpan padahal tidak.
      setLangkah((l) => (l ? l.map((v, j) => (j === i ? !selesai : v)) : l));
    }
  }

  const air = ai?.jenis === "air";
  const satuan = air ? "m³" : "";
  const jumlahSelesai = ai ? ai.langkah_cek.filter((l, i) => langkah?.[i] ?? l.selesai).length : 0;

  return (
    <AppShell>
      <PageHead
        kembali={{ href: "/lonjakan", label: "Semua lonjakan" }}
        judul={ai ? `Pemakaian ${air ? "air" : "listrik"} naik ${angka(ai.rasio)}×` : "Detail lonjakan"}
        keterangan={ai ? `Periode ${tanggal(ai.periode)}` : "AI membandingkan pemakaianmu dengan periode sebelumnya."}
      />

      {sedangAi && (
        <AiLoading
          judul="AI sedang menganalisis..."
          keterangan="AI membandingkan pemakaianmu dengan periode sebelumnya. Biasanya 5–20 detik."
        />
      )}

      {errAi && !sedangAi && (
        <ErrorState
          judul="Penjelasan belum bisa dimuat"
          pesan={pesanError(errAi)}
          onRetry={coba}
          aksiTambahan={
            <Button variant="ghost" nativeButton={false} render={<Link href="/beranda" />}>
              Kembali
            </Button>
          }
        />
      )}

      {ai && !sedangAi && (
        <div className="flex flex-col gap-4 md:gap-5">
          {/* ===== Satu perbandingan: periode ini vs biasanya, plus biaya lebih ===== */}
          <section className={cn(KARTU, "grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:p-7")}>
            <div className="min-w-0">
              <p className={cn("text-[15px] font-semibold", REDUP)}>
                {air ? "Minggu ini" : "Bulan ini"} dibanding biasanya
              </p>
              <div className="mt-4 flex flex-col gap-3.5">
                <BarisBanding
                  label={air ? "Minggu ini" : "Bulan ini"}
                  nilai={`${angka(ai.pemakaian)} ${satuan}`}
                  lebar={100}
                  warna="bg-warn"
                  tebal
                />
                <BarisBanding
                  label="Biasanya"
                  nilai={`±${angka(ai.rata_rata)} ${satuan}`}
                  lebar={ai.pemakaian > 0 ? Math.min(100, (ai.rata_rata / ai.pemakaian) * 100) : 0}
                  warna="bg-[#c7d0de]"
                />
              </div>
            </div>
            <div className="border-t border-[#eef2f8] pt-5 md:min-w-[220px] md:border-t-0 md:border-l md:pt-0 md:pl-10">
              <p className={cn("text-[15px] font-semibold", REDUP)}>Biaya lebih dari biasanya</p>
              <p className="tabular mt-2 text-[32px] leading-none font-extrabold tracking-tight text-warn">{rupiah(ai.ekstra_rp)}</p>
              <p className={cn("mt-2 text-[14px]", PUDAR)}>kalau pemakaian tetap setinggi ini</p>
            </div>
          </section>

          <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {/* ===== Langkah cek: yang perlu dilakukan ===== */}
            <section className={cn(KARTU, "px-5 pt-5 pb-3 md:px-7 md:pt-6")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-[19px] font-bold tracking-tight">Coba cek ini dulu</h2>
                {ai.langkah_cek.length > 0 && (
                  <p className={cn("text-[14.5px]", REDUP)}>
                    {jumlahSelesai} dari {ai.langkah_cek.length} sudah dicek
                  </p>
                )}
              </div>
              <p className={cn("mt-1 text-[14.5px]", REDUP)}>Centang tiap langkah yang sudah kamu lakukan.</p>

              {ai.langkah_cek.length > 0 && jumlahSelesai === ai.langkah_cek.length && (
                <div className="mt-4 flex animate-in flex-col items-center rounded-2xl bg-[#f4f6fa] px-4 pt-2 pb-5 text-center duration-500 fade-in zoom-in-95 sm:flex-row sm:gap-4 sm:text-left">
                  <IlustrasiBeres className="max-w-[150px] shrink-0" />
                  <div>
                    <p className="text-[17px] font-bold text-primary">Mantap, semua sudah dicek</p>
                    <p className={cn("text-[14.5px]", REDUP)}>Catat lagi meteran minggu depan untuk melihat apakah pemakaian sudah kembali normal.</p>
                  </div>
                </div>
              )}

              {ai.langkah_cek.length === 0 ? (
                <p className={cn("py-6 text-[15px]", REDUP)}>Belum ada langkah yang disarankan.</p>
              ) : (
                <ol className="mt-3">
                  {ai.langkah_cek.map((l, i) => {
                    const selesai = langkah?.[i] ?? l.selesai;
                    return (
                      <li key={l.teks} className="border-b border-[#eef2f8] last:border-0">
                        <label className="grid cursor-pointer grid-cols-[22px_minmax(0,1fr)] items-start gap-3.5 py-4">
                          <Checkbox
                            checked={selesai}
                            onCheckedChange={(v) => toggleLangkah(i, !!v)}
                            className="mt-0.5 size-[22px] rounded-[7px]"
                            aria-label={l.teks}
                          />
                          <span className={cn("text-[16px] leading-snug", selesai ? "text-[#8a98b0] line-through decoration-[#c7d0de]" : "font-medium")}>
                            {l.teks}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              )}

              {ai.kapan_panggil_tukang && (
                <div className="mt-1 mb-2 flex items-start gap-3 rounded-2xl bg-[#f4f6fa] p-4">
                  <Wrench className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
                  <p className={cn("text-[14.5px] leading-snug", REDUP)}>
                    <b className="text-foreground">Kapan panggil tukang? </b>
                    {ai.kapan_panggil_tukang}
                  </p>
                </div>
              )}
            </section>

            {/* ===== Kemungkinan penyebab ===== */}
            <section className={cn(KARTU, "p-5 md:p-6")}>
              <h2 className="text-[17px] font-bold">Kemungkinan penyebab</h2>
              <p className={cn("mt-0.5 text-[13.5px]", PUDAR)}>Ditulis AI dari pola pemakaianmu, jadi tetap perlu dicek langsung.</p>

              {ai.kemungkinan_penyebab.length === 0 ? (
                <p className={cn("mt-4 text-[15px]", REDUP)}>AI belum menemukan penyebab yang jelas. Coba catat lagi minggu depan.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[#eef2f8]">
                  {ai.kemungkinan_penyebab.map((p) => {
                    const Icon = air ? ikonPenyebab(p.judul) : Zap;
                    return (
                      <li key={p.judul} className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-3 py-3.5">
                        <span className={cn("grid size-9 place-items-center rounded-[11px]", air ? "bg-air-soft text-air" : "bg-listrik-soft text-listrik-foreground")}>
                          <Icon className="size-[18px]" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15.5px] leading-snug font-bold">{p.judul}</p>
                          <p className={cn("mt-0.5 text-[14px] leading-snug", REDUP)}>{p.alasan}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/** Satu baris perbandingan: label kiri, batang tipis proporsional, nilai kanan. */
function BarisBanding({ label, nilai, lebar, warna, tebal }: { label: string; nilai: string; lebar: number; warna: string; tebal?: boolean }) {
  return (
    <div className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-4">
      <span className={cn("text-[14.5px]", tebal ? "font-semibold text-foreground" : REDUP)}>{label}</span>
      <span className="block h-3 overflow-hidden rounded-full bg-[#f4f6fa]">
        <span className={cn("block h-full rounded-full", warna)} style={{ width: `${Math.max(3, lebar)}%` }} />
      </span>
      <span className={cn("tabular min-w-[64px] text-right", tebal ? "text-[20px] font-extrabold text-foreground" : cn("text-[17px] font-bold", REDUP))}>{nilai}</span>
    </div>
  );
}

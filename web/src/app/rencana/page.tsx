"use client";

import Link from "next/link";
import { KosongAwal } from "@/components/kosong-awal";
import { IlustrasiBeres, IlustrasiCelengan } from "@/components/ilustrasi";
import { rayakan } from "@/lib/rayakan";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AppShell, PageHead } from "@/components/app-shell";
import { ErrorState, Loading } from "@/components/states";
import { ikonAlat, toneAlat } from "@/components/alat-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { api, ApiError } from "@/lib/api";
import { pesanError, useApi } from "@/lib/use-api";
import { rupiah, rupiahRingkas } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Misi, MisiResponse } from "@/lib/types";

const config = { rp: { label: "Tagihan listrik", color: "var(--chart-1)" } } satisfies ChartConfig;

const REDUP = "text-[#5a6782]";
const PUDAR = "text-[#8a98b0]";
const KARTU = "rounded-[24px] border border-[#e3e8f0] bg-white";
const SUMBU = { fontSize: 12.5, fill: "#8a98b0" };

export default function RencanaPage() {
  const { data, error, loading, muat } = useApi<MisiResponse>("/misi");
  const [misi, setMisi] = useState<Misi[] | null>(null);

  // Ambil dari server sekali, lalu dikelola lokal supaya centang terasa instan.
  const daftar = misi ?? data?.misi ?? [];
  const totalDicentang = daftar.filter((m) => m.selesai).reduce((t, m) => t + m.hemat_rp, 0);
  const totalPotensi = daftar.reduce((t, m) => t + m.hemat_rp, 0);
  const jumlahDicentang = daftar.filter((m) => m.selesai).length;
  const hematTerbesar = Math.max(1, ...daftar.map((m) => m.hemat_rp));

  async function toggle(m: Misi, selesai: boolean) {
    setMisi((lama) => (lama ?? data?.misi ?? []).map((x) => (x.id === m.id ? { ...x, selesai } : x)));
    if (selesai && daftar.every((x) => x.id === m.id || x.selesai)) void rayakan();
    try {
      await api(`/misi/${m.id}`, { method: "PATCH", json: { selesai } });
    } catch (e) {
      // Gagal simpan: kembalikan centang supaya angka tidak berbohong.
      setMisi((lama) => (lama ?? data?.misi ?? []).map((x) => (x.id === m.id ? { ...x, selesai: !selesai } : x)));
      toast.error(e instanceof ApiError ? e.pesan : "Centang belum tersimpan. Coba lagi.");
    }
  }

  const terakhir = data?.progres.listrik_terakhir_rp ?? null;
  const sebelum = data?.progres.listrik_sebelum_rp ?? null;
  const adaPembanding = terakhir != null && sebelum != null;
  const grafik = adaPembanding
    ? [
        { label: "Sebelum", rp: sebelum, warna: "#d5dce8" },
        { label: "Sekarang", rp: terakhir, warna: "#f1dca2" },
        { label: "Kalau dijalankan", rp: Math.max(0, terakhir - totalDicentang), warna: "var(--primary)" },
      ]
    : [];
  const persen = totalPotensi > 0 ? Math.round((totalDicentang / totalPotensi) * 100) : 0;

  return (
    <AppShell>
      <PageHead judul="Rencana hemat" keterangan="Disusun dari hasil audit rumahmu, urut dari yang paling menghemat." />

      {loading && !data && <Loading judul="Memuat rencana hemat..." bentuk="daftar" />}
      {error && !data && <ErrorState pesan={pesanError(error)} onRetry={() => muat()} />}

      {data && daftar.length === 0 && (
        <KosongAwal hal="rencana" ilustrasi={<IlustrasiCelengan />} />
      )}

      {data && daftar.length > 0 && (
        <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ===== Daftar misi ===== */}
          <section className={cn(KARTU, "min-w-0 px-5 pt-5 pb-2 md:px-7 md:pt-6")}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-[19px] font-bold tracking-tight">Misi hemat</h2>
              <p className={cn("text-[14.5px]", REDUP)}>
                {jumlahDicentang} dari {daftar.length} misi dicentang
              </p>
            </div>
            <p className={cn("mt-1 text-[14.5px]", REDUP)}>Centang misi yang mau kamu jalankan. Garisnya menunjukkan seberapa besar hematnya.</p>

            {jumlahDicentang === daftar.length && (
              <div className="mt-4 flex animate-in flex-col items-center rounded-2xl bg-[#f4f6fa] px-4 pt-2 pb-5 text-center duration-500 fade-in zoom-in-95 sm:flex-row sm:gap-4 sm:text-left">
                <IlustrasiBeres className="max-w-[150px] shrink-0" />
                <div>
                  <p className="text-[17px] font-bold text-primary">Keren, semua misi kamu jalankan</p>
                  <p className={cn("text-[14.5px]", REDUP)}>
                    Kalau rutin, tagihan bisa turun sekitar <b className="text-foreground">{rupiah(totalDicentang)}</b> per bulan. Catat tagihan bulan depan untuk melihat hasilnya.
                  </p>
                </div>
              </div>
            )}

            <ul className="mt-3">
              {daftar.map((m) => {
                const Icon = ikonAlat(m.perubahan);
                const tone = toneAlat(m.perubahan);
                return (
                  <li key={m.id} className="border-b border-[#eef2f8] last:border-0">
                    <label className="grid cursor-pointer grid-cols-[22px_40px_minmax(0,1fr)] items-start gap-x-3.5 py-4 sm:grid-cols-[22px_40px_minmax(0,1fr)_auto] sm:gap-x-4">
                      <Checkbox
                        checked={m.selesai}
                        onCheckedChange={(v) => toggle(m, !!v)}
                        aria-label={`Tandai dijalankan: ${m.judul}`}
                        className="mt-2.5 size-[22px] rounded-[7px]"
                      />
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-[12px] transition-colors",
                          tone === "air" ? "bg-air-soft text-air" : "bg-listrik-soft text-listrik-foreground",
                          !m.selesai && "opacity-70",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-[16px] leading-snug font-bold", !m.selesai && "text-foreground/85")}>{m.judul}</span>
                        <span className={cn("mt-0.5 block text-[14px] leading-snug", REDUP)}>{m.deskripsi || m.perubahan}</span>
                        <span className="mt-2.5 flex items-center gap-3">
                          <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2f8]">
                            <span
                              className={cn("block h-full rounded-full transition-all", tone === "air" ? "bg-air" : "bg-listrik", !m.selesai && "opacity-35")}
                              style={{ width: `${Math.max(4, (m.hemat_rp / hematTerbesar) * 100)}%` }}
                            />
                          </span>
                          {/* Di HP angka ikut baris garis supaya judul tetap lebar */}
                          <span className={cn("tabular shrink-0 text-[15px] font-extrabold sm:hidden", m.selesai ? "text-primary" : PUDAR)}>
                            {rupiahRingkas(m.hemat_rp)}
                            <span className="text-[12px] font-semibold text-[#8a98b0]">/bln</span>
                          </span>
                        </span>
                      </span>
                      <span className={cn("tabular hidden min-w-[92px] pt-2 text-right text-[17px] font-extrabold sm:block", m.selesai ? "text-primary" : PUDAR)}>
                        {rupiahRingkas(m.hemat_rp)}
                        <span className="text-[12.5px] font-semibold text-[#8a98b0]">/bln</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ===== Ringkasan (menempel saat digulir di desktop) ===== */}
          <div className="flex flex-col gap-4 md:gap-5 lg:sticky lg:top-6">
            <section className={cn(KARTU, "p-5 md:p-6")}>
              <p className={cn("text-[15px] font-semibold", REDUP)}>Hemat per bulan dari misi yang dicentang</p>
              <p className="tabular mt-2 text-[34px] leading-none font-extrabold tracking-tight text-primary">{rupiah(totalDicentang)}</p>
              <p className={cn("mt-2 text-[15px]", REDUP)}>
                {totalDicentang > 0 ? (
                  <>
                    Setahun kira-kira <b className="text-foreground">{rupiah(totalDicentang * 12)}</b>
                  </>
                ) : (
                  "Centang misi di daftar, angkanya langsung dihitung."
                )}
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef2f8]">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${persen}%` }} />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3 text-[14px]">
                <span className={REDUP}>{persen}% dari potensi</span>
                <span className={REDUP}>
                  Potensi <b className="tabular text-foreground">{rupiahRingkas(totalPotensi)}</b>/bln
                </span>
              </div>
            </section>

            <section className={cn(KARTU, "p-5 md:p-6")}>
              <h2 className="text-[17px] font-bold">Tagihan listrik</h2>
              <p className={cn("mt-0.5 text-[14px]", REDUP)}>Per bulan, sebelum dan sesudah misi dijalankan.</p>

              {adaPembanding ? (
                <>
                  <ChartContainer config={config} className="mt-3 h-[200px] w-full">
                    <BarChart data={grafik} margin={{ top: 26, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
                      <CartesianGrid vertical={false} stroke="#eef2f8" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={SUMBU} tickMargin={10} interval={0} />
                      <YAxis hide domain={[0, "dataMax"]} />
                      <ChartTooltip cursor={{ fill: "#f4f6fa", radius: 8 }} content={<ChartTooltipContent hideIndicator formatter={(v) => rupiah(Number(v))} />} />
                      <Bar dataKey="rp" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={44}>
                        {grafik.map((g) => (
                          <Cell key={g.label} fill={g.warna} />
                        ))}
                        {/* label hanya di batang "kalau dijalankan" */}
                        <LabelList
                          dataKey="rp"
                          position="top"
                          content={(p) => {
                            const { x, y, width, index, value } = p as { x: number; y: number; width: number; index: number; value: number };
                            if (index !== grafik.length - 1) return null;
                            return (
                              <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--primary)">
                                {rupiahRingkas(value)}
                              </text>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  <p className={cn("mt-3 text-[13.5px] leading-snug", PUDAR)}>
                    Angka &ldquo;kalau dijalankan&rdquo; dihitung dari tagihan terakhir, jadi makin banyak misi dicentang makin turun.
                  </p>
                </>
              ) : (
                <p className={cn("mt-4 text-[14.5px] leading-relaxed", REDUP)}>
                  Grafiknya muncul setelah ada catatan listrik bulan ini dan bulan lalu. Catat lewat tombol{" "}
                  <Link href="/beranda" className="font-bold text-primary hover:underline">
                    Catat pemakaian
                  </Link>{" "}
                  di Beranda.
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}

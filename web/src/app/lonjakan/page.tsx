"use client";

// Menu Lonjakan: lonjakan yang sedang terjadi + riwayatnya. Data dari endpoint yang
// sudah ada (GET /api/beranda dan GET /api/pemakaian), tidak ada hitungan baru di sini.
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { CatatDialog } from "@/components/catat-dialog";
import { Button } from "@/components/ui/button";
import { IlustrasiCatat, IlustrasiKalender, IlustrasiRumahTenang } from "@/components/ilustrasi";
import { ArrowRight, Droplet, TriangleAlert, Zap } from "lucide-react";
import { AppShell, PageHead } from "@/components/app-shell";
import { ErrorState, Loading } from "@/components/states";
import { pesanError, useApi } from "@/lib/use-api";
import { angka, rupiah, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Beranda, CatatanPemakaian } from "@/lib/types";

const REDUP = "text-[#5a6782]";
const KARTU = "rounded-[24px] border border-[#e3e8f0] bg-white";
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const namaBulan = (periode: string) => `${BULAN[Number(periode.slice(5, 7)) - 1] ?? ""} ${periode.slice(0, 4)}`;

export default function LonjakanPage() {
  const beranda = useApi<Beranda>("/beranda");
  const air = useApi<{ data: CatatanPemakaian[] }>("/pemakaian?jenis=air");
  const listrik = useApi<{ data: CatatanPemakaian[] }>("/pemakaian?jenis=listrik");

  const [catatBuka, setCatatBuka] = useState(false);
  const adaCatatan = (air.data?.data.length ?? 0) + (listrik.data?.data.length ?? 0) > 0;
  function muatUlang() {
    void beranda.muat(true);
    void air.muat(true);
    void listrik.muat(true);
  }

  const aktif = beranda.data?.lonjakan_aktif ?? [];
  const idAktif = new Set(aktif.map((l) => l.catatan_id));
  const riwayat = [
    ...(air.data?.data ?? []).filter((c) => c.lonjakan).map((c) => ({ ...c, jenis: "air" as const })),
    ...(listrik.data?.data ?? []).filter((c) => c.lonjakan).map((c) => ({ ...c, jenis: "listrik" as const })),
  ]
    .filter((c) => !idAktif.has(c.id))
    .sort((a, b) => b.periode.localeCompare(a.periode));

  return (
    <AppShell>
      <PageHead
        judul="Lonjakan"
        keterangan="Pemakaian yang naik jauh dari biasanya, lengkap dengan langkah ceknya."
        aksi={
          <Button onClick={() => setCatatBuka(true)} size="lg" className="h-12 rounded-full px-6 text-[16px]">
            <Plus aria-hidden /> Catat pemakaian
          </Button>
        }
      />

      {beranda.loading && !beranda.data && <Loading judul="Memuat lonjakan..." bentuk="daftar" />}
      {beranda.error && !beranda.data && <ErrorState pesan={pesanError(beranda.error)} onRetry={() => beranda.muat()} />}

      {beranda.data && (
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-5">
            {/* ===== Sedang terjadi ===== */}
            <section className={cn(KARTU, "p-5 md:p-7")}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[19px] font-bold">Sedang terjadi</h2>
                <span className={cn("text-[14px]", REDUP)}>{aktif.length} lonjakan</span>
              </div>

              {aktif.length === 0 ? (
                adaCatatan ? (
                  <div className="flex flex-col items-center py-4 text-center">
                    <IlustrasiRumahTenang className="max-w-[260px]" />
                    <p className="mt-2 text-[18px] font-bold text-primary">Tidak ada lonjakan</p>
                    <p className={cn("max-w-sm text-[15px]", REDUP)}>Pemakaian listrik dan air masih sesuai kebiasaan rumahmu. Tetap catat tiap minggu supaya pantauannya jalan.</p>
                    <Button variant="outline" onClick={() => setCatatBuka(true)} className="mt-4 h-12 rounded-full px-6 text-[16px]">
                      <Plus aria-hidden /> Catat minggu ini
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center">
                    <IlustrasiCatat className="max-w-[240px]" />
                    <p className="mt-2 text-[18px] font-bold text-primary">Belum ada catatan pemakaian</p>
                    <p className={cn("max-w-md text-[15px]", REDUP)}>
                      Lonjakan dideteksi dengan membandingkan catatan terbaru dengan catatan sebelumnya. Mulai dari angka meteran air minggu ini atau tagihan listrik bulan ini.
                    </p>
                    <Button onClick={() => setCatatBuka(true)} className="mt-4 h-12 rounded-full px-6 text-[16px]">
                      <Plus aria-hidden /> Catat pemakaian pertama
                    </Button>
                  </div>
                )
              ) : (
                <ul className="mt-2 divide-y divide-[#eef2f8]">
                  {aktif.map((l) => {
                    const satuan = l.jenis === "air" ? " m³" : "";
                    const maks = Math.max(l.pemakaian, l.rata_rata) || 1;
                    const Ikon = l.jenis === "air" ? Droplet : Zap;
                    return (
                      <li key={l.catatan_id} className="py-6 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className={cn("flex items-center gap-2 text-[14.5px] font-semibold", REDUP)}>
                              <Ikon className={cn("size-4", l.jenis === "air" ? "text-air" : "text-listrik")} aria-hidden />
                              {l.jenis === "air" ? "Air" : "Listrik"}
                            </p>
                            <p className="mt-1 text-[clamp(22px,2.4vw,28px)] leading-tight font-bold tracking-tight">
                              Naik <span className="text-warn">{angka(l.rasio)}×</span> dari biasanya
                            </p>
                          </div>
                          <Link
                            href={`/lonjakan/${l.catatan_id}`}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[16px] font-bold whitespace-nowrap text-primary-foreground transition-transform hover:-translate-y-0.5 max-sm:w-full"
                          >
                            Cek penyebabnya <ArrowRight className="size-[18px]" aria-hidden />
                          </Link>
                        </div>
                        <div className="mt-5 grid grid-cols-[84px_1fr_auto] items-center gap-x-4 gap-y-3 text-[14.5px]">
                          <span className={REDUP}>{l.jenis === "air" ? "Minggu ini" : "Bulan ini"}</span>
                          <span className="h-2.5 rounded-full bg-[#eef2f8]">
                            <span className="block h-full rounded-full bg-warn" style={{ width: `${(l.pemakaian / maks) * 100}%` }} />
                          </span>
                          <span className="tabular min-w-[64px] text-right font-bold">
                            {angka(l.pemakaian)}
                            {satuan}
                          </span>
                          <span className={REDUP}>Biasanya</span>
                          <span className="h-2.5 rounded-full bg-[#eef2f8]">
                            <span className="block h-full rounded-full bg-[#b3c1d8]" style={{ width: `${(l.rata_rata / maks) * 100}%` }} />
                          </span>
                          <span className="tabular min-w-[64px] text-right font-bold text-[#5a6782]">
                            ±{angka(l.rata_rata)}
                            {satuan}
                          </span>
                        </div>
                        <p className={cn("mt-4 text-[15px]", REDUP)}>
                          Kira-kira <b className="text-foreground">{rupiah(l.ekstra_rp)}</b> terbuang.{l.jenis === "air" && " Bisa jadi ada kebocoran."}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ===== Riwayat ===== */}
            <section className={cn(KARTU, "p-5 md:p-7")}>
              <h2 className="text-[19px] font-bold">Riwayat lonjakan</h2>
              {riwayat.length === 0 && !adaCatatan ? (
                <p className={cn("mt-3 text-[15px]", REDUP)}>Riwayat muncul setelah ada catatan pemakaian.</p>
              ) : riwayat.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <IlustrasiKalender className="max-w-[220px]" />
                  <p className="mt-2 text-[17px] font-bold text-primary">Belum ada riwayat lonjakan</p>
                  <p className={cn("max-w-sm text-[15px]", REDUP)}>Lonjakan yang sudah lewat akan tercatat di sini, jadi kamu bisa lihat polanya.</p>
                </div>
              ) : (
                <ul className="mt-2 divide-y divide-[#eef2f8]">
                  {riwayat.map((c) => {
                    const Ikon = c.jenis === "air" ? Droplet : Zap;
                    return (
                      <li key={`${c.jenis}-${c.id}`}>
                        <Link href={`/lonjakan/${c.id}`} className="group flex items-center gap-4 py-4">
                          <Ikon className={cn("size-5 shrink-0", c.jenis === "air" ? "text-air" : "text-listrik")} aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{c.jenis === "air" ? "Air" : "Listrik"}</p>
                            <p className={cn("text-[14px]", REDUP)}>{c.jenis === "air" ? tanggal(c.periode) : namaBulan(c.periode)}</p>
                          </div>
                          <span className="tabular font-bold">{c.jenis === "air" ? `${angka(c.pemakaian)} m³` : rupiah(c.pemakaian)}</span>
                          <ArrowRight className="size-4 text-[#8a98b0] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* ===== Cara kerja ===== */}
          <aside className={cn(KARTU, "p-5 md:p-6")}>
            <h2 className="flex items-center gap-2 text-[17px] font-bold">
              <TriangleAlert className="size-[18px] text-warn" aria-hidden /> Kapan disebut lonjakan?
            </h2>
            <p className={cn("mt-3 text-[15px] leading-relaxed", REDUP)}>
              Tiap kali kamu mencatat, angkanya dibandingkan dengan rata-rata catatan sebelumnya. Kalau naik jauh di atas kebiasaan, muncul di sini.
            </p>
            <p className={cn("mt-3 text-[15px] leading-relaxed", REDUP)}>
              Air dicatat per minggu dari angka meteran PDAM, listrik per bulan dari tagihan atau token.
            </p>
            <p className={cn("mt-3 text-[15px] leading-relaxed", REDUP)}>
              Di halaman detail, AI menebak penyebabnya dan memberi langkah cek yang bisa kamu centang.
            </p>
          </aside>
        </div>
      )}
      <CatatDialog
        buka={catatBuka}
        onOpenChange={setCatatBuka}
        catatanAir={air.data?.data}
        onSukses={muatUlang}
      />
    </AppShell>
  );
}

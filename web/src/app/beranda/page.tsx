"use client";

import Link from "next/link";
import { IlustrasiBeres, IlustrasiCatat, IlustrasiKalender, IlustrasiSambutan } from "@/components/ilustrasi";
import { jalankanTur, tandaiTur, type LangkahTur } from "@/components/tur";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { ArrowRight, Check, Droplet, History, Plus, TriangleAlert, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell, PageHead, useSession } from "@/components/app-shell";
import { EmptyState, ErrorState, Loading } from "@/components/states";
import { CatatDialog, type CatatanUbah } from "@/components/catat-dialog";
import { RiwayatCatatan } from "@/components/riwayat-catatan";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { pesanError, useApi } from "@/lib/use-api";
import { angka, rupiah, rupiahRingkas, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Beranda, CatatanPemakaian } from "@/lib/types";

const listrikConfig = { rp: { label: "Listrik", color: "var(--chart-1)" } } satisfies ChartConfig;
const airConfig = { m3: { label: "Air", color: "var(--chart-2)" } } satisfies ChartConfig;

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const labelBulan = (periode: string) => BULAN[Number(periode.slice(5, 7)) - 1] ?? periode;

/** Periode air dari backend berupa tanggal ISO ("2026-11-07"). Ringkas jadi "7 Nov" supaya sumbu tidak penuh. */
const labelAir = (periode: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(periode)
    ? `${Number(periode.slice(8, 10))} ${BULAN[Number(periode.slice(5, 7)) - 1]}`
    : periode;

const REDUP = "text-[#5a6782]";
const KARTU = "rounded-[24px] border border-[#e3e8f0] bg-white";
const SUMBU = { fontSize: 12.5, fill: "#8a98b0" };

export default function BerandaPage() {
  // Isi dirender di dalam AppShell supaya useSession() membaca sesi dari provider-nya.
  return (
    <AppShell>
      <BerandaIsi />
    </AppShell>
  );
}

const TUR_BERANDA: LangkahTur[] = [
  { sasaran: "angka-kunci", judul: "Ringkasan rumahmu", isi: "Skor rumah, tagihan listrik terakhir, air minggu ini, dan target hemat ada di sini." },
  { sasaran: "catat", judul: "Catat pemakaian rutin", isi: "Catat angka meteran air tiap minggu dan tagihan listrik tiap bulan. Dari sini lonjakan bisa langsung ketahuan." },
  { sasaran: "menu-lonjakan", judul: "Lonjakan", isi: "Kalau pemakaian naik jauh dari biasanya, muncul di sini lengkap dengan langkah ceknya.", sisi: "right" },
  { sasaran: "menu-audit", judul: "Hasil audit", isi: "Lihat alat mana yang paling makan biaya dan kenapa.", sisi: "right" },
  { sasaran: "menu-rencana", judul: "Rencana hemat", isi: "Centang misi yang mau dijalankan, total hematnya langsung kelihatan dalam Rupiah.", sisi: "right" },
];

/** Baca parameter alamat tanpa useSearchParams (tidak perlu Suspense). */
const useParam = (nama: string) =>
  useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get(nama),
    () => null,
  );

function BerandaIsi() {
  const { saya } = useSession();
  const selamat = useParam("selamat") === "1";
  const minta = useParam("tur") === "1";
  const [tutupSelamat, setTutupSelamat] = useState(false);
  const [turJalan, setTurJalan] = useState(false);

  function bersihkanAlamat() {
    window.history.replaceState(null, "", "/beranda");
  }
  function mulaiTur() {
    setTutupSelamat(true);
    bersihkanAlamat();
    setTurJalan(true);
    // tunggu modal tertutup dulu
    setTimeout(() => jalankanTur(TUR_BERANDA, () => saya && tandaiTur("beranda", saya.user.id)), 350);
  }
  const beranda = useApi<Beranda>("/beranda");
  const pemakaianAir = useApi<{ data: CatatanPemakaian[] }>("/pemakaian?jenis=air");
  const [catatBuka, setCatatBuka] = useState(false);
  const [riwayatBuka, setRiwayatBuka] = useState(false);
  // Catatan yang sedang diubah dari Riwayat; setelah dialog Ubah ditutup, kembali ke Riwayat.
  const [ubah, setUbah] = useState<CatatanUbah | null>(null);
  const [jenisRiwayat, setJenisRiwayat] = useState<CatatanUbah["jenis"] | null>(null);
  const [tab, setTab] = useState<string | null>(null);

  const data = beranda.data;
  const airTerakhir = pemakaianAir.data?.data.at(-1);
  const lonjakan = data?.lonjakan_aktif[0];
  const listrikTerakhir = data?.listrik.at(-1);
  const listrikSebelum = data?.listrik.at(-2);
  // Catatan air pertama belum punya pemakaian (butuh selisih dengan bacaan sebelumnya): tidak digambar.
  const airGrafik = data?.air.filter((a): a is { periode: string; m3: number } => a.m3 != null) ?? [];
  const airMingguIni = airGrafik.at(-1);
  // Lonjakan dibandingkan dengan minimal 2 periode sebelumnya (api/src/config.ts LONJAKAN):
  // listrik butuh 3 bulan tercatat, air 4 kali baca meteran (bacaan pertama hanya titik awal).
  const kurangListrik = Math.max(0, 3 - (data?.listrik.length ?? 0));
  const kurangAir = Math.max(0, 4 - (pemakaianAir.data?.data.length ?? 0));
  // Tab grafik: ikut jenis lonjakan kalau ada, selain itu listrik.
  const tabAktif = tab ?? (lonjakan?.jenis === "air" ? "air" : "listrik");
  // Sumbu air: ±5 garis dengan langkah "rapi" (1/2/5 × 10ⁿ) dari 0 sampai sedikit di atas nilai tertinggi.
  // Langkah dihitung dari nilainya, jadi angka besar (salah ketik meteran) tidak membuat ribuan garis.
  const { batasAir, tikAir } = sumbuRapi(Math.max(0, ...airGrafik.map((a) => a.m3)));

  function muatUlang() {
    void beranda.muat(true);
    void pemakaianAir.muat(true);
  }

  return (
    <>
      <PageHead
        judul={saya ? `Halo, ${saya.user.nama}` : "Beranda"}
        keterangan="Ringkasan pemakaian listrik dan air rumahmu."
        aksi={
          <Button onClick={() => setCatatBuka(true)} size="lg" className="h-12 rounded-full px-6 text-[16px]" data-tur="catat">
            <Plus aria-hidden />
            Catat pemakaian
          </Button>
        }
      />

      {beranda.loading && !data && <Loading judul="Memuat ringkasan rumah..." bentuk="dasbor" />}
      {beranda.error && !data && <ErrorState pesan={pesanError(beranda.error)} onRetry={() => beranda.muat()} />}

      {data && (
        <div className="flex flex-col gap-4 md:gap-5">
          {/* ===== Belum ada data rumah: ajak mengisi dulu ===== */}
          {data.skor === null && (
            <section className={cn(KARTU, "flex flex-col items-center gap-2 px-6 py-7 text-center md:flex-row md:gap-8 md:px-8 md:text-left")}>
              <IlustrasiSambutan className="max-w-[200px] shrink-0" />
              <div className="flex-1">
                <h2 className="text-[clamp(22px,2.4vw,28px)] leading-tight font-bold tracking-[-0.02em] text-primary">Ceritakan rumahmu dulu, yuk</h2>
                <p className={cn("mt-1.5 max-w-xl text-[16px]", REDUP)}>
                  Skor, biang boros, dan rencana hemat muncul setelah alat dan kebiasaan di rumah diisi. Cukup bercerita, AI yang mengisi formnya.
                </p>
              </div>
              <Link
                href="/rumah?tab=cerita"
                className="mt-3 inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-[16px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 md:mt-0"
              >
                Isi data rumah <ArrowRight className="size-[18px]" aria-hidden />
              </Link>
            </section>
          )}

          {/* ===== Angka kunci: satu kartu, empat kolom dipisah garis ===== */}
          <section className={cn(KARTU, "grid grid-cols-2 xl:grid-cols-4")} data-tur="angka-kunci">
            {data.skor === null ? (
              <Ringkas href="/rumah?tab=cerita" label="Skor rumah" nilai="—" ket="muncul setelah data rumah diisi" />
            ) : (
              <Ringkas
                href="/audit"
                label="Skor rumah"
                nilai={`${data.skor}`}
                satuan="/100"
                ket={data.skor >= 70 ? "Sudah cukup hemat" : data.skor >= 45 ? "Masih bisa dihemat" : "Banyak yang boros"}
              />
            )}
            <Ringkas
              label={`Listrik ${listrikTerakhir ? labelBulan(listrikTerakhir.periode) : "terakhir"}`}
              nilai={listrikTerakhir ? rupiahRingkas(listrikTerakhir.rp) : "—"}
              ket={listrikSebelum ? `${labelBulan(listrikSebelum.periode)}: ${rupiahRingkas(listrikSebelum.rp)}` : listrikTerakhir ? "tagihan atau token" : "belum ada catatan"}
            />
            <Ringkas
              label="Air minggu ini"
              nilai={airMingguIni ? `${angka(airMingguIni.m3)} m³` : "—"}
              ket={
                lonjakan?.jenis === "air" ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-warn">
                    <TriangleAlert className="size-3.5" aria-hidden /> naik {angka(lonjakan.rasio)}× dari rata-rata
                  </span>
                ) : data.rata_air_m3 != null && data.air.length > 0 ? (
                  `rata-rata ${angka(data.rata_air_m3)} m³`
                ) : (
                  "belum ada catatan"
                )
              }
            />
            <Ringkas
              href="/rencana"
              label="Target hemat"
              nilai={data.total_dicentang_rp > 0 ? rupiahRingkas(data.total_dicentang_rp) : "Rp0"}
              satuan="/bln"
              ket={data.total_dicentang_rp > 0 ? "dari misi yang dicentang" : data.skor === null ? "rencana muncul setelah audit" : "belum ada misi dicentang"}
            />
          </section>

          <div className="grid gap-4 md:gap-5 xl:grid-cols-[1fr_340px]">
            {/* ===== Grafik ===== */}
            <section className={cn(KARTU, "flex min-w-0 flex-col p-5 md:p-6")}>
              <Tabs value={tabAktif} onValueChange={(v) => setTab(String(v))} className="flex-1 gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[19px] font-bold tracking-tight">{tabAktif === "listrik" ? "Tagihan listrik per bulan" : "Pemakaian air per minggu"}</h2>
                    <p className={cn("mt-0.5 text-[14.5px]", REDUP)}>
                      {tabAktif === "listrik" ? "Rupiah tagihan atau total token yang dibeli." : "Dari angka meteran PDAM yang kamu catat."}
                    </p>
                  </div>
                  <TabsList className="h-11 rounded-[14px] bg-[#eef2f8] p-1">
                    {[
                      { v: "listrik", l: "Listrik", i: Zap, c: "text-listrik" },
                      { v: "air", l: "Air", i: Droplet, c: "text-air" },
                    ].map(({ v, l, i: Icon, c }) => (
                      <TabsTrigger
                        key={v}
                        value={v}
                        className="h-full min-w-[96px] rounded-[10px] px-4 text-[15px] font-semibold text-[#5a6782] after:hidden data-active:bg-white data-active:text-primary data-active:shadow-[0_1px_3px_rgba(20,37,64,.14)]"
                      >
                        <Icon className={c} aria-hidden /> {l}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="listrik" className="relative min-h-[300px]">
                  {data.listrik.length === 0 ? (
                    <EmptyState
                      ilustrasi={<IlustrasiCatat className="max-w-[220px]" />}
                      judul="Belum ada catatan listrik"
                      pesan="Catat tagihan atau token bulan ini untuk melihat grafiknya."
                      icon={Zap}
                      aksi={<Button variant="outline" onClick={() => setCatatBuka(true)}>Catat sekarang</Button>}
                      className="border-0 py-10 ring-0"
                    />
                  ) : (
                    <ChartContainer config={listrikConfig} className="absolute inset-0 aspect-auto h-full w-full">
                      <BarChart data={data.listrik.map((l) => ({ ...l, label: labelBulan(l.periode) }))} margin={{ top: 28, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
                        <CartesianGrid vertical={false} stroke="#eef2f8" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={SUMBU} tickMargin={10} />
                        <YAxis tickLine={false} axisLine={false} width={76} tick={SUMBU} tickCount={4} tickFormatter={(v) => rupiahRingkas(Number(v))} />
                        <ChartTooltip cursor={{ fill: "#f4f6fa", radius: 8 }} content={<ChartTooltipContent formatter={(v) => rupiah(Number(v))} />} />
                        <Bar dataKey="rp" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={40}>
                          {data.listrik.map((l, i) => (
                            <Cell key={l.periode} fill={i === data.listrik.length - 1 ? "var(--chart-1)" : "#f1dca2"} />
                          ))}
                          {/* label hanya di batang terakhir */}
                          <LabelList
                            dataKey="rp"
                            position="top"
                            offset={8}
                            content={(p) => {
                              const { x, y, width, index, value } = p as { x: number; y: number; width: number; index: number; value: number };
                              if (index !== data.listrik.length - 1) return null;
                              return (
                                <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--foreground)">
                                  {rupiahRingkas(value)}
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </TabsContent>

                <TabsContent value="air" className="relative min-h-[300px]">
                  {airGrafik.length === 0 && airTerakhir ? (
                    <EmptyState
                      ilustrasi={<IlustrasiKalender className="max-w-[220px]" />}
                      judul="Tinggal satu catatan lagi"
                      pesan={`Meteranmu ${angka(airTerakhir.nilai)} m³ pada ${tanggal(airTerakhir.periode)} sudah tercatat sebagai titik awal. Baca lagi sekitar ${tanggal(tambahHari(airTerakhir.periode, 7))}, nanti selisihnya jadi pemakaian minggu pertama.`}
                      icon={Droplet}
                      className="border-0 py-10 ring-0"
                    />
                  ) : airGrafik.length === 1 && pemakaianAir.data && pemakaianAir.data.data.length >= 2 ? (
                    <AirPertama catatan={pemakaianAir.data.data} m3Minggu={airGrafik[0].m3} />
                  ) : airGrafik.length === 0 ? (
                    <EmptyState
                      ilustrasi={<IlustrasiCatat className="max-w-[220px]" />}
                      judul="Belum ada catatan air"
                      pesan="Catat angka meteran air supaya kami bisa mendeteksi lonjakan."
                      icon={Droplet}
                      aksi={<Button variant="outline" onClick={() => setCatatBuka(true)}>Catat sekarang</Button>}
                      className="border-0 py-10 ring-0"
                    />
                  ) : (
                    <ChartContainer config={airConfig} className="absolute inset-0 aspect-auto h-full w-full">
                      <AreaChart data={airGrafik.map((a) => ({ ...a, label: labelAir(a.periode) }))} margin={{ top: 28, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="isi-air" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="var(--air)" stopOpacity={0.16} />
                            <stop offset="1" stopColor="var(--air)" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#eef2f8" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={SUMBU} tickMargin={10} />
                        <YAxis tickLine={false} axisLine={false} width={Math.max(56, `${angka(batasAir)} m³`.length * 8)} tick={SUMBU} domain={[0, batasAir]} ticks={tikAir} tickFormatter={(v) => `${angka(Number(v))} m³`} />
                        <ChartTooltip cursor={{ stroke: "#c7d0de", strokeWidth: 1 }} content={<ChartTooltipContent formatter={(v) => `${angka(Number(v))} m³`} />} />
                        {data.rata_air_m3 != null && (
                        <ReferenceLine
                          y={data.rata_air_m3}
                          stroke="#8a98b0"
                          strokeDasharray="4 5"
                          label={{ value: `rata-rata ${angka(data.rata_air_m3)} m³`, position: "insideBottomRight", fontSize: 12, fill: "#8a98b0", dy: 16 }}
                        />
                        )}
                        <Area
                          dataKey="m3"
                          type="monotone"
                          stroke="var(--color-m3)"
                          strokeWidth={2.5}
                          fill="url(#isi-air)"
                          isAnimationActive={false}
                          dot={false}
                          activeDot={{ r: 5, fill: "var(--air)", stroke: "#fff", strokeWidth: 2 }}
                        />
                        {airMingguIni && (
                          <ReferenceDot
                            x={labelAir(airMingguIni.periode)}
                            y={airMingguIni.m3}
                            r={6}
                            fill={lonjakan?.jenis === "air" ? "var(--warn)" : "var(--air)"}
                            stroke="#fff"
                            strokeWidth={2}
                            label={{ value: `${angka(airMingguIni.m3)} m³`, position: "top", offset: 12, fontSize: 13, fontWeight: 800, fill: "var(--foreground)" }}
                          />
                        )}
                      </AreaChart>
                    </ChartContainer>
                  )}
                </TabsContent>
              </Tabs>
            </section>

            {/* ===== Kolom kanan: perlu dicek + catatan terakhir ===== */}
            <div className="flex flex-col gap-4 md:gap-5">
              <section className={cn(KARTU, "p-5 md:p-6")}>
                <h2 className="text-[17px] font-bold">Perlu dicek</h2>
                {data.lonjakan_aktif.length === 0 && kurangListrik > 0 && kurangAir > 0 ? (
                  <div className="mt-3">
                    <p className={cn("text-[15px]", REDUP)}>
                      Lonjakan baru bisa dicek setelah ada catatan untuk dibandingkan.
                    </p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      <SiapCek icon={Zap} warna="text-listrik" label="Listrik" ada={data.listrik.length} perlu={3} satuan="bulan" />
                      <SiapCek icon={Droplet} warna="text-air" label="Air" ada={pemakaianAir.data?.data.length ?? 0} perlu={4} satuan="kali baca meteran" />
                    </div>
                  </div>
                ) : data.lonjakan_aktif.length === 0 ? (
                  <div className="mt-4 flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8edf5] text-primary">
                      <Check className="size-5" aria-hidden />
                    </span>
                    <p className={cn("pt-2 text-[15px] leading-snug", REDUP)}>
                      Tidak ada lonjakan. Pemakaian masih wajar.
                      {kurangListrik > 0 && ` Listrik bisa dicek setelah ${kurangListrik} bulan lagi.`}
                      {kurangAir > 0 && ` Air bisa dicek setelah ${kurangAir} kali baca meteran lagi.`}
                    </p>
                  </div>
                ) : (
                  <ul className="mt-1 divide-y divide-[#eef2f8]">
                    {data.lonjakan_aktif.map((l) => {
                      const satuan = l.jenis === "air" ? " m³" : "";
                      const maks = Math.max(l.pemakaian, l.rata_rata) || 1;
                      return (
                        <li key={l.catatan_id} className="py-4 first:pt-3 last:pb-0">
                          <p className="text-[16px] font-bold">
                            {l.jenis === "air" ? "Air minggu ini" : "Listrik bulan ini"} naik {angka(l.rasio)}×
                          </p>
                          {/* perbandingan langsung: minggu ini vs biasanya */}
                          <div className="mt-3 grid grid-cols-[72px_1fr_auto] items-center gap-x-3 gap-y-2 text-[13.5px]">
                            <span className={REDUP}>{l.jenis === "air" ? "Minggu ini" : "Bulan ini"}</span>
                            <span className="h-2 rounded-full bg-[#eef2f8]">
                              <span className="block h-full rounded-full bg-warn" style={{ width: `${(l.pemakaian / maks) * 100}%` }} />
                            </span>
                            <span className="tabular text-right font-bold">
                              {angka(l.pemakaian)}
                              {satuan}
                            </span>
                            <span className={REDUP}>Biasanya</span>
                            <span className="h-2 rounded-full bg-[#eef2f8]">
                              <span className="block h-full rounded-full bg-[#b3c1d8]" style={{ width: `${(l.rata_rata / maks) * 100}%` }} />
                            </span>
                            <span className="tabular text-right font-bold text-[#5a6782]">
                              {angka(l.rata_rata)}
                              {satuan}
                            </span>
                          </div>
                          <p className={cn("mt-3 text-[14px]", REDUP)}>
                            Kira-kira <b className="text-foreground">{rupiah(l.ekstra_rp)}</b> terbuang.{l.jenis === "air" && " Bisa jadi ada kebocoran."}
                          </p>
                          <Link
                            href={`/lonjakan/${l.catatan_id}`}
                            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
                          >
                            Cek penyebabnya <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className={cn(KARTU, "p-5 md:p-6")}>
                <h2 className="text-[17px] font-bold">Catatan terakhir</h2>
                <dl className="mt-3 divide-y divide-[#eef2f8]">
                  <BarisCatatan
                    icon={Zap}
                    warna="text-listrik"
                    label="Tagihan listrik"
                    nilai={listrikTerakhir ? rupiah(listrikTerakhir.rp) : "belum ada"}
                    ket={listrikTerakhir ? labelBulan(listrikTerakhir.periode) : undefined}
                  />
                  <BarisCatatan
                    icon={Droplet}
                    warna="text-air"
                    label="Meteran air"
                    nilai={airTerakhir ? `${angka(airTerakhir.nilai)} m³` : "belum ada"}
                    ket={airTerakhir ? tanggal(airTerakhir.periode) : undefined}
                  />
                </dl>
                <Button variant="outline" onClick={() => setCatatBuka(true)} className="mt-4 h-11 w-full rounded-full text-[15px]">
                  <Plus aria-hidden /> {listrikTerakhir || airTerakhir ? "Catat lagi" : "Catat pemakaian pertama"}
                </Button>
                {(listrikTerakhir || airTerakhir) && (
                  <Button variant="ghost" onClick={() => {
                      setJenisRiwayat(null);
                      setRiwayatBuka(true);
                    }} className="mt-1 h-11 w-full rounded-full text-[15px] text-[#5a6782] hover:text-primary">
                    <History aria-hidden /> Lihat & ubah catatan
                  </Button>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Akhir onboarding: sambutan setelah audit pertama */}
      <Dialog
        open={selamat && !tutupSelamat && !!data}
        onOpenChange={(b) => {
          if (!b) {
            setTutupSelamat(true);
            bersihkanAlamat();
          }
        }}
      >
        <DialogContent className="items-center text-center sm:max-w-[460px]">
          <IlustrasiBeres className="mx-auto max-w-[220px]" />
          <DialogTitle className="mt-1">Rumahmu sudah diaudit</DialogTitle>
          <DialogDescription>
            {data?.skor != null ? (
              <>
                Skor rumahmu <b className="text-foreground">{data.skor}/100</b>. Semua menu sudah terbuka. Mau kenalan sebentar dengan menunya?
              </>
            ) : (
              "Semua menu sudah terbuka. Mau kenalan sebentar dengan menunya?"
            )}
          </DialogDescription>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center [&_[data-slot=button]]:h-12 [&_[data-slot=button]]:px-6 [&_[data-slot=button]]:text-[16px]">
            <Button
              variant="outline"
              onClick={() => {
                setTutupSelamat(true);
                bersihkanAlamat();
                if (saya) tandaiTur("beranda", saya.user.id);
              }}
            >
              Nanti saja
            </Button>
            <Button onClick={mulaiTur}>Mulai tur singkat</Button>
          </div>
        </DialogContent>
      </Dialog>
      {minta && !turJalan && data && <MintaTur onMulai={mulaiTur} />}

      <CatatDialog
        buka={catatBuka || !!ubah}
        onOpenChange={(b) => {
          if (b) return;
          if (ubah) {
            setUbah(null);
            setRiwayatBuka(true);
          } else setCatatBuka(false);
        }}
        catatanAir={pemakaianAir.data?.data}
        ubah={ubah}
        jenisAwal={tabAktif === "air" ? "air" : "listrik"}
        onSukses={muatUlang}
      />
      <RiwayatCatatan
        buka={riwayatBuka}
        onOpenChange={setRiwayatBuka}
        jenisAwal={jenisRiwayat ?? (tabAktif === "air" ? "air" : "listrik")}
        onUbah={(c) => {
          setRiwayatBuka(false);
          setJenisRiwayat(c.jenis);
          setUbah(c);
        }}
        onBerubah={muatUlang}
      />
    </>
  );
}

/** Satu kolom angka kunci. Kolom bersebelahan dipisah garis tipis, tanpa ikon dekorasi. */
function Ringkas({ href, label, nilai, satuan, ket }: { href?: string; label: string; nilai: string; satuan?: string; ket: React.ReactNode }) {
  const isi = (
    <>
      <p className={cn("flex items-center gap-1.5 text-[14.5px] font-semibold", REDUP)}>
        {label}
        {href && <ArrowRight className="size-3.5 text-[#8a98b0] transition-all group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />}
      </p>
      <p className="tabular mt-2 text-[clamp(26px,2.6vw,34px)] leading-none font-extrabold tracking-tight">
        {nilai}
        {satuan && <span className="ml-0.5 text-[15px] font-semibold text-[#8a98b0]">{satuan}</span>}
      </p>
      <p className={cn("mt-2 text-[14px]", REDUP)}>{ket}</p>
    </>
  );
  // garis pemisah: kiri di kolom ke-2+, atas di baris kedua (2 kolom di layar sedang)
  const kelas =
    "min-w-0 p-5 md:p-6 [&:nth-child(n+3)]:border-t xl:[&:nth-child(n+3)]:border-t-0 [&:nth-child(even)]:border-l xl:[&:nth-child(n+2)]:border-l border-[#eef2f8]";
  return href ? (
    <Link href={href} className={cn(kelas, "group transition-colors first:rounded-l-[24px] last:rounded-r-[24px] hover:bg-[#f9fafc]")}>
      {isi}
    </Link>
  ) : (
    <div className={kelas}>{isi}</div>
  );
}

/**
 * Baru satu angka pemakaian air (dua bacaan meteran): satu titik tidak bisa jadi garis,
 * jadi tampilkan hitungannya saja supaya jelas dari mana angka per minggu berasal.
 */
function AirPertama({ catatan, m3Minggu }: { catatan: CatatanPemakaian[]; m3Minggu: number }) {
  const [a, b] = catatan.slice(-2);
  const selisih = Math.round((b.nilai - a.nilai) * 100) / 100;
  const hari = Math.round((Date.parse(b.periode) - Date.parse(a.periode)) / 86_400_000);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
      <p className={cn("text-[15px] font-semibold", REDUP)}>Pemakaian air pertamamu</p>
      <p className="tabular text-[clamp(36px,4vw,48px)] leading-none font-extrabold tracking-tight text-air">
        {angka(m3Minggu)}
        <span className="ml-1 text-[18px] font-semibold text-[#8a98b0]">m³ per minggu</span>
      </p>
      <p className={cn("max-w-md text-[15px]", REDUP)}>
        Meteran naik <b className="text-foreground">{angka(selisih)} m³</b> dari {labelAir(a.periode)} ({angka(a.nilai)}) ke {labelAir(b.periode)} ({angka(b.nilai)}),
        {hari === 7 ? " tepat seminggu." : ` dalam ${hari} hari, lalu dihitung untuk 7 hari.`}
        {hari < 7 && " Karena jaraknya pendek, angka ini masih perkiraan kasar."}
      </p>
      <p className={cn("max-w-md text-[14px]", REDUP)}>
        Grafik muncul setelah satu catatan lagi. Paling pas baca meteran seminggu sekali, sekitar {tanggal(tambahHari(b.periode, 7))}.
      </p>
    </div>
  );
}

/** Kesiapan cek lonjakan per jenis: "1 dari 3 bulan" + bar kemajuan. */
function SiapCek({ icon: Icon, warna, label, ada, perlu, satuan }: { icon: LucideIcon; warna: string; label: string; ada: number; perlu: number; satuan: string }) {
  const n = Math.min(ada, perlu);
  return (
    <div className="grid grid-cols-[18px_56px_1fr] items-center gap-x-2.5 gap-y-1 text-[14px]">
      <Icon className={cn("size-[18px]", warna)} aria-hidden />
      <span className="font-semibold">{label}</span>
      <span className="tabular text-right text-[#5a6782]">
        {n} dari {perlu} {satuan}
      </span>
      <span className="col-span-2" />
      <span className="h-1.5 rounded-full bg-[#eef2f8]">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${(n / perlu) * 100}%` }} />
      </span>
    </div>
  );
}

/** Sumbu 0..batas dengan ±5 garis berlangkah 1/2/2,5/5 × 10ⁿ. Minimal 0-2 m³ dengan langkah 0,5 untuk angka kecil. */
function sumbuRapi(maks: number) {
  const kasar = Math.max(maks * 1.1, 2) / 5;
  const pangkat = 10 ** Math.floor(Math.log10(kasar));
  const langkah = ([1, 2, 2.5, 5, 10].find((k) => k * pangkat >= kasar) ?? 10) * pangkat;
  const batasAir = Math.ceil((Math.max(maks * 1.1, 2)) / langkah) * langkah;
  const tikAir = Array.from({ length: Math.round(batasAir / langkah) + 1 }, (_, i) => Math.round(i * langkah * 1000) / 1000);
  return { batasAir, tikAir };
}

/** "2026-11-07" + 7 -> "2026-11-14" */
function tambahHari(iso: string, hari: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + hari);
  return d.toISOString().slice(0, 10);
}

function BarisCatatan({ icon: Icon, warna, label, nilai, ket }: { icon: LucideIcon; warna: string; label: string; nilai: string; ket?: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className={cn("size-[18px] shrink-0", warna)} aria-hidden />
      <dt className={cn("text-[15px]", REDUP)}>{label}</dt>
      <dd className="ml-auto text-right">
        <p className="tabular font-bold">{nilai}</p>
        {ket && <p className="text-[12.5px] text-[#8a98b0]">{ket}</p>}
      </dd>
    </div>
  );
}

/** "Ulangi tur" dari menu akun membuka /beranda?tur=1: mulai tur sekali setelah data tampil. */
function MintaTur({ onMulai }: { onMulai: () => void }) {
  useEffect(() => {
    const t = setTimeout(onMulai, 400);
    return () => clearTimeout(t);
    // sekali saat muncul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

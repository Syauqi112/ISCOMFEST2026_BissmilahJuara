"use client";

import Link from "next/link";
import { KosongAwal } from "@/components/kosong-awal";
import { IlustrasiPeriksa } from "@/components/ilustrasi";
import { ArrowRight, Droplet, Zap } from "lucide-react";
import { AppShell, PageHead } from "@/components/app-shell";
import { ErrorState, Loading } from "@/components/states";
import { IconTile } from "@/components/icon-tile";
import { ikonAlat, toneAlat } from "@/components/alat-icon";
import { Button } from "@/components/ui/button";
import { pesanError, useApi } from "@/lib/use-api";
import { angka, rupiah, rupiahRingkas, tanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Audit, BiangBoros, RincianAlat } from "@/lib/types";

const REDUP = "text-[#5a6782]";
const SAMAR = "text-[#8a98b0]";
const KARTU = "rounded-[24px] border border-[#e3e8f0] bg-white";

/** Arti skor dalam kalimat sehari-hari. */
function artiSkor(skor: number) {
  if (skor >= 70) return { judul: "Sudah cukup hemat", ket: "Pemakaian rumahmu sebagian besar wajar. Masih ada beberapa alat yang bisa ditekan." };
  if (skor >= 45) return { judul: "Masih bisa dihemat", ket: "Ada beberapa alat yang dipakai lebih lama dari kebutuhan. Mulai dari yang paling mahal." };
  return { judul: "Banyak yang boros", ket: "Banyak pemakaian di atas wajar. Ikuti rencana hemat satu per satu, mulai dari yang paling mahal." };
}

/** Kunci kegiatan air dari backend ("lain_lain", "cuci_baju") jadi teks biasa. */
function namaKegiatan(k: string) {
  if (k === "lain_lain") return "Lain-lain";
  const t = k.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Cincin skor 0–100. Warna ikut nilai: biru tinta baik, kuning sedang, oranye bata rendah. */
export function ScoreRing({ skor, size = 92 }: { skor: number; size?: number }) {
  const r = 34;
  const keliling = 2 * Math.PI * r;
  const isi = (Math.min(100, Math.max(0, skor)) / 100) * keliling;
  const warna = skor >= 70 ? "var(--primary)" : skor >= 45 ? "var(--listrik)" : "var(--warn)";
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="shrink-0" role="img" aria-label={`Skor efisiensi ${skor} dari 100`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e8edf5" strokeWidth="6" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={warna}
        strokeWidth="6"
        strokeDasharray={`${isi} ${keliling}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" fontSize="21" fontWeight="800" fill="var(--primary)">
        {skor}
      </text>
      <text x="40" y="56" textAnchor="middle" fontSize="8" fontWeight="600" fill="#8a98b0">
        dari 100
      </text>
    </svg>
  );
}

/** Pasangkan biang boros ke alat: lewat ref "alat:<id>", kalau tidak ada lewat nama alat di judul. */
function pasangkanBoros(alat: RincianAlat[], boros: BiangBoros[]) {
  const peta = new Map<number, { b: BiangBoros; urut: number }>();
  const sisa: { b: BiangBoros; urut: number }[] = [];
  boros.forEach((b, i) => {
    const idRef = /^alat:(\d+)$/.exec(b.ref ?? "")?.[1];
    let cocok = idRef ? alat.find((a) => a.alat_id === Number(idRef)) : undefined;
    if (!cocok) cocok = alat.find((a) => b.judul.toLowerCase().includes(a.nama.toLowerCase()));
    if (cocok && !peta.has(cocok.alat_id)) peta.set(cocok.alat_id, { b, urut: i + 1 });
    else sisa.push({ b, urut: i + 1 });
  });
  return { peta, sisa };
}

export default function AuditPage() {
  const { data, error, loading, muat } = useApi<Audit>("/audit/terbaru");

  // 404 di endpoint ini artinya "belum pernah audit", bukan error jaringan.
  const belumAudit = error?.kode === "TIDAK_DITEMUKAN";

  return (
    <AppShell>
      <PageHead
        judul="Hasil audit rumah"
        keterangan={data ? `Diperbarui ${tanggal(data.dibuat)}. Semua angka perkiraan per bulan.` : "Angka dihitung dari data rumah yang kamu simpan."}
        aksi={
          data ? (
            <Button nativeButton={false} render={<Link href="/rencana" />} size="lg" className="h-12 rounded-full px-6 text-[16px]">
              Lihat rencana hemat
              <ArrowRight aria-hidden />
            </Button>
          ) : undefined
        }
      />

      {loading && !data && <Loading judul="Memuat hasil audit..." bentuk="laporan" />}

      {belumAudit && (
        <KosongAwal hal="audit" ilustrasi={<IlustrasiPeriksa />} />
      )}

      {error && !data && !belumAudit && <ErrorState pesan={pesanError(error)} onRetry={() => muat()} />}

      {data && <Laporan data={data} />}
    </AppShell>
  );
}

function Laporan({ data }: { data: Audit }) {
  const total = data.listrik.rp_bulan + data.air.rp_bulan;
  const persenListrik = total > 0 ? Math.round((data.listrik.rp_bulan / total) * 100) : 0;
  const arti = artiSkor(data.skor);
  const { peta, sisa } = pasangkanBoros(data.rincian_alat, data.biang_boros);
  const maksAlat = Math.max(1, ...data.rincian_alat.map((r) => r.rp_bulan));
  const maksAir = Math.max(1, ...data.rincian_air.map((r) => r.rp_bulan));

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {/* ===== Ringkasan: total biaya + skor + kesimpulan AI ===== */}
      <section className={cn(KARTU, "p-6 md:p-8")}>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div className="min-w-0">
            <p className={cn("text-[16px] font-semibold", REDUP)}>Perkiraan biaya listrik dan air</p>
            <p className="tabular mt-2 text-[clamp(36px,4.6vw,52px)] leading-none font-extrabold tracking-[-0.03em] text-primary">
              {rupiah(total)}
              <span className={cn("ml-1.5 text-[18px] font-semibold tracking-normal", SAMAR)}>/bulan</span>
            </p>

            {/* porsi listrik vs air dari total */}
            <div className="mt-7 flex h-3 gap-1 overflow-hidden rounded-full" aria-hidden>
              <div className="h-full rounded-full bg-listrik" style={{ width: `${Math.max(2, persenListrik)}%` }} />
              <div className="h-full flex-1 rounded-full bg-air" />
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Zap className="mt-1 size-[18px] shrink-0 text-listrik" aria-hidden />
                <div>
                  <dt className={cn("text-[15px]", REDUP)}>Listrik · {persenListrik}%</dt>
                  <dd className="tabular text-[20px] font-bold">{rupiah(data.listrik.rp_bulan)}</dd>
                  <dd className={cn("tabular text-[14px]", SAMAR)}>±{angka(data.listrik.kwh_bulan)} kWh per bulan</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Droplet className="mt-1 size-[18px] shrink-0 text-air" aria-hidden />
                <div>
                  <dt className={cn("text-[15px]", REDUP)}>Air · {100 - persenListrik}%</dt>
                  <dd className="tabular text-[20px] font-bold">{rupiah(data.air.rp_bulan)}</dd>
                  <dd className={cn("tabular text-[14px]", SAMAR)}>±{angka(data.air.m3_bulan)} m³ per bulan</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="flex items-center gap-5 border-t border-[#eef2f8] pt-7 lg:w-[390px] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <ScoreRing skor={data.skor} size={112} />
            <div className="min-w-0">
              <p className={cn("text-[14.5px]", REDUP)}>Skor hemat rumah</p>
              <p className="text-[20px] leading-tight font-bold text-primary">{arti.judul}</p>
              <p className={cn("mt-1.5 text-[14.5px] leading-snug", REDUP)}>{arti.ket}</p>
            </div>
          </div>
        </div>

        {data.ringkasan && (
          <figure className="mt-8 border-t border-[#eef2f8] pt-7">
            <blockquote className="max-w-[760px] text-[clamp(18px,1.7vw,21px)] leading-relaxed font-semibold tracking-[-0.01em] text-[#1f3354]">
              “{data.ringkasan}”
            </blockquote>
            <figcaption className={cn("mt-3 text-[14px]", SAMAR)}>Kesimpulan ditulis AI dari data rumahmu.</figcaption>
          </figure>
        )}
      </section>

      <div className="grid items-start gap-4 md:gap-5 xl:grid-cols-[1fr_340px]">
        {/* ===== Ke mana uang listrik pergi ===== */}
        <section className={cn(KARTU, "min-w-0 p-5 md:p-7")}>
          <h2 className="text-[20px] font-bold tracking-tight">
            Ke mana uang listrik pergi <span className={SAMAR}>per alat</span>
          </h2>
          <p className={cn("mt-1 text-[15px]", REDUP)}>
            Diurutkan dari yang paling mahal.{" "}
            {data.biang_boros.length > 0 ? "Alat yang paling boros diberi penjelasan di bawahnya." : "AI tidak menemukan pemboros besar. Pertahankan kebiasaanmu."}
          </p>

          <ol className="mt-6 flex flex-col">
            {data.rincian_alat.map((r) => {
              const boros = peta.get(r.alat_id);
              return (
                <li key={r.alat_id} className="border-t border-[#eef2f8] py-4 first:border-t-0 first:pt-0 last:pb-0">
                  <div className="grid grid-cols-[32px_1fr_auto] items-center gap-x-3.5 gap-y-2">
                    <IconTile icon={ikonAlat(r.nama)} tone={toneAlat(r.nama)} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-semibold">{r.nama}</p>
                      <p className={cn("tabular text-[13.5px]", SAMAR)}>
                        {r.persen}% dari listrik · ±{angka(r.kwh_bulan)} kWh
                      </p>
                    </div>
                    <p className="tabular text-right text-[17px] font-bold">{rupiah(r.rp_bulan)}</p>
                    <div className="col-span-3 h-2 overflow-hidden rounded-full bg-[#eef2f8] sm:col-span-2 sm:col-start-2">
                      <div
                        className={cn("h-full rounded-full", boros ? "bg-listrik" : "bg-[#f1dca2]")}
                        style={{ width: `${Math.max(2, (r.rp_bulan / maksAlat) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {boros && (
                    <div className="mt-3 sm:ml-[46px]">
                      <p className="text-[15px] font-bold text-warn">Biang boros ke-{boros.urut}: {boros.b.judul}</p>
                      <p className={cn("mt-1 max-w-[640px] text-[15px] leading-relaxed", REDUP)}>{boros.b.alasan}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {sisa.length > 0 && (
            <div className="mt-6 border-t border-[#eef2f8] pt-5">
              <h3 className="text-[16px] font-bold">Biang boros lainnya</h3>
              <ul className="mt-3 flex flex-col gap-4">
                {sisa.map(({ b, urut }) => (
                  <li key={b.judul}>
                    <p className="text-[15px] font-bold text-warn">
                      Biang boros ke-{urut}: {b.judul}
                    </p>
                    <p className={cn("mt-1 max-w-[640px] text-[15px] leading-relaxed", REDUP)}>{b.alasan}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4 md:gap-5">
          {/* ===== Air per kegiatan ===== */}
          <section className={cn(KARTU, "p-5 md:p-6")}>
            <h2 className="text-[17px] font-bold">
              Air <span className={SAMAR}>per kegiatan</span>
            </h2>
            {data.rincian_air.length === 0 ? (
              <p className={cn("mt-3 text-[15px]", REDUP)}>Belum ada rincian kebiasaan air. Lengkapi di Data Rumah.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-4">
                {data.rincian_air.map((r) => (
                  <li key={r.kegiatan}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-semibold">{namaKegiatan(r.kegiatan)}</span>
                      <span className="tabular text-[15px] font-bold">{rupiahRingkas(r.rp_bulan)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef2f8]">
                        <div className="h-full rounded-full bg-air" style={{ width: `${Math.max(2, (r.rp_bulan / maksAir) * 100)}%` }} />
                      </div>
                      <span className={cn("tabular w-[54px] text-right text-[13px]", SAMAR)}>{angka(r.m3_bulan)} m³</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ===== Langkah berikutnya ===== */}
          <section className={cn(KARTU, "p-5 md:p-6")}>
            <h2 className="text-[17px] font-bold">Langkah berikutnya</h2>
            <p className={cn("mt-1.5 text-[15px] leading-snug", REDUP)}>
              Rencana hemat berisi misi kecil dari hasil audit ini, lengkap dengan perkiraan rupiah yang bisa dihemat.
            </p>
            <Button nativeButton={false} render={<Link href="/rencana" />} className="mt-4 h-12 w-full rounded-full text-[16px]">
              Buka rencana hemat
              <ArrowRight aria-hidden />
            </Button>
          </section>
        </div>
      </div>

      <p className={cn("text-[13.5px]", SAMAR)}>
        Angka rupiah dihitung dari data rumahmu dan tarif resmi, bukan tebakan AI. Penjelasan biang boros dan kesimpulan ditulis AI, jadi tetap perkiraan.
      </p>
    </div>
  );
}

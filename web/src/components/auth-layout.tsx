"use client";

// Kerangka halaman masuk/daftar, satu bahasa visual dengan landing:
// kiri panel gelap bergaris kabel + contoh hasil yang bergantian, kanan form di latar putih.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Saya } from "@/lib/types";
import { AirVent, ArrowLeft, Droplet, Lock, PiggyBank, ShieldCheck, TriangleAlert } from "lucide-react";
import { BgJalur } from "@/components/landing/bg-jalur";
import { landingCss } from "@/components/landing/landing-css";
import { MerekHematRumah } from "@/components/logo";
import { cn } from "@/lib/utils";

/** Contoh hasil akun demo (Ibu Sri), sama dengan yang tampil di landing. */
const CONTOH = [
  {
    icon: AirVent,
    warna: "bg-listrik-soft text-listrik-foreground",
    label: "Si boros ketahuan",
    judul: "AC 1 PK",
    nilai: "Rp277rb",
    ket: "53% tagihan listrik, nyala 8 jam tiap malam",
  },
  {
    icon: TriangleAlert,
    warna: "bg-warn-soft text-warn",
    label: "Lonjakan air",
    judul: "Naik 1,6×",
    nilai: "6,2 m³",
    ket: "biasanya ±4 m³, kira-kira Rp15.610 lebih",
  },
  {
    icon: PiggyBank,
    warna: "bg-primary-soft text-primary",
    label: "Rencana hemat",
    judul: "5 misi",
    nilai: "Rp187rb",
    ket: "hemat per bulan, sekitar Rp2,2 juta setahun",
  },
];

function ContohBergantian() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % CONTOH.length), 3600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <div className="relative h-[168px]">
        {CONTOH.map((c, n) => {
          const Icon = c.icon;
          const posisi = (n - i + CONTOH.length) % CONTOH.length; // 0 = depan
          return (
            <div
              key={c.label}
              aria-hidden={posisi !== 0}
              className={cn(
                "absolute inset-x-0 top-0 rounded-[22px] bg-white p-5 text-foreground shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)] transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
                posisi === 0 && "z-[3] translate-y-0 scale-100 opacity-100",
                posisi === 1 && "z-[2] translate-y-4 scale-[.95] opacity-60",
                posisi === 2 && "z-[1] translate-y-8 scale-[.9] opacity-0",
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("grid size-11 place-items-center rounded-xl", c.warna)}>
                  <Icon className="size-[22px]" aria-hidden />
                </span>
                <div>
                  <p className="text-[13px] text-[#5a6782]">{c.label}</p>
                  <p className="text-[17px] font-bold">{c.judul}</p>
                </div>
                <p className="tabular ml-auto text-[26px] font-extrabold tracking-tight">{c.nilai}</p>
              </div>
              <p className="mt-3 text-[14.5px] text-[#5a6782]">{c.ket}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-10 flex gap-1.5" aria-hidden>
        {CONTOH.map((c, n) => (
          <span key={c.label} className={cn("h-1.5 rounded-full transition-all duration-500", n === i ? "w-8 bg-[#f2b632]" : "w-1.5 bg-white/25")} />
        ))}
      </div>
    </div>
  );
}

export function AuthLayout({
  judul,
  subjudul,
  children,
  catatanBawah,
}: {
  judul: string;
  subjudul: string;
  children: React.ReactNode;
  catatanBawah: React.ReactNode;
}) {
  const router = useRouter();
  // Sudah login? Jangan tampilkan form masuk/daftar, langsung ke aplikasi.
  // Selama dicek, form disembunyikan supaya tidak berkedip.
  const [memeriksa, setMemeriksa] = useState(true);
  useEffect(() => {
    let batal = false;
    api<Saya>("/auth/saya")
      .then((saya) => {
        if (!batal) router.replace(saya.punya_profil ? "/beranda" : "/profil");
      })
      .catch(() => {
        if (!batal) setMemeriksa(false);
      });
    return () => {
      batal = true;
    };
  }, [router]);

  return (
    <div className="lp-root flex min-h-svh bg-white">
      <style href="hematrumah-landing" precedence="default">
        {landingCss}
      </style>

      {/* Panel kiri (layar lebar) */}
      <aside className="relative isolate m-3 hidden w-[46%] max-w-[640px] flex-col overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,#0b1628_0%,#12223c_50%,#18304f_100%)] p-10 text-white lg:flex xl:p-12">
        <BgJalur />
        <div className="lp-grain" />
        <Link href="/" className="relative z-[2]">
          <MerekHematRumah varian="terang" ukuran="lg" />
        </Link>
        <div className="relative z-[2] my-auto py-10">
          <h2 className="text-[clamp(32px,3vw,44px)] leading-[1.06] font-bold tracking-[-0.03em]">
            Coba ceritain rumahmu.
            <span className="block text-[#f2b632]">Si boros pasti ketahuan.</span>
          </h2>
          <p className="mt-4 max-w-[420px] text-[17px] leading-relaxed text-[#c6d1e4]">Contoh hasil dari rumah Ibu Sri, empat orang dengan daya 1300 VA.</p>
          <div className="mt-10 max-w-[440px]">
            <ContohBergantian />
          </div>
        </div>
        <div className="relative z-[2] flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#9fb1d1]">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#5aa7dd]" aria-hidden /> Angka dihitung server, bukan ditebak AI
          </span>
          <span className="flex items-center gap-2">
            <Lock className="size-4 text-[#f2b632]" aria-hidden /> Kata sandi ter-hash
          </span>
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-1 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[15px] font-semibold text-[#5a6782] transition-colors hover:bg-[#f4f6fa] hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden /> Kembali
          </Link>
          <Link href="/" className="lg:hidden">
            <MerekHematRumah varian="gelap" ukuran="sm" />
          </Link>
        </div>

        <div className={cn("mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10 transition-opacity duration-300", memeriksa && "pointer-events-none opacity-0")} aria-busy={memeriksa}>
          <span className="mb-6 flex gap-1.5" aria-hidden>
            <span className="grid size-10 place-items-center rounded-xl bg-listrik-soft text-listrik-foreground">
              <AirVent className="size-5" />
            </span>
            <span className="grid size-10 place-items-center rounded-xl bg-air-soft text-air">
              <Droplet className="size-5" />
            </span>
          </span>
          <h1 className="text-[clamp(30px,3vw,38px)] leading-tight font-bold tracking-[-0.03em] text-primary">{judul}</h1>
          <p className="mt-2 mb-8 text-[17px] text-[#5a6782]">{subjudul}</p>
          {children}
          <p className="mt-8 text-center text-[15px] text-[#5a6782]">{catatanBawah}</p>
        </div>

        <p className="text-center text-[13px] text-[#8a98b0]">© 2026 RumahHemat</p>
      </main>
    </div>
  );
}

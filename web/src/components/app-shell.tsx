"use client";

// Sesi login + kerangka dashboard: sidebar gelap di kiri (menu, pintasan cerita,
// akun), isi di lembar abu kebiruan bersudut membulat. Di HP: bar atas + tab bawah.
// Login pakai cookie httpOnly dari backend, jadi tidak ada token di browser.
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, CircleHelp, ClipboardList, LayoutDashboard, Lock, LogOut, MessageSquareText, PiggyBank, House, TriangleAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Saya } from "@/lib/types";
import { cn } from "@/lib/utils";
import { landingCss } from "@/components/landing/landing-css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MerekHematRumah } from "@/components/logo";

const SessionContext = createContext<{ saya: Saya | null; muat: () => void }>({ saya: null, muat: () => {} });

export const useSession = () => useContext(SessionContext);

const menu = [
  { href: "/beranda", label: "Beranda", pendek: "Beranda", icon: LayoutDashboard },
  { href: "/lonjakan", label: "Lonjakan", pendek: "Lonjakan", icon: TriangleAlert },
  { href: "/rumah", label: "Data Rumah", pendek: "Rumah", icon: House },
  { href: "/audit", label: "Hasil Audit", pendek: "Audit", icon: ClipboardList },
  { href: "/rencana", label: "Rencana Hemat", pendek: "Rencana", icon: PiggyBank },
];

/** Inisial untuk avatar: "Ibu Sri" -> "IS" */
function inisial(nama: string) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [saya, setSaya] = useState<Saya | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const aktif =
    menu.find((m) => pathname === m.href || pathname.startsWith(m.href + "/"))?.href ??
    (pathname.startsWith("/profil") ? "/rumah" : null);

  function muat() {
    api<Saya>("/auth/saya")
      .then(setSaya)
      .catch((e) => {
        // Sesi habis -> kembali ke halaman masuk. Error lain dibiarkan: halaman isi
        // yang menampilkan pesan, supaya tidak menendang pengguna tanpa penjelasan.
        if (e instanceof ApiError && e.kode === "BELUM_LOGIN") router.replace("/masuk");
      });
  }

  // Muat ulang sesi tiap pindah halaman: status punya_profil / punya_data_rumah
  // bisa berubah setelah pengguna menyimpan, dan halaman lama disimpan oleh Next.
  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Onboarding 2 langkah: (1) profil rumah, (2) ceritakan / isi data rumah lalu Simpan & audit.
  // Selama belum selesai, menu dikunci; yang boleh dibuka hanya halaman langkah yang sedang berjalan.
  const langkahAwal: 0 | 1 | 2 = !saya ? 0 : !saya.punya_profil ? 1 : !saya.punya_data_rumah ? 2 : 0;
  const terkunci = langkahAwal !== 0;
  useEffect(() => {
    if (langkahAwal === 1 && !pathname.startsWith("/profil")) router.replace("/profil");
    if (langkahAwal === 2 && !pathname.startsWith("/rumah") && !pathname.startsWith("/profil")) router.replace("/rumah?tab=cerita");
  }, [langkahAwal, pathname, router]);

  /** Hapus tanda tur yang sudah dilihat, lalu buka Beranda dengan tur. */
  function ulangiTur() {
    if (!saya) return;
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("hr-tur-") && k.endsWith(`-${saya.user.id}`)) localStorage.removeItem(k);
    } catch {}
    router.push("/beranda?tur=1");
  }

  async function keluar() {
    try {
      await api("/auth/keluar", { method: "POST" });
    } finally {
      router.replace("/masuk");
    }
  }

  const avatar = (besar?: boolean) => (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-[#f2b632] font-extrabold text-[#0b1628]", besar ? "size-10 text-[14px]" : "size-9 text-[13px]")}>
      {saya ? inisial(saya.user.nama) : ""}
    </span>
  );

  return (
    <SessionContext.Provider value={{ saya, muat }}>
      <style href="hematrumah-landing" precedence="default">
        {landingCss}
      </style>
      <div className="lp-root min-h-svh bg-[#0b1628]">
        {/* ===== Sidebar (layar lebar) ===== */}
        {/* grain untuk seluruh latar gelap (sidebar + celah di sekitar lembar) supaya warnanya menyatu */}
        <div className="lp-grain fixed! inset-0 z-0" aria-hidden />
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col overflow-hidden px-4 py-6 text-white lg:flex">
          <Link href="/beranda" className="relative px-3 text-[22px] font-extrabold tracking-tight">
            <MerekHematRumah varian="terang" ukuran="lg" />
          </Link>

          <nav aria-label="Menu utama" className="relative mt-10 flex flex-col gap-1">
            <p className="mb-2 px-3 text-[13px] font-semibold text-[#6f82a6]">Menu</p>
            {menu.map(({ href, label, icon: Icon }) =>
              terkunci && !(langkahAwal === 2 && href === "/rumah") ? (
                <span
                  key={href}
                  aria-disabled="true"
                  title="Untuk mengakses semua menu, selesaikan dulu profil dan data rumah"
                  className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-3 text-[16px] font-semibold text-[#5d6f8f]"
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                  <Lock className="ml-auto size-4" aria-hidden />
                </span>
              ) : (
                <Link
                  key={href}
                  href={href}
                  data-tur={`menu-${href.slice(1)}`}
                  aria-current={aktif === href ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-[16px] font-semibold transition-colors",
                    aktif === href ? "bg-white text-primary shadow-[0_10px_30px_-12px_rgba(0,0,0,.6)]" : "text-[#9fb1d1] hover:bg-white/[.06] hover:text-white",
                  )}
                >
                  <Icon className={cn("size-5", aktif === href && "text-primary")} aria-hidden />
                  {label}
                  {href === "/rumah" && langkahAwal === 2 && (
                    // titik berdenyut: penanda halus bahwa langkah ini yang sedang ditunggu
                    <span className="relative ml-auto grid size-2.5 place-items-center" aria-label="langkah yang sedang diisi">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#f2b632] opacity-60" />
                      <span className="relative size-2.5 rounded-full bg-[#f2b632]" />
                    </span>
                  )}
                </Link>
              ),
            )}
          </nav>

          {/* pintasan: saat terkunci jadi penunjuk langkah pertama */}
          {terkunci ? (
            <div className="relative mt-auto mb-4 rounded-[22px] bg-[linear-gradient(150deg,#1f3354_0%,#2b4a78_100%)] p-4 ring-1 ring-white/10">
              <p className="text-[13px] font-semibold text-[#f2b632]">Langkah {langkahAwal} dari 2</p>
              <p className="mt-1 font-bold">{langkahAwal === 1 ? "Isi profil rumah dulu" : "Ceritakan rumahmu"}</p>
              <p className="mt-1 text-[14px] leading-snug text-[#c6d1e4]">
                {langkahAwal === 1
                  ? "Untuk mengakses semua menu, isi profil rumah terlebih dahulu. Tarif dan daya dipakai untuk menghitung Rupiah."
                  : "Ceritakan alat di rumahmu, cek hasilnya, lalu tekan Simpan & audit. Setelah itu semua menu terbuka."}
              </p>
            </div>
          ) : (
          <Link
            href="/rumah?tab=cerita"
            className="relative mt-auto mb-4 block overflow-hidden rounded-[22px] bg-[linear-gradient(150deg,#1f3354_0%,#2b4a78_100%)] p-4 ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-[#f2b632] text-[#0b1628]">
              <MessageSquareText className="size-5" aria-hidden />
            </span>
            <p className="mt-3 font-bold">Ada alat baru di rumah?</p>
            <p className="mt-1 text-[14px] leading-snug text-[#c6d1e4]">Ceritakan saja, AI yang mengisi daftarnya.</p>
          </Link>
          )}

          {/* akun */}
          <div className="relative flex items-center gap-3 rounded-2xl bg-white/[.05] p-2.5 ring-1 ring-white/[.07]">
            {avatar(true)}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{saya?.user.nama ?? "..."}</p>
              <p className="truncate text-[12.5px] text-[#8597b8]">{saya?.user.email ?? ""}</p>
            </div>
            {!terkunci && (
              <button
                type="button"
                onClick={ulangiTur}
                title="Ulangi tur"
                aria-label="Ulangi tur"
                className="grid size-9 place-items-center rounded-xl text-[#9fb1d1] transition-colors hover:bg-white/10 hover:text-white"
              >
                <CircleHelp className="size-[18px]" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={keluar}
              title="Keluar"
              aria-label="Keluar"
              className="grid size-9 place-items-center rounded-xl text-[#9fb1d1] transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-[18px]" aria-hidden />
            </button>
          </div>
        </aside>

        {/* ===== Bar atas (HP & tablet) ===== */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#0b1628] px-4 py-3 text-white lg:hidden">
          <Link href="/beranda" className="shrink-0">
            <MerekHematRumah varian="terang" ukuran="md" />
          </Link>
          {saya && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="flex min-w-0 max-w-[60%] items-center gap-2.5 rounded-full bg-white/[.06] py-1 pr-3 pl-1 ring-1 ring-white/10 transition-colors hover:bg-white/10 aria-expanded:bg-white/10"
                    aria-label="Menu akun"
                  >
                    {avatar()}
                    {/* min-w-0: tanpa ini truncate tidak jalan di dalam flex dan nama panjang melebarkan halaman di HP */}
                    <span className="min-w-0 truncate text-[15px] font-semibold">{saya.user.nama}</span>
                    <ChevronDown className="size-4 shrink-0 text-[#9fb1d1]" aria-hidden />
                  </button>
                }
              />
              <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-2xl p-1.5">
                <div className="flex items-center gap-3 px-2.5 py-2.5">
                  {avatar(true)}
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-foreground">{saya.user.nama}</p>
                    <p className="truncate text-[13px] text-[#5a6782]">{saya.user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {!terkunci && (
                  <DropdownMenuItem onClick={ulangiTur} className="h-11 gap-2.5 rounded-xl px-2.5 text-[15px] font-semibold">
                    <CircleHelp className="size-[18px]" aria-hidden />
                    Ulangi tur
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={keluar} className="h-11 gap-2.5 rounded-xl px-2.5 text-[15px] font-semibold text-warn focus:bg-warn-soft focus:text-warn">
                  <LogOut className="size-[18px]" aria-hidden />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* ===== Isi: lembar abu kebiruan membulat ===== */}
        <div className="pb-[84px] lg:py-3 lg:pr-3 lg:pb-3 lg:pl-[264px]">
          <main className="relative z-10 min-h-[calc(100svh-60px)] rounded-t-[28px] bg-[#f4f6fa] lg:min-h-[calc(100svh-24px)] lg:rounded-[32px]">
            <div className="mx-auto w-full max-w-[1160px] px-4 py-7 md:px-8 md:py-10">{children}</div>
            <footer className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-3 px-4 pb-6 text-[12.5px] text-[#8a98b0] md:px-8">
              <span>RumahHemat</span>
              <span className="ml-auto" title="Versi yang sedang berjalan: nomor commit (kalau ada) dan waktu build WIB">
                versi {process.env.NEXT_PUBLIC_COMMIT && process.env.NEXT_PUBLIC_COMMIT !== "dev" ? `${process.env.NEXT_PUBLIC_COMMIT} · ` : ""}build{" "}
                {process.env.NEXT_PUBLIC_BUILD}
              </span>
            </footer>
          </main>
        </div>

        {/* ===== Tab bawah (HP & tablet) ===== */}
        <nav aria-label="Menu utama" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-[24px] border border-white/10 bg-[rgba(6,12,24,.94)] p-1.5 backdrop-blur-md lg:hidden">
          {menu.map(({ href, pendek, icon: Icon }) =>
            terkunci && !(langkahAwal === 2 && href === "/rumah") ? (
              <span key={href} aria-disabled="true" className="flex flex-col items-center gap-1 rounded-[18px] py-2 text-[11.5px] font-semibold text-[#5d6f8f] sm:text-[12.5px]">
                <Lock className="size-5" aria-hidden />
                {pendek}
              </span>
            ) : (
              <Link
                key={href}
                href={href}
                data-tur={`menu-${href.slice(1)}`}
                aria-current={aktif === href ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-[18px] py-2 text-[11.5px] font-semibold transition-colors sm:text-[12.5px]",
                  aktif === href ? "bg-white text-primary" : "text-[#9fb1d1]",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {pendek}
                {href === "/rumah" && langkahAwal === 2 && <i className="absolute top-1.5 right-[calc(50%-18px)] size-2 rounded-full bg-[#f2b632]" aria-label="perlu diisi" />}
              </Link>
            ),
          )}
        </nav>
      </div>
    </SessionContext.Provider>
  );
}

/** Judul halaman + aksi utama di kanan. */
export function PageHead({
  judul,
  keterangan,
  aksi,
  kembali,
}: {
  judul: string;
  keterangan?: React.ReactNode;
  aksi?: React.ReactNode;
  kembali?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end gap-4">
      <div className="min-w-0">
        {kembali && (
          <Link
            href={kembali.href}
            className="mb-4 inline-flex h-10 items-center gap-2 rounded-full border border-[#d5dce8] bg-white pr-4 pl-3 text-[15px] font-semibold text-primary shadow-[0_1px_2px_rgba(20,37,64,.06)] transition-all hover:-translate-x-0.5 hover:border-primary/40"
          >
            <ArrowLeft className="size-4" aria-hidden /> {kembali.label}
          </Link>
        )}
        <h1 className="text-[clamp(28px,3vw,36px)] leading-tight font-bold tracking-[-0.03em] text-primary">{judul}</h1>
        {keterangan && <p className="mt-1.5 text-[17px] text-[#5a6782]">{keterangan}</p>}
      </div>
      {aksi && <div className="md:ml-auto">{aksi}</div>}
    </div>
  );
}

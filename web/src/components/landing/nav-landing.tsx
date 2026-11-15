"use client";

// Navbar pil landing: muncul dengan animasi, mengecil saat digulir, sembunyi saat
// menggulir ke bawah dan muncul lagi saat ke atas, penanda bagian aktif yang
// bergeser, garis kemajuan baca, dan menu lipat di HP.
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MerekHematRumah } from "@/components/logo";

type Tautan = { href: string; label: string };

export function NavLanding({ menu, tombolDaftar }: { menu: Tautan[]; tombolDaftar: string }) {
  const [aktif, setAktif] = useState<string | null>(null);
  const [kecil, setKecil] = useState(false);
  const [sembunyi, setSembunyi] = useState(false);
  const [buka, setBuka] = useState(false);
  const [penanda, setPenanda] = useState<{ left: number; width: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const garisRef = useRef<HTMLSpanElement>(null);
  const bukaRef = useRef(false);

  useEffect(() => {
    bukaRef.current = buka;
  }, [buka]);

  // gulir: ukuran pil, sembunyi/muncul, garis kemajuan
  useEffect(() => {
    let terakhir = window.scrollY;
    let jalan = false;
    const cek = () => {
      jalan = false;
      const y = window.scrollY;
      setKecil(y > 24);
      if (!bukaRef.current) {
        if (y > terakhir + 6 && y > 480) setSembunyi(true);
        else if (y < terakhir - 6 || y < 480) setSembunyi(false);
      }
      terakhir = y;
      const maks = document.documentElement.scrollHeight - window.innerHeight;
      if (garisRef.current) garisRef.current.style.transform = `scaleX(${maks > 0 ? Math.min(1, y / maks) : 0})`;
    };
    const onScroll = () => {
      if (!jalan) {
        jalan = true;
        requestAnimationFrame(cek);
      }
    };
    cek();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // bagian mana yang sedang dibaca
  useEffect(() => {
    const bagian = menu.map((m) => document.querySelector(m.href)).filter(Boolean) as Element[];
    const io = new IntersectionObserver(
      (entri) => {
        for (const e of entri) if (e.isIntersecting) setAktif(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    bagian.forEach((b) => io.observe(b));
    const diAtas = () => {
      if (window.scrollY < window.innerHeight * 0.6) setAktif(null);
    };
    window.addEventListener("scroll", diAtas, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", diAtas);
    };
  }, [menu]);

  // posisi penanda aktif mengikuti tautan
  useLayoutEffect(() => {
    const nav = navRef.current;
    const el = aktif && nav ? (nav.querySelector(`a[href="${aktif}"]`) as HTMLElement | null) : null;
    setPenanda(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [aktif, kecil]);

  return (
    <header
      className={cn(
        "lp-nav-masuk fixed inset-x-0 top-4 z-50 px-4 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]",
        sembunyi && "-translate-y-[140%]",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex max-w-[1180px] items-center gap-7 overflow-hidden rounded-full border text-white backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]",
          kecil
            ? "max-w-[980px] border-white/10 bg-[rgba(6,12,24,.86)] py-1.5 pr-1.5 pl-5 shadow-[0_18px_50px_-20px_rgba(0,0,0,.75)]"
            : "border-white/[.07] bg-[rgba(6,12,24,.6)] py-2.5 pr-2.5 pl-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,.6)]",
        )}
      >
        <a href="#atas" className="inline-flex items-center">
          <MerekHematRumah varian="terang" ukuran={kecil ? "sm" : "md"} />
        </a>

        <nav ref={navRef} aria-label="Bagian halaman" className="relative mx-auto hidden items-center text-[15px] lg:flex">
          {penanda && (
            <span
              aria-hidden
              className="absolute inset-y-0 rounded-full bg-white/10 transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ left: penanda.left, width: penanda.width }}
            />
          )}
          {menu.map((m) => (
            <a
              key={m.href}
              href={m.href}
              aria-current={aktif === m.href ? "true" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 transition-colors",
                aktif === m.href ? "text-white" : "text-[#9fb1d1] hover:text-white",
              )}
            >
              {m.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link href="/masuk" className="hidden h-[44px] items-center rounded-full px-4 text-[15px] font-semibold text-[#c3cde0] transition-colors hover:text-white sm:inline-flex">
            Masuk
          </Link>
          <Link href="/daftar" className={cn(tombolDaftar, "transition-all", kecil ? "h-[42px] px-5 text-[15px]" : "h-[46px] px-5 text-[15px]")}>
            Daftar
          </Link>
          <button
            type="button"
            onClick={() => setBuka((b) => !b)}
            aria-expanded={buka}
            aria-label={buka ? "Tutup menu" : "Buka menu"}
            className="grid size-11 place-items-center rounded-full bg-white/[.08] lg:hidden"
          >
            {buka ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>

        {/* garis kemajuan baca, kuning seperti arus */}
        <span ref={garisRef} aria-hidden className="absolute inset-x-6 bottom-0 h-[2px] origin-left scale-x-0 rounded-full bg-[#f2b632]/80" />
      </div>

      {/* menu lipat HP */}
      <div
        className={cn(
          "mx-auto mt-2 max-w-[1180px] origin-top overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(6,12,24,.92)] backdrop-blur-md transition-all duration-300 lg:hidden",
          buka ? "max-h-[360px] opacity-100" : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Bagian halaman" className="flex flex-col p-2">
          {menu.map((m) => (
            <a
              key={m.href}
              href={m.href}
              onClick={() => setBuka(false)}
              className={cn("rounded-2xl px-4 py-3.5 text-[17px] font-semibold", aktif === m.href ? "bg-white/10 text-white" : "text-[#c3cde0]")}
            >
              {m.label}
            </a>
          ))}
          <Link href="/masuk" className="rounded-2xl px-4 py-3.5 text-[17px] font-semibold text-[#c3cde0]">
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}

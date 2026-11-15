"use client";

// Animasi muncul saat digulir: elemen ber-atribut data-reveal diberi kelas "in"
// begitu bagian atasnya masuk layar. Gayanya di landing-css.ts. Sekali muncul tidak diulang.
// Sengaja pakai cek posisi saat scroll (bukan IntersectionObserver): IO bisa melewatkan
// elemen saat digulir cepat di HP dan tidak pernah memicu elemen di dasar halaman.
import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
    const sisa = new Set(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sisa.forEach((e) => e.classList.add("in"));
      return;
    }
    let jalan = false;
    const cek = () => {
      jalan = false;
      const batas = window.innerHeight * 0.92;
      const dasar = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      for (const el of sisa) {
        const atas = el.getBoundingClientRect().top;
        // muncul kalau sudah masuk layar, sudah terlewat ke atas, atau halaman sudah di dasar
        if (atas < batas || dasar) {
          el.classList.add("in");
          sisa.delete(el);
        }
      }
      if (sisa.size === 0) lepas();
    };
    const onScroll = () => {
      if (!jalan) {
        jalan = true;
        requestAnimationFrame(cek);
      }
    };
    const lepas = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cek();
    return lepas;
  }, []);
}

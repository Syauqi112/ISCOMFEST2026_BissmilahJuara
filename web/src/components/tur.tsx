"use client";

// Tur sorot (driver.js) dengan gaya HematRumah. Tiap tur cuma muncul sekali per akun
// di browser ini (localStorage). "Ulangi tur" di menu akun menghapus tandanya.
import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useSession } from "@/components/app-shell";

export type LangkahTur = {
  /** Nilai atribut data-tur pada elemen yang disorot. */
  sasaran: string;
  judul: string;
  isi: string;
  sisi?: "top" | "bottom" | "left" | "right";
};

const kunci = (id: string, userId: number) => `hr-tur-${id}-${userId}`;

/** Elemen pertama dengan data-tur itu yang sedang terlihat (sidebar di laptop, tab bawah di HP). */
function elemenTerlihat(sasaran: string): Element {
  const semua = [...document.querySelectorAll<HTMLElement>(`[data-tur="${sasaran}"]`)];
  return semua.find((e) => e.offsetParent !== null && e.getClientRects().length > 0) ?? semua[0] ?? document.body;
}

export function jalankanTur(langkah: LangkahTur[], selesai?: () => void) {
  // Di layar kecil menu ada di tab bawah, jadi sisi yang dipaksa (mis. "right") diabaikan.
  const lebar = window.innerWidth >= 1024;
  const steps: DriveStep[] = langkah.map((l) => {
    const sisi = lebar ? l.sisi : undefined;
    return {
      element: () => elemenTerlihat(l.sasaran),
      // sisi kosong = driver.js mencari tempat yang tidak menutupi elemen yang disorot
      popover: { title: l.judul, description: l.isi, side: sisi, align: sisi ? "start" : undefined },
    };
  });
  const d = driver({
    steps,
    showProgress: true,
    progressText: "{{current}} dari {{total}}",
    nextBtnText: "Lanjut",
    prevBtnText: "Kembali",
    doneBtnText: "Selesai",
    popoverClass: "hr-tur",
    overlayColor: "#0b1628",
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 18,
    smoothScroll: true,
    onDestroyed: () => selesai?.(),
  });
  d.drive();
}

/** Jalankan tur otomatis sekali per akun ketika `mulai` bernilai true. Harus di dalam <AppShell>. */
export function TurOtomatis({ id, langkah, mulai, tunda = 700 }: { id: string; langkah: LangkahTur[]; mulai: boolean; tunda?: number }) {
  const { saya } = useSession();
  const userId = saya?.user.id;
  useEffect(() => {
    if (!mulai || userId == null) return;
    try {
      if (localStorage.getItem(kunci(id, userId))) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      jalankanTur(langkah, () => {
        try {
          localStorage.setItem(kunci(id, userId), "1");
        } catch {}
      });
    }, tunda);
    return () => clearTimeout(t);
    // langkah sengaja tidak jadi dependensi: isinya statis per halaman
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mulai, userId, id, tunda]);
  return null;
}

/** Hapus tanda "sudah dilihat" untuk semua tur akun ini. */
export function lupakanTur(userId: number) {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("hr-tur-") && k.endsWith(`-${userId}`)) localStorage.removeItem(k);
  } catch {}
}

/** Tandai tur sudah dilihat (mis. setelah dijalankan manual). */
export function tandaiTur(id: string, userId: number) {
  try {
    localStorage.setItem(kunci(id, userId), "1");
  } catch {}
}

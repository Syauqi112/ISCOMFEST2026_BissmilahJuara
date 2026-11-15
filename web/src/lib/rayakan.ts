"use client";

// Konfeti singkat saat semua checklist beres (langkah cek lonjakan, misi rencana hemat).
// Dipanggil hanya dari aksi pengguna (centang terakhir), bukan saat halaman dibuka.
// Warna = palet aplikasi: biru tinta, kuning listrik, biru air, krem. Dimatikan kalau
// pengguna memilih kurangi animasi (prefers-reduced-motion).
const WARNA = ["#1f3354", "#e3a008", "#2478b5", "#f1dca2", "#8fb8dc"];

export async function rayakan() {
  const { default: confetti } = await import("canvas-confetti");
  const dasar = { colors: WARNA, disableForReducedMotion: true, zIndex: 60, ticks: 220, scalar: 1.05 };
  // dua semburan dari bawah kiri & kanan, bertemu di tengah
  confetti({ ...dasar, particleCount: 70, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.85 } });
  confetti({ ...dasar, particleCount: 70, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.85 } });
  setTimeout(() => confetti({ ...dasar, particleCount: 50, spread: 100, startVelocity: 35, origin: { x: 0.5, y: 0.55 } }), 250);
}

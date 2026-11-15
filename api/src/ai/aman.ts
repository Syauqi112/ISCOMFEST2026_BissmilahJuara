// Saringan keamanan teks dari/untuk AI (lapisan kedua setelah prompt). Lihat docs/SECURITY.md § Prompt injection.

/** Teks yang kelihatan seperti kode, markup, atau query. */
const POLA_KODE =
  /```|<\/?[a-z][^>]*>|\b(function|def|import|export|return|printf|SELECT|INSERT|UPDATE|DELETE|DROP|eval|exec|#include|public static|python|javascript|typescript|php|html|sql|bash)\b|\b(print|console\.\w+|require|alert|fetch)\s*\(|=>|==|!=|\$\{|\bvar\s|\blet\s|\bconst\s|;\s*$|\{\s*"?\w+"?\s*:/i;

export const mirip_kode = (s: string) => POLA_KODE.test(s);

/**
 * Bersihkan satu teks dari AI untuk ditampilkan: buang tag & backtick, rapikan spasi, potong panjang.
 * Kembalikan null kalau teksnya kelihatan seperti kode / bukan kalimat biasa (item dibuang oleh pemanggil).
 */
export function teksAman(s: unknown, maks: number): string | null {
  if (typeof s !== "string") return null;
  if (mirip_kode(s)) return null;
  const t = s.replace(/<[^>]*>/g, "").replace(/[`*_#]/g, "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > maks ? `${t.slice(0, maks - 1).trimEnd()}…` : t;
}

/** Huruf (termasuk Indonesia), angka, spasi, dan tanda baca wajar untuk nama alat. */
export const POLA_NAMA_ALAT = /^[\p{L}\p{N} .,()/'+&%-]+$/u;

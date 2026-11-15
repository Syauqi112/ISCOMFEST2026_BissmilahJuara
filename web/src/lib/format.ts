// Format angka untuk tampilan. Semua angka dihitung backend; frontend cuma memformat.

const rupiahFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const angkaFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

/** 520500 -> "Rp520.500" */
export const rupiah = (n: number) => rupiahFmt.format(n).replace(/\s/g, "");

/** 108400 -> "Rp108rb", 1872000 -> "Rp1,9jt" (untuk chip & label grafik) */
export function rupiahRingkas(n: number) {
  if (n >= 1_000_000) return `Rp${angkaFmt.format(n / 1_000_000)}jt`;
  if (n >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return rupiah(n);
}

/** 6.2 -> "6,2" */
export const angka = (n: number) => angkaFmt.format(n);

/** "2026-11-07" -> "7 November 2026" */
export const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

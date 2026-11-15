// Logo HematRumah. Digambar inline (bukan <img>) supaya tajam di semua ukuran
// dan warnanya bisa ikut latar: "terang" untuk latar gelap, "gelap" untuk latar putih.
// File asli ada di public/brand/ (dari desainer tim), dipakai untuk favicon & OG image.

type Varian = "gelap" | "terang";

const warna = {
  gelap: { badan: "#1f3354", listrik: "#e3a008", air: "#5aa6dd" },
  terang: { badan: "#faf8f4", listrik: "#e3a008", air: "#2478b5" },
} as const;

/** Ikon saja (rumah + dua garis listrik/air). */
export function IkonHematRumah({ varian = "gelap", className }: { varian?: Varian; className?: string }) {
  const w = warna[varian];
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="RumahHemat" fill="none">
      <path d="M3.5 27.5 L32 4.5 L60.5 27.5" stroke={w.badan} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M32 15 L52 31 V47 Q52 52 47 52 H22 L12.5 59.8 Q10 61.6 10 58.5 V31 Z"
        fill={w.badan}
        stroke={w.badan}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect x="17" y="33.75" width="26" height="6.5" rx="3.25" fill={w.listrik} />
      <rect x="17" y="42.75" width="16" height="6.5" rx="3.25" fill={w.air} />
    </svg>
  );
}

/** Ikon + tulisan HematRumah, untuk navbar dan sidebar. */
export function MerekHematRumah({
  varian = "gelap",
  className,
  ukuran = "md",
}: {
  varian?: Varian;
  className?: string;
  ukuran?: "sm" | "md" | "lg";
}) {
  const ikon = { sm: "size-6", md: "size-8", lg: "size-9" }[ukuran];
  const teks = { sm: "text-[17px]", md: "text-[20px]", lg: "text-[22px]" }[ukuran];
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <IkonHematRumah varian={varian} className={`${ikon} shrink-0`} />
      <span className={`${teks} font-extrabold tracking-tight`}>RumahHemat</span>
    </span>
  );
}

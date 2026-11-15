// Onboarding 2 langkah (1 Profil rumah, 2 Ceritakan rumahmu): penanda langkah + kartu
// pembuka yang sama bentuknya di /profil dan /rumah.
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function LangkahAwal({ sekarang }: { sekarang: 1 | 2 }) {
  const langkah = [
    { nama: "Profil rumah", href: "/profil" },
    { nama: "Ceritakan rumahmu", href: "/rumah?tab=cerita" },
  ];
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]" aria-label="Langkah pengisian pertama">
      {langkah.map(({ nama, href }, i) => {
        const no = i + 1;
        const selesai = no < sekarang;
        const aktif = no === sekarang;
        const isi = (
          <>
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-[14px] font-bold transition-colors",
                aktif && "bg-primary text-primary-foreground",
                selesai && "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                !aktif && !selesai && "border border-[#cfd8e6] bg-white",
              )}
            >
              {selesai ? <Check className="size-4" strokeWidth={3} aria-hidden /> : no}
            </span>
            {nama}
          </>
        );
        return (
          <li key={nama} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden className={cn("h-px w-8", selesai || aktif ? "bg-primary/40" : "bg-[#cfd8e6]")} />}
            {selesai ? (
              // langkah yang sudah selesai bisa dibuka lagi untuk diubah
              <Link href={href} className="group flex items-center gap-2.5 rounded-full text-primary underline-offset-4 hover:underline" title={`Ubah ${nama.toLowerCase()}`}>
                {isi}
              </Link>
            ) : (
              <span className={cn("flex items-center gap-2.5", aktif ? "font-semibold text-primary" : "text-[#8a98b0]")} aria-current={aktif ? "step" : undefined}>
                {isi}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Kartu pembuka onboarding: ilustrasi kiri, penanda langkah, judul, keterangan, aksi. */
export function KartuAwal({
  sekarang,
  ilustrasi,
  judul,
  children,
  aksi,
  terkunci = true,
}: {
  sekarang: 1 | 2;
  ilustrasi: React.ReactNode;
  judul: string;
  children: React.ReactNode;
  aksi?: React.ReactNode;
  terkunci?: boolean;
}) {
  return (
    <section className="mb-8 flex flex-col items-center gap-4 rounded-[24px] border border-[#e3e8f0] bg-white p-5 text-center sm:flex-row sm:gap-7 sm:p-6 sm:text-left">
      <div className="w-full max-w-[170px] shrink-0">{ilustrasi}</div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
        <LangkahAwal sekarang={sekarang} />
        <p className="text-[19px] leading-snug font-bold text-primary">{judul}</p>
        <div className="text-[15px] leading-relaxed text-[#5a6782]">{children}</div>
        {terkunci && (
          <p className="flex items-start gap-2 text-left text-[14.5px] text-[#5a6782]">
            <Lock className="mt-0.5 size-4 shrink-0 text-[#e3a008]" aria-hidden />
            Untuk mengakses semua menu, selesaikan dulu langkah ini.
          </p>
        )}
        {aksi && <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">{aksi}</div>}
      </div>
    </section>
  );
}

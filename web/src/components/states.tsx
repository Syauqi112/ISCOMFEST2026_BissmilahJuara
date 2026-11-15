"use client";

// Tiga state wajib untuk setiap panggilan AI: loading, error + coba lagi, empty.
import { useEffect, useState } from "react";
import { CloudOff, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/icon-tile";
import { IlustrasiAnalisis, IlustrasiKalender, IlustrasiPeriksa, IlustrasiPutus } from "@/components/ilustrasi";
import type { ApiError } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * Loading state khusus AI. Teksnya sengaja menyebut AI supaya pengguna tahu
 * sedang menunggu proses, bukan aplikasi macet.
 */
export function AiLoading({
  judul = "AI sedang menganalisis...",
  keterangan = "Biasanya 5–15 detik. Jangan tutup halaman ini.",
  className,
}: {
  judul?: string;
  keterangan?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center gap-2 rounded-[24px] border border-[#e3e8f0] bg-white px-6 py-8 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <IlustrasiAnalisis className="max-w-[240px]" />
      <p className="mt-1 text-[18px] font-bold text-primary">{judul}</p>
      <p className="max-w-sm text-[15px] text-[#5a6782]">{keterangan}</p>
    </div>
  );
}

/**
 * Modal proses AI untuk aksi yang ditekan pengguna (proses cerita, simpan & audit).
 * Tidak bisa ditutup selama proses berjalan; teks langkah berganti pelan supaya
 * pengguna tahu aplikasi sedang bekerja, bukan macet.
 */
export type GagalAi = {
  error: ApiError;
  /** Judul saat gagal karena AI, mis. "Audit belum berhasil". */
  judul: string;
  /** Kalimat tambahan, mis. "Data rumahmu sudah tersimpan." */
  catatan?: string;
  onCobaLagi: () => void;
  /** Jalan keluar selain coba lagi, mis. "Atur data dulu" / "Isi form manual". Juga dipakai saat modal ditutup. */
  kembali: { label: string; onClick: () => void };
};

/**
 * Gagal tetap di modal yang sama: ilustrasi + alasan sesuai jenis error, tombol coba lagi
 * dan jalan keluar. Jadi pengguna tidak kehilangan konteks lewat toast yang cepat hilang.
 */
export function ProsesAi({ buka, judul, langkah, gagal }: { buka: boolean; judul: string; langkah: string[]; gagal?: GagalAi | null }) {
  const tampilGagal = !buka && !!gagal;
  return (
    <Dialog open={buka || tampilGagal} onOpenChange={(b) => !b && tampilGagal && gagal.kembali.onClick()} disablePointerDismissal={!tampilGagal}>
      <DialogContent showCloseButton={tampilGagal} className="items-center text-center sm:max-w-[440px]">
        {buka && <IsiProsesAi judul={judul} langkah={langkah} />}
        {tampilGagal && <IsiGagalAi gagal={gagal} />}
      </DialogContent>
    </Dialog>
  );
}

function IsiGagalAi({ gagal }: { gagal: GagalAi }) {
  const { kode, pesan } = gagal.error;
  const jenis =
    kode === "JARINGAN"
      ? { ilustrasi: <IlustrasiPutus className="max-w-[240px]" />, judul: "Koneksi terputus" }
      : kode === "BATAS_AI"
        ? { ilustrasi: <IlustrasiKalender className="max-w-[240px]" />, judul: "AI perlu jeda sebentar" }
        : { ilustrasi: <IlustrasiPeriksa className="max-w-[240px]" />, judul: gagal.judul };
  return (
    <div className="flex flex-col items-center" role="alert">
      {jenis.ilustrasi}
      <DialogTitle className="mt-2">{jenis.judul}</DialogTitle>
      <DialogDescription className="mt-1.5">
        {pesan}
        {gagal.catatan && <span className="mt-1 block">{gagal.catatan}</span>}
      </DialogDescription>
      <div className="mt-5 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center [&_[data-slot=button]]:h-12 [&_[data-slot=button]]:px-6 [&_[data-slot=button]]:text-[16px]">
        <Button variant="outline" onClick={gagal.kembali.onClick}>
          {gagal.kembali.label}
        </Button>
        <Button onClick={gagal.onCobaLagi}>
          <RotateCcw aria-hidden /> Coba lagi
        </Button>
      </div>
    </div>
  );
}

function IsiProsesAi({ judul, langkah }: { judul: string; langkah: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, langkah.length - 1)), 2600);
    return () => clearInterval(id);
  }, [langkah.length]);
  return (
    <div className="flex flex-col items-center" role="status" aria-live="polite">
      <IlustrasiAnalisis className="max-w-[260px]" />
      <DialogTitle className="mt-2">{judul}</DialogTitle>
      <DialogDescription className="mt-1.5 min-h-[48px]">
        <span key={i} className="inline-block animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
          {langkah[i]}
        </span>
      </DialogDescription>
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {langkah.map((_, n) => (
          <span key={n} className={cn("h-1.5 rounded-full transition-all duration-500", n <= i ? "w-6 bg-primary" : "w-1.5 bg-[#d3dcea]")} />
        ))}
      </div>
      <p className="mt-4 text-[13.5px] text-[#8a98b0]">Biasanya 5 sampai 30 detik. Jangan tutup halaman ini.</p>
    </div>
  );
}

/** Loading biasa (bukan AI): skeleton yang meniru bentuk halaman, tanpa kata "AI". */
export function Loading({
  judul = "Memuat data...",
  bentuk = "daftar",
  className,
}: {
  judul?: string;
  bentuk?: "dasbor" | "laporan" | "daftar" | "form";
  className?: string;
}) {
  const t = "animate-pulse rounded-full bg-[#e3e8f0]";
  const kartu = "rounded-[24px] border border-[#e3e8f0] bg-white";
  const baris = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <div className={cn(t, "size-10 rounded-xl")} />
        <div className="flex-1 space-y-2">
          <div className={cn(t, "h-3.5")} style={{ width: `${70 - i * 8}%` }} />
          <div className={cn(t, "h-2.5 w-1/3")} />
        </div>
        <div className={cn(t, "h-4 w-16")} />
      </div>
    ));
  return (
    <div className={cn("flex flex-col gap-5", className)} role="status" aria-live="polite" aria-label={judul}>
      <span className="sr-only">{judul}</span>
      {bentuk === "dasbor" && (
        <>
          <div className={cn(kartu, "grid grid-cols-2 xl:grid-cols-4")}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 p-6">
                <div className={cn(t, "h-3 w-24")} />
                <div className={cn(t, "h-7 w-32")} />
                <div className={cn(t, "h-2.5 w-28")} />
              </div>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className={cn(kartu, "space-y-5 p-6")}>
              <div className={cn(t, "h-4 w-56")} />
              <div className="flex h-[260px] items-end gap-4 pt-6">
                {[55, 62, 58, 70, 66, 80].map((h, i) => (
                  <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-[#eef2f8]" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className={cn(kartu, "space-y-4 p-6")}>
              <div className={cn(t, "h-4 w-28")} />
              <div className={cn(t, "h-3 w-full")} />
              <div className={cn(t, "h-3 w-4/5")} />
              <div className={cn(t, "mt-4 h-11 w-full")} />
            </div>
          </div>
        </>
      )}
      {bentuk === "laporan" && (
        <>
          <div className={cn(kartu, "space-y-4 p-7")}>
            <div className={cn(t, "h-3 w-32")} />
            <div className={cn(t, "h-9 w-64")} />
            <div className={cn(t, "h-3 w-full")} />
            <div className={cn(t, "h-3 w-3/4")} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className={cn(kartu, "p-6")}>{baris(5)}</div>
            <div className={cn(kartu, "p-6")}>{baris(3)}</div>
          </div>
        </>
      )}
      {bentuk === "daftar" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className={cn(kartu, "p-6")}>{baris(5)}</div>
          <div className={cn(kartu, "space-y-4 p-6")}>
            <div className={cn(t, "h-3 w-32")} />
            <div className={cn(t, "h-9 w-40")} />
            <div className={cn(t, "h-2.5 w-full")} />
          </div>
        </div>
      )}
      {bentuk === "form" && (
        <div className={cn(kartu, "space-y-6 p-7")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className={cn(t, "h-3 w-28")} />
                <div className="h-12 animate-pulse rounded-xl bg-[#eef2f8]" />
              </div>
              <div className="space-y-2">
                <div className={cn(t, "h-3 w-24")} />
                <div className="h-12 animate-pulse rounded-xl bg-[#eef2f8]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Error state dengan tombol coba lagi. Selalu ada tombolnya. */
export function ErrorState({
  judul = "Belum bisa dimuat",
  pesan,
  onRetry,
  labelRetry = "Coba lagi",
  aksiTambahan,
  className,
}: {
  judul?: string;
  pesan: string;
  onRetry?: () => void;
  labelRetry?: string;
  aksiTambahan?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("items-center gap-3 px-6 py-9 text-center", className)} role="alert">
      <IconTile icon={CloudOff} tone="warn" size="lg" />
      <p className="text-[17px] font-bold">{judul}</p>
      <p className="max-w-md text-sm text-muted-foreground">{pesan}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw aria-hidden />
            {labelRetry}
          </Button>
        )}
        {aksiTambahan}
      </div>
    </Card>
  );
}

/** Empty state: belum ada data. Selalu ada satu jalan keluar. */
export function EmptyState({
  judul,
  pesan,
  icon = CloudOff,
  ilustrasi,
  aksi,
  className,
}: {
  judul: string;
  pesan: string;
  icon?: LucideIcon;
  /** Ilustrasi dari components/ilustrasi.tsx; kalau ada, menggantikan ikon. */
  ilustrasi?: React.ReactNode;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-[24px] border border-[#e3e8f0] bg-white px-6 py-10 text-center", className)}>
      {ilustrasi ?? <IconTile icon={icon} tone="primary" size="lg" />}
      <p className="mt-2 text-[18px] font-bold text-primary">{judul}</p>
      <p className="max-w-md text-[15px] text-[#5a6782]">{pesan}</p>
      {aksi && <div className="mt-3">{aksi}</div>}
    </div>
  );
}

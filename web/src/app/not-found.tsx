import Link from "next/link";
import { IlustrasiPutus } from "@/components/ilustrasi";

// Halaman 404: satu bahasa visual dengan aplikasi.
export default function TidakDitemukan() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <IlustrasiPutus className="max-w-[300px]" />
      <h1 className="mt-4 text-[clamp(28px,4vw,40px)] leading-tight font-bold tracking-[-0.03em] text-primary">Halaman ini tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-[17px] text-[#5a6782]">Sepertinya kabelnya terlepas. Cek lagi alamatnya, atau kembali ke halaman utama.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/beranda" className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-[16px] font-bold text-primary-foreground">
          Ke beranda
        </Link>
        <Link href="/" className="inline-flex h-12 items-center rounded-full border border-[#d5dce8] bg-white px-6 text-[16px] font-bold text-primary">
          Halaman depan
        </Link>
      </div>
    </main>
  );
}

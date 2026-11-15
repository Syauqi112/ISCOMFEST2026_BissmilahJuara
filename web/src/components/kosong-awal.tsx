"use client";

// Empty state untuk halaman yang butuh hasil audit (Audit, Rencana). Pesannya ikut
// kondisi akun: belum ada data rumah -> ajak bercerita; data ada tapi belum diaudit
// -> arahkan ke tombol Simpan & audit. Harus dirender di dalam <AppShell>.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "@/components/app-shell";
import { EmptyState } from "@/components/states";

const UTAMA = "inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[16px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5";
const KEDUA = "inline-flex h-12 items-center rounded-full border border-[#d5dce8] bg-white px-6 text-[16px] font-bold text-primary transition-colors hover:bg-[#f4f6fa]";

export function KosongAwal({ ilustrasi, hal }: { ilustrasi: React.ReactNode; hal: "audit" | "rencana" }) {
  const { saya } = useSession();
  const nama = hal === "audit" ? "Hasil audit" : "Rencana hemat";

  if (saya && !saya.punya_data_rumah) {
    return (
      <EmptyState
        ilustrasi={ilustrasi}
        judul="Belum ada data rumah"
        pesan={`${nama} disusun dari alat dan kebiasaan di rumahmu. Ceritakan dulu seperti ngobrol, AI yang mengisi daftarnya.`}
        aksi={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/rumah?tab=cerita" className={UTAMA}>
              Ceritakan rumahmu <ArrowRight className="size-[18px]" aria-hidden />
            </Link>
            <Link href="/rumah?tab=form" className={KEDUA}>
              Isi form sendiri
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <EmptyState
      ilustrasi={ilustrasi}
      judul={hal === "audit" ? "Data rumah sudah ada, tinggal diaudit" : "Rencana muncul setelah audit"}
      pesan="Buka Data Rumah, cek daftar alatnya, lalu tekan Simpan & audit. Prosesnya sekitar 5 sampai 15 detik."
      aksi={
        <Link href="/rumah?tab=form" className={UTAMA}>
          Buka Data Rumah <ArrowRight className="size-[18px]" aria-hidden />
        </Link>
      }
    />
  );
}

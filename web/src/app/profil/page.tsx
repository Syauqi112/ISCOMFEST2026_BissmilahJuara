"use client";

import Link from "next/link";
import { IlustrasiSambutan } from "@/components/ilustrasi";
import { useRouter } from "next/navigation";
import { AppShell, PageHead, useSession } from "@/components/app-shell";
import { ErrorState, Loading } from "@/components/states";
import { ProfilForm } from "@/components/rumah/profil-form";
import { KartuAwal } from "@/components/onboarding";
import { pesanError, useApi } from "@/lib/use-api";
import type { DataRumah } from "@/lib/types";

export default function ProfilPage() {
  // Isi dirender di dalam AppShell supaya useSession() membaca sesi yang dimuat AppShell.
  return (
    <AppShell>
      <ProfilIsi />
    </AppShell>
  );
}

function ProfilIsi() {
  const router = useRouter();
  const { data, error, loading, muat } = useApi<DataRumah>("/rumah");
  const { saya } = useSession();
  // Stepper hanya untuk pengisian pertama (belum punya profil atau belum punya data rumah).
  const pertamaKali = saya ? !saya.punya_profil || !saya.punya_data_rumah : false;
  // Menu dikunci AppShell selama profil belum ada.
  const terkunci = saya ? !saya.punya_profil : false;

  return (
    <div>
      {pertamaKali && (
        <KartuAwal sekarang={1} ilustrasi={<IlustrasiSambutan />} judul="Selamat datang di RumahHemat" terkunci={terkunci}>
          Isi profil rumahmu dulu. Penghuni, daya, dan tarif dipakai untuk menghitung biaya listrik dan air dalam Rupiah.
        </KartuAwal>
      )}
      <PageHead
        judul="Profil rumah"
        kembali={saya && !pertamaKali ? { href: "/rumah?tab=form", label: "Data rumah" } : undefined}
        keterangan={
          pertamaKali
            ? "Isi sekali di awal. Angka ini dipakai untuk menghitung biaya listrik dan air dalam Rupiah."
            : "Angka ini dipakai untuk semua hitungan Rupiah. Ubah kalau ada yang berganti, misalnya tarif atau daya."
        }
      />

      {loading && !data && <Loading judul="Memuat profil rumah..." bentuk="form" />}
      {error && !data && <ErrorState pesan={pesanError(error)} onRetry={() => muat()} />}

      {data && (
        <div className="overflow-hidden rounded-[24px] border border-[#e3e8f0] bg-white">
          <ProfilForm
            awal={data.profil}
            pertamaKali={pertamaKali}
            onTersimpan={() => router.push(pertamaKali ? "/rumah?tab=cerita" : "/rumah?tab=form")}
            batal={
              saya && !pertamaKali ? (
                <Link
                  href="/rumah?tab=form"
                  className="inline-flex h-12 items-center justify-center rounded-full px-5 text-[15.5px] font-semibold text-[#5a6782] transition-colors hover:bg-[#eef2f8] hover:text-primary"
                >
                  Batal
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}

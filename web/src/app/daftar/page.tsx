"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputSandi } from "@/components/input-sandi";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { cekForm, salahDariServer, skemaDaftar, tanpa, type Salah } from "@/lib/validasi";
import { PesanSalah, tandaSalah } from "@/components/pesan-salah";

export default function DaftarPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salah, setSalah] = useState<Salah>({});

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cek = cekForm(skemaDaftar, { nama, email, password });
    if (!cek.ok) {
      setSalah(cek.salah);
      return;
    }
    setSalah({});
    setLoading(true);
    try {
      await api("/auth/daftar", { method: "POST", json: { nama, email, password } });
      // Akun baru belum punya profil rumah: langsung ke langkah 1.
      router.replace("/profil");
    } catch (err) {
      const perIsian = salahDariServer(err);
      if (perIsian) setSalah(perIsian);
      else setError(err instanceof ApiError ? err.pesan : "Tidak bisa mendaftar. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      judul="Buat akun"
      subjudul="Cukup satu menit, lalu kita hitung rumahmu."
      catatanBawah={
        <>
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-bold text-primary hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[15px] font-semibold" htmlFor="nama">Nama</Label>
          <Input className="h-12 rounded-xl border-[#d5dce8] bg-white px-4 text-[16px] focus-visible:border-primary" id="nama" autoComplete="name" placeholder="Contoh: Sri Wahyuni" value={nama} onChange={(e) => { setNama(e.target.value); setSalah((s) => tanpa(s, "nama")); }} {...tandaSalah("nama", salah.nama)} />
          <PesanSalah id="nama-salah" pesan={salah.nama} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[15px] font-semibold" htmlFor="email">Email</Label>
          <Input className="h-12 rounded-xl border-[#d5dce8] bg-white px-4 text-[16px] focus-visible:border-primary" id="email" type="email" autoComplete="email" placeholder="nama@contoh.id" value={email} onChange={(e) => { setEmail(e.target.value); setSalah((s) => tanpa(s, "email")); }} {...tandaSalah("email", salah.email)} />
          <PesanSalah id="email-salah" pesan={salah.email} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[15px] font-semibold" htmlFor="password">Kata sandi</Label>
          <InputSandi
            className="h-12 rounded-xl border-[#d5dce8] bg-white px-4 text-[16px] focus-visible:border-primary"
            id="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSalah((s) => tanpa(s, "password"));
            }}
            {...tandaSalah("password", salah.password)}
          />
          <PesanSalah id="password-salah" pesan={salah.password} />
          <p className="text-[13.5px] text-[#5a6782]">Minimal 8 karakter. Jangan pakai kata sandi yang sama dengan akun lain.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-[15px] font-semibold text-warn">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={loading} className="mt-2 h-12 w-full rounded-full text-[16px]">
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {loading ? "Sedang membuat akun..." : "Buat akun"}
        </Button>
      </form>
    </AuthLayout>
  );
}

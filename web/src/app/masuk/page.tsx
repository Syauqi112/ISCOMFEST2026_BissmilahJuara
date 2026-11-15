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
import type { User } from "@/lib/types";
import { cekForm, salahDariServer, skemaMasuk, tanpa, type Salah } from "@/lib/validasi";
import { PesanSalah, tandaSalah } from "@/components/pesan-salah";

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salah, setSalah] = useState<Salah>({});

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cek = cekForm(skemaMasuk, { email, password });
    if (!cek.ok) {
      setSalah(cek.salah);
      return;
    }
    setSalah({});
    setLoading(true);
    try {
      await api<{ user: User }>("/auth/masuk", { method: "POST", json: { email, password } });
      router.replace("/beranda");
    } catch (err) {
      const perIsian = salahDariServer(err);
      if (perIsian) setSalah(perIsian);
      else setError(err instanceof ApiError ? err.pesan : "Tidak bisa masuk. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      judul="Selamat datang lagi"
      subjudul="Masuk untuk melihat pemakaian listrik dan air rumahmu."
      catatanBawah={
        <>
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-bold text-primary hover:underline">
            Daftar
          </Link>
        </>
      }
    >
      <form onSubmit={kirim} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[15px] font-semibold" htmlFor="email">Email</Label>
          <Input
            className="h-12 rounded-xl border-[#d5dce8] bg-white px-4 text-[16px] focus-visible:border-primary"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="nama@contoh.id"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSalah((s) => tanpa(s, "email"));
            }}
            {...tandaSalah("email", salah.email)}
          />
          <PesanSalah id="email-salah" pesan={salah.email} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[15px] font-semibold" htmlFor="password">Kata sandi</Label>
          <InputSandi
            className="h-12 rounded-xl border-[#d5dce8] bg-white px-4 text-[16px] focus-visible:border-primary"
            id="password"
            autoComplete="current-password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setSalah((s) => tanpa(s, "password"));
            }}
            {...tandaSalah("password", salah.password)}
          />
          <PesanSalah id="password-salah" pesan={salah.password} />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-[15px] font-semibold text-warn">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={loading} className="mt-2 h-12 w-full rounded-full text-[16px]">
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {loading ? "Sedang masuk..." : "Masuk"}
        </Button>
      </form>
    </AuthLayout>
  );
}

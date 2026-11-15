"use client";

// Form profil rumah (penghuni, daya, jenis listrik, tarif). Dipakai di halaman /profil
// (pengisian pertama) dan di modal "Ubah profil" pada Data Rumah. Simpan = PUT /api/rumah/profil.
import { useState } from "react";
import { ArrowRight, Check, Droplet, Loader2, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputAngka } from "@/components/input-angka";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { cekForm, salahDariServer, skemaProfil, tanpa, type Salah } from "@/lib/validasi";
import { PesanSalah, tandaSalah } from "@/components/pesan-salah";
import type { JenisListrik, Profil } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYA = [450, 900, 1300, 2200, 3500, 4400, 5500];

const PROFIL_KOSONG: Profil = {
  penghuni: 4,
  daya_va: 1300,
  jenis_listrik: "token",
  tarif_listrik: 1444.7,
  tarif_air: 7000,
};

const REDUP = "text-[#5a6782]";
const ISIAN = "h-12 rounded-xl border-[#d5dce8] bg-white px-4 text-[16px] focus-visible:border-primary";
const LABEL = "text-[15px] font-semibold text-foreground";
const BANTU = "text-[14px] leading-snug text-[#6f7c95]";

/** Satu kelompok isian. Di halaman: judul di kiri, isian di kanan. Di modal (padat): bertumpuk. */
function Bagian({ icon: Icon, judul, ket, padat, children }: { icon: LucideIcon; judul: string; ket: string; padat?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("grid gap-5", padat ? "py-5" : "px-5 py-6 md:grid-cols-[230px_1fr] md:gap-8 md:px-7 md:py-7")}>
      <div className={cn("flex gap-3", !padat && "md:flex-col md:gap-3")}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-[17px] font-bold text-primary">{judul}</h3>
          <p className={cn("mt-0.5 text-[14.5px] leading-snug", REDUP)}>{ket}</p>
        </div>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function ProfilForm({
  awal,
  pertamaKali = false,
  padat = false,
  onTersimpan,
  batal,
}: {
  awal: Profil | null;
  pertamaKali?: boolean;
  /** Tata letak bertumpuk untuk modal. */
  padat?: boolean;
  onTersimpan: () => void;
  /** Tombol/tautan Batal (opsional). */
  batal?: React.ReactNode;
}) {
  // Suntingan pengguna menimpa data awal; tanpa effect penyalin.
  const [ubah, setUbah] = useState<Partial<Profil> | null>(null);
  const [simpan, setSimpan] = useState(false);
  const [errSimpan, setErrSimpan] = useState<string | null>(null);
  const [salah, setSalah] = useState<Salah>({});

  const form: Profil = { ...(awal ?? PROFIL_KOSONG), ...(ubah ?? {}) };

  function set<K extends keyof Profil>(k: K, v: Profil[K]) {
    setUbah((u) => ({ ...(u ?? {}), [k]: v }));
    setSalah((s) => tanpa(s, k));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setErrSimpan(null);
    const cek = cekForm(skemaProfil, form);
    if (!cek.ok) {
      setSalah(cek.salah);
      setErrSimpan("Ada isian yang belum benar. Cek kotak yang ditandai.");
      return;
    }
    setSalah({});
    setSimpan(true);
    try {
      await api("/rumah/profil", { method: "PUT", json: form });
      onTersimpan();
    } catch (err) {
      const perIsian = salahDariServer(err);
      if (perIsian) setSalah(perIsian);
      setErrSimpan(err instanceof ApiError ? err.pesan : "Tidak bisa menyimpan. Coba lagi.");
    } finally {
      setSimpan(false);
    }
  }

  return (
    <form onSubmit={kirim} noValidate className="divide-y divide-[#eef2f8]">
      <Bagian padat={padat} icon={Users} judul="Penghuni" ket="Makin banyak orang di rumah, makin wajar pemakaian airnya lebih besar.">
        <div className="flex max-w-[280px] flex-col gap-2">
          <label htmlFor="penghuni" className={LABEL}>
            Jumlah penghuni
          </label>
          <div className="relative">
            <InputAngka
              id="penghuni"
              inputMode="numeric"
              min={1}
              max={20}
              nilai={form.penghuni}
              onNilai={(n) => set("penghuni", n ?? 0)}
              {...tandaSalah("penghuni", salah.penghuni)}
              className={cn(ISIAN, "pr-16")}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[15px] text-[#8a98b0]">orang</span>
          </div>
          <PesanSalah id="penghuni-salah" pesan={salah.penghuni} />
          <p className={BANTU}>Orang yang tinggal dan memakai listrik dan air di rumah.</p>
        </div>
      </Bagian>

      <Bagian padat={padat} icon={Zap} judul="Listrik" ket="Lihat di meteran PLN, struk token, atau lembar tagihan bulanan.">
        <div className="flex flex-col gap-2">
          <span className={LABEL} id="label-jenis">
            Cara bayar listrik
          </span>
          <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="label-jenis">
            {(
              [
                ["token", "Token", "Prabayar, beli pulsa listrik"],
                ["pascabayar", "Tagihan bulanan", "Pascabayar, bayar tiap bulan"],
              ] as [JenisListrik, string, string][]
            ).map(([nilai, label, ket]) => {
              const pilih = form.jenis_listrik === nilai;
              return (
                <button
                  key={nilai}
                  type="button"
                  role="radio"
                  aria-checked={pilih}
                  onClick={() => set("jenis_listrik", nilai)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    pilih ? "border-primary bg-[#f4f7fc] ring-1 ring-primary" : "border-[#d5dce8] bg-white hover:border-[#b9c4d6]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border-2",
                      pilih ? "border-primary bg-primary text-primary-foreground" : "border-[#c5cfdf]",
                    )}
                  >
                    {pilih && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold text-foreground">{label}</span>
                    <span className="block text-[13.5px] text-[#8a98b0]">{ket}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="daya" className={LABEL}>
              Daya listrik
            </label>
            <Select value={String(form.daya_va)} onValueChange={(v) => set("daya_va", Number(v))}>
              <SelectTrigger id="daya" className="h-12! w-full rounded-xl border-[#d5dce8] bg-white px-4 text-[16px]">
                <SelectValue>{(v: string) => `${Number(v).toLocaleString("id-ID")} VA`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DAYA.map((va) => (
                  <SelectItem key={va} value={String(va)}>
                    {va.toLocaleString("id-ID")} VA
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PesanSalah id="daya_va-salah" pesan={salah.daya_va} />
            <p className={BANTU}>Tertulis di meteran atau tagihan, misalnya 1.300 VA.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tarif-listrik" className={LABEL}>
              Tarif per kWh
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-[#8a98b0]">Rp</span>
              <InputAngka
                id="tarif-listrik"
                inputMode="decimal"
                step="0.01"
                min={0}
                nilai={form.tarif_listrik}
                onNilai={(n) => set("tarif_listrik", n ?? 0)}
                {...tandaSalah("tarif_listrik", salah.tarif_listrik)}
                className={cn(ISIAN, "pl-11")}
              />
            </div>
            <PesanSalah id="tarif_listrik-salah" pesan={salah.tarif_listrik} />
            <p className={BANTU}>Salin dari struk token atau tagihan.</p>
          </div>
        </div>
      </Bagian>

      <Bagian padat={padat} icon={Droplet} judul="Air" ket="Kalau pakai sumur atau air tanah, kosongkan saja tarifnya.">
        <div className="flex max-w-[340px] flex-col gap-2">
          <label htmlFor="tarif-air" className={LABEL}>
            Tarif PDAM per m³
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-[#8a98b0]">Rp</span>
            <InputAngka
              id="tarif-air"
              inputMode="decimal"
              step="0.01"
              min={0}
              placeholder="Kosong = tidak pakai PDAM"
              bolehKosong
              nilai={form.tarif_air}
              onNilai={(n) => set("tarif_air", n)}
              {...tandaSalah("tarif_air", salah.tarif_air)}
              className={cn(ISIAN, "pl-11")}
            />
          </div>
          <PesanSalah id="tarif_air-salah" pesan={salah.tarif_air} />
          <p className={BANTU}>Ada di lembar tagihan PDAM.</p>
        </div>
      </Bagian>

      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", padat ? "sticky -bottom-6 z-[1] -mb-6 bg-white pt-5 pb-6 md:-bottom-7 md:-mb-7 md:pb-7" : "bg-[#fafbfd] px-5 py-5 md:px-7")}>
        {errSimpan ? (
          <p role="alert" className="flex-1 text-[14.5px] font-semibold text-warn">
            {errSimpan}
          </p>
        ) : (
          <p className="flex-1 text-[14px] text-[#8a98b0]">
            {pertamaKali ? "Berikutnya: daftar alat listrik dan kebiasaan air." : "Dipakai untuk semua hitungan Rupiah."}
          </p>
        )}
        {batal}
        <Button type="submit" size="lg" disabled={simpan} className="h-12 rounded-full px-6 text-[16px] max-sm:w-full">
          {simpan ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {simpan ? "Menyimpan..." : pertamaKali ? "Lanjut ke data rumah" : "Simpan profil"}
          {!simpan && pertamaKali && <ArrowRight aria-hidden />}
        </Button>
      </div>
    </form>
  );
}

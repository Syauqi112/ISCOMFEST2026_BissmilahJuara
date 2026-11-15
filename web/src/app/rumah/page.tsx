"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Calculator, Droplet, House, List, Loader2, MessageSquareText, Pencil, Plug, Users, Wand2 } from "lucide-react";
import { AppShell, PageHead } from "@/components/app-shell";
import { ErrorState, Loading, ProsesAi } from "@/components/states";
import { AlatTable, KebiasaanAirForm, TambahAlat } from "@/components/rumah/alat-editor";
import { ProfilForm } from "@/components/rumah/profil-form";
import { GabungCerita, gabungAlat } from "@/components/rumah/gabung-cerita";
import { KartuAwal } from "@/components/onboarding";
import { IlustrasiCatat } from "@/components/ilustrasi";
import { TurOtomatis } from "@/components/tur";
import { toast } from "sonner";
import { cekForm, salahDariServer, skemaDataRumah, tanpa, type Salah } from "@/lib/validasi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api";
import { pesanError, useApi } from "@/lib/use-api";
import { rupiah } from "@/lib/format";
import type { Alat, AlatPreset, Audit, DataRumah, HasilCerita, KebiasaanAir, Profil } from "@/lib/types";
import { cn } from "@/lib/utils";

const KARTU = "rounded-[24px] border border-[#e3e8f0] bg-white";
const REDUP = "text-[#5a6782]";

/** Potongan kalimat yang bisa diklik untuk mulai bercerita. Murni di browser, tidak memanggil AI. */
const CONTOH = [
  "Di rumah ada 4 orang.",
  "AC satu di kamar, nyala dari jam 9 malam sampai subuh.",
  "Kulkas satu, nyala terus.",
  "TV di ruang tengah nyala sore sampai jam 10 malam.",
  "Mandi pakai gayung, dua kali sehari.",
  "Cuci baju pakai mesin, 3 kali seminggu.",
];


const KEBIASAAN_KOSONG: KebiasaanAir = {
  mandi_per_hari: 2,
  cara_mandi: "gayung",
  cuci_baju_per_minggu: 3,
  cuci_pakai_mesin: true,
  siram_tanaman_per_minggu: 0,
  cuci_kendaraan_per_minggu: 1,
};

const MAKS_CERITA = 1000;

function RumahClient() {
  const router = useRouter();
  const params = useSearchParams();
  const tabAwal = params.get("tab") === "form" ? "form" : "cerita";
  const [tab, setTab] = useState<"cerita" | "form">(tabAwal);

  const rumah = useApi<DataRumah>("/rumah");
  const preset = useApi<{ alat: AlatPreset[] }>("/alat-preset");

  const [alatUbah, setAlatUbah] = useState<Alat[] | null>(null);
  const [kebiasaanUbah, setKebiasaanUbah] = useState<KebiasaanAir | null>(null);
  const [cerita, setCerita] = useState("");
  const [sedangCerita, setSedangCerita] = useState(false);
  const [errCerita, setErrCerita] = useState<ApiError | null>(null);
  const [catatanAi, setCatatanAi] = useState<string[]>([]);
  const [tanyaGabung, setTanyaGabung] = useState<HasilCerita | null>(null);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [errSimpan, setErrSimpan] = useState<string | null>(null);
  // Gagal di langkah AI audit: tampil di modal proses (bukan cuma di bar bawah).
  const [gagalAudit, setGagalAudit] = useState<{ error: ApiError; tersimpan: boolean } | null>(null);
  const [ubahProfil, setUbahProfil] = useState(false);
  const [salahData, setSalahData] = useState<Salah>({});

  // Next menyimpan halaman yang ditinggalkan (state ikut tersimpan). Setelah Simpan & audit
  // pindah ke /audit, saat kembali ke sini modal proses AI jangan masih terbuka.
  // Cleanup effect jalan ketika halaman disembunyikan/ditinggalkan.
  useEffect(
    () => () => {
      setSedangSimpan(false);
      setSedangCerita(false);
    },
    [],
  );

  // Suntingan lokal menimpa data server. Tanpa effect penyalin, jadi tidak ada
  // render berantai dan suntingan pengguna tidak tertimpa saat refresh.
  const alat = alatUbah ?? rumah.data?.alat ?? [];
  const kebiasaan = kebiasaanUbah ?? rumah.data?.kebiasaan_air ?? KEBIASAAN_KOSONG;

  const setAlat = (fn: (lama: Alat[]) => Alat[]) => setAlatUbah((lama) => fn(lama ?? rumah.data?.alat ?? []));
  const setKebiasaan = (k: KebiasaanAir) => setKebiasaanUbah(k);

  function gantiTab(t: "cerita" | "form") {
    setTab(t);
    // Simpan di URL supaya bisa dibuka ulang / dibagikan, tanpa memuat ulang halaman.
    window.history.replaceState(null, "", `/rumah?tab=${t}`);
  }

  async function prosesCerita() {
    setErrCerita(null);
    setSedangCerita(true);
    try {
      const hasil = await api<HasilCerita>("/ai/cerita", { method: "POST", json: { cerita } });
      setCatatanAi(hasil.catatan ?? []);
      if (alat.length > 0) {
        // Form sudah terisi: jangan menimpa diam-diam, tanya dulu.
        setTanyaGabung(hasil);
      } else {
        setAlatUbah(hasil.alat);
        setKebiasaan(hasil.kebiasaan_air);
        gantiTab("form");
      }
    } catch (e) {
      setErrCerita(e instanceof ApiError ? e : new ApiError("AI_GAGAL", "Cerita belum bisa diproses. Coba lagi.", 0));
    } finally {
      setSedangCerita(false);
    }
  }

  function pakaiHasilCerita(mode: "tambah" | "ganti") {
    if (!tanyaGabung) return;
    setAlatUbah(mode === "ganti" ? tanyaGabung.alat : gabungAlat(alat, tanyaGabung.alat));
    setKebiasaan(tanyaGabung.kebiasaan_air);
    setTanyaGabung(null);
    gantiTab("form");
  }

  async function simpanDanAudit() {
    setErrSimpan(null);
    const cek = cekForm(skemaDataRumah, { alat, kebiasaan_air: kebiasaan });
    if (!cek.ok) {
      setSalahData(cek.salah);
      setErrSimpan("Ada isian yang belum benar. Cek kotak yang ditandai merah.");
      return;
    }
    setSalahData({});
    setGagalAudit(null);
    setSedangSimpan(true);
    let tersimpan = false;
    try {
      await api("/rumah/data", {
        method: "PUT",
        json: {
          alat: alat.map((a) => ({
            preset_id: a.preset_id,
            nama: a.nama,
            jumlah: a.jumlah,
            jam_per_hari: a.jam_per_hari,
            hari_per_minggu: a.hari_per_minggu,
            watt: a.watt,
            dari_ai: a.dari_ai,
          })),
          kebiasaan_air: kebiasaan,
        },
      });
      tersimpan = true;
      await api<Audit>("/ai/audit", { method: "POST" });
      // Audit pertama = akhir onboarding: ke Beranda dengan sambutan + tur.
      router.push(awal ? "/beranda?selamat=1" : "/audit");
    } catch (e) {
      const perIsian = salahDariServer(e);
      if (perIsian) {
        // Isian ditolak server: tutup modal, tandai kotak yang salah di form.
        setSalahData(perIsian);
        setErrSimpan(e instanceof ApiError ? e.pesan : "Ada isian yang belum benar.");
      } else {
        setGagalAudit({ error: e instanceof ApiError ? e : new ApiError("AI_GAGAL", "Audit belum bisa dibuat. Coba lagi.", 0), tersimpan });
      }
      setSedangSimpan(false);
    }
  }


  const jumlahPerkiraan = alat.filter((a) => a.dari_ai).length;
  const siap = rumah.data !== null;
  // Mode onboarding langkah 2: data rumah di server belum punya alat.
  const awal = siap && (rumah.data?.alat.length ?? 0) === 0;
  const profil = rumah.data?.profil ?? null;

  function sisipkanContoh(teks: string) {
    setCerita((c) => (c.trim() ? `${c.trimEnd()} ${teks}` : teks).slice(0, MAKS_CERITA));
  }

  return (
    <AppShell>
      {awal && (
        <KartuAwal
          sekarang={2}
          ilustrasi={<IlustrasiCatat />}
          judul="Tinggal satu langkah lagi"
          aksi={
            <Link
              href="/profil"
              data-tur="kembali-profil"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#d5dce8] bg-white px-5 text-[15px] font-semibold text-primary transition-colors hover:bg-[#f4f6fa]"
            >
              <ArrowLeft className="size-4" aria-hidden /> Kembali ke profil rumah
            </Link>
          }
        >
          Ceritakan alat di rumahmu seperti ngobrol. AI mengisi daftarnya, kamu cek di tab <b className="text-foreground">Isi form</b>, lalu tekan{" "}
          <b className="text-foreground">Simpan &amp; audit</b>.
        </KartuAwal>
      )}
      <PageHead
        judul={awal ? "Ceritakan rumahmu" : "Data rumah"}
        keterangan={awal ? "Langkah terakhir sebelum hasil audit pertamamu." : "Alat listrik dan kebiasaan air di rumahmu. Semua hitungan biaya berangkat dari sini."}
      />

      {/* Tur sorot sekali per akun saat onboarding */}
      <TurOtomatis
        id="cerita"
        mulai={awal && tab === "cerita"}
        langkah={[
          { sasaran: "ubah-profil", judul: "Salah isi profil?", isi: "Penghuni, daya, atau tarif bisa diubah kapan saja lewat tombol ini. Bisa juga kembali ke langkah 1 dari kartu di atas." },
          { sasaran: "cerita-tulis", judul: "Tulis di sini", isi: "Ceritakan alat listrik dan kebiasaan air di rumahmu, pakai bahasa sehari-hari. Tidak perlu tahu watt." },
          { sasaran: "cerita-contoh", judul: "Bingung mulai dari mana?", isi: "Ketuk kalimat contoh ini untuk menambahkannya ke cerita, lalu ubah sesuai rumahmu." },
          { sasaran: "cerita-proses", judul: "Biar AI yang mengisi", isi: "Tekan Proses cerita. AI menyusun daftar alat dan kebiasaan air dalam beberapa detik." },
          { sasaran: "tab-form", judul: "Cek hasilnya di sini", isi: "Hasil cerita masuk ke tab Isi form. Kamu juga bisa langsung mengisi form tanpa bercerita." },
        ]}
      />
      <TurOtomatis
        id="form"
        mulai={awal && tab === "form" && alat.length > 0}
        langkah={[
          { sasaran: "form-alat", judul: "Daftar alat di rumahmu", isi: "Kotak bergaris putus-putus adalah perkiraan AI. Cek jam pakai dan watt-nya, ubah kalau kurang pas." },
          { sasaran: "simpan-audit", judul: "Terakhir, Simpan & audit", isi: "Data disimpan, biaya tiap alat dihitung, dan AI mencari biang boros. Setelah itu semua menu terbuka." },
        ]}
      />

      {/* Ringkasan profil rumah + jalan masuk untuk mengubahnya */}
      {siap && <ProfilRingkas profil={profil} onUbah={() => setUbahProfil(true)} />}

      <Tabs value={tab} onValueChange={(v) => gantiTab(v as "cerita" | "form")} className="mb-5 gap-0">
        <TabsList className="h-12! rounded-[14px] bg-[#eef2f8] p-1" aria-label="Cara mengisi data rumah">
          {(
            [
              ["cerita", "Ceritakan", MessageSquareText],
              ["form", "Isi form", List],
            ] as const
          ).map(([nilai, label, Icon]) => (
            <TabsTrigger
              key={nilai}
              value={nilai}
              data-tur={nilai === "form" ? "tab-form" : undefined}
              className="h-full min-w-[128px] rounded-[10px] px-4 text-[15.5px] font-semibold text-[#5a6782] after:hidden data-active:bg-white data-active:text-primary data-active:shadow-[0_1px_3px_rgba(20,37,64,.14)]"
            >
              <Icon aria-hidden />
              {label}
              {nilai === "form" && alat.length > 0 && (
                <span className="ml-0.5 text-[13.5px] font-bold text-[#8a98b0] tabular-nums">{alat.length}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {rumah.loading && !rumah.data && <Loading judul="Memuat data rumah..." bentuk="form" />}
      {rumah.error && !rumah.data && <ErrorState pesan={pesanError(rumah.error)} onRetry={() => rumah.muat()} />}

      {siap && tab === "cerita" && (
        <div className="grid items-start gap-4 md:gap-5 xl:grid-cols-[1fr_330px]">
          <section className={cn(KARTU, "flex flex-col overflow-hidden")}>
            <div className="px-5 pt-5 md:px-7 md:pt-7">
              <label htmlFor="cerita" className="block text-[20px] font-bold tracking-tight text-primary">
                Ceritakan alat dan kebiasaan di rumah
              </label>
              <p className={cn("mt-1 text-[15.5px]", REDUP)}>Pakai bahasa sehari-hari, seperti bercerita ke tetangga. Tidak perlu tahu watt.</p>
            </div>

            <textarea
              data-tur="cerita-tulis"
              id="cerita"
              value={cerita}
              onChange={(e) => setCerita(e.target.value.slice(0, MAKS_CERITA))}
              placeholder="Contoh: Di rumah ada 4 orang. AC satu di kamar, nyala dari jam 9 malam sampai subuh. Kulkas satu. TV nyala hampir seharian..."
              className="mx-5 mt-4 min-h-[200px] w-[calc(100%-2.5rem)] resize-y rounded-2xl border-[1.5px] border-[#d5dce8] bg-[#fbfcfe] px-4 py-3.5 text-[17px] leading-[1.7] text-foreground transition-[border-color,box-shadow,background-color] outline-none placeholder:text-[#a3afc2] hover:border-[#b9c4d6] focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(31,51,84,.08)] disabled:opacity-60 md:mx-7 md:w-[calc(100%-3.5rem)]"
              disabled={sedangCerita}
            />

            <div className="px-5 pt-4 pb-5 md:px-7">
              <p className="mb-2.5 text-[14px] font-semibold text-[#8a98b0]">Bingung mulai dari mana? Ketuk kalimat ini:</p>
              <div className="flex flex-wrap gap-2" data-tur="cerita-contoh">
                {CONTOH.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => sisipkanContoh(c)}
                    disabled={sedangCerita}
                    className="rounded-full border border-[#dfe5ee] bg-[#f7f9fc] px-3.5 py-2 text-left text-[14px] text-[#3c4a66] transition-colors hover:border-[#c5cfdf] hover:bg-white disabled:opacity-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f8] bg-[#fafbfd] px-5 py-4 md:px-7">
              <p className={cn("text-[14px] tabular-nums", cerita.length >= MAKS_CERITA ? "font-semibold text-warn" : "text-[#8a98b0]")}>
                {cerita.length} / {MAKS_CERITA} karakter
              </p>
              <Button
                onClick={prosesCerita}
                data-tur="cerita-proses"
                disabled={sedangCerita || cerita.trim().length < 10}
                size="lg"
                className="h-12 rounded-full px-6 text-[16px] max-sm:w-full"
              >
                {sedangCerita ? <Loader2 className="animate-spin" aria-hidden /> : <Wand2 aria-hidden />}
                {sedangCerita ? "Memproses..." : "Proses cerita"}
              </Button>
            </div>
          </section>

          <aside className={cn(KARTU, "p-5 md:p-6")}>
            <h2 className="text-[17px] font-bold text-primary">Yang perlu diceritakan</h2>
            <dl className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed">
              {(
                [
                  [Plug, "Alat listrik", "Apa saja yang ada, berapa banyak, dan kira-kira nyala berapa lama."],
                  [Users, "Penghuni", "Berapa orang yang tinggal di rumah."],
                  [Droplet, "Kebiasaan air", "Mandi pakai apa, cuci baju berapa kali, siram tanaman, cuci motor."],
                ] as const
              ).map(([Icon, judul, isi]) => (
                <div key={judul} className="flex gap-3">
                  <Icon className="mt-1 size-[18px] shrink-0 text-[#8a98b0]" aria-hidden />
                  <div>
                    <dt className="font-semibold text-foreground">{judul}</dt>
                    <dd className={REDUP}>{isi}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className={cn("mt-5 border-t border-[#eef2f8] pt-4 text-[14.5px] leading-relaxed", REDUP)}>
              AI mengubah ceritamu jadi isian di tab <b className="text-foreground">Isi form</b>. Kamu cek dan ubah dulu sebelum disimpan. Ceritanya sendiri
              tidak disimpan.
            </p>
            {alat.length > 0 && (
              <p className={cn("mt-3 text-[14.5px] leading-relaxed", REDUP)}>
                Form sekarang berisi <b className="text-foreground">{alat.length} alat</b>. Nanti kamu bisa pilih: tambahkan ke daftar atau ganti semua.
              </p>
            )}
          </aside>

          <div className="flex flex-col gap-4 empty:hidden xl:col-span-2">

            {catatanAi.length > 0 && !sedangCerita && (
              <div className="rounded-[18px] bg-listrik-soft px-4 py-3 text-[14.5px] text-listrik-foreground">
                <b>Perlu dicek:</b> {catatanAi.join(" · ")}
              </div>
            )}
          </div>
        </div>
      )}

      {siap && tab === "form" && (
        <>
          <div className="flex flex-col gap-4 md:gap-5">
            <section className={cn(KARTU, "min-w-0 overflow-hidden")} data-tur="form-alat">
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
                <div>
                  <h2 className="text-[19px] font-bold tracking-tight text-primary">Alat listrik</h2>
                  <p className={cn("mt-0.5 text-[14.5px]", REDUP)}>Isi kira-kira saja. Jam per hari boleh pecahan, misalnya 0,5.</p>
                </div>
                <TambahAlat preset={preset.data?.alat ?? []} onTambah={(a) => setAlat((lama) => [...lama, a])} />
              </div>

              {jumlahPerkiraan > 0 && (
                <p className={cn("mx-5 mt-4 flex items-center gap-2.5 text-[14px] md:mx-6", REDUP)}>
                  <span className="h-6 w-9 shrink-0 rounded-md border border-dashed border-[#b9b19f] bg-[#fdfbf6]" aria-hidden />
                  Kotak bergaris putus-putus adalah perkiraan AI. Cek lagi angkanya, lalu ubah kalau kurang pas.
                </p>
              )}

              <div className="mt-3 px-2 pb-3 md:px-3">
                <AlatTable
                  alat={alat}
                  salah={salahData}
                  onChange={(i, key, value) => {
                    setAlat((lama) => lama.map((a, j) => (j === i ? { ...a, [key]: value, dari_ai: false } : a)));
                    setSalahData((s) => tanpa(s, `alat.${i}.${key}`));
                  }}
                  onHapus={(i) => {
                    setAlat((lama) => lama.filter((_, j) => j !== i));
                    // nomor baris bergeser, jadi tanda salah alat dicek ulang saat simpan berikutnya
                    setSalahData((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith("alat."))));
                  }}
                />
              </div>
              <p className="border-t border-[#eef2f8] px-5 py-3.5 text-[13.5px] text-[#8a98b0] md:px-6">
                Ada {preset.data?.alat.length ?? 16} alat umum di daftar. Alat yang tidak ada bisa ditambahkan sebagai “Alat lain”.
              </p>
            </section>

            <KebiasaanAirForm
              nilai={kebiasaan}
              salah={salahData}
              onChange={(k) => {
                // hapus tanda salah hanya untuk isian yang berubah
                for (const kunci of Object.keys(k) as (keyof KebiasaanAir)[]) {
                  if (k[kunci] !== kebiasaan[kunci]) setSalahData((s) => tanpa(s, `kebiasaan_air.${kunci}`));
                }
                setKebiasaan(k);
              }}
            />
          </div>

          {/* Satu-satunya tombol simpan: bar menempel di bawah layar */}
          <div className="sticky bottom-[96px] z-20 mt-5 lg:bottom-5" data-tur="simpan-audit">
            <div className="flex items-center gap-3 rounded-[22px] bg-[#0b1628] p-2.5 pl-4 text-white shadow-[0_20px_44px_-16px_rgba(11,22,40,.7)] ring-1 ring-white/10 md:p-3 md:pl-5">
              <div className="min-w-0 flex-1">
                {errSimpan ? (
                  <p role="alert" className="text-[14.5px] font-semibold text-[#ff9a5c]">
                    {errSimpan}
                  </p>
                ) : (
                  <>
                    <p className="text-[15.5px] leading-snug font-bold text-white">
                      {alat.length > 0 ? <>{alat.length} alat<span className="max-sm:hidden"> siap dihitung</span></> : "Belum ada alat"}
                      {jumlahPerkiraan > 0 && <span className="block font-semibold text-[#f2b632] sm:inline"><span className="max-sm:hidden"> · </span>{jumlahPerkiraan} perkiraan AI</span>}
                    </p>
                    <p className="text-[13.5px] text-[#9fb1d1] max-md:hidden">kWh, Rupiah, dan skor dihitung dari data ini. AI hanya menjelaskan hasilnya.</p>
                  </>
                )}
              </div>
              <Button
                onClick={simpanDanAudit}
                disabled={sedangSimpan || alat.length === 0}
                size="lg"
                className="h-12 shrink-0 rounded-full bg-white px-5 text-[16px] text-primary hover:bg-white/90 md:px-6"
              >
                {sedangSimpan ? <Loader2 className="animate-spin" aria-hidden /> : <Calculator aria-hidden />}
                {sedangSimpan ? "AI sedang menganalisis..." : "Simpan & audit"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Modal ubah profil: form yang sama dengan halaman /profil */}
      <Dialog open={ubahProfil} onOpenChange={setUbahProfil}>
        <DialogContent className="gap-2 sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Ubah profil rumah</DialogTitle>
            <DialogDescription>Dipakai untuk semua hitungan Rupiah. Ubah kalau tarif atau daya berganti.</DialogDescription>
          </DialogHeader>
          {ubahProfil && (
            <ProfilForm
              padat
              awal={profil}
              onTersimpan={() => {
                setUbahProfil(false);
                void rumah.muat(true);
                toast.success("Profil rumah tersimpan");
              }}
              batal={
                <Button type="button" variant="outline" onClick={() => setUbahProfil(false)}>
                  Batal
                </Button>
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Proses AI tampil sebagai modal yang tidak bisa ditutup sampai selesai */}
      <ProsesAi
        buka={sedangCerita}
        judul="AI sedang membaca ceritamu"
        langkah={["Membaca ceritamu...", "Mencari alat yang kamu sebut...", "Memperkirakan jam pakai dan watt...", "Menyiapkan isian form..."]}
        gagal={
          errCerita && {
            error: errCerita,
            judul: "Cerita belum bisa diproses",
            catatan: "Ceritamu masih ada di kotak, tidak perlu diketik ulang.",
            onCobaLagi: prosesCerita,
            kembali: {
              label: "Isi form manual",
              onClick: () => {
                setErrCerita(null);
                gantiTab("form");
              },
            },
          }
        }
      />
      <ProsesAi
        buka={sedangSimpan}
        judul="Rumahmu sedang diaudit"
        langkah={["Menyimpan data rumah...", "Menghitung kWh dan Rupiah tiap alat...", "AI mencari biang boros...", "Menyusun rencana hemat..."]}
        gagal={
          gagalAudit && {
            error: gagalAudit.error,
            judul: "Audit belum berhasil",
            catatan: gagalAudit.tersimpan ? "Data rumahmu sudah tersimpan, tinggal auditnya." : undefined,
            onCobaLagi: simpanDanAudit,
            kembali: { label: "Atur data dulu", onClick: () => setGagalAudit(null) },
          }
        }
      />

      <GabungCerita hasil={tanyaGabung} alatLama={alat} onPilih={pakaiHasilCerita} onBatal={() => setTanyaGabung(null)} />
    </AppShell>
  );
}

/** Baris ringkas profil rumah di atas tab, dengan tautan ubah ke /profil. */
function ProfilRingkas({ profil, onUbah }: { profil: Profil | null; onUbah: () => void }) {
  if (!profil) {
    return (
      <Link
        href="/profil"
        className={cn(KARTU, "group mb-6 flex items-center gap-4 p-4 pr-5 transition-colors hover:border-[#cfd8e6] md:p-5")}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <House className="size-[22px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold text-foreground">Profil rumah belum diisi</p>
          <p className={cn("text-[14.5px]", REDUP)}>Isi penghuni, daya, dan tarif dulu supaya hitungan Rupiah tepat.</p>
        </div>
        <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    );
  }

  const isian: [string, string][] = [
    ["Penghuni", `${profil.penghuni} orang`],
    ["Daya", `${profil.daya_va.toLocaleString("id-ID")} VA`],
    ["Listrik", profil.jenis_listrik === "token" ? "Token" : "Tagihan bulanan"],
    ["Tarif listrik", `${rupiah(profil.tarif_listrik)}/kWh`],
    ["Tarif air", profil.tarif_air != null ? `${rupiah(profil.tarif_air)}/m³` : "Tidak pakai PDAM"],
  ];

  return (
    <section className={cn(KARTU, "mb-6 flex items-center gap-3 p-3.5 pl-4 md:gap-6 md:p-5 md:pl-6")}>
      <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[150px] md:flex-none md:shrink-0">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <House className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] leading-tight font-bold text-primary">Profil rumah</p>
          <p className={cn("mt-0.5 truncate text-[14px] md:hidden", REDUP)}>
            {profil.penghuni} orang · {profil.daya_va.toLocaleString("id-ID")} VA · {profil.jenis_listrik === "token" ? "Token" : "Tagihan"}
          </p>
        </div>
      </div>
      <dl className="hidden flex-1 gap-x-6 gap-y-3 md:grid md:grid-cols-3 lg:grid-cols-5">
        {isian.map(([label, nilai]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[13px] text-[#8a98b0]">{label}</dt>
            <dd className="truncate text-[15px] font-semibold text-foreground tabular-nums">{nilai}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        data-tur="ubah-profil"
        onClick={onUbah}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#d5dce8] px-4 text-[14.5px] font-semibold text-primary transition-colors hover:bg-[#f4f6fa]"
      >
        <Pencil className="size-4" aria-hidden />
        Ubah<span className="max-sm:hidden"> profil</span>
      </button>
    </section>
  );
}

export default function RumahPage() {
  return (
    <Suspense fallback={<Loading judul="Menyiapkan halaman..." />}>
      <RumahClient />
    </Suspense>
  );
}

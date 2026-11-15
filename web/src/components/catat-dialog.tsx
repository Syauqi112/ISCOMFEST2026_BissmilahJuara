"use client";

// Dialog "Catat pemakaian" dari Beranda. Dua tab: listrik per bulan, air per minggu.
// Juga dipakai untuk mengubah catatan dari Riwayat catatan (`ubah`): bulan/tanggal dikunci,
// backend menimpa catatan di periode yang sama.
// Isi form baru dibuat saat dialog dibuka, jadi tanggal default diambil dari jam
// perangkat pada saat itu (bukan saat prerender).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { angka, rupiah, tanggal as fmtTanggal } from "@/lib/format";
import { PesanSalah, tandaSalah } from "@/components/pesan-salah";
import { cekForm, salahDariServer, skemaCatatAir, skemaCatatListrik, tanpa, type Salah } from "@/lib/validasi";
import { cn } from "@/lib/utils";
import type { CatatanPemakaian, JenisPemakaian, LonjakanRingkas } from "@/lib/types";

/** Catatan yang sedang diubah. `periode` = "YYYY-MM" (listrik) atau "YYYY-MM-DD" (air). */
export type CatatanUbah = { jenis: JenisPemakaian; periode: string; nilai: number };

/** Tanggal hari ini menurut jam perangkat (bukan UTC), "YYYY-MM-DD". */
function hariIniLokal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CatatDialog({
  buka,
  onOpenChange,
  catatanAir,
  ubah,
  jenisAwal = "listrik",
  onSukses,
}: {
  buka: boolean;
  /** Tab yang aktif saat dialog dibuka (mis. ikut tab grafik di Beranda). */
  jenisAwal?: JenisPemakaian;
  onOpenChange: (b: boolean) => void;
  /** Semua catatan air, untuk mengecek angka meteran terhadap catatan sebelum & sesudahnya. */
  catatanAir?: CatatanPemakaian[];
  ubah?: CatatanUbah | null;
  onSukses: () => void;
}) {
  return (
    <Dialog open={buka} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {buka && <IsiDialog catatanAir={catatanAir ?? []} ubah={ubah ?? null} jenisAwal={jenisAwal} onSukses={onSukses} onTutup={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/** Pilihan Listrik / Air (segmented). Dipakai juga di Riwayat catatan. */
export function PilihJenis({ jenis, onPilih }: { jenis: JenisPemakaian; onPilih: (j: JenisPemakaian) => void }) {
  return (
    <div className="inline-grid h-11 w-fit grid-cols-2 gap-1 rounded-[14px] bg-[#eef2f8] p-1" role="tablist" aria-label="Jenis pemakaian">
      {(
        [
          ["listrik", "Listrik", Zap],
          ["air", "Air", Droplet],
        ] as const
      ).map(([nilai, label, Icon]) => (
        <button
          key={nilai}
          type="button"
          role="tab"
          aria-selected={jenis === nilai}
          onClick={() => onPilih(nilai)}
          className={cn(
            "flex min-w-[96px] items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-semibold transition-colors",
            jenis === nilai ? "bg-white text-primary shadow-[0_1px_3px_rgba(20,37,64,.14)]" : "text-[#5a6782] hover:text-primary",
          )}
        >
          <Icon className={cn("size-4", nilai === "listrik" ? "text-listrik" : "text-air")} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
/** "2026-11" -> "November 2026" */
export const labelBulanPanjang = (periode: string) => `${BULAN_PANJANG[Number(periode.slice(5, 7)) - 1] ?? ""} ${periode.slice(0, 4)}`;

function IsiDialog({
  catatanAir,
  ubah,
  jenisAwal,
  onSukses,
  onTutup,
}: {
  catatanAir: CatatanPemakaian[];
  ubah: CatatanUbah | null;
  jenisAwal: JenisPemakaian;
  onSukses: () => void;
  onTutup: () => void;
}) {
  const router = useRouter();
  const hariIni = hariIniLokal();
  const [jenis, setJenis] = useState<JenisPemakaian>(ubah?.jenis ?? jenisAwal);
  const [periode, setPeriode] = useState(ubah?.jenis === "listrik" ? ubah.periode : hariIni.slice(0, 7));
  const [nilaiRp, setNilaiRp] = useState(ubah?.jenis === "listrik" ? String(ubah.nilai) : "");
  const [tanggal, setTanggal] = useState(ubah?.jenis === "air" ? ubah.periode : hariIni);
  const [meteran, setMeteran] = useState(ubah?.jenis === "air" ? String(ubah.nilai).replace(".", ",") : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salah, setSalah] = useState<Salah>({});

  const nilaiMeteran = Number(meteran.replace(",", "."));

  async function simpan() {
    setError(null);
    const cek =
      jenis === "listrik"
        ? cekForm(skemaCatatListrik, { nilai_rp: nilaiRp === "" ? undefined : Number(nilaiRp) })
        : cekForm(skemaCatatAir, { angka_meteran: meteran === "" || Number.isNaN(nilaiMeteran) ? undefined : nilaiMeteran });
    if (!cek.ok) {
      setSalah(cek.salah);
      return;
    }
    setSalah({});
    setLoading(true);
    try {
      const hasil = await api<{ lonjakan: LonjakanRingkas | null }>("/pemakaian", {
        method: "POST",
        json:
          jenis === "listrik"
            ? { jenis, periode, nilai_rp: Number(nilaiRp) }
            : { jenis, tanggal, angka_meteran: nilaiMeteran },
      });
      onTutup();
      onSukses();
      if (hasil?.lonjakan) {
        const l = hasil.lonjakan;
        toast.warning(`Pemakaian naik ${l.rasio}× dari biasanya. Cek penyebabnya.`, {
          action: { label: "Cek", onClick: () => router.push(`/lonjakan/${l.catatan_id}`) },
        });
      } else {
        toast.success(ubah ? "Catatan diperbarui." : "Catatan tersimpan.");
      }
    } catch (e) {
      const dariServer = salahDariServer(e);
      // Isian bulan/tanggal disembunyikan saat mengubah: pesannya ke kotak umum.
      const tampil = dariServer && Object.keys(dariServer).some((k) => k === "nilai_rp" || k === "angka_meteran" || !ubah);
      if (dariServer && tampil) setSalah(dariServer);
      else setError(e instanceof ApiError ? e.pesan : "Tidak bisa menyimpan. Coba lagi.");
      setLoading(false);
    }
  }

  // Meteran air selalu naik: harus di antara catatan sebelum dan sesudah tanggal ini (aturan sama dengan backend).
  const sebelum = catatanAir.filter((c) => c.periode < tanggal).at(-1);
  const sesudah = catatanAir.find((c) => c.periode > tanggal);
  const meteranValid = (!sebelum || nilaiMeteran > sebelum.nilai) && (!sesudah || nilaiMeteran < sesudah.nilai);
  const petunjukMeteran = [
    sebelum && `lebih besar dari ${angka(sebelum.nilai)} m³ (${fmtTanggal(sebelum.periode)})`,
    sesudah && `lebih kecil dari ${angka(sesudah.nilai)} m³ (${fmtTanggal(sesudah.periode)})`,
  ].filter(Boolean);
  // Kalau salah, jelaskan kenapa: meteran air hanya bisa naik seiring waktu.
  const salahMeteran =
    meteran === "" || meteranValid
      ? null
      : sesudah && nilaiMeteran >= sesudah.nilai
        ? `Pada ${fmtTanggal(sesudah.periode)} meteranmu sudah ${angka(sesudah.nilai)} m³, jadi pada ${fmtTanggal(tanggal)} angkanya pasti lebih kecil.${ubah ? "" : tanggal < hariIniLokal() ? " Mau mencatat bacaan hari ini? Ganti dulu tanggalnya." : ""}`
        : sebelum
          ? `Meteran air selalu naik. Pada ${fmtTanggal(sebelum.periode)} sudah ${angka(sebelum.nilai)} m³, jadi angkanya harus lebih besar.`
          : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{ubah ? "Ubah catatan" : "Catat pemakaian"}</DialogTitle>
        <DialogDescription>
          {ubah
            ? `${ubah.jenis === "listrik" ? "Tagihan listrik" : "Meteran air"} ${ubah.jenis === "listrik" ? labelBulanPanjang(ubah.periode) : fmtTanggal(ubah.periode)}. Grafik dan lonjakan dihitung ulang setelah disimpan.`
            : "Catat satu angka saja per kunjungan. Tidak perlu langsung dua-duanya."}
        </DialogDescription>
      </DialogHeader>

      {!ubah && (
        <PilihJenis
          jenis={jenis}
          onPilih={(j) => {
            setJenis(j);
            setError(null);
            setSalah({});
          }}
        />
      )}

      {jenis === "listrik" ? (
        <div className="flex flex-col gap-3">
          {!ubah && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="periode">Bulan tagihan</Label>
              <Input
                id="periode"
                type="month"
                max={hariIni.slice(0, 7)}
                value={periode}
                onChange={(e) => {
                  setPeriode(e.target.value);
                  setSalah((s) => tanpa(s, "periode"));
                }}
                {...tandaSalah("periode", salah.periode)}
              />
              <PesanSalah id="periode-salah" pesan={salah.periode} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nilai-rp">Total tagihan atau beli token</Label>
            <Input
              id="nilai-rp"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Contoh: 521000"
              value={nilaiRp}
              onChange={(e) => {
                setNilaiRp(e.target.value.replace(/^0+(?=\d)/, ""));
                setSalah((s) => tanpa(s, "nilai_rp"));
              }}
              autoFocus={!!ubah}
              {...tandaSalah("nilai-rp", salah.nilai_rp)}
            />
            {/* Ditulis ulang dalam Rupiah supaya jumlah nol kelihatan */}
            {Number(nilaiRp) > 0 && <p className="tabular text-[15px] font-bold text-primary">{rupiah(Number(nilaiRp))}</p>}
            <PesanSalah id="nilai-rp-salah" pesan={salah.nilai_rp} />
            <p className="text-[13px] text-muted-foreground">
              Kalau token, isi total Rupiah yang kamu beli bulan itu. Pemakaian kWh-nya jadi perkiraan.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {!ubah && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tanggal">Tanggal baca meteran</Label>
              <Input
                id="tanggal"
                type="date"
                max={hariIni}
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                  setSalah((s) => tanpa(tanpa(s, "tanggal"), "angka_meteran"));
                }}
                {...tandaSalah("tanggal", salah.tanggal)}
              />
              <PesanSalah id="tanggal-salah" pesan={salah.tanggal} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meteran">Angka meteran air (m³)</Label>
            <Input
              id="meteran"
              type="text"
              inputMode="decimal"
              placeholder="Contoh: 1284,6"
              value={meteran}
              onChange={(e) => {
                setMeteran(e.target.value);
                setSalah((s) => tanpa(s, "angka_meteran"));
              }}
              autoFocus={!!ubah}
              {...tandaSalah("meteran", salah.angka_meteran)}
              aria-invalid={(meteran !== "" && !meteranValid) || !!salah.angka_meteran}
            />
            <PesanSalah id="meteran-salah" pesan={salah.angka_meteran} />
            <p className={cn("text-[13px]", meteran !== "" && !meteranValid ? "font-semibold text-warn" : "text-muted-foreground")}>
              {salahMeteran ??
                (petunjukMeteran.length
                  ? `Meteran air selalu naik, jadi angkanya harus ${petunjukMeteran.join(" dan ")}.`
                  : "Angka di meteran PDAM, biasanya ada desimalnya.")}
            </p>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-warn-soft px-4 py-3 text-[15px] font-semibold text-warn">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onTutup} disabled={loading}>
          Batal
        </Button>
        <Button onClick={simpan} disabled={loading || (jenis === "listrik" ? !nilaiRp : !meteran || !meteranValid)}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </>
  );
}

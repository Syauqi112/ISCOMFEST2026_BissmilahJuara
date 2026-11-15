"use client";

// Editor data rumah: tabel alat + kebiasaan air. Dipakai di tab "Isi form" dan
// menerima hasil tab "Ceritakan". Satu-satunya jalur simpan ke backend.
import { useMemo, useState } from "react";
import { InputAngka } from "@/components/input-angka";
import { PesanSalah, tandaSalah } from "@/components/pesan-salah";
import { skemaNamaAlat, type Salah } from "@/lib/validasi";
import { IlustrasiColokan } from "@/components/ilustrasi";
import { Plus, Search, Trash2 } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { ikonAlat, toneAlat } from "@/components/alat-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Alat, AlatPreset, KebiasaanAir } from "@/lib/types";

const kolom: { key: keyof Pick<Alat, "jumlah" | "jam_per_hari" | "hari_per_minggu" | "watt">; label: string; max: number; step: string }[] = [
  { key: "jumlah", label: "Jumlah", max: 50, step: "1" },
  { key: "jam_per_hari", label: "Jam / hari", max: 24, step: "0.5" },
  { key: "hari_per_minggu", label: "Hari / minggu", max: 7, step: "1" },
  { key: "watt", label: "Watt", max: 5000, step: "1" },
];

export function AlatTable({
  alat,
  onChange,
  onHapus,
  salah = {},
}: {
  alat: Alat[];
  onChange: (index: number, key: keyof Alat, value: number) => void;
  onHapus: (index: number) => void;
  /** Pesan salah per isian, kunci "alat.<i>.<kolom>" (lib/validasi). */
  salah?: Salah;
}) {
  if (alat.length === 0) {
    return (
      <div className="flex flex-col items-center px-3 py-8 text-center">
        <IlustrasiColokan className="max-w-[220px]" />
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#5a6782]">
          Belum ada alat. Tambahkan satu per satu, atau pakai tab <b>Ceritakan</b> supaya AI yang mengisi.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="max-md:block [&_tbody]:max-md:block">
        <TableHeader className="max-md:hidden">
          <TableRow className="border-[#eef2f8] hover:bg-transparent">
            <TableHead className="min-w-[180px] text-[13.5px] font-semibold text-[#8a98b0]">Alat</TableHead>
            {kolom.map((k) => (
              <TableHead key={k.key} className="text-center text-[13.5px] font-semibold text-[#8a98b0]">
                {k.label}
              </TableHead>
            ))}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {alat.map((a, i) => {
            const Icon = ikonAlat(a.nama);
            return (
              <TableRow
                key={`${a.nama}-${i}`}
                className="relative border-[#eef2f8] hover:bg-[#fafbfd] max-md:grid max-md:grid-cols-2 sm:max-md:grid-cols-4 max-md:gap-x-3 max-md:gap-y-2.5 max-md:px-2 max-md:py-4"
              >
                <TableCell className="py-2.5 max-md:col-span-2 sm:max-md:col-span-4 max-md:p-0 max-md:pr-12">
                  <div className="flex min-w-0 items-center gap-3 text-[15.5px] font-bold text-foreground">
                    <IconTile icon={Icon} tone={toneAlat(a.nama)} size="sm" />
                    {/* HP: nama panjang turun baris supaya halaman tidak melebar; layar lebar: satu baris */}
                    <span className="min-w-0 break-words md:whitespace-nowrap">{a.nama}</span>
                  </div>
                  <PesanSalah id={`alat-${i}-nama-salah`} pesan={salah[`alat.${i}.nama`]} className="mt-1.5 text-[12.5px]" />
                </TableCell>
                {kolom.map((k) => (
                  <TableCell
                    key={k.key}
                    data-label={k.label}
                    className="text-center max-md:flex max-md:flex-col max-md:gap-1 max-md:p-0 max-md:text-left max-md:before:text-[12.5px] max-md:before:font-semibold max-md:before:text-[#8a98b0] max-md:before:content-[attr(data-label)]"
                  >
                    <InputAngka
                      inputMode="decimal"
                      min={0}
                      max={k.max}
                      step={k.step}
                      nilai={a[k.key] as number}
                      aria-label={`${k.label} ${a.nama}`}
                      onNilai={(n) => onChange(i, k.key, n ?? 0)}
                      {...tandaSalah(`alat-${i}-${k.key}`, salah[`alat.${i}.${k.key}`])}
                      className={cn(
                        "mx-auto h-11 w-[76px] max-md:w-full rounded-xl border-[#d5dce8] bg-white text-center text-[16px] font-semibold tabular-nums",
                        // Kolom hasil perkiraan AI ditandai garis putus-putus.
                        a.dari_ai && "border-dashed border-[#b9b19f] bg-[#fdfbf6]",
                      )}
                    />
                    <PesanSalah
                      id={`alat-${i}-${k.key}-salah`}
                      pesan={salah[`alat.${i}.${k.key}`]}
                      className="mx-auto mt-1 max-w-[110px] justify-center text-[12.5px] max-md:mx-0 max-md:max-w-none max-md:justify-start"
                    />
                  </TableCell>
                ))}
                <TableCell className="max-md:absolute max-md:top-3 max-md:right-1 max-md:p-0">
                  <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${a.nama}`} onClick={() => onHapus(i)}>
                    <Trash2 aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/** Dialog tambah alat: pilih dari daftar umum, atau isi sendiri untuk "Alat lain". */
export function TambahAlat({ preset, onTambah }: { preset: AlatPreset[]; onTambah: (a: Alat) => void }) {
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const [namaLain, setNamaLain] = useState("");
  const [wattLain, setWattLain] = useState("");

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return q ? preset.filter((p) => p.nama.toLowerCase().includes(q)) : preset;
  }, [cari, preset]);

  function tambahPreset(p: AlatPreset) {
    onTambah({ preset_id: p.id, nama: p.nama, jumlah: 1, jam_per_hari: 1, hari_per_minggu: 7, watt: p.watt, dari_ai: false });
    setBuka(false);
    setCari("");
  }

  const cekNama = skemaNamaAlat.safeParse(namaLain);
  const salahNama = namaLain.trim() && !cekNama.success ? cekNama.error.issues[0]?.message : undefined;

  function tambahLain() {
    if (!namaLain.trim() || salahNama) return;
    onTambah({
      preset_id: null,
      nama: namaLain.trim(),
      jumlah: 1,
      jam_per_hari: 1,
      hari_per_minggu: 7,
      watt: Number(wattLain) || 0,
      dari_ai: false,
    });
    setBuka(false);
    setNamaLain("");
    setWattLain("");
  }

  return (
    <Dialog open={buka} onOpenChange={setBuka}>
      <DialogTrigger render={<Button variant="outline" className="h-10 rounded-full border-[#d5dce8] px-4 text-[15px] font-semibold text-primary" />}>
        <Plus aria-hidden />
        Tambah alat
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah alat</DialogTitle>
          <DialogDescription>Pilih dari 16 alat umum, atau isi sendiri kalau alatmu tidak ada di daftar.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari alat..." className="pl-9" aria-label="Cari alat" />
        </div>

        <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {hasil.map((p) => {
            const Icon = ikonAlat(p.nama);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => tambahPreset(p)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted">
                  <IconTile icon={Icon} tone={toneAlat(p.nama)} size="sm" />
                  <span className="flex-1 font-semibold">{p.nama}</span>
                  <span className="text-[13px] text-muted-foreground">{p.watt} W</span>
                </button>
              </li>
            );
          })}
          {hasil.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada alat yang cocok. Pakai kolom di bawah.</li>}
        </ul>

        <div className="rounded-lg bg-secondary p-3">
          <p className="mb-2 text-sm font-semibold">Alat lain</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
            <Input
              value={namaLain}
              onChange={(e) => setNamaLain(e.target.value)}
              placeholder="Nama alat"
              aria-label="Nama alat lain"
              maxLength={60}
              {...tandaSalah("nama-lain", salahNama)}
            />
            <Input value={wattLain} onChange={(e) => setWattLain(e.target.value)} type="number" inputMode="numeric" placeholder="Watt" aria-label="Watt alat lain" />
            <Button type="button" onClick={tambahLain} disabled={!namaLain.trim() || !!salahNama}>
              Tambah
            </Button>
          </div>
          <PesanSalah id="nama-lain-salah" pesan={salahNama} className="mt-2" />
          <p className="mt-2 text-[13px] text-muted-foreground">Watt bisa dilihat di label alat atau buku manual.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setBuka(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Kebiasaan air: 6 pertanyaan, semuanya memakai bahasa sehari-hari. */
export function KebiasaanAirForm({ nilai, onChange, salah = {} }: { nilai: KebiasaanAir; onChange: (k: KebiasaanAir) => void; salah?: Salah }) {
  function ubah<K extends keyof KebiasaanAir>(k: K, v: KebiasaanAir[K]) {
    onChange({ ...nilai, [k]: v });
  }

  return (
    <Card className="gap-5 rounded-[24px] border border-[#e3e8f0] bg-white p-5 ring-0 md:p-6 [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-xl [&_[data-slot=input]]:border-[#d5dce8] [&_[data-slot=input]]:bg-white [&_[data-slot=input]]:px-4 [&_[data-slot=input]]:text-[16px] [&_[data-slot=label]]:text-[14.5px] [&_[data-slot=label]]:text-[#3c4a66] [&_[data-slot=select-trigger]]:h-12! [&_[data-slot=select-trigger]]:rounded-xl [&_[data-slot=select-trigger]]:border-[#d5dce8] [&_[data-slot=select-trigger]]:bg-white [&_[data-slot=select-trigger]]:px-4 [&_[data-slot=select-trigger]]:text-[16px]">
      <div className="flex items-center gap-3">
        <IconTile icon={ikonAlat("pompa air")} tone="air" size="sm" />
        <div>
          <p className="text-[19px] font-bold tracking-tight text-primary">Kebiasaan air</p>
          <p className="text-[14px] text-[#5a6782]">Dipakai untuk memperkirakan pemakaian PDAM.</p>
        </div>
      </div>
      <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mandi">Mandi per hari</Label>
          <InputAngka id="mandi" inputMode="numeric" min={0} max={10} nilai={nilai.mandi_per_hari} onNilai={(n) => ubah("mandi_per_hari", n ?? 0)} {...tandaSalah("mandi", salah["kebiasaan_air.mandi_per_hari"])} />
          <PesanSalah id="mandi-salah" pesan={salah["kebiasaan_air.mandi_per_hari"]} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cara-mandi">Cara mandi</Label>
          <Select value={nilai.cara_mandi} onValueChange={(v) => ubah("cara_mandi", v as KebiasaanAir["cara_mandi"])}>
            <SelectTrigger id="cara-mandi" className="w-full">
              <SelectValue>{(v: string) => (v === "shower" ? "Shower" : "Gayung")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gayung">Gayung</SelectItem>
              <SelectItem value="shower">Shower</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cuci">Cuci baju per minggu</Label>
          <InputAngka id="cuci" inputMode="numeric" min={0} max={21} nilai={nilai.cuci_baju_per_minggu} onNilai={(n) => ubah("cuci_baju_per_minggu", n ?? 0)} {...tandaSalah("cuci", salah["kebiasaan_air.cuci_baju_per_minggu"])} />
          <PesanSalah id="cuci-salah" pesan={salah["kebiasaan_air.cuci_baju_per_minggu"]} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mesin">Pakai mesin cuci</Label>
          <Select value={nilai.cuci_pakai_mesin ? "ya" : "tidak"} onValueChange={(v) => ubah("cuci_pakai_mesin", v === "ya")}>
            <SelectTrigger id="mesin" className="w-full">
              <SelectValue>{(v: string) => (v === "ya" ? "Ya" : "Tidak, cuci tangan")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ya">Ya</SelectItem>
              <SelectItem value="tidak">Tidak, cuci tangan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="siram">Siram tanaman per minggu</Label>
          <InputAngka id="siram" inputMode="numeric" min={0} max={14} nilai={nilai.siram_tanaman_per_minggu} onNilai={(n) => ubah("siram_tanaman_per_minggu", n ?? 0)} {...tandaSalah("siram", salah["kebiasaan_air.siram_tanaman_per_minggu"])} />
          <PesanSalah id="siram-salah" pesan={salah["kebiasaan_air.siram_tanaman_per_minggu"]} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kendaraan">Cuci kendaraan per minggu</Label>
          <InputAngka id="kendaraan" inputMode="numeric" min={0} max={14} nilai={nilai.cuci_kendaraan_per_minggu} onNilai={(n) => ubah("cuci_kendaraan_per_minggu", n ?? 0)} {...tandaSalah("kendaraan", salah["kebiasaan_air.cuci_kendaraan_per_minggu"])} />
          <PesanSalah id="kendaraan-salah" pesan={salah["kebiasaan_air.cuci_kendaraan_per_minggu"]} />
        </div>
      </div>
    </Card>
  );
}

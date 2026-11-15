"use client";

// Modal saat cerita diproses padahal form sudah berisi alat. Pengguna melihat dulu
// apa yang ditemukan AI (baru / memperbarui alat yang sama) dan akibat tiap pilihan
// (jumlah alat akhir, alat lama yang hilang), baru memilih Gabungkan atau Ganti semua.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { angka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Alat, HasilCerita } from "@/lib/types";

/** Alat yang sama = preset sama, atau nama sama untuk Alat lain. Dipakai juga saat menggabung. */
export const alatSama = (a: Alat, b: Alat) =>
  b.preset_id != null ? a.preset_id === b.preset_id : a.preset_id == null && a.nama.toLowerCase() === b.nama.toLowerCase();

/** Gabung hasil cerita ke form. Alat yang sama diperbarui, tidak dobel. */
export function gabungAlat(lama: Alat[], baru: Alat[]) {
  const hasil = [...lama];
  for (const b of baru) {
    const sama = hasil.findIndex((a) => alatSama(a, b));
    if (sama >= 0) hasil[sama] = { ...hasil[sama], ...b, dari_ai: true };
    else hasil.push(b);
  }
  return hasil;
}

const REDUP = "text-[#5a6782]";

// Warna diff: hijau = ditambah, merah = dihapus/nilai lama. Hanya dipakai di modal ini.
const HIJAU = "text-[#1f7a4d]";
const MERAH = "text-[#c0362c]";

type Baris = { jenis: "baru" | "ubah" | "hapus" | "tetap"; alat: Alat; lama?: Alat };

function DiffAlat({ baris }: { baris: Baris[] }) {
  const n = (j: Baris["jenis"]) => baris.filter((b) => b.jenis === j).length;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3e8f0]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[#e3e8f0] bg-[#f9fafc] px-4 py-2 text-[13.5px] font-semibold">
        <span className="text-foreground">Isi form nanti</span>
        <span className="ml-auto flex gap-3 tabular">
          {n("baru") > 0 && <span className={HIJAU}>+{n("baru")} baru</span>}
          {n("ubah") > 0 && <span className="text-[#8a6a00]">±{n("ubah")} berubah</span>}
          {n("hapus") > 0 && <span className={MERAH}>−{n("hapus")} dihapus</span>}
        </span>
      </div>
      <ul className="max-h-[min(260px,34vh)] overflow-y-auto">
        {baris.map(({ jenis, alat: a, lama }, i) => (
          <li
            key={`${a.nama}-${i}`}
            className={cn(
              "grid grid-cols-[20px_minmax(0,1fr)] items-start gap-x-2 border-b border-[#eef2f8] px-3 py-2.5 last:border-0",
              jenis === "baru" && "bg-[#ecf7f0]",
              jenis === "hapus" && "bg-[#fdeeec]",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "pt-px text-center font-mono text-[16px] font-bold",
                jenis === "baru" ? HIJAU : jenis === "hapus" ? MERAH : jenis === "ubah" ? "text-[#8a6a00]" : "text-transparent",
              )}
            >
              {jenis === "baru" ? "+" : jenis === "hapus" ? "−" : jenis === "ubah" ? "±" : "·"}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-[15.5px] font-semibold",
                  jenis === "hapus" && cn(MERAH, "line-through decoration-1"),
                  jenis === "tetap" && "font-medium text-[#5a6782]",
                )}
              >
                {a.nama}
                <span className="sr-only">
                  {jenis === "baru" ? " (baru)" : jenis === "hapus" ? " (dihapus)" : jenis === "ubah" ? " (berubah)" : " (tetap)"}
                </span>
              </p>
              {jenis === "ubah" && lama ? (
                <p className="flex flex-wrap gap-x-2 text-[13.5px]">
                  <span className={cn("rounded px-1 line-through decoration-1", MERAH, "bg-[#fdeeec]")}>{ringkas(lama)}</span>
                  <span className={cn("rounded px-1", HIJAU, "bg-[#ecf7f0]")}>{ringkas(a)}</span>
                </p>
              ) : (
                <p className={cn("text-[13.5px]", jenis === "baru" ? HIJAU : jenis === "hapus" ? MERAH : "text-[#8a98b0]")}>{ringkas(a)}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ringkas = (a: Alat) => `${a.jumlah > 1 ? `${a.jumlah} unit · ` : ""}${angka(a.jam_per_hari)} jam/hari${a.hari_per_minggu < 7 ? ` · ${a.hari_per_minggu} hari/minggu` : ""}`;

export function GabungCerita({
  hasil,
  alatLama,
  onPilih,
  onBatal,
}: {
  hasil: HasilCerita | null;
  alatLama: Alat[];
  onPilih: (mode: "tambah" | "ganti") => void;
  onBatal: () => void;
}) {
  return (
    <Dialog open={!!hasil} onOpenChange={(b) => !b && onBatal()}>
      <DialogContent className="sm:max-w-[560px]">{hasil && <Isi hasil={hasil} alatLama={alatLama} onPilih={onPilih} onBatal={onBatal} />}</DialogContent>
    </Dialog>
  );
}

function Isi({ hasil, alatLama, onPilih, onBatal }: { hasil: HasilCerita; alatLama: Alat[]; onPilih: (m: "tambah" | "ganti") => void; onBatal: () => void }) {
  const [mode, setMode] = useState<"tambah" | "ganti">("tambah");

  const temuan = hasil.alat.map((b) => ({ alat: b, lama: alatLama.find((a) => alatSama(a, b)) }));
  const nBaru = temuan.filter((t) => !t.lama).length;
  const nPerbarui = temuan.length - nBaru;
  const hilang = alatLama.filter((a) => !hasil.alat.some((b) => alatSama(a, b)));
  const totalGabung = alatLama.length + nBaru;

  // Isi form setelah pilihan diterapkan, ditampilkan seperti diff: + baru, ± berubah, − dihapus.
  const diff: Baris[] = [
    ...alatLama.flatMap((l): Baris[] => {
      const b = hasil.alat.find((x) => alatSama(l, x));
      if (b) return [{ jenis: ringkas(l) === ringkas(b) ? "tetap" : "ubah", alat: b, lama: l }];
      return [{ jenis: mode === "ganti" ? "hapus" : "tetap", alat: l }];
    }),
    ...temuan.filter((t) => !t.lama).map((t): Baris => ({ jenis: "baru", alat: t.alat })),
  ];

  const pilihan = [
    {
      mode: "tambah" as const,
      judul: "Gabungkan dengan form",
      isi: (
        <>
          Jadi <b className="text-foreground">{totalGabung} alat</b>.
          {nBaru > 0 && ` ${nBaru} alat baru ditambahkan.`}
          {nPerbarui > 0 && ` ${nPerbarui} alat yang sama diperbarui.`}
          {hilang.length > 0 && ` ${hilang.length} alat lain tetap seperti sekarang.`}
        </>
      ),
    },
    {
      mode: "ganti" as const,
      judul: "Ganti semua dengan hasil cerita",
      isi:
        hilang.length > 0 ? (
          <>
            Jadi <b className="text-foreground">{hasil.alat.length} alat</b>. Yang tidak ada di ceritamu dihapus dari form:{" "}
            <b className="text-warn">{hilang.map((a) => a.nama).join(", ")}</b>.
          </>
        ) : (
          <>
            Jadi <b className="text-foreground">{hasil.alat.length} alat</b>. Semua alat di form ada di ceritamu, jadi tidak ada yang hilang.
          </>
        ),
    },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Ceritamu menyebut {hasil.alat.length} alat
        </DialogTitle>
        <DialogDescription>Form sudah berisi {alatLama.length} alat. Cek dulu hasilnya, lalu pilih cara memakainya.</DialogDescription>
      </DialogHeader>

      <DiffAlat baris={diff} />

      <div role="radiogroup" aria-label="Cara memakai hasil cerita" className="flex flex-col gap-2">
        {pilihan.map((p) => {
          const aktif = mode === p.mode;
          return (
            <button
              key={p.mode}
              type="button"
              role="radio"
              aria-checked={aktif}
              onClick={() => setMode(p.mode)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left transition-colors",
                aktif ? "border-primary ring-1 ring-primary" : "border-[#d5dce8] hover:border-[#b9c4d6] hover:bg-[#f9fafc]",
              )}
            >
              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", aktif ? "border-primary" : "border-[#b9c4d6]")}>
                {aktif && <span className="size-2.5 rounded-full bg-primary" />}
              </span>
              <span>
                <span className="block text-[16px] font-bold text-primary">{p.judul}</span>
                <span className={cn("mt-0.5 block text-[14.5px] leading-snug", REDUP)}>{p.isi}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className={cn("text-[13.5px]", REDUP)}>
        Kebiasaan air ikut diisi dari ceritamu. Semua masih bisa kamu ubah di form sebelum disimpan.
      </p>

      <DialogFooter>
        <Button variant="outline" onClick={onBatal}>
          Batal
        </Button>
        <Button onClick={() => onPilih(mode)}>{mode === "tambah" ? "Gabungkan" : "Ganti semua"}</Button>
      </DialogFooter>
    </>
  );
}

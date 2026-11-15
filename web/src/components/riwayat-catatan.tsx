"use client";

// Riwayat catatan pemakaian (dibuka dari Beranda): lihat semua catatan, ubah, atau hapus.
// Ubah = buka CatatDialog dengan periode terkunci (backend menimpa catatan periode itu).
// Hapus = DELETE /api/pemakaian/:id, konfirmasi langsung di barisnya (tanpa modal bertumpuk).
import { useState } from "react";
import { Droplet, Loader2, Pencil, Trash2, TriangleAlert, Zap } from "lucide-react";
import { toast } from "sonner";
import { PilihJenis, labelBulanPanjang, type CatatanUbah } from "@/components/catat-dialog";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { angka, rupiah, tanggal } from "@/lib/format";
import { pesanError, useApi } from "@/lib/use-api";
import type { CatatanPemakaian, JenisPemakaian } from "@/lib/types";

export function RiwayatCatatan({
  buka,
  onOpenChange,
  jenisAwal,
  onUbah,
  onBerubah,
}: {
  buka: boolean;
  onOpenChange: (b: boolean) => void;
  jenisAwal: JenisPemakaian;
  onUbah: (c: CatatanUbah) => void;
  /** Dipanggil setelah catatan dihapus, supaya Beranda memuat ulang. */
  onBerubah: () => void;
}) {
  return (
    <Dialog open={buka} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {buka && <IsiRiwayat jenisAwal={jenisAwal} onUbah={onUbah} onBerubah={onBerubah} />}
      </DialogContent>
    </Dialog>
  );
}

function IsiRiwayat({ jenisAwal, onUbah, onBerubah }: { jenisAwal: JenisPemakaian; onUbah: (c: CatatanUbah) => void; onBerubah: () => void }) {
  const [jenis, setJenis] = useState<JenisPemakaian>(jenisAwal);
  const daftar = useApi<{ data: CatatanPemakaian[] }>(`/pemakaian?jenis=${jenis}`);
  const [konfirmasi, setKonfirmasi] = useState<number | null>(null);
  const [menghapus, setMenghapus] = useState<number | null>(null);

  // terbaru di atas
  const isi = daftar.data ? [...daftar.data.data].reverse() : null;

  async function hapus(c: CatatanPemakaian) {
    setMenghapus(c.id);
    try {
      await api(`/pemakaian/${c.id}`, { method: "DELETE" });
      toast.success("Catatan dihapus.");
      setKonfirmasi(null);
      await daftar.muat(true);
      onBerubah();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.pesan : "Tidak bisa menghapus. Coba lagi.");
    } finally {
      setMenghapus(null);
    }
  }

  const label = (c: CatatanPemakaian) => (jenis === "listrik" ? labelBulanPanjang(c.periode) : tanggal(c.periode));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Riwayat catatan</DialogTitle>
        <DialogDescription>Salah ketik? Ubah atau hapus catatannya. Grafik dan lonjakan ikut dihitung ulang.</DialogDescription>
      </DialogHeader>

      <PilihJenis
        jenis={jenis}
        onPilih={(j) => {
          setJenis(j);
          setKonfirmasi(null);
        }}
      />

      {daftar.loading && !isi && (
        <div className="flex flex-col gap-2" aria-label="Memuat catatan">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[60px] rounded-2xl" />
          ))}
        </div>
      )}
      {daftar.error && !isi && <ErrorState pesan={pesanError(daftar.error)} onRetry={() => daftar.muat()} />}

      {isi && isi.length === 0 && (
        <EmptyState
          icon={jenis === "listrik" ? Zap : Droplet}
          judul={`Belum ada catatan ${jenis}`}
          pesan="Catatan yang kamu simpan dari tombol Catat pemakaian muncul di sini."
          className="border-0 py-6"
        />
      )}

      {isi && isi.length > 0 && (
        <ul className="-mx-1 max-h-[min(420px,55vh)] divide-y divide-[#eef2f8] overflow-y-auto px-1">
          {isi.map((c, i) => {
            const pertamaAir = jenis === "air" && i === isi.length - 1;
            if (konfirmasi === c.id) {
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <p className="min-w-0 flex-1 text-[15px]">
                    Hapus catatan <b>{label(c)}</b>?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-10 rounded-full px-4" onClick={() => setKonfirmasi(null)} disabled={menghapus === c.id}>
                      Batal
                    </Button>
                    <Button variant="destructive" size="sm" className="h-10 rounded-full px-4" onClick={() => hapus(c)} disabled={menghapus === c.id}>
                      {menghapus === c.id && <Loader2 className="animate-spin" aria-hidden />}
                      Hapus
                    </Button>
                  </div>
                </li>
              );
            }
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15.5px] font-semibold">{label(c)}</p>
                  {(c.lonjakan || jenis === "air") && (
                    <p className="flex items-center gap-1.5 text-[13.5px] text-[#5a6782]">
                      {c.lonjakan && (
                        <span className="inline-flex items-center gap-1 font-semibold text-warn">
                          <TriangleAlert className="size-3.5" aria-hidden /> lonjakan
                        </span>
                      )}
                      {c.lonjakan && jenis === "air" && " · "}
                      {jenis === "air" && (pertamaAir ? "catatan pertama" : `${angka(c.pemakaian)} m³ per minggu`)}
                    </p>
                  )}
                </div>
                <p className="tabular shrink-0 text-right text-[16px] font-bold">{jenis === "listrik" ? rupiah(c.nilai) : `${angka(c.nilai)} m³`}</p>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-[#5a6782] hover:text-primary"
                    aria-label={`Ubah catatan ${label(c)}`}
                    onClick={() => onUbah({ jenis, periode: c.periode, nilai: c.nilai })}
                  >
                    <Pencil className="size-[18px]" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-[#5a6782] hover:bg-warn-soft hover:text-warn"
                    aria-label={`Hapus catatan ${label(c)}`}
                    onClick={() => setKonfirmasi(c.id)}
                  >
                    <Trash2 className="size-[18px]" aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// Validasi form di browser dengan zod. Aturan & pesan disamakan dengan skema di
// api/src/routes (auth.ts, rumah.ts), supaya pengguna melihat pesan yang sama
// sebelum maupun sesudah dikirim. Server tetap memvalidasi ulang.
import { z } from "zod";
import { ApiError } from "@/lib/api";

const n = (pesan = "Harus berupa angka.") => z.number({ error: pesan });

const email = z.string().trim().min(1, "Email wajib diisi.").email("Email tidak valid, contoh: nama@contoh.id").max(191);

export const skemaMasuk = z.object({
  email,
  password: z.string().min(1, "Kata sandi wajib diisi.").max(72),
});

export const skemaDaftar = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 huruf.").max(100, "Nama terlalu panjang."),
  email,
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(72, "Kata sandi maksimal 72 karakter."),
});

export const skemaProfil = z.object({
  penghuni: n().int("Jumlah penghuni harus bilangan bulat.").min(1, "Minimal 1 orang.").max(20, "Maksimal 20 orang."),
  daya_va: n().int().min(450, "Daya listrik minimal 450 VA.").max(200000, "Daya listrik terlalu besar."),
  jenis_listrik: z.enum(["token", "pascabayar"], { message: "Pilih token atau tagihan bulanan." }),
  tarif_listrik: n().positive("Tarif listrik harus lebih dari 0.").max(10000, "Tarif listrik per kWh terlalu besar, cek lagi."),
  tarif_air: n().positive("Tarif air harus lebih dari 0.").max(100000, "Tarif air per m³ terlalu besar, cek lagi.").nullable(),
});

// Sama dengan POLA_NAMA_ALAT di api/src/ai/aman.ts dan skema alat di api/src/routes/rumah.ts.
export const POLA_NAMA_ALAT = /^[\p{L}\p{N} .,()/'+&%-]+$/u;
export const skemaNamaAlat = z
  .string()
  .trim()
  .min(1, "Nama alat wajib diisi.")
  .max(60, "Nama alat maksimal 60 huruf.")
  .regex(POLA_NAMA_ALAT, "Nama alat hanya boleh huruf, angka, dan tanda baca biasa.");

export const skemaAlat = z.object({
  nama: skemaNamaAlat,
  jumlah: n().int("Jumlah harus bilangan bulat.").min(1, "Minimal 1.").max(50, "Maksimal 50."),
  jam_per_hari: n().min(0, "Tidak boleh minus.").max(24, "Maksimal 24 jam."),
  hari_per_minggu: n().int("Harus bilangan bulat.").min(1, "Minimal 1 hari.").max(7, "Maksimal 7 hari."),
  watt: n().int("Watt harus bilangan bulat.").min(1, "Watt minimal 1.").max(5000, "Watt maksimal 5000."),
});

const kali = (max: number) => n().int("Harus bilangan bulat.").min(0, "Tidak boleh minus.").max(max, `Maksimal ${max}.`);
export const skemaKebiasaanAir = z.object({
  mandi_per_hari: kali(10),
  cuci_baju_per_minggu: kali(21),
  siram_tanaman_per_minggu: kali(14),
  cuci_kendaraan_per_minggu: kali(14),
});

export const skemaDataRumah = z.object({
  alat: z.array(skemaAlat).max(50, "Maksimal 50 alat."),
  kebiasaan_air: skemaKebiasaanAir,
});

// Catat pemakaian (api/src/routes/pemakaian.ts). Batas sama dengan server, pesannya lebih jelas.
export const skemaCatatListrik = z.object({
  nilai_rp: n("Isi total Rupiah.").positive("Total Rupiah harus lebih dari 0.").max(100_000_000, "Maksimal Rp100.000.000 sebulan. Cek lagi jumlah nolnya."),
});
export const skemaCatatAir = z.object({
  angka_meteran: n("Isi angka meteran, contoh 1284,6.").positive("Angka meteran harus lebih dari 0.").max(10_000_000, "Angka meteran terlalu besar, cek lagi."),
});

/** Pesan salah per isian, kunci = jalur isian ("email", "alat.0.watt"). */
export type Salah = Record<string, string>;

export function cekForm<T>(skema: z.ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; salah: Salah } {
  const r = skema.safeParse(data);
  if (r.success) return { ok: true, data: r.data };
  const salah: Salah = {};
  for (const i of r.error.issues) salah[i.path.join(".") || "_"] ??= i.message;
  return { ok: false, salah };
}

/** Pesan per isian dari server (ApiError.field), kalau ada. */
export function salahDariServer(e: unknown): Salah | null {
  return e instanceof ApiError && e.field && Object.keys(e.field).length > 0 ? e.field : null;
}

/** Hapus satu kunci dari daftar salah (dipakai saat isiannya diubah). */
export const tanpa = (salah: Salah, kunci: string): Salah => {
  if (!(kunci in salah)) return salah;
  const baru = { ...salah };
  delete baru[kunci];
  return baru;
};

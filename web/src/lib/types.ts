// Tipe sesuai docs/API.md. Kalau kontrak berubah, ubah docs/API.md dulu, lalu file ini.

export type JenisListrik = "token" | "pascabayar";
export type CaraMandi = "gayung" | "shower";
export type JenisPemakaian = "listrik" | "air";

export type User = { id: number; nama: string; email: string };

export type Saya = {
  user: User;
  punya_profil: boolean;
  punya_data_rumah: boolean;
};

export type Profil = {
  penghuni: number;
  daya_va: number;
  jenis_listrik: JenisListrik;
  tarif_listrik: number;
  tarif_air: number | null;
};

export type Alat = {
  id?: number;
  preset_id: number | null;
  nama: string;
  jumlah: number;
  jam_per_hari: number;
  hari_per_minggu: number;
  watt: number;
  dari_ai: boolean;
};

export type AlatPreset = {
  id: number;
  nama: string;
  watt: number;
  kategori: string;
};

export type KebiasaanAir = {
  mandi_per_hari: number;
  cara_mandi: CaraMandi;
  cuci_baju_per_minggu: number;
  cuci_pakai_mesin: boolean;
  siram_tanaman_per_minggu: number;
  cuci_kendaraan_per_minggu: number;
};

export type DataRumah = {
  profil: Profil | null;
  alat: Alat[];
  kebiasaan_air: KebiasaanAir | null;
};

export type HasilCerita = {
  alat: Alat[];
  kebiasaan_air: KebiasaanAir;
  kolom_perkiraan: string[];
  catatan: string[];
};

export type RincianAlat = {
  alat_id: number;
  nama: string;
  kwh_bulan: number;
  rp_bulan: number;
  persen: number;
};

export type RincianAir = {
  kegiatan: string;
  m3_bulan: number;
  rp_bulan: number;
};

export type BiangBoros = {
  judul: string;
  alasan: string;
  ref: string;
};

export type Audit = {
  id: number;
  dibuat: string;
  skor: number;
  listrik: { kwh_bulan: number; rp_bulan: number };
  air: { m3_bulan: number; rp_bulan: number };
  rincian_alat: RincianAlat[];
  rincian_air: RincianAir[];
  biang_boros: BiangBoros[];
  ringkasan: string;
};

export type Misi = {
  id: number;
  urutan: number;
  judul: string;
  deskripsi: string;
  perubahan: string;
  hemat_rp: number;
  selesai: boolean;
};

export type MisiResponse = {
  misi: Misi[];
  total_dicentang_rp: number;
  total_potensi_rp: number;
  progres: { listrik_sebelum_rp: number; listrik_terakhir_rp: number };
};

export type CatatanPemakaian = {
  id: number;
  periode: string;
  nilai: number;
  pemakaian: number;
  lonjakan: boolean;
};

export type LonjakanRingkas = {
  catatan_id: number;
  jenis: JenisPemakaian;
  rasio: number;
  pemakaian: number;
  rata_rata: number;
  ekstra_rp: number;
};

export type LangkahCek = { teks: string; selesai: boolean };

export type Lonjakan = {
  catatan_id: number;
  jenis: JenisPemakaian;
  periode: string;
  pemakaian: number;
  rata_rata: number;
  rasio: number;
  satuan: string;
  ekstra_rp: number;
  kemungkinan_penyebab: { judul: string; alasan: string }[];
  langkah_cek: LangkahCek[];
  kapan_panggil_tukang: string;
};

export type Beranda = {
  /** null kalau belum ada alat di data rumah (docs/API.md). */
  skor: number | null;
  total_dicentang_rp: number;
  listrik: { periode: string; rp: number }[];
  /** m3 null = bacaan meteran pertama (belum ada selisih). */
  air: { periode: string; m3: number | null }[];
  /** null kalau belum ada data rumah. */
  rata_air_m3: number | null;
  lonjakan_aktif: LonjakanRingkas[];
};

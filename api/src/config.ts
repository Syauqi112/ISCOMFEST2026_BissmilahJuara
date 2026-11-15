// Angka acuan. Sumber per angka: docs/FEATURES.md § Acuan air & watt (riset Fajar, issue #1).

export const ACUAN_AIR_LITER = {
  mandi_gayung: 18, // per mandi (Suara Surabaya 2016)
  mandi_shower: 38, // 7,6 L/menit shower hemat (EPA WaterSense) x asumsi 5 menit
  cuci_mesin: 106, // per cuci, batas model hemat (EPA WaterSense)
  cuci_manual: 40, // asumsi tim (sumber tidak ditemukan)
  siram_tanaman: 20, // 2 L/m² (Jurnal Ismetek 2023) x asumsi taman 10 m²
  cuci_kendaraan: 40, // asumsi tim untuk motor (mobil ±300 L tidak dibedakan di form)
  lain_per_orang_hari: 30, // kloset 6 L/siram (EPA WaterSense) x asumsi 5 kali/hari
};
// SNI 03-7065-2005: kebutuhan air rumah tinggal 120 L/penghuni/hari.
export const BATAS_WAJAR_AIR_LITER_PER_ORANG_HARI = 120;

export const LONJAKAN = {
  rasio: 1.3,
  pembanding_listrik: 3, // bulan
  pembanding_air: 4, // periode
  minimal_pembanding: 2,
};

export const HARI_PER_BULAN = 30;

// Semua angka (kWh, m³, Rp, skor, hemat misi) dihitung DI SINI, bukan oleh AI. Rumus: docs/FEATURES.md § Rumus.
import { ACUAN_AIR_LITER as L, BATAS_WAJAR_AIR_LITER_PER_ORANG_HARI, HARI_PER_BULAN } from "./config.js";

export type AlatHitung = {
  id?: number;
  nama: string;
  jumlah: number;
  jam_per_hari: number;
  hari_per_minggu: number;
  watt: number;
  jam_wajar?: number | null; // dari alat_preset; null = Alat lain (tidak dinilai boros)
};

export type KebiasaanAir = {
  mandi_per_hari: number;
  cara_mandi: "gayung" | "shower";
  cuci_baju_per_minggu: number;
  cuci_pakai_mesin: boolean;
  siram_tanaman_per_minggu: number;
  cuci_kendaraan_per_minggu: number;
};

export type ProfilHitung = { penghuni: number; tarif_listrik: number; tarif_air: number | null };

const MINGGU_PER_BULAN = HARI_PER_BULAN / 7;
const r1 = (n: number) => Math.round(n * 10) / 10;

/** kWh per bulan satu baris alat. */
export const kwhBulan = (a: Pick<AlatHitung, "watt" | "jumlah" | "jam_per_hari" | "hari_per_minggu">) =>
  (a.watt * a.jumlah * a.jam_per_hari * (a.hari_per_minggu / 7) * HARI_PER_BULAN) / 1000;

/** Liter per bulan per kegiatan air. */
export function literAirBulan(k: KebiasaanAir, penghuni: number) {
  return {
    mandi: penghuni * k.mandi_per_hari * (k.cara_mandi === "shower" ? L.mandi_shower : L.mandi_gayung) * HARI_PER_BULAN,
    cuci_baju: k.cuci_baju_per_minggu * (k.cuci_pakai_mesin ? L.cuci_mesin : L.cuci_manual) * MINGGU_PER_BULAN,
    siram_tanaman: k.siram_tanaman_per_minggu * L.siram_tanaman * MINGGU_PER_BULAN,
    cuci_kendaraan: k.cuci_kendaraan_per_minggu * L.cuci_kendaraan * MINGGU_PER_BULAN,
    lain_lain: penghuni * L.lain_per_orang_hari * HARI_PER_BULAN,
  };
}

/** Rp listrik + air per bulan untuk satu kondisi rumah (dipakai juga untuk menghitung hemat misi). */
export function biayaBulan(p: ProfilHitung, alat: AlatHitung[], air: KebiasaanAir | null) {
  const kwh = alat.reduce((t, a) => t + kwhBulan(a), 0);
  const liter = air ? Object.values(literAirBulan(air, p.penghuni)).reduce((t, v) => t + v, 0) : 0;
  return { rp_listrik: kwh * p.tarif_listrik, rp_air: (liter / 1000) * (p.tarif_air ?? 0) };
}

/** Hasil hitung lengkap untuk audit. */
export function hitungRumah(p: ProfilHitung, alat: AlatHitung[], air: KebiasaanAir | null) {
  const tarifAir = p.tarif_air ?? 0;

  const rincian_alat = alat
    .map((a) => {
      const kwh = kwhBulan(a);
      return { alat_id: a.id ?? null, nama: a.nama, kwh_bulan: r1(kwh), rp_bulan: Math.round(kwh * p.tarif_listrik), persen: 0 };
    })
    .sort((x, y) => y.rp_bulan - x.rp_bulan);
  const kwhTotal = alat.reduce((t, a) => t + kwhBulan(a), 0);
  const rpListrik = kwhTotal * p.tarif_listrik;
  for (const x of rincian_alat) x.persen = rpListrik > 0 ? Math.round((x.rp_bulan / rpListrik) * 100) : 0;

  const liter = air ? literAirBulan(air, p.penghuni) : null;
  const rincian_air = liter
    ? Object.entries(liter)
        .map(([kegiatan, l]) => ({ kegiatan, m3_bulan: r1(l / 1000), rp_bulan: Math.round((l / 1000) * tarifAir) }))
        .filter((x) => x.m3_bulan > 0)
        .sort((x, y) => y.rp_bulan - x.rp_bulan || y.m3_bulan - x.m3_bulan)
    : [];
  const literTotal = liter ? Object.values(liter).reduce((t, v) => t + v, 0) : 0;
  const rpAir = (literTotal / 1000) * tarifAir;

  // Skor = persen biaya yang masih wajar. Berlebih listrik = jam di atas jam_wajar preset.
  // Berlebih air = liter/orang/hari di atas batas wajar.
  const berlebihListrik = alat.reduce((t, a) => {
    if (a.jam_wajar == null || a.jam_per_hari <= a.jam_wajar) return t;
    return t + kwhBulan({ ...a, jam_per_hari: a.jam_per_hari - a.jam_wajar }) * p.tarif_listrik;
  }, 0);
  const literOrangHari = p.penghuni > 0 ? literTotal / HARI_PER_BULAN / p.penghuni : 0;
  const berlebihAir =
    (Math.max(0, literOrangHari - BATAS_WAJAR_AIR_LITER_PER_ORANG_HARI) * p.penghuni * HARI_PER_BULAN / 1000) * tarifAir;
  const total = rpListrik + rpAir;
  const skor = total > 0 ? Math.max(0, Math.min(100, Math.round(100 * (1 - (berlebihListrik + berlebihAir) / total)))) : 100;

  return {
    skor,
    listrik: { kwh_bulan: r1(kwhTotal), rp_bulan: Math.round(rpListrik) },
    air: { m3_bulan: r1(literTotal / 1000), rp_bulan: Math.round(rpAir) },
    rincian_alat,
    rincian_air,
    berlebih: { rp_listrik: Math.round(berlebihListrik), rp_air: Math.round(berlebihAir), liter_orang_hari: Math.round(literOrangHari) },
  };
}

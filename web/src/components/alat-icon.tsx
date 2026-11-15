// Ikon per alat. Dipakai di form, ranking audit, dan daftar misi supaya
// alat yang sama selalu tampil dengan ikon yang sama.
import {
  AirVent,
  Coffee,
  CookingPot,
  Fan,
  Flame,
  Laptop,
  Lightbulb,
  Microwave,
  Plug,
  Refrigerator,
  Router,
  ShowerHead,
  Smartphone,
  Timer,
  Tv,
  WashingMachine,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

const peta: { cocok: RegExp; icon: LucideIcon }[] = [
  { cocok: /ac|pendingin|air ?vent/i, icon: AirVent },
  { cocok: /kulkas|freezer/i, icon: Refrigerator },
  { cocok: /mesin cuci|cuci/i, icon: WashingMachine },
  { cocok: /tv|televisi/i, icon: Tv },
  { cocok: /lampu/i, icon: Lightbulb },
  { cocok: /kipas/i, icon: Fan },
  { cocok: /microwave/i, icon: Microwave },
  { cocok: /rice|masak|kompor|oven/i, icon: CookingPot },
  { cocok: /setrika/i, icon: Flame },
  { cocok: /mandi|shower|pemanas|water heater/i, icon: ShowerHead },
  { cocok: /pompa|toren|tandon/i, icon: Waves },
  { cocok: /dispenser/i, icon: Coffee },
  { cocok: /laptop|komputer|pc/i, icon: Laptop },
  { cocok: /router|wifi|internet/i, icon: Router },
  { cocok: /charger|hp|ponsel|handphone/i, icon: Smartphone },
  { cocok: /timer/i, icon: Timer },
];

/** Ikon untuk nama alat. Tidak ketemu -> colokan listrik (netral). */
export function ikonAlat(nama: string): LucideIcon {
  const n = nama.toLowerCase();
  return peta.find((p) => p.cocok.test(n))?.icon ?? Plug;
}

/** Alat yang berhubungan dengan air diberi warna biru, sisanya kuning listrik. */
export function toneAlat(nama: string): "listrik" | "air" {
  return /pompa|toren|tandon|air|shower|mandi/i.test(nama) ? "air" : "listrik";
}

export { Zap };

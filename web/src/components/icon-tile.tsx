import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Ikon dalam kotak lembut, warna sesuai arti (lihat docs/UI.md).
const tone = {
  listrik: "bg-listrik-soft text-listrik-foreground",
  air: "bg-air-soft text-air",
  warn: "bg-warn-soft text-warn",
  primary: "bg-primary-soft text-primary",
} as const;

const size = {
  sm: "size-8 rounded-[10px] [&_svg]:size-[18px]",
  md: "size-11 rounded-xl [&_svg]:size-[22px]",
  lg: "size-13 rounded-2xl [&_svg]:size-[26px]",
} as const;

export function IconTile({
  icon: Icon,
  tone: t = "primary",
  size: s = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof tone;
  size?: keyof typeof size;
  className?: string;
}) {
  return (
    <span className={cn("grid shrink-0 place-items-center", tone[t], size[s], className)}>
      <Icon aria-hidden />
    </span>
  );
}

// Pesan salah di bawah isian. Pasangkan dengan aria-invalid + aria-describedby di inputnya.
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function PesanSalah({ id, pesan, className }: { id: string; pesan?: string; className?: string }) {
  if (!pesan) return null;
  return (
    <p id={id} role="alert" className={cn("flex items-start gap-1.5 text-[14px] leading-snug font-semibold text-warn", className)}>
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {pesan}
    </p>
  );
}

/** Props untuk input yang salah: tanda merah + sambungan ke pesannya. */
export const tandaSalah = (id: string, pesan?: string) =>
  pesan ? { "aria-invalid": true as const, "aria-describedby": `${id}-salah` } : {};

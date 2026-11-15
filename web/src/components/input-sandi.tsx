"use client";

// Isian kata sandi dengan tombol mata untuk menampilkan / menyembunyikan isinya.
// Tombolnya 44px (ramah orang tua), bisa dijangkau keyboard, labelnya dibacakan pembaca layar.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function InputSandi({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [tampil, setTampil] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={tampil ? "text" : "password"} className={cn(className, "pr-12")} />
      <button
        type="button"
        onClick={() => setTampil((t) => !t)}
        aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={tampil}
        className="absolute inset-y-0 right-0.5 my-auto grid size-11 place-items-center rounded-full text-[#5a6782] transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {tampil ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

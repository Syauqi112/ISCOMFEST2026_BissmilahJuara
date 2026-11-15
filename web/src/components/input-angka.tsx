"use client";

// Input angka yang ramah ketik: saat isinya dihapus, kotak benar-benar kosong (bukan "0"),
// dan nol di depan dibuang ("03" -> "3"). Nilai ke induk hanya dikirim kalau isinya angka sah;
// kalau ditinggal kosong, kotak kembali menampilkan nilai terakhir (atau null bila boleh kosong).
import { useState } from "react";
import { Input } from "@/components/ui/input";

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  nilai: number | null;
  onNilai: (n: number | null) => void;
  /** true = kotak kosong berarti null (mis. tarif air yang tidak dipakai). */
  bolehKosong?: boolean;
};

export function InputAngka({ nilai, onNilai, bolehKosong = false, onFocus, onBlur, ...props }: Props) {
  // null = tidak sedang diketik, tampilkan nilai dari induk
  const [teks, setTeks] = useState<string | null>(null);
  const tampil = teks ?? (nilai == null ? "" : String(nilai));

  return (
    <Input
      {...props}
      type="number"
      value={tampil}
      onFocus={(e) => {
        setTeks(tampil);
        onFocus?.(e);
      }}
      onChange={(e) => {
        let v = e.target.value;
        if (/^0\d/.test(v)) v = v.replace(/^0+(?=\d)/, "");
        setTeks(v);
        if (v === "") {
          if (bolehKosong) onNilai(null);
        } else if (!Number.isNaN(Number(v))) {
          onNilai(Number(v));
        }
      }}
      onBlur={(e) => {
        setTeks(null);
        onBlur?.(e);
      }}
    />
  );
}

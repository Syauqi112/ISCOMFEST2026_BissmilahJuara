"use client";

// Hook fetch sederhana: loading, data, error + muat ulang. Dipakai semua halaman.
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

type State<T> = {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
};

const keApiError = (e: unknown) =>
  e instanceof ApiError ? e : new ApiError("AI_GAGAL", "Terjadi kesalahan. Coba lagi.", 0);

/**
 * Muat data dari `/api`. `path` null = jangan memuat apa pun.
 * Pemanggilan pertama terjadi di effect; setState-nya setelah `await` supaya
 * tidak memicu render berantai saat mount.
 */
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: !!path });
  const urutan = useRef(0);

  // Dipakai tombol "Coba lagi" dan refresh setelah menyimpan (event handler).
  const muat = useCallback(
    async (diam = false) => {
      if (!path) return;
      const nomor = ++urutan.current;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api<T>(path);
        if (nomor !== urutan.current) return;
        setState({ data, error: null, loading: false });
      } catch (e) {
        if (nomor !== urutan.current) return;
        setState((s) => ({ data: diam ? s.data : null, error: keApiError(e), loading: false }));
      }
    },
    [path],
  );

  useEffect(() => {
    if (!path) return;
    let batal = false;
    const nomor = ++urutan.current;
    (async () => {
      try {
        const data = await api<T>(path);
        if (batal || nomor !== urutan.current) return;
        setState({ data, error: null, loading: false });
      } catch (e) {
        if (batal || nomor !== urutan.current) return;
        setState({ data: null, error: keApiError(e), loading: false });
      }
    })();
    return () => {
      batal = true;
    };
  }, [path]);

  return { ...state, muat };
}

/** Ambil pesan error yang ramah untuk ditampilkan. */
export function pesanError(e: ApiError | null) {
  if (!e) return "";
  if (e.kode === "BELUM_LOGIN") return "Sesi kamu sudah berakhir. Silakan masuk lagi.";
  if (e.kode === "BATAS_AI") return "Terlalu banyak permintaan AI. Tunggu sebentar, lalu coba lagi.";
  if (e.kode === "JARINGAN") return "Tidak bisa terhubung ke server. Cek internet, lalu coba lagi.";
  return e.pesan;
}

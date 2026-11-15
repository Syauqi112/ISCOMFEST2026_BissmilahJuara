// Pemanggil API sesuai docs/API.md. Selalu relatif (/api/...), lewat rewrite Next ke Express.

export type ApiErrorKode = "VALIDASI" | "BELUM_LOGIN" | "TIDAK_DITEMUKAN" | "BATAS_AI" | "AI_GAGAL" | "JARINGAN";

export class ApiError extends Error {
  constructor(
    public kode: ApiErrorKode,
    public pesan: string,
    public status: number,
    public field?: Record<string, string>,
  ) {
    super(pesan);
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("JARINGAN", "Tidak bisa terhubung. Cek internet lalu coba lagi.", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(e.kode ?? "AI_GAGAL", e.pesan ?? "Terjadi kesalahan. Coba lagi.", res.status, e.field);
  }
  return data as T;
}

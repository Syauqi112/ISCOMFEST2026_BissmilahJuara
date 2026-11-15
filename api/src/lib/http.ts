// Format error sesuai docs/API.md: { error: { kode, pesan, field? } }
import type { ErrorRequestHandler } from "express";
import type { ZodType } from "zod";

export type KodeError = "VALIDASI" | "BELUM_LOGIN" | "TIDAK_DITEMUKAN" | "BATAS_AI" | "AI_GAGAL" | "SERVER";
export type FieldError = Record<string, string>;

export class HttpError extends Error {
  constructor(
    public status: number,
    public kode: KodeError,
    public pesan: string,
    public field?: FieldError,
  ) {
    super(pesan);
  }
}

export const tidakDitemukan = (pesan = "Data tidak ditemukan.") => new HttpError(404, "TIDAK_DITEMUKAN", pesan);
export const validasi = (pesan: string, field?: FieldError) => new HttpError(400, "VALIDASI", pesan, field);

/** Parse body/query dengan skema zod; gagal -> 400 VALIDASI dengan pesan per field. */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const field: FieldError = {};
  for (const i of r.error.issues) field[i.path.join(".") || "_"] ??= i.message;
  throw validasi("Ada isian yang belum benar.", field);
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let e: HttpError;
  if (err instanceof HttpError) e = err;
  else if (err?.type === "entity.parse.failed") e = validasi("Format data tidak dikenali.");
  else if (err?.type === "entity.too.large") e = new HttpError(413, "VALIDASI", "Data yang dikirim terlalu besar.");
  else {
    console.error(err);
    e = new HttpError(500, "SERVER", "Terjadi kesalahan di server. Coba lagi sebentar.");
  }
  res.status(e.status).json({ error: { kode: e.kode, pesan: e.pesan, ...(e.field ? { field: e.field } : {}) } });
};

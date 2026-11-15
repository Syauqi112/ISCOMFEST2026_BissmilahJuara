// Sesi = JWT di cookie httpOnly "sid". Same-origin lewat rewrite Next, jadi frontend tidak menyimpan token.
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { RequestHandler, Response } from "express";
import { HttpError } from "./http.js";

const PROD = process.env.NODE_ENV === "production";
// Tanpa JWT_SECRET: pakai secret acak per proses (aman, tapi semua user ke-logout tiap restart/deploy).
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.JWT_SECRET && PROD) console.warn("PERINGATAN: JWT_SECRET kosong, sesi hilang tiap restart. Isi di environment server.");

const UMUR_HARI = 7;
export const COOKIE = "sid";
const opsiCookie = { httpOnly: true, sameSite: "lax" as const, secure: PROD, path: "/" };

export function setSesi(res: Response, user: { id: number; nama: string }) {
  const token = jwt.sign({ sub: String(user.id), nama: user.nama }, SECRET, { expiresIn: `${UMUR_HARI}d` });
  res.cookie(COOKIE, token, { ...opsiCookie, maxAge: UMUR_HARI * 24 * 3600 * 1000 });
}

export function hapusSesi(res: Response) {
  res.clearCookie(COOKIE, opsiCookie);
}

/** Middleware: wajib login. Isi req.userId. */
export const wajibLogin: RequestHandler = (req, _res, next) => {
  try {
    const p = jwt.verify(req.cookies?.[COOKIE] ?? "", SECRET) as jwt.JwtPayload;
    req.userId = Number(p.sub);
    next();
  } catch {
    next(new HttpError(401, "BELUM_LOGIN", "Silakan masuk dulu."));
  }
};

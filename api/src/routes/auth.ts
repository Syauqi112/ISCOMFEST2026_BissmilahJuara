import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { exec, rows } from "../db.js";
import { HttpError, parse } from "../lib/http.js";
import { hapusSesi, setSesi, wajibLogin } from "../lib/auth.js";

const r = Router();

// Cegah tebak password: 20 percobaan / 15 menit / IP.
const batasAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new HttpError(429, "BATAS_AI", "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.")),
});

const email = z.string().trim().toLowerCase().email("Email tidak valid.").max(191);
const daftarSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 huruf.").max(100),
  email,
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(72),
});
const masukSchema = z.object({ email, password: z.string().min(1, "Kata sandi wajib diisi.").max(72) });

type UserRow = { id: number; nama: string; email: string; password_hash: string };
const publik = (u: Pick<UserRow, "id" | "nama" | "email">) => ({ id: u.id, nama: u.nama, email: u.email });

r.post("/daftar", batasAuth, async (req, res) => {
  const b = parse(daftarSchema, req.body);
  const ada = await rows<{ id: number }>("SELECT id FROM users WHERE email = ?", [b.email]);
  if (ada.length) throw new HttpError(400, "VALIDASI", "Email sudah terdaftar.", { email: "Email sudah terdaftar. Silakan masuk." });
  const hash = await bcrypt.hash(b.password, 10);
  const ins = await exec("INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)", [b.nama, b.email, hash]);
  const user = { id: ins.insertId, nama: b.nama, email: b.email };
  setSesi(res, user);
  res.status(201).json({ user });
});

r.post("/masuk", batasAuth, async (req, res) => {
  const b = parse(masukSchema, req.body);
  const [u] = await rows<UserRow>("SELECT * FROM users WHERE email = ?", [b.email]);
  // Pesan sama untuk email salah / password salah supaya tidak bocor email mana yang terdaftar.
  if (!u || !(await bcrypt.compare(b.password, u.password_hash))) {
    throw new HttpError(400, "VALIDASI", "Email atau kata sandi salah.");
  }
  setSesi(res, u);
  res.json({ user: publik(u) });
});

r.post("/keluar", (_req, res) => {
  hapusSesi(res);
  res.status(204).end();
});

r.get("/saya", wajibLogin, async (req, res) => {
  const [u] = await rows<{ id: number; nama: string; email: string; rumah_id: number | null; jumlah_alat: number }>(
    `SELECT u.id, u.nama, u.email, r.id AS rumah_id,
            (SELECT COUNT(*) FROM rumah_alat a WHERE a.rumah_id = r.id) AS jumlah_alat
       FROM users u LEFT JOIN rumah r ON r.user_id = u.id WHERE u.id = ?`,
    [req.userId],
  );
  if (!u) throw new HttpError(401, "BELUM_LOGIN", "Silakan masuk dulu.");
  res.json({ user: publik(u), punya_profil: !!u.rumah_id, punya_data_rumah: Number(u.jumlah_alat) > 0 });
});

export default r;

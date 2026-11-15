import { Router } from "express";
import { wajibLogin } from "../lib/auth.js";
import { tidakDitemukan } from "../lib/http.js";
import { auditTerbaru } from "../lib/audit.js";
import { rumahIdUser } from "./rumah.js";

const r = Router();
r.use(wajibLogin);

r.get("/terbaru", async (req, res) => {
  const rumahId = await rumahIdUser(req.userId);
  const a = rumahId ? await auditTerbaru(rumahId) : null;
  if (!a) throw tidakDitemukan("Belum ada audit. Simpan data rumah lalu jalankan audit.");
  res.json(a);
});

export default r;

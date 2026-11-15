import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rows, pool } from "./db.js";
import { errorHandler, tidakDitemukan } from "./lib/http.js";
import authRoutes from "./routes/auth.js";
import rumahRoutes from "./routes/rumah.js";
import pemakaianRoutes from "./routes/pemakaian.js";
import lonjakanRoutes from "./routes/lonjakan.js";
import berandaRoutes from "./routes/beranda.js";
import aiRoutes from "./routes/ai.js";
import auditRoutes from "./routes/audit.js";
import misiRoutes from "./routes/misi.js";

const app = express();
const origins = (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",").map((s) => s.trim());

app.set("trust proxy", 1); // di belakang Traefik (VPS) dan rewrite Next: IP asli untuk rate limit
app.disable("x-powered-by");
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  let db = false;
  try {
    await pool.query("SELECT 1");
    db = true;
  } catch {}
  res.json({ ok: true, db });
});

app.get("/api/alat-preset", async (_req, res) => {
  const alat = await rows("SELECT id, nama, watt, kategori FROM alat_preset ORDER BY id");
  res.json({ alat });
});

app.use("/api/auth", authRoutes);
app.use("/api/rumah", rumahRoutes);
app.use("/api/pemakaian", pemakaianRoutes);
app.use("/api/lonjakan", lonjakanRoutes);
app.use("/api/beranda", berandaRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/misi", misiRoutes);

app.use("/api", (_req, _res, next) => next(tidakDitemukan("Endpoint tidak ada.")));
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, "0.0.0.0", () => console.log(`api on :${port}`));

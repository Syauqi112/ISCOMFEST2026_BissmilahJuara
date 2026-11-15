// Jalankan file SQL di db/migrations/ yang belum pernah dijalankan (urut nama). Idempoten.
import fs from "node:fs";
import path from "node:path";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { DATABASE_URL } from "./db.js";

const dir = path.join(import.meta.dirname, "..", "db", "migrations");
const dbName = new URL(DATABASE_URL).pathname.slice(1);

// Buat database kalau belum ada (lokal: XAMPP/DBngin). Di VPS DB sudah dibuat, user tidak punya hak CREATE DATABASE.
try {
  const base = new URL(DATABASE_URL);
  base.pathname = "/";
  const c = await mysql.createConnection(base.toString());
  await c.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await c.end();
} catch {
  /* tidak punya hak, lanjut */
}

const conn = await mysql.createConnection({ uri: DATABASE_URL, multipleStatements: true });
await conn.query("CREATE TABLE IF NOT EXISTS _migrasi (nama VARCHAR(191) PRIMARY KEY, dijalankan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)");
const [done] = await conn.query<RowDataPacket[]>("SELECT nama FROM _migrasi");
const sudah = new Set(done.map((r) => r.nama as string));

for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (sudah.has(f)) continue;
  await conn.query(fs.readFileSync(path.join(dir, f), "utf8"));
  await conn.query("INSERT INTO _migrasi (nama) VALUES (?)", [f]);
  console.log(`migrasi: ${f}`);
}
console.log("migrasi selesai");
await conn.end();

# Aturan kerja repo (untuk manusia & semua AI coding tool)

File ini dibaca Claude Code (lewat `CLAUDE.md`), Codex, Cursor, Copilot, dll. Manusia juga wajib ikut.

## Konteks
Repo source code tim untuk ISCOMFEST 2026,
tagline "Secure Development Practices". 13 jam, aplikasi dijalankan **lokal** (tanpa deploy).
Isi `docs/` dipakai langsung oleh penulis laporan & QA, jadi **docs sama pentingnya dengan kode**.

## Tentang
Tema panitia: "Hemat Energi Rumah" — Membimbing warga untuk memantau dan menghemat penggunaan listrik serta air di rumah tangga.
Aplikasi: **RumahHemat** — pendamping hemat listrik dan air untuk rumah tangga: menunjukkan yang paling boros, memberi
peringatan saat pemakaian melonjak, dan membimbing langkah hemat dalam rupiah. Pengguna utama: orang tua.
3 fitur inti: (1) Data Rumah & Audit (tab Ceritakan + tab Isi Form), (2) Pantau Pemakaian + deteksi lonjakan, (3) Rencana Hemat.
Prinsip: **semua angka (kWh, m³, Rp, skor, lonjakan, hemat misi) dihitung backend**; AI menafsirkan dan merekomendasikan, output JSON.
Kontrak endpoint: `docs/API.md` (ubah di sana dulu, kabari grup). Skema DB: `docs/DATABASE.md`. Skema AI: `docs/AI.md`. Halaman: `docs/UI.md` + `docs/mockup.html`.
Jangan tambah fitur di luar 3 fitur inti + pendukung di `docs/FEATURES.md`.

## Aturan keras
- Setelah deadline submission: **jangan ubah apa pun** di repo (Guide Book I.4.c, bisa diskualifikasi).
- Jangan commit `.env` atau API key. Key AI cuma dipakai di server, tidak pernah di frontend.
- Commit: Conventional Commits, bahasa Inggris (`feat(scan): ...`). Tanpa trailer/footer atribusi AI.
- Langsung ke `main`. `git pull --rebase` sebelum mulai dan sebelum push.

## Kontrak docs: ngubah X -> update Y (di commit yang sama)
| Kalau kamu... | Update |
|---|---|
| Menyelesaikan / mengubah fitur | `docs/PROGRESS.md` (1 baris) + `docs/FEATURES.md` |
| Menambah / mengubah tabel, kolom, relasi | `docs/DATABASE.md` |
| Mengubah prompt, model, atau format JSON AI | `docs/AI.md` |
| Menambah library / ganti versi | `docs/TECH-STACK.md` |
| Mengubah alur antar frontend, backend, DB, AI | `docs/ARCHITECTURE.md` |
| Menambah langkah keamanan | `docs/SECURITY.md` |
| Menambah / mengubah endpoint, request, response | `docs/API.md` (kabari grup) |
| Menambah / mengubah halaman | `docs/UI.md` + screenshot di `docs/screenshots/` |
| Mengubah cara install / run / akun demo / env | `README.md` + `.env.example` |
| Mengubah ide, target pengguna, batasan | `docs/IDEA.md` |

Peta docs ke bab laporan: `docs/README.md`.

## Definisi "fitur selesai"
1. Jalan di laptop lokal dari kondisi bersih (ikuti README).
2. Ada baris di `docs/PROGRESS.md` dan entri di `docs/FEATURES.md`.
3. Kalau ada UI: screenshot di `docs/screenshots/` (nama `NN-nama-halaman.png`).

## Stack & perintah
Next.js (frontend, folder `web/`) + Express (backend, folder `api/`). **TypeScript di dua-duanya** (api: `tsx watch` saat dev, `tsc` ke `dist/` untuk production; `npm run typecheck` sebelum push). **npm**, bukan pnpm/yarn. Node 22.18+ (LTS terbaru disarankan).

- Browser cuma bicara ke Next. `web/next.config.ts` me-rewrite `/api/*` ke Express (`API_URL`, default `http://localhost:4000`), jadi tanpa CORS.
- Semua route Express pakai prefix `/api`, listen `0.0.0.0` di `process.env.PORT` (default 4000).
- Database **MySQL** lewat `DATABASE_URL` (lokal default `mysql://root:@127.0.0.1:3306/iscomfest`). Windows: XAMPP (isinya MariaDB), Mac: DBngin.
  Jangan pakai fitur yang cuma ada di MySQL 8, biar tetap jalan di MariaDB XAMPP. Wajib ada migration + seeder (akun & data demo).
- AI: chat completions format OpenAI, rantai 3 lapis (OpenAgentic Gemini -> OpenAgentic DeepSeek -> DeepSeek resmi). Env `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_FALLBACK_MODEL`, opsional `AI2_*` (detail `docs/AI.md`).
  Output JSON divalidasi, timeout + retry, batas total 100 dtk, error rapi. Cek: `cd api && npm run ai:cek`.
- Key AI dan kredensial DB cuma di `api/.env`. Aplikasi tidak menyimpan file (tidak ada fitur upload).
- CORS di Express cuma izinkan `https://iscomfest.jstnlt.id` dan `http://localhost:3000` (frontend sendiri lewat rewrite, gak butuh CORS).
- **Jangan pakai Docker di laptop.** `Dockerfile` di `web/` dan `api/` cuma buat deploy otomatis ke VPS. Develop & testing lokal pakai `npm run dev` saja.
- Lokal: buat DB `iscomfest` di MySQL, lalu terminal 1 `cd api && cp .env.example .env && npm install && npm run dev`,
  terminal 2 `cd web && npm install && npm run dev`, buka http://localhost:3000. Cek: http://localhost:3000/api/health -> `{"ok":true,"db":true}`
- UI: **full shadcn** (modal = Dialog, toast = sonner, dll). Tambah komponen: `cd web && npx shadcn@latest add <nama>`. Aturan + helper (`IconTile`, `rupiah()`, `api()`): `docs/UI.md` § Design system di kode. Contekan: `/design`.
- `web/AGENTS.md` dibuat otomatis oleh Next (aturan versi Next 16). Biarkan, ikut di-commit.
- DB: `cd api && npm run db:setup` (buat DB kalau belum ada + migrasi + seed, aman diulang). Migrasi baru = file SQL baru di `api/db/migrations/NNN_nama.sql`, jangan ubah file lama. Akun demo: `demo@RumahHemat.id` / `demo12345`, dan `budi@RumahHemat.id` / `demo12345` (lonjakan lama + minggu ini).
- VPS: `npm start` otomatis migrate + seed sebelum server jalan.
- Template "CLAUDE.md" dari Pegangan Tim (bagian 7C) diisi ke **file ini** (bagian Konteks / Stack), jangan menimpa `CLAUDE.md`.

## Testing tim
- Versi `main` terbaru otomatis ter-deploy: web https://iscomfest.jstnlt.id, API langsung https://iscomfest-be.jstnlt.id (buat Postman/curl). Publik. Build ~2-5 menit tiap push.
- Frontend tetap panggil `/api/...` (relatif), jangan hardcode domain backend.
- Karena publik: endpoint yang memanggil AI **wajib rate limit**, dan jangan ada data/akun sungguhan.
- Iterasi cepat tetap di lokal. Penjurian pakai laptop lokal, jadi README "Cara menjalankan" harus selalu benar.

## Hook pengingat (sekali per clone)
`git config core.hooksPath .githooks`
Hook cuma memperingatkan kalau kode berubah tanpa `docs/PROGRESS.md`, tidak memblokir commit.

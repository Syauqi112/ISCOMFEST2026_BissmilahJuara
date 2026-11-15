# ISCOMFEST 2026 Programing

Source code tim untuk ISCOMFEST 2026 Programming Build.
Nama aplikasi dan deskripsi: lihat `docs/IDEA.md`.

## Prasyarat
- Node.js 22.18+ dan npm
- MySQL atau MariaDB jalan di port 3306 (Windows: Laragon > Start di baris MySQL; Mac: DBngin). Database **tidak perlu dibuat manual**, dibuat otomatis oleh `npm run db:setup`.
- API key AI untuk fitur AI (cerita, audit, penjelasan lonjakan). Tanpa key, fitur lain tetap jalan dan fitur AI menampilkan pesan.

## Cara menjalankan
**Dari zip submission:** zip sudah berisi `node_modules` dan file `.env` (sesuai arahan panitia), jadi di Mac cukup nyalakan MySQL, lalu `cd api && npm run db:setup && npm run dev` dan `cd web && npm run dev`. `node_modules` dipasang di macOS (Apple Silicon); di Windows/Linux jalankan `npm install` dulu di `api/` dan `web/` karena sebagian paket memakai binary khusus OS.

Tidak perlu Docker. `Dockerfile` di repo cuma dipakai server deploy; di laptop cukup npm. Diuji dari clone bersih: ±5 menit.

**Terminal 1, backend:**
```bash
cd api
cp .env.example .env        # Windows CMD: copy .env.example .env
# buka api/.env, isi AI_API_KEY (dan JWT_SECRET dengan teks acak panjang)
npm install
npm run db:setup            # buat database iscomfest + tabel + data demo
npm run dev                 # API di http://localhost:4000
```

**Terminal 2, frontend:**
```bash
cd web
npm install
npm run dev                 # buka http://localhost:3000
```

Masuk dengan akun demo di bawah. Cek cepat: http://localhost:3000/api/health harus menampilkan `{"ok":true,"db":true}`.

Kalau ada masalah:
- `db:false` / `ECONNREFUSED 3306`: MySQL belum jalan (Laragon: Start MySQL), atau `DATABASE_URL` di `api/.env` beda user/password.
- Halaman terbuka tapi data tidak muncul: terminal 1 (backend) belum jalan.
- Port 3000 / 4000 terpakai: tutup aplikasi lain yang memakainya.

## Environment
Salin `api/.env.example` ke `api/.env`, isi key. Jangan pernah commit `.env`.
Frontend juga punya `web/.env.example` → `web/.env.local` (berisi `API_URL`, alamat backend untuk rewrite `/api/*`).

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi MySQL/MariaDB, default `mysql://root:@127.0.0.1:3306/iscomfest` (XAMPP/DBngin) |
| `JWT_SECRET` | Rahasia tanda tangan sesi login, string acak panjang (`openssl rand -hex 32`) |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_FALLBACK_MODEL` | Penyedia AI utama: OpenAgentic `https://openagentic.id/api/v1`, model `gemini-3.8-flash-high`, cadangan `deepseek-v4.1-flash` (format OpenAI, bisa diganti penyedia lain) |
| `AI2_BASE_URL`, `AI2_API_KEY`, `AI2_MODEL` | Opsional, penyedia kedua kalau penyedia utama bermasalah: DeepSeek resmi `https://api.deepseek.com`, `deepseek-flash`. Kosongkan kalau tidak punya key. Cek semua lapis: `cd api && npm run ai:cek` |
| `CORS_ORIGIN` | Origin yang boleh akses API langsung |
| `PORT` | Port API (4000) |

## Akun demo
| Role | Email / username | Password |
|---|---|---|
| Warga (data demo) | `demo@hematrumah.id` | `demo12345` |
| Warga, lonjakan lama + lonjakan minggu ini | `budi@hematrumah.id` | `demo12345` |

## Untuk kontributor
Baca `AGENTS.md` (aturan + kontrak docs), lalu sekali per clone: `git config core.hooksPath .githooks`

# Teknologi

Bab laporan: 6.1.
Update kalau: tambah library atau ganti versi. Versi diambil dari `package.json` yang terpasang, bukan ingatan (dicek 7 Nov 2026).

| Bagian | Teknologi | Versi | Alasan dipilih |
|---|---|---|---|
| Runtime | Node.js | 22.18+ (dev: 22.19) | Satu bahasa (TypeScript) untuk frontend dan backend |
| Frontend | Next.js (App Router) + React | 16.4.5 / 19.3.0 | Rewrite `/api` ke backend (satu origin, tanpa CORS), build standalone untuk deploy |
| UI | Tailwind CSS + shadcn/ui (style base-nova, Base UI) | 4.3.5 / shadcn 4.23.0 / Base UI 1.9.0 | Komponen aksesibel siap pakai (Dialog, Tabs, Checkbox), mudah disesuaikan untuk pengguna orang tua |
| Ikon | lucide-react | 1.70.0 | Satu set ikon konsisten, bawaan shadcn |
| Grafik | Recharts (via shadcn Chart) | 3.8.0 | Grafik batang & garis untuk tren listrik dan air |
| Toast | sonner | 2.0.8 | Notifikasi singkat |
| Tur sorot | driver.js | 1.3.6 | Tur onboarding (sorot elemen + penjelasan), ringan, MIT, tanpa ketergantungan React |
| Konfeti | canvas-confetti | 1.9.3 | Perayaan saat semua langkah cek lonjakan / misi rencana dicentang (`web/src/lib/rayakan.ts`), warna palet aplikasi, mati kalau prefers-reduced-motion. Ringan (±6 KB, dimuat saat dipakai) |
| Backend | Express + TypeScript | 5.3.0 / TS 7.0.2 (tsx 4.23.15 untuk dev) | Ringan, async error bawaan Express 5 |
| Database | MySQL / MariaDB via mysql2 | mysql2 3.24.6 | Sesuai keputusan tim; lokal XAMPP (MariaDB), VPS MariaDB 10.11 |
| Validasi | zod | 4.6.7 | Validasi input pengguna dan output AI dengan skema yang sama. Dipakai juga di web (`web/src/lib/validasi.ts`) untuk pesan salah per isian sebelum dikirim, aturannya disamakan dengan skema API. |
| Auth | JWT (jsonwebtoken) di cookie httpOnly + bcryptjs | 9.0.3 / 3.0.3 | Sesi aman tanpa token di browser; bcryptjs tanpa kompilasi native (aman di Windows) |
| Keamanan | express-rate-limit, cookie-parser, cors | 8.7.3 / 1.4.7 / 2.8.6 | Batas percobaan login & panggilan AI |
| AI | Gemini 3.8 Flash (`gemini-3.8-flash-high`) lewat **OpenAgentic** (gateway API berformat OpenAI, `https://openagentic.id/api/v1`), cadangan DeepSeek V4.1 Flash lewat OpenAgentic lalu DeepSeek resmi (`deepseek-flash`) | - | Lihat `docs/AI.md` § Model & pemanggilan, § Kenapa model ini |
| Deploy (QA tim) | Docker + Dokploy di VPS | - | Auto-deploy tiap push; penjurian tetap lokal |

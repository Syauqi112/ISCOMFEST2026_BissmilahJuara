# Frontend HematRumah (Next.js)

## Menjalankan

```bash
cd web
cp .env.example .env.local   # default sudah menunjuk ke API hosting
npm install
npm run dev                  # buka http://localhost:3000
```

`API_URL` dibaca di server Next lalu dipakai untuk meneruskan `/api/*` ke Express
(lihat `next.config.ts`). Browser tetap memanggil path relatif, jadi tidak ada CORS
dan tidak ada alamat backend di kode. Ganti isi `API_URL` untuk memakai backend lokal.

Akun demo: `demo@hematrumah.id` / `demo12345`.

## Halaman

| Route | Isi |
|---|---|
| `/masuk`, `/daftar` | Masuk / daftar |
| `/profil` | Profil rumah (penghuni, daya, tarif) |
| `/rumah?tab=cerita` \| `?tab=form` | Data rumah: cerita → AI isi form, atau isi manual |
| `/audit` | Hasil audit |
| `/rencana` | Rencana hemat |
| `/beranda` | Ringkasan + grafik, tombol Catat |
| `/lonjakan/[id]` | Detail lonjakan |
| `/design` | Contekan design system (bukan fitur) |

## Catatan

- Semua angka (kWh, m³, Rp, skor) dihitung backend. Frontend hanya memformat.
- Setiap panggilan AI punya state loading, error + tombol coba lagi, dan empty state
  (`src/components/states.tsx`).
- Endpoint AI (`/api/ai/cerita`, `/api/ai/audit`, `/api/ai/lonjakan`) dan `/api/misi` sudah aktif;
  semua halaman memakai data asli. Kalau AI gagal, halaman menampilkan error + tombol coba lagi,
  bukan data palsu.
- Nomor commit di footer diambil dari `git rev-parse --short HEAD` saat build
  (`next.config.ts`), jadi versi live mudah dicek.

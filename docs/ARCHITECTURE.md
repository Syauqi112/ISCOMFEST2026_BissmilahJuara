# Arsitektur

Bab laporan: 5.3 (non-fungsional), 5.4 (rancangan sistem).
Update kalau: alur antar frontend, backend, DB, atau AI berubah.

## Gambaran sistem
```mermaid
flowchart LR
  U[Pengguna<br/>browser] -->|halaman + /api/*| FE[Frontend<br/>Next.js 16]
  FE -->|rewrite /api/* di server| BE[Backend<br/>Express 5 + TypeScript]
  BE -->|SQL berparameter| DB[(MySQL / MariaDB)]
  BE -->|chat completions, JSON| AI[OpenAgentic<br/>Gemini 3.8 Flash<br/>cadangan: DeepSeek]
  BE -.->|kalau OpenAgentic bermasalah| AI2[DeepSeek resmi<br/>deepseek-flash]
```
- Browser hanya bicara ke Next (satu origin). Next meneruskan `/api/*` ke Express di sisi server, jadi tidak ada CORS dan cookie sesi tetap same-origin.
- Express satu-satunya yang memegang kredensial DB dan API key AI. Frontend tidak pernah memanggil AI langsung.
- Semua angka (kWh, m³, Rupiah, skor, lonjakan, hemat misi) dihitung backend (`api/src/hitung.ts`, `api/src/lib/pemakaian.ts`). AI hanya menafsirkan dan merekomendasikan.

## Alur utama: cerita -> data -> audit -> rencana
```mermaid
sequenceDiagram
  actor W as Warga
  participant FE as Next.js
  participant BE as Express
  participant AI as OpenAgentic
  participant DB as MySQL
  W->>FE: tulis cerita rumah
  FE->>BE: POST /api/ai/cerita
  BE->>AI: cerita (data) + daftar alat preset
  AI-->>BE: JSON alat + kebiasaan air
  BE-->>FE: isian form (dicocokkan preset, angka dibatasi, kolom perkiraan)
  W->>FE: cek / ubah form, Simpan & audit
  FE->>BE: PUT /api/rumah/data
  BE->>DB: ganti alat + kebiasaan air (transaksi)
  FE->>BE: POST /api/ai/audit
  BE->>BE: hitung biaya per alat, air, skor (rumus)
  BE->>AI: angka hasil hitung
  AI-->>BE: JSON biang boros + misi (perubahan parameter)
  BE->>BE: validasi misi, hitung hemat Rp tiap misi
  BE->>DB: simpan audit + misi
  BE-->>FE: hasil audit
```

## Alur pantau: catat -> lonjakan -> penjelasan
```mermaid
sequenceDiagram
  actor W as Warga
  participant FE as Next.js
  participant BE as Express
  participant AI as OpenAgentic
  participant DB as MySQL
  W->>FE: catat tagihan listrik (bulanan) / meteran air (mingguan)
  FE->>BE: POST /api/pemakaian
  BE->>DB: simpan catatan
  BE->>BE: deteksi lonjakan (> 1,3x rata-rata)
  BE-->>FE: catatan + info lonjakan
  W->>FE: buka detail lonjakan
  FE->>BE: POST /api/ai/lonjakan
  alt sudah pernah dijelaskan
    BE->>DB: ambil penjelasan tersimpan
  else belum
    BE->>AI: angka lonjakan + riwayat + data rumah
    AI-->>BE: JSON penyebab + langkah cek
    BE->>DB: simpan penjelasan
  end
  BE-->>FE: penyebab + checklist langkah cek
```

## Struktur kode
| Folder | Isi |
|---|---|
| `web/src/app/` | Halaman Next (App Router), `/design` contekan komponen |
| `web/src/components/` | Komponen shadcn (`ui/`) + komponen app (`IconTile`) |
| `web/src/lib/` | `api.ts` (fetch ke `/api`), `format.ts` (Rupiah, angka) |
| `api/src/routes/` | Endpoint per fitur: auth, rumah, pemakaian, lonjakan, beranda, ai, audit, misi |
| `api/src/ai/` | Client AI, prompt, saringan keamanan teks AI |
| `api/src/hitung.ts` | Rumus biaya, skor, hemat misi |
| `api/src/lib/` | Auth (JWT cookie), format error, seri pemakaian & lonjakan, bentuk respons audit |
| `api/db/migrations/` | Skema DB (SQL) |
| `api/src/seed.ts` | Alat preset + akun demo |

## Kebutuhan non-fungsional (Bab 5.3)
| Aspek | Target | Cara memenuhi |
|---|---|---|
| Keamanan | Data rumah hanya bisa dilihat pemiliknya; key AI tidak bocor | Login cookie httpOnly, cek kepemilikan di setiap query, key hanya di env server, rate limit, validasi input & output AI (`docs/SECURITY.md`) |
| Kemudahan pakai | Bisa dipakai orang tua tanpa paham watt/kWh | Input cerita bahasa sehari-hari, hasil dalam Rupiah, huruf ≥16px, tombol ≥44px, satu aksi utama per halaman |
| Keandalan AI | Halaman tidak rusak walau AI gagal/lambat | Timeout 45 dtk, 1x ulang, validasi skema, pesan error ramah + tombol coba lagi, form manual tetap bisa dipakai |
| Konsistensi angka | Input sama, hasil sama | Semua angka dari rumus backend, bukan dari AI |
| Performa | Halaman non-AI cepat; AI dengan indikator | Endpoint non-AI < 1 dtk; cerita ±5-10 dtk, audit ±20-30 dtk dengan loading; penjelasan lonjakan di-cache |
| Portabilitas | Jalan lokal tanpa deploy (Guide Book I.2.a) | `npm run dev` + MySQL/MariaDB (XAMPP); deploy VPS hanya untuk QA tim |

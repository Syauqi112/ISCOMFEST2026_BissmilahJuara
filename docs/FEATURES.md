# Fitur

Bab laporan: 5.2 (kebutuhan fungsional), 6.2 (implementasi fitur).
Update kalau: fitur ditambah, diubah, atau dibatalkan.

Sumber: Konsep Final RumahHemat + scope MVP (prompt 7B), 7 Nov 2026. Halaman & alur: `UI.md`. Endpoint: `API.md`.

## Daftar kebutuhan fungsional
| Kode | Fitur | Prioritas | Status |
|---|---|---|---|
| F-01 | Data Rumah & Audit (1a Ceritakan, 1b Isi Form, audit) | inti | API selesai · web selesai (diuji end-to-end) |
| F-02 | Pantau Pemakaian + deteksi lonjakan + penjelasan AI | inti | API selesai · web selesai (catat, banner, detail + checklist) |
| F-03 | Rencana Hemat (misi, centang, total hemat, progres) | inti | API selesai · web selesai (centang tersimpan) |
| F-04 | Daftar / masuk, data hanya milik sendiri | pendukung (wajib) | API selesai · web selesai |
| F-05 | Profil rumah (penghuni, daya, jenis listrik, tarif) | pendukung (wajib) | API selesai · web selesai |
| F-06 | Ringkasan untuk keluarga (cetak / kirim WA) | opsional, kalau sempat | belum |

## Rumus (backend, `api/src/hitung.ts`)
- **kWh/bulan per alat** = watt × jumlah × jam_per_hari × (hari_per_minggu / 7) × 30 / 1000. **Rp** = kWh × tarif_listrik.
- **Air/bulan per kegiatan** = frekuensi × liter acuan × 30 / 1000 m³. **Rp** = m³ × tarif_air. Liter acuan di `api/src/config.js`.
- **Skor efisiensi (0-100)** = 100 × (1 − biaya_berlebih / biaya_total), dibulatkan.
  biaya_berlebih listrik = jam di atas `jam_wajar` preset × watt × jumlah ... × tarif. Air: liter/orang/hari di atas acuan wajar.
  Artinya: "berapa persen biaya rumahmu yang masih wajar". Bisa dijelaskan ke juri, hasil sama untuk input sama.
- **Hemat misi (Rp/bulan)** = biaya dengan nilai_lama − biaya dengan nilai_baru (rumus di atas).
- **Lonjakan**: listrik bila Rp bulan ini > 1,3 × rata-rata 3 bulan sebelumnya; air bila pemakaian (selisih meteran, dinormalkan 7 hari) > 1,3 × rata-rata 4 periode sebelumnya. Minimal 2 catatan pembanding. Ambang di config.

## Acuan air (dipakai di `api/src/config.ts`)
Riset sumber: Fajar (issue #1). "Asumsi tim" = tidak ada sumber, ditulis sebagai batasan di Bab 4.

| Kegiatan | Liter | Dasar |
|---|---|---|
| Mandi gayung | 18 per mandi | Suara Surabaya (2016) |
| Mandi shower | 38 per mandi | 7,6 L/menit shower hemat (EPA WaterSense) × asumsi 5 menit |
| Cuci baju mesin | 106 per cuci | Batas model hemat (EPA WaterSense); dipilih karena mesin rumah tangga Indonesia umumnya lebih kecil dari rata-rata AS (155 L) |
| Cuci baju manual | 40 per cuci | Asumsi tim |
| Siram tanaman | 20 per siram | 2 L/m² (Jurnal Ismetek 2023) × asumsi taman 10 m² |
| Cuci kendaraan | 40 per cuci | Asumsi tim untuk motor (mobil ±300 L, form belum membedakan) |
| Lain-lain (minum, masak, kloset) | 30 per orang per hari | Kloset 6 L/siram (EPA WaterSense) × asumsi 5 siram/hari |
| **Batas wajar** | **120 per orang per hari** | SNI 03-7065-2005 (dikutip jurnal Unhas) |

Konteks: konsumsi nyata rumah tangga 135-245 L/orang/hari (Jurnal Permukiman, Kementerian PU, 2011). Perkiraan audit hanya dari kebiasaan yang diisi, jadi biasanya di bawah angka meteran; selisihnya = pemakaian yang tidak tercatat atau kebocoran (dideteksi fitur lonjakan).

Tarif listrik demo Rp1.444,70/kWh (1.300 VA) sesuai tarif triwulan IV-2026 (Kompas, 2 Nov 2026). Tarif diisi pengguna dari tagihannya sendiri.

## Seeder
**alat_preset** (watt = kisaran umum di media & jurnal, bisa diubah user sesuai label alat; jam_wajar = asumsi tim, dipakai rumus skor):
| Alat | Watt | Jam wajar/hari |
|---|---|---|
| Lampu LED | 8 | 12 |
| Kipas angin | 45 | 8 |
| TV LED | 55 | 6 |
| Kulkas 1 pintu (rata-rata) | 40 | 24 |
| Kulkas 2 pintu (rata-rata) | 60 | 24 |
| AC 1/2 PK | 400 | 6 |
| AC 1 PK | 800 | 6 |
| Pompa air | 250 | 2 |
| Mesin cuci | 300 | 1.5 |
| Setrika | 350 | 1 |
| Rice cooker (mode hangat) | 50 | 6 |
| Dispenser (rata-rata) | 100 | 12 |
| Pemanas air listrik | 350 | 1 |
| Laptop / komputer | 60 | 8 |
| Router WiFi | 10 | 24 |
| Charger HP | 10 | 4 |
Kulkas & dispenser = rata-rata pemakaian (kompresor/pemanas tidak nyala terus), bukan watt di label.

**Akun demo**: `demo@RumahHemat.id` / `demo12345` (data karangan, bukan data asli).
- Profil: 4 penghuni, 1.300 VA, token, tarif listrik Rp1.444,70/kWh, air Rp7.000/m³.
- Alat (sesuai contoh Konsep Final): AC 1 PK ×1 8 jam · Kulkas 2 pintu ×1 24 jam (watt 50) · TV LED ×1 12 jam (watt 80) · Lampu LED ×8 10 jam · Pompa air ×1 10 jam · Mesin cuci ×1 1 jam 3 hari/minggu.
- Kebiasaan air: mandi 2×/hari gayung, cuci baju 3×/minggu mesin, siram 0, cuci kendaraan 1×/minggu.
- Listrik 6 bulan (Rp): Jun 468.000 · Jul 475.000 · Agu 489.000 · Sep 502.000 · Okt 515.000 · Nov 521.000 (tidak lonjak).
- Air 8 minggu: angka meteran mulai 1.250,0 m³ dengan pemakaian mingguan 4,1 · 3,9 · 4,2 · 4,0 · 3,8 · 4,1 · 4,0 · **6,2** (minggu terakhir 1,55× = lonjakan).
**Akun demo kedua** (babak lonjakan saat presentasi): `budi@RumahHemat.id` / `demo12345`, Pak Budi. Tanggal dihitung mundur dari hari seeder dijalankan.
- Profil sama dengan akun demo. Alat: AC 1/2 PK 8 jam · Kulkas 1 pintu · TV LED 6 jam · Lampu LED ×6 · Pompa air 3 jam · Mesin cuci 3 hari/minggu.
- Listrik 6 bulan berakhir di bulan ini: 468.000 · 475.000 · 489.000 · 502.000 · 515.000 · 521.000 (tidak lonjak).
- Air 8 minggu berakhir hari ini, meteran mulai 1.250,0: 4,1 · 3,9 · 4,2 · **6,0** (1,48× = lonjakan lama, masuk Riwayat) · 4,0 · 3,8 · 4,1 · **6,3** (1,41× = lonjakan minggu ini).
- Akun yang sudah ada tidak disentuh seeder (aman diulang). Dicek 7 Nov: lonjakan jatuh di minggu ke-4 dan minggu ini sesuai rencana.
- Audit + misi tidak di-seed: dijalankan langsung saat demo (atau seed 1 audit sebagai cadangan kalau AI mati).

## Pembagian kerja
| Waktu | Jastin (api) | Andre (web) |
|---|---|---|
| T+1:30 | Migration + seeder, auth (cookie JWT, bcryptjs) | Layout, warna/font, navbar atas, halaman Masuk/Daftar |
| T+2:30 | Profil + data rumah + rumus hitung | Profil Rumah, komponen form alat (dipakai ulang) |
| T+3:00 | Client AI + `/api/ai/cerita` | Tab Ceritakan + dialog gabung (pakai contoh JSON dulu) |
| T+4:00 | `/api/ai/audit` + misi | Hasil Audit |
| T+4:00 | **Cek bareng #1: cerita -> form -> audit jalan end-to-end** | |
| T+5:00 | Pemakaian + lonjakan + `/api/ai/lonjakan` | Rencana Hemat |
| T+6:00 | `/api/beranda` | Beranda (grafik), sheet Catat, Detail lonjakan |
| T+7:00 | Keamanan: rate limit, validasi, cek kepemilikan data | Loading/error/empty di semua panggilan AI |
| T+9:00 | FREEZE: fix bug | FREEZE: fix bug, polish |

Andre tidak perlu menunggu backend: pakai contoh JSON di `API.md` sebagai data sementara, lalu ganti ke `fetch("/api/...")`.

## Cara kerja per fitur
Bagian backend sudah jadi. Halaman (web) ditambahkan Andre saat selesai. Akun uji: `demo@RumahHemat.id` / `demo12345` (data dipakai bersama; untuk uji yang mengubah data, daftar akun sendiri).

### F-04 Daftar / masuk
- Alur: daftar (nama, email, kata sandi ≥8) atau masuk -> diarahkan ke Profil kalau belum isi, kalau sudah ke Beranda.
- Di belakang: `POST /api/auth/daftar|masuk|keluar`, `GET /api/auth/saya`. Password di-hash bcrypt, sesi JWT di cookie httpOnly 7 hari. Rate limit 20 percobaan/15 menit.
- File: `api/src/routes/auth.ts`, `api/src/lib/auth.ts`.
- Tes manual: email salah format; kata sandi < 8; daftar email yang sudah ada; masuk dengan sandi salah (pesan sama dengan email salah); halaman lain tanpa login harus menolak.

### F-05 Profil rumah
- Alur: isi penghuni, daya VA, jenis listrik (token/pascabayar), tarif listrik per kWh, tarif air per m³ (boleh kosong).
- Di belakang: `PUT /api/rumah/profil` (pertama kali membuat, berikutnya mengubah), `GET /api/rumah`.
- File: `api/src/routes/rumah.ts`.
- Tes manual: penghuni 0 atau 21; daya < 450; tarif minus atau huruf; tarif air kosong harus diterima.

### F-01 Data Rumah & Audit
- Alur 1a (Ceritakan): tulis cerita (10-1.000 huruf) -> AI mengubahnya jadi daftar alat + kebiasaan air -> masuk ke form, kolom tebakan AI ditandai. Tidak menyimpan apa pun.
- Alur 1b (Isi Form): pilih alat dari 16 alat umum atau Alat lain; atur jumlah, jam/hari, hari/minggu, watt; isi kebiasaan air -> Simpan & audit.
- Audit: backend menghitung biaya per alat & air dan skor (rumus di atas); AI memilih 3 biang boros dan menyusun misi; hemat Rupiah tiap misi dihitung backend.
- Di belakang: `POST /api/ai/cerita`, `PUT /api/rumah/data` (ganti semua dalam satu transaksi), `POST /api/ai/audit`, `GET /api/audit/terbaru`.
- File: `api/src/routes/ai.ts`, `api/src/hitung.ts`, `api/src/ai/prompts.ts`, `api/src/ai/aman.ts`.
- Tes manual: cerita contoh Konsep Final (harus keluar AC, kulkas, TV, lampu x8, pompa, mesin cuci); cerita berisi permintaan lain ("buatkan kode") harus diabaikan; nama alat berisi simbol aneh ditolak; jam > 24 ditolak; audit tanpa alat ditolak; audit akun demo: skor 70, listrik ±Rp520.525/bulan.

### F-02 Pantau pemakaian + lonjakan
- Alur: catat listrik per bulan (Rupiah tagihan / total beli token) dan air per minggu (angka meteran PDAM) -> grafik di Beranda -> kalau pemakaian > 1,3x rata-rata muncul peringatan -> detail lonjakan: AI menjelaskan kemungkinan penyebab + checklist langkah cek.
- Di belakang: `GET/POST/DELETE /api/pemakaian`, `GET /api/beranda`, `GET /api/lonjakan/:id`, `POST /api/ai/lonjakan` (disimpan, panggilan berikutnya tanpa AI), `PATCH /api/lonjakan/:id/langkah`.
- File: `api/src/routes/pemakaian.ts`, `api/src/lib/pemakaian.ts`, `api/src/routes/lonjakan.ts`, `api/src/routes/beranda.ts`.
- Tes manual: angka meteran lebih kecil dari sebelumnya ditolak; tanggal/bulan masa depan ditolak; akun demo menampilkan lonjakan air minggu terakhir (±1,56x); catat ulang bulan yang sama = koreksi; centang langkah tersimpan setelah refresh.

### F-03 Rencana hemat
- Alur: daftar misi dari audit, urut dari hemat terbesar, masing-masing dengan perkiraan hemat Rp/bulan -> centang -> total hemat bertambah; progres membandingkan rata-rata listrik 3 bulan sebelum audit dengan catatan sesudahnya.
- Di belakang: `GET /api/misi`, `PATCH /api/misi/:id`.
- File: `api/src/routes/misi.ts`, misi dibuat di `api/src/routes/ai.ts` (audit).
- Tes manual: centang lalu refresh (harus tersimpan); total Beranda ikut berubah; audit ulang mengganti rencana; akun demo: pompa 10->2 jam Rp86.682, AC 8->6 jam Rp69.346, TV 12->6 jam Rp20.804.

## Sisi web (Andre)

Semua halaman sudah ada di `web/src/app/` dan memakai API hosting (`API_URL=https://iscomfest-be.jstnlt.id`).
Tidak ada data contoh/dummy di kode: kalau AI gagal, tampil error + tombol coba lagi, bukan angka palsu.

### F-04 Masuk / daftar (web)
- Alur: `/daftar` (nama, email, sandi >= 8) -> `/profil`; `/masuk` -> `/beranda`.
- Di belakang: `POST /api/auth/daftar|masuk` set cookie httpOnly; `AppShell` pakai `GET /api/auth/saya` untuk nama di header, `POST /api/auth/keluar` untuk keluar.
- File: `web/src/app/masuk/page.tsx`, `web/src/app/daftar/page.tsx`, `web/src/components/app-shell.tsx`.
- Tes manual: daftar akun baru -> mendarat di `/profil`; buka `/beranda` tanpa login -> diarahkan ke `/masuk`; sandi < 8 -> pesan jelas; proses simpan -> tombol disable + spinner.

### F-05 Profil rumah (web)
- Alur: isi penghuni, daya VA, token/pascabayar, tarif Rp/kWh, tarif air -> Lanjut ke data rumah.
- File: `web/src/app/profil/page.tsx`.
- Tes manual: ubah tarif lalu simpan, refresh -> nilai tetap; kosongkan tarif air -> boleh, tidak error.

### F-01 Data rumah & audit (web)
- Tab **Ceritakan**: tulis cerita -> Proses cerita -> loading "AI sedang menganalisis..." -> AI mengisi form -> pindah ke tab Isi form. Kalau form sudah berisi, muncul dialog "Tambahkan ke daftar" / "Ganti semua"; alat dengan preset sama digabung, tidak dobel.
- Tab **Isi form**: tabel alat (jumlah, jam/hari, hari/minggu, watt), kolom hasil AI ditandai garis putus-putus + chip "N alat perkiraan AI" yang hilang begitu diedit; tambah alat dari 16 preset atau "Alat lain"; form kebiasaan air 6 kolom; tombol **Simpan & audit** -> `PUT /api/rumah/data` lalu `POST /api/ai/audit` lalu pindah ke `/audit`.
- Hasil audit: cincin skor, total listrik & air per bulan, ranking biaya per alat (bar), 3 biang boros dari AI.
- File: `web/src/app/rumah/page.tsx`, `web/src/components/rumah/alat-editor.tsx`, `web/src/app/audit/page.tsx`.
- Tes manual: cerita contoh Konsep Final -> 6 alat muncul; edit satu jam -> tanda AI hilang di baris itu; Simpan & audit -> skor muncul; akun tanpa audit -> empty state "Belum ada hasil audit" + tombol ke data rumah.

### F-02 Pantau pemakaian & lonjakan (web)
- Alur: Beranda -> **Catat pemakaian** (tab Listrik: bulan + Rp tagihan/token; tab Air: tanggal + angka meteran, harus lebih besar dari catatan sebelumnya) -> banner merah kalau lonjakan -> `/lonjakan/[id]` -> centang langkah cek (tersimpan).
- Ubah / hapus catatan: Beranda -> "Lihat & ubah catatan" -> Riwayat catatan. Ubah = catat ulang periode yang sama (ditimpa), hapus = `DELETE /api/pemakaian/:id`. Grafik dan lonjakan dihitung ulang.
- File: `web/src/app/beranda/page.tsx`, `web/src/components/catat-dialog.tsx`, `web/src/components/riwayat-catatan.tsx`, `web/src/app/lonjakan/[id]/lonjakan-client.tsx`.
- Tes manual: Rp > 100 juta -> pesan di bawah isian; ubah catatan dari riwayat -> angka berubah di grafik; hapus -> hilang dari grafik; tanggal sebelum catatan lain dengan angka lebih besar -> pesan menjelaskan meteran selalu naik; angka meteran lebih kecil -> tombol Simpan nonaktif + peringatan; catat listrik -> grafik batang bertambah; detail lonjakan -> loading AI lalu penyebab + checklist; centang langkah -> refresh tetap tercentang.

### F-03 Rencana hemat (web)
- Alur: `/rencana` -> centang misi -> total hemat naik tanpa reload (dihitung dari `hemat_rp` backend) -> grafik sebelum/sekarang/kalau dijalankan.
- File: `web/src/app/rencana/page.tsx`.
- Tes manual: centang lalu refresh -> tetap; matikan internet lalu centang -> toast error + centang kembali; akun dengan 1 catatan listrik -> grafik diganti pesan "butuh catatan bulan sebelumnya" (bukan grafik kosong).

### Verifikasi (Andre, Chrome headless ke backend hosting)
- Akun demo: login -> Beranda, semua endpoint 200.
- Akun baru: daftar -> profil -> cerita (6 alat terisi AI) -> Simpan & audit (skor 69/100) -> rencana terisi.
- Centang misi -> total naik (Rp86.682) dan tetap setelah refresh; Beranda "Target hemat" ikut berubah.
- Detail lonjakan: AI mengembalikan 4 penyebab + 6 langkah cek; centang langkah tersimpan setelah refresh.
- `tsc` 0 error, `eslint` 0 warning, `next build` sukses (12 route). Lebar 390px tanpa scroll horizontal.

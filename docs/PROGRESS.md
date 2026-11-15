# Progress

Bab laporan: bahan 6.2 dan pitch.
Update kalau: satu fitur / perbaikan penting selesai. Satu baris, tambah di **paling bawah**, `git pull --rebase` dulu.

Format: `- HH:MM · siapa · fitur · status (selesai / sebagian / batal) · catatan atau path screenshot`

## Log
- 07:42 · Jastin · kerangka web (Next 16 + shadcn) + api (Express + MySQL), rewrite /api, Dockerfile · selesai · /api/health db:true lokal
- 08:21 · Jastin · docs/UI.md + mockup alur HematRumah (docs/mockup.html) · selesai · konsep final disepakati tim
- 08:27 · Jastin · scope MVP (7B): API.md, DATABASE.md, AI.md, FEATURES.md (rumus, seeder, pembagian kerja), Tentang di AGENTS.md · selesai · skor dihitung backend
- 08:33 · Jastin · mockup diubah jadi layout website (nav atas, desktop dulu, responsif) · selesai
- 09:02 · Jastin · design system web: palet shadcn, font, ukuran ramah orang tua, 19 komponen shadcn, IconTile, format/api helper, halaman /design · selesai
- 09:06 · Jastin · docs: sinkron endpoint simpan data rumah + navbar atas, IDEA.md opsional (issue #1) · selesai
- 09:10 · Jastin · backend: migrasi SQL + runner, seeder (16 alat preset, akun demo, listrik 6 bln, air 8 mgg), auth daftar/masuk/keluar/saya (cookie JWT, bcrypt, rate limit), GET /api/alat-preset · selesai · dites curl
- 09:12 · Jastin · backend dipindah ke TypeScript (tsx dev, tsc build ke dist, start = migrate+seed+server) · selesai
- 09:15 · Jastin · API profil rumah: GET /api/rumah, PUT /api/rumah/profil (validasi per field, upsert) · selesai · dites curl
- 09:17 · Jastin · API PUT /api/rumah/data (ganti semua alat + kebiasaan air dalam transaksi) + rumus hitung api/src/hitung.ts (dicek: demo skor 70, listrik Rp520.525, air Rp75.600) · selesai
- 09:21 · Jastin · API pemakaian (GET/POST/DELETE, validasi meteran naik & tanggal), deteksi lonjakan (lib/pemakaian.ts), GET /api/lonjakan/:id + PATCH langkah, GET /api/beranda (skor rumus, grafik, lonjakan aktif) · selesai · dites akun demo: air 1,56x
- 09:35 · Jastin · client AI OpenAgentic (deepseek-v4.1-flash): chatJson + validasi zod + retry, npm run ai:cek (JSON OK, ±2,7 dtk) · selesai
- 09:38 · Jastin · API POST /api/ai/cerita (cerita -> isian form, cocok preset, clamp, kolom perkiraan, anti prompt injection, rate limit AI per akun) · selesai · dites contoh Konsep Final: 6 alat benar
- 09:41 · Jastin · API POST /api/ai/audit (hitung backend + tafsir AI, hemat misi dari rumus), GET /api/audit/terbaru, GET /api/misi, PATCH /api/misi/:id · selesai · demo: pompa Rp86.682, AC Rp69.346, TV Rp20.804 (cocok mockup)
- 09:43 · Jastin · API POST /api/ai/lonjakan (penyebab + langkah cek dari AI, disimpan/cache) · selesai · demo: penyebab #1 pelampung toren · BACKEND INTI SELESAI
- 09:48 · Jastin · keamanan AI: blok BATAS TUGAS di semua prompt, saringan teksAman untuk keluaran AI, validasi nama alat; prompt audit tidak melebih-lebihkan · selesai · diuji 4 serangan (kode, bocor prompt, SQL di nama alat, injeksi lewat nama alat)
- 09:52 · Jastin · angka acuan air & watt diganti versi bersumber (issue #1), batas wajar air 120 L SNI; TECH-STACK versi lengkap; alasan model AI di AI.md · selesai
- 09:54 · Jastin · tes README dari clone bersih (DB baru, tanpa key AI): lolos ±5 menit; README dirapikan (Windows copy, DB otomatis, troubleshooting) · selesai
- 10:35 · Andre · shell halaman (nav atas + footer nomor commit), komponen state AI (loading "AI sedang menganalisis...", error + coba lagi, empty), lib API + tipe kontrak, helper ikon alat · selesai
- 10:52 · Andre · halaman Masuk + Daftar (cookie httpOnly, pesan error ramah, tombol disable saat proses) · selesai
- 11:08 · Andre · Profil Rumah (penghuni, daya, jenis listrik, tarif Rp/kWh & Rp/m³) · selesai · PUT /api/rumah/profil
- 11:40 · Andre · Data Rumah: tab Ceritakan (AI isi form, dialog gabung vs ganti) + tab Isi Form (tabel alat, kolom perkiraan AI garis putus-putus, 16 preset / Alat lain, kebiasaan air) + Simpan & audit · selesai
- 12:05 · Andre · Hasil Audit: cincin skor, total listrik & air, ranking biaya per alat, 3 biang boros · selesai
- 12:24 · Andre · Rencana Hemat: daftar misi, centang -> total naik instan, grafik sebelum/sekarang/kalau dijalankan · selesai
- 12:41 · Andre · Beranda: banner lonjakan, 4 kartu ringkas, grafik listrik per bulan + air per minggu (rata-rata & titik lonjakan), dialog Catat pemakaian · selesai
- 12:58 · Andre · Detail lonjakan: angka vs biasanya, kemungkinan penyebab AI, checklist langkah cek yang tersimpan · selesai
- 13:26 · Andre · arahkan web ke API hosting (API_URL=https://iscomfest-be.jstnlt.id); tidak ada data contoh di kode · selesai
- 13:41 · Andre · uji end-to-end akun baru: daftar -> profil -> cerita (6 alat terisi AI) -> Simpan & audit (skor 69/100) -> rencana terisi · selesai
- 13:52 · Andre · uji interaksi: centang misi tersimpan setelah refresh (Rp86.682, Beranda ikut), langkah cek lonjakan tersimpan, validasi angka meteran air · selesai
- 14:05 · Andre · build produksi bersih (tsc, eslint, next build 12 route), lebar 390px tanpa scroll horizontal · selesai
- 10:12 · Jastin · penanda versi di footer (commit lokal + waktu build WIB, VPS pakai waktu build); AI model cadangan otomatis di OpenAgentic (deepseek-v4-flash) · selesai · diuji model salah -> cadangan
- 11:30 · Jastin · landing page di `/` (branch redesign): hero kabel cerita beranimasi, cara kerja, lonjakan air, contoh hasil Ibu Sri, keamanan, FAQ, CTA, footer; animasi saat gulir + navbar aktif · menunggu ACC
- 11:50 · Jastin · halaman masuk/daftar dirombak sebahasa dengan landing (panel gelap + contoh hasil bergantian, form putih) · menunggu ACC
- 11:55 · Jastin · dashboard: sidebar gelap + lembar isi, Beranda grid (angka kunci, grafik bertab, perlu dicek, catatan terakhir), menu & halaman Lonjakan, Audit/Rencana/Lonjakan/Data Rumah/Profil dirombak, skeleton loading, modal seragam (ubah profil jadi modal) · menunggu ACC
- 12:10 · Jastin · landing responsif HP/tablet: animasi muncul tidak kelewatan lagi, menu lipat < 1024px, hero rata tengah di HP, grafik air & statistik rapi di HP, footer bertumpuk · selesai
- 12:15 · Jastin · /masuk dan /daftar mengalihkan pengguna yang sudah login ke /beranda (atau /profil kalau profil belum ada) · selesai · diuji login lalu buka /masuk & /daftar
- 12:25 · Jastin · bar atas HP: nama pengguna + dropdown akun (nama, email, Keluar); Beranda kini benar menyapa "Halo, nama" · selesai · diuji 390px
- 12:45 · Jastin · ilustrasi sendiri (9 SVG) di empty state, 404, sambutan profil, langkah cek selesai; proses AI cerita & audit jadi modal beranimasi (tidak bisa ditutup saat proses) · selesai · modal diuji di /design
- 12:55 · Jastin · ilustrasi kalender untuk riwayat lonjakan kosong; modal proses AI di Data Rumah direset saat halaman ditinggalkan (sebelumnya masih terbuka saat kembali dari Audit) · selesai
- 13:00 · Jastin · Beranda akun baru: skor null tidak lagi tampil "null"; kartu ajakan "Ceritakan rumahmu dulu" + keterangan kosong yang jelas; tipe Beranda.skor/rata_air_m3 diselaraskan dengan docs/API.md (bisa null) · selesai
- 13:20 · Jastin · onboarding: sebelum profil rumah diisi semua menu terkunci + diarahkan ke /profil; profil ada tapi alat belum -> penanda "isi dulu" di Data Rumah; empty state Audit/Rencana/Lonjakan sesuai kondisi akun dengan tombol aksi (Ceritakan rumahmu, Buka Data Rumah, Catat pemakaian pertama); Catat bisa langsung dari halaman Lonjakan · selesai
- 13:30 · Jastin · input angka (InputAngka): dihapus jadi kosong bukan 0, nol depan dibuang ("03" -> "3"), dipakai di profil, tabel alat, kebiasaan air; kartu sambutan /profil rata tengah + hint "Untuk mengakses semua menu, isi profil rumah terlebih dahulu" · selesai · diuji di /profil
- 13:45 · Jastin · validasi form pakai zod di web (masuk, daftar, profil, tabel alat, kebiasaan air): kotak salah merah + alasan di bawahnya, tanpa bubble browser; pesan per isian dari server ikut ditampilkan · selesai · diuji isian salah tidak mengirim request
- 13:55 · Jastin · kursor: semua yang bisa diklik pointer (tombol, tab, checkbox, select, menu), nonaktif not-allowed · selesai · dicek computed style
- 14:15 · Jastin · onboarding 2 langkah (profil -> ceritakan rumah, menu terkunci sampai Simpan & audit pertama), tur sorot driver.js di Ceritakan, Isi form, dan Beranda; modal sambutan setelah audit pertama; "Ulangi tur" di menu akun · selesai · tur Beranda diuji, tur Ceritakan perlu akun baru
- 14:25 · Jastin · tur: popover tidak lagi menutupi elemen yang disorot (posisi dipilih driver.js), garis kuning hanya untuk menu sidebar/tab bawah, sisi popover diabaikan di layar kecil · selesai · diuji 1366 & 390
- 14:35 · Jastin · onboarding: kartu langkah 1 & 2 seragam (KartuAwal), langkah 1 yang sudah selesai bisa diklik untuk kembali, tombol "Kembali ke profil rumah" di langkah 2, tur Ceritakan diawali sorot tombol Ubah profil · selesai
- 14:40 · Jastin · penanda menu Data Rumah saat onboarding jadi titik kuning berdenyut (tanpa teks "isi dulu"); /profil selebar halaman lain supaya langkah 1 & 2 sama · selesai
- 14:48 · Andre · pasang logo resmi dari desainer di semua tempat merek (sidebar, bar atas HP, navbar landing, panel masuk/daftar, footer landing) + favicon/icon/apple-icon dari aset yang sama · selesai · komponen web/src/components/logo.tsx, aset di web/public/brand/
- 13:17 · Jastin · Beranda: riwayat catatan (ubah/hapus catatan listrik & air), dialog Catat ikut tab grafik + validasi per isian + Rupiah ditulis ulang + pesan meteran yang menjelaskan aturan naik, air dengan 1-2 bacaan tidak lagi grafik kosong, kartu Perlu dicek menampilkan kesiapan cek lonjakan · selesai · diuji akun baru di lokal
- 13:21 · Jastin · konfeti saat semua langkah cek lonjakan / misi rencana dicentang (canvas-confetti, palet aplikasi), kartu selesai baru di Rencana Hemat, kartu selesai muncul beranimasi · selesai
- 13:39 · Jastin · Data Rumah: modal gabung cerita menampilkan isi form nanti seperti diff (+ baru, ± berubah, − dihapus) dan akibat Gabungkan/Ganti semua; proses AI (cerita, audit) yang gagal tetap di modal dengan ilustrasi + alasan sesuai jenis error, Coba lagi, dan Atur data dulu / Isi form manual · selesai
- 13:52 · Jastin · AI: perbaiki audit kadang 502 AI_GAGAL (upstream OpenAgentic `cmb-` membuang system prompt, model berpikir kehabisan max_tokens): instruksi diulang di pesan user, max_tokens 6000/8000, log finish_reason, ref misi "alat:105" tidak lagi membuang misi · selesai · audit 6/6, cerita 3/3, ai:cek OK
- 13:59 · Jastin · fix POST /api/ai/lonjakan 500 SERVER untuk lonjakan ekstrem (rasio ≥ 100× melebihi DECIMAL(4,2)): migrasi 002 melebarkan lonjakan.rasio ke DECIMAL(8,2) · selesai · jalan otomatis saat API di-deploy
- 14:03 · Jastin · fix grafik air Beranda lag saat angka besar (sumbu Y dulu 1 garis tiap 2 m³ = puluhan ribu garis): ±5 garis berlangkah rapi, label pakai pemisah ribuan · selesai
- 14:11 · Jastin · landing: lompat ke #bagian meluncur halus (scroll-behavior smooth + jarak navbar, mati kalau kurangi animasi) · selesai
- 14:37 · Jastin · AI: rantai cadangan 3 lapis dalam 100 dtk (OpenAgentic gemini-3.8-flash-high -> OpenAgentic deepseek-v4.1-flash -> DeepSeek resmi deepseek-flash, env AI2_*), penyedia bermasalah langsung lompat ke penyedia kedua, ai:cek mengetes tiap lapis, baris keep-alive DeepSeek dibuang · selesai · cerita/audit/lonjakan lolos di Gemini, fallback paksa diuji
- 14:50 · Jastin · masuk/daftar: tombol mata untuk tampilkan/sembunyikan kata sandi (`components/input-sandi.tsx`) · selesai
- 14:52 · Jastin · fix latar krem terlihat saat scroll ditarik melewati ujung (efek karet trackpad Mac) di dashboard & landing: overscroll-behavior none · selesai
- 15:00 · Jastin · seeder: akun demo kedua budi@hematrumah.id (lonjakan air lama 1,48x di Riwayat + lonjakan minggu ini 1,41x, tanggal relatif hari setup), seeder per akun (akun yang ada tidak disentuh) · selesai · db:setup lokal dicek
- 15:21 · Jastin · fix cerita mengosongkan daftar alat sejak model Gemini: nama alat "TV LED (±55 W)" ditolak filter karena ±, akhiran watt sekarang dibuang sebelum dicocokkan ke preset · selesai · diuji API lokal
- 15:27 · Jastin · dokumentasi: 16 screenshot halaman (docs/screenshots, data lokal bersih) + 5 diagram PNG (docs/diagram: arsitektur, alur pengguna, 2 alur sequence, ERD), flowchart alur pengguna ditambahkan ke UI.md · selesai
- 15:31 · Jastin · issue #4: nama alat yang ditolak (karakter aneh / >60 huruf) kini ditandai di isiannya + dicek di dialog Alat lain (aturan sama dengan server); kiriman terlalu besar dijawab 413, bukan 500 · selesai
- 15:40 · Jastin · docs: SECURITY.md dilengkapi (API key, XSS, cek kepemilikan terbukti QA, 413), baris upload dihapus, path .js -> .ts; sisa DATA_DIR/upload dibuang dari README, AGENTS, .env.example, Dockerfile api · selesai
- 15:53 · Jastin · issue #4 (TC-HP-002): nama alat panjang di tabel Data Rumah turun baris di HP, tidak lagi membuat halaman melebar · selesai · dicek 390px
- 16:01 · Jastin · issue #4 (TC-HP-002): nama pengguna panjang di bar atas HP dipotong (min-w-0 di tombol akun & nama), Beranda tidak lagi melebar · selesai · dicek 390px

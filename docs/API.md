# Kontrak API (frontend <-> backend)

Bab laporan: 5.4 (rancangan sistem), 6.2.
Update kalau: endpoint, request, atau response berubah. Ini kesepakatan Jastin (api) dan Andre (web): **ubah di sini dulu, kabari grup, baru ubah kode.**

## Aturan umum
- Semua path diawali `/api`. Frontend memanggil relatif (`fetch("/api/rumah")`), lewat rewrite Next.
- JSON, nama field `snake_case`, uang dalam **Rupiah bulat (integer)**, kWh/m³ desimal.
- Login pakai cookie `httpOnly` (`sid`, JWT) yang di-set server. Frontend cukup `fetch` biasa (same-origin), tanpa token di localStorage.
- Endpoint selain `/api/auth/*`, `/api/health`, `/api/alat-preset` wajib login -> `401` kalau belum.
- Error selalu: `{ "error": { "kode": "VALIDASI", "pesan": "Kalimat ramah untuk ditampilkan", "field": { "email": "..." } } }`
  Kode: `VALIDASI` 400 · `BELUM_LOGIN` 401 · `TIDAK_DITEMUKAN` 404 · `BATAS_AI` 429 · `AI_GAGAL` 502.
- Endpoint AI (`/api/ai/*`) kena rate limit per akun. Waktu tunggu bisa 5-20 dtk: frontend wajib loading + tombol coba lagi.

## Auth
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/auth/daftar` | `{ nama, email, password }` (password >= 8) | `201 { user: { id, nama, email } }` + cookie |
| POST | `/api/auth/masuk` | `{ email, password }` | `200 { user }` + cookie |
| POST | `/api/auth/keluar` | - | `204` |
| GET | `/api/auth/saya` | - | `200 { user, punya_profil: bool, punya_data_rumah: bool }` (dipakai untuk arahkan ke /profil atau /rumah) |

## Profil & data rumah
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/alat-preset` | - | `{ alat: [{ id, nama, watt, kategori }] }` |
| GET | `/api/rumah` | - | `{ profil, alat: [Alat], kebiasaan_air }` (null kalau belum diisi) |
| PUT | `/api/rumah/profil` | `{ penghuni, daya_va, jenis_listrik: "token"\|"pascabayar", tarif_listrik, tarif_air }` (angka boleh string; `tarif_air` kosong/null = tanpa PDAM; dipanggil pertama kali = membuat profil) | `{ profil }` |
| PUT | `/api/rumah/data` | `{ alat: [Alat tanpa id], kebiasaan_air }` | `{ alat, kebiasaan_air }` **satu-satunya jalur simpan data rumah, mengganti semua**. Wajib profil dulu (kalau belum: 400). Batas: maks 50 alat, jumlah 1-50, jam 0-24, hari 1-7, watt 1-5000. `preset_id` tak dikenal -> Alat lain. Error per baris: `field["alat.0.jam_per_hari"]` |

`Alat` = `{ id, preset_id|null, nama, jumlah, jam_per_hari (0-24), hari_per_minggu (1-7), watt, dari_ai: bool }`
`kebiasaan_air` = `{ mandi_per_hari, cara_mandi: "gayung"|"shower", cuci_baju_per_minggu, cuci_pakai_mesin: bool, siram_tanaman_per_minggu, cuci_kendaraan_per_minggu }`

## AI
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/ai/cerita` | `{ cerita }` (maks 1.000 karakter) | `{ alat: [Alat tanpa id, dari_ai: true], kebiasaan_air, kolom_perkiraan: ["alat.0.jam_per_hari", ...], catatan: ["Watt dispenser tidak diketahui, isi sendiri"] }` **tidak menyimpan apa pun** |
| POST | `/api/ai/audit` | - (pakai data rumah tersimpan) | `Audit` (lihat bawah). Menyimpan audit + mengganti daftar misi |
| GET | `/api/audit/terbaru` | - | `Audit` atau `404` |
| POST | `/api/ai/lonjakan` | `{ catatan_id }` | `Lonjakan` (hasil AI disimpan, panggilan ke-2 untuk catatan yang sama tidak memanggil AI lagi; ±8 dtk pertama kali). 404 kalau bukan lonjakan / bukan milik user. Koreksi catatan menghapus penjelasan lama |

`/api/ai/cerita`: `watt` bisa `null` untuk Alat lain yang wattnya tidak disebut (wajib diisi user sebelum simpan). `catatan` maks ±4 kalimat untuk ditampilkan. Semua `/api/ai/*` dibatasi 8 panggilan/menit dan 120/hari per akun (`429 BATAS_AI`).

`/api/ai/audit` butuh profil + minimal 1 alat (kalau belum: 400). Waktu ±20 dtk. `biang_boros[].ref` bisa `null` kalau AI menunjuk hal di luar data; `rp_bulan`/`persen_listrik` dari backend (persen null untuk air). Audit baru mengganti seluruh misi.

Gabung hasil cerita ke form ("Tambahkan ke daftar" / "Ganti semua") dikerjakan **frontend** di state form, lalu disimpan lewat `PUT /api/rumah/data`.
Aturan gabung: alat dengan `preset_id` sama (atau nama sama untuk Alat lain) -> ambil nilai dari cerita, tidak dobel.

```json
// Audit
{
  "id": 3, "dibuat": "2026-11-07T10:12:00+07:00",
  "skor": 58,
  "listrik": { "kwh_bulan": 360.3, "rp_bulan": 520500 },
  "air":     { "m3_bulan": 16.0, "rp_bulan": 112000 },
  "rincian_alat": [ { "alat_id": 12, "nama": "AC 1 PK", "kwh_bulan": 192.0, "rp_bulan": 277382, "persen": 53 } ],
  "rincian_air":  [ { "kegiatan": "mandi", "m3_bulan": 9.6, "rp_bulan": 67200 } ],
  "biang_boros": [ { "judul": "Pompa air nyala ±10 jam", "alasan": "Pompa rumah biasanya ...", "ref": "alat:15", "rp_bulan": 108353, "persen_listrik": 21 } ],
  "ringkasan": "Satu kalimat dari AI"
}
```

```json
// Lonjakan
{
  "catatan_id": 41, "jenis": "air", "periode": "2026-11-07",
  "pemakaian": 6.2, "rata_rata": 4.0, "rasio": 1.55, "satuan": "m3", "ekstra_rp": 15400,
  "kemungkinan_penyebab": [ { "judul": "Tangki kloset bocor", "alasan": "..." } ],
  "langkah_cek": [ { "teks": "Tutup semua keran, catat angka meteran", "selesai": false } ],
  "kapan_panggil_tukang": "Kalau angka tetap naik setelah semua keran ditutup ..."
}
```

## Rencana hemat
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/misi` | - | `{ misi: [Misi], total_dicentang_rp, total_potensi_rp, progres: { listrik_sebelum_rp, listrik_terakhir_rp } }` |
| PATCH | `/api/misi/:id` | `{ selesai: bool }` | `{ misi, total_dicentang_rp }` |

`Misi` = `{ id, urutan, judul, deskripsi, perubahan: "AC 8 -> 6 jam/hari", hemat_rp, selesai }` (urut dari `hemat_rp` terbesar).
`hemat_rp` dihitung backend dari `perubahan`, bukan dari AI. Frontend boleh langsung menjumlah `hemat_rp` misi yang dicentang biar angka naik instan, lalu sinkron dengan response.

## Pemakaian (pantau)
| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/pemakaian?jenis=listrik\|air` | - | `{ data: [{ id, periode, nilai, pemakaian, lonjakan: bool }] }` urut lama -> baru |
| POST | `/api/pemakaian` | listrik: `{ jenis: "listrik", periode: "2026-11", nilai_rp }` · air: `{ jenis: "air", tanggal: "2026-11-07", angka_meteran }` | `201 { catatan, lonjakan: Lonjakan-ringkas \| null }` |
| DELETE | `/api/pemakaian/:id` | - | `204` |
| GET | `/api/lonjakan/:catatan_id` | - | `Lonjakan`; field AI (`kemungkinan_penyebab`, `langkah_cek`, `kapan_panggil_tukang`) = `null` kalau penjelasan AI belum dibuat. 404 kalau catatan bukan lonjakan / bukan milik user |
| PATCH | `/api/lonjakan/:catatan_id/langkah` | `{ index, selesai }` | `{ langkah_cek }`. 400 kalau penjelasan AI belum ada |

Listrik: `pemakaian` = Rp bulan itu (token = perkiraan). Air: `pemakaian` = selisih angka meteran dengan catatan sebelumnya, dinormalkan ke 7 hari.
Validasi air: angka meteran harus > catatan sebelumnya dan < catatan sesudahnya; tanggal/bulan tidak boleh di masa depan.
Catat ulang bulan (listrik) / tanggal (air) yang sama = koreksi (menimpa), penjelasan AI lonjakan lama dihapus.
`Lonjakan-ringkas` = `{ catatan_id, jenis, periode, pemakaian, rata_rata, rasio, satuan: "rp"|"m3", ekstra_rp }`.

## Beranda
| Method | Path | Response |
|---|---|---|
| GET | `/api/beranda` | `{ skor, total_dicentang_rp, listrik: [{ catatan_id, periode, rp, lonjakan }] (6 terakhir), air: [{ catatan_id, periode, m3, lonjakan }] (8 terakhir), rata_air_m3, lonjakan_aktif: [Lonjakan-ringkas] }`. `skor` dari rumus (null kalau belum ada alat). `lonjakan_aktif` = titik terakhir listrik/air yang lonjak |

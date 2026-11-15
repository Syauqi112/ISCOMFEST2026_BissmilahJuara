-- Skema awal HematRumah. Lihat docs/DATABASE.md. Aman untuk MySQL 8 dan MariaDB (XAMPP).

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rumah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  penghuni TINYINT UNSIGNED NOT NULL,
  daya_va INT UNSIGNED NOT NULL,
  jenis_listrik ENUM('token','pascabayar') NOT NULL,
  tarif_listrik DECIMAL(10,2) NOT NULL,
  tarif_air DECIMAL(10,2) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alat_preset (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(60) NOT NULL UNIQUE,
  watt INT UNSIGNED NOT NULL,
  jam_wajar DECIMAL(4,1) NOT NULL,
  kategori VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rumah_alat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rumah_id INT NOT NULL,
  preset_id INT NULL,
  nama VARCHAR(60) NOT NULL,
  jumlah TINYINT UNSIGNED NOT NULL,
  jam_per_hari DECIMAL(4,1) NOT NULL,
  hari_per_minggu TINYINT UNSIGNED NOT NULL,
  watt INT UNSIGNED NOT NULL,
  dari_ai BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (rumah_id) REFERENCES rumah(id) ON DELETE CASCADE,
  FOREIGN KEY (preset_id) REFERENCES alat_preset(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kebiasaan_air (
  rumah_id INT PRIMARY KEY,
  mandi_per_hari TINYINT UNSIGNED NOT NULL,
  cara_mandi ENUM('gayung','shower') NOT NULL,
  cuci_baju_per_minggu TINYINT UNSIGNED NOT NULL,
  cuci_pakai_mesin BOOLEAN NOT NULL,
  siram_tanaman_per_minggu TINYINT UNSIGNED NOT NULL,
  cuci_kendaraan_per_minggu TINYINT UNSIGNED NOT NULL,
  FOREIGN KEY (rumah_id) REFERENCES rumah(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE catatan_pemakaian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rumah_id INT NOT NULL,
  jenis ENUM('listrik','air') NOT NULL,
  tanggal DATE NOT NULL,
  nilai DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_catatan (rumah_id, jenis, tanggal),
  FOREIGN KEY (rumah_id) REFERENCES rumah(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lonjakan (
  catatan_id INT PRIMARY KEY,
  rasio DECIMAL(4,2) NOT NULL,
  ai_json JSON NULL,
  langkah_selesai JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catatan_id) REFERENCES catatan_pemakaian(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rumah_id INT NOT NULL,
  skor TINYINT UNSIGNED NOT NULL,
  kwh_bulan DECIMAL(10,1) NOT NULL,
  rp_listrik INT UNSIGNED NOT NULL,
  m3_bulan DECIMAL(10,1) NOT NULL,
  rp_air INT UNSIGNED NOT NULL,
  rincian_json JSON NOT NULL,
  ai_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rumah_id) REFERENCES rumah(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE misi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  audit_id INT NOT NULL,
  rumah_id INT NOT NULL,
  urutan TINYINT UNSIGNED NOT NULL,
  judul VARCHAR(120) NOT NULL,
  deskripsi VARCHAR(300) NOT NULL,
  target_tipe ENUM('alat','air') NOT NULL,
  target_ref VARCHAR(40) NOT NULL,
  nilai_lama DECIMAL(6,1) NOT NULL,
  nilai_baru DECIMAL(6,1) NOT NULL,
  hemat_rp INT UNSIGNED NOT NULL,
  selesai BOOLEAN NOT NULL DEFAULT FALSE,
  selesai_at DATETIME NULL,
  FOREIGN KEY (audit_id) REFERENCES audit(id) ON DELETE CASCADE,
  FOREIGN KEY (rumah_id) REFERENCES rumah(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

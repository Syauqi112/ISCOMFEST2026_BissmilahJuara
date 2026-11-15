-- rasio DECIMAL(4,2) maksimal 99,99: lonjakan ekstrem (mis. salah ketik satu nol di tagihan,
-- rasio 100x) gagal disimpan dan POST /api/ai/lonjakan jadi 500. Dilebarkan, data lama aman.
ALTER TABLE lonjakan MODIFY rasio DECIMAL(8,2) NOT NULL;

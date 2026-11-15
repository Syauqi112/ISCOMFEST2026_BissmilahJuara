// Cek konfigurasi AI: npm run ai:cek  (tidak menampilkan API key)
// Mencoba setiap lapis rantai cadangan satu per satu, supaya ketahuan lapis mana yang hidup.
import { z } from "zod";
import { LAPIS, MODEL, chatJsonSatuLapis, daftarModel } from "./client.js";

console.log(`utama: ${process.env.AI_BASE_URL} · model: ${MODEL} · key: ${process.env.AI_API_KEY ? "terisi" : "KOSONG"}`);
try {
  const m = await daftarModel();
  console.log(`models penyedia utama: ${m.length} · model utama ada di daftar: ${m.includes(MODEL) ? "YA" : "TIDAK"}`);
} catch (e) {
  console.log(`models gagal: ${(e as Error).message}`);
}
for (const [i, lapis] of LAPIS.entries()) {
  const t = Date.now();
  try {
    const out = await chatJsonSatuLapis(
      {
        system: "Kamu asisten hemat energi rumah tangga Indonesia.",
        user: 'Beri 1 tips hemat listrik singkat. Format: {"tips": string, "hemat_persen_perkiraan": number}',
        schema: z.object({ tips: z.string().min(5), hemat_persen_perkiraan: z.number() }),
        maxTokens: 2000,
      },
      lapis,
    );
    console.log(`lapis ${i + 1} ${lapis.p.nama}/${lapis.model}: OK ${Date.now() - t}ms · ${out.tips.slice(0, 60)}`);
  } catch (e) {
    console.log(`lapis ${i + 1} ${lapis.p.nama}/${lapis.model}: GAGAL ${Date.now() - t}ms · ${(e as Error).message}`);
  }
}

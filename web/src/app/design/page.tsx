"use client";

// Halaman contekan design system (bukan fitur). Buka /design saat ngoding.
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, XAxis } from "recharts";
import { AirVent, Droplet, PiggyBank, TriangleAlert, Waves, Zap } from "lucide-react";
import { toast } from "sonner";
import { IconTile } from "@/components/icon-tile";
import * as Ilustrasi from "@/components/ilustrasi";
import { ProsesAi } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rupiah, rupiahRingkas } from "@/lib/format";

const warna = [
  ["primary", "bg-primary", "Biru tinta: brand, tombol"],
  ["listrik", "bg-listrik", "Kuning: semua soal listrik"],
  ["air", "bg-air", "Biru air: semua soal air"],
  ["warn", "bg-warn", "Oranye bata: peringatan"],
  ["background", "bg-background", "Krem: latar halaman"],
  ["card", "bg-card", "Putih: kartu"],
] as const;

const listrik = [
  { bulan: "Jun", rp: 468000 }, { bulan: "Jul", rp: 475000 }, { bulan: "Agu", rp: 489000 },
  { bulan: "Sep", rp: 502000 }, { bulan: "Okt", rp: 515000 }, { bulan: "Nov", rp: 521000 },
];
const air = [4.1, 3.9, 4.2, 4.0, 3.8, 4.1, 4.0, 6.2].map((m3, i) => ({ minggu: `M${i + 1}`, m3 }));
const listrikConfig = { rp: { label: "Listrik", color: "var(--chart-1)" } } satisfies ChartConfig;
const airConfig = { m3: { label: "Air (m³)", color: "var(--chart-2)" } } satisfies ChartConfig;

export default function DesignPage() {
  const [misi, setMisi] = useState([true, true, false]);
  const nilai = [86700, 69300, 20800];
  const total = nilai.reduce((t, v, i) => t + (misi[i] ? v : 0), 0);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 p-6 md:p-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Design system HematRumah</h1>
        <p className="text-muted-foreground">Contekan komponen. Detail aturan: docs/UI.md. Mockup: docs/mockup.html.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Warna (class Tailwind)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {warna.map(([k, cls, d]) => (
            <div key={k} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span className={`size-10 rounded-lg border ${cls}`} />
              <div><code className="text-sm font-bold">bg-{k}</code><p className="text-sm text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Versi lembut: <code>bg-listrik-soft</code>, <code>bg-air-soft</code>, <code>bg-warn-soft</code>, <code>bg-primary-soft</code>. Teks: <code>text-listrik-foreground</code>, <code>text-air</code>, <code>text-warn</code>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Tombol, input, ikon</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Simpan &amp; audit</Button>
          <Button variant="outline">Coba lagi</Button>
          <Button className="bg-warn text-warn-foreground hover:bg-warn/90">Cek penyebabnya</Button>
          <Button onClick={() => toast.success("Catatan disimpan")}>Tes toast</Button>
          <Badge variant="secondary">dari AI</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IconTile icon={Zap} tone="listrik" /><IconTile icon={Droplet} tone="air" /><IconTile icon={TriangleAlert} tone="warn" /><IconTile icon={PiggyBank} tone="primary" /><IconTile icon={AirVent} tone="listrik" size="sm" />
        </div>
        <div className="grid max-w-md gap-2">
          <Label htmlFor="tarif">Tarif listrik per kWh</Label>
          <Input id="tarif" defaultValue="1444,70" />
          <p className="text-sm text-muted-foreground">Salin dari struk token / tagihan.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Tabs + Dialog (modal selalu pakai Dialog)</h2>
        <Tabs defaultValue="cerita">
          <TabsList><TabsTrigger value="cerita">Ceritakan</TabsTrigger><TabsTrigger value="form">Isi form</TabsTrigger></TabsList>
          <TabsContent value="cerita" className="pt-3">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>Buka dialog catat</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Catat pemakaian</DialogTitle>
                  <DialogDescription>Angka meteran air harus lebih besar dari catatan sebelumnya.</DialogDescription>
                </DialogHeader>
                <Input defaultValue="1.284,6" />
                <DialogFooter><Button>Simpan</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          <TabsContent value="form" className="pt-3 text-muted-foreground">Tabel alat ada di sini.</TabsContent>
        </Tabs>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><IconTile icon={Waves} tone="air" size="sm" />Biang boros</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Cek pelampung toren", "AC timer mati jam 3", "Matikan TV"].map((t, i) => (
              <label key={t} className="flex items-center gap-3 rounded-xl border p-3 has-data-checked:bg-primary-soft">
                <Checkbox checked={misi[i]} onCheckedChange={(v) => setMisi((m) => m.map((x, j) => (j === i ? !!v : x)))} />
                <span className="flex-1 font-semibold">{t}</span>
                <span className="font-extrabold text-primary">{rupiahRingkas(nilai[i])}</span>
              </label>
            ))}
          </CardContent>
        </Card>
        <div className="flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground">
          <PiggyBank className="size-12 text-listrik" aria-hidden />
          <div><p className="text-sm opacity-85">Kalau misi yang dicentang dijalankan</p><p className="text-4xl font-extrabold">{rupiah(total)}</p><p className="text-sm opacity-85">hemat per bulan</p></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Listrik per bulan</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={listrikConfig} className="h-52 w-full">
              <BarChart data={listrik}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => rupiah(Number(v))} />} />
                <Bar dataKey="rp" fill="var(--color-rp)" radius={6} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Air per minggu</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={airConfig} className="h-52 w-full">
              <LineChart data={air}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="minggu" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine y={4} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <Line dataKey="m3" stroke="var(--color-m3)" strokeWidth={2.5} isAnimationActive={false} dot={{ r: 3.5, fill: "var(--color-m3)" }} />
                <ReferenceDot x="M8" y={6.2} r={6} fill="var(--warn)" stroke="none" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Modal proses AI (ProsesAi)</h2>
        <TesProsesAi />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Ilustrasi (components/ilustrasi.tsx)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(Ilustrasi).map(([nama, Komponen]) => (
            <div key={nama} className="flex flex-col items-center gap-2 rounded-2xl border bg-white p-4">
              <Komponen />
              <code className="text-xs text-muted-foreground">{nama}</code>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/** Uji modal proses AI tanpa memanggil AI: terbuka 9 detik lalu tertutup sendiri. */
function TesProsesAi() {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setBuka(true);
          setTimeout(() => setBuka(false), 9000);
        }}
      >
        Tes modal proses AI
      </Button>
      <ProsesAi
        buka={buka}
        judul="Rumahmu sedang diaudit"
        langkah={["Menyimpan data rumah...", "Menghitung kWh dan Rupiah tiap alat...", "AI mencari biang boros...", "Menyusun rencana hemat..."]}
      />
    </>
  );
}

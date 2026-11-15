"use client";

// Animasi hero landing: cerita diketik -> kata kunci menyalakan kabel ke alat ->
// biaya tiap alat dikirim ke total tagihan -> si boros ketahuan. Angka contoh =
// hasil audit akun demo (Ibu Sri), bukan angka karangan.
import { useEffect, useRef } from "react";
import { AirVent, ReceiptText, Tv, Waves } from "lucide-react";

const NS = "http://www.w3.org/2000/svg";
const CERITA =
  "Di rumah ada 4 orang. AC satu di kamar, nyala dari jam 9 malam sampai subuh. Pompa air bunyi terus hampir seharian. TV nyala dari pagi sampai malam.";
const KUNCI = ["AC", "Pompa air", "TV"];
const POS = KUNCI.map((k) => CERITA.indexOf(k));
const NILAI_RB = [277, 108, 42];
const TOTAL_LISTRIK = 520525;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const rupiah = (v: number) => "Rp" + Math.round(v).toLocaleString("id-ID");
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

function htmlCerita(n: number, nyala: number) {
  let out = "";
  let i = 0;
  POS.forEach((p, j) => {
    if (n <= p) return;
    out += esc(CERITA.slice(i, p));
    out += `<mark class="${j === 1 ? "air" : ""} ${nyala > j ? "on" : ""}">${esc(CERITA.slice(p, Math.min(n, p + KUNCI[j].length)))}</mark>`;
    i = Math.min(n, p + KUNCI[j].length);
  });
  return out + esc(CERITA.slice(i, n));
}

export function kirimArus(g: SVGGElement, path: SVGPathElement, warna: string, dur: number, r = 4.5) {
  return new Promise<void>((selesai) => {
    const len = path.getTotalLength();
    const glow = document.createElementNS(NS, "circle");
    const dot = document.createElementNS(NS, "circle");
    glow.setAttribute("r", String(r * 3));
    glow.setAttribute("fill", warna);
    glow.setAttribute("opacity", ".25");
    dot.setAttribute("r", String(r));
    dot.setAttribute("fill", "#fff");
    dot.setAttribute("stroke", warna);
    dot.setAttribute("stroke-width", "2.5");
    g.append(glow, dot);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const pt = path.getPointAtLength(ease(k) * len);
      for (const c of [glow, dot]) {
        c.setAttribute("cx", String(pt.x));
        c.setAttribute("cy", String(pt.y));
      }
      if (k < 1) requestAnimationFrame(step);
      else {
        glow.remove();
        dot.remove();
        selesai();
      }
    };
    requestAnimationFrame(step);
  });
}

function tween(dur: number, fn: (k: number) => void) {
  return new Promise<void>((r) => {
    const t0 = performance.now();
    const s = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      fn(ease(k));
      if (k < 1) requestAnimationFrame(s);
      else r();
    };
    requestAnimationFrame(s);
  });
}

function gambarGaris(p: SVGPathElement, dur: number) {
  const len = p.getTotalLength();
  p.style.transition = "none";
  p.style.strokeDasharray = `${len}`;
  p.style.strokeDashoffset = `${len}`;
  p.getBoundingClientRect();
  p.style.transition = `stroke-dashoffset ${dur}ms cubic-bezier(.6,0,.2,1)`;
  p.style.strokeDashoffset = "0";
}

function sembunyikanGaris(p: SVGPathElement) {
  const len = p.getTotalLength();
  p.style.transition = "none";
  p.style.strokeDasharray = `${len}`;
  p.style.strokeDashoffset = `${len}`;
}

const NAIK = ["M110 0 C110 50 95 60 95 112", "M280 0 L280 112", "M450 0 C450 50 465 60 465 112"];
const TURUN = ["M95 236 C95 290 190 300 232 310", "M280 236 L280 292", "M465 236 C465 290 370 300 328 310"];
const ALAT = [
  { nama: "AC 1 PK", icon: AirVent, air: false, left: "17%" },
  { nama: "Pompa air", icon: Waves, air: true, left: "50%" },
  { nama: "TV LED", icon: Tv, air: false, left: "83%" },
];

export function HeroKabel({ onStep }: { onStep?: (n: number) => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const q = <T extends Element>(s: string) => el.querySelector(s) as T;
    const qa = <T extends Element>(s: string) => [...el.querySelectorAll(s)] as T[];
    const ketik = q<HTMLSpanElement>("[data-ketik]");
    const caret = q<HTMLSpanElement>("[data-caret]");
    const status = q<HTMLSpanElement>("[data-status]");
    const statusTeks = status.querySelector("span")!;
    const nodes = qa<HTMLDivElement>("[data-node]");
    const up = qa<SVGPathElement>("[data-up]");
    const down = qa<SVGPathElement>("[data-down]");
    const total = q<HTMLDivElement>("[data-total]");
    const totalRp = q<HTMLElement>("[data-total-rp]");
    const totalKet = q<HTMLElement>("[data-total-ket]");
    const paket = q<SVGGElement>("[data-packets]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mati = false;
    let hidup: number[] = [];
    const setStep = (n: number) => onStep?.(n);

    async function putar() {
      while (!mati) {
        setStep(0);
        status.classList.remove("done");
        statusTeks.textContent = "membaca cerita";
        caret.style.display = "";
        nodes.forEach((n) => {
          n.classList.remove("on", "res", "boros");
          n.querySelector("[data-rp]")!.textContent = "Rp0";
        });
        [...up, ...down].forEach(sembunyikanGaris);
        total.classList.remove("on");
        totalRp.textContent = "Rp0";
        totalKet.textContent = "Tagihan listrik per bulan";
        hidup.forEach(clearInterval);
        hidup = [];

        let nyala = 0;
        for (let i = 1; i <= CERITA.length && !mati; i++) {
          POS.forEach((p, j) => {
            if (i !== p + KUNCI[j].length) return;
            nyala = j + 1;
            gambarGaris(up[j], 650);
            setTimeout(() => {
              nodes[j].classList.add("on");
              const warna = ALAT[j].air ? "#5aa7dd" : "#f2b632";
              hidup.push(window.setInterval(() => kirimArus(paket, up[j], warna, 900), 700));
            }, 650);
          });
          ketik.innerHTML = htmlCerita(i, nyala);
          if (!reduce) await sleep(CERITA[i - 1] === "." ? 260 : 24);
        }
        if (mati) return;
        caret.style.display = "none";
        statusTeks.textContent = "menghitung biaya";
        await sleep(700);

        total.classList.add("on");
        let jumlah = 0;
        for (let j = 0; j < nodes.length && !mati; j++) {
          const rpEl = nodes[j].querySelector("[data-rp]")!;
          nodes[j].classList.add("res");
          await tween(650, (k) => (rpEl.textContent = `Rp${Math.round(NILAI_RB[j] * k)}rb`));
          gambarGaris(down[j], 500);
          await kirimArus(paket, down[j], ALAT[j].air ? "#5aa7dd" : "#f2b632", 700, 5.5);
          const dari = jumlah;
          jumlah += NILAI_RB[j] * 1000;
          total.classList.add("bump");
          setTimeout(() => total.classList.remove("bump"), 220);
          await tween(450, (k) => (totalRp.textContent = rupiah(dari + (jumlah - dari) * k)));
        }
        totalKet.textContent = "+ kulkas, lampu, mesin cuci";
        await tween(800, (k) => (totalRp.textContent = rupiah(jumlah + (TOTAL_LISTRIK - jumlah) * k)));
        totalKet.textContent = "Tagihan listrik per bulan";

        status.classList.add("done");
        statusTeks.textContent = "si boros ketahuan";
        setStep(1);
        nodes[0].classList.add("boros");
        await sleep(2600);
        setStep(2);
        await sleep(3400);
      }
    }
    void putar();
    return () => {
      mati = true;
      hidup.forEach(clearInterval);
    };
    // onStep = setState dari halaman (stabil), jadi animasi tidak diulang dari awal.
  }, [onStep]);

  return (
    <div ref={root} className="relative">
      <div className="relative z-[3] min-h-[132px] rounded-[22px_22px_22px_6px] bg-white px-5 pt-4 pb-[18px] text-[16px] leading-relaxed text-foreground shadow-[0_30px_70px_-30px_rgba(0,0,0,.85)]">
        <div className="mb-1.5 flex items-center gap-2.5 text-[13px] text-muted-foreground">
          <span className="grid size-[26px] place-items-center rounded-full bg-primary-soft text-[11px] font-extrabold text-primary">IS</span>
          Ibu Sri bercerita
          <span className="lp-status ml-auto inline-flex items-center gap-1.5 font-semibold text-primary" data-status>
            <i />
            <span>membaca cerita</span>
          </span>
        </div>
        <span className="lp-cerita" data-ketik />
        <span className="lp-caret" data-caret />
      </div>

      <div className="relative" style={{ aspectRatio: "560 / 340" }}>
        <svg viewBox="0 0 560 340" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {[...NAIK, ...TURUN].map((d) => (
            <path key={`b${d}`} className="lp-wbase" d={d} />
          ))}
          {NAIK.map((d, j) => (
            <path key={`u${d}`} className={`lp-wlive ${ALAT[j].air ? "a" : "l"}`} data-up={j} d={d} />
          ))}
          {TURUN.map((d, j) => (
            <path key={`d${d}`} className={`lp-wlive ${ALAT[j].air ? "a" : "l"}`} data-down={j} d={d} />
          ))}
          <g data-packets />
        </svg>

        {ALAT.map(({ nama, icon: Icon, air, left }, j) => (
          <div key={nama} className={`lp-node ${air ? "a" : ""}`} data-node style={{ left, top: "44%" }}>
            <span className="lp-ring">
              <Icon aria-hidden />
              {j === 0 && (
                <>
                  <span className="lp-ripple" />
                  <span className="lp-ripple r2" />
                  <span className="lp-badge">si boros · 53%</span>
                </>
              )}
            </span>
            <b>{nama}</b>
            <span className="rp tabular" data-rp>
              Rp0
            </span>
          </div>
        ))}

        <div
          className="lp-total flex items-center gap-3 rounded-full bg-white py-2.5 pr-6 pl-2.5 whitespace-nowrap text-foreground shadow-[0_20px_50px_-18px_rgba(0,0,0,.9)]"
          data-total
        >
          <span className="grid size-10 place-items-center rounded-full bg-listrik-soft text-listrik-foreground">
            <ReceiptText className="size-[18px]" aria-hidden />
          </span>
          <div>
            <small className="text-[12.5px] text-muted-foreground" data-total-ket>
              Tagihan listrik per bulan
            </small>
            <b className="tabular block text-[22px] leading-tight font-extrabold" data-total-rp>
              Rp0
            </b>
          </div>
        </div>
      </div>
      <p className="sr-only">
        Contoh: Ibu Sri menceritakan rumahnya. RumahHemat menghitung AC 1 PK Rp277 ribu, pompa air Rp108 ribu, TV Rp42 ribu per bulan.
        Total tagihan listrik Rp520.525 per bulan, dan AC jadi si boros dengan 53 persen.
      </p>
    </div>
  );
}

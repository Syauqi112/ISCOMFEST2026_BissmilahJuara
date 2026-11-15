"use client";

// Latar landing: jalur instalasi listrik (kuning) dan pipa air (biru) yang sesekali
// dilewati arus kecil.
import { useEffect, useRef } from "react";
import { kirimArus } from "./hero-kabel";

const JALUR = [
  { d: "M-20 160 H340 Q360 160 360 180 V300 Q360 320 380 320 H620", air: false },
  { d: "M-20 700 H220 Q240 700 240 680 V560 Q240 540 260 540 H520", air: true },
  { d: "M720 -20 V60 Q720 80 740 80 H1180 Q1200 80 1200 100 V220 Q1200 240 1220 240 H1460", air: false },
  { d: "M1460 520 H1300 Q1280 520 1280 540 V700 Q1280 720 1260 720 H900 Q880 720 880 740 V880", air: true },
  { d: "M560 880 V800 Q560 780 580 780 H780", air: false },
  { d: "M1460 380 H1340 Q1320 380 1320 360 V300", air: true },
];
// Ujung jalur yang berhenti di dalam bingkai diberi terminal (stopkontak/keran),
// supaya tidak terlihat seperti kabel terpotong.
const UJUNG = [
  [620, 320],
  [520, 540],
  [780, 780],
  [1320, 300],
];
const TITIK = [
  [360, 240],
  [240, 620],
  [1200, 160],
  [1280, 620],
  [880, 720],
  [1340, 380],
];

export function BgJalur({ className, variasi = 0 }: { className?: string; variasi?: number }) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = svg.current!;
    const g = el.querySelector("[data-arus]") as SVGGElement;
    const paths = [...el.querySelectorAll("path[data-air]")] as SVGPathElement[];
    const id = window.setInterval(() => {
      const p = paths[Math.floor(Math.random() * paths.length)];
      void kirimArus(g, p, p.dataset.air === "1" ? "#5aa7dd" : "#f2b632", 2600 + Math.random() * 1500, 3);
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <svg
      ref={svg}
      className={`lp-jalur pointer-events-none absolute inset-0 size-full ${className ?? ""}`}
      viewBox="0 0 1440 860"
      preserveAspectRatio="xMidYMid slice"
      style={variasi ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      {JALUR.map(({ d, air }) => (
        <path key={d} d={d} data-air={air ? "1" : "0"} />
      ))}
      {TITIK.map(([x, y]) => (
        <circle key={`${x}-${y}`} className="titik" cx={x} cy={y} r={4} />
      ))}
      {UJUNG.map(([x, y]) => (
        <g key={`u${x}-${y}`}>
          <circle cx={x} cy={y} r={9} fill="#12223c" stroke="rgba(201,213,232,.22)" strokeWidth={2} />
          <circle cx={x} cy={y} r={3} fill="rgba(242,182,50,.55)" />
        </g>
      ))}
      <g data-arus />
    </svg>
  );
}

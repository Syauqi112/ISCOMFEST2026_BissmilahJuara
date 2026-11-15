// Set ilustrasi HematRumah (gaya datar ala unDraw, digambar sendiri).
// Satu palet untuk semua: biru tinta, kuning listrik, biru air, oranye cuma untuk peringatan.
// Semua memakai kanvas 320x220 supaya ukurannya seragam di empty state, modal, dan halaman.
import { cn } from "@/lib/utils";

const W = {
  tinta: "#1f3354",
  tinta2: "#2b4a78",
  gelap: "#1c2230",
  kuning: "#f2b632",
  kuning2: "#e3a008",
  air: "#5aa7dd",
  air2: "#2478b5",
  oranye: "#c2410c",
  kulit: "#e3a77f",
  putih: "#ffffff",
  latar: "#eef2f8",
  abu: "#d3dcea",
  lantai: "#e3e8f0",
};

type Pose = "berdiri" | "angkat" | "pegang" | "lambai" | "duduk";

/** Tokoh sederhana. (x, y) = titik tengah telapak kaki (atau dudukan untuk pose duduk). */
function Orang({ x, y, pose = "berdiri", baju = W.tinta, celana = W.tinta2, ibu = false }: { x: number; y: number; pose?: Pose; baju?: string; celana?: string; ibu?: boolean }) {
  const duduk = pose === "duduk";
  const bahu = y - (duduk ? 84 : 94);
  const kepala = y - (duduk ? 106 : 116);
  const tangan: [number, number][] =
    pose === "angkat"
      ? [[x - 32, y - 138], [x + 32, y - 138]]
      : pose === "lambai"
        ? [[x - 24, y - (duduk ? 40 : 56)], [x + 30, y - 140]]
        : pose === "pegang"
          ? [[x - 24, y - 56], [x + 36, y - 84]]
          : [[x - 24, y - (duduk ? 42 : 56)], [x + 24, y - (duduk ? 42 : 56)]];
  return (
    <g>
      {duduk ? (
        <>
          <rect x={x - 16} y={y - 40} width={50} height={13} rx={6.5} fill={celana} />
          <rect x={x + 22} y={y - 40} width={12} height={40} rx={6} fill={celana} />
          <ellipse cx={x + 33} cy={y + 1} rx={10} ry={4.5} fill={W.gelap} />
        </>
      ) : (
        <>
          <rect x={x - 14} y={y - 46} width={12} height={46} rx={6} fill={celana} />
          <rect x={x + 2} y={y - 46} width={12} height={46} rx={6} fill={celana} />
          <ellipse cx={x - 10} cy={y + 1} rx={9} ry={4.5} fill={W.gelap} />
          <ellipse cx={x + 10} cy={y + 1} rx={9} ry={4.5} fill={W.gelap} />
        </>
      )}
      <rect x={x - 22} y={bahu - 6} width={44} height={duduk ? 58 : 60} rx={18} fill={baju} />
      {tangan.map(([tx, ty], i) => {
        const sx = i === 0 ? x - 17 : x + 17;
        return (
          <g key={i}>
            <path d={`M${sx} ${bahu + 4} L${tx} ${ty}`} stroke={baju} strokeWidth={11} strokeLinecap="round" />
            <circle cx={tx} cy={ty} r={5.5} fill={W.kulit} />
          </g>
        );
      })}
      <rect x={x - 5} y={kepala + 10} width={10} height={10} fill={W.kulit} />
      <circle cx={x} cy={kepala} r={15} fill={W.kulit} />
      {/* rambut: tudung di atas kepala, ibu dengan sanggul */}
      <path d={`M${x - 15.5} ${kepala - 1} A15.5 15.5 0 0 1 ${x + 15.5} ${kepala - 1} Q${x + 4} ${kepala - 9} ${x - 15.5} ${kepala - 1} Z`} fill={W.gelap} />
      {ibu && <circle cx={x + 12} cy={kepala - 11} r={6.5} fill={W.gelap} />}
    </g>
  );
}

function Kanvas({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <svg viewBox="0 0 320 220" className={cn("h-auto w-full max-w-[280px]", className)} role="img" aria-label={label}>
      <path d="M40 150 C20 92 76 34 150 38 C226 42 296 74 288 140 C282 192 222 206 158 204 C92 202 54 190 40 150 Z" fill={W.latar} />
      <rect x={34} y={198} width={252} height={4} rx={2} fill={W.lantai} />
      {children}
    </svg>
  );
}

function Rumah({ x, y, lampu = true }: { x: number; y: number; lampu?: boolean }) {
  return (
    <g>
      <rect x={x} y={y + 30} width={92} height={66} rx={6} fill={W.putih} />
      <path d={`M${x - 8} ${y + 34} L${x + 46} ${y - 4} L${x + 100} ${y + 34} Z`} fill={W.tinta} />
      <rect x={x + 12} y={y + 46} width={22} height={20} rx={4} fill={lampu ? W.kuning : W.abu} />
      <rect x={x + 56} y={y + 56} width={22} height={40} rx={4} fill={W.latar} />
    </g>
  );
}

function Toren({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x + 6} ${y + 34} L${x + 2} ${y + 96} M${x + 34} ${y + 34} L${x + 38} ${y + 96} M${x + 4} ${y + 64} L${x + 36} ${y + 64}`} stroke={W.tinta2} strokeWidth={4} strokeLinecap="round" />
      <rect x={x} y={y} width={40} height={36} rx={12} fill={W.air2} />
      <rect x={x + 6} y={y + 10} width={28} height={4} rx={2} fill={W.air} />
    </g>
  );
}

/** Rumah aman: tidak ada lonjakan / riwayat kosong. */
export function IlustrasiRumahTenang({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Rumah yang tenang, pemakaian wajar">
      <Rumah x={44} y={104} />
      <Toren x={150} y={104} />
      {/* kursi + ibu duduk santai, kaki menapak lantai */}
      <rect x={204} y={171} width={52} height={8} rx={4} fill={W.tinta2} />
      <rect x={208} y={179} width={6} height={20} rx={3} fill={W.tinta2} />
      <rect x={246} y={179} width={6} height={20} rx={3} fill={W.tinta2} />
      <rect x={204} y={120} width={7} height={56} rx={3.5} fill={W.tinta2} />
      <Orang x={222} y={198} pose="duduk" ibu baju={W.air2} />
      <circle cx={262} cy={74} r={20} fill={W.putih} />
      <path d="M252 74 l7 7 l13 -14" fill="none" stroke={W.air2} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </Kanvas>
  );
}

/** Belum ada audit: memeriksa AC dengan kaca pembesar. */
export function IlustrasiPeriksa({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Memeriksa alat listrik di rumah">
      <rect x={70} y={62} width={110} height={30} rx={8} fill={W.putih} />
      <rect x={80} y={82} width={90} height={4} rx={2} fill={W.abu} />
      <circle cx={168} cy={72} r={3} fill={W.air2} />
      <path d="M92 100 q5 9 0 18 M118 100 q5 9 0 18 M144 100 q5 9 0 18" fill="none" stroke={W.air} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M58 48 l-9 18 h9 l-5 16 l15 -22 h-9 l6 -12 z" fill={W.kuning} />
      <Orang x={214} y={198} pose="pegang" />
      <circle cx={262} cy={98} r={20} fill="none" stroke={W.tinta} strokeWidth={7} />
      <circle cx={262} cy={98} r={16} fill={W.putih} opacity={0.55} />
      <path d="M248 112 L238 126" stroke={W.tinta} strokeWidth={7} strokeLinecap="round" />
    </Kanvas>
  );
}

/** Belum ada rencana: celengan + daftar misi. */
export function IlustrasiCelengan({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Celengan dan daftar misi hemat">
      <rect x={58} y={56} width={92} height={118} rx={12} fill={W.putih} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={72} y={76 + i * 30} width={16} height={16} rx={5} fill={i === 0 ? W.tinta : W.putih} stroke={W.abu} strokeWidth={i === 0 ? 0 : 2.5} />
          {i === 0 && <path d={`M76 ${84} l3 3 l6 -6`} fill="none" stroke={W.putih} strokeWidth={2.5} strokeLinecap="round" />}
          <rect x={96} y={80 + i * 30} width={i === 2 ? 30 : 42} height={7} rx={3.5} fill={W.abu} />
        </g>
      ))}
      <ellipse cx={226} cy={160} rx={52} ry={38} fill={W.kuning} />
      <circle cx={268} cy={154} r={14} fill={W.kuning2} />
      <circle cx={266} cy={152} r={2.5} fill={W.gelap} />
      <circle cx={272} cy={152} r={2.5} fill={W.gelap} />
      <circle cx={244} cy={142} r={3.5} fill={W.gelap} />
      <path d="M206 124 l-6 -16 l18 10 z" fill={W.kuning2} />
      <rect x={196} y={190} width={12} height={10} rx={3} fill={W.kuning2} />
      <rect x={240} y={190} width={12} height={10} rx={3} fill={W.kuning2} />
      <rect x={214} y={121} width={24} height={6} rx={3} fill={W.kuning2} />
      <circle cx={226} cy={94} r={13} fill={W.kuning2} />
      <text x={226} y={99} textAnchor="middle" fontSize={14} fontWeight={800} fill={W.putih}>
        Rp
      </text>
    </Kanvas>
  );
}

/** Belum ada catatan: mencatat angka meteran. */
export function IlustrasiCatat({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Mencatat angka meteran air dan listrik">
      <rect x={66} y={70} width={70} height={96} rx={12} fill={W.putih} />
      <circle cx={101} cy={108} r={24} fill={W.air} />
      <circle cx={101} cy={108} r={17} fill={W.putih} />
      <path d="M101 108 L111 98" stroke={W.tinta} strokeWidth={4} strokeLinecap="round" />
      <rect x={80} y={140} width={42} height={12} rx={4} fill={W.tinta} />
      <rect x={96} y={166} width={10} height={32} fill={W.tinta2} />
      <Orang x={216} y={198} pose="pegang" ibu baju={W.tinta2} celana={W.tinta} />
      <rect x={244} y={70} width={34} height={42} rx={5} fill={W.kuning} transform="rotate(-10 261 91)" />
      <path d="M252 84 h18 M252 93 h18 M252 102 h12" stroke={W.putih} strokeWidth={3} strokeLinecap="round" transform="rotate(-10 261 91)" />
    </Kanvas>
  );
}

/** Belum ada alat: colokan menunggu disambung. */
export function IlustrasiColokan({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Colokan listrik belum tersambung">
      <rect x={70} y={64} width={64} height={84} rx={14} fill={W.putih} />
      <circle cx={92} cy={106} r={6} fill={W.tinta} />
      <circle cx={112} cy={106} r={6} fill={W.tinta} />
      <path d="M150 170 C190 170 186 112 222 112" fill="none" stroke={W.tinta2} strokeWidth={8} strokeLinecap="round" />
      <rect x={220} y={96} width={40} height={32} rx={8} fill={W.kuning} />
      <rect x={258} y={102} width={16} height={6} rx={3} fill={W.tinta} />
      <rect x={258} y={116} width={16} height={6} rx={3} fill={W.tinta} />
      <path d="M190 64 l-7 14 h7 l-4 12 l12 -17 h-7 l5 -9 z" fill={W.kuning2} />
    </Kanvas>
  );
}

/** Semua beres: orang bersorak + tanda centang. */
export function IlustrasiBeres({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Semua sudah beres">
      <Orang x={124} y={198} pose="angkat" ibu baju={W.air2} />
      <circle cx={226} cy={104} r={40} fill={W.tinta} />
      <path d="M208 104 l12 12 l24 -26" fill="none" stroke={W.putih} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={70} cy={70} r={5} fill={W.kuning} />
      <circle cx={186} cy={52} r={4} fill={W.air} />
      <rect x={264} y={154} width={9} height={9} rx={2} fill={W.kuning} transform="rotate(20 268 158)" />
      <rect x={60} y={132} width={8} height={8} rx={2} fill={W.air} transform="rotate(-15 64 136)" />
    </Kanvas>
  );
}

/** Sambutan pengisian pertama: melambai di depan rumah. */
export function IlustrasiSambutan({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Selamat datang di RumahHemat">
      <Rumah x={150} y={104} />
      <Orang x={100} y={198} pose="lambai" ibu baju={W.air2} />
      <path d="M44 80 l-8 16 h8 l-4 14 l14 -20 h-8 l5 -10 z" fill={W.kuning} />
    </Kanvas>
  );
}

/** Halaman tidak ditemukan: kabel terlepas. */
export function IlustrasiPutus({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Kabel terlepas, halaman tidak ditemukan">
      <path d="M40 132 C90 132 96 100 134 100" fill="none" stroke={W.tinta2} strokeWidth={8} strokeLinecap="round" />
      <rect x={132} y={86} width={38} height={30} rx={8} fill={W.kuning} />
      <rect x={168} y={92} width={14} height={6} rx={3} fill={W.tinta} />
      <rect x={168} y={104} width={14} height={6} rx={3} fill={W.tinta} />
      <rect x={214} y={70} width={58} height={76} rx={14} fill={W.putih} />
      <circle cx={234} cy={108} r={6} fill={W.tinta} />
      <circle cx={252} cy={108} r={6} fill={W.tinta} />
      <path d="M192 84 l8 -8 M196 100 h12 M192 116 l8 8" stroke={W.oranye} strokeWidth={4} strokeLinecap="round" />
    </Kanvas>
  );
}

/** AI sedang menganalisis: rumah dipindai, titik data berdenyut (animasi CSS di dalam SVG). */
export function IlustrasiAnalisis({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={cn("h-auto w-full max-w-[300px]", className)} role="img" aria-label="AI sedang menganalisis rumahmu">
      <style>{`
        .ia-pindai { animation: ia-pindai 2.2s cubic-bezier(.6,0,.4,1) infinite alternate; }
        @keyframes ia-pindai { from { transform: translateY(0); } to { transform: translateY(96px); } }
        .ia-titik { animation: ia-titik 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes ia-titik { 50% { transform: scale(1.6); opacity: .4; } }
        .ia-kilau { animation: ia-kilau 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes ia-kilau { 50% { transform: scale(.6) rotate(45deg); opacity: .5; } }
        @media (prefers-reduced-motion: reduce) { .ia-pindai, .ia-titik, .ia-kilau { animation: none; } }
      `}</style>
      <path d="M40 150 C20 92 76 34 150 38 C226 42 296 74 288 140 C282 192 222 206 158 204 C92 202 54 190 40 150 Z" fill={W.latar} />
      <rect x={34} y={198} width={252} height={4} rx={2} fill={W.lantai} />
      <Rumah x={106} y={92} />
      <g className="ia-pindai">
        <rect x={86} y={84} width={148} height={4} rx={2} fill={W.air} opacity={0.9} />
        <rect x={86} y={88} width={148} height={18} fill={W.air} opacity={0.12} />
      </g>
      <circle className="ia-titik" cx={84} cy={70} r={6} fill={W.kuning} />
      <circle className="ia-titik" cx={240} cy={84} r={5} fill={W.air2} style={{ animationDelay: ".4s" }} />
      <circle className="ia-titik" cx={250} cy={160} r={5} fill={W.kuning2} style={{ animationDelay: ".8s" }} />
      <path className="ia-kilau" d="M262 44 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5 z" fill={W.kuning} />
      <path className="ia-kilau" d="M60 118 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill={W.air} style={{ animationDelay: ".9s" }} />
    </svg>
  );
}

/** Riwayat kosong: kalender dengan minggu-minggu yang aman. */
export function IlustrasiKalender({ className }: { className?: string }) {
  return (
    <Kanvas className={className} label="Kalender tanpa catatan lonjakan">
      <rect x={84} y={52} width={152} height={130} rx={16} fill={W.putih} />
      <rect x={84} y={52} width={152} height={30} rx={16} fill={W.tinta} />
      <rect x={84} y={70} width={152} height={12} fill={W.tinta} />
      <rect x={112} y={42} width={8} height={22} rx={4} fill={W.tinta2} />
      <rect x={200} y={42} width={8} height={22} rx={4} fill={W.tinta2} />
      {Array.from({ length: 12 }, (_, i) => {
        const cx = 108 + (i % 4) * 35;
        const cy = 102 + Math.floor(i / 4) * 26;
        return i % 3 === 1 ? (
          <g key={i}>
            <circle cx={cx} cy={cy} r={9} fill={W.air} opacity={0.25} />
            <path d={`M${cx - 4} ${cy} l3 3 l6 -6`} fill="none" stroke={W.air2} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : (
          <rect key={i} x={cx - 7} y={cy - 4} width={14} height={8} rx={4} fill={W.abu} />
        );
      })}
      <circle cx={244} cy={168} r={22} fill={W.kuning} />
      <path d="M244 156 v12 l8 5" fill="none" stroke={W.putih} strokeWidth={4} strokeLinecap="round" />
    </Kanvas>
  );
}

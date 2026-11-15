// Keyframe & gaya animasi khusus landing. Disuntik lewat <style> supaya token di
// globals.css tetap tidak disentuh.
export const landingCss = `
.lp-grain { position:absolute; inset:0; pointer-events:none; opacity:.09; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.lp-jalur path { fill:none; stroke:rgba(201,213,232,.08); stroke-width:2; }
.lp-jalur circle.titik { fill:rgba(201,213,232,.18); }

.lp-caret { display:inline-block; width:2px; height:1.1em; background:var(--primary); vertical-align:-3px; animation:lp-blink 1s steps(1) infinite; }
@keyframes lp-blink { 50% { opacity:0; } }
.lp-status i { width:8px; height:8px; border-radius:50%; background:var(--listrik); animation:lp-ping 1.2s infinite; }
.lp-status.done i { background:var(--air); animation:none; }
@keyframes lp-ping { 0% { box-shadow:0 0 0 0 rgba(227,160,8,.6); } 70%,100% { box-shadow:0 0 0 7px rgba(227,160,8,0); } }

/* Kata kunci ditandai seperti stabilo: coretan di separuh bawah teks yang tersapu dari kiri */
.lp-cerita mark { background:linear-gradient(transparent 58%, var(--listrik-soft) 58%, var(--listrik-soft) 92%, transparent 92%) no-repeat 0 0 / 0% 100%; color:inherit; padding:0 1px; transition:background-size .5s cubic-bezier(.6,0,.2,1), color .3s; }
.lp-cerita mark.on { background-size:100% 100%; color:var(--listrik-foreground); font-weight:700; }
.lp-cerita mark.air { background-image:linear-gradient(transparent 58%, var(--air-soft) 58%, var(--air-soft) 92%, transparent 92%); }
.lp-cerita mark.air.on { color:var(--air); }

.lp-wbase { fill:none; stroke:rgba(201,213,232,.13); stroke-width:2; stroke-dasharray:3 7; }
.lp-wlive { fill:none; stroke-width:2.5; stroke-linecap:round; }
.lp-wlive.l { stroke:rgba(242,182,50,.75); } .lp-wlive.a { stroke:rgba(90,167,221,.85); }

.lp-node { position:absolute; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center; }
.lp-ring { position:relative; width:72px; height:72px; border-radius:22px; display:grid; place-items:center; background:rgba(255,255,255,.05); color:#6f82a6; border:1.5px dashed rgba(201,213,232,.25); transform:scale(.82); transition:transform .5s cubic-bezier(.2,1.4,.4,1), background .4s, color .4s, border-color .4s, box-shadow .4s; }
.lp-ring svg { width:30px; height:30px; }
.lp-node.on .lp-ring { transform:scale(1); background:var(--listrik-soft); color:var(--listrik-foreground); border:1.5px solid transparent; }
.lp-node.a.on .lp-ring { background:var(--air-soft); color:var(--air); }
.lp-node b { font-size:15px; color:#8597b8; transition:color .3s; } .lp-node.on b { color:#fff; }
.lp-node .rp { font-size:21px; font-weight:800; opacity:0; transform:translateY(6px); transition:opacity .3s, transform .3s; }
.lp-node.res .rp { opacity:1; transform:none; }
.lp-badge { position:absolute; top:-12px; right:-28px; background:#f2b632; color:#0b1628; font-size:11.5px; font-weight:800; padding:3px 9px; border-radius:999px; white-space:nowrap; opacity:0; transform:scale(.6) rotate(-6deg); transition:opacity .3s, transform .45s cubic-bezier(.2,1.6,.4,1); }
.lp-node.boros .lp-badge { opacity:1; transform:scale(1) rotate(-6deg); }
.lp-node.boros .lp-ring { box-shadow:0 0 0 3px #f2b632, 0 0 50px 4px rgba(242,182,50,.45); }
.lp-ripple { position:absolute; inset:-2px; border-radius:24px; border:2px solid #f2b632; opacity:0; pointer-events:none; }
.lp-node.boros .lp-ripple { animation:lp-ripple 1.8s ease-out infinite; } .lp-node.boros .lp-ripple.r2 { animation-delay:.9s; }
@keyframes lp-ripple { 0% { opacity:.8; transform:scale(1); } 100% { opacity:0; transform:scale(1.8); } }

.lp-total { position:absolute; left:50%; top:91%; transform:translate(-50%,-50%) scale(.94); opacity:.35; transition:opacity .4s, transform .4s cubic-bezier(.2,1.4,.4,1); }
.lp-total.on { opacity:1; transform:translate(-50%,-50%) scale(1); }
.lp-total.bump { transform:translate(-50%,-50%) scale(1.06); }

.lp-steps span.on { color:#fff; } .lp-steps span.on b { background:#f2b632; color:#0b1628; transform:scale(1.12); }

.lp-spike { animation:lp-spike 1.6s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
@keyframes lp-spike { 50% { transform:scale(1.5); opacity:.5; } }

.lp-faq summary { list-style:none; cursor:pointer; }
.lp-faq summary::-webkit-details-marker { display:none; }
.lp-faq details[open] .lp-chev { transform:rotate(45deg); }

/* ---- muncul saat digulir (lihat use-reveal.ts) ---- */
[data-reveal] { opacity:0; transform:translateY(28px); transition:opacity .8s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); transition-delay:calc(var(--d, 0) * 110ms); }
[data-reveal="scale"] { transform:translateY(36px) scale(.96); }
[data-reveal].in { opacity:1; transform:none; }
.lp-grow { width:0; transition:width 1.1s cubic-bezier(.6,0,.2,1) .45s; }
.in .lp-grow { width:var(--w); }
.lp-draw { stroke-dasharray:1; stroke-dashoffset:1; transition:stroke-dashoffset 1.6s cubic-bezier(.6,0,.2,1) .35s; }
.in .lp-draw { stroke-dashoffset:0; }
.lp-fade { opacity:0; transition:opacity .7s ease 1.5s; }
.in .lp-fade { opacity:1; }

/* navbar masuk dari atas saat halaman dibuka; "backwards" supaya transform sembunyi tetap jalan */
.lp-nav-masuk { animation:lp-nav-in .9s cubic-bezier(.2,.8,.2,1) .1s backwards; }
@keyframes lp-nav-in { from { opacity:0; transform:translateY(-28px); } }

@media (max-width: 640px) {
  .lp-ring { width:56px; height:56px; border-radius:18px; } .lp-ring svg { width:24px; height:24px; }
  .lp-node b { font-size:13px; } .lp-node .rp { font-size:17px; }
  .lp-badge { right:-18px; font-size:10.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .lp-root *, .lp-root *::before, .lp-root *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
}
`;

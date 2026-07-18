#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "progress.json"), "utf8"));

const LEVELS = [
  { key: "daily",    n: 2 },
  { key: "learning", n: 1 },
];

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const PX = {
  a:{r:[".xxx.","....x",".xxxx","x...x",".xxxx"]},
  c:{r:[".xxxx","x....","x....","x....",".xxxx"]},
  e:{r:[".xxx.","x...x","xxxxx","x....",".xxxx"]},
  g:{r:[".xxxx","x...x","x...x",".xxxx","....x",".xxx."]},
  k:{r:["x....","x....","x..x.","x.x..","xx...","x.x..","x..x."],asc:2},
  m:{r:["xx.x.","x.x.x","x.x.x","x.x.x","x...x"]},
  n:{r:["x.xx.","xx..x","x...x","x...x","x...x"]},
  o:{r:[".xxx.","x...x","x...x","x...x",".xxx."]},
  p:{r:["xxxx.","x...x","x...x","xxxx.","x....","x...."]},
  r:{r:["x.xx.","xx..x","x....","x....","x...."]},
  s:{r:[".xxxx","x....",".xxx.","....x","xxxx."]},
  t:{r:[".x...","xxxx.",".x...",".x...",".x...","..xx."],asc:1},
  u:{r:["x...x","x...x","x...x","x...x",".xxxx"]},
  v:{r:["x...x","x...x","x...x",".x.x.","..x.."]},
  w:{r:["x...x","x...x","x.x.x","x.x.x",".x.x."]},
  x:{r:["x...x",".x.x.","..x..",".x.x.","x...x"]},
  z:{r:["xxxxx","...x.","..x..",".x...","xxxxx"]},
};
function pixelWord(word, x0, y0, cell) {
  const sq = cell - 1;
  const maxAsc = Math.max(0, ...[...word].map(ch => (PX[ch] && PX[ch].asc) || 0));
  let out = "", x = x0;
  for (const ch of word) {
    const g = PX[ch];
    if (!g) { x += cell * 3; continue; }
    const yOff = y0 + (maxAsc - (g.asc || 0)) * cell;
    g.r.forEach((row, r) => [...row].forEach((c, i) => {
      if (c === "x") out += `<rect class="ink" x="${x + i * cell}" y="${yOff + r * cell}" width="${sq}" height="${sq}"/>`;
    }));
    x += cell * 6;
  }
  return { svg: out, height: (maxAsc + 6) * cell };
}

function meter(x, y, filled) {
  const CELL_W = 22, CELL_H = 14, GAP = 5;
  let out = "";
  for (let i = 0; i < LEVELS.length; i++) {
    const cx = x + i * (CELL_W + GAP);
    out += `<rect x="${cx}" y="${y}" width="${CELL_W}" height="${CELL_H}" fill="url(#${i < filled ? "dots-ink" : "dots-track"})"/>`;
  }
  return out;
}
const OUT = 20, CW = 780, PAD = 28;
const COLS = 3, CELL_H = 46;
const CELL_W = (CW - PAD * 2) / COLS;
const GROUP_HEAD_H = 44, GROUP_GAP = 30;
const updated = new Date().toISOString().slice(0, 10);

const groups = LEVELS
  .map((lv, gi) => ({ ...lv, gi, items: data.filter(d => (d.level || "").toLowerCase() === lv.key) }))
  .filter(g => g.items.length > 0);

const title = pixelWord("stack", PAD, 26 + 16 + 10, 7);
let y = 26 + 16 + 10 + title.height + 34;
let body = "";
let delayIdx = 0;

for (const g of groups) {
  const num = String(g.gi + 1).padStart(2, "0");
  const delay = Math.min(50 + delayIdx++ * 70, 330);
  body += `
  <g class="row" style="animation-delay:${delay}ms">
    <text class="label" x="${PAD}" y="${y + 12}">${num} — ${g.key.toUpperCase()}</text>
    ${meter(CW - PAD - LEVELS.length * 22 - (LEVELS.length - 1) * 5, y + 1, g.n)}
  </g>`;
  y += GROUP_HEAD_H - 14;

  const rows = Math.ceil(g.items.length / COLS);
  const gridTop = y;

  for (let r = 0; r <= rows; r++)
    body += `<line class="hair" x1="${PAD}" y1="${gridTop + r * CELL_H}" x2="${CW - PAD}" y2="${gridTop + r * CELL_H}"/>`;
  for (let c = 1; c < COLS; c++) {
    const cellsInLastRow = g.items.length % COLS || COLS;
    const colRows = c < cellsInLastRow ? rows : rows - (g.items.length % COLS ? 1 : 0);
    if (colRows > 0)
      body += `<line class="hair" x1="${PAD + c * CELL_W}" y1="${gridTop}" x2="${PAD + c * CELL_W}" y2="${gridTop + colRows * CELL_H}"/>`;
  }
  g.items.forEach((item, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    const d = Math.min(50 + delayIdx++ * 70, 330);
    body += `
  <g class="row" style="animation-delay:${d}ms">
    <text class="name" x="${PAD + c * CELL_W + 16}" y="${gridTop + r * CELL_H + CELL_H / 2 + 5}">${esc(item.name)}</text>
  </g>`;
  });
  y = gridTop + rows * CELL_H + GROUP_GAP;
}

const footY = y - GROUP_GAP + 18;
const CH = footY + 40;
const W = CW + OUT * 2, H = CH + OUT * 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tech stack by comfort level">
  <title>Tech stack (updated ${updated})</title>
  <style>
    :root { --bg:#ffffff; --ink:#0a0a0a; --g200:#e9e9e9; --g400:#a3a3a3; --g500:#737373; }
    @media (prefers-color-scheme: dark) {
      :root { --bg:#0c0c0f; --ink:#f4f4f5; --g200:#2a2a30; --g400:#8a8a92; --g500:#a0a0a8; }
      .dot-ink { fill-opacity:0.42; }
      .shadowfx { flood-opacity:0; }
    }
    text { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
    .micro, .label { font-family:ui-monospace,SFMono-Regular,Consolas,Menlo,monospace; }
    .card { fill:var(--bg); stroke:var(--g200); stroke-width:1; }
    .ink { fill:var(--ink); }
    .name { font-size:15px; font-weight:500; fill:var(--ink); }
    .label { font-size:11px; letter-spacing:1.5px; fill:var(--g400); }
    .micro { font-size:9.5px; letter-spacing:1.2px; fill:var(--g500); }
    .hair { stroke:var(--g200); stroke-width:1; }
    .dot-ink { fill:var(--ink); fill-opacity:0.9; }
    .dot-track { fill:var(--g400); fill-opacity:0.45; }
    .shadowfx { flood-opacity:0.16; }
    .row { animation:rise .7s cubic-bezier(.16,1,.3,1) both; }
    @keyframes rise { from { opacity:0; transform:translateY(12px); } }
    @media (prefers-reduced-motion: reduce) { .row { animation:none; } }
  </style>
  <defs>
    <pattern id="dots-track" width="6" height="6" patternUnits="userSpaceOnUse"><circle class="dot-track" cx="3" cy="3" r="1.1"/></pattern>
    <pattern id="dots-ink" width="6" height="6" patternUnits="userSpaceOnUse"><circle class="dot-ink" cx="3" cy="3" r="1.2"/></pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow class="shadowfx" dx="0" dy="8" stdDeviation="11" flood-color="#000"/></filter>
  </defs>
  <g transform="translate(${OUT},${OUT})">
    <rect class="card" width="${CW}" height="${CH}" rx="16" filter="url(#soft)"/>
    <text class="label" x="${PAD}" y="${26 + 10}">SELF-REPORTED — HONESTLY</text>
    ${title.svg}
${body}
    <text class="micro" x="${PAD}" y="${footY + 27}">UPDATED ${updated} — DAILY: WHAT I BUILD WITH · LEARNING: WHAT I'M STUDYING</text>
  </g>
</svg>
`;

const out = path.join(ROOT, "assets", "progress.svg");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(`Wrote ${out}: ${groups.map(g => `${g.key}=${g.items.length}`).join(", ")}`);

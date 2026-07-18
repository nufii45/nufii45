#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "progress.json"), "utf8"));

const LEVELS = [
  { key: "daily",    label: "01 — DAILY" },
  { key: "learning", label: "02 — LEARNING" },
];

const ICONS = {
  "typescript":   ["typescript/typescript-plain"],
  "javascript":   ["javascript/javascript-plain"],
  "python":       ["python/python-plain"],
  "react":        ["react/react-original"],
  "react native": ["react/react-original"],
  "fastapi":      ["fastapi/fastapi-plain"],
  "postgresql":   ["postgresql/postgresql-plain"],
  "html & css":   ["html5/html5-plain", "css3/css3-plain"],
  "html":         ["html5/html5-plain"],
  "css":          ["css3/css3-plain"],
};

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function fetchMonoIcon(slug) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/devicons/devicon/master/icons/${slug}.svg`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let svg = await res.text();
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 128 128";
    let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    inner = inner.replace(/fill="[^"]*"/g, "").replace(/style="[^"]*"/g, ""); // strip colors -> inherit ink
    return { vb, inner };
  } catch (e) {
    console.warn(`warn: icon ${slug} unavailable (${e.message})`);
    return null;
  }
}

const PX = {
  a:{r:[".xxx.","....x",".xxxx","x...x",".xxxx"]},
  i:{r:["..x..",".....","..x..","..x..","..x..","..x..","..x.."],asc:2},
  l:{r:["..x..","..x..","..x..","..x..","..x..","..x..","..xx."],asc:2},
  "!":{r:["..x..","..x..","..x..","..x..","..x..",".....","..x.."],asc:2},
  "'":{r:["..x..","..x..",".....",".....",".....",".....","....."],asc:2},
  m:{r:["xx.x.","x.x.x","x.x.x","x.x.x","x...x"]},
  n:{r:["x.xx.","xx..x","x...x","x...x","x...x"]},
  s:{r:[".xxxx","x....",".xxx.","....x","xxxx."]},
  t:{r:[".x...","xxxx.",".x...",".x...",".x...","..xx."],asc:1},
  c:{r:[".xxxx","x....","x....","x....",".xxxx"]},
  k:{r:["x....","x....","x..x.","x.x..","xx...","x.x..","x..x."],asc:2},
  o:{r:[".xxx.","x...x","x...x","x...x",".xxx."]},
  u:{r:["x...x","x...x","x...x","x...x",".xxxx"]},
  e:{r:[".xxx.","x...x","xxxxx","x....",".xxxx"]},
  r:{r:["x.xx.","xx..x","x....","x....","x...."]},
  p:{r:["xxxx.","x...x","x...x","xxxx.","x....","x...."]},
  g:{r:[".xxxx","x...x","x...x",".xxxx","....x",".xxx."]},
};
function pixelWord(word, x0, y0, cell) {
  const sq = cell - 1;
  const maxAsc = Math.max(0, ...[...word].map(ch => (PX[ch] && PX[ch].asc) || 0));
  let out = "", x = x0;
  for (const ch of word) {
    const g = PX[ch];
    if (!g) { x += cell * 3; continue; }
    const yOff = y0 + (maxAsc - (g.asc || 0)) * cell;
    g.r.forEach((row, ri) => [...row].forEach((c, ci) => {
      if (c === "x") out += `<rect class="ink" x="${x + ci * cell}" y="${yOff + ri * cell}" width="${sq}" height="${sq}"/>`;
    }));
    x += cell * 6;
  }
  return { svg: out, height: (maxAsc + 5) * cell + 2 * cell };
}

(async () => {
  const OUT = 20, CW = 780, PAD = 28;
  const updated = new Date().toISOString().slice(0, 10);

  const groups = LEVELS
    .map(lv => ({ ...lv, items: data.filter(d => (d.level || "").toLowerCase() === lv.key) }))
    .filter(g => g.items.length > 0);

  const title = pixelWord("welcome! i'm imman", PAD, 26 + 16 + 10, 6);
  let y = 26 + 16 + 10 + title.height + 24;
  let card1 = "";
  let delayIdx = 0;
  for (const g of groups) {
    const d = Math.min(50 + delayIdx++ * 70, 330);
    const names = g.items.map(i => esc(i.name)).join("  ·  ");
    card1 += `
    <g class="row" style="animation-delay:${d}ms">
      <line class="hair" x1="${PAD}" y1="${y - 14}" x2="${CW - PAD}" y2="${y - 14}"/>
      <text class="label" x="${PAD}" y="${y + 6}">${g.label}</text>
      <text class="name" x="${PAD + 150}" y="${y + 7}">${names}</text>
    </g>`;
    y += 42;
  }
  const foot1 = y + 4;
  const CH1 = foot1 + 36;

  const iconDefs = new Map();       
  const stripSeq = [];
  for (const g of groups) {
    for (const item of g.items) {
      for (const slug of ICONS[item.name.toLowerCase()] || []) {
        if (stripSeq.some(s => s.slug === slug)) continue;   
        if (!iconDefs.has(slug)) iconDefs.set(slug, await fetchMonoIcon(slug));
        if (iconDefs.get(slug)) stripSeq.push({ slug, faded: g.key !== "daily" });
      }
    }
  }

  const ICON_S = 34, ADV = 76, STRIP_H = 84;
  const seqW = stripSeq.length * ADV;
  const defs = [...iconDefs.entries()].filter(([, v]) => v).map(([slug, v]) =>
    `<g id="ic-${slug.split("/")[1]}">` +
    `<svg width="${ICON_S}" height="${ICON_S}" viewBox="${v.vb}">${v.inner}</svg></g>`
  ).join("\n");

  const oneRun = (off) => stripSeq.map((s, i) =>
    `<use href="#ic-${s.slug.split("/")[1]}" x="${off + i * ADV}" y="${(STRIP_H - ICON_S) / 2}" class="${s.faded ? "logo-faded" : "logo"}"/>`
  ).join("\n");

  const strip = stripSeq.length ? `
  <g transform="translate(${OUT},${OUT + CH1 + 16})">
    <rect class="card" width="${CW}" height="${STRIP_H}" rx="16" filter="url(#soft)"/>
    <g clip-path="url(#stripclip)">
      <g mask="url(#edgefade)">
        <g class="marquee">${oneRun(0)}${oneRun(seqW)}</g>
      </g>
    </g>
  </g>` : "";

  const CH2 = stripSeq.length ? STRIP_H + 16 : 0;
  const W = CW + OUT * 2, H = CH1 + CH2 + OUT * 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Profile card and language strip">
  <title> about me — stack (updated ${updated})</title>
  <style>
    :root { --bg:#ffffff; --ink:#0a0a0a; --g200:#e9e9e9; --g400:#a3a3a3; --g500:#737373; }
    @media (prefers-color-scheme: dark) {
      :root { --bg:#0c0c0f; --ink:#f4f4f5; --g200:#2a2a30; --g400:#8a8a92; --g500:#a0a0a8; }
      .shadowfx { flood-opacity:0; }
    }
    text { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif; }
    .micro, .label { font-family:ui-monospace,SFMono-Regular,Consolas,Menlo,monospace; }
    .card { fill:var(--bg); stroke:var(--g200); stroke-width:1; }
    .ink { fill:var(--ink); }
    .name { font-size:14px; font-weight:500; fill:var(--ink); }
    .label { font-size:11px; letter-spacing:1.5px; fill:var(--g400); }
    .micro { font-size:9.5px; letter-spacing:1.2px; fill:var(--g500); }
    .hair { stroke:var(--g200); stroke-width:1; }
    .logo { fill:var(--ink); fill-opacity:0.88; }
    .logo-faded { fill:var(--g400); fill-opacity:0.55; }
    .shadowfx { flood-opacity:0.16; }
    .row { animation:rise .7s cubic-bezier(.16,1,.3,1) both; }
    @keyframes rise { from { opacity:0; transform:translateY(12px); } }
    .marquee { animation:scroll 34s linear infinite; }
    @keyframes scroll { to { transform:translateX(-${seqW}px); } }
    @media (prefers-reduced-motion: reduce) { .row,.marquee { animation:none; } }
  </style>
  <defs>
    ${defs}
    <clipPath id="stripclip"><rect width="${CW}" height="${STRIP_H}" rx="16"/></clipPath>
    <linearGradient id="edgegrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.08" stop-color="#fff"/>
      <stop offset="0.92" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="edgefade"><rect width="${CW}" height="${STRIP_H}" fill="url(#edgegrad)"/></mask>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow class="shadowfx" dx="0" dy="8" stdDeviation="11" flood-color="#000"/></filter>
  </defs>

  <g transform="translate(${OUT},${OUT})">
    <rect class="card" width="${CW}" height="${CH1}" rx="16" filter="url(#soft)"/>
    <text class="label" x="${PAD}" y="${26 + 10}">1ST YEAR COMSCI STUDENT — UP BAGUIO</text>
    ${title.svg}
${card1}
    <line class="hair" x1="${PAD}" y1="${foot1}" x2="${CW - PAD}" y2="${foot1}"/>
    <text class="micro" x="${PAD}" y="${foot1 + 23}">UPDATED ${updated} — DAILY: WHAT I BUILD WITH · LEARNING: WHAT I'M STUDYING</text>
  </g>
${strip}
</svg>
`;

  const out = path.join(ROOT, "assets", "progress.svg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  console.log(`Wrote ${out}: card groups ${groups.map(g => g.items.length).join("/")}, strip icons ${stripSeq.length}`);
})();

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "progress.json"), "utf8"));

const ICON_SOURCES = {
  html:    "html5/html5-original",
  css:     "css3/css3-original",
  js:      "javascript/javascript-original",
  react:   "react/react-original",
  java:    "java/java-original",
  php:     "php/php-original",
  mysql:   "mysql/mysql-original",
  python:  "python/python-original",
  laravel: "laravel/laravel-original",
  tailwind:"tailwindcss/tailwindcss-original",
  git:     "git/git-original",
  sass:    "sass/sass-original",
};

const FALLBACK = {
  html: `<polygon points="6,3 34,3 31.5,32 20,35.5 8.5,32" fill="#E44D26"/><text x="20" y="26" font-size="15" font-weight="700" fill="#fff" text-anchor="middle" font-family="Arial">5</text>`,
  css:  `<polygon points="6,3 34,3 31.5,32 20,35.5 8.5,32" fill="#1572B6"/><text x="20" y="26" font-size="15" font-weight="700" fill="#fff" text-anchor="middle" font-family="Arial">3</text>`,
  js:   `<rect x="4" y="4" width="32" height="32" rx="4" fill="#F7DF1E"/><text x="20" y="27" font-size="14" font-weight="800" fill="#111" text-anchor="middle" font-family="Arial">JS</text>`,
  default: `<rect x="4" y="4" width="32" height="32" rx="6" fill="#e5e7eb"/><text x="20" y="26" font-size="14" font-weight="700" fill="#374151" text-anchor="middle" font-family="Arial">?</text>`,
};

async function fetchIcon(key) {
  const src = ICON_SOURCES[key];
  if (!src) return null;
  const url = `https://raw.githubusercontent.com/devicons/devicon/master/icons/${src}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let svg = await res.text();

    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 128 128";
    let inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  
    inner = inner
      .replace(/id="([^"]+)"/g, `id="${key}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
      .replace(/href="#([^"]+)"/g, `href="#${key}-$1"`);
    return { vb, inner };
  } catch (e) {
    console.warn(`warn: could not fetch icon "${key}" (${e.message}), using fallback`);
    return null;
  }
}

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

(async () => {
  data.sort((a, b) => b.percent - a.percent);

  // ---- layout constants ----
  const W = 820, CARD_H = 92, GAP = 16, PAD_X = 24, ICON = 40;
  const BAR_X = 84, BAR_W = W - BAR_X - 90, BAR_H = 8;
  const H = data.length * (CARD_H + GAP) - GAP + 4;

  const iconCache = {};
  for (const item of data) {
    if (!(item.icon in iconCache)) iconCache[item.icon] = await fetchIcon(item.icon);
  }

  const cards = data.map((item, i) => {
    const y = i * (CARD_H + GAP);
    const pct = Math.max(0, Math.min(100, item.percent));
    const fillW = Math.round((BAR_W * pct) / 100);
    const real = iconCache[item.icon];
    const iconSvg = real
      ? `<svg x="0" y="0" width="${ICON}" height="${ICON}" viewBox="${real.vb}">${real.inner}</svg>`
      : (FALLBACK[item.icon] || FALLBACK.default);
    return `
  <g transform="translate(2,${y + 2})">
    <rect width="${W - 4}" height="${CARD_H}" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
    <g transform="translate(${PAD_X},${(CARD_H - ICON) / 2})">${iconSvg}</g>
    <text x="${BAR_X}" y="${CARD_H / 2 - 8}" font-size="16" font-weight="600"
          fill="#1f2937" font-family="Segoe UI, Arial, sans-serif">${esc(item.name)}</text>
    <text x="${W - 4 - PAD_X}" y="${CARD_H / 2 - 8}" font-size="15" font-weight="700"
          fill="#6b7280" text-anchor="end" font-family="Segoe UI, Arial, sans-serif">${pct}%</text>
    <rect x="${BAR_X}" y="${CARD_H / 2 + 6}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H / 2}" fill="#e5e7eb"/>
    <rect x="${BAR_X}" y="${CARD_H / 2 + 6}" width="${fillW}" height="${BAR_H}" rx="${BAR_H / 2}" fill="#1ea662">
      <animate attributeName="width" from="0" to="${fillW}" dur="0.9s" fill="freeze"
               calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
    </rect>
  </g>`;
  }).join("\n");

  const updated = new Date().toISOString().slice(0, 10);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Learning progress">
  <title>Learning progress (updated ${updated})</title>
${cards}
</svg>
`;
  const out = path.join(ROOT, "assets", "progress.svg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  console.log(`Wrote ${out} (${data.length} skills, updated ${updated})`);
})();

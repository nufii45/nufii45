#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "progress.json"), "utf8"));

data.sort((a, b) => b.percent - a.percent);

const W = 820;            
const CARD_H = 92;       
const GAP = 16;          
const PAD_X = 24;        
const ICON = 40;          
const BAR_X = 84;         
const BAR_W = W - BAR_X - 90; 
const BAR_H = 8;

const H = data.length * (CARD_H + GAP) - GAP + 4;

const icons = {
  html: `
    <polygon points="6,3 34,3 31.5,32 20,35.5 8.5,32" fill="#E44D26"/>
    <polygon points="20,5.5 20,33 29.5,30.2 31.6,5.5" fill="#F16529"/>
    <text x="20" y="26" font-size="15" font-weight="700" fill="#fff" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">5</text>`,
  css: `
    <polygon points="6,3 34,3 31.5,32 20,35.5 8.5,32" fill="#1572B6"/>
    <polygon points="20,5.5 20,33 29.5,30.2 31.6,5.5" fill="#33A9DC"/>
    <text x="20" y="26" font-size="15" font-weight="700" fill="#fff" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">3</text>`,
  js: `
    <rect x="4" y="4" width="32" height="32" rx="4" fill="#F7DF1E"/>
    <text x="20" y="27" font-size="14" font-weight="800" fill="#111" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">JS</text>`,
  react: `
    <circle cx="20" cy="20" r="3.4" fill="#61DAFB"/>
    <ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="#61DAFB" stroke-width="2"/>
    <ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="#61DAFB" stroke-width="2" transform="rotate(60 20 20)"/>
    <ellipse cx="20" cy="20" rx="15" ry="6" fill="none" stroke="#61DAFB" stroke-width="2" transform="rotate(120 20 20)"/>`,
  java: `
    <path d="M14 8 c3 -3 -1 -4 1 -6" fill="none" stroke="#E76F00" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 9 c4 -4 -1.5 -5 1 -8" fill="none" stroke="#E76F00" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 14 h17 v10 a8.5 8.5 0 0 1 -17 0 z" fill="#5382A1"/>
    <path d="M26 16 h4 a3.5 3.5 0 0 1 0 7 h-4" fill="none" stroke="#5382A1" stroke-width="2.5"/>
    <ellipse cx="17.5" cy="34.5" rx="11" ry="2.5" fill="#5382A1" opacity="0.55"/>`,
  default: `
    <rect x="4" y="4" width="32" height="32" rx="6" fill="#e5e7eb"/>
    <text x="20" y="26" font-size="14" font-weight="700" fill="#374151" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">?</text>`
};

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const cards = data.map((item, i) => {
  const y = i * (CARD_H + GAP);
  const pct = Math.max(0, Math.min(100, item.percent));
  const fillW = Math.round((BAR_W * pct) / 100);
  const icon = icons[item.icon] || icons.default;
  return `
  <g transform="translate(2,${y + 2})">
    <rect width="${W - 4}" height="${CARD_H}" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
    <g transform="translate(${PAD_X},${(CARD_H - ICON) / 2})">${icon}</g>
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

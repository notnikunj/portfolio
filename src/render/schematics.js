

import { mulberry32, gaussian } from '../utils/rng.js';

const W = 320;
const H = 180;
const r1 = (n) => Math.round(n * 10) / 10;

function frame(inner, label) {
  return `<svg class="schematic" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" focusable="false">${inner}</svg>`;
}

function axes({ x0 = 34, y0 = 154, x1 = 300, y1 = 16, xLabel = '', yLabel = '' } = {}) {
  return (
    `<path class="sx-axis" d="M${x0} ${y1}V${y0}H${x1}"/>` +
    (xLabel ? `<text class="sx-label" x="${x1}" y="${y0 + 16}" text-anchor="end">${xLabel}</text>` : '') +
    (yLabel ? `<text class="sx-label" x="${x0 - 8}" y="${y1 + 4}" text-anchor="end" transform="rotate(-90 ${x0 - 8} ${y1 + 4})">${yLabel}</text>` : '')
  );
}

function confusion() {
  const rand = mulberry32(26);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const n = 26;
  const cell = 5.6;
  const ox = 40;
  const oy = 12;
  const known = { 'J,K': 0.75, 'U,V': 0.55, 'V,U': 0.45, 'C,I': 0.4, 'C,L': 0.4, 'I,L': 0.35 };
  let cells = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const key = `${letters[r]},${letters[c]}`;
      let cls = '';
      let op = 0;
      if (r === c) {
        cls = 'sx-hi';
        op = 0.62 + rand() * 0.38;
        if (letters[r] === 'J') op = 0.45;
      } else if (known[key]) {
        cls = 'sx-hi';
        op = known[key] * 0.55;
      } else if (rand() < 0.05) {
        cls = 'sx-pt';
        op = 0.12 + rand() * 0.12;
      }
      if (op > 0) {
        cells += `<rect class="${cls}" x="${r1(ox + c * cell)}" y="${r1(oy + r * cell)}" width="${cell - 0.8}" height="${cell - 0.8}" fill-opacity="${op.toFixed(2)}"/>`;
      }
    }
  }
  const size = n * cell;
  let ticks = '';
  for (const L of ['A', 'J', 'U', 'Z']) {
    const i = letters.indexOf(L);
    ticks += `<text class="sx-label" x="${ox - 5}" y="${r1(oy + i * cell + cell - 1)}" text-anchor="end">${L}</text>`;
    ticks += `<text class="sx-label" x="${r1(ox + i * cell + cell / 2)}" y="${r1(oy + size + 10)}" text-anchor="middle">${L}</text>`;
  }
  const jy = oy + letters.indexOf('J') * cell + cell / 2;
  const kx = ox + letters.indexOf('K') * cell + cell;
  const notes =
    `<path class="sx-guide" d="M${r1(kx + 2)} ${r1(jy)}H${ox + size + 22}"/>` +
    `<text class="sx-note" x="${ox + size + 28}" y="${r1(jy + 3)}">J read as K</text>` +
    `<text class="sx-note" x="${ox + size + 28}" y="${r1(jy + 22)}">U and V swapped</text>` +
    `<text class="sx-note" x="${ox + size + 28}" y="${r1(jy + 41)}">C, I and L blur</text>` +
    `<text class="sx-label" x="${ox + size + 28}" y="${oy + 8}">rows: true sign</text>` +
    `<text class="sx-label" x="${ox + size + 28}" y="${oy + 20}">columns: predicted</text>`;
  return frame(
    `<rect class="sx-faint" x="${ox}" y="${oy}" width="${size}" height="${size}"/>` + cells + ticks + notes,
    'Schematic confusion matrix for 26 sign-language letters, with a strong diagonal and the J–K, U–V and C–I–L confusions marked'
  );
}

function scatter() {
  const rand = mulberry32(1995);
  let pts = '';
  const x0 = 34;
  const y0 = 154;
  const xr = 260;
  const yr = 130;
  for (let i = 0; i < 110; i++) {
    const s = rand();
    const price = Math.min(0.98, Math.max(0.03, 0.12 + 0.62 * s + gaussian(rand) * 0.11));
    const under = price < 0.12 + 0.62 * s - 0.08 && s > 0.45;
    const x = x0 + 8 + s * (xr - 10);
    const y = y0 - 6 - price * (yr - 8);
    pts += under
      ? `<circle class="sx-hi" cx="${r1(x)}" cy="${r1(y)}" r="2.4"/>`
      : `<circle class="sx-pt" cx="${r1(x)}" cy="${r1(y)}" r="1.8"/>`;
  }
  const line = `<path class="sx-guide" d="M${x0 + 8} ${r1(y0 - 6 - 0.12 * (yr - 8))}L${x0 + xr - 2} ${r1(y0 - 6 - 0.74 * (yr - 8))}"/>`;
  return frame(
    axes({ xLabel: 'investment score', yLabel: 'price' }) +
      line +
      pts +
      `<text class="sx-note" x="44" y="26">below the trend line:</text>` +
      `<text class="sx-note" x="44" y="39">cheap for its score</text>`,
    'Schematic scatter plot of house price against investment score, with areas below the trend line highlighted'
  );
}

function pca() {
  const rand = mulberry32(7);
  let pts = '';
  const cx = 167;
  const cy = 88;
  for (let i = 0; i < 150; i++) {
    const cls = i % 2;
    const a = gaussian(rand) * 52;
    const b = gaussian(rand) * 20;
    const shift = cls ? 18 : -18;
    const x = cx + shift + a * 0.94 - b * 0.34;
    const y = cy - shift * 0.25 + a * 0.34 + b * 0.94;
    if (x < 40 || x > 298 || y < 18 || y > 150) continue;
    pts += cls
      ? `<circle class="sx-hi" cx="${r1(x)}" cy="${r1(y)}" r="2"/>`
      : `<circle class="sx-ring" cx="${r1(x)}" cy="${r1(y)}" r="2"/>`;
  }
  const pc1 = `<path class="sx-guide" d="M${cx - 110} ${r1(cy - 40)}L${cx + 110} ${r1(cy + 40)}"/>`;
  return frame(
    axes({ xLabel: 'PC1', yLabel: 'PC2' }) +
      pc1 +
      pts +
      `<text class="sx-note" x="300" y="28" text-anchor="end">filled: diabetic</text>` +
      `<text class="sx-note" x="300" y="42" text-anchor="end">open: not diabetic</text>`,
    'Schematic plot of two overlapping classes on the first two principal components'
  );
}

function knn() {
  const rand = mulberry32(10000);
  const pts = [];
  while (pts.length < 90) {
    const p = [40 + rand() * 255, 18 + rand() * 132];
    if (p[0] > 196 && p[1] < 52) continue; // keep the caption clear
    pts.push(p);
  }
  const q = [178, 82];
  const nearest = pts
    .map((p, i) => [Math.hypot(p[0] - q[0], p[1] - q[1]), i])
    .sort((a, b) => a[0] - b[0])
    .slice(0, 5)
    .map((d) => d[1]);
  let s = '';
  for (const i of nearest) {
    s += `<path class="sx-link" d="M${q[0]} ${q[1]}L${r1(pts[i][0])} ${r1(pts[i][1])}"/>`;
  }
  pts.forEach((p, i) => {
    s += nearest.includes(i)
      ? `<circle class="sx-hi" cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.6"/>`
      : `<circle class="sx-pt" cx="${r1(p[0])}" cy="${r1(p[1])}" r="1.8"/>`;
  });
  s += `<circle class="sx-query" cx="${q[0]}" cy="${q[1]}" r="5"/>`;
  return frame(
    axes({ xLabel: 'tempo, timbre, text (reduced)', yLabel: '' }) +
      s +
      `<text class="sx-note" x="300" y="28" text-anchor="end">a song and its k = 5</text>` +
      `<text class="sx-note" x="300" y="42" text-anchor="end">nearest neighbours</text>`,
    'Schematic of a query song connected to its five nearest neighbours in feature space'
  );
}

function route() {
  const rand = mulberry32(42);
  const places = [];
  for (let i = 0; i < 26; i++) places.push([30 + rand() * 265, 18 + rand() * 140]);
  const order = [3, 11, 7, 19, 15];
  let s = '';
  // faint "streets"
  for (let i = 0; i < 7; i++) {
    const y = 20 + i * 23;
    s += `<path class="sx-faint-line" d="M20 ${y}C110 ${y + 12} 200 ${y - 10} 305 ${y + 4}"/>`;
  }
  const d = order.map((i, k) => `${k ? 'L' : 'M'}${r1(places[i][0])} ${r1(places[i][1])}`).join('');
  s += `<path class="sx-route" d="${d}"/>`;
  places.forEach((p, i) => {
    const k = order.indexOf(i);
    if (k >= 0) {
      s += `<circle class="sx-hi" cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.6"/>`;
      s += `<text class="sx-note" x="${r1(p[0] + 7)}" y="${r1(p[1] - 6)}">${k + 1}</text>`;
    } else {
      s += `<circle class="sx-pt" cx="${r1(p[0])}" cy="${r1(p[1])}" r="1.9"/>`;
    }
  });
  return frame(s, 'Schematic of nearby places on a map with a five-stop route drawn through them');
}

function mvc() {
  const box = (x, y, label) =>
    `<rect class="sx-box" x="${x - 38}" y="${y - 14}" width="76" height="28"/>` +
    `<text class="sx-note" x="${x}" y="${y + 4}" text-anchor="middle">${label}</text>`;
  let s = '';
  s += `<path class="sx-link" d="M118 52L172 52"/><path class="sx-link" d="M210 66L178 112"/><path class="sx-link" d="M140 112L112 66"/>`;
  s += box(80, 52, 'View') + box(210, 52, 'Controller') + box(160, 126, 'Model');
  // transactions entering the controller
  for (let i = 0; i < 9; i++) {
    const x = 262 + (i % 3) * 12;
    const y = 112 + Math.floor(i / 3) * 12;
    s += `<rect class="${i === 8 ? 'sx-hi' : 'sx-pt'}" x="${x}" y="${y}" width="7" height="7"/>`;
  }
  s += `<path class="sx-guide" d="M270 106L232 68"/>`;
  s += `<text class="sx-label" x="296" y="160" text-anchor="end">1,000+ logged</text>`;
  return frame(s, 'Schematic of a model–view–controller structure with incoming transactions');
}

const registry = { confusion, scatter, pca, knn, route, mvc };

export function schematic(name) {
  const fn = registry[name];
  return fn ? fn() : '';
}

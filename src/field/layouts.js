

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthIndex(str, now) {
  if (!str || /present|now/i.test(str)) return now;
  const m = /([a-z]{3})[a-z]*\s+(\d{4})/i.exec(str);
  if (m) return Number(m[2]) * 12 + MONTHS.indexOf(m[1].toLowerCase());
  const y = /(\d{4})/.exec(str);
  return y ? Number(y[1]) * 12 + 6 : now;
}

function gantt(rows, now) {
  const from = Math.min(...rows.map((r) => r.start)) - 3;
  const to = Math.max(now, ...rows.map((r) => r.end)) + 3;
  const X = (m) => -1 + (2 * (m - from)) / (to - from);
  const rowY = (i) => (rows.length === 1 ? 0 : -0.3 + (i * 0.6) / (rows.length - 1));

  return {
    scale: 0.27,
    marker: null,
    build(n) {
      const lengths = rows.map((r) => r.end - r.start + 1);
      const total = lengths.reduce((a, b) => a + b, 0);
      const counts = lengths.map((l) => Math.max(6, Math.floor((n * l) / total)));
      let diff = n - counts.reduce((a, b) => a + b, 0);
      counts[counts.length - 1] += diff;
      const points = [];
      const labels = [];
      rows.forEach((r, i) => {
        const k = counts[i];
        const cols = Math.ceil(k / 3);
        const x0 = X(r.start);
        const x1 = X(r.end + 1);
        for (let j = 0; j < k; j++) {
          const c = Math.floor(j / 3);
          const t = cols > 1 ? c / (cols - 1) : 0.5;
          points.push([x0 + (x1 - x0) * t, rowY(i) + ((j % 3) - 1) * 0.055]);
        }
        labels.push({ x: x0, y: rowY(i) - 0.17, text: r.label, align: 'left', tone: 'ink' });
      });
      const firstYear = Math.ceil(from / 12);
      const lastYear = Math.floor(to / 12);
      for (let y = firstYear; y <= lastYear; y++) {
        labels.push({ x: X(y * 12), y: 0.62, text: String(y), align: 'center', tone: 'muted', tick: true });
      }
      labels.push({ x: X(now), y: 0.82, text: 'now', align: 'center', tone: 'gold', tick: true });
      return { points, labels };
    },
  };
}

function frames(aspects) {
  const cells = aspects.slice(0, 6);
  return {
    scale: 0.24,
    marker: 'dot',
    build(n) {
      const rects = cells.map((ar, i) => {
        const [a, b] = String(ar).split('/').map(Number);
        const ratio = a && b ? a / b : 1;
        const cw = 0.5;
        const ch = 0.68;
        let w = cw;
        let h = cw / ratio;
        if (h > ch) {
          h = ch;
          w = ch * ratio;
        }
        const cx = -0.66 + (i % 3) * 0.66;
        const cy = -0.44 + Math.floor(i / 3) * 0.9;
        return { x: cx - w / 2, y: cy - h / 2, w, h };
      });
      const per = rects.map((r) => 2 * (r.w + r.h));
      const total = per.reduce((a, b) => a + b, 0);
      const points = [];
      rects.forEach((r, i) => {
        const k = i === rects.length - 1 ? n - points.length : Math.round((n * per[i]) / total);
        for (let j = 0; j < k; j++) {
          let d = (j / k) * per[i];
          let x;
          let y;
          if (d < r.w) [x, y] = [r.x + d, r.y];
          else if ((d -= r.w) < r.h) [x, y] = [r.x + r.w, r.y + d];
          else if ((d -= r.h) < r.w) [x, y] = [r.x + r.w - d, r.y + r.h];
          else [x, y] = [r.x, r.y + r.h - (d - r.w)];
          points.push([x, y]);
        }
      });
      return { points, labels: [] };
    },
  };
}

function portrait(pts) {
  return {
    scale: 0.17,
    marker: 'dot',
    count: pts.length,
    build() {
      return { points: pts, labels: [] };
    },
  };
}

export function buildLayouts({ work, education, lens, portraitPoints }) {
  const d = new Date();
  const now = d.getFullYear() * 12 + d.getMonth();
  const workRows = [...work]
    .map((w) => ({ label: w.organisation, start: monthIndex(w.start, now), end: monthIndex(w.end, now) }))
    .sort((a, b) => a.start - b.start);
  const eduRows = [...education]
    .map((e) => ({
      label: e.degree.replace(/\s*\(Hons\)/, ''),
      start: monthIndex(e.start, now),
      end: /present/i.test(e.end) ? now : monthIndex(e.end, now) - 1,
    }))
    .sort((a, b) => a.start - b.start);
  const aspects = lens.photos.length
    ? lens.photos.map((p) => `${p.width} / ${p.height}`)
    : lens.placeholderFrames;

  return {
    about: portrait(portraitPoints),
    work: gantt(workRows, now),
    education: gantt(eduRows, now),
    lens: frames(aspects),
  };
}

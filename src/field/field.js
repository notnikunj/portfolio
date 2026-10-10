// The Field

import { mulberry32, gaussian } from '../utils/rng.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function tweenable(v) {
  return { v, from: v, to: v, t0: 0, dur: 1 };
}
function startTween(tw, to, dur, now) {
  tw.from = tw.v;
  tw.to = to;
  tw.t0 = now;
  tw.dur = Math.max(1, dur);
}
function stepTween(tw, now) {
  const t = clamp((now - tw.t0) / tw.dur, 0, 1);
  tw.v = lerp(tw.from, tw.to, t);
  return t < 1;
}

export function createField(canvas, { regions, projects, layouts = {}, compact = false, reducedMotion = false }) {
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(2022);
  const colors = readColors();

  const points = [];
  const regionIndex = Object.fromEntries(regions.map((r, i) => [r.id, i]));
  const density = compact ? 0.4 : 1;

  const projRegion = regions[regionIndex.projects];
  const itemAnchors = {};
  if (projRegion) {
    const ringR = projRegion.spread * 0.95;
    projects.forEach((p, i) => {
      const a = -Math.PI / 2 + (i / projects.length) * TAU + (rand() - 0.5) * 0.35;
      const rr = ringR * (0.8 + rand() * 0.35);
      itemAnchors[p.slug] = {
        x: projRegion.center[0] + Math.cos(a) * rr * 1.25,
        y: projRegion.center[1] + Math.sin(a) * rr,
      };
    });
  }

  function addPoint(region, cx, cy, extra = {}) {
    const nx = gaussian(rand) * 0.85;
    const ny = gaussian(rand) * 0.52;
    points.push({
      region,
      item: null,
      nx,
      ny,
      cx,
      cy,
      px: null,
      py: null,
      ph: rand() * TAU,
      fr: 0.25 + rand() * 0.5,
      size: 1.3 + rand() * 1.0,
      delay: 0,
      dx: 0,
      dy: 0,
      sx: 0,
      sy: 0,
      ...extra,
    });
  }

  const layoutLabels = {};
  regions.forEach((r, ri) => {
    const layout = layouts[r.id];
    if (layout) {
      const rot = rand() * TAU;
      let built;
      if (layout.count) {
        const all = layout.build().points;
        const step = compact ? 3 : 1;
        built = { points: all.filter((_, i) => i % step === 0), labels: [] };
      } else {
        built = layout.build(Math.round(r.points * density));
      }
      built.points.forEach(([x, y]) => {
        const g1 = gaussian(rand) * r.spread;
        const g2 = gaussian(rand) * r.spread * 0.6;
        addPoint(ri, r.center[0] + g1 * Math.cos(rot) - g2 * Math.sin(rot), r.center[1] + g1 * Math.sin(rot) + g2 * Math.cos(rot), {
          px: r.center[0] + x * layout.scale,
          py: r.center[1] + y * layout.scale,
          size: layout.count ? 0.9 + rand() * 0.5 : 1.2 + rand() * 0.6,
        });
      });
      layoutLabels[r.id] = (built.labels || []).map((l) => ({
        ...l,
        wx: r.center[0] + l.x * layout.scale,
        wy: r.center[1] + l.y * layout.scale,
      }));
      return;
    }
    const n = Math.round(r.points * density);
    if (r.id === 'projects') {
      const slugs = Object.keys(itemAnchors);
      for (let i = 0; i < n; i++) {
        const slug = slugs[i % slugs.length];
        const a = itemAnchors[slug];
        addPoint(ri, a.x + gaussian(rand) * r.spread * 0.26, a.y + gaussian(rand) * r.spread * 0.2, { item: slug });
      }
      return;
    }
    const rot = rand() * TAU;
    const stretch = 0.5 + rand() * 0.4;
    for (let i = 0; i < n; i++) {
      const g1 = gaussian(rand) * r.spread;
      const g2 = gaussian(rand) * r.spread * stretch;
      addPoint(ri, r.center[0] + g1 * Math.cos(rot) - g2 * Math.sin(rot), r.center[1] + g1 * Math.sin(rot) + g2 * Math.cos(rot));
    }
  });
  for (let i = 0; i < Math.round(48 * density); i++) {
    const x = (rand() - 0.5) * 2.6;
    const y = (rand() - 0.5) * 1.8;
    addPoint(-1, x, y, { size: 0.8 + rand() * 0.6 });
  }
  for (const p of points) {
    p.delay = clamp(Math.hypot(p.cx - p.nx, p.cy - p.ny) / 1.6, 0, 1) * 0.6 + rand() * 0.4;
  }

  let W = 0;
  let H = 0;
  let dpr = 1;
  let unit = 1;
  const fit = tweenable(0); 
 
  const morphs = Object.fromEntries(regions.map((r) => [r.id, tweenable(0)]));
  let frameMode = 'field'; 
  const cam = { x: 0.12, y: 0, z: 1, ox: 0 };
  const camTarget = { x: 0.12, y: 0, z: 1, ox: 0 };
  let state = { mode: 'intro', region: null, item: null };
  let hoverRegion = null;
  let hoverItem = null;
  let panelWidth = 0; 
  let pointer = { x: -9999, y: -9999, inside: false, fine: matchMedia('(pointer: fine)').matches };
  let running = false;
  let raf = 0;
  let last = performance.now();
  let exclusion = null; 
  const listeners = {};

  function emit(name, payload) {
    (listeners[name] || []).forEach((fn) => fn(payload));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    unit = frameMode === 'doc' ? Math.min(W / 2.9, H / 3.4) : Math.min(W / 2.65, H / 2.05);
    applyStateCamera(true);
    if (!running) draw(performance.now());
  }

  function centerX() {
    return (W - panelWidth) / 2;
  }
  function toScreenX(x) {
    return centerX() + (x - cam.x) * unit * cam.z;
  }
  function centerY() {
    return frameMode === 'doc' ? H * 0.3 : H / 2;
  }
  function toScreenY(y) {
    return centerY() + (y - cam.y) * unit * cam.z;
  }
  function toWorld(sx, sy) {
    return { x: (sx - centerX()) / (unit * cam.z) + cam.x, y: (sy - centerY()) / (unit * cam.z) + cam.y };
  }

  function regionRadius(r) {
    if (layouts[r.id]) return layouts[r.id].scale * (layouts[r.id].count ? 1.05 : 1.3);
    if (r.id === 'projects') return panelWidth ? 0.5 : 0.37;
    return r.spread * 2.4;
  }

  function applyStateCamera(instant = false) {
    if (state.mode === 'region' && state.region != null) {
      const r = regions[regionIndex[state.region]];
      const availW = W - panelWidth;
      const R = regionRadius(r);
      const z = clamp((0.36 * Math.min(availW, H)) / (unit * R), 1.4, 6);
      camTarget.x = r.center[0];
      camTarget.y = r.center[1];
      camTarget.z = z;
    } else {
      camTarget.x = 0.14;
      camTarget.y = 0.02;
      camTarget.z = 1;
    }
    if (instant || reducedMotion) Object.assign(cam, camTarget);
  }

  function setState(next, { instant = false } = {}) {
    const now = performance.now();
    const prev = state;
    state = { ...state, ...next };
    const fast = instant || reducedMotion;
    const wantFit = state.mode === 'intro' ? 0 : 1;
    if (fit.to !== wantFit) startTween(fit, wantFit, fast ? 1 : wantFit ? 1700 : 1100, now - (fast ? 10 : 0));
    for (const r of regions) {
      if (!layouts[r.id]) continue;
      const tw = morphs[r.id];
      const want = state.mode === 'region' && state.region === r.id ? 1 : 0;
      if (tw.to !== want) startTween(tw, want, fast ? 1 : want ? 1500 : 800, now - (fast ? 10 : 0));
    }
    if (prev.region !== state.region || prev.mode !== state.mode) hoverItem = null;
    applyStateCamera(fast);
    if (fast) {
      fit.v = fit.to;
      for (const tw of Object.values(morphs)) tw.v = tw.to;
    }
    wake();
  }

  function setPanelWidth(px) {
    panelWidth = px;
    applyStateCamera(reducedMotion);
    wake();
  }

  function on(name, fn) {
    (listeners[name] ||= []).push(fn);
  }

  function regionAnchor(id) {
    const r = regions[regionIndex[id]];
    if (!r) return null;
    const spreadPx = r.spread * unit * cam.z;
    return { x: toScreenX(r.center[0]), y: toScreenY(r.center[1]) - spreadPx * 1.55 - 14, cx: toScreenX(r.center[0]) };
  }
  function itemAnchor(slug) {
    const a = itemAnchors[slug];
    if (!a) return null;
    return { x: toScreenX(a.x), y: toScreenY(a.y), side: a.x < projRegion.center[0] ? 'left' : 'right' };
  }
  function zoomProgress() {
    if (state.mode !== 'region') return 0;
    const r = regions[regionIndex[state.region]];
    const R = regionRadius(r);
    const z = clamp((0.36 * Math.min(W - panelWidth, H)) / (unit * R), 1.4, 6);
    return clamp((cam.z - 1) / (z - 1 || 1), 0, 1);
  }

  function hitRegion(sx, sy) {
    let best = null;
    let bestD = Infinity;
    for (const r of regions) {
      const d = Math.hypot(sx - toScreenX(r.center[0]), sy - toScreenY(r.center[1]));
      const rad = r.spread * unit * cam.z * 2.2 + 26;
      if (d < rad && d / rad < bestD) {
        bestD = d / rad;
        best = r.id;
      }
    }
    return best;
  }
  function hitItem(sx, sy) {
    if (!(state.mode === 'region' && state.region === 'projects')) return null;
    let best = null;
    let bestD = 60;
    for (const slug of Object.keys(itemAnchors)) {
      const a = itemAnchor(slug);
      const d = Math.hypot(sx - a.x, sy - a.y);
      if (d < bestD) {
        bestD = d;
        best = slug;
      }
    }
    return best;
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside = true;
    pointer.fine = e.pointerType === 'mouse' || e.pointerType === 'pen';
    const hr = state.mode === 'overview' ? hitRegion(pointer.x, pointer.y) : null;
    const hi = hitItem(pointer.x, pointer.y);
    if (hr !== hoverRegion) {
      hoverRegion = hr;
      emit('hoverregion', hr);
    }
    if (hi !== hoverItem) {
      hoverItem = hi;
      emit('hoveritem', hi);
    }
    canvas.style.cursor = hr || hi ? 'pointer' : 'crosshair';
    const w = toWorld(pointer.x, pointer.y);
    emit('pointer', w);
    wake();
  }
  function onLeave() {
    pointer.inside = false;
    if (hoverRegion) {
      hoverRegion = null;
      emit('hoverregion', null);
    }
    if (hoverItem) {
      hoverItem = null;
      emit('hoveritem', null);
    }
    emit('pointer', null);
    wake();
  }
  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const item = hitItem(sx, sy);
    if (item) return emit('select', { region: 'projects', item });
    if (state.mode === 'overview') {
      const r = hitRegion(sx, sy);
      if (r) return emit('select', { region: r });
    }
    if (state.mode === 'region') {
      const r = hitRegion(sx, sy);
      if (r && r !== state.region) return emit('select', { region: r });
      emit('background');
    }
  }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  function highlightRegion(id) {
    hoverRegion = id;
    wake();
  }
  function highlightItem(slug) {
    hoverItem = slug;
    wake();
  }

  function wake() {
    if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const a = stepTween(fit, now);
    let b = false;
    for (const tw of Object.values(morphs)) b = stepTween(tw, now) || b;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 5.5);
    cam.x = lerp(cam.x, camTarget.x, k);
    cam.y = lerp(cam.y, camTarget.y, k);
    cam.z = lerp(cam.z, camTarget.z, k);
    const camMoving =
      Math.abs(cam.x - camTarget.x) + Math.abs(cam.y - camTarget.y) + Math.abs(cam.z - camTarget.z) > 0.0005;
    draw(now, dt);
    emit('frame');
    const ambient = !reducedMotion && !document.hidden && !paused;
    if (a || b || camMoving || ambient) {
      raf = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  let paused = false;
  function setPaused(v) {
    paused = v;
    if (!v) wake();
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wake();
  });

  const scr = new Float32Array(points.length * 2);
  const knn = [];

  function draw(now, dt = 0.016) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const t = now / 1000;
    drawGrid();

    const f = fit.v;
    const driftAmp = reducedMotion ? 0 : lerp(0.035, 0.0045, easeOut(f));
    const activeRegion = state.mode === 'region' ? regionIndex[state.region] : null;
    const usePointer = pointer.inside && pointer.fine && !reducedMotion;
    const repelR = 70;

    // positions
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const lf = easeInOut(clamp((f * 1.45 - p.delay * 0.45) / 1, 0, 1));
      let x = lerp(p.nx, p.cx, lf);
      let y = lerp(p.ny, p.cy, lf);
      let amp = driftAmp;
      const m = p.px != null ? morphs[regions[p.region].id].v : 0;
      if (m > 0) {
        const lm = easeInOut(clamp(m * 1.5 - p.delay * 0.5, 0, 1));
        x = lerp(x, p.px, lm);
        y = lerp(y, p.py, lm);
        amp *= 1 - lm * 0.85;
      }
      x += Math.sin(t * p.fr + p.ph) * amp;
      y += Math.cos(t * p.fr * 0.8 + p.ph * 1.3) * amp;
      let sx = toScreenX(x);
      let sy = toScreenY(y);
      let tdx = 0;
      let tdy = 0;
      if (usePointer) {
        const ddx = sx - pointer.x;
        const ddy = sy - pointer.y;
        const d = Math.hypot(ddx, ddy);
        if (d < repelR && d > 0.01) {
          const s = Math.pow(1 - d / repelR, 2) * 12;
          tdx = (ddx / d) * s;
          tdy = (ddy / d) * s;
        }
      }
      const kk = reducedMotion ? 1 : 1 - Math.exp(-dt * 10);
      p.dx += (tdx - p.dx) * kk;
      p.dy += (tdy - p.dy) * kk;
      sx += p.dx;
      sy += p.dy;
      scr[i * 2] = sx;
      scr[i * 2 + 1] = sy;
    }

    knn.length = 0;
    if (usePointer) {
      for (let i = 0; i < points.length; i++) {
        const d = Math.hypot(scr[i * 2] - pointer.x, scr[i * 2 + 1] - pointer.y);
        if (d < 150) {
          knn.push([d, i]);
        }
      }
      knn.sort((a, b) => a[0] - b[0]);
      knn.length = Math.min(knn.length, 5);
      ctx.lineWidth = 1;
      for (const [d, i] of knn) {
        ctx.globalAlpha = 0.55 * (1 - d / 150);
        ctx.strokeStyle = colors.gold;
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(scr[i * 2], scr[i * 2 + 1]);
        ctx.stroke();
      }
    }

    const groups = new Map();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const sx = scr[i * 2];
      const sy = scr[i * 2 + 1];
      if (sx < -10 || sy < -10 || sx > W + 10 || sy > H + 10) continue;
      let alpha;
      let hi = false;
      if (p.region < 0) {
        alpha = lerp(0.5, 0.22, f);
      } else if (activeRegion != null) {
        if (p.region === activeRegion) {
          alpha = 0.85;
          if (state.region === 'about') hi = morphs.about && morphs.about.v > 0.3;
          if (p.item && (p.item === state.item || p.item === hoverItem)) hi = true;
          if (state.item && p.item && p.item !== state.item && p.item !== hoverItem) alpha = 0.3;
        } else {
          alpha = 0.16;
        }
      } else {
        alpha = lerp(0.6, 0.78, f);
        if (hoverRegion && f > 0.5) {
          if (regions[p.region].id === hoverRegion) hi = true;
          else alpha = 0.35;
        }
      }
      const key = `${p.region}|${hi ? 1 : 0}|${Math.round(alpha * 20)}`;
      let g = groups.get(key);
      if (!g) {
        g = { region: p.region, hi, alpha: Math.round(alpha * 20) / 20, idx: [] };
        groups.set(key, g);
      }
      g.idx.push(i);
    }

    const zs = clamp(Math.sqrt(cam.z), 1, 1.9);
    for (const g of groups.values()) {
      const rid = g.region >= 0 ? regions[g.region].id : null;
      const mv = rid && morphs[rid] ? morphs[rid].v : 0;
      let marker = g.region < 0 || f < 0.35 ? 'dot' : regions[g.region].marker;
      if (mv > 0.5 && layouts[rid].marker) marker = layouts[rid].marker;
      const shrink = mv > 0 && layouts[rid].count ? 1 - 0.3 * mv : 1;
      const col = g.hi ? colors.gold : colors.ink;
      ctx.globalAlpha = g.hi ? Math.max(g.alpha, 0.9) : g.alpha;
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const i of g.idx) {
        const s = points[i].size * zs * shrink * (marker === 'dot' ? 1 : 1.35);
        shape(marker, scr[i * 2], scr[i * 2 + 1], s);
      }
      if (marker === 'ring' || marker === 'box' || marker === 'cross' || marker === 'triangle') ctx.stroke();
      else ctx.fill();
    }

    drawLayoutLabels();

    if (usePointer) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 4, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function shape(marker, x, y, s) {
    switch (marker) {
      case 'ring':
        ctx.moveTo(x + s, y);
        ctx.arc(x, y, s, 0, TAU);
        break;
      case 'square':
        ctx.rect(x - s * 0.85, y - s * 0.85, s * 1.7, s * 1.7);
        break;
      case 'box':
        ctx.rect(x - s, y - s, s * 2, s * 2);
        break;
      case 'triangle':
        ctx.moveTo(x, y - s * 1.1);
        ctx.lineTo(x + s, y + s * 0.75);
        ctx.lineTo(x - s, y + s * 0.75);
        ctx.closePath();
        break;
      case 'cross':
        ctx.moveTo(x - s, y);
        ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y + s);
        break;
      default:
        ctx.moveTo(x + s, y);
        ctx.arc(x, y, s, 0, TAU);
    }
  }

  function drawLayoutLabels() {
    for (const [rid, labels] of Object.entries(layoutLabels)) {
      const mv = morphs[rid].v;
      if (mv < 0.4 || !labels.length) continue;
      const a = clamp((mv - 0.4) / 0.6, 0, 1);
      ctx.textBaseline = 'middle';
      for (const l of labels) {
        const x = toScreenX(l.wx);
        const y = toScreenY(l.wy);
        ctx.globalAlpha = a * (l.tone === 'muted' ? 0.8 : 0.95);
        ctx.fillStyle = l.tone === 'gold' ? colors.gold : l.tone === 'muted' ? colors.muted : colors.ink;
        ctx.font = l.tone === 'ink' ? `17px ${colors.serif}` : `11px ${colors.mono}`;
        ctx.textAlign = l.align || 'left';
        ctx.fillText(l.text, x, y);
        if (l.tick) {
          ctx.strokeStyle = ctx.fillStyle;
          ctx.globalAlpha = a * 0.5;
          ctx.beginPath();
          ctx.moveTo(Math.round(x) + 0.5, y - 18);
          ctx.lineTo(Math.round(x) + 0.5, y - 10);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawGrid() {
    const pxPerUnit = unit * cam.z;
    const steps = [0.05, 0.1, 0.2, 0.5, 1];
    let step = steps[steps.length - 1];
    for (const s of steps) {
      if (s * pxPerUnit >= 90) {
        step = s;
        break;
      }
    }
    const tl = toWorld(0, 0);
    const br = toWorld(W, H);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x0 = Math.ceil(tl.x / step) * step;
    const y0 = Math.ceil(tl.y / step) * step;
    for (let x = x0; x <= br.x; x += step) {
      const sx = Math.round(toScreenX(x)) + 0.5;
      for (let y = y0; y <= br.y; y += step) {
        const sy = Math.round(toScreenY(y)) + 0.5;
        ctx.moveTo(sx - 3, sy);
        ctx.lineTo(sx + 3, sy);
        ctx.moveTo(sx, sy - 3);
        ctx.lineTo(sx, sy + 3);
      }
    }
    ctx.stroke();

    if (compact || frameMode === 'doc') return;
    ctx.fillStyle = colors.muted;
    ctx.font = `10px ${colors.mono}`;
    ctx.globalAlpha = 0.75;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const decimals = step < 0.1 ? 2 : 1;
    for (let x = x0; x <= br.x; x += step) {
      const sx = toScreenX(x);
      if (sx > W - panelWidth - 40) continue;
      if (exclusion && sx > exclusion.left - 20 && sx < exclusion.right + 20) continue;
      ctx.fillText(fmt(x, decimals), sx, H - 12);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = y0; y <= br.y; y += step) {
      const sy = toScreenY(y);
      if (sy < 80 || sy > H - 40) continue;
      if (frameMode === 'doc') continue;
      ctx.fillText(fmt(-y, decimals), W - panelWidth - 14, sy);
    }
    ctx.globalAlpha = 1;
  }

  function fmt(v, d) {
    const s = (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
    return s.replace('-', '−');
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const get = (n, fb) => cs.getPropertyValue(n).trim() || fb;
    return {
      ink: get('--ink', '#e8e4da'),
      gold: get('--gold', '#cba63a'),
      muted: get('--muted', '#9a968c'),
      grid: get('--grid', 'rgba(232,228,218,0.08)'),
      mono: get('--mono', 'monospace'),
      serif: get('--serif', 'serif'),
    };
  }

  function setExclusion(rect) {
    exclusion = rect;
  }

  function setFrameMode(mode) {
    if (mode === frameMode) return;
    frameMode = mode;
    resize();
    wake();
  }

  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas);
  wake();

  return {
    setState,
    setPanelWidth,
    setPaused,
    setExclusion,
    setFrameMode,
    on,
    regionAnchor,
    itemAnchor,
    zoomProgress,
    highlightRegion,
    highlightItem,
    get pointCount() {
      return points.length;
    },
    get fit() {
      return fit.v;
    },
  };
}

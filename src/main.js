import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles/main.css';

import { site } from './data/site.js';
import { regions } from './data/regions.js';
import { projects } from './data/projects.js';
import { portraitPoints } from './data/portrait.js';
import { work } from './data/work.js';
import { education } from './data/education.js';
import { lens } from './data/lens.js';
import { createField } from './field/field.js';
import { buildLayouts } from './field/layouts.js';
import { parseRoute, routeHref, routeTitle, routePath } from './ui/router.js';

const $ = (sel, el = document) => el.querySelector(sel);
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 899px), (max-height: 539px)');

const els = {
  stage: $('#stage'),
  canvas: $('#field'),
  hero: $('#hero'),
  explore: $('#explore'),
  hint: $('#hero-hint'),
  labels: $('#field-labels'),
  nodes: $('#field-nodes'),
  legend: $('#legend'),
  panel: $('#panel'),
  panelBody: $('#panel-body'),
  panelBack: $('#panel-back'),
  path: $('#readout-path'),
  xy: $('#readout-xy'),
  toggle: $('#view-toggle'),
  doc: $('#doc'),
  skip: $('#skip-link'),
};

const regionById = Object.fromEntries(regions.map((r) => [r.id, r]));
const projectBySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

let view = root.dataset.view === 'field' ? 'field' : 'doc';
let route = parseRoute(location.hash, { regionById, projectBySlug });
let explored = route.mode !== 'intro';
let lastInputWasKeyboard = false;

addEventListener('keydown', () => (lastInputWasKeyboard = true), true);
addEventListener('pointerdown', () => (lastInputWasKeyboard = false), true);

// ---------------------------------------------------------------- field
const field = createField(els.canvas, {
  regions,
  projects,
  layouts: buildLayouts({ work, education, lens, portraitPoints }),
  compact: narrow.matches,
  reducedMotion: reduced.matches,
});
els.hint.textContent = `${field.pointCount} points, not yet fitted`;

// Region labels that float above each cluster (pointer convenience; the legend is the accessible nav).
const labelEls = {};
for (const r of regions) {
  const b = document.createElement('button');
  b.type = 'button';
  b.tabIndex = -1;
  b.className = 'field-label';
  b.dataset.region = r.id;
  b.innerHTML = `<span class="marker marker--${r.marker}"></span>${r.label}`;
  b.addEventListener('click', () => navigate({ mode: 'region', region: r.id }));
  b.addEventListener('pointerenter', () => field.highlightRegion(r.id));
  b.addEventListener('pointerleave', () => field.highlightRegion(null));
  els.labels.append(b);
  labelEls[r.id] = b;
}

// Project nodes, shown when the camera is inside the Projects cluster.
const nodeEls = {};
for (const p of projects) {
  const a = document.createElement('a');
  a.className = 'node';
  a.href = routeHref({ mode: 'region', region: 'projects', item: p.slug });
  a.dataset.slug = p.slug;
  a.innerHTML = `<span class="node-dot" aria-hidden="true"></span><span class="node-text"><span class="node-title">${p.title}</span><span class="node-meta mono">${p.category}</span></span>`;
  a.addEventListener('pointerenter', () => field.highlightItem(p.slug));
  a.addEventListener('pointerleave', () => field.highlightItem(null));
  a.addEventListener('focus', () => field.highlightItem(p.slug));
  a.addEventListener('blur', () => field.highlightItem(null));
  els.nodes.append(a);
  nodeEls[p.slug] = a;
}

// Legend links: rewrite the no-JS anchors (#doc-work) to routes (#/work).
const legendLinks = {};
for (const a of els.legend.querySelectorAll('a[data-region]')) {
  const id = a.dataset.region;
  legendLinks[id] = a;
  a.href = routeHref({ mode: 'region', region: id });
  a.addEventListener('pointerenter', () => view === 'field' && field.highlightRegion(id));
  a.addEventListener('pointerleave', () => view === 'field' && field.highlightRegion(null));
}

field.on('select', ({ region, item }) => navigate({ mode: 'region', region, item: item || null }));
field.on('background', () => navigate(up(route)));
field.on('hoverregion', (id) => {
  for (const [rid, el] of Object.entries(labelEls)) el.classList.toggle('is-hot', rid === id);
});
field.on('pointer', (w) => {
  els.xy.textContent = w ? `x ${fmt(w.x)}  y ${fmt(-w.y)}` : '';
});
field.on('frame', positionOverlays);

function fmt(v) {
  return (v >= 0 ? ' ' : '−') + Math.abs(v).toFixed(2);
}

function positionOverlays() {
  if (view !== 'field') return;
  if (route.mode === 'overview') {
    for (const r of regions) {
      const a = field.regionAnchor(r.id);
      labelEls[r.id].style.transform = `translate(${a.cx.toFixed(1)}px, ${a.y.toFixed(1)}px) translate(-50%, -100%)`;
    }
  }
  if (route.mode === 'region' && route.region === 'projects') {
    const zp = field.zoomProgress();
    els.nodes.style.opacity = String(Math.max(0, (zp - 0.55) / 0.45));
    for (const p of projects) {
      const a = field.itemAnchor(p.slug);
      const el = nodeEls[p.slug];
      const left = a.side === 'left';
      el.classList.toggle('is-left', left);
      el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) translate(${left ? 'calc(-100% + 9px)' : '-9px'}, -50%)`;
    }
  }
}

// ---------------------------------------------------------------- navigation
function navigate(r) {
  const href = routeHref(r);
  if (location.hash === href || (href === '#/' && !location.hash)) {
    apply(r);
  } else {
    location.hash = href;
  }
}

function up(r) {
  if (r.mode === 'region' && r.item) return { mode: 'region', region: r.region };
  if (r.mode === 'region') return { mode: 'overview' };
  return r;
}

addEventListener('hashchange', () => {
  // Plain in-page anchors (e.g. the skip link) are not routes.
  if (location.hash && !location.hash.startsWith('#/')) return;
  apply(parseRoute(location.hash, { regionById, projectBySlug }));
});

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || view !== 'field') return;
  if (route.mode === 'region') {
    e.preventDefault();
    navigate(up(route));
  }
});

function apply(next, { initial = false } = {}) {
  const prev = route;
  route = next;
  if (route.mode !== 'intro') explored = true;
  document.title = routeTitle(route, { regionById, projectBySlug, site });
  els.path.textContent = routePath(route, { regionById, projectBySlug });

  for (const [id, a] of Object.entries(legendLinks)) {
    if (route.mode === 'region' && route.region === id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  }

  if (view === 'field') applyField(prev, initial);
  else applyDoc(initial);
}

function applyField(prev, initial) {
  root.dataset.state = route.mode;
  updateExclusion();
  root.dataset.region = route.region || '';
  if (route.item) root.dataset.item = route.item;
  else delete root.dataset.item;
  field.setState({ mode: route.mode, region: route.region || null, item: route.item || null }, { instant: initial });

  // project nodes
  const showNodes = route.mode === 'region' && route.region === 'projects';
  els.nodes.hidden = !showNodes;
  for (const [slug, el] of Object.entries(nodeEls)) {
    el.classList.toggle('is-active', route.item === slug);
    if (route.item === slug) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  }

  // panel
  const def = route.region ? regionById[route.region] : null;
  const wantsPanel = route.mode === 'region' && def && (def.panel || route.item);
  if (wantsPanel) openPanel(route, initial);
  else closePanel();

  positionOverlays();

  // focus management for keyboard users
  if (!initial) {
    if (wantsPanel) {
      $('#panel-title')?.focus({ preventScroll: true });
    } else if (showNodes && lastInputWasKeyboard) {
      const target = prev.item ? nodeEls[prev.item] : els.nodes.querySelector('.node');
      target?.focus({ preventScroll: true });
    } else if (route.mode === 'overview' && prev.mode === 'region' && lastInputWasKeyboard) {
      legendLinks[prev.region]?.focus({ preventScroll: true });
    } else if (route.mode === 'overview' && prev.mode === 'intro' && lastInputWasKeyboard) {
      els.legend.querySelector('a')?.focus({ preventScroll: true });
    }
  }
}

function openPanel(r, initial) {
  let title;
  let content;
  if (r.item) {
    const p = projectBySlug[r.item];
    title = p.title;
    content = els.doc.querySelector(`#doc-projects-${r.item}`).cloneNode(true);
    content.querySelector('h3')?.remove();
    content.querySelector('details')?.setAttribute('open', '');
    els.panelBack.textContent = 'All projects';
    els.panelBack.href = routeHref({ mode: 'region', region: 'projects' });
  } else {
    title = regionById[r.region].label;
    content = els.doc.querySelector(`#doc-${r.region} .chapter-body`).cloneNode(true);
    els.panelBack.textContent = 'Close';
    els.panelBack.href = routeHref({ mode: 'overview' });
  }
  for (const el of [content, ...content.querySelectorAll('[id]')]) el.removeAttribute('id');
  for (const el of content.querySelectorAll('[aria-labelledby]')) el.removeAttribute('aria-labelledby');
  const h = document.createElement('h2');
  h.id = 'panel-title';
  h.tabIndex = -1;
  h.className = 'panel-title';
  h.textContent = title;
  els.panelBody.replaceChildren(h, content);
  els.panelBody.scrollTop = 0;
  els.panel.dataset.kind = r.item ? 'project' : r.region;
  const wasHidden = els.panel.hidden;
  els.panel.hidden = false;
  if (wasHidden && !initial && !reduced.matches) {
    els.panel.classList.remove('is-entering');
    void els.panel.offsetWidth;
    els.panel.classList.add('is-entering');
  }
  const pw = els.panel.getBoundingClientRect().width;
  root.style.setProperty('--panel-w', `${pw}px`);
  field.setPanelWidth(pw);
}

function closePanel() {
  if (els.panel.hidden) return;
  els.panel.hidden = true;
  root.style.setProperty('--panel-w', '0px');
  field.setPanelWidth(0);
}

// ---------------------------------------------------------------- doc view
let chapterObserver = null;
let stageObserver = null;

function applyDoc(initial) {
  root.dataset.state = 'intro';
  if (route.mode !== 'region') els.path.textContent = 'unfitted data';
  els.hint.textContent = `${field.pointCount} points, not yet fitted`;
  field.setState({ mode: 'intro', region: null, item: null }, { instant: initial });
  if (route.mode === 'region') {
    const id = route.item ? `doc-projects-${route.item}` : `doc-${route.region}`;
    const el = document.getElementById(id);
    if (el) {
      el.querySelector('details')?.setAttribute('open', '');
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: initial || reduced.matches ? 'auto' : 'smooth', block: 'start' });
        if (!initial) el.querySelector('h2, h3')?.setAttribute('tabindex', '-1');
        if (!initial) el.querySelector('h2, h3')?.focus({ preventScroll: true });
      });
    }
  } else if (route.mode === 'intro' && !initial) {
    scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
  }
}

function setupDocObservers() {
  chapterObserver?.disconnect();
  stageObserver?.disconnect();
  if (view !== 'doc') return;
  chapterObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = e.target.dataset.region;
        for (const [rid, a] of Object.entries(legendLinks)) {
          if (rid === id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        }
        els.path.textContent = regionById[id] ? regionById[id].label.toLowerCase() : '';
        
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  els.doc.querySelectorAll('.chapter').forEach((c) => chapterObserver.observe(c));
  stageObserver = new IntersectionObserver(
    ([e]) => {
      field.setPaused(!e.isIntersecting);
      const atHero = e.intersectionRatio > 0.35;
      root.classList.toggle('at-hero', atHero);
      if (atHero) els.path.textContent = 'unfitted data';
    },
    { threshold: [0, 0.35, 0.6] }
  );
  stageObserver.observe(els.stage);
}

// ---------------------------------------------------------------- controls
els.explore.addEventListener('click', () => {
  if (view === 'field') {
    navigate({ mode: 'overview' });
    return;
  }
  els.doc.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
});

function setView(next, { persist = true } = {}) {
  view = next;
  root.dataset.view = next;
  if (persist) {
    try {
      sessionStorage.setItem('view', next);
    } catch (e) {
      /* storage may be unavailable; the choice just won't persist */
    }
  }
  els.toggle.setAttribute('aria-pressed', String(next === 'doc'));
  els.toggle.textContent = next === 'doc' ? 'Field view' : 'List view';
  field.setFrameMode(next === 'doc' ? 'doc' : 'field');
  if (next === 'doc') {
    closePanel();
    els.nodes.hidden = true;
    field.setPaused(false);
  }
  if (next === 'field') root.classList.remove('at-hero');
  setupDocObservers();
  apply(route, { initial: true });
}

els.toggle.addEventListener('click', () => setView(view === 'field' ? 'doc' : 'field'));

els.skip.addEventListener('click', (e) => {
  if (view === 'field') {
    e.preventDefault();
    setView('doc');
    els.doc.focus();
  }
});

narrow.addEventListener('change', () => {
  if (narrow.matches && view === 'field') setView('doc', { persist: false });
});

// keep the axis labels clear of the legend (only while the legend is showing)
function updateExclusion() {
  if (view !== 'field' || route.mode === 'intro') return field.setExclusion(null);
  const r = els.legend.getBoundingClientRect();
  const s = els.canvas.getBoundingClientRect();
  field.setExclusion({ left: r.left - s.left, right: r.right - s.left });
}
new ResizeObserver(updateExclusion).observe(els.legend);


// ---------------------------------------------------------------- mobile menu
const menuButton = $('#legend-toggle');

function setMenu(open, { focusButton = false } = {}) {
  els.legend.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  if (open && lastInputWasKeyboard) els.legend.querySelector('.legend-list a')?.focus();
  if (!open && focusButton) menuButton.focus();
}

menuButton.addEventListener('click', () => setMenu(!els.legend.classList.contains('is-open')));

// Close after choosing a section, on Escape, or on a tap anywhere else.
els.legend.addEventListener('click', (e) => {
  if (e.target.closest('.legend-list a')) setMenu(false);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.legend.classList.contains('is-open')) setMenu(false, { focusButton: true });
});
document.addEventListener('pointerdown', (e) => {
  if (els.legend.classList.contains('is-open') && !els.legend.contains(e.target)) setMenu(false);
});

// ---------------------------------------------------------------- start
if (route.mode === 'intro' && !location.hash) history.replaceState(null, '', location.pathname + location.search);
setView(view, { persist: false });
requestAnimationFrame(() => root.classList.add('is-ready'));

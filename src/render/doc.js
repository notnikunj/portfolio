

import { site } from '../data/site.js';
import { work } from '../data/work.js';
import { projects } from '../data/projects.js';
import { education, certifications } from '../data/education.js';
import { about, skills } from '../data/about.js';
import { contact } from '../data/contact.js';
import { lens } from '../data/lens.js';
import { notes } from '../data/notes.js';
import { regions } from '../data/regions.js';
import { schematic } from './schematics.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isExternal = (href) => /^https?:/.test(href);
const link = (href, text, cls = '') =>
  `<a href="${esc(href)}"${cls ? ` class="${cls}"` : ''}${isExternal(href) ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}${isExternal(href) ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ''}</a>`;

const regionById = Object.fromEntries(regions.map((r) => [r.id, r]));

function chapter(id, body, countLabel = '') {
  const r = regionById[id];
  if (!r) return '';
  return `
<section class="chapter" id="doc-${id}" data-region="${id}" aria-labelledby="h-${id}">
  <header class="chapter-head">
    <span class="marker marker--${r.marker}" aria-hidden="true"></span>
    <h2 id="h-${id}">${esc(r.label)}</h2>
    ${countLabel ? `<span class="chapter-count">${countLabel}</span>` : ''}
  </header>
  <div class="chapter-body">${body}</div>
</section>`;
}

function renderWork() {
  return work
    .map(
      (w) => `
<article class="role" id="doc-work-${w.id}">
  <p class="role-dates"><span class="mono">${esc(w.start)} – ${esc(w.end)}</span></p>
  <div class="role-text">
    <h3>${esc(w.role)}, ${link(w.url, w.organisation)}</h3>
    <p class="muted">${esc(w.about)} ${esc(w.type)}.</p>
    ${w.highlights.length ? `<ul class="plain">${w.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
  </div>
</article>`
    )
    .join('');
}

export function renderProject(p) {
  const meta = [p.category, p.year].filter(Boolean).join(', ');
  const facts = [];
  if (p.problem) facts.push(['Problem', `<p>${esc(p.problem)}</p>`]);
  if (p.approach && p.approach.length)
    facts.push(['Approach', `<ul class="plain">${p.approach.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`]);
  if (p.outcome) facts.push(['Outcome', `<p>${esc(p.outcome)}</p>`]);
  if (p.context) facts.push(['Context', `<p>${esc(p.context)}</p>`]);
  const links = (p.links || []).filter((l) => l && l.href);
  return `
<article class="project" id="doc-projects-${p.slug}" data-slug="${p.slug}" aria-labelledby="h-p-${p.slug}">
  <figure class="project-figure">
    ${schematic(p.schematic)}
    <figcaption>Schematic of the method, not real results.</figcaption>
  </figure>
  <div class="project-text">
    <p class="project-meta mono">${esc(meta)}</p>
    <h3 id="h-p-${p.slug}">${esc(p.title)}</h3>
    <p class="project-summary">${esc(p.summary)}</p>
    <ul class="tools" aria-label="Tools">${p.tools.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    ${
      facts.length
        ? `<details class="project-more">
      <summary>How it works</summary>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </details>`
        : ''
    }
    ${links.length ? `<p class="links">${links.map((l) => link(l.href, l.label)).join('')}</p>` : ''}
  </div>
</article>`;
}

function renderEducation() {
  const degrees = education
    .map(
      (e) => `
<article class="degree" id="doc-education-${e.id}">
  <p class="role-dates"><span class="mono">${esc(e.start)} – ${esc(e.end)}</span></p>
  <div class="role-text">
    <h3>${esc(e.degree)}</h3>
    <p>${esc(e.institution)}${e.result ? `<span class="result">${esc(e.result)}</span>` : ''}</p>
    ${e.modules.length ? `<p class="muted modules"><span class="visually-hidden">Modules: </span>${e.modules.map(esc).join(', ')}</p>` : ''}
  </div>
</article>`
    )
    .join('');
  const certs = certifications.length
    ? `
<div class="certs">
  <h3>Certifications</h3>
  <ul class="plain">${certifications
    .map(
      (c) =>
        `<li>${c.url ? link(c.url, c.name) : esc(c.name)} <span class="muted">${esc(c.issuer)}, ${esc(c.date)}</span></li>`
    )
    .join('')}</ul>
</div>`
    : '';
  return degrees + certs;
}

function renderAbout() {
  return `
<div class="about${about.portrait ? ' about--with-portrait' : ''}">
  ${
    about.portrait
      ? `<figure class="about-portrait">
    <img src="${about.portrait.src}" alt="${esc(about.portrait.alt)}" loading="lazy" decoding="async">
  </figure>`
      : ''
  }
  <div class="about-text">
    ${about.bio.map((p) => `<p>${esc(p)}</p>`).join('')}
    <h3>Skills</h3>
    <dl class="skills">${skills
      .map((s) => `<div><dt>${esc(s.group)}</dt><dd>${s.items.map(esc).join(', ')}</dd></div>`)
      .join('')}</dl>
  </div>
</div>`;
}

function renderLens() {
  const ig = link(lens.instagram.href, `@${lens.instagram.handle}`);
  if (lens.photos.length) {
    return `${lens.intro ? `<p>${esc(lens.intro)}</p>` : ''}
<div class="lens-grid">${lens.photos
      .map(
        (ph) =>
          `<figure class="lens-photo"><img src="${esc(ph.src)}" alt="${esc(ph.alt)}" width="${ph.width}" height="${ph.height}" loading="lazy" decoding="async">${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ''}</figure>`
      )
      .join('')}</div>
<p class="muted">More on Instagram: ${ig}</p>`;
  }
  return `${lens.intro ? `<p>${esc(lens.intro)}</p>` : ''}
<p>No photographs here yet. Recent ones are on Instagram: ${ig}</p>
<div class="lens-grid lens-grid--empty" aria-hidden="true">${lens.placeholderFrames
    .map((ar) => `<div class="lens-frame" style="aspect-ratio:${ar}"></div>`)
    .join('')}</div>`;
}

function renderContact() {
  return `
<ul class="contact-list">${contact
    .map(
      (c) =>
        `<li><span class="contact-label mono">${esc(c.label)}</span>${link(c.href, c.handle, 'contact-link')}</li>`
    )
    .join('')}</ul>`;
}

function renderNotes() {
  return `<ul class="plain notes">${notes
    .map(
      (n) =>
        `<li><h3>${n.href ? link(n.href, n.title) : esc(n.title)}</h3>${n.date ? `<p class="mono muted">${esc(n.date)}</p>` : ''}<p>${esc(n.body)}</p></li>`
    )
    .join('')}</ul>`;
}

export function renderDoc() {
  const year = new Date().getFullYear();
  const order = regionOrder;
  const body = {
    projects: () => chapter('projects', projects.map(renderProject).join(''), `n = ${projects.length}`),
    work: () => chapter('work', renderWork(), `n = ${work.length}`),
    education: () => chapter('education', renderEducation()),
    about: () => chapter('about', renderAbout()),
    lens: () => chapter('lens', renderLens()),
    notes: () => (notes.length ? chapter('notes', renderNotes(), `n = ${notes.length}`) : ''),
    contact: () => chapter('contact', renderContact()),
  };
  return (
    order.map((id) => body[id]()).join('') +
    `<footer class="doc-footer"><p>© ${year} ${esc(site.name)}</p><p class="mono muted">${esc(site.location)}</p></footer>`
  );
}

export const regionOrder = ['projects', 'work', 'education', 'about', 'lens', 'notes', 'contact'];

// The legend doubles as the site navigation.
export function renderLegend() {
  const counts = { projects: projects.length, work: work.length };
  const items = regionOrder
    .map((id) => regionById[id])
    .filter(Boolean)
    .map(
      (r) =>
        `<li><a href="#doc-${r.id}" data-region="${r.id}"><span class="marker marker--${r.marker}" aria-hidden="true"></span><span class="legend-label">${esc(r.label)}</span>${counts[r.id] ? `<span class="legend-n mono" aria-hidden="true">${counts[r.id]}</span>` : ''}</a></li>`
    )
    .join('');
  return `<ul class="legend-list">${items}</ul>`;
}

export function renderJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    alumniOf: ['University of Hertfordshire'],
    affiliation: ['University of Bristol'],
    sameAs: contact.filter((c) => isExternal(c.href)).map((c) => c.href),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

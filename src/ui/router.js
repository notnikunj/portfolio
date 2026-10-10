// Hash routes, which work on GitHub Pages without any server configuration.
//
//   #/                         start (unfitted noise)
//   #/explore                  all clusters
//   #/work, #/about ...        one region
//   #/projects/isl-translator  one project

export function parseRoute(hash, { regionById, projectBySlug }) {
  const h = (hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!h) return { mode: 'intro' };
  if (h === 'explore') return { mode: 'overview' };
  const [region, item] = h.split('/');
  if (regionById[region]) {
    if (region === 'projects' && item && projectBySlug[item]) return { mode: 'region', region, item };
    return { mode: 'region', region, item: null };
  }
  // Old-style anchors (#doc-work) and unknown paths fall back gracefully.
  const m = /^doc-([a-z]+)(?:-(.+))?$/.exec(h);
  if (m && regionById[m[1]]) {
    if (m[1] === 'projects' && m[2] && projectBySlug[m[2]]) return { mode: 'region', region: 'projects', item: m[2] };
    return { mode: 'region', region: m[1], item: null };
  }
  return { mode: 'overview' };
}

export function routeHref(r) {
  if (r.mode === 'intro') return '#/';
  if (r.mode === 'overview') return '#/explore';
  return r.item ? `#/${r.region}/${r.item}` : `#/${r.region}`;
}

export function routeTitle(r, { regionById, projectBySlug, site }) {
  const base = site.name;
  if (r.mode !== 'region') return base;
  if (r.item) return `${projectBySlug[r.item].title}, ${site.name}`;
  return `${regionById[r.region].label}, ${site.name}`;
}

// The short "you are here" path shown top-right.
export function routePath(r, { regionById, projectBySlug }) {
  if (r.mode === 'intro') return 'unfitted data';
  if (r.mode === 'overview') return 'all regions';
  const base = regionById[r.region].label.toLowerCase();
  return r.item ? `${base} / ${projectBySlug[r.item].title.toLowerCase()}` : base;
}

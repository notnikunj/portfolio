# nikunjbhavsar.com

Nikunj Bhavsar's personal site: a 2D scatter plot ("the field") where every point belongs to part of his work. Press **Explore** and the noise converges into one cluster per section; zoom into a cluster and it redraws its own data (a timeline for Work and Education, empty photo frames for Lens, a hand-drawn self-portrait for About).

Plain HTML, CSS and JavaScript built with Vite. No framework, no backend, about 16 KB of gzipped JavaScript.

## Run it locally

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev        # http://localhost:5173, reloads as you edit
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173 to check the build
```

## Edit the content

All text lives in `src/data/`. You should never need to touch a component to update the site.

| File | What it holds |
| --- | --- |
| `site.js` | name, role, tagline, description used for search and social previews |
| `projects.js` | projects: summary, problem, approach, outcome, tools, links |
| `work.js` | roles, dates, highlights |
| `education.js` | degrees, modules, certifications |
| `about.js` | bio and skills |
| `contact.js` | email and profile links |
| `lens.js` | photographs (empty for now; instructions inside) |
| `notes.js` | notes or ideas; the Notes section appears once this has an entry |
| `regions.js` | where each cluster sits in the field, and its legend shape |

Search the project for `TODO(nikunj)` to find every gap: missing GitHub links, years, and the problem/outcome for a few projects. Empty fields are simply hidden on the site, so nothing is invented to fill them.

Work and Education timelines are drawn from the dates in `work.js` and `education.js`, so they update themselves.

PDFs live in `public/docs/`, the CV at `public/Nikunj_Bhavsar.pdf`, images in `public/images/`.

To change the self-portrait, replace `scripts/portrait-source.png` (gold strokes on a dark background) and run `python3 scripts/extract_portrait.py` (needs `pip install pillow numpy`).

## How it fits together

```
index.html               page shell; the full text is injected at build time
src/main.js              routing, panels, legend, view switching
src/field/field.js       the canvas: points, camera, cursor neighbours, drawing
src/field/layouts.js     what each cluster turns into when you zoom in
src/render/doc.js        renders all content as HTML (used at build and for panels)
src/render/schematics.js the small code-drawn project illustrations
src/ui/router.js         hash routes (#/projects/isl-translator)
src/styles/main.css      all styles
public/                  copied as-is: CNAME, PDFs, icons, robots.txt, sitemap.xml, 404.html
```

- **Routing** uses the URL hash (`/#/work`), so deep links work on GitHub Pages with no server setup.
- **List view.** Phones, small tablets, visitors who prefer reduced motion and anyone pressing *List view* get the same content as a single readable page. Search engines and visitors without JavaScript get it too, because it is in the HTML.
- **Old links.** `404.html` redirects the previous site's PDF and image URLs to their new locations.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.

### 1. Put this project in your repository

The live site is currently served from `notnikunj/portfolio` (its `main` branch, with a `CNAME` file). To replace it with this project:

```bash
git clone https://github.com/notnikunj/portfolio.git
cd portfolio
git rm -r -q .                         # clear the old site (it stays in git history)
# copy every file from this project into the folder, including .github/ and .gitignore
npm install                            # creates package-lock.json, which the workflow needs
npm run build                          # check it builds
git add -A
git commit -m "Rebuild site as the field"
git push origin main
```

### 2. Switch Pages to GitHub Actions

On GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

Then open the **Actions** tab and watch **Deploy to GitHub Pages** finish (about a minute). Every later push to `main` deploys automatically.

### 3. Custom domain

Still in **Settings → Pages**:

1. **Custom domain**: enter `nikunjbhavsar.com` and save. With Actions deployments this setting is what counts; the `public/CNAME` file is kept for clarity and for branch-based deploys.
2. Wait for the DNS check to pass.
3. Tick **Enforce HTTPS**. GitHub issues the certificate automatically; if the box is greyed out, wait up to an hour after DNS resolves and refresh.

### 4. DNS records (at your domain registrar)

Your domain already points at GitHub Pages, but if you ever need to set it up again, these are the records:

| Type | Host / name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `notnikunj.github.io` |

Remove any other A, AAAA or CNAME records on `@` and `www` (for example a registrar's parking page). Check propagation with `dig nikunjbhavsar.com +short`.

Recommended: verify the domain under **GitHub → your profile Settings → Pages → Add a domain**, which stops anyone else from claiming it on GitHub.

### Deploying without the custom domain

If you serve the site from `https://notnikunj.github.io/portfolio/` instead, build with the repository name as the base path, for example in the workflow: `run: VITE_BASE=/portfolio/ npm run build`.

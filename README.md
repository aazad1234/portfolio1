# John Anderson Portfolio

A responsive, accessible, SEO-first portfolio for a fictional full-stack developer. The site is a multi-page static build with build-time shared components, generated project and article pages, centralized JSON content, and no runtime dependencies.

## Requirements

- Node.js 18 or newer (tested on Node 20)
- Any static web host

No `npm install` is required. All build, preview, and validation scripts use Node's built-in modules.

## Quick start

```bash
npm run build
npm run dev
```

Open <http://127.0.0.1:4173/>. The preview server uses port `4173` by default; set `PORT` or `HOST` to override it.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Builds all static and generated HTML pages (18 currently) and regenerates `sitemap.xml`, `robots.txt`, `feed.xml`, and `site.webmanifest`. |
| `npm run dev` | Starts the local static preview server with custom 404 handling. |
| `npm run serve` | Alias for `npm run dev`. |
| `npm run seo` | Regenerates only the sitemap, robots file, feed, and web manifest. |
| `npm run check` | Validates generated HTML, metadata, local links and assets, component output, and basic accessibility requirements. |
| `npm test` | Alias for `npm run check`. |

`npm run check` currently reports one expected warning because the contact form endpoint is intentionally empty. The form falls back to a pre-filled `mailto:` draft in that state.

## Project structure

```text
src/pages/              Page sources and detail templates
components/             Shared header, footer, navigation, scripts, and SEO assets
assets/data/            Site, page, project, article, and résumé content
assets/css/             Design tokens, components, animations, and responsive rules
assets/js/              Navigation, theme, filtering, validation, and animation modules
assets/images/          Portrait, project art, article covers, icons, and social image
scripts/                Build, validation, preview, and SEO generation tools
scripts/lib/            Data loading, HTML escaping, rendering, and SEO helpers
*.html                  Generated output pages
sitemap.xml             Generated sitemap
robots.txt              Generated crawler directives
feed.xml                Generated RSS feed
site.webmanifest        Generated web app manifest
```

Generated root-level `.html` files should not be edited by hand. Edit the sources in `src/pages/` or the data in `assets/data/`, then rebuild.

## How the build works

Each source page contains build markers such as:

```html
<!-- @seo -->
<!-- @head-assets -->
<!-- @header -->
<!-- @footer -->
<!-- @scripts -->
```

The build replaces these with shared component markup, generated metadata, and script tags. It also injects the SVG icon sprite after the opening `<body>` tag.

Content renderers use markers such as:

```html
<!-- @render:projects-grid -->
<!-- @render:blog-listing -->
<!-- @render:resume-experience -->
```

Project and article detail pages are generated from `src/pages/_project.html` and `src/pages/_blog-post.html`, using records from `assets/data/projects.json` and `assets/data/blog.json`.

The build fails if a component marker or `{{TOKEN}}` remains unresolved, or if an output filename is duplicated.

## Content editing

### Site identity, contact details, and social links

Edit `assets/data/site-config.json` first. It controls:

- Owner name, role, bio, photo, email, phone, location, and availability
- Site title, description, locale, and canonical base URL
- Navigation CTA and footer copy
- Social links
- Contact form endpoint and mailto fallback
- Theme colors and branding

The social links are placeholder platform URLs marked with `"demo": true`. Replace them before publishing.

### Page and section content

| File | Content |
| --- | --- |
| `assets/data/projects.json` | Project cards and case-study detail content. |
| `assets/data/blog.json` | Article metadata and article body blocks. |
| `assets/data/experience.json` | Experience timeline, education, approach, and current focus. |
| `assets/data/skills.json` | Skill groups, tools, capabilities, principles, and learning items. |
| `assets/data/services.json` | Services, process, engagements, and FAQs. |
| `assets/data/testimonials.json` | Testimonials and collaboration content. |
| `assets/data/navigation.json` | Primary navigation, footer groups, and legal links. |
| `assets/data/seo.json` | Per-page titles, descriptions, canonical paths, social metadata, and page type. |

Static page copy lives in `src/pages/`. Shared markup lives in `components/`.

### Adding a project

1. Add a project object to `assets/data/projects.json`.
2. Give it a unique `output` filename and add the same filename to `assets/data/seo.json`.
3. Add its image to `assets/images/` and reference it from the project record.
4. Run `npm run build` and `npm run check`.

### Adding an article

1. Add an article object to `assets/data/blog.json` with a unique `slug` and `output`.
2. Add the same `output` filename to `assets/data/seo.json`.
3. Add its cover image to `assets/images/`.
4. Run `npm run build` and `npm run check`.

A project or article without a matching SEO entry will fail the build.

### Adding a new static page

1. Create `src/pages/<name>.html` using the existing marker structure.
2. Set a unique `data-page` value on `<body>`.
3. Add a matching entry to `assets/data/seo.json`.
4. Add the page to navigation if needed.
5. Run `npm run build` and `npm run check`.

## SEO

SEO metadata is generated at build time and written directly into each HTML file. `assets/js/seo-manager.js` is a runtime fallback that fetches `assets/data/seo.json` and `assets/data/site-config.json`, so both files should be deployed even though the primary metadata is static.

Update `assets/data/seo.json` for page titles, descriptions, canonical paths, and social cards. The canonical base URL comes from `site.site.url` in `site-config.json`. The generated sitemap, robots file, feed, and manifest are refreshed by every build.

The `404.html` page is intentionally `noindex,follow` and has no JSON-LD block.

## Contact form

The contact form is intentionally serverless in this demo. With `site.contact.form.endpoint` empty:

- Required fields are validated in the browser.
- The page opens a pre-filled `mailto:` draft using the address in `site.contact.form.mailto`.
- No message data is stored or sent to a server.
- The form never claims a message was sent when no endpoint is configured.

To use a real form backend, set `site.contact.form.endpoint` to an HTTPS endpoint that accepts a `POST` request with `FormData` and returns a successful `2xx` response. The existing form-validation module will post to that endpoint, show a success state only on success, and show an error state otherwise. The endpoint is responsible for validation, spam protection, and delivery; no server-side handler is included.

The form also includes a hidden `website` honeypot field and HTML validation attributes.

## Deployment

Run the build before deploying:

```bash
npm run build
npm run check
```

Deploy the repository root, including generated HTML files and `assets/data/`. Source folders such as `src/`, `components/`, and `scripts/` are only needed for local builds; keeping them in the deployment is harmless.

Configure the host to serve `404.html` for unknown paths (for example, an Apache `ErrorDocument` rule or the equivalent on your host). The local `scripts/serve.js` already does this.

Set the production domain in `assets/data/site-config.json`, use HTTPS, and confirm the canonical URLs, sitemap, and social image paths after deployment. Fonts are loaded from Google Fonts; self-host them if you need to avoid third-party requests or improve privacy and resilience.

## Accessibility and responsive behavior

The site includes a skip link, visible focus styles, keyboard-operable navigation and dropdowns, accessible mobile navigation with focus management, reduced-motion support, and a persistent light/dark theme.

The CSS breakpoints are defined in `assets/css/responsive.css`. Test interactive states and long content at mobile, tablet, and desktop widths after content changes.

`npm run check` catches structural and basic accessibility issues, but it is not a substitute for browser testing, Lighthouse, axe, or a manual keyboard and screen-reader pass.

## Demo content

Projects, testimonials, experience entries, education, and some skill levels are illustrative sample content. Replace them with verified information before publishing, and remove the demo badges and demo notes when the content is final.

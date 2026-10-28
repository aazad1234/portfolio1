'use strict';

const fs = require('fs');
const path = require('path');

const { ROOT, PAGES_DIR, loadData, getSiteUrl } = require('./lib/data');

const data = loadData();
const errors = [];
const warnings = [];
const siteUrl = getSiteUrl(data.site);

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function unique(values) {
  return Array.from(new Set(values));
}

function collect(html, regex) {
  return Array.from(html.matchAll(regex)).map((match) => match[1]);
}

const staticPages = fs
  .readdirSync(PAGES_DIR)
  .filter((fileName) => fileName.endsWith('.html') && !fileName.startsWith('_'))
  .sort();

const projectOutputs = data.projects.projects.map((project) => project.output);
const blogOutputs = data.blog.posts.map((post) => post.output);
const expectedPages = unique([...staticPages, ...projectOutputs, ...blogOutputs]);
const seoPages = Object.keys(data.seo);

expectedPages.forEach((page) => {
  if (!seoPages.includes(page)) fail(`Missing SEO entry for ${page}`);
  if (!exists(page)) fail(`Missing generated page ${page}. Run npm run build.`);
});

seoPages.forEach((page) => {
  if (!expectedPages.includes(page)) fail(`SEO entry has no corresponding page: ${page}`);
});

if (new Set(projectOutputs).size !== projectOutputs.length) fail('Project output filenames are not unique.');
if (new Set(blogOutputs).size !== blogOutputs.length) fail('Blog output filenames are not unique.');

Object.entries(data.seo).forEach(([page, entry]) => {
  if (!entry.contentKey) return;
  const lookup = entry.pageType === 'project' ? data.projectByKey : entry.pageType === 'article' ? data.postByKey : null;
  if (lookup && !lookup.has(entry.contentKey)) {
    fail(`${page}: SEO contentKey "${entry.contentKey}" does not match a ${entry.pageType} slug or output.`);
  }
});

const iconSprite = read(path.join(ROOT, 'components', 'icon-sprite.html'));
const iconIds = new Set(collect(iconSprite, /<symbol\b[^>]*\bid="([^"]+)"/g));

const requiredFiles = [
  'assets/css/style.css',
  'assets/css/components.css',
  'assets/css/animations.css',
  'assets/css/responsive.css',
  'assets/js/theme-init.js',
  'assets/js/seo-manager.js',
  'assets/js/main.js',
  'assets/js/navigation.js',
  'assets/js/animations.js',
  'assets/js/filters.js',
  'assets/js/theme.js',
  'assets/js/form-validation.js',
  'favicon.svg',
  'assets/images/favicon-32.png',
  'assets/images/apple-touch-icon.png',
  'assets/images/icon-192.png',
  'assets/images/icon-512.png',
  'assets/images/og-image.png',
  'assets/images/map.svg',
  'sitemap.xml',
  'robots.txt',
  'feed.xml',
  'site.webmanifest'
];

requiredFiles.forEach((file) => {
  if (!exists(file)) fail(`Missing required file: ${file}`);
});

const referencedImages = [
  ...data.projects.projects.map((project) => project.image),
  ...data.blog.posts.map((post) => post.image),
  ...data.testimonials.items.map((item) => item.image),
  data.site.owner.photo,
  'assets/images/og-image.png'
];

referencedImages.forEach((file) => {
  if (!exists(file)) fail(`Missing image referenced by content data: ${file}`);
});

const pageRecords = new Map();

expectedPages.forEach((page) => {
  const filePath = path.join(ROOT, page);
  if (!fs.existsSync(filePath)) return;

  const html = read(filePath);
  const entry = data.seo[page];
  const ids = unique(collect(html, /\sid="([^"]+)"/g));
  const idSet = new Set(ids);
  pageRecords.set(page, { html, ids: idSet });

  if (/\{\{[A-Z0-9_]+\}\}/.test(html)) fail(`${page}: unresolved template token`);
  if (/<!--\s*@[a-z]/i.test(html)) fail(`${page}: unresolved build marker`);
  if (!/<html\b[^>]*\blang="[^"]+"/i.test(html)) fail(`${page}: missing html lang attribute`);
  if (!/<meta\b[^>]*name="viewport"/i.test(html)) fail(`${page}: missing viewport meta`);
  if (html.includes('cdn.tailwindcss.com')) fail(`${page}: Tailwind CDN must not be used`);

  const titles = collect(html, /<title>([\s\S]*?)<\/title>/gi);
  if (titles.length !== 1 || !titles[0].trim()) fail(`${page}: missing or duplicate title`);

  const descriptions = collect(html, /<meta\b[^>]*name="description"[^>]*content="([^"]*)"/gi);
  if (descriptions.length !== 1 || !descriptions[0].trim()) {
    fail(`${page}: missing or duplicate meta description`);
  }

  const canonical = collect(html, /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/gi);
  if (canonical.length !== 1) fail(`${page}: missing or duplicate canonical link`);

  if (entry) {
    const expectedCanonical = new URL(entry.canonical || `/${page}`, `${siteUrl}/`).toString();
    if (canonical.length === 1 && canonical[0] !== expectedCanonical) {
      fail(`${page}: canonical is ${canonical[0]}, expected ${expectedCanonical}`);
    }

    if (entry.robots && entry.robots.includes('noindex')) {
      const robotsMeta = collect(html, /<meta\b[^>]*name="robots"[^>]*content="([^"]*)"/gi);
      if (!robotsMeta.some((value) => value.includes('noindex'))) {
        fail(`${page}: expected noindex robots meta`);
      }
    }

    if (entry.ogImage && !exists(entry.ogImage)) {
      fail(`${page}: missing Open Graph image ${entry.ogImage}`);
    }
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) fail(`${page}: expected 1 h1, found ${h1Count}`);
  if (!/<main\b[^>]*\bid="main"/i.test(html)) fail(`${page}: missing main landmark with id="main"`);
  if (!/<a\b[^>]*class="skip-link"[^>]*href="#main"/i.test(html)) fail(`${page}: missing skip link`);

  ['assets/css/style.css', 'assets/css/components.css', 'assets/css/animations.css', 'assets/css/responsive.css'].forEach(
    (css) => {
      if (!html.includes(`href="${css}"`)) fail(`${page}: missing stylesheet ${css}`);
    }
  );

  ['seo-manager.js', 'main.js', 'navigation.js', 'animations.js', 'filters.js', 'theme.js', 'form-validation.js'].forEach((js) => {
    if (!html.includes(`src="assets/js/${js}"`)) fail(`${page}: missing script ${js}`);
  });

  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) fail(`${page}: duplicate ids: ${unique(duplicateIds).join(', ')}`);

  ['aria-labelledby', 'aria-describedby', 'aria-controls'].forEach((attribute) => {
    collect(html, new RegExp(`${attribute}="([^"]+)"`, 'g')).forEach((value) => {
      value.split(/\s+/).filter(Boolean).forEach((id) => {
        if (!idSet.has(id)) fail(`${page}: ${attribute} references missing id "${id}"`);
      });
    });
  });

  collect(html, /<label\b[^>]*\bfor="([^"]+)"/g).forEach((id) => {
    if (!idSet.has(id)) fail(`${page}: label references missing id "${id}"`);
  });

  collect(html, /<use\b[^>]*\bhref="#([^"]+)"/g).forEach((iconId) => {
    if (!iconIds.has(iconId)) fail(`${page}: icon sprite is missing "${iconId}"`);
  });

  collect(html, /(<img\b[^>]*>)/gi).forEach((tag) => {
    if (!/\balt="/i.test(tag)) fail(`${page}: image missing alt attribute`);
    if (!/\bwidth="\d+"/i.test(tag) || !/\bheight="\d+"/i.test(tag)) {
      warn(`${page}: image missing width or height attributes`);
    }
  });

  collect(html, /(<a\b[^>]*target="_blank"[^>]*>)/gi).forEach((tag) => {
    if (!/\brel="[^"]*noopener/.test(tag)) fail(`${page}: target="_blank" link missing rel="noopener"`);
  });

  const ldJson = collect(html, /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  const noindexPage = entry && entry.robots && entry.robots.includes('noindex');
  if (ldJson.length !== 1 && !(noindexPage && ldJson.length === 0)) {
    fail(`${page}: expected exactly one JSON-LD block, found ${ldJson.length}`);
  }
  ldJson.forEach((block) => {
    try {
      JSON.parse(block);
    } catch (error) {
      fail(`${page}: invalid JSON-LD (${error.message})`);
    }
  });

  if (entry && !html.includes(`property="og:title"`)) fail(`${page}: missing Open Graph tags`);
  if (entry && !html.includes(`name="twitter:card"`)) fail(`${page}: missing Twitter card tags`);
});

pageRecords.forEach((record, page) => {
  const links = [
    ...collect(record.html, /<a\b[^>]*\bhref="([^"]+)"/g),
    ...collect(record.html, /<link\b[^>]*\bhref="([^"]+)"/g)
  ];
  const sources = [
    ...collect(record.html, /<img\b[^>]*\bsrc="([^"]+)"/g),
    ...collect(record.html, /<script\b[^>]*\bsrc="([^"]+)"/g)
  ];

  unique([...links, ...sources]).forEach((raw) => {
    const value = raw.trim();
    if (!value || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(value)) return;

    if (value.startsWith('#')) {
      const id = value.slice(1);
      if (id && !record.ids.has(id)) fail(`${page}: missing in-page anchor target "${value}"`);
      return;
    }

    const [pathPart, hashPart] = value.split('#');
    const cleanPath = pathPart.split('?')[0];
    if (!cleanPath) return;

    const targetPath = path.resolve(ROOT, cleanPath.replace(/^\/+/, ''));
    if (targetPath !== ROOT && !targetPath.startsWith(ROOT + path.sep)) {
      fail(`${page}: unsafe local path "${value}"`);
      return;
    }

    if (!fs.existsSync(targetPath)) {
      fail(`${page}: broken local path "${value}"`);
      return;
    }

    if (hashPart) {
      const targetRelative = path.relative(ROOT, targetPath).replace(/\\/g, '/');
      const targetRecord = pageRecords.get(targetRelative);
      if (targetRecord && !targetRecord.ids.has(hashPart)) {
        fail(`${page}: missing anchor target "#${hashPart}" in ${targetRelative}`);
      }
    }
  });
});

if (pageRecords.size !== expectedPages.length) {
  fail(`Only ${pageRecords.size} of ${expectedPages.length} generated pages were checked.`);
}

if (fs.existsSync(path.join(ROOT, '404.html'))) {
  const notFound = read(path.join(ROOT, '404.html'));
  const robotsMeta = collect(notFound, /<meta\b[^>]*name="robots"[^>]*content="([^"]*)"/gi);
  if (!robotsMeta.some((value) => value.includes('noindex'))) fail('404.html should be noindex');
}

if (fs.existsSync(path.join(ROOT, 'site.webmanifest'))) {
  try {
    const manifest = JSON.parse(read(path.join(ROOT, 'site.webmanifest')));
    (manifest.icons || []).forEach((icon) => {
      if (!exists(icon.src)) fail(`Manifest references missing icon ${icon.src}`);
    });
  } catch (error) {
    fail(`site.webmanifest is not valid JSON: ${error.message}`);
  }
}

if (fs.existsSync(path.join(ROOT, 'sitemap.xml'))) {
  const sitemap = read(path.join(ROOT, 'sitemap.xml'));
  const sitemapUrls = collect(sitemap, /<loc>([^<]+)<\/loc>/g);
  if (!sitemapUrls.length) fail('sitemap.xml contains no URLs');
  if (sitemapUrls.some((url) => /404\.html$/.test(url))) fail('sitemap.xml should not include 404.html');
}

if (fs.existsSync(path.join(ROOT, 'robots.txt'))) {
  const robots = read(path.join(ROOT, 'robots.txt'));
  if (!/Sitemap:\s*https?:\/\//i.test(robots)) fail('robots.txt missing absolute Sitemap line');
  if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt blocks the whole site');
}

if (fs.existsSync(path.join(ROOT, 'feed.xml'))) {
  const feed = read(path.join(ROOT, 'feed.xml'));
  data.blog.posts.forEach((post) => {
    if (!feed.includes(`/${post.output}`)) fail(`feed.xml missing article ${post.output}`);
  });
}

const navigationLinks = data.navigation.primary.flatMap((item) =>
  item.children ? item.children.map((child) => child.href) : [item.href]
);
navigationLinks.forEach((href) => {
  if (!exists(href)) fail(`Navigation links to missing page ${href}`);
});

if (data.site.contact.form.endpoint === '') {
  warn('Contact form endpoint is empty; the mailto fallback will be used.');
}

if (fs.existsSync(path.join(ROOT, 'index.html')) && !/data-page="home"/.test(read(path.join(ROOT, 'index.html')))) {
  fail('Root index.html is not the generated home page. Run npm run build.');
}

console.log('');
console.log(`Checked ${pageRecords.size} HTML pages, ${seoPages.length} SEO entries and local assets.`);

if (warnings.length) {
  console.log('');
  console.log(`${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`);
  warnings.forEach((message) => console.log(`  - ${message}`));
}

if (errors.length) {
  console.log('');
  console.log(`${errors.length} error${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((message) => console.log(`  - ${message}`));
  process.exitCode = 1;
} else {
  console.log('');
  console.log('All checks passed.');
}

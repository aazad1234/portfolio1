'use strict';

const { escapeHtml } = require('./html');
const { getSiteUrl } = require('./data');

function absoluteUrl(value, siteUrl) {
  if (!value) return `${siteUrl}/`;
  if (/^https?:\/\//i.test(value)) return value;
  if (value === '/') return `${siteUrl}/`;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function xmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderMeta(attribute, key, content) {
  if (content == null || content === '') return '';
  return `  <meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}">`;
}

function renderPageSchema(pageFile, entry, data, breadcrumbs) {
  if (entry.robots && entry.robots.includes('noindex')) return null;

  const siteUrl = getSiteUrl(data.site);
  const owner = data.site.owner;
  const canonical = absoluteUrl(entry.canonical, siteUrl);
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;
  const webpageId = `${canonical}#webpage`;
  const imageUrl = absoluteUrl(entry.ogImage, siteUrl);
  const graph = [];

  const pageTypeMap = {
    home: 'WebPage',
    about: 'AboutPage',
    services: 'WebPage',
    projects: 'CollectionPage',
    project: 'WebPage',
    skills: 'WebPage',
    experience: 'WebPage',
    testimonials: 'WebPage',
    blog: 'CollectionPage',
    article: 'WebPage',
    contact: 'ContactPage',
    resume: 'WebPage',
    notfound: 'WebPage'
  };

  graph.push({
    '@type': 'Person',
    '@id': personId,
    name: owner.name,
    url: `${siteUrl}/`,
    image: absoluteUrl(owner.photo, siteUrl),
    jobTitle: owner.role,
    description: owner.bioShort,
    email: `mailto:${owner.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: owner.location.city,
      addressRegion: owner.location.regionCode,
      addressCountry: owner.location.countryCode
    }
  });

  graph.push({
    '@type': 'WebSite',
    '@id': websiteId,
    url: `${siteUrl}/`,
    name: `${owner.name} — Portfolio`,
    description: data.site.site.description,
    inLanguage: data.site.site.language,
    publisher: { '@id': personId }
  });

  graph.push({
    '@type': pageTypeMap[entry.pageType] || 'WebPage',
    '@id': webpageId,
    url: canonical,
    name: entry.title,
    description: entry.description,
    isPartOf: { '@id': websiteId },
    about: { '@id': personId },
    inLanguage: data.site.site.language,
    keywords: Array.isArray(entry.keywords) ? entry.keywords.join(', ') : undefined,
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: entry.ogImageWidth || undefined,
      height: entry.ogImageHeight || undefined
    }
  });

  if (entry.pageType === 'projects') {
    graph.push({
      '@type': 'ItemList',
      '@id': `${canonical}#projects`,
      name: 'Selected projects',
      itemListElement: data.projects.projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: project.title,
        url: absoluteUrl(`/${project.output}`, siteUrl)
      }))
    });
  }

  if (entry.pageType === 'blog') {
    graph.push({
      '@type': 'ItemList',
      '@id': `${canonical}#articles`,
      name: 'Writing',
      itemListElement: data.blog.posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: post.title,
        url: absoluteUrl(`/${post.output}`, siteUrl)
      }))
    });
  }

  if (entry.pageType === 'project' && entry.contentKey) {
    const project = data.projectByKey.get(entry.contentKey);
    if (project) {
      graph.push({
        '@type': 'CreativeWork',
        '@id': `${canonical}#project`,
        name: project.title,
        description: project.description,
        image: absoluteUrl(project.image, siteUrl),
        url: canonical,
        creator: { '@id': personId },
        author: { '@id': personId },
        genre: project.category,
        keywords: project.stack.join(', '),
        inLanguage: data.site.site.language
      });
    }
  }

  if (entry.pageType === 'article' && entry.contentKey) {
    const post = data.postByKey.get(entry.contentKey);
    if (post) {
      graph.push({
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: post.title,
        description: post.excerpt,
        image: imageUrl,
        datePublished: post.date,
        dateModified: entry.articleModified || post.date,
        author: { '@id': personId },
        publisher: { '@id': personId },
        mainEntityOfPage: { '@id': webpageId },
        articleSection: post.category,
        keywords: post.tags.join(', '),
        inLanguage: data.site.site.language
      });
    }
  }

  if (Array.isArray(breadcrumbs) && breadcrumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: crumb.href ? absoluteUrl(`/${crumb.href.replace(/^\/+/, '')}`, siteUrl) : canonical
      }))
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}

function renderSeoHead(pageFile, data, breadcrumbs) {
  const entry = data.seo[pageFile];
  if (!entry) {
    throw new Error(`Missing SEO entry for ${pageFile} in assets/data/seo.json`);
  }

  const siteUrl = getSiteUrl(data.site);
  const owner = data.site.owner;
  const title = entry.title || data.site.site.title;
  const description = entry.description || data.site.site.description;
  const canonical = absoluteUrl(entry.canonical || `/${pageFile}`, siteUrl);
  const ogTitle = entry.ogTitle || title;
  const ogDescription = entry.ogDescription || description;
  const ogImage = absoluteUrl(entry.ogImage || 'assets/images/og-image.png', siteUrl);
  const ogImageAlt = entry.ogImageAlt || `${owner.name} portfolio`;
  const robots = entry.robots || 'index,follow';
  const keywords = Array.isArray(entry.keywords) ? entry.keywords.join(', ') : '';
  const theme = data.site.site.themeColor || { light: '#4F46E5', dark: '#0B0B10' };
  const lines = [];

  lines.push('<!-- SEO:START -->');
  lines.push(`  <title>${escapeHtml(title)}</title>`);
  lines.push(renderMeta('name', 'description', description));
  lines.push(renderMeta('name', 'keywords', keywords));
  lines.push(renderMeta('name', 'author', owner.name));
  lines.push(renderMeta('name', 'robots', robots));
  lines.push(renderMeta('name', 'application-name', `${owner.name} Portfolio`));
  lines.push(renderMeta('name', 'format-detection', 'telephone=no'));
  lines.push(renderMeta('name', 'color-scheme', 'light dark'));
  lines.push(renderMeta('name', 'theme-color', theme.light));
  lines.push(`  <meta name="theme-color" content="${escapeHtml(theme.dark)}" media="(prefers-color-scheme: dark)">`);
  lines.push(`  <link rel="canonical" href="${escapeHtml(canonical)}">`);
  lines.push('');
  lines.push(renderMeta('property', 'og:type', entry.ogType || 'website'));
  lines.push(renderMeta('property', 'og:site_name', owner.name));
  lines.push(renderMeta('property', 'og:locale', data.site.site.locale));
  lines.push(renderMeta('property', 'og:title', ogTitle));
  lines.push(renderMeta('property', 'og:description', ogDescription));
  lines.push(renderMeta('property', 'og:url', canonical));
  lines.push(renderMeta('property', 'og:image', ogImage));
  lines.push(renderMeta('property', 'og:image:alt', ogImageAlt));
  if (entry.ogImageWidth) lines.push(renderMeta('property', 'og:image:width', entry.ogImageWidth));
  if (entry.ogImageHeight) lines.push(renderMeta('property', 'og:image:height', entry.ogImageHeight));

  if (entry.pageType === 'article' && entry.contentKey) {
    const post = data.postByKey.get(entry.contentKey);
    if (post) {
      lines.push(renderMeta('property', 'article:published_time', entry.articlePublished || post.date));
      lines.push(renderMeta('property', 'article:modified_time', entry.articleModified || post.date));
      lines.push(renderMeta('property', 'article:author', `${siteUrl}/about.html`));
      lines.push(renderMeta('property', 'article:section', post.category));
      post.tags.forEach((tag) => {
        lines.push(renderMeta('property', 'article:tag', tag));
      });
    }
  }

  lines.push('');
  lines.push(renderMeta('name', 'twitter:card', entry.twitterCard || 'summary_large_image'));
  lines.push(renderMeta('name', 'twitter:title', ogTitle));
  lines.push(renderMeta('name', 'twitter:description', ogDescription));
  lines.push(renderMeta('name', 'twitter:image', ogImage));
  lines.push(renderMeta('name', 'twitter:image:alt', ogImageAlt));

  const schema = renderPageSchema(pageFile, entry, data, breadcrumbs);
  if (schema) {
    const json = JSON.stringify(schema, null, 2).replace(/</g, '\\u003c');
    lines.push('');
    lines.push('  <script type="application/ld+json" data-seo-schema>');
    lines.push(json.split('\n').map((line) => `  ${line}`).join('\n'));
    lines.push('  </script>');
  }

  lines.push('<!-- SEO:END -->');
  return lines.join('\n');
}

function renderSitemap(data) {
  const siteUrl = getSiteUrl(data.site);
  const urls = Object.entries(data.seo)
    .filter(([, entry]) => entry.sitemap !== false && !(entry.robots || '').includes('noindex'))
    .map(([pageFile, entry]) => {
      const loc = absoluteUrl(entry.canonical || `/${pageFile}`, siteUrl);
      const lastmod = entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : '';
      const priority = entry.sitemapPriority ? `\n    <priority>${xmlEscape(entry.sitemapPriority)}</priority>` : '';
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod}${priority}\n  </url>`;
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    ''
  ].join('\n');
}

function renderRobots(data) {
  const siteUrl = getSiteUrl(data.site);
  return [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n');
}

function toRfc822(value) {
  const date = new Date(`${value}T09:00:00Z`);
  return date.toUTCString();
}

function renderFeed(data) {
  const siteUrl = getSiteUrl(data.site);
  const posts = [...data.blog.posts].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const items = posts.map((post) => {
    const link = absoluteUrl(`/${post.output}`, siteUrl);
    return [
      '    <item>',
      `      <title>${xmlEscape(post.title)}</title>`,
      `      <link>${xmlEscape(link)}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
      `      <pubDate>${xmlEscape(toRfc822(post.date))}</pubDate>`,
      `      <category>${xmlEscape(post.category)}</category>`,
      `      <description>${xmlEscape(post.excerpt)}</description>`,
      '    </item>'
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${xmlEscape(`${data.site.owner.name} — Writing`)}</title>`,
    `    <link>${xmlEscape(`${siteUrl}/blog.html`)}</link>`,
    `    <description>${xmlEscape(data.site.site.description)}</description>`,
    `    <language>${xmlEscape(data.site.site.language)}</language>`,
    `    <lastBuildDate>${xmlEscape(toRfc822(posts[0] ? posts[0].date : '2026-01-01'))}</lastBuildDate>`,
    `    <atom:link href="${xmlEscape(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
}

function renderWebmanifest(data) {
  const manifest = {
    name: `${data.site.owner.name} — ${data.site.owner.role}`,
    short_name: data.site.owner.firstName,
    description: data.site.site.description,
    start_url: './index.html',
    scope: './',
    display: 'standalone',
    background_color: data.site.site.backgroundColor,
    theme_color: data.site.site.themeColor.light,
    icons: [
      {
        src: 'assets/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'assets/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

module.exports = {
  absoluteUrl,
  renderSeoHead,
  renderSitemap,
  renderRobots,
  renderFeed,
  renderWebmanifest,
  xmlEscape
};

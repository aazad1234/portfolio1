(function () {
  function getPageFile() {
    var path = window.location.pathname.replace(/\\/g, '/');
    var segment = path.split('/').filter(Boolean).pop();
    if (!segment || segment.indexOf('.') === -1) return 'index.html';
    return decodeURIComponent(segment);
  }

  function absoluteUrl(value, siteUrl) {
    if (!value) return siteUrl + '/';
    if (/^https?:\/\//i.test(value)) return value;
    var base = siteUrl.replace(/\/+$/, '') + '/';
    return new URL(value.replace(/^\/+/, ''), base).toString();
  }

  function setMeta(attribute, key, content) {
    if (content === undefined || content === null || content === '') return;
    var selector = 'meta[' + attribute + '="' + key.replace(/"/g, '\\"') + '"]';
    var meta = document.head.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, key);
      document.head.appendChild(meta);
    }
    if (meta.getAttribute('content') !== String(content)) {
      meta.setAttribute('content', content);
    }
  }

  function setCanonical(href) {
    var link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) {
      link.setAttribute('href', href);
    }
  }

  async function loadJson(url) {
    var response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Unable to load ' + url);
    return response.json();
  }

  async function init() {
    try {
      var pageFile = getPageFile();
      var results = await Promise.all([
        loadJson('assets/data/seo.json'),
        loadJson('assets/data/site-config.json')
      ]);
      var seo = results[0];
      var site = results[1];
      var entry = seo[pageFile];

      if (!entry || typeof entry !== 'object') return;

      var siteUrl = site.site.url.replace(/\/+$/, '');
      var canonical = absoluteUrl(entry.canonical || '/' + pageFile, siteUrl);
      var title = entry.title || site.site.title;
      var description = entry.description || site.site.description;
      var ogTitle = entry.ogTitle || title;
      var ogDescription = entry.ogDescription || description;
      var ogImage = absoluteUrl(entry.ogImage || 'assets/images/og-image.png', siteUrl);
      var ogImageAlt = entry.ogImageAlt || site.owner.name + ' portfolio';

      document.title = title;
      setMeta('name', 'description', description);
      setMeta('name', 'keywords', Array.isArray(entry.keywords) ? entry.keywords.join(', ') : '');
      setMeta('name', 'robots', entry.robots || 'index,follow');
      setCanonical(canonical);

      setMeta('property', 'og:type', entry.ogType || 'website');
      setMeta('property', 'og:site_name', site.owner.name);
      setMeta('property', 'og:locale', site.site.locale);
      setMeta('property', 'og:title', ogTitle);
      setMeta('property', 'og:description', ogDescription);
      setMeta('property', 'og:url', canonical);
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:alt', ogImageAlt);
      setMeta('property', 'og:image:width', entry.ogImageWidth);
      setMeta('property', 'og:image:height', entry.ogImageHeight);

      setMeta('name', 'twitter:card', entry.twitterCard || 'summary_large_image');
      setMeta('name', 'twitter:title', ogTitle);
      setMeta('name', 'twitter:description', ogDescription);
      setMeta('name', 'twitter:image', ogImage);
      setMeta('name', 'twitter:image:alt', ogImageAlt);

      if (entry.pageType === 'article') {
        setMeta('property', 'article:published_time', entry.articlePublished);
        setMeta('property', 'article:modified_time', entry.articleModified);
        setMeta('property', 'article:author', siteUrl + '/about.html');
        setMeta('property', 'article:section', entry.articleSection);

        if (!document.head.querySelector('meta[property="article:tag"]')) {
          (entry.keywords || []).forEach(function (tag) {
            var meta = document.createElement('meta');
            meta.setAttribute('property', 'article:tag');
            meta.setAttribute('content', tag);
            document.head.appendChild(meta);
          });
        }
      }

      document.documentElement.setAttribute('data-seo-runtime', 'true');
    } catch (error) {
      return;
    }
  }

  init();
})();

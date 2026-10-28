'use strict';

const fs = require('fs');
const path = require('path');

const {
  ROOT,
  COMPONENTS_DIR,
  PAGES_DIR,
  readText,
  writeText,
  loadData,
  getSiteUrl
} = require('./lib/data');
const { escapeHtml } = require('./lib/html');
const {
  renderPrimaryNav,
  renderBreadcrumbItems,
  renderFooterGroups,
  renderFooterLegal,
  renderSocialLinks,
  renderProjectCards,
  renderFeaturedProjects,
  renderProjectPager,
  renderProjectFeatures,
  renderProjectOutcomes,
  renderServices,
  renderCapabilities,
  renderSkillGroups,
  renderTechMarquee,
  renderToolbox,
  renderPrinciples,
  renderLearning,
  renderExperienceTimeline,
  renderEducation,
  renderApproach,
  renderNow,
  renderTestimonials,
  renderCollaboration,
  renderBlogListing,
  renderBlogPreview,
  renderBlogBody,
  renderBlogTags,
  renderArticleAuthor,
  renderRelatedPosts,
  renderPostPager,
  renderFaqs,
  renderProcess,
  renderEngagements,
  renderContactDetails,
  renderServiceOptions,
  renderDemoNote,
  renderResumeExperience,
  renderResumeSkills,
  tagList
} = require('./lib/render');
const {
  renderSeoHead,
  renderSitemap,
  renderRobots,
  renderFeed,
  renderWebmanifest
} = require('./lib/seo');

const data = loadData();
const BREADCRUMB_MARKER = /<!--\s*@breadcrumbs(?::([\s\S]*?))?\s*-->/;
const currentYear = new Date().getFullYear();

function fillTemplate(template, tokens) {
  return String(template).replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      const value = tokens[key];
      return value == null ? '' : String(value);
    }
    return match;
  });
}

function readComponent(fileName) {
  return readText(path.join(COMPONENTS_DIR, fileName));
}

function getBodyAttribute(html, name) {
  const body = html.match(/<body\b([^>]*)>/i);
  if (!body) return null;
  const pattern = new RegExp(`${name}="([^"]*)"`, 'i');
  const match = body[1].match(pattern);
  return match ? match[1] : null;
}

function parseBreadcrumbText(value) {
  if (!value) return [];
  return value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [label, href] = part.split('|').map((item) => item.trim());
      return { label, href: href || undefined };
    });
}

function extractBreadcrumbs(html, fallback) {
  if (Array.isArray(fallback)) return fallback;
  const match = html.match(BREADCRUMB_MARKER);
  return match ? parseBreadcrumbText(match[1]) : [];
}

function imageSize(image) {
  return /\.svg$/i.test(image) ? { width: 1200, height: 900 } : { width: 672, height: 512 };
}

function buildCommonTokens() {
  const site = data.site;
  const owner = site.owner;
  return {
    BRAND_NAME: escapeHtml(site.brand.name),
    BRAND_LOGO: escapeHtml(site.brand.logo),
    BRAND_SUFFIX: escapeHtml(site.brand.suffix),
    BRAND_ROLE: escapeHtml(site.brand.role),
    OWNER_NAME: escapeHtml(owner.name),
    OWNER_FIRST_NAME: escapeHtml(owner.firstName),
    OWNER_ROLE: escapeHtml(owner.role),
    OWNER_EMAIL: escapeHtml(owner.email),
    OWNER_PHONE: escapeHtml(owner.phone),
    OWNER_PHONE_HREF: escapeHtml(owner.phoneHref),
    OWNER_BIO_SHORT: escapeHtml(owner.bioShort),
    OWNER_BIO_1: escapeHtml(owner.bioLong[0] || owner.bioShort),
    OWNER_BIO_2: escapeHtml(owner.bioLong[1] || ''),
    OWNER_TAGLINE: escapeHtml(owner.tagline),
    OWNER_PHOTO: escapeHtml(owner.photo),
    OWNER_PHOTO_ALT: escapeHtml(owner.photoAlt),
    LOCATION_DISPLAY: escapeHtml(owner.location.display),
    LOCATION_CITY: escapeHtml(owner.location.city),
    LOCATION_REGION: escapeHtml(owner.location.region),
    LOCATION_TIMEZONE: escapeHtml(owner.location.timezone),
    AVAILABILITY: escapeHtml(owner.availability),
    AVAILABILITY_NOTE: escapeHtml(owner.availabilityNote),
    RESPONSE_TIME: escapeHtml(site.contact.responseTime),
    FORM_ENDPOINT: escapeHtml(site.contact.form.endpoint),
    FORM_MAILTO: escapeHtml(site.contact.form.mailto),
    FORM_SUBJECT_PREFIX: escapeHtml(site.contact.form.subjectPrefix),
    FORM_ACTION: escapeHtml(`mailto:${site.contact.form.mailto}`),
    MAP_URL: escapeHtml(site.contact.map.url),
    MAP_LABEL: escapeHtml(site.contact.map.label),
    RESUME_URL: escapeHtml(owner.resume),
    SITE_URL: escapeHtml(getSiteUrl(site)),
    SITE_TITLE: escapeHtml(site.site.title),
    SITE_DESCRIPTION: escapeHtml(site.site.description),
    SERVICES_INTRO: escapeHtml(data.services.intro),
    BLOG_INTRO: escapeHtml(data.blog.intro),
    PROJECTS_INTRO: escapeHtml(data.projects.intro),
    FOOTER_BLURB: escapeHtml(site.footer.blurb),
    FOOTER_CREDIT: escapeHtml(site.footer.credit),
    DEMO_NOTE: escapeHtml(site.footer.demoNote),
    YEAR: String(currentYear),
    SERVICE_OPTIONS: renderServiceOptions(data.services.services),
    SOCIAL_LINKS: renderSocialLinks(site.social),
    CONTACT_DETAILS: renderContactDetails(site)
  };
}

function buildProjectTokens(project, index) {
  const size = imageSize(project.image);
  const projects = data.projects.projects;
  return {
    PROJECT_TITLE: escapeHtml(project.title),
    PROJECT_CARD_TITLE: escapeHtml(project.cardTitle),
    PROJECT_CATEGORY: escapeHtml(project.category),
    PROJECT_YEAR: escapeHtml(project.year),
    PROJECT_SUMMARY: escapeHtml(project.summary),
    PROJECT_DESCRIPTION: escapeHtml(project.description),
    PROJECT_ROLE: escapeHtml(project.role),
    PROJECT_TIMELINE: escapeHtml(project.timeline),
    PROJECT_TEAM: escapeHtml(project.team),
    PROJECT_STATUS: escapeHtml(project.status),
    PROJECT_IMAGE: escapeHtml(project.image),
    PROJECT_IMAGE_ALT: escapeHtml(project.imageAlt),
    PROJECT_IMAGE_WIDTH: size.width,
    PROJECT_IMAGE_HEIGHT: size.height,
    PROJECT_STACK_TAGS: tagList(project.stack, 'project-stack-tags'),
    PROJECT_CHALLENGE: escapeHtml(project.challenge),
    PROJECT_SOLUTION: escapeHtml(project.solution),
    PROJECT_REFLECTION: escapeHtml(project.reflection),
    PROJECT_FEATURES: renderProjectFeatures(project),
    PROJECT_OUTCOMES: renderProjectOutcomes(project),
    PROJECT_PAGER: renderProjectPager(projects, index),
    PROJECT_DEMO_NOTE: renderDemoNote(project.demoNote, 'project-demo-note'),
    PROJECT_DEMO_BADGE: project.demo ? '<span class="badge badge-demo">Demo</span>' : '',
    PROJECT_INDEX: String(index + 1).padStart(2, '0'),
    PROJECT_OUTPUT: escapeHtml(project.output)
  };
}

function buildBlogTokens(post, index) {
  return {
    BLOG_TITLE: escapeHtml(post.title),
    BLOG_EXCERPT: escapeHtml(post.excerpt),
    BLOG_CATEGORY: escapeHtml(post.category),
    BLOG_DATE_ISO: escapeHtml(post.date),
    BLOG_DATE_DISPLAY: escapeHtml(post.dateDisplay),
    BLOG_READ_TIME: escapeHtml(post.readTime),
    BLOG_AUTHOR: escapeHtml(post.author),
    BLOG_IMAGE: escapeHtml(post.image),
    BLOG_IMAGE_ALT: escapeHtml(post.imageAlt),
    BLOG_CONTENT: renderBlogBody(post),
    BLOG_TAGS: renderBlogTags(post.tags),
    BLOG_RELATED: renderRelatedPosts(data.blog.posts, post.slug, 2),
    BLOG_PAGER: renderPostPager(data.blog.posts, index),
    BLOG_OUTPUT: escapeHtml(post.output),
    BLOG_INDEX: String(index + 1).padStart(2, '0')
  };
}

function buildHeader(activeId, tokens) {
  const navigationTemplate = readComponent('navigation.html');
  const navigationMarkup = fillTemplate(navigationTemplate, {
    NAV_ITEMS: renderPrimaryNav(data.navigation, activeId),
    CTA_HREF: escapeHtml(data.navigation.cta.href),
    CTA_LABEL: escapeHtml(data.navigation.cta.label),
    AVAILABILITY: tokens.AVAILABILITY
  });

  let header = fillTemplate(readComponent('header.html'), {
    ...tokens,
    CTA_HREF: escapeHtml(data.navigation.cta.href),
    CTA_LABEL: escapeHtml(data.navigation.cta.label)
  });

  header = header.replace('<!-- @navigation -->', navigationMarkup);
  return header;
}

function buildFooter(tokens) {
  return fillTemplate(readComponent('footer.html'), {
    ...tokens,
    SOCIAL_LINKS: renderSocialLinks(data.site.social),
    FOOTER_GROUPS: renderFooterGroups(data.navigation.footerGroups),
    LEGAL_LINKS: renderFooterLegal(data.navigation.footerLegal)
  });
}

function buildBreadcrumbs(breadcrumbs) {
  if (!Array.isArray(breadcrumbs) || !breadcrumbs.length) return '';
  return fillTemplate(readComponent('breadcrumbs.html'), {
    BREADCRUMB_ITEMS: renderBreadcrumbItems(breadcrumbs)
  });
}

function getRenderers() {
  return {
    'featured-projects': () => renderFeaturedProjects(data.projects.projects, 3),
    'projects-grid': () => renderProjectCards(data.projects.projects),
    'projects-demo-note': () => renderDemoNote(data.projects.intro),
    'services-preview': () => renderServices(data.services.services, { limit: 3, compact: true }),
    'services-grid': () => renderServices(data.services.services),
    'capabilities': () => renderCapabilities(data.skills.capabilities),
    'skills-groups': () => renderSkillGroups(data.skills.groups),
    'skills-demo-note': () => renderDemoNote(data.skills.disclaimer),
    'tech-marquee': () => renderTechMarquee(data.skills.tools),
    toolbox: () => renderToolbox(data.skills.tools),
    principles: () => renderPrinciples(data.skills.principles),
    learning: () => renderLearning(data.skills.learning),
    'experience-timeline': () => renderExperienceTimeline(data.experience.experience),
    'experience-preview': () => renderExperienceTimeline(data.experience.experience, { limit: 2, compact: true }),
    'experience-demo-note': () => renderDemoNote(data.experience.disclaimer),
    education: () => renderEducation(data.experience.education),
    approach: () => renderApproach(data.experience.approach),
    now: () => renderNow(data.experience.now),
    'testimonials-preview': () => renderTestimonials(data.testimonials.items, { limit: 2 }),
    'testimonials-grid': () => renderTestimonials(data.testimonials.items),
    'testimonials-demo-note': () => renderDemoNote(data.testimonials.disclaimer),
    collaboration: () => renderCollaboration(data.testimonials.collaboration),
    'blog-preview': () => renderBlogPreview(data.blog.posts, 3),
    'blog-listing': () => renderBlogListing(data.blog.posts),
    'author-card': () => renderArticleAuthor(data.site),
    process: () => renderProcess(data.services.process),
    engagements: () => renderEngagements(data.services.engagements),
    faqs: () => renderFaqs(data.services.faqs),
    'contact-details': () => renderContactDetails(data.site),
    'resume-experience': () => renderResumeExperience(data.experience.experience),
    'resume-skills': () => renderResumeSkills(data.skills.groups),
    'resume-education': () => renderEducation(data.experience.education),
    'service-options': () => renderServiceOptions(data.services.services)
  };
}

const renderers = getRenderers();

function processPage(page) {
  let html = page.source;
  const activeId = page.active || getBodyAttribute(html, 'data-page') || 'home';
  const breadcrumbs = extractBreadcrumbs(html, page.breadcrumbs);
  const tokens = { ...buildCommonTokens(), ...(page.tokens || {}) };
  const header = buildHeader(activeId, tokens);
  const footer = buildFooter(tokens);
  const preloader = fillTemplate(readComponent('preloader.html'), tokens);
  const breadcrumbMarkup = buildBreadcrumbs(breadcrumbs);
  const seoHead = renderSeoHead(page.output, data, breadcrumbs);

  const replacements = [
    ['<!-- @seo -->', seoHead],
    ['<!-- @head-assets -->', readComponent('head-assets.html')],
    ['<!-- @preloader -->', preloader],
    ['<!-- @header -->', header],
    ['<!-- @footer -->', footer],
    ['<!-- @scroll-top -->', readComponent('scroll-to-top.html')],
    ['<!-- @scripts -->', readComponent('scripts.html')]
  ];

  replacements.forEach(([marker, value]) => {
    html = html.split(marker).join(value);
  });

  html = html.replace(BREADCRUMB_MARKER, breadcrumbMarkup);
  html = html.replace(/<!--\s*@render:([a-z0-9-]+)\s*-->/g, (match, name) => {
    if (!renderers[name]) {
      throw new Error(`Unknown renderer "${name}" in ${page.output}`);
    }
    return renderers[name]();
  });

  html = html.replace(/(<body\b[^>]*>)/i, (bodyTag) => `${bodyTag}\n${readComponent('icon-sprite.html')}`);
  html = fillTemplate(html, tokens);

  const unresolvedToken = html.match(/\{\{[A-Z0-9_]+\}\}/);
  if (unresolvedToken) {
    throw new Error(`Unresolved token ${unresolvedToken[0]} in ${page.output}`);
  }

  const unresolvedMarker = html.match(/<!--\s*@[a-z]/i);
  if (unresolvedMarker) {
    throw new Error(`Unresolved component marker in ${page.output}`);
  }

  return html;
}

function collectStaticPages() {
  return fs
    .readdirSync(PAGES_DIR)
    .filter((fileName) => fileName.endsWith('.html') && !fileName.startsWith('_'))
    .sort()
    .map((fileName) => ({
      output: fileName,
      source: readText(path.join(PAGES_DIR, fileName)),
      active: getBodyAttribute(readText(path.join(PAGES_DIR, fileName)), 'data-page')
    }));
}

function collectDetailPages() {
  const pages = [];
  const projectTemplate = readText(path.join(PAGES_DIR, '_project.html'));
  data.projects.projects.forEach((project, index) => {
    pages.push({
      output: project.output,
      source: fillTemplate(projectTemplate, buildProjectTokens(project, index)),
      active: 'projects',
      breadcrumbs: [
        { label: 'Home', href: 'index.html' },
        { label: 'Projects', href: 'projects.html' },
        { label: project.cardTitle }
      ]
    });
  });

  const blogTemplate = readText(path.join(PAGES_DIR, '_blog-post.html'));
  data.blog.posts.forEach((post, index) => {
    pages.push({
      output: post.output,
      source: fillTemplate(blogTemplate, buildBlogTokens(post, index)),
      active: 'blog',
      breadcrumbs: [
        { label: 'Home', href: 'index.html' },
        { label: 'Blog', href: 'blog.html' },
        { label: post.title }
      ]
    });
  });

  return pages;
}

function build() {
  const staticPages = collectStaticPages();
  const detailPages = collectDetailPages();
  const pages = [...staticPages, ...detailPages];
  const seen = new Set();

  pages.forEach((page) => {
    if (seen.has(page.output)) {
      throw new Error(`Duplicate output page: ${page.output}`);
    }
    seen.add(page.output);
  });

  pages.forEach((page) => {
    const html = processPage(page);
    writeText(path.join(ROOT, page.output), html);
    console.log(`  built ${page.output}`);
  });

  writeText(path.join(ROOT, 'sitemap.xml'), renderSitemap(data));
  writeText(path.join(ROOT, 'robots.txt'), renderRobots(data));
  writeText(path.join(ROOT, 'feed.xml'), renderFeed(data));
  writeText(path.join(ROOT, 'site.webmanifest'), renderWebmanifest(data));

  console.log('');
  console.log(`Built ${pages.length} HTML pages.`);
  console.log('Generated sitemap.xml, robots.txt, feed.xml and site.webmanifest.');
}

build();

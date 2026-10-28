'use strict';

const { escapeHtml, inline, icon, slugify } = require('./html');

function tagList(tags, className) {
  const items = (tags || []).map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join('');
  return `<ul class="tag-list${className ? ` ${className}` : ''}">${items}</ul>`;
}

function isNavItemActive(item, activeId) {
  if (item.id === activeId) return true;
  if (Array.isArray(item.children)) {
    return item.children.some((child) => child.id === activeId);
  }
  return false;
}

function renderPrimaryNav(navigation, activeId) {
  return navigation.primary
    .map((item) => {
      const active = isNavItemActive(item, activeId);

      if (item.children) {
        const activeClass = active ? ' is-active' : '';
        const children = item.children
          .map((child) => {
            const childActive = child.id === activeId;
            return `
              <li>
                <a class="nav-dropdown-link${childActive ? ' is-active' : ''}" href="${escapeHtml(child.href)}"${childActive ? ' aria-current="page"' : ''}>
                  <span class="nav-dropdown-icon">${icon(child.icon || 'chevron-right')}</span>
                  <span class="nav-dropdown-copy">
                    <strong>${escapeHtml(child.label)}</strong>
                    <small>${escapeHtml(child.description || '')}</small>
                  </span>
                  ${icon('arrow-up-right', 'nav-dropdown-arrow')}
                </a>
              </li>`;
          })
          .join('');
        return `
          <li class="nav-item nav-item-dropdown${activeClass}">
            <button class="nav-link nav-dropdown-toggle" type="button" aria-expanded="false" aria-controls="nav-dropdown-${escapeHtml(item.id)}" data-dropdown-toggle>
              <span>${escapeHtml(item.label)}</span>
              ${icon('chevron-down', 'nav-chevron')}
            </button>
            <div class="nav-dropdown" id="nav-dropdown-${escapeHtml(item.id)}" data-dropdown>
              <div class="nav-dropdown-panel">
                <p class="nav-dropdown-eyebrow">${escapeHtml(item.label)}</p>
                <ul class="nav-dropdown-list">${children}</ul>
              </div>
            </div>
          </li>`;
      }

      return `
        <li class="nav-item${active ? ' is-active' : ''}">
          <a class="nav-link" href="${escapeHtml(item.href)}"${active ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>
        </li>`;
    })
    .join('');
}

function renderBreadcrumbItems(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return items
    .map((item, index) => {
      const last = index === items.length - 1;
      const label = escapeHtml(item.label);
      if (last || !item.href) {
        return `<li><span aria-current="page">${label}</span></li>`;
      }
      return `<li><a href="${escapeHtml(item.href)}">${label}</a></li>`;
    })
    .join('');
}

function renderBreadcrumbs(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>${renderBreadcrumbItems(items)}</ol>
    </nav>`;
}

function renderFooterGroups(groups) {
  return groups
    .map(
      (group) => `
        <div class="footer-group">
          <h2 class="footer-heading">${escapeHtml(group.title)}</h2>
          <ul class="footer-list">
            ${group.links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join('')}
          </ul>
        </div>`
    )
    .join('');
}

function renderFooterLegal(links) {
  return links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('');
}

function renderSocialLinks(social, className) {
  return (social || [])
    .map(
      (profile) => `
        <li>
          <a class="social-link${className ? ` ${className}` : ''}" href="${escapeHtml(profile.url)}" aria-label="${escapeHtml(profile.label)}" title="${escapeHtml(profile.label)}" target="_blank" rel="noopener noreferrer">
            ${icon(profile.icon || 'link')}
          </a>
        </li>`
    )
    .join('');
}

function projectImageSize(image) {
  return /\.svg$/i.test(image) ? { width: 1200, height: 900 } : { width: 672, height: 512 };
}

function renderProjectCard(project, index) {
  const size = projectImageSize(project.image);
  const demoBadge = project.demo ? '<span class="badge badge-demo">Demo</span>' : '';
  return `
    <article class="project-card reveal" data-project-card data-category="${escapeHtml(project.filter)}">
      <a class="project-card-link" href="${escapeHtml(project.output)}">
        <div class="project-card-media">
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="${size.width}" height="${size.height}" loading="lazy" decoding="async">
          <span class="project-card-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="project-card-open">${icon('arrow-up-right')}</span>
        </div>
        <div class="project-card-body">
          <div class="project-card-kicker">
            <span class="project-card-category">${escapeHtml(project.category)}</span>
            <span class="project-card-year">${escapeHtml(project.year)}</span>
            ${demoBadge}
          </div>
          <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
          <p class="project-card-summary">${escapeHtml(project.summary)}</p>
          ${tagList(project.stack.slice(0, 4), 'project-card-tags')}
          <span class="project-card-cta">View case study ${icon('arrow-right')}</span>
        </div>
      </a>
    </article>`;
}

function renderProjectCards(projects, options) {
  const opts = options || {};
  const list = opts.limit ? projects.slice(0, opts.limit) : projects;
  const gridClass = opts.className || 'project-grid';
  return `<div class="${gridClass}">${list.map((project, index) => renderProjectCard(project, index)).join('')}</div>`;
}

function renderFeaturedProjects(projects, limit) {
  const featured = projects.filter((project) => project.featured);
  return renderProjectCards(featured, { limit: limit || featured.length, className: 'project-grid project-grid-featured' });
}

function renderProjectPager(projects, index) {
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  return `
    <nav class="project-pager" aria-label="Project navigation">
      <a class="project-pager-link project-pager-prev" href="${escapeHtml(previous.output)}">
        <span class="project-pager-label">${icon('arrow-left')} Previous project</span>
        <strong>${escapeHtml(previous.cardTitle)}</strong>
      </a>
      <a class="project-pager-link project-pager-next" href="${escapeHtml(next.output)}">
        <span class="project-pager-label">Next project ${icon('arrow-right')}</span>
        <strong>${escapeHtml(next.cardTitle)}</strong>
      </a>
    </nav>`;
}

function renderProjectFeatures(project) {
  return project.features
    .map(
      (feature, index) => `
        <article class="feature-card">
          <span class="feature-number">${String(index + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(feature.title)}</h3>
          <p>${escapeHtml(feature.description)}</p>
        </article>`
    )
    .join('');
}

function renderProjectOutcomes(project) {
  return project.outcomes.map((outcome) => `<li>${icon('check')}<span>${escapeHtml(outcome)}</span></li>`).join('');
}

function renderServices(services, options) {
  const opts = options || {};
  const list = opts.limit ? services.slice(0, opts.limit) : services;
  return `
    <div class="service-grid${opts.compact ? ' service-grid-compact' : ''}">
      ${list
        .map(
          (service, index) => `
            <article class="service-card reveal">
              <div class="service-card-top">
                <span class="service-icon">${icon(service.icon)}</span>
                <span class="service-number">${String(index + 1).padStart(2, '0')}</span>
              </div>
              <p class="service-tagline">${escapeHtml(service.tagline)}</p>
              <h3 class="service-title">${escapeHtml(service.title)}</h3>
              <p class="service-description">${escapeHtml(service.description)}</p>
              ${
                opts.compact
                  ? ''
                  : `<ul class="check-list service-deliverables">${service.deliverables
                      .map((item) => `<li>${icon('check')}<span>${escapeHtml(item)}</span></li>`)
                      .join('')}</ul>`
              }
              <div class="service-card-footer">
                <span class="badge badge-soft">${escapeHtml(service.engagement)}</span>
                <a class="text-link" href="contact.html">Discuss a project ${icon('arrow-right')}</a>
              </div>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderCapabilities(capabilities) {
  return `
    <div class="capability-grid">
      ${capabilities
        .map(
          (capability) => `
            <article class="capability-card reveal">
              <span class="capability-icon">${icon(capability.icon)}</span>
              <h3>${escapeHtml(capability.title)}</h3>
              <p>${escapeHtml(capability.description)}</p>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderSkillGroups(groups) {
  return `
    <div class="skill-grid">
      ${groups
        .map(
          (group) => `
            <article class="skill-group reveal">
              <div class="skill-group-head">
                <span class="skill-group-icon">${icon(group.icon)}</span>
                <div>
                  <h2 class="skill-group-title">${escapeHtml(group.title)}</h2>
                  <p>${escapeHtml(group.description)}</p>
                </div>
              </div>
              <ul class="skill-list">
                ${group.skills
                  .map(
                    (skill) => `
                      <li class="skill-item">
                        <div class="skill-meta">
                          <span>${escapeHtml(skill.name)}</span>
                          <span>${escapeHtml(skill.level)}%</span>
                        </div>
                        <progress class="skill-meter" value="${escapeHtml(skill.level)}" max="100" aria-label="${escapeHtml(skill.name)} — self-assessed proficiency">${escapeHtml(skill.level)}%</progress>
                      </li>`
                  )
                  .join('')}
              </ul>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderTechMarquee(tools) {
  const items = tools
    .map(
      (tool) => `<li><span class="tech-dot" aria-hidden="true"></span>${escapeHtml(tool.name)}</li>`
    )
    .join('');
  return `
    <div class="tech-marquee">
      <div class="tech-marquee-track">
        <ul class="tech-list">${items}</ul>
        <ul class="tech-list" aria-hidden="true">${items}</ul>
      </div>
    </div>`;
}

function renderToolbox(tools) {
  return `
    <ul class="toolbox-grid" aria-label="Tools and technologies">
      ${tools
        .map(
          (tool) => `
            <li class="tool-chip reveal">
              <span class="tool-chip-icon">${icon(tool.icon || 'code')}</span>
              <span>${escapeHtml(tool.name)}</span>
            </li>`
        )
        .join('')}
    </ul>`;
}

function renderPrinciples(principles) {
  return `
    <div class="principle-grid">
      ${principles
        .map(
          (principle, index) => `
            <article class="principle-card reveal">
              <span class="principle-number">${String(index + 1).padStart(2, '0')}</span>
              <h3>${escapeHtml(principle.title)}</h3>
              <p>${escapeHtml(principle.description)}</p>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderLearning(items) {
  return `
    <ul class="learning-list">
      ${items.map((item) => `<li>${icon('sparkles')}<span>${escapeHtml(item)}</span></li>`).join('')}
    </ul>`;
}

function renderExperienceTimeline(entries, options) {
  const opts = options || {};
  const list = opts.limit ? entries.slice(0, opts.limit) : entries;
  return `
    <ol class="timeline">
      ${list
        .map(
          (entry, index) => `
            <li class="timeline-item reveal">
              <div class="timeline-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
              <div class="timeline-card">
                <div class="timeline-head">
                  <div>
                    <p class="timeline-period">${escapeHtml(entry.period)}</p>
                    <h2 class="timeline-role">${escapeHtml(entry.role)}</h2>
                    <p class="timeline-company">${escapeHtml(entry.company)} · ${escapeHtml(entry.location)}</p>
                  </div>
                  ${entry.current ? '<span class="badge badge-current">Current</span>' : ''}
                </div>
                <p class="timeline-summary">${escapeHtml(entry.summary)}</p>
                ${
                  opts.compact
                    ? ''
                    : `<ul class="timeline-list">${entry.highlights
                        .map((highlight) => `<li>${icon('arrow-right')}<span>${escapeHtml(highlight)}</span></li>`)
                        .join('')}</ul>`
                }
                ${tagList(entry.stack, 'timeline-stack')}
              </div>
            </li>`
        )
        .join('')}
    </ol>`;
}

function renderEducation(entries) {
  return `
    <div class="education-grid">
      ${entries
        .map(
          (entry) => `
            <article class="education-card reveal">
              <span class="education-icon">${icon('file-text')}</span>
              <div>
                <p class="education-period">${escapeHtml(entry.period)}</p>
                <h2>${escapeHtml(entry.qualification)}</h2>
                <p class="education-institution">${escapeHtml(entry.institution)} · ${escapeHtml(entry.location)}</p>
                <p class="education-note">${escapeHtml(entry.note)}</p>
              </div>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderApproach(items) {
  return `
    <div class="approach-grid">
      ${items
        .map(
          (item, index) => `
            <article class="approach-item reveal">
              <span class="approach-number">${String(index + 1).padStart(2, '0')}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderNow(now) {
  return `
    <div class="now-card reveal">
      <p class="now-eyebrow">${icon('sparkles')} ${escapeHtml(now.title)}</p>
      <ul class="check-list">
        ${now.items.map((item) => `<li>${icon('arrow-right')}<span>${escapeHtml(item)}</span></li>`).join('')}
      </ul>
    </div>`;
}

function renderTestimonials(items, options) {
  const opts = options || {};
  const list = opts.limit ? items.slice(0, opts.limit) : items;
  return `
    <div class="testimonial-grid">
      ${list
        .map(
          (item) => `
            <article class="testimonial-card reveal">
              <div class="testimonial-top">
                ${icon('quote', 'testimonial-quote-icon')}
                <span class="badge badge-demo">Sample</span>
              </div>
              <blockquote class="testimonial-quote">
                <p>“${escapeHtml(item.quote)}”</p>
              </blockquote>
              <div class="testimonial-author">
                <img class="testimonial-avatar" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}" width="512" height="512" loading="lazy" decoding="async">
                <div>
                  <p class="testimonial-name">${escapeHtml(item.name)}</p>
                  <p class="testimonial-role">${escapeHtml(item.role)}, ${escapeHtml(item.company)}</p>
                </div>
              </div>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderCollaboration(items) {
  return `
    <div class="collaboration-grid">
      ${items
        .map(
          (item) => `
            <article class="collaboration-card reveal">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </article>`
        )
        .join('')}
    </div>`;
}

function blogMeta(post) {
  return `
    <div class="blog-card-meta">
      <span class="blog-card-category">${escapeHtml(post.category)}</span>
      <span>${icon('calendar')} <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.dateDisplay)}</time></span>
      <span>${icon('clock')} ${escapeHtml(post.readTime)}</span>
    </div>`;
}

function renderBlogCard(post, options) {
  const opts = options || {};
  const sizeClass = opts.featured ? ' blog-card-featured' : '';
  return `
    <article class="blog-card${sizeClass} reveal" data-blog-card data-category="${escapeHtml(post.filter)}">
      <a class="blog-card-link" href="${escapeHtml(post.output)}">
        <div class="blog-card-media">
          <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}" width="1200" height="630" loading="lazy" decoding="async">
        </div>
        <div class="blog-card-body">
          ${blogMeta(post)}
          <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
          <p class="blog-card-excerpt">${escapeHtml(post.excerpt)}</p>
          <span class="text-link">Read article ${icon('arrow-right')}</span>
        </div>
      </a>
    </article>`;
}

function renderBlogListing(posts) {
  const featured = posts.find((post) => post.featured) || posts[0];
  const rest = posts.filter((post) => post.slug !== featured.slug);
  return `
    <div class="blog-listing">
      ${featured ? renderBlogCard(featured, { featured: true }) : ''}
      <div class="blog-grid">
        ${rest.map((post) => renderBlogCard(post)).join('')}
      </div>
    </div>`;
}

function renderBlogPreview(posts, limit) {
  return `<div class="blog-grid blog-grid-preview">${posts.slice(0, limit || 3).map((post) => renderBlogCard(post)).join('')}</div>`;
}

function renderBlogBody(post) {
  return post.content
    .map((block) => {
      switch (block.type) {
        case 'lead':
          return `<p class="article-lead">${inline(block.text)}</p>`;
        case 'heading':
          return `<h2 id="${slugify(block.text)}">${escapeHtml(block.text)}</h2>`;
        case 'paragraph':
          return `<p>${inline(block.text)}</p>`;
        case 'list': {
          const tag = block.ordered ? 'ol' : 'ul';
          return `<${tag} class="article-list">${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${tag}>`;
        }
        case 'quote':
          return `<blockquote class="article-quote"><p>${inline(block.text)}</p>${block.cite ? `<cite>${escapeHtml(block.cite)}</cite>` : ''}</blockquote>`;
        case 'code':
          return `<pre class="code-block" tabindex="0"><code class="language-${escapeHtml(block.language || 'text')}">${escapeHtml(block.code)}</code></pre>`;
        case 'callout':
          return `<aside class="article-callout"><p class="article-callout-title">${icon('info')} ${escapeHtml(block.title)}</p><p>${inline(block.text)}</p></aside>`;
        default:
          return '';
      }
    })
    .join('\n');
}

function renderBlogTags(tags) {
  return tagList(tags, 'article-tags');
}

function renderArticleAuthor(site) {
  return `
    <aside class="author-card reveal">
      <img src="${escapeHtml(site.owner.photo)}" alt="${escapeHtml(site.owner.photoAlt)}" width="512" height="512" loading="lazy" decoding="async">
      <div>
        <p class="author-eyebrow">Written by</p>
        <h2>${escapeHtml(site.owner.name)}</h2>
        <p>${escapeHtml(site.owner.bioShort)}</p>
        <a class="text-link" href="about.html">More about me ${icon('arrow-right')}</a>
      </div>
    </aside>`;
}

function renderRelatedPosts(posts, currentSlug, limit) {
  const related = posts.filter((post) => post.slug !== currentSlug).slice(0, limit || 2);
  return `<div class="blog-grid">${related.map((post) => renderBlogCard(post)).join('')}</div>`;
}

function renderPostPager(posts, index) {
  const previous = posts[(index - 1 + posts.length) % posts.length];
  const next = posts[(index + 1) % posts.length];
  return `
    <nav class="project-pager post-pager" aria-label="Article navigation">
      <a class="project-pager-link project-pager-prev" href="${escapeHtml(previous.output)}">
        <span class="project-pager-label">${icon('arrow-left')} Previous article</span>
        <strong>${escapeHtml(previous.title)}</strong>
      </a>
      <a class="project-pager-link project-pager-next" href="${escapeHtml(next.output)}">
        <span class="project-pager-label">Next article ${icon('arrow-right')}</span>
        <strong>${escapeHtml(next.title)}</strong>
      </a>
    </nav>`;
}

function renderFaqs(faqs) {
  return `
    <div class="faq-list">
      ${faqs
        .map(
          (faq) => `
            <details class="faq-item">
              <summary>
                <span>${escapeHtml(faq.question)}</span>
                ${icon('chevron-down', 'faq-chevron')}
              </summary>
              <div class="faq-answer"><p>${escapeHtml(faq.answer)}</p></div>
            </details>`
        )
        .join('')}
    </div>`;
}

function renderProcess(steps) {
  return `
    <ol class="process-grid">
      ${steps
        .map(
          (step) => `
            <li class="process-step reveal">
              <span class="process-number">${escapeHtml(step.number)}</span>
              <h3 class="process-title">${escapeHtml(step.title)}</h3>
              <p class="process-description">${escapeHtml(step.description)}</p>
            </li>`
        )
        .join('')}
    </ol>`;
}

function renderEngagements(items) {
  return `
    <div class="engagement-grid">
      ${items
        .map(
          (item, index) => `
            <article class="engagement-card reveal">
              <span class="engagement-index">${String(index + 1).padStart(2, '0')}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </article>`
        )
        .join('')}
    </div>`;
}

function renderContactDetails(site) {
  const owner = site.owner;
  return `
    <ul class="contact-detail-list">
      <li class="contact-detail">
        <span class="contact-detail-icon">${icon('mail')}</span>
        <div>
          <span class="contact-detail-label">Email</span>
          <a href="mailto:${escapeHtml(owner.email)}">${escapeHtml(owner.email)}</a>
        </div>
      </li>
      <li class="contact-detail">
        <span class="contact-detail-icon">${icon('phone')}</span>
        <div>
          <span class="contact-detail-label">Phone</span>
          <a href="tel:${escapeHtml(owner.phoneHref)}">${escapeHtml(owner.phone)}</a>
        </div>
      </li>
      <li class="contact-detail">
        <span class="contact-detail-icon">${icon('map-pin')}</span>
        <div>
          <span class="contact-detail-label">Location</span>
          <span>${escapeHtml(owner.location.display)}</span>
          <small>${escapeHtml(owner.location.timezone)}</small>
        </div>
      </li>
      <li class="contact-detail">
        <span class="contact-detail-icon">${icon('clock')}</span>
        <div>
          <span class="contact-detail-label">Availability</span>
          <span>${escapeHtml(owner.availability)}</span>
          <small>${escapeHtml(site.contact.responseTime)}</small>
        </div>
      </li>
    </ul>`;
}

function renderServiceOptions(services) {
  return [
    '<option value="">Select a project type</option>',
    ...services.map((service) => `<option value="${escapeHtml(service.id)}">${escapeHtml(service.title)}</option>`),
    '<option value="other">Something else</option>'
  ].join('');
}

function renderDemoNote(text, className) {
  if (!text) return '';
  return `
    <aside class="demo-note${className ? ` ${className}` : ''}" role="note">
      <span class="demo-note-icon">${icon('info')}</span>
      <p>${escapeHtml(text)}</p>
    </aside>`;
}

function renderResumeExperience(entries) {
  return entries
    .map(
      (entry) => `
        <article class="resume-role">
          <div class="resume-role-head">
            <div>
              <h2>${escapeHtml(entry.role)}</h2>
              <p class="resume-company">${escapeHtml(entry.company)} · ${escapeHtml(entry.location)}</p>
            </div>
            <p class="resume-period">${escapeHtml(entry.period)}</p>
          </div>
          <p class="resume-summary">${escapeHtml(entry.summary)}</p>
          <ul class="resume-highlights">
            ${entry.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}
          </ul>
          <p class="resume-stack"><strong>Stack:</strong> ${escapeHtml(entry.stack.join(', '))}</p>
        </article>`
    )
    .join('');
}

function renderResumeSkills(groups) {
  return groups
    .map(
      (group) => `
        <div class="resume-skill-group">
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(group.skills.map((skill) => skill.name).join(' · '))}</p>
        </div>`
    )
    .join('');
}

module.exports = {
  renderPrimaryNav,
  renderBreadcrumbs,
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
  renderBlogCard,
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
};

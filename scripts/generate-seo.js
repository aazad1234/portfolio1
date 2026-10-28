'use strict';

const path = require('path');

const { ROOT, loadData, writeText } = require('./lib/data');
const { renderSitemap, renderRobots, renderFeed, renderWebmanifest } = require('./lib/seo');

const data = loadData();

writeText(path.join(ROOT, 'sitemap.xml'), renderSitemap(data));
writeText(path.join(ROOT, 'robots.txt'), renderRobots(data));
writeText(path.join(ROOT, 'feed.xml'), renderFeed(data));
writeText(path.join(ROOT, 'site.webmanifest'), renderWebmanifest(data));

console.log('Generated sitemap.xml, robots.txt, feed.xml and site.webmanifest.');

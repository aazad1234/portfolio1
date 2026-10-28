'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const COMPONENTS_DIR = path.join(ROOT, 'components');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');

function readJson(fileName) {
  const absolute = path.join(DATA_DIR, fileName);
  const raw = fs.readFileSync(absolute, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${fileName}: ${error.message}`);
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function writeText(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

function loadData() {
  const site = readJson('site-config.json');
  const navigation = readJson('navigation.json');
  const seo = readJson('seo.json');
  const projects = readJson('projects.json');
  const skills = readJson('skills.json');
  const experience = readJson('experience.json');
  const services = readJson('services.json');
  const testimonials = readJson('testimonials.json');
  const blog = readJson('blog.json');

  const projectByKey = new Map();
  projects.projects.forEach((project) => {
    projectByKey.set(project.slug, project);
    projectByKey.set(project.output, project);
  });

  const postByKey = new Map();
  blog.posts.forEach((post) => {
    postByKey.set(post.slug, post);
    postByKey.set(post.output, post);
  });

  return {
    site,
    navigation,
    seo,
    projects,
    projectByKey,
    skills,
    experience,
    services,
    testimonials,
    blog,
    postByKey
  };
}

function getSiteUrl(site) {
  return String(site.site.url || '').replace(/\/+$/, '');
}

module.exports = {
  ROOT,
  DATA_DIR,
  COMPONENTS_DIR,
  PAGES_DIR,
  readJson,
  readText,
  writeText,
  loadData,
  getSiteUrl
};

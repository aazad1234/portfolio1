'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2'
};

function safePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch (error) {
    return null;
  }

  const relative = decoded.replace(/^\/+/, '');
  const target = path.resolve(ROOT, relative);

  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    return null;
  }

  return target;
}

function sendFile(response, filePath, method) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (error) {
    return false;
  }

  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    try {
      stat = fs.statSync(filePath);
    } catch (error) {
      return false;
    }
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache'
  });

  if (method === 'HEAD') {
    response.end();
    return true;
  }

  fs.createReadStream(filePath).pipe(response);
  return true;
}

const server = http.createServer((request, response) => {
  const method = request.method || 'GET';

  if (method !== 'GET' && method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  let target = safePath(request.url || '/');
  if (!target) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  if (request.url === '/' || request.url === '') {
    target = path.join(ROOT, 'index.html');
  } else if (target.endsWith(path.sep) || (fs.existsSync(target) && fs.statSync(target).isDirectory())) {
    target = path.join(target, 'index.html');
  }

  if (sendFile(response, target, method)) return;

  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) {
    const stat = fs.statSync(notFound);
    response.writeHead(404, {
      'Content-Type': MIME_TYPES['.html'],
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    if (method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(notFound).pipe(response);
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set PORT to another value and try again.`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio preview: http://${HOST}:${PORT}/`);
  console.log('Press Ctrl+C to stop the server.');
});

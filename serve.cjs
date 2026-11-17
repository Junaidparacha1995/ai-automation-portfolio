const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pipeline } = require('node:stream');

const root = path.join(__dirname, 'dist');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method not allowed');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Invalid URL');
  }
  const asset = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!asset.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(asset, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404);
      return res.end('Not found');
    }

    // Local assets can be edited, so cache them and check their version on reuse.
    const etag = `W/"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
    const headers = { 'Cache-Control': 'no-cache', ETag: etag };
    const cachedTags = (req.headers['if-none-match'] || '').split(',').map(tag => tag.trim());
    if (cachedTags.includes(etag) || cachedTags.includes('*')) {
      res.writeHead(304, headers);
      return res.end();
    }

    res.writeHead(200, {
      ...headers,
      'Content-Type': mimeTypes[path.extname(asset).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size
    });
    if (req.method === 'HEAD') return res.end();
    pipeline(fs.createReadStream(asset), res, error => {
      if (error && error.code !== 'ERR_STREAM_PREMATURE_CLOSE') res.destroy(error);
    });
  });
});

const port = process.env.PORT === undefined ? 4173 : Number(process.env.PORT);
server.listen(port, '127.0.0.1', () => {
  console.log(`Open http://127.0.0.1:${server.address().port} in your browser. Press Ctrl+C to stop.`);
});

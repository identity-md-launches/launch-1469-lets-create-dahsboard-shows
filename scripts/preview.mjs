import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

// A small test server: serves only the production export, under a real subpath.
const root = resolve('dist');
const port = Number(process.env.ETHERPEEK_PREVIEW_PORT || 4175);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    const file = resolve(root, pathname.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end(); }
});
server.listen(port, '127.0.0.1', () => console.log(`Production preview: http://127.0.0.1:${port}/preview/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());

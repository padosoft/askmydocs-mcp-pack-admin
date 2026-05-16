// Minimal HTTP server for Playwright E2E. Serves the built Vite bundle
// (public/vendor/mcp-pack-admin/) as a single-page application: every
// path that isn't a file returns index.html so react-router-dom can
// handle deep links the same way Laravel's catch-all route would in
// production.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSET_DIR = join(ROOT, 'public', 'vendor', 'mcp-pack-admin');
const PORT = Number(process.env.PLAYWRIGHT_PORT || 4173);

const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function htmlShell(manifestEntry) {
  const cssTags = (manifestEntry.css || [])
    .map((f) => `<link rel="stylesheet" href="/vendor/mcp-pack-admin/${f}"/>`)
    .join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="csrf-token" content="e2e-csrf-token"/>
<title>MCP Pack · Admin Panel</title>
${cssTags}
<script>
window.__MCP_PACK_ADMIN__ = {
  api_base: '/api/admin/mcp-pack',
  mount_prefix: '/',
  theme_default: 'dark',
  asset_path: '/vendor/mcp-pack-admin'
};
</script>
</head>
<body>
<div id="mcp-pack-admin-root"></div>
<script type="module" src="/vendor/mcp-pack-admin/${manifestEntry.file}"></script>
</body>
</html>`;
}

let manifestCache = null;
async function getManifest() {
  if (manifestCache) return manifestCache;
  const raw = await readFile(join(ASSET_DIR, '.vite/manifest.json'), 'utf8');
  const j = JSON.parse(raw);
  manifestCache = j['resources/js/main.tsx'];
  if (!manifestCache) throw new Error('manifest missing main.tsx entry');
  return manifestCache;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/vendor/mcp-pack-admin/')) {
      const rel = pathname.replace('/vendor/mcp-pack-admin/', '');
      const filePath = normalize(join(ASSET_DIR, rel));
      if (!filePath.startsWith(ASSET_DIR)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      try {
        const buf = await readFile(filePath);
        res.writeHead(200, {
          'content-type': MIME[extname(filePath)] || 'application/octet-stream',
          'cache-control': 'no-store',
        });
        res.end(buf);
        return;
      } catch {
        res.writeHead(404);
        res.end('not found');
        return;
      }
    }

    // SPA fallback: every other path returns the HTML shell so react-router can
    // handle it client-side.
    const entry = await getManifest();
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(htmlShell(entry));
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

server.listen(PORT, () => {
  console.log(`[e2e] serving SPA at http://localhost:${PORT}`);
});

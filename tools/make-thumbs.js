// Renders a static 720x450 WebP thumbnail for every piece in registry.js → thumbs/<id>.webp
// The gallery shows these images instead of live iframes.
//
// Usage (from the repo root, Playwright installed):
//   node tools/make-thumbs.js              all pieces
//   node tools/make-thumbs.js hero-03      only the given ids
// Optional: NPM_DIR=/path/to/unpacked/packages serves cdn.jsdelivr / unpkg
// requests from local `npm pack` folders (named <pkg>-<version>) when offline.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'thumbs');
const PORT = 8790;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.geojson': 'application/json' };

global.window = {};
require(path.join(ROOT, 'registry.js'));
const only = process.argv.slice(2);
const items = window.EMS_REGISTRY.filter(i => !only.length || only.includes(i.id));

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  if (process.env.NPM_DIR) {
    await ctx.route(/https:\/\/(cdn\.jsdelivr\.net\/npm|unpkg\.com)\/(@?[^@/]+)@([^/]+)\/(.*)/, (route, req) => {
      const [, , pkg, ver, rest] = req.url().match(/https:\/\/(cdn\.jsdelivr\.net\/npm|unpkg\.com)\/(@?[^@/]+)@([^/]+)\/([^?]*)/);
      const f = path.join(process.env.NPM_DIR, `${pkg}-${ver}`, 'package', rest);
      if (!fs.existsSync(f)) return route.abort();
      route.fulfill({ path: f, contentType: TYPES[path.extname(f)] || 'application/octet-stream', headers: { 'Access-Control-Allow-Origin': '*' } });
    });
  }

  const encoder = await ctx.newPage();
  for (const it of items) {
    const page = await ctx.newPage();
    try {
      await page.goto(`http://localhost:${PORT}/${it.path}`, { waitUntil: 'load', timeout: 30000 });
    } catch (e) { console.warn(`${it.id}: load timeout, capturing anyway`); }
    await page.waitForTimeout(4000); // let entrance animations settle
    await page.addStyleTag({ content: '.ems-back{display:none!important}' });
    const png = await page.screenshot({ type: 'png' });
    await page.close();
    // Downscale to 720x450 and encode as WebP with Chromium's canvas
    const b64 = await encoder.evaluate(async src => {
      const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode();
      const c = document.createElement('canvas'); c.width = 720; c.height = 450;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, 720, 450);
      return c.toDataURL('image/webp', 0.82).split(',')[1];
    }, png.toString('base64'));
    fs.writeFileSync(path.join(OUT, `${it.id}.webp`), Buffer.from(b64, 'base64'));
    console.log(`${it.id} → thumbs/${it.id}.webp`);
  }
  await browser.close();
  server.close();
})();

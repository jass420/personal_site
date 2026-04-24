// Headless renderer for car PNGs.
// Runs render-cars.html in puppeteer + system Chrome, captures each canvas, writes to cars/.
// Usage: 1) start `python3 -m http.server 8000` in this directory  2) `node render-cars.js`

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:8000/render-cars.html';
const OUT_DIR = path.join(__dirname, 'cars');
const CHROME = '/usr/bin/google-chrome';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'],
  });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('  [browser]', msg.text()));
  page.on('pageerror', (err) => console.log('  [page error]', err.message));

  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0' });

  console.log('Triggering Render All...');
  await page.click('#render-all');

  console.log('Waiting for all cells to be ready...');
  await page.waitForFunction(
    () => {
      const cells = document.querySelectorAll('.car-cell .status');
      if (!cells.length) return false;
      return Array.from(cells).every((s) => s.classList.contains('ready') || s.classList.contains('error'));
    },
    { timeout: 120000 },
  );

  const results = await page.evaluate(() => {
    const cells = document.querySelectorAll('.car-cell');
    return Array.from(cells).map((cell) => {
      const filename = cell.querySelector('.filename').textContent.replace('cars/', '').trim();
      const canvas = cell.querySelector('canvas');
      const status = cell.querySelector('.status').textContent.trim();
      const ok = cell.querySelector('.status').classList.contains('ready');
      return {
        filename,
        status,
        ok,
        dataUrl: ok ? canvas.toDataURL('image/png') : null,
      };
    });
  });

  for (const r of results) {
    if (!r.ok) {
      console.log(`  ✗ ${r.filename} — ${r.status}`);
      continue;
    }
    const base64 = r.dataUrl.replace(/^data:image\/png;base64,/, '');
    const outPath = path.join(OUT_DIR, r.filename);
    fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
    const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`  ✓ ${r.filename} (${kb} KB)`);
  }

  await browser.close();
  console.log('Done.');
})().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});

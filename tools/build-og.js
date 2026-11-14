/**
 * Genera assets/img/og-wevo.png (1200x630) da tools/og-template.html.
 * Uso: node tools/build-og.js
 */
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const src = 'file://' + path.resolve(__dirname, 'og-template.html');
  const out = path.resolve(__dirname, '..', 'assets', 'img', 'og-wevo.png');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await page.goto(src, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out });
  await browser.close();

  console.log('OK ->', out);
})();

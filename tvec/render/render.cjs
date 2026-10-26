// Rendu image par image (déterministe) : node render/render.cjs <worker> <nWorkers> <outDir>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [,, w, nw, out] = process.argv; const FPS = 30, TOTAL = 35 * FPS;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + path.resolve('video.html')); await p.waitForFunction('window.__ready');
  for (let f = +w; f < TOTAL; f += +nw) {
    await p.evaluate(t => seek(t), f / FPS);
    await p.screenshot({ path: `${out}/f_${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 96 });
  }
  await b.close();
})();

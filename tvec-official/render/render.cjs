// Rendu image par image (déterministe) : node render/render.cjs <worker> <nWorkers> <dossier> [fps=30] [durée=34]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [,, w, nw, out, fpsA, durA] = process.argv; const FPS = +(fpsA || 30), TOTAL = Math.round(+(durA || 34) * FPS);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + path.resolve('compositions/video.html')); await p.waitForFunction('window.__ready', null, { timeout: 30000 });
  for (let f = +w; f < TOTAL; f += +nw) {
    await p.evaluate(t => seek(t), f / FPS);
    await p.screenshot({ path: `${out}/f_${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 96 });
  }
  await b.close();
})();

// Captures de contrôle : node render/shot.cjs <dossier> <t1> <t2> ...
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [,, out, ...times] = process.argv; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 160)); });
  await p.goto('file://' + path.resolve('compositions/video.html')); await p.waitForFunction('window.__ready', null, { timeout: 30000 });
  for (const t of times) { await p.evaluate(t => seek(t), parseFloat(t)); await p.screenshot({ path: `${out}/f_${t}.png` }); }
  await b.close();
})();

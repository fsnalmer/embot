// Rendu des shorts : node render/shorts_render.cjs <video> <worker> <nWorkers> <dossier> [fps=30]   |   captures : node render/shorts_render.cjs <video> shot <dossier> <t1> <t2>…
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [,, vid, w, ...rest] = process.argv; const FPS = 30;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 160)); });
  await p.goto('file://' + path.resolve('compositions/shorts.html') + '?v=' + vid); await p.waitForFunction('window.__ready', null, { timeout: 30000 });
  const dur = await p.evaluate('window.__DUR');
  if (w === 'shot') { const [out, ...ts] = rest; fs.mkdirSync(out, { recursive: true }); for (const t of ts) { await p.evaluate(t => seek(t), parseFloat(t)); await p.screenshot({ path: `${out}/${vid}_${t}.png` }); } console.log('dur', dur); }
  else if (w === 'dur') { console.log(dur); }
  else { const [nw, out] = rest; const TOTAL = Math.ceil(dur * FPS); fs.mkdirSync(out, { recursive: true });
    for (let f = +w; f < TOTAL; f += +nw) { await p.evaluate(t => seek(t), f / FPS); await p.screenshot({ path: `${out}/f_${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 96 }); } }
  await b.close();
})();

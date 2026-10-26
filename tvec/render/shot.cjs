const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [,, out, ...times] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + path.resolve('video.html'));
  await p.waitForFunction('window.__ready');
  for (const t of times) { await p.evaluate(t => seek(t), parseFloat(t)); await p.screenshot({ path: `${out}/f_${t}.png` }); }
  await b.close();
})();

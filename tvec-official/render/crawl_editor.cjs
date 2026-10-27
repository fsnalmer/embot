// Choisit « Explore editor space » puis capture l'espace éditeur public (liste des concours).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const net = {}; p.on('response', r => { const ct = r.headers()['content-type'] || ''; if (/image|video|audio/.test(ct)) net[r.url()] = ct; });
  await p.goto('https://tvec.gg/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500);
  await p.getByText('Explore editor space').first().click(); await p.waitForTimeout(5000);
  console.log('URL', p.url());
  for (let y = 0; y < 6000; y += 700) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(400); }
  const txt = await p.evaluate(() => document.body.innerText); fs.writeFileSync('research/editor_space.txt', txt);
  const imgs = await p.evaluate(() => [...document.images].map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight })));
  fs.writeFileSync('research/editor_space_imgs.json', JSON.stringify({ imgs, net }, null, 1));
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: 'research/shots/editor_top.png' });
  console.log(txt.slice(0, 3000)); await b.close();
})();

// Exploration (publique, robots.txt respecté) de tvec.gg : texte, liens, médias, captures. node render/crawl.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const PAGES = ['/', '/fr', '/about', '/fr/about', '/explore', '/fr/explore', '/faq', '/fr/faq', '/classement', '/leaderboard', '/ranked', '/launch-a-contest', '/fr/launch-a-contest', '/sponsors', '/sponsors/anime', '/sponsors/film', '/sponsors/gaming', '/sponsors/brand', '/sponsors/community', '/sponsors/creators', '/sponsors/music', '/editors', '/discover', '/blog', '/patch-notes', '/contact',
  '/contest/%E2%82%AC2000semdemora', '/contest/%E2%82%AC1500funkcalor', '/contest/%E2%82%AC1500bailalento', '/contest/%E2%82%AC1500montagemdauntless', '/contest/%E2%82%AC1000africa', '/contest/%E2%82%AC1000funkunico', '/contest/%E2%82%AC1000tapatoma'];
(async () => {
  const b = await chromium.launch(); const media = {}; const out = {};
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1' });
  const p = await ctx.newPage();
  p.on('response', r => { const u = r.url(); const ct = r.headers()['content-type'] || ''; if (/image|video|audio|font|svg|json/.test(ct) && !u.includes('google') ) media[u] = ct; });
  for (const pg of PAGES) {
    const url = 'https://tvec.gg' + pg; const slug = (pg === '/' ? 'home' : decodeURIComponent(pg).replace(/[^\w€-]+/g, '_').replace(/^_/, ''));
    try {
      const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(3500);
      // défilement pour déclencher le lazy-load
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0, 0); });
      await p.waitForTimeout(800);
      const data = await p.evaluate(() => ({ title: document.title, h: [...document.querySelectorAll('h1,h2,h3')].map(e => e.innerText.trim()).filter(Boolean), text: document.body.innerText, links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href))],
        imgs: [...document.images].map(i => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight, alt: i.alt })), vids: [...document.querySelectorAll('video,source')].map(v => v.currentSrc || v.src).filter(Boolean) }));
      data.status = r.status(); out[pg] = data; fs.writeFileSync(`research/pages/${slug}.json`, JSON.stringify(data, null, 1));
      await p.screenshot({ path: `research/shots/${slug}.jpg`, type: 'jpeg', quality: 70, fullPage: true });
      console.log(r.status(), pg, data.h.length, 'titres', data.imgs.length, 'imgs');
    } catch (e) { console.log('ERR', pg, e.message.slice(0, 80)); }
    await p.waitForTimeout(600);
  }
  fs.writeFileSync('research/media-urls.json', JSON.stringify(media, null, 1)); await b.close();
})();

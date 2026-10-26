// Déplie chaque question de la FAQ officielle et enregistre les réponses.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 430, height: 932 } })).newPage();
  await p.goto('https://tvec.gg/faq', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(4000);
  const qs = await p.$$('button[aria-expanded], [role="button"][aria-expanded], summary');
  console.log('questions', qs.length); const out = [];
  for (let i = 0; i < qs.length; i++) {
    try { const q = (await qs[i].innerText()).trim().split('\n')[0]; await qs[i].scrollIntoViewIfNeeded(); await qs[i].click({ timeout: 3000 }); await p.waitForTimeout(350);
      const a = await qs[i].evaluate(el => { const c = el.closest('div,li,details') ; const n = el.nextElementSibling || (c && c.nextElementSibling); return (n ? n.innerText : '').trim(); });
      out.push({ q, a }); } catch (e) { out.push({ err: e.message.slice(0, 60) }); }
  }
  fs.writeFileSync('research/faq_answers.json', JSON.stringify(out, null, 1)); console.log(out.slice(0, 3));
  await b.close();
})();

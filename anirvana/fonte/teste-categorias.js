const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const erros = [];
  for (const [w, h, n] of [[390, 844, 'm'], [1280, 900, 'd']]){
    const p = await b.newPage({viewport:{width:w, height:h}}); p.on('pageerror', e => erros.push(e.message));
    await p.goto('file:///home/user/anirvana-app/dist/anirvana/index.html#admin-balanco'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(600);
    await p.click('[data-act=balVis][data-v=cat]'); await p.waitForTimeout(600);
    await p.screenshot({path:`shots-novo/cat-${n}-1.png`, fullPage:n === 'd'});
    const sw = await p.evaluate(() => document.documentElement.scrollWidth); console.log(n, 'largura', sw);
    await p.click('.cat-card[data-v=Airbnb]'); await p.waitForTimeout(700);
    await p.hover('.chart-cat:not(.mini) .hit[data-i="0"]'); await p.waitForTimeout(300);
    await p.screenshot({path:`shots-novo/cat-${n}-2.png`});
    await p.locator('.cats').scrollIntoViewIfNeeded(); await p.hover('.chart-cat.mini .hit[data-i="5"]'); await p.waitForTimeout(300);
    await p.screenshot({path:`shots-novo/cat-${n}-3.png`});
  }
  console.log('erros', erros); await b.close();
})();

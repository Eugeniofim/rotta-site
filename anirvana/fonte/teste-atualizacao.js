// Testa a barra "tem uma versão nova": antes, copie dist/anirvana para srv/anirvana (cp -r dist/anirvana srv/).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RAIZ = path.join(__dirname, 'srv');
let swHits = 0;
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  if (p.endsWith('sw.js')) swHits++;
  const f = path.join(RAIZ, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const tipo = {'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png'}[path.extname(f)] || 'application/octet-stream';
  res.writeHead(200, {'Content-Type': tipo, 'Cache-Control': 'public, max-age=86400'});   /* como hospedagem real */
  res.end(fs.readFileSync(f));
}).listen(8765);
const ok = [], falha = [];
const check = (c, m) => (c ? ok : falha).push(m);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390,height:844}}); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(e.message));
  await p.goto('http://localhost:8765/anirvana/');
  await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, {timeout:15000}).catch(() => {});
  check(await p.evaluate(() => !!navigator.serviceWorker.controller), 'service worker assumiu a página');
  check(await p.locator('[data-act=entrar]').count() > 0, 'app abre (porta de entrada)');
  check(!(await p.locator('#novaBar.on').count()), 'sem barra na primeira instalação');
  const man = await p.evaluate(() => fetch('manifest.webmanifest').then(r => r.json()));
  check(man.start_url === './' && man.icons.length === 2, 'manifest ok');
  /* deploy v2 sem recarregar */
  const sw = path.join(RAIZ, 'anirvana', 'sw.js'); fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace("anirvana-v3", "anirvana-v4"));
  const antes = swHits;
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', {value:false, configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForSelector('#novaBar.on', {timeout:15000}).catch(() => {});
  check(swHits > antes, 'voltou pro app → conferiu o sw.js no servidor (max-age não segurou)');
  check(await p.locator('#novaBar.on').count() === 1, 'barra "Tem uma versão nova" apareceu');
  await p.click('#btnNova'); await p.waitForTimeout(2500); await p.waitForLoadState('load'); await p.waitForTimeout(3000);
  const cache = await p.evaluate(() => caches.keys());
  check(cache.includes('anirvana-v4') && !cache.includes('anirvana-v3'), 'depois de Atualizar: só o cache novo');
  /* rajada de voltas não vira enxurrada */
  const h0 = swHits; for (let i=0;i<8;i++) await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await p.waitForTimeout(800);
  check(swHits - h0 <= 1, `8 voltas seguidas → ${swHits - h0} conferida(s)`);
  await ctx.setOffline(true); await p.reload().catch(() => {});
  check(await p.locator('[data-act=entrar]').count() > 0, 'sem internet o app ainda abre');
  check(!erros.length, 'sem erros de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await b.close(); srv.close();
  console.log(ok.map(m => '✓ ' + m).join('\n')); if (falha.length) console.log(falha.map(m => '✗ ' + m).join('\n'));
  console.log(`${ok.length} ok · ${falha.length} falhas`);
})();

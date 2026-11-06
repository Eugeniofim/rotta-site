// Grava o tutorial: abre o palco (celular + legendas), usa o app de verdade e captura a tela quadro a quadro.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname, FR = path.join(DIR, 'frames');
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.rmSync(FR, {recursive:true, force:true}); fs.mkdirSync(FR);
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:1920, height:1080}, deviceScaleFactor:1});
  const page = await ctx.newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  await page.goto('file://' + path.join(DIR, 'palco.html'));
  await page.waitForLoadState('load'); await espera(2500);
  const app = () => page.frames().find(f => f.url().includes('app/index.html'));
  app().on && 0;

  // captura: screencast do Chromium em JPEG de alta qualidade, com o horário de cada quadro
  const cdp = await ctx.newCDPSession(page);
  const quadros = [];
  cdp.on('Page.screencastFrame', async ({data, metadata, sessionId}) => {
    const n = quadros.length; const f = path.join(FR, `q${String(n).padStart(5,'0')}.jpg`);
    fs.writeFileSync(f, Buffer.from(data, 'base64')); quadros.push({f, t:metadata.timestamp});
    try { await cdp.send('Page.screencastFrameAck', {sessionId}); } catch(e){}
  });
  await cdp.send('Page.startScreencast', {format:'jpeg', quality:95, maxWidth:1920, maxHeight:1080, everyNthFrame:1});

  const leg = async (cap, tit, txt, passo, ms = 400) => { await page.evaluate(a => window.legenda(...a), [cap, tit, txt, passo]); await espera(ms); };
  const ponto = async (sel, nth = 0) => {
    const h = app().locator(sel).nth(nth);
    await h.waitFor({state:'attached', timeout:8000});
    await h.evaluate(el => el.scrollIntoView({block:'center', behavior:'smooth'}));
    await espera(750);
    const r = await h.evaluate(el => { const b = el.getBoundingClientRect(); return {x:b.x + b.width/2, y:b.y + b.height/2}; });
    const f = await page.locator('#app').boundingBox();
    return {x:f.x + r.x, y:f.y + r.y};
  };
  const toque = async (sel, nth = 0, depois = 900) => {
    const p = await ponto(sel, nth);
    await page.evaluate(a => window.dedoPara(...a), [p.x, p.y]); await espera(700);
    await page.evaluate(a => window.onda(...a), [p.x, p.y]);
    await page.mouse.click(p.x, p.y); await espera(depois);
  };
  const digita = async (txt) => { await page.keyboard.type(txt, {delay:85}); await espera(300); };
  const rola = async (y) => { await app().evaluate(y => window.scrollTo({top:y, behavior:'smooth'}), y); await espera(1100); };
  const arrasta = async (sel, dx) => {
    const p = await ponto(sel);
    await page.evaluate(a => window.dedoPara(...a), [p.x + 60, p.y]); await espera(700);
    await page.mouse.move(p.x + 60, p.y); await page.mouse.down();
    for (let i = 1; i <= 16; i++){ const x = p.x + 60 + dx * i / 16; await page.mouse.move(x, p.y); await page.evaluate(a => window.dedoPara(...a), [x, p.y]); await espera(45); }
    await page.mouse.up(); await espera(1400);
  };

  // ---------- capa ----------
  await espera(3600);
  await page.evaluate(() => window.tiraCapa()); await espera(400);

  // 1. entrada
  await leg('Começo', 'Cada pessoa entra no seu painel', 'Administração, instrutores e alunos. Cada um vê só o que é seu.', 1, 2200);
  await rola(260); await espera(800); await rola(0);
  await toque('[data-act=entrar][data-v=admin][data-who=dessa]', 0, 1500);

  // 2. início da administração
  await leg('Administração · Dessa e Vitor', 'O mês num olhar', 'O sol mostra quanto do mês já está fechado. Logo abaixo, o que pede atenção.', 2, 3200);
  await toque('[data-act=pagarConta]', 0, 2200);
  await leg('Administração · Dessa e Vitor', 'Conta paga, um toque', 'Toque em "Paguei" e a conta já entra no balanço do mês.', 3, 1800);

  // 3. lançar
  await rola(0);
  await leg('Administração · Dessa e Vitor', 'Lançar uma despesa', 'Valor, categoria e o que foi. Mensalidades e lojinha entram sozinhas.', 4, 600);
  await toque('[data-act=lancar]', 0, 900);
  await toque('#lValor', 0, 300); await digita('120,50');
  await toque('.opt[data-grp=lCat][data-v="Manutenção"]', 0, 500);
  await toque('#lDesc', 0, 300); await digita('Lâmpadas');
  await toque('#fLanc button[type=submit]', 0, 2000);

  // 4. balanço do ano
  await toque('.bnav [data-v=balanco]', 0, 800);
  await leg('Administração · Dessa e Vitor', 'Balanço do ano', 'Entradas do Espaço e saídas, mês a mês. Toque num mês para ver o saldo.', 5, 400);
  await toque('[data-act=balVis][data-v=ano]', 0, 900);
  await toque('.chart .hit[data-i="5"]', 0, 2600);

  // 5. mensalidades
  await toque('.bnav [data-v=mensalidades]', 0, 800);
  await leg('Administração · Dessa e Vitor', 'Quem pagou e quem deve', 'Filtre os atrasados e registre o pagamento com um toque.', 6, 400);
  await toque('[data-act=mensSt][data-v=atrasado]', 0, 1200);
  await toque('[data-act=receber]', 0, 1100);
  await toque('#fReceber button[type=submit]', 0, 2000);

  // 6. fechamento
  await rola(0);
  await toque('[data-act=mensVis][data-v=fechamento]', 0, 700);
  await leg('Administração · Dessa e Vitor', 'O repasse da equipe, pronto', 'O app calcula quanto cada instrutora recebe. Em janeiro, bate com a planilha centavo por centavo.', 7, 400);
  await toque('[data-act=fechMes][data-v="2026-01"]', 0, 900);
  await ponto('.pill.ok'); await espera(2600);

  // 7. lojinha
  await toque('.bnav [data-v=lojinha]', 0, 1000);
  await leg('Administração · Dessa e Vitor', 'Lojinha: venda em segundos', 'Gire os fornecedores, toque nos produtos e feche a venda. O app separa a parte de cada um.', 8, 400);
  await arrasta('#ringStage', -230);
  await toque('.prod[data-v=p21]', 0, 900);
  await toque('.prod[data-v=p02]', 0, 1100);
  await toque('[data-act=checkout]', 0, 1800);
  await toque('[data-act=registrarVenda]', 0, 2600);
  await toque('#sheet [data-act=fechar]', 0, 900);

  // 8. instrutora: chamada
  await rola(0);
  await toque('.rolebtn', 0, 900);
  await toque('#sheet [data-act=entrar][data-v=instrutor][data-who=kamala]', 0, 1300);
  await leg('Instrutores · Kamala', 'A chamada com um toque', 'As aulas do dia aparecem sozinhas. Toque em quem veio e salve.', 9, 900);
  await toque('[data-act=chamada]', 0, 1100);
  await toque('.roll', 0, 500);
  await toque('.roll', 1, 700);
  await toque('[data-act=salvarChamada]:not([data-v])', 0, 2000);

  // 9. troca de aula
  await leg('Instrutores · Kamala', 'Troca de aula combinada', 'Quando alguém pede troca, aparece aqui. "Eu cubro" e está resolvido.', 10, 500);
  await toque('[data-act=aceitarSub]', 0, 2200);

  // 10. alunos sumindo
  await toque('.bnav [data-v=alunos]', 0, 900);
  await leg('Instrutores · Kamala', 'Quem anda sumido', 'Amarelo: mais de uma semana sem vir. Vermelho: mais de uma semana e meia.', 11, 3400);

  // 11. meu mês
  await toque('.bnav [data-v=mes]', 0, 900);
  await leg('Instrutores · Kamala', 'Quanto vou receber', 'O repasse do mês explicado aula por aula. Sem planilha e sem dúvida.', 12, 3000);

  // 12. aluna
  await rola(0);
  await toque('.rolebtn', 0, 900);
  await toque('#sheet [data-act=entrar][data-v=aluno][data-who=a01]', 0, 1300);
  await leg('Alunos · Luana', 'A prática do aluno', 'Frequência, próximas aulas e o pagamento. Pix, Pix Automático ou cartão.', 13, 1800);
  await toque('[data-act=vou][data-x="1"]', 0, 1800);
  await toque('.bnav [data-v=plano]', 0, 1000);
  await toque('[data-act=pagar]', 0, 2600);
  await toque('#sheet [data-act=fechar]', 0, 800);

  // ---------- final ----------
  await page.evaluate(() => window.capa(`<img src="logo-site.png" alt=""><h1>Pronto para usar</h1><div class="link">rottaguide.com/anirvana</div><p>No celular: abra o link e toque em “Adicionar à Tela de Início”.</p>`));
  await espera(5200);

  await cdp.send('Page.stopScreencast'); await espera(300);
  await b.close();

  // lista para o ffmpeg: cada quadro dura até o próximo
  const linhas = [];
  for (let i = 0; i < quadros.length; i++){
    const d = i < quadros.length - 1 ? Math.max(0.001, quadros[i+1].t - quadros[i].t) : 1.0;
    linhas.push(`file '${quadros[i].f}'`, `duration ${d.toFixed(4)}`);
  }
  linhas.push(`file '${quadros[quadros.length-1].f}'`);
  fs.writeFileSync(path.join(DIR, 'lista.txt'), linhas.join('\n'));
  const dur = quadros[quadros.length-1].t - quadros[0].t;
  console.log(`${quadros.length} quadros · ${dur.toFixed(1)} s`); if (erros.length) console.log('ERROS:', erros.join(' | '));
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });

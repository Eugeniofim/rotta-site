// Testa as novidades: porta, inscrição, ficha, eventos, avisos, pontos, sino e logo.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const APP = 'file:///home/user/anirvana-app/dist/anirvana/index.html';
const OUT = path.join(__dirname, 'shots-novo'); fs.rmSync(OUT, {recursive:true, force:true}); fs.mkdirSync(OUT);
const espera = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:390, height:844}, deviceScaleFactor:1, acceptDownloads:true});
  const page = await ctx.newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message)); page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  const ok = [], falhas = [];
  const conf = (cond, txt) => (cond ? ok : falhas).push(txt);
  const shot = n => page.screenshot({path:path.join(OUT, n + '.png')});
  const clica = async (sel, ms = 450) => { await page.locator(sel).first().click(); await espera(ms); };
  const overflow = async (n) => { const w = await page.evaluate(() => document.documentElement.scrollWidth); conf(w <= 390, `${n}: sem rolagem lateral (${w}px)`); };

  await page.goto(APP); await page.evaluate(() => localStorage.clear()); await page.reload(); await espera(700);
  await shot('01-porta');
  const ordem = await page.$$eval('.dcard h3', hs => hs.map(h => h.textContent));
  conf(ordem.join(',') === 'Alunos,Instrutores,Administração', 'porta: ordem ' + ordem.join(' > '));
  await overflow('porta');

  // inscrição
  await clica('[data-act=inscricao]', 600); await shot('02-insc-1');
  await clica('[data-act=inscPasso][data-v="1"]'); conf(await page.locator('#toast').innerText().then(t => t.includes('Falta')), 'inscrição: valida campos vazios');
  await page.fill('#iNome', 'Joana Teste da Silva'); await page.fill('#iNasc', '2012-05-10'); await espera(200);
  await page.dispatchEvent('#iNasc', 'input'); await espera(200);
  conf(await page.locator('#iRespF').isVisible(), 'inscrição: menor pede responsável');
  await page.fill('#iTel', '(41) 99999-1234');
  await clica('[data-act=inscPasso][data-v="1"]'); conf(await page.locator('#iNome').count() === 1, 'inscrição: não passa sem responsável');
  await page.fill('#iResp', 'Marta da Silva'); await page.fill('#iRespTel', '(41) 98888-1111');
  await clica('[data-act=inscPasso][data-v="1"]', 600); await shot('03-insc-2');
  await clica('.opt[data-grp=iAtv][data-v=yoga]', 600);
  conf(await page.locator('.opt[data-grp=iPlano]').count() === 4, 'inscrição: yoga mostra planos');
  await clica('.opt[data-grp=iTur]'); await page.locator('#iExpm').check();
  await shot('04-insc-2b');
  await clica('[data-act=inscPasso][data-v="1"]', 600);
  await clica('.opt[data-grp=iExp][data-v=nunca]'); await clica('.opt[data-grp=iObj]'); await clica('.opt[data-grp=iTemSaude][data-v=sim]');
  conf(await page.locator('#iSaudeF').isVisible(), 'inscrição: saúde abre campo');
  await page.fill('#iSaude', 'Escoliose leve'); await page.fill('#iEmerg', 'Marta (mãe)'); await page.fill('#iEmergTel', '(41) 98888-1111');
  await clica('.opt[data-grp=iComo][data-v="Indicação"]'); await page.fill('#iIndicou', 'Luana Ferraz');
  await shot('05-insc-3');
  await clica('[data-act=inscPasso][data-v="1"]', 600); await shot('06-insc-4');
  await clica('[data-act=inscEnviar]'); conf(await page.locator('#iTermos').count() === 1, 'inscrição: exige termos');
  await page.locator('#iTermos').check(); await page.locator('#iPriv').check();
  await clica('[data-act=inscEnviar]', 1600); await shot('07-insc-ok');
  conf(await page.locator('#sheet').innerText().then(t => t.includes('Inscrição enviada')), 'inscrição: enviada');
  await clica('#sheet [data-act=fechar]');

  // administração: inscrições, ficha, confirmar
  await clica('[data-act=entrar][data-v=admin][data-who=dessa]', 900); await shot('08-admin-inicio');
  const nInsc = await page.locator('#root [data-act=confirmarInscricao]').count(); conf(nInsc === 4, `admin: ${nInsc} inscrições novas (esperado 4)`);
  conf(await page.locator('.sino .dot').innerText() === '5', 'admin: sino com 5 (4 inscrições + 1 pagamento para confirmar)');
  await overflow('admin início');
  const btns = page.locator('[data-act=verInscricao]'); await btns.nth(3).click(); await espera(700); await shot('09-ficha-inscricao');
  conf(await page.locator('#sheet').innerText().then(t => t.includes('Escoliose') && t.includes('Marta')), 'admin: ficha mostra saúde e responsável');
  await clica('#sheet [data-act=confirmarInscricao]', 900);
  const n2 = await page.locator('#root [data-act=confirmarInscricao]').count(); conf(n2 === 3, 'admin: confirmou (sobram 3)');
  const pts = await page.evaluate(() => (S.pontosAcoes.a01 || {}).indicar); conf(!!pts, 'indicação: Luana ganhou os pontos');
  await clica('[data-act=sino]', 600); await shot('10-sino-admin'); await clica('#sheet [data-act=fechar]');

  // divulgar: eventos
  await clica('.bnav [data-v=divulgar]', 800); await shot('11-divulgar'); await overflow('divulgar');
  const rotulos = await page.$$eval('.bnav button span:not(.dot)', s => s.map(x => [x.textContent, x.scrollWidth <= x.parentElement.clientWidth + 1]));
  conf(rotulos.every(r => r[1]), 'barra de baixo: rótulos cabem ' + rotulos.map(r => r[0]).join('/'));
  await clica('[data-act=novoEvento]', 700); await shot('12-novo-evento');
  await page.fill('#eNome', 'Roda de mantras na lua cheia');
  await clica('#fEvento button[type=submit]', 900); await shot('13-divulgar-sheet');
  conf(await page.locator('#sheet').innerText().then(t => t.includes('Divulgar Roda de mantras')), 'evento: salvou e abriu divulgação');
  await clica('#sheet [data-act=divCanal][data-v=email]', 600);
  await clica('#sheet [data-act=divAlvo][data-v=yoga]', 600);
  const txtBtn = await page.locator('[data-act=enviarDivulgacao]').innerText(); conf(/Enviar para \d+/.test(txtBtn), 'divulgação: ' + txtBtn);
  await page.fill('#dMsg', 'Lua cheia no Espaço: mantras, respiração e chá. Vagas no app!'); await page.dispatchEvent('#dMsg', 'input'); await espera(200);
  conf((await page.locator('#dPrev').innerText()).startsWith('Lua cheia'), 'divulgação: prévia acompanha o texto');
  await clica('[data-act=enviarDivulgacao]', 900); await shot('14-push-enviado'); await espera(1200);
  conf(await page.evaluate(() => S.eventos.find(e => e.nome.startsWith('Roda')).divulgado === HOJE_ISO), 'divulgação: evento marcado como divulgado');
  await clica('[data-act=arteEvento]', 2500); await shot('15-arte-story');
  const px = await page.evaluate(() => { const c = document.querySelector('#arteCv'); const d = c.getContext('2d').getImageData(540, 1200, 1, 1).data; return [c.width, c.height, d[0], d[1], d[2]]; });
  conf(px[0] === 1080 && px[1] === 1920 && px[2] > 200, 'arte: story 1080×1920 desenhado ' + px.join(','));
  const [dl] = await Promise.all([page.waitForEvent('download', {timeout:5000}).catch(() => null), clica('[data-act=baixarArte]', 800)]);
  conf(dl && dl.suggestedFilename().endsWith('.png'), 'arte: baixa PNG ' + (dl ? dl.suggestedFilename() : 'nenhum'));
  if (dl) await dl.saveAs(path.join(OUT, 'arte-story.png'));
  await clica('#sheet [data-act=arteFmt][data-v=post]', 2200); await shot('16-arte-post');
  const [dl2] = await Promise.all([page.waitForEvent('download', {timeout:5000}).catch(() => null), clica('[data-act=baixarArte]', 800)]);
  if (dl2) await dl2.saveAs(path.join(OUT, 'arte-post.png'));
  await clica('#sheet [data-act=fechar]');
  await clica('[data-act=divVis][data-v=avisos]', 700); await shot('17-avisos'); await overflow('avisos');
  await clica('[data-act=previaAviso][data-v=vence]', 700); await shot('18-previa-aviso');
  await clica('[data-act=testeAviso]', 900); await shot('19-teste-push');
  await clica('[data-act=divVis][data-v=pontos]', 700); await shot('20-pontos-admin'); await overflow('pontos');
  await clica('[data-act=entregarTroca]', 600); conf(await page.evaluate(() => S.trocas.find(t => t.id === 'tr1').estado === 'entregue'), 'pontos: entregou presente');
  // escola: ficha do aluno no admin
  await clica('.bnav [data-v=escola]', 700); await clica('[data-act=verAluno][data-v=a13]', 800); await shot('21-ficha-admin-a13');
  conf(await page.locator('#sheet').innerText().then(t => t.includes('Labirintite') && t.includes('Não autorizou')), 'ficha: admin vê saúde sem autorização marcada');
  await clica('#sheet [data-act=fechar]');
  // logo volta para a entrada
  await clica('.topbar [data-act=logo]', 700); conf(await page.locator('.door').count() === 1, 'logo: volta para a tela inicial');

  // instrutora: ficha
  await clica('[data-act=entrar][data-v=instrutor][data-who=kamala]', 900);
  await clica('[data-act=sino]', 600); await shot('22-sino-kamala'); await clica('#sheet [data-act=fechar]');
  await clica('.bnav [data-v=alunos]', 800);
  await page.evaluate(() => ACT.verAlunoI({v:'a13'})); await espera(700); await shot('23-ficha-instr-a13');
  conf(await page.locator('#sheet').innerText().then(t => !t.includes('Labirintite') && t.includes('não autorizou')), 'ficha: instrutora não vê saúde sem autorização');
  await clica('#sheet [data-act=fechar]');
  await page.evaluate(() => ACT.verAlunoI({v:'a05'})); await espera(700); await shot('24-ficha-instr-a05');
  conf(await page.locator('#sheet').innerText().then(t => t.includes('Hérnia')), 'ficha: instrutora vê saúde autorizada');
  await clica('#sheet [data-act=fechar]');

  // aluna
  await clica('.topbar [data-act=logo]', 700);
  await clica('[data-act=entrar][data-v=aluno][data-who=a01]', 900); await shot('25-aluna-inicio'); await overflow('aluna');
  const chips = await page.$$eval('[data-act=alunoAtv]', c => c.map(x => x.dataset.v)); conf(!chips.includes('formacao'), 'aluna: sem menu Formação');
  await page.locator('.card.pontos').scrollIntoViewIfNeeded(); await espera(500); await shot('26-aluna-pontos');
  const antes = await page.evaluate(() => pontosAluno(S,'a01').total);
  await clica('[data-act=instalarApp]', 600); await shot('27-instalar'); await clica('[data-act=instalouDemo]', 600);
  await clica('[data-act=ativarAvisos]', 900); await shot('28-avisos-ligados');
  const depois = await page.evaluate(() => pontosAluno(S,'a01').total); conf(depois - antes === 70, `pontos: +${depois - antes} (instalar + avisos)`);
  await clica('[data-act=trocarPontos]', 600); await shot('29-trocar'); await clica('#sheet [data-act=fechar]');
  await clica('[data-act=sino]', 600); await shot('30-sino-aluna');
  conf(await page.locator('#sheet').innerText().then(t => t.includes('Roda de mantras')), 'aluna: aviso do evento novo no sino');
  await clica('#sheet [data-act=irAviso][data-v=eventos]', 900); await shot('31-aluna-eventos');
  await clica('[data-act=queroIr]', 600); await clica('[data-act=reservaEv][data-x="1"]', 700);
  conf(await page.evaluate(() => S.eventos.some(e => e.inscritos.some(i => i.a === 'a01' && i.aviso && !i.pago))), 'aluna: inscrita no evento, pagamento aguarda a administração');
  await shot('32-aluna-evento-ok');
  // a ficha da própria aluna
  await page.evaluate(() => { const a = alunoPor(S,'a12'); });
  await clica('.topbar [data-act=logo]', 600); await clica('[data-act=entrar][data-v=aluno][data-who=a12]', 900);
  await page.locator('[data-act=verMinhaFicha]').scrollIntoViewIfNeeded(); await clica('[data-act=verMinhaFicha]', 700); await shot('33-minha-ficha');
  await clica('.opt[data-grp=iExp][data-v=ja]'); await page.fill('#iEmerg', 'Rui'); await page.fill('#iEmergTel', '(41) 9 9999-0000');
  await clica('[data-act=salvarMinhaFicha]', 700); conf(await page.evaluate(() => !!S.pontosAcoes.a12?.ficha && alunoPor(S,'a12').ficha.completa), 'ficha própria: salva e dá pontos');

  // Google Forms CSV
  await clica('.topbar [data-act=logo]', 600); await clica('[data-act=entrar][data-v=admin][data-who=vitor]', 900);
  const csv = 'Carimbo de data/hora,Nome completo,WhatsApp,E-mail,Data de nascimento,Qual atividade?,Como conheceu o Espaço?,Alguma restrição de saúde?\n"29/10/2026 09:12:00","Rita Moura","(41) 99111-2222","rita@x.com","03/02/1988","Yoga","Instagram","Não"\n"29/10/2026 09:40:00","Caio Lima, Jr.","(41) 99333-4444","","15/07/1990","Aquarela","Indicação","Asma"\n';
  fs.writeFileSync(path.join(OUT, 'forms.csv'), csv);
  await page.setInputFiles('#csvForms', path.join(OUT, 'forms.csv')); await espera(900); await shot('34-csv');
  conf(await page.evaluate(() => S.inscricoes.filter(i => i.origem === 'forms').length === 2 && S.inscricoes.some(i => i.dados.nome === 'Caio Lima, Jr.' && i.dados.atv === 'aquarela' && i.dados.temSaude === 'sim')), 'Google Forms: importou 2 com vírgula, atividade e saúde');


  // pagamento: aluno só avisa, administração dá baixa
  await clica('.topbar [data-act=logo]', 600); await clica('[data-act=entrar][data-v=aluno][data-who=a12]', 900);
  await clica('.bnav [data-v=plano]', 800); await clica('#root [data-act=pagar]', 700); await shot('37-aluno-pagar');
  const antesPg = await page.evaluate(() => S.pagamentos.length);
  await clica('#sheet [data-act=confirmarPag]', 800); await shot('38-aluno-avisou');
  conf(await page.evaluate(n => S.pagamentos.length === n && S.avisosPag.some(x => x.a === 'a12' && x.estado === 'aguardando'), antesPg), 'pagamento: aluno avisa, não dá baixa');
  conf(await page.locator('#root .pill').filter({hasText:'Em análise'}).count() > 0, 'pagamento: aluno vê "em análise"');
  await clica('.topbar [data-act=logo]', 600); await clica('[data-act=entrar][data-v=admin][data-who=dessa]', 900);
  await page.locator('.alert', {hasText:'pagamentos para confirmar'}).first().click(); await espera(900); await shot('39-admin-confirmar');
  conf(await page.locator('#root [data-act=darBaixa]').count() === 2, 'pagamento: 2 para confirmar na lista');
  await clica('#root [data-act=darBaixa]', 800);
  conf(await page.evaluate(() => S.pagamentos.some(p => p.baixaPor === 'Dessa')), 'pagamento: baixa registrada com quem deu');
  await clica('#root [data-act=recusarAviso]', 800);
  conf(await page.evaluate(() => S.avisosPag.filter(x => x.estado === 'aguardando').length === 0), 'pagamento: "não caiu" tira da fila');

  // backup em Excel
  await clica('[data-act=mensVis][data-v=regras]', 800); await page.locator('[data-act=baixarBackup]').scrollIntoViewIfNeeded(); await espera(300); await shot('40-backup-card');
  const [bk] = await Promise.all([page.waitForEvent('download', {timeout:15000}).catch(() => null), clica('[data-act=baixarBackup]', 1500)]);
  conf(bk && bk.suggestedFilename() === 'Anirvana-backup-2026-10.xlsx', 'backup: baixa ' + (bk ? bk.suggestedFilename() : 'nada'));
  if (bk) await bk.saveAs(path.join(OUT, 'Anirvana-backup-2026-10.xlsx'));

  // desktop
  await page.setViewportSize({width:1280, height:860}); await clica('[data-act=tab][data-v=divulgar]', 900); await shot('35-desktop-divulgar');
  await clica('.rail [data-act=logo]', 700); conf(await page.locator('.door').count() === 1, 'logo do menu lateral: volta para a entrada'); await shot('36-desktop-porta');

  console.log('OK:', ok.length); ok.forEach(t => console.log('  ✓', t));
  console.log('FALHAS:', falhas.length); falhas.forEach(t => console.log('  ✗', t));
  console.log('ERROS JS:', erros.length ? erros.join('\n') : 'nenhum');
  await b.close();
})().catch(e => { console.error('QUEBROU:', e.message.split('\n')[0]); process.exit(1); });

// Dúvidas da Dessa (24/11): valores em Mensalidades, gestante 1-3x, pacotes, desconto, lançamentos, categorias, aula avulsa, voltar, rolagem dos submenus
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), p = await b.newPage({viewport:{width:390,height:844}}); const er = [], ok = [], f = []; const conf = (c, m) => (c ? ok : f).push(m);
  p.on('pageerror', e => er.push(e.message));
  const w = ms => p.waitForTimeout(ms), clica = async (s, ms = 300) => { await p.click(s); await w(ms); };
  await p.goto('file:///home/user/anirvana-app/dist/anirvana/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await w(400);
  await p.evaluate(() => { ACT.entrar({v:'admin', who:'dessa'}); }); await w(300);
  // ----- valores em Mensalidades → Regras -----
  await p.evaluate(() => { UI.mensVis = 'regras'; ir('admin', 'mensalidades'); }); await w(300);
  conf(/Mensalidade das outras atividades/.test(await p.textContent('#root')) && await p.$('[data-act-in=precoAtv][data-atv=gestantes][data-k="3x"]'), 'Regras: valores de todas as atividades, gestante 1x/2x/3x');
  await p.fill('[data-act-in=precoAtv][data-atv=gestantes][data-k="2x"]', '180,00'); await p.dispatchEvent('[data-act-in=precoAtv][data-atv=gestantes][data-k="2x"]', 'change'); await w(200);
  conf(await p.evaluate(() => S.regras.planosAtv.gestantes['2x'] === 180), 'gestante 2x = R$ 180');
  const antes = await p.evaluate(() => S.alunos.filter(a => a.mats.some(m => m.atv === 'aquarela' && m.valor === 240)).length);
  await p.evaluate(() => { S.atividades.aquarela = {...(S.atividades.aquarela || {}), valor:240}; ligarAtividades(); reRender(); }); await w(200);
  await p.fill('[data-act-in=precoAtv][data-atv=aquarela]', '260,00'); await p.dispatchEvent('[data-act-in=precoAtv][data-atv=aquarela]', 'change'); await w(200);
  conf(await p.evaluate(n => S.alunos.filter(a => a.mats.some(m => m.atv === 'aquarela' && m.valor === 260)).length === n && ATIV.aquarela.valor === 260, antes), `aquarela: novo valor vale para quem pagava o valor antigo (${antes})`);
  // ----- pacote -----
  await clica('[data-act=pacote]:not([data-v])', 400); await p.fill('#pkNome', 'Trimestral yoga 2x'); await p.selectOption('#pkPlano', '2x'); await p.selectOption('#pkMeses', '3'); await p.fill('#pkValor', '450,00'); await clica('#fPacote button[type=submit]', 300);
  conf(await p.evaluate(() => S.pacotes.length === 1 && S.pacotes[0].meses === 3 && S.pacotes[0].valor === 450), 'pacote criado: 3 meses por R$ 450');
  const mat = await p.evaluate(() => { const a = S.alunos.find(a => a.mats.some(m => m.plano === '2x' && statusPagamento(S, a, m).st === 'atrasado')); return a && a.mats.find(m => m.plano === '2x').id; });
  await p.evaluate(m => folhaReceber(m), mat); await w(300);
  conf(await p.$('.opt[data-grp=rPac]'), 'receber: escolher 1 mês ou o pacote');
  await clica('.opt[data-grp=rPac]:not([data-v=""])', 200); await clica('#fReceber button[type=submit]', 300);
  const pk = await p.evaluate(m => { const a = S.alunos.find(a => a.mats.some(x => x.id === m)), x = a.mats.find(y => y.id === m); const pg = S.pagamentos.find(p => p.mat === m && p.meses === 3); return {meses:pg && pg.meses, valor:pg && pg.valor, st:[MES_ATUAL, somaMes(MES_ATUAL, 1), somaMes(MES_ATUAL, 2), somaMes(MES_ATUAL, 3)].map(ms => statusPagamento(S, a, x, ms).st), div:pagamentosDoMes(S, somaMes(MES_ATUAL, 1)).filter(p => p.mat === m).map(p => p.valor)}; }, mat);
  conf(pk.meses === 3 && pk.valor === 450 && pk.st.slice(0, 3).every(s => s === 'pago') && pk.st[3] !== 'pago' && pk.div[0] === 150, 'pacote: 3 meses pagos, o 4º não; cada mês conta R$ 150 · ' + JSON.stringify(pk));
  // ----- desconto do aluno -----
  await p.evaluate(m => folhaAjuste(m), mat); await w(300);
  await p.fill('#ajV', '10'); await p.fill('#ajMot', 'irmãos'); await clica('#fAjuste button[type=submit]', 300);
  conf(await p.evaluate(m => { const x = S.alunos.flatMap(a => a.mats).find(y => y.id === m); return valorMat(S, x) === 144 && x.ajuste.motivo === 'irmãos'; }, mat), 'desconto de 10%: R$ 160 → R$ 144');
  await p.evaluate(m => folhaAjuste(m), mat); await w(200); await clica('.opt[data-grp=ajTipo][data-v=valor]', 100); await p.fill('#ajV', '120'); await clica('#fAjuste button[type=submit]', 300);
  conf(await p.evaluate(m => valorMat(S, S.alunos.flatMap(a => a.mats).find(y => y.id === m)) === 120, mat), 'valor próprio: R$ 120');
  await p.evaluate(m => folhaAjuste(m), mat); await w(200); await clica('[data-act=ajusteTirar]', 300);
  conf(await p.evaluate(m => valorMat(S, S.alunos.flatMap(a => a.mats).find(y => y.id === m)) === 160, mat), 'tirar o ajuste: volta a R$ 160');
  const aid = await p.evaluate(m => S.alunos.find(a => a.mats.some(x => x.id === m)).id, mat);
  await p.evaluate(a => folhaAluno(a, 'admin'), aid); await w(300);
  conf(await p.$('#sheet [data-act=ajusteMat]'), 'ficha do aluno: botão "Ajustar valor"'); await p.evaluate(() => fecharFolha());
  // ----- balanço: corrigir lançamento e categorias -----
  await p.evaluate(() => { UI.balVis = 'mes'; UI.balMes = MES_ATUAL; ir('admin', 'balanco'); }); await w(300);
  const lid = await p.getAttribute('[data-act=editarLanc]', 'data-v');
  await clica(`[data-act=editarLanc][data-v="${lid}"]`, 300); await p.fill('#lValor', '99,90'); await clica('#fLanc button[type=submit]', 300);
  conf(await p.evaluate(id => S.lanc.find(l => l.id === id).valor === 99.9, lid), 'corrigir lançamento: valor novo');
  await clica(`[data-act=editarLanc][data-v="${lid}"]`, 300); await clica('[data-act=lancDel]', 300);
  conf(await p.evaluate(id => !S.lanc.some(l => l.id === id), lid), 'apagar lançamento');
  await clica('.pagehead [data-act=editarCats]', 300); await p.fill('#catNome', 'Retiros'); await clica('.opt[data-grp=catTipo][data-v=ambos]', 100); await clica('#fCat button[type=submit]', 300);
  conf(await p.evaluate(() => !!CAT_ENTRADA.Retiros && !!CAT_SAIDA.Retiros && gruposCat().some(g => g.id === 'Retiros' && g.tipo === 'ambos')), 'categoria nova "Retiros" (entrada e saída) entra nos gráficos');
  const nLimp = await p.evaluate(() => S.lanc.filter(l => l.cat === 'Limpeza' && !(S.fechados || {})[mesDe(l.d)]).length);
  await clica('[data-act=catRen][data-v="Limpeza"]', 300); await p.fill('#crNome', 'Limpeza e higiene'); await clica('#fCatRen button[type=submit]', 300);
  conf(await p.evaluate(n => !CAT_SAIDA.Limpeza && !!CAT_SAIDA['Limpeza e higiene'] && S.lanc.filter(l => l.cat === 'Limpeza e higiene').length === n, nLimp), `renomear categoria leva os ${nLimp} lançamentos junto`);
  await clica('[data-act=catTirar][data-v="Cantina"]', 300);
  conf(await p.evaluate(() => !CAT_SAIDA.Cantina && !gruposCat().some(g => g.id === 'Cantina') && S.lanc.some(l => l.cat === 'Cantina')), 'tirar categoria: some das listas, lançamentos ficam');
  await p.evaluate(() => fecharFolha());
  // ----- chamada: aula avulsa com WhatsApp e pagamento -----
  await p.evaluate(() => { ACT.entrar({v:'instrutor', who:'sara'}); UI.codigoOk.sara = S.codigos.sara.v; ACT.entrar({v:'instrutor', who:'sara'}); folhaChamada('2026-10-29_qui1900'); }); await w(300);
  conf(/Aula avulsa ou visitante/.test(await p.textContent('#sheet')) && await p.$('#visTel') && await p.$('.opt[data-grp=visPago]'), 'chamada: caixinha "Aula avulsa ou visitante" com WhatsApp e pagamento');
  await p.fill('#visNome', 'Rita Avulsa'); await p.fill('#visTel', '(41) 99888-7777'); await clica('.opt[data-grp=visPago][data-v=dinheiro]', 100); await clica('[data-act=visitAdd]', 200);
  await p.fill('#visNome', 'Leo Depois'); await clica('.opt[data-grp=visPago][data-v=depois]', 100); await clica('[data-act=visitAdd]', 200);
  await clica('#sheet [data-act=salvarChamada]:not([data-v])', 400);
  const av = await p.evaluate(() => ({pg:S.pagamentos.filter(p => p.avulsa && p.s === '2026-10-29_qui1900').map(p => p.nome + ':' + p.metodo + ':' + p.valor), pr:S.presencas.filter(p => p.s === '2026-10-29_qui1900' && !p.a).map(p => p.nome + ':' + (p.tel || '') + ':' + p.pago)}));
  conf(av.pg.join() === 'Rita Avulsa:dinheiro:45' && av.pr.includes('Leo Depois::depois') && av.pr.includes('Rita Avulsa:(41) 99888-7777:dinheiro'), 'avulsa paga vira pagamento; a outra fica para receber · ' + JSON.stringify(av));
  await p.evaluate(() => { ACT.entrar({v:'admin', who:'dessa'}); UI.mensVis = 'alunos'; ir('admin', 'mensalidades'); }); await w(300);
  conf(/Aulas avulsas de outubro/.test(await p.textContent('#root')) && /1 para receber/.test(await p.textContent('#root')), 'Mensalidades: aulas avulsas do mês, 1 para receber');
  await clica('[data-act=avulsaReceber]', 300);
  conf(await p.evaluate(() => S.pagamentos.some(p => p.avulsa && p.nome === 'Leo Depois')), 'administração marca "Recebi"');
  // ----- inscrição: gestante 1x, 2x, 3x -----
  await p.evaluate(() => { ACT.sair(); ACT.inscricao(); }); await w(300); await clica('.atv-card[data-v=gestantes]', 300);
  const g = await p.textContent('#sheet');
  conf(await p.$$eval('.opt[data-grp=iPlano]', x => x.length) === 3 && /R\$ 180,00/.test(g), 'inscrição de gestante: planos 1x, 2x e 3x (2x R$ 180)');
  await p.evaluate(() => fecharFolha());
  // ----- setinha de voltar -----
  await p.evaluate(() => { ACT.entrar({v:'admin', who:'dessa'}); }); await w(300);
  await clica('.bnav [data-v=balanco]', 300); await clica('.bnav [data-v=lojinha]', 400);
  conf(await p.$('.topbar [data-act=voltar]'), 'setinha de voltar aparece');
  await clica('.topbar [data-act=voltar]', 400);
  conf(await p.evaluate(() => UI.tab.admin) === 'balanco', 'setinha volta para a tela anterior (Balanço)');
  await p.goBack(); await w(400);
  conf(await p.evaluate(() => UI.role === 'admin' && UI.tab.admin === 'inicio'), 'botão voltar do celular também volta (Início)');
  // ----- submenus que rolam de lado não voltam para o começo -----
  await p.evaluate(() => { UI.mensVis = 'alunos'; UI.mensSt = 'todos'; ir('admin', 'mensalidades'); }); await w(300);
  const sl = await p.evaluate(() => { const c = document.querySelectorAll('#root .chips')[0]; c.scrollLeft = 400; return c.scrollLeft; });
  await clica('#root .chips [data-act=mensSt][data-v=pago]', 300);
  const sl2 = await p.evaluate(() => document.querySelectorAll('#root .chips')[0].scrollLeft);
  conf(sl > 50 && sl2 > 50, `submenu continua onde estava depois do toque (${sl} → ${sl2})`);
  console.log('OK', ok.length, 'FALHAS', JSON.stringify(f, null, 1), 'ERROS', JSON.stringify(er)); await b.close(); })();

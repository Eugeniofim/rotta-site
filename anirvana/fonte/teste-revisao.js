// Confere as 10 correções da revisão de código direto no motor do app.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'anirvana.html'), 'utf8');
const PAGE = path.join(__dirname, 'rev.html');
fs.writeFileSync(PAGE, `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto('file://' + PAGE);
  const r = await p.evaluate(() => {
    const out = [], ok = (c, m) => out.push((c ? '✓ ' : '✗ ') + m);
    ok(num('49.90') === 49.9 && num('49,90') === 49.9 && num('1.500,00') === 1500 && num('1.500') === 1500 && isNaN(num('')), 'números: 49.90 / 49,90 / 1.500,00 / vazio');
    S.regras.pct.yoga = .6;
    const fy = fechamentoYoga(S, '2026-10'), rec = receitaMes(S, '2026-10');
    ok(Math.abs(fy.pool - fy.bruto*.6) < .01 && Math.abs(rec.linhas.find(l => l.atv === 'yoga').instr - fy.pool) < .02, 'Regras 60%: fechamento e balanço batem');
    ok(Math.abs(fechamentoYoga(S, '2026-01').linhas.find(l => l.id === 'kamala').total - 1346.63) < .01, 'janeiro da planilha continua igual (R$ 1.346,63)');
    S.regras.pct.yoga = .7;
    S.alunos.push({id:'z1', nome:'Teste Particular', desde:HOJE_ISO, mats:[{id:'z1-0', atv:'particular', plano:null, valor:245, turmas:[], venc:5, metodo:'pix', instr:null, status:'ativo'}]});
    S.pagamentos.push({id:'pz', a:'z1', mat:'z1-0', mes:MES_ATUAL, valor:245, d:HOJE_ISO, metodo:'pix'});
    let crash = false; try { repassesEquipe(S, MES_ATUAL); alertasAdmin(S); } catch(e){ crash = e.message; }
    ok(!crash, 'particular sem professor não derruba o app' + (crash ? ': ' + crash : ''));
    S.alunos.push({id:'z2', nome:'Teste Novo', desde:HOJE_ISO, mats:[{id:'z2-0', atv:'yoga', plano:'2x', valor:null, turmas:['seg1830'], venc:28, metodo:'pix', instr:null, status:'ativo'}]});
    const st = statusPagamento(S, alunoPor(S,'z2'), alunoPor(S,'z2').mats[0]);
    ok(st.st === 'avencer' && st.venc === '2026-11-28', 'aluno novo com vencimento dia 28 não nasce atrasado: ' + st.txt);
    const m = alunoPor(S,'a01').mats[0]; const p1 = proximaCobranca(S, m);
    S.pagamentos.push({id:'pa1', a:'a01', mat:m.id, mes:p1.slice(0,7), valor:160, d:HOJE_ISO, metodo:'pix'});
    const p2 = proximaCobranca(S, m);
    ok(p1.slice(0,7) === '2026-11' && p2.slice(0,7) === '2026-12', `adiantar 2x: ${p1} → ${p2}`);
    const antes = repassesEquipe(S, MES_ATUAL).find(x => x.id === 'kamala').total;
    S.descontos = [{id:'d1', p:'kamala', mes:MES_ATUAL, valor:139, desc:'1 bolsa indiana'}];
    const depois = repassesEquipe(S, MES_ATUAL).find(x => x.id === 'kamala').total;
    ok(Math.abs(antes - depois - 139) < .01, 'descontar do repasse: Kamala recebe R$ 139 a menos');
    S.subs.push({id:'sx', turma:'qua1830', d:'2026-11-04', de:'sara', para:null, pedidoPara:'anajulia', motivo:'x', status:'aberto'});
    ok(!pedidosPara('kamala').some(s => s.id === 'sx') && pedidosPara('anajulia').some(s => s.id === 'sx'), 'pedido para Ana Julia não aparece para a Kamala');
    S.subs.find(s => s.id === 'sb1').recusas = ['kamala'];
    ok(!pedidosPara('kamala').some(s => s.id === 'sb1'), '"Não posso" tira o pedido da lista');
    const camila = alunoPor(S, 'a04');
    ok(matsVisiveis(camila, 'kamala').every(m => m.atv === 'yoga') && matsVisiveis(camila, 'bruno').every(m => m.atv === 'aquarela'), 'Kamala não vê a aquarela da Camila; Bruno não vê a yoga');
    const el = document.createElement('div'); el.innerHTML = '<span class="field" hidden>x</span>'; document.body.appendChild(el);
    ok(getComputedStyle(el.firstChild).display === 'none', '[hidden] esconde campo .field');
    avisar('<img src=x onerror="window.__xss=1">');
    ok(!document.querySelector('#toast img'), 'aviso escapa o texto digitado');
    return out;
  });
  console.log(r.join('\n')); console.log(erros.length ? 'ERROS: ' + erros.join(' | ') : 'sem erros de script');
  await b.close();
})();

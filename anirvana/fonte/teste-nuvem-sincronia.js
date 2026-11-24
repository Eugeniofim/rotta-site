// Sincronia de verdade (sala anirvana): dois computadores da administração, celular de instrutor, celular de aluno e inscrição pelo link
const { chromium } = require('playwright');
const APP = 'file:///home/user/anirvana-app/dist/anirvana/index.html', COD = process.env.COD;
const ok = [], falhas = [], erros = [];
const conf = (cond, txt) => (cond ? ok : falhas).push(txt);
const espera = ms => new Promise(r => setTimeout(r, ms));
async function ate(p, fn, arg, max = 15000){ const t0 = Date.now(); while (Date.now() - t0 < max){ try { if (await p.evaluate(fn, arg)) return true; } catch(e){} await espera(250); } return false; }
(async () => {
  const b = await chromium.launch({proxy:{server:process.env.HTTPS_PROXY}});
  const novo = async (nome, w = 390) => { const c = await b.newContext({viewport:{width:w, height:860}}); const p = await c.newPage(); p.on('pageerror', e => erros.push(`${nome}: ${e.message}`)); await p.goto(APP); await p.waitForTimeout(300); return {c, p}; };
  const emDia = p => ate(p, () => EM_DIA && !Object.keys(FILA).length && NUVEM.estado === 'ok', null, 30000);

  /* A: primeiro computador da administração (banco vazio) */
  const A = await novo('A', 1280);
  conf(await A.p.evaluate(() => !!document.querySelector('[data-login="adminCodigo"]') && !document.querySelector('.dicas-proto') && !document.querySelector('.proto')), 'porta valendo: código de acesso, sem dicas de protótipo');
  await A.p.fill('#loginAdm', 'xxxxx-yyyyy'); await A.p.click('[data-login="adminCodigo"] button[type=submit]');
  conf(await ate(A.p, () => /não confere/i.test(document.querySelector('#admMsg').textContent)), 'código errado é recusado');
  await A.p.fill('#loginAdm', COD.toLowerCase()); await A.p.click('[data-login="adminCodigo"] button[type=submit]');
  conf(await emDia(A.p), 'A entrou e subiu o catálogo');
  conf(await A.p.evaluate(() => UI.role === 'admin' && S.alunos.length === 0 && S.lanc.length === 0 && S.vendas.length === 0 && S.inscricoes.length === 0 && S.eventos.length === 0), 'app valendo começa sem nada de exemplo');
  conf(await A.p.evaluate(() => HOJE_ISO === new Date().toISOString().slice(0, 10) || Math.abs(new Date(HOJE_ISO) - new Date()) < 2 * 864e5), 'data de hoje de verdade');
  conf(await A.p.evaluate(() => !!document.querySelector('#nuvemSt')), 'pontinho da nuvem no topo');

  /* A cadastra uma aluna (com celular e nascimento) e recebe um pagamento */
  await A.p.evaluate(() => { S.alunos.push({id:'aT1', nome:'Teste Sincronia', desde:HOJE_ISO, obs:'', status:'ativo', tel:'(41) 99111-2233', nasc:'1990-05-17', cpf:'000.000.000-00', email:'t@t.com', mats:[{id:'aT1-0', atv:'yoga', plano:'2x', valor:null, turmas:['ter1900','qui1900'], venc:10, metodo:'pix', cartaoFim:null, instr:null, status:'ativo'}]}); salvar(); });
  conf(await emDia(A.p), 'aluna subiu');

  /* B: segundo computador entra e recebe tudo */
  const B = await novo('B', 1280);
  await B.p.fill('#loginAdm', COD); await B.p.click('[data-login="adminCodigo"] button[type=submit]');
  conf(await emDia(B.p), 'B entrou');
  conf(await B.p.evaluate(() => !!alunoPor(S, 'aT1') && S.equipe.length >= 6 && Object.keys(S.codigos).length >= 6), 'B recebeu a aluna, a equipe e os PINs');

  /* B mexe -> A vê sozinho */
  await B.p.evaluate(() => { alunoPor(S, 'aT1').nome = 'Teste Sincronia Editada'; S.pagamentos.push({id:'pgT1', a:'aT1', mat:'aT1-0', mes:MES_ATUAL, valor:160, d:HOJE_ISO, metodo:'pix'}); salvar(); });
  conf(await ate(A.p, () => alunoPor(S, 'aT1')?.nome === 'Teste Sincronia Editada' && S.pagamentos.some(p => p.id === 'pgT1'), null, 25000), 'A recebeu a edição e o pagamento de B sem fazer nada');

  /* os dois mexem ao mesmo tempo em coisas diferentes: nada se perde */
  await Promise.all([A.p.evaluate(() => { S.lanc.push({id:'lA', tipo:'saida', d:HOJE_ISO, valor:10, desc:'de A', cat:'Manutenção'}); salvar(); }), B.p.evaluate(() => { S.lanc.push({id:'lB', tipo:'saida', d:HOJE_ISO, valor:20, desc:'de B', cat:'Manutenção'}); salvar(); })]);
  const doisLados = () => S.lanc.some(l => l.id === 'lA') && S.lanc.some(l => l.id === 'lB');
  conf(await ate(A.p, doisLados, null, 25000) && await ate(B.p, doisLados, null, 25000), 'mexendo os dois ao mesmo tempo, os dois ficam com tudo');

  /* apagar em A some em B */
  await A.p.evaluate(() => { S.lanc = S.lanc.filter(l => l.id !== 'lA'); salvar(); });
  conf(await ate(B.p, () => !S.lanc.some(l => l.id === 'lA'), null, 25000), 'apagou em A, sumiu em B');

  /* sem internet: guarda na fila e sobe quando voltar */
  await A.c.setOffline(true);
  await A.p.evaluate(() => { S.lanc.push({id:'lOff', tipo:'entrada', d:HOJE_ISO, valor:30, desc:'offline', cat:'Extra'}); salvar(); });
  await espera(2500);
  conf(await A.p.evaluate(() => Object.keys(FILA).length > 0), 'offline: ficou na fila');
  await A.c.setOffline(false); await A.p.evaluate(() => dispatchEvent(new Event('online')));
  conf(await ate(B.p, () => S.lanc.some(l => l.id === 'lOff'), null, 25000), 'internet voltou: subiu e B recebeu');

  /* lápis da grade: A muda a casa e a hora; B vê */
  await A.p.evaluate(() => { UI.escolaVis = 'horarios'; ir('admin', 'escola'); });
  conf(await A.p.evaluate(() => document.querySelectorAll('.slot-ed').length > 5), 'grade com lápis em cada horário');
  await A.p.evaluate(() => folhaTurma('ter1900')); await A.p.fill('#tuHora', '19:15'); await A.p.fill('#tuSala', 'Casa Luz'); await A.p.click('#fTurma button[type=submit]');
  conf(await ate(B.p, () => TURMA.ter1900 && TURMA.ter1900.h === '19:15' && TURMA.ter1900.sala === 'Casa Luz', null, 25000), 'horário editado em A apareceu em B');

  /* C: celular da instrutora (PIN de verdade, vindo do banco) */
  const pin = await A.p.evaluate(() => S.codigos.sara.c);
  const C = await novo('C');
  await C.p.fill('#loginPin', '000000'); await C.p.click('[data-login="instrutor"] button[type=submit]');
  conf(await ate(C.p, () => /não confere/i.test(document.querySelector('#pinMsg').textContent)), 'PIN errado recusado');
  await C.p.fill('#loginPin', pin); await C.p.click('[data-login="instrutor"] button[type=submit]');
  conf(await emDia(C.p), 'instrutora entrou com o PIN');
  const vC = await C.p.evaluate(() => ({role:UI.role, who:UI.who.instrutor, cpf:(alunoPor(S, 'aT1') || {}).cpf, email:(alunoPor(S, 'aT1') || {}).email, temAluna:!!alunoPor(S, 'aT1'), lanc:S.lanc.length, insc:S.inscricoes.length, pinOutro:(S.codigos.kamala || {}).c, pinMeu:(S.codigos.sara || {}).c}));
  conf(vC.role === 'instrutor' && vC.who === 'sara', 'instrutora no painel dela');
  conf(vC.temAluna && vC.cpf === undefined && vC.email === undefined, 'instrutora vê a aluna sem CPF e sem e-mail');
  conf(vC.lanc === 0 && vC.insc === 0, 'instrutora não recebe o balanço nem as inscrições');
  conf(vC.pinOutro === undefined && vC.pinMeu === pin, 'instrutora não vê o PIN dos colegas');
  await C.p.evaluate(() => { ir('admin', 'inicio'); });
  conf(await C.p.evaluate(() => UI.role === 'instrutor'), 'instrutora não consegue abrir o painel da administração');
  /* chamada no celular dela -> administração vê */
  await C.p.evaluate(() => { const sid = `${HOJE_ISO}_qui1900`; S.aulas[sid] = {id:sid, d:HOJE_ISO, turma:'qui1900', instr:'sara', feita:true, vazia:false, sub:false}; S.presencas.push({s:sid, a:'aT1', t:'2x'}); salvar(); });
  conf(await ate(A.p, () => S.presencas.some(p => p.a === 'aT1' && p.s.endsWith('_qui1900')), null, 25000), 'chamada feita no celular da instrutora chegou na administração');
  /* instrutora tentando gravar no balanço: o banco recusa */
  const neg = await C.p.evaluate(async () => (await rpc('enviar', {p_token:SESSAO.token, p_itens:[{c:'lanc', i:'lHack', d:{id:'lHack', valor:1}}]})).negados.length);
  conf(neg === 1, 'banco recusa instrutora gravando no balanço');

  /* D: celular da aluna (celular + nascimento) */
  const D = await novo('D');
  await D.p.fill('#loginCel', '41991112233'); await D.p.click('[data-login="aluno"] button[type=submit]');
  await D.p.waitForSelector('#nascIn'); await D.p.fill('#nascIn', '1990-05-18'); await D.p.click('[data-login="nasc"] button[type=submit]');
  conf(await ate(D.p, () => /Não achamos/.test(document.querySelector('#sheet').textContent)), 'nascimento errado recusado');
  await D.p.fill('#nascIn', '1990-05-17'); await D.p.click('[data-login="nasc"] button[type=submit]');
  conf(await emDia(D.p), 'aluna entrou');
  const vD = await D.p.evaluate(() => ({role:UI.role, n:S.alunos.length, pag:S.pagamentos.length, lanc:S.lanc.length, cpf:(S.alunos[0] || {}).cpf, codigos:Object.keys(S.codigos).filter(k => S.codigos[k].c).length, txt:document.querySelector('#root').textContent}));
  conf(vD.role === 'aluno' && vD.n === 1 && vD.pag === 1 && vD.lanc === 0, 'aluna vê só a ficha e o pagamento dela');
  conf(vD.cpf === undefined, 'aluna não recebe o CPF pelo app');
  conf(/Teste/.test(vD.txt), 'painel da aluna aberto com o nome dela');

  /* E: inscrição pelo link, sem entrar */
  const E = await novo('E');
  const ins = await E.p.evaluate(async () => rpc('inscrever', {p_dados:{atv:'yoga', nome:'Inscrição Teste', tel:'(41) 99000-1111', nasc:'1980-01-01'}}));
  conf(ins && ins.ok, 'inscrição pelo link foi para o banco');
  conf(await ate(A.p, () => S.inscricoes.some(i => i.dados && i.dados.nome === 'Inscrição Teste'), null, 25000), 'administração recebeu a inscrição nova');

  /* recarregar A: continua igual, sem repetir nem perder */
  const antes = await A.p.evaluate(() => JSON.stringify([S.alunos.length, S.lanc.length, S.pagamentos.length, S.presencas.length]));
  await A.p.reload(); await A.p.waitForTimeout(500); await emDia(A.p);
  const depois = await A.p.evaluate(() => JSON.stringify([S.alunos.length, S.lanc.length, S.pagamentos.length, S.presencas.length]));
  conf(antes === depois && await A.p.evaluate(() => UI.role === 'admin'), 'reabrir o app: mesmo painel e mesmos dados');

  /* sair deste aparelho: o acesso acaba e os dados saem do aparelho */
  await D.p.evaluate(() => ACT.sairAparelho()); await espera(1500);
  conf(await D.p.evaluate(() => !SESSAO && UI.role === null && S.alunos.length === 0 && !!document.querySelector('[data-login="aluno"]')), 'sair: volta para a porta sem dados');

  await b.close();
  console.log('OK', ok.length); console.log('FALHAS', JSON.stringify(falhas, null, 1)); console.log('ERROS', JSON.stringify([...new Set(erros)], null, 1));
})();

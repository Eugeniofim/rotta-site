// Trazer a planilha de alunos (.xlsx) para o app: com a planilha FALSA (mesmos defeitos da real)
const { chromium } = require('playwright');
const ARQ = process.argv[2] || __dirname + '/alunos-ficticios.xlsx', REAL = process.argv[3] === 'real';
(async () => { const b = await chromium.launch(), p = await b.newPage({viewport:{width:390,height:844}}); const er = [], ok = [], f = []; const conf = (c, m) => (c ? ok : f).push(m);
  p.on('pageerror', e => er.push(e.message));
  await p.goto('file:///home/user/anirvana-app/dist/anirvana/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  const antes = await p.evaluate(() => { ACT.entrar({v:'admin', who:'dessa'}); ACT.importarForms(); return S.inscricoes.length; }); await p.waitForTimeout(400);
  conf(/xlsx/.test(await p.getAttribute('#csvForms', 'accept')), 'botão aceita .xlsx');
  await p.setInputFiles('#csvForms', ARQ); await p.waitForTimeout(1500);
  const rel = await p.evaluate(() => document.querySelector('#sheet').innerText);
  const ins = await p.evaluate(n => S.inscricoes.slice(n).map(i => i.dados), antes);
  if (REAL){
    console.log('trazidas:', ins.length);
    console.log('conferir:', JSON.stringify(ins.filter(d => d.conferir).map(d => [d.nome, d.conferir])));
    console.log('campos preenchidos (de 18):', JSON.stringify(ins.map(d => ['email','nome','nasc','cpf','tel','motivo','praticou','pressao','coluna','dores','intestino','labirintite','saudeGeral','maisInfo','termos','emergNome','emergTel','imagem'].filter(k => d[k] !== undefined && d[k] !== '' && d[k] !== false).length)));
    console.log('cpf ok:', ins.filter(d => cpfOkNode(d.cpf)).length, '· datas ok:', ins.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d.nasc)).length, '· com pergunta antiga:', ins.filter(d => d.formsExtra).length, '· imagem sim:', ins.filter(d => d.imagem === 'sim').length);
    console.log('ERROS', JSON.stringify(er)); await b.close(); return;
  }
  conf(ins.length === 4 && /4 inscrições trazidas/.test(rel), '4 trazidas (a linha repetida não entra de novo): ' + ins.length);
  conf(/Já estavam no app/.test(rel) && /Ana Teste Exemplo/.test(rel), 'mostra quem já estava');
  const a = ins.find(d => d.nome === 'Ana Teste Exemplo'), bia = ins.find(d => /Beatriz/.test(d.nome)), caio = ins.find(d => d.nome === 'Caio Teste'), dani = ins.find(d => d.nome === 'Dani Teste');
  conf(a.cpf === '012.345.678-90', 'CPF ganha de volta o zero da frente: ' + a.cpf);
  conf(a.nasc === '1990-05-04', 'data do Excel vira data: ' + a.nasc);
  conf(a.tel === '(41) 99999-0001' && a.email === 'ana.teste@example.com' && a.termos === true && a.imagem === 'sim' && a.emergNome === 'Rui - marido' && a.emergTel === '(41) 99999-0002', 'telefone, e-mail, termos, imagem e emergência');
  conf(bia.nome === 'Beatriz de Teste Falso', 'nome em maiúsculas fica normal: ' + bia.nome);
  conf(bia.tel === '(41) 99999-0003' && bia.conferir.some(x => /sem DDD/.test(x)), 'celular sem DDD ganha o 41 e vai para conferir');
  conf(bia.conferir.some(x => /emergência/.test(x)) && bia.imagem === '', 'sem emergência: conferir; sem resposta de imagem: não autoriza');
  conf(bia.formsExtra && bia.formsExtra[0][1] === 'Não' && /online/.test(bia.formsExtra[0][0]), 'pergunta antiga do Forms fica guardada na ficha');
  conf(caio.conferir.some(x => /sem o 9/.test(x)), 'celular sem o 9 vai para conferir');
  conf(dani.tel === '(45) 99999-0006' && !dani.conferir, 'outro DDD fica como está');
  conf(/Conferir antes de confirmar \(2\)/.test(rel), 'relatório: 2 para conferir (Beatriz e Caio)');
  await p.click('[data-act=fecharImport]'); await p.waitForTimeout(400);
  conf(/conferir/i.test(await p.textContent('#root')), 'lista de inscrições marca "conferir"');
  const id = await p.evaluate(n => S.inscricoes.slice(n).find(i => /Beatriz/.test(i.dados.nome)).id, antes);
  await p.evaluate(id => ACT.verInscricao({v:id}), id); await p.waitForTimeout(400);
  conf(await p.$('#cPlano') && /celular sem DDD/.test(await p.textContent('#sheet')), 'na ficha: escolher o plano e ver o que conferir');
  await p.click('.opt[data-grp=cPlano][data-v=wellhub]'); await p.click('#sheet [data-act=confirmarInscricao]'); await p.waitForTimeout(400);
  const al = await p.evaluate(() => { const x = S.alunos.find(a => /Beatriz/.test(a.nome)); return x && {plano:x.mats[0].plano, cpf:x.cpf, conf:'conferir' in x.ficha.respostas, extra:!!x.ficha.respostas.formsExtra}; });
  conf(al && al.plano === 'wellhub' && !al.conf && al.extra, 'confirmada como Wellhub, ficha sem a etiqueta "conferir" e com a pergunta antiga: ' + JSON.stringify(al));
  console.log('OK', ok.length, 'FALHAS', JSON.stringify(f, null, 1), 'ERROS', JSON.stringify(er)); await b.close(); })();
function cpfOkNode(s){ const d = String(s || '').replace(/\D/g, ''); if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false; const dv = n => { let t = 0; for (let i = 0; i < n; i++) t += +d[i] * (n + 1 - i); const r = (t * 10) % 11; return r === 10 ? 0 : r; }; return dv(9) === +d[9] && dv(10) === +d[10]; }

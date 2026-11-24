// Pente fino: todas as telas e subtelas no celular (390px) e no computador: erro de script, tela vazando para o lado
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const prob = [], er = []; let n = 0;
  for (const [w, h] of [[390, 844], [360, 740], [1280, 860]]){
    const p = await b.newPage({viewport:{width:w, height:h}}); p.on('pageerror', e => er.push(`${w}px: ${e.message}`));
    await p.goto('file:///home/user/anirvana-app/dist/anirvana-demo/index.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
    const olha = async rot => { n++; await p.waitForTimeout(120); const r = await p.evaluate(() => ({sw:document.documentElement.scrollWidth, iw:innerWidth, sh:document.querySelector('#sheet.on') ? document.querySelector('#sheet').scrollWidth - document.querySelector('#sheet').clientWidth : 0})); if (r.sw > r.iw + 1) prob.push(`${w}px ${rot}: página vaza ${r.sw - r.iw}px para o lado`); if (r.sh > 1) prob.push(`${w}px ${rot}: janela vaza ${r.sh}px para o lado`); };
    await olha('porta');
    const telas = {
      admin:{inicio:[null], balanco:[['balVis','mes'],['balVis','ano'],['balVis','cat']], mensalidades:[['mensVis','alunos'],['mensVis','fechamento'],['mensVis','regras']], lojinha:[['lojaVis','vender'],['lojaVis','produtos'],['lojaVis','vendas'],['lojaVis','fornecedores'],['lojaVis','receber']], escola:[['escolaVis','alunos'],['escolaVis','horarios'],['escolaVis','equipe'],['escolaVis','subs']], atividades:[null], divulgar:[['divVis','escrever'],['divVis','eventos'],['divVis','avisos'],['divVis','pontos']], inscricoes:[null]},
      instrutor:{hoje:[null], agenda:[null], alunos:[null], mes:[null]},
      aluno:{inicio:[['alunoAtv','pratica'],['alunoAtv','eventos'],['alunoAtv','yoga'],['alunoAtv','terapias'],['alunoAtv','aquarela']], aulas:[null], plano:[null], historico:[null]}};
    for (const [role, tabs] of Object.entries(telas)) for (const [tab, subs] of Object.entries(tabs)) for (const sub of subs){
      await p.evaluate(([role, tab, sub]) => { fecharFolha(); if (role === 'instrutor'){ UI.codigoOk.kamala = S.codigos.kamala.v; UI.who.instrutor = 'kamala'; } if (sub){ if (sub[0] === 'divVis') UI.div.vis = sub[1]; else UI[{balVis:'balVis', mensVis:'mensVis', lojaVis:'lojaVis', escolaVis:'escolaVis', alunoAtv:'alunoAtv'}[sub[0]]] = sub[1]; } ir(role, tab); }, [role, tab, sub]);
      await olha(`${role}/${tab}${sub ? '/' + sub[1] : ''}`);
    }
    // janelas mais usadas
    for (const [rot, js] of [['inscrição', "ACT.sair(); ACT.inscricao()"], ['inscrição particular', "document.querySelector('.atv-card[data-v=particular]').click()"], ['chamada', "fecharFolha(); UI.codigoOk.kamala = S.codigos.kamala.v; UI.who.instrutor='kamala'; ir('instrutor','hoje'); folhaChamada('2026-10-29_qui1900')"], ['pagar cartão', "fecharFolha(); UI.who.aluno='a12'; ir('aluno','plano'); folhaPagar(alunoPor(S,'a12').mats[0].id,'cartao')"], ['receber', "fecharFolha(); ir('admin','mensalidades'); folhaReceber(S.alunos[0].mats[0].id)"], ['ajuste', "folhaAjuste(S.alunos[0].mats[0].id)"], ['pacote', "folhaPacote()"], ['categorias', "folhaCategorias()"], ['lançar', "folhaLancar('saida')"], ['ficha aluno', "folhaAluno('a05','admin')"], ['google', "fecharFolha(); ACT.sair(); folhaGoogle()"], ['drive', "folhaDriveConectar()"], ['feriado', "folhaFeriadoNovo()"], ['aviso editar', "folhaEditarAviso('vence')"], ['terapia', "folhaTerapia('tp1')"], ['importar', "folhaImportar()"]]){
      try { await p.evaluate(js); } catch (e) { prob.push(`${w}px ${rot}: ${e.message.slice(0, 80)}`); }
      await olha('janela ' + rot);
    }
    await p.close();
  }
  console.log('telas olhadas:', n); console.log('PROBLEMAS', JSON.stringify(prob, null, 1)); console.log('ERROS', JSON.stringify([...new Set(er)], null, 1)); await b.close(); })();

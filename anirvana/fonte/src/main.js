/* ============================================================
   PORTA, RENDER E AÇÕES
   ============================================================ */
UI.livres = {};

function vPorta(){
  const instrs = ['kamala','anajulia','sara','bruno','brunos','marina','aurelice'];
  const alunosDemo = [['a01','Luana · yoga e meditação'],['a04','Camila · yoga e aquarela'],['a12','Débora · mensalidade atrasada'],['a30','Alice · musicalização']];
  return `<div class="door">
    <div class="raios" aria-hidden="true"></div>
    <div class="door-in">
      <div class="door-head anim-in"><img src="${LOGO_MARK}" alt="Espaço Anirvana"><div class="namaskar">Namaskar!<small>Saúdo o Deus que há em você, com toda a força da minha mente e o amor do meu coração.</small></div>
        <span class="eyebrow">Espaço holístico · ${ESPACO.cidade}</span>
        <h1>A escola inteira<br><em>num lugar só</em></h1>
        <p>Inscrição, aulas, chamada, mensalidades, repasses, lojinha, eventos e balanço. Cada pessoa entra e vê só o que é dela.</p></div>
      <div class="doors">
        <div class="dcard dcard-aluno anim-in" style="animation-delay:60ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--folha),#3E8E6E)">${ic('sprout','lg')}</span><div><h3>Alunos</h3><p>Quem pratica ou quer começar</p></div></div>
          <p>Inscrição em poucos minutos, próximas aulas, frequência, pontos, eventos e o pagamento por Pix ou cartão.</p>
          <button class="btn sol block" data-act="inscricao">${ic('user-plus')}Quero me inscrever</button>
          <div class="eyebrow" style="margin-top:2px">Já sou aluno · entrar como</div>
          <div class="who">${alunosDemo.map(([id,l]) => `<button class="chip" data-act="entrar" data-v="aluno" data-who="${id}">${l}</button>`).join('')}</div></div>
        <div class="dcard anim-in" style="animation-delay:120ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,#B9488E,var(--sol))">${ic('hand-heart','lg')}</span><div><h3>Instrutores</h3><p>Professores e terapeutas</p></div></div>
          <p>Chamada com um toque, ficha de cada aluno, quem anda sumido, troca de aula e quanto vai receber no mês.</p>
          <div class="who">${instrs.map(id => `<button class="chip" data-act="entrar" data-v="instrutor" data-who="${id}">${PESSOA[id].nome}</button>`).join('')}</div></div>
        <div class="dcard anim-in" style="animation-delay:180ms"><div class="top"><span class="ib" style="background:linear-gradient(135deg,var(--sol),var(--acafrao))">${ic('layout-dashboard','lg')}</span><div><h3>Administração</h3><p>Dessa e Vitor</p></div></div>
          <p>Balanço, mensalidades, repasses, lojinha, inscrições novas, eventos e avisos automáticos.</p>
          <div class="who">${ADMINS.map(a => `<button class="btn pri sm" data-act="entrar" data-v="admin" data-who="${a.id}">Entrar como ${a.nome}</button>`).join('')}</div></div>
      </div>
      <p class="citacao">“Que o sol faça chover felicidade! Que nossos animais domésticos sejam abençoados!”<b>Caryacarya I · Shrii Shrii Anandamurti</b></p>
      ${faixaProto('Protótipo navegável. Mensalidades de jan–mar e vendas da lojinha de mar–jul vêm das planilhas reais; nomes de alunos, horários e lançamentos são exemplo. Hoje, na demonstração, é quinta, 29 de outubro de 2026.')}
    </div>
  </div>`;
}

function render(){
  const root = $('#root');
  const y = scrollY;
  if (!UI.role){ root.innerHTML = vPorta(); depois(); return; }
  const v = UI.role === 'admin' ? vAdmin() : UI.role === 'instrutor' ? vInstrutor() : vAluno();
  root.innerHTML = casca(v);
  depois();
  return y;
}
function depois(){
  animarArcos(); ligarGraficos(); ligarCategorias();
  if (UI.role === 'admin' && UI.tab.admin === 'lojinha' && UI.lojaVis === 'vender') ligarLoja();
}
function ir(role, tab, {topo=true}={}){
  if (role) UI.role = role;
  if (tab) UI.tab[UI.role] = tab;
  const h = UI.role ? `${UI.role}-${UI.tab[UI.role]}` : '';
  if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#'+h : location.pathname);
  render(); if (topo) scrollTo({top:0});
}
function lerHash(){
  const h = location.hash.slice(1);
  if (h === 'inscricao'){ UI.abrirInscricao = true; return; }
  if (h.startsWith('evento-')){ UI.role = 'aluno'; UI.tab.aluno = 'inicio'; UI.alunoAtv = 'eventos'; return; }
  const [r, t] = h.split('-');
  if (NAV[r]){ UI.role = r; if (t && NAV[r].some(n => n[0] === t)) UI.tab[r] = t; }
}
const num = s => {
  s = String(s ?? '').replace(/[R$\s]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');          /* 1.500,00 → 1500.00 */
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');      /* 1.500 → 1500 */
  return parseFloat(s);                                                      /* 49.90 → 49.9 */
};
function reRender(){ const y = scrollY; render(); scrollTo({top:y}); }

/* ---------- ações ---------- */
const ACT = {
  entrar:(d) => { fecharFolha(); UI.who[d.v] = d.who; if (d.v === 'aluno'){ UI.alunoAtv = 'pratica'; if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) ganhar('instalar', d.who); } ir(d.v, NAV[d.v][0][0]); },
  tab:(d) => { fecharFolha(); ir(null, d.v); },
  role:(d) => ir(d.v),
  trocar:() => abrirFolha(`${folhaCab('Ver o app como…', 'No app de verdade cada pessoa entra com o próprio login e vê só o painel dela.')}
    <div class="stack">${[['admin','Administração',ADMINS.map(a=>[a.id,a.nome])],['instrutor','Instrutores',EQUIPE.filter(p=>p.id!=='stefy').map(p=>[p.id,p.nome])],['aluno','Alunos',[['a01','Luana'],['a04','Camila'],['a12','Débora'],['a30','Alice'],['a09','Gabriel']]]].map(([r,l,ps]) => `<div><div class="eyebrow" style="margin-bottom:8px">${l}</div><div class="chips" style="flex-wrap:wrap">${ps.map(([id,n]) => `<button class="chip ${UI.role===r&&UI.who[r]===id?'on':''}" data-act="entrar" data-v="${r}" data-who="${id}">${n}</button>`).join('')}</div></div>`).join('')}
    <button class="btn sec" data-act="sair">${ic('log-out')}Voltar para a entrada</button>
    <button class="btn ghost" data-act="reset">${ic('rotate-ccw')}Recomeçar a demonstração</button></div>`),
  sair:() => { fecharFolha(); UI.role = null; history.replaceState(null,'',location.pathname); render(); scrollTo({top:0}); },
  reset:() => { S = semear(); ligarFornecedores(); salvar(); UI.cart = {}; fecharFolha(); render(); avisar('Demonstração recomeçada'); },
  fechar:() => fecharFolha(),
  ir:(d) => { const [r,t] = d.v.split('-'); if (t === 'confirmar'){ UI.mensVis = 'alunos'; UI.mensSt = 'analise'; UI.mensAtv = 'todas'; ir(null,'mensalidades'); return; } if (t === 'alunos'){ UI.escolaVis = 'alunos'; ir(null,'escola'); return; } if (t === 'mais'){ UI.escolaVis = 'subs'; ir(null,'escola'); return; } if (d.sub) UI.lojaVis = d.sub; if (t === 'mensalidades'){ UI.mensVis = 'alunos'; UI.mensSt = 'atrasado'; } ir(null, t); },
  copiar:(d) => { const ok = () => avisar('Copiado'); try{ navigator.clipboard.writeText(d.v).then(ok, () => avisar(d.v,'copy')); }catch(e){ avisar(d.v,'copy'); } },
  opt:(d, el) => {
    $$(`.opt[data-grp="${d.grp}"]`).forEach(o => o.classList.toggle('on', o === el));
    const h = $('#'+d.grp); if (h) h.value = d.v;
    if (d.grp === 'lCat'){ const dica = CAT_SAIDA[d.v]?.dica; const el2 = $('#lDica'); if (el2) el2.textContent = dica || ''; }
    if (d.grp === 'vForma'){ const f = $('#vClienteF'); if (f) f.hidden = !['fiado','descontado'].includes(d.v); }
    if (d.grp === 'iAtv'){ inscSalvar(); UI.insc.d.atv = d.v; UI.insc.d.instr = ''; UI.insc.d.turmas = ''; const y = $('#sheet').scrollTop; folhaInscricao(); $('#sheet').scrollTop = y; return; }
    if (d.grp === 'fnModelo'){ const f = $('#fnPctF'); if (f) f.hidden = d.v !== 'consig'; }
    if (d.grp === 'iTemSaude'){ const f = $('#iSaudeF'); if (f) f.hidden = d.v !== 'sim'; }
    if (d.grp === 'iComo'){ const f = $('#iIndicouF'); if (f) f.hidden = d.v !== 'Indicação'; }
    if (d.grp === 'nAtv'){ $('#nPlanoF').hidden = d.v !== 'yoga'; const fi = $('#nInstrF'); if (fi){ const q = EQUIPE.filter(p => p.atvs.includes(d.v)); fi.hidden = ATIV[d.v].vis !== 'escolhido'; fi.querySelector('.optgrid').innerHTML = q.map(p => `<button type="button" class="opt" data-act="opt" data-grp="nInstr" data-v="${p.id}">${p.nome}</button>`).join(''); $('#nInstr').value = ''; } $('#nTurmas').innerHTML = TURMAS.filter(t => t.atv === d.v && !t.aluno).map(t => `<button type="button" class="opt" data-act="optMulti" data-grp="nTur" data-v="${t.id}">${DIAS[t.dia]} ${t.h}<br><span class="tiny muted">${PESSOA[t.instr].nome}</span></button>`).join('') || '<p class="small muted">Com hora marcada: a terapeuta combina o horário.</p>'; $('#nTur').value = ''; }
  },
  optMulti:(d, el) => { el.classList.toggle('on'); $('#'+d.grp).value = $$(`.opt.on[data-grp="${d.grp}"]`).map(o => o.dataset.v).join(','); },

  /* admin */
  lancar:() => folhaLancar('saida'),
  lancTipo:(d) => folhaLancar(d.v),
  pagarConta:(d) => { const c = CONTAS_FIXAS.find(x => x.id === d.v); S.lanc.push({id:'l'+(S.seq++), tipo:'saida', d:HOJE_ISO, valor:c.valor, desc:c.nome, cat:c.cat, conta:c.id}); salvar(); reRender(); avisar(`${c.nome} paga · ${brl(c.valor)} lançado em ${c.cat}`); },
  balVis:(d) => { UI.balVis = d.v; reRender(); },
  balMes:(d) => { UI.balMes = d.v; reRender(); },
  catFoco:(d) => { UI.catFoco = d.v; const y = scrollY; render(); const c = $('.card.pad-lg'); if (c && matchMedia('(max-width:759px)').matches) c.scrollIntoView({behavior: RM ? 'auto' : 'smooth', block:'start'}); else scrollTo({top:y}); },
  mensVis:(d) => { UI.mensVis = d.v; reRender(); },
  mensSt:(d) => { UI.mensSt = d.v; reRender(); },
  mensAtv:(d) => { UI.mensAtv = d.v; reRender(); },
  fechMes:(d) => { UI.fechMes = d.v; reRender(); },
  receber:(d) => folhaReceber(d.v),
  piso:() => { S.regras.piso = !S.regras.piso; salvar(); reRender(); avisar(S.regras.piso ? 'Piso ligado: ninguém recebe menos que o valor da aula vazia por aula dada' : 'Piso desligado: vale a regra da planilha'); },
  fecharMes:(d) => { (S.fechados = S.fechados || {})[d.v] = HOJE_ISO; (S.backups = S.backups || []).push({mes:d.v, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, por:'automático'}); salvar(); reRender(); avisar(`${nomeMes(d.v)} fechado. O backup em Excel saiu para ${ESPACO.email}.`, 'check'); },
  baixarBackup:() => { try{ const bytes = montarBackup(S, {quem:quemNome()}); baixarArquivo(bytes, nomeBackup(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); (S.backups = S.backups || []).push({mes:MES_ATUAL, d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, por:quemNome()}); salvar(); reRender(); avisar(`Backup baixado: ${nomeBackup()} (${Math.round(bytes.length / 1024)} KB)`, 'download'); }catch(e){ avisar('Não deu para gerar o backup agora: ' + e.message, 'circle-alert'); } },
  darBaixa:(d) => { const x = S.avisosPag.find(v => v.id === d.v), a = alunoPor(S, x.a); if (!S.pagamentos.some(p => p.mat === x.mat && p.mes === x.mes)) S.pagamentos.push({id:'pg'+(S.seq++), a:x.a, mat:x.mat, mes:x.mes, valor:x.valor, d:x.d, metodo:x.metodo, baixaPor:quemNome(), baixaEm:HOJE_ISO}); x.estado = 'confirmado'; x.por = quemNome(); x.em = HOJE_ISO;
    S.caixa = S.caixa || {}; (S.caixa['a:' + x.a] = S.caixa['a:' + x.a] || []).unshift({t:`Pagamento de ${nomeMes(x.mes).toLowerCase()} confirmado`, s:`${brl(x.valor)} · obrigado!`, icon:'check'});
    salvar(); reRender(); avisar(`Baixa dada: ${a.nome.split(' ')[0]} · ${brl(x.valor)} em ${nomeMes(x.mes).toLowerCase()}`, 'check'); },
  recusarAviso:(d) => { const x = S.avisosPag.find(v => v.id === d.v), a = alunoPor(S, x.a); x.estado = 'recusado'; x.por = quemNome(); x.em = HOJE_ISO;
    S.caixa = S.caixa || {}; (S.caixa['a:' + x.a] = S.caixa['a:' + x.a] || []).unshift({t:'Não achamos seu pagamento', s:`O ${x.metodo === 'cartao' ? 'cartão' : 'Pix'} de ${dataBR(x.d)} não apareceu na conta. Fale com o Espaço pelo WhatsApp.`, icon:'circle-alert'});
    salvar(); reRender(); avisar(`${a.nome.split(' ')[0]} vai receber o aviso de que o pagamento não apareceu`, 'bell'); },
  pagarEquipe:(d) => { S.repEquipe.push({id:'re'+(S.seq++), p:d.v, mes:d.mes, d:HOJE_ISO}); salvar(); reRender(); avisar(`Repasse de ${PESSOA[d.v].nome} marcado como pago`); },
  escolaVis:(d) => { UI.escolaVis = d.v; reRender(); },
  escAtv:(d) => { UI.escAtv = d.v; reRender(); },
  verAluno:(d) => folhaAluno(d.v, 'admin'),
  verAlunoI:(d) => folhaAluno(d.v, 'instrutor'),
  verTurma:(d) => { const t = TURMA[d.v]; const al = t.aluno ? [alunoPor(S,t.aluno)] : matriculadosNaTurma(S, d.v); abrirFolha(`${folhaCab(`${nomeTurma(t)} · ${DIAS_L[t.dia]} ${t.h}`, `${PESSOA[t.instr].nome} · ${t.sala}`)}<div class="list">${al.map(a => `<div class="li tap" data-act="verAluno" data-v="${a.id}">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${a.mats.filter(m=>m.turmas.includes(d.v)).map(nomePlano).join('')}</span></div>${pillFreq(freqStatus(S,a))}</div>`).join('')}</div>`); },
  novoAluno:() => folhaNovoAluno(),

  /* lojinha */
  lojaVis:(d) => { UI.lojaVis = d.v; reRender(); },
  lojaForn:(d) => { UI.lojaForn = d.v || null; UI.lojaCat = null; reRender(); },
  lojaCat:(d) => { UI.lojaCat = d.v || null; reRender(); },
  vendasMes:(d) => { UI.vendasMes = d.v; reRender(); },
  addCart:(d, el) => {
    UI.cart[d.v] = (UI.cart[d.v]||0) + 1;
    let q = el.querySelector('.q'); if (!q){ q = document.createElement('span'); q.className = 'q'; el.prepend(q); } q.textContent = UI.cart[d.v];
    const bar = $('#cartbar'); const nb = document.createElement('div'); nb.innerHTML = barraCarrinho(); bar.replaceWith(nb.firstElementChild);
    voar(el);
  },
  itemLivre:() => folhaItemLivre(),
  novoProduto:(d) => folhaProduto(null, d.forn || UI.lojaForn),
  editarProduto:(d) => folhaProduto(d.v),
  removerProduto:(d) => { const p = prodPor(d.v); S.produtos = S.produtos.filter(x => x.id !== d.v); delete UI.cart[d.v]; salvar(); fecharFolha(); reRender(); avisar(`${p.nome} saiu da lojinha. As vendas antigas continuam no histórico.`, 'check'); },
  checkout:() => folhaCheckout(),
  qtd:(d) => { UI.cart[d.v] = Math.max(0, (UI.cart[d.v]||0) + +d.x); if (!itensCarrinho().length){ fecharFolha(); reRender(); return; } folhaCheckout(); },
  registrarVenda:() => {
    const forma = $('#vForma').value, cliente = ($('#vCliente')?.value || '').trim();
    if (['fiado','descontado'].includes(forma) && !cliente){ $('#vCliente').focus(); avisar('Diga quem levou, para cobrar depois','circle-alert'); return; }
    const it = itensCarrinho(), total = r2(it.reduce((s,i) => s + i.total, 0));
    it.forEach(i => S.vendas.push({id:'v'+(S.seq++), d:HOJE_ISO, desc:`${i.q} ${i.nome.toLowerCase()}`, valor:i.total, forma, forn:i.forn, pct:FORN[i.forn].pct, evento:'', fonte:'app', itens:[{p:i.id, q:i.q}]}));
    const descItens = it.map(i => `${i.q} ${i.nome.toLowerCase()}`).join(', ');
    const daEquipe = forma === 'descontado' && EQUIPE.find(p => p.nome.toLowerCase() === cliente.toLowerCase() || p.nome.split(' ')[0].toLowerCase() === cliente.split(' ')[0].toLowerCase());
    if (daEquipe) (S.descontos = S.descontos || []).push({id:'de'+(S.seq++), p:daEquipe.id, mes:MES_ATUAL, valor:total, desc:descItens, d:HOJE_ISO});
    else if (forma === 'fiado' || forma === 'descontado') S.fiado.push({id:'fi'+(S.seq++), cliente, desc:descItens + (forma === 'descontado' ? ' (descontar)' : ''), valor:total, d:HOJE_ISO, pago:false});
    salvar();
    const venda = {d:HOJE_ISO, total, forma, cliente, itens:it.map(i => ({nome:i.nome, q:i.q, total:i.total, forn:i.forn}))};
    UI.cart = {};
    const cb = $('#cartbar'); if (cb){ const nb = document.createElement('div'); nb.innerHTML = barraCarrinho(); cb.replaceWith(nb.firstElementChild); }
    $$('.prod .q').forEach(q => q.remove());
    SHEET_ON_CLOSE = null;
    folhaRecibo(venda);
    SHEET_ON_CLOSE = () => reRender();
  },
  novoForn:() => folhaFornecedor(null),
  editarForn:(d) => folhaFornecedor(d.v),
  desativarForn:(d) => { const f = FORN[d.v], temVenda = S.vendas.some(v => v.forn === f.id); if (temVenda) f.ativo = false; else { S.fornecedores = S.fornecedores.filter(x => x.id !== f.id); S.produtos = (S.produtos || []).filter(p => p.forn !== f.id); } ligarFornecedores(); salvar(); fecharFolha(); reRender(); avisar(temVenda ? `${f.curto} saiu da lojinha. As vendas e o saldo dele continuam no histórico.` : `${f.curto} apagado`, 'check'); },
  reativarForn:(d) => { FORN[d.v].ativo = true; salvar(); reRender(); avisar(`${FORN[d.v].curto} de volta na lojinha`); },
  pagarForn:(d) => { const f = saldoFornecedores(S).find(x => x.id === d.v); S.repLoja.push({id:'rl'+(S.seq++), forn:f.id, valor:f.saldo, d:HOJE_ISO}); salvar(); reRender(); avisar(`${brl(f.saldo)} pagos a ${f.curto} · lançado no balanço como repasse`); },
  recebiFiado:(d) => { const f = S.fiado.find(x => x.id === d.v); f.pago = true; f.pagoEm = HOJE_ISO; salvar(); reRender(); avisar(`Recebido de ${f.cliente.split(' ')[0]}: ${brl(f.valor)}`); },

  /* instrutor */
  instrFiltro:(d) => { UI.instrFiltro = d.v; reRender(); },
  meuMes:(d) => { UI.meuMes = d.v; reRender(); },
  chamada:(d) => folhaChamada(d.v),
  marcar:(d, el) => { const s = CHAMADA.presentes; s.has(d.v) ? s.delete(d.v) : s.add(d.v); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  addExtra:(d) => { CHAMADA.extras.push(d.v); CHAMADA.presentes.add(d.v); desenharChamada(); },
  visit:(d) => { CHAMADA.visit = Math.max(0, CHAMADA.visit + +d.v); const y = $('#sheet').scrollTop; desenharChamada(); $('#sheet').scrollTop = y; },
  salvarChamada:(d) => {
    const {sid} = CHAMADA, [dia, tid] = sid.split('_'), t = TURMA[tid];
    if ((S.fechados || {})[mesDe(dia)]){ avisar(`${nomeMes(mesDe(dia))} já foi fechado. Peça para a administração reabrir.`, 'circle-alert'); return; }
    S.presencas = S.presencas.filter(p => p.s !== sid);
    CHAMADA.presentes.forEach(aid => { const a = alunoPor(S,aid); const m = a.mats.find(x => x.atv === t.atv) || a.mats[0]; S.presencas.push({s:sid, a:aid, t: m.plano || 'mensal'}); });
    for (let i=0;i<CHAMADA.visit;i++) S.presencas.push({s:sid, a:null, nome:'Visitante', t:'avulsa'});
    const au = S.aulas[sid] || (S.aulas[sid] = {id:sid, d:dia, turma:tid, instr:UI.who.instrutor, sub:false});
    au.feita = true; au.vazia = d.v === 'vazia' || (CHAMADA.presentes.size + CHAMADA.visit === 0);
    const n = CHAMADA.presentes.size + CHAMADA.visit;
    salvar(); fecharFolha(); reRender();
    avisar(au.vazia ? `Aula vazia registrada · vale ${brl(S.regras.aulaVazia)}` : `Chamada salva: ${n} ${n===1?'presente':'presentes'}`);
  },
  minhaTurma:(d) => folhaMinhaTurma(d.v),
  pedirSub:(d) => folhaPedirSub(d.v, d.d),
  aceitarSub:(d) => { const s = S.subs.find(x => x.id === d.v); s.status = 'aceito'; s.para = UI.who.instrutor; salvar(); reRender(); avisar(`Combinado: você cobre ${PESSOA[s.de].nome} em ${dataBR(s.d)}. Ela e a administração já sabem.`); },
  recusarSub:(d) => { const s = S.subs.find(x => x.id === d.v); (s.recusas = s.recusas || []).push(UI.who.instrutor); salvar(); reRender(); avisar('Ok, o pedido segue aberto para as outras'); },


  /* logo e avisos */
  logo:() => ACT.sair(),
  sino:() => folhaCaixa(),
  irAviso:(d) => { fecharFolha(); if (d.v === 'confirmar'){ ACT.ir({v:'admin-confirmar'}); return; } if (UI.role === 'aluno' && d.v === 'eventos'){ UI.alunoAtv = 'eventos'; ir(null, 'inicio'); return; } if (d.v === 'inscricoes'){ ir('admin', 'inicio'); return; } ir(null, d.v); },
  divVis:(d) => { UI.div.vis = d.v; reRender(); },
  canalAviso:(d) => { const r = regraAviso(d.v), c = (S.avisos = S.avisos || {})[d.v] = S.avisos[d.v] || {}; const set = new Set(r.canais); set.has(d.x) ? set.delete(d.x) : set.add(d.x); c.canais = [...set]; salvar(); reRender(); avisar(`${r.nome}: ${c.canais.length ? c.canais.map(k => CANAIS[k].nome).join(', ') : 'nenhum canal'}`, 'bell'); },
  ligaAviso:(d) => { const r = regraAviso(d.v), c = (S.avisos = S.avisos || {})[d.v] = S.avisos[d.v] || {}; c.ativo = !r.ativo; salvar(); reRender(); avisar(`${r.nome}: ${c.ativo ? 'ligado' : 'desligado'}`, c.ativo ? 'bell' : 'pause'); },
  previaAviso:(d) => folhaPreviaAviso(d.v),
  testeAviso:(d) => { const r = regraAviso(d.v); fecharFolha(); mostrarPush('Espaço Anirvana', preencher(r.modelo, alunoPor(S,'a01'))); (S.enviados = S.enviados || []).push({para:`${quemNome()} (teste)`, canal:r.canais[0] || 'push', regra:r.id, quando:'hoje 10:50'}); salvar(); setTimeout(reRender, 300); },

  /* inscrição (no lugar do Google Forms) */
  inscricao:() => { UI.insc = {passo:1, d:{}}; folhaInscricao(); },
  inscPasso:(d) => { inscSalvar(); const dir = +d.v; if (dir > 0){ const falta = inscValida(UI.insc.passo); if (falta.length){ avisar('Falta ' + falta.join(', '), 'circle-alert'); return; } } UI.insc.passo = Math.max(1, Math.min(4, UI.insc.passo + dir)); folhaInscricao(); $('#sheet').scrollTop = 0; },
  inscEnviar:() => {
    inscSalvar(); const falta = inscValida(4); if (falta.length){ avisar('Falta ' + falta.join(', '), 'circle-alert'); return; }
    const d = UI.insc.d; (S.inscricoes = S.inscricoes || []).push({id:'in' + (S.seq++), d:HOJE_ISO, estado:'nova', origem:'app', dados:{...d}}); salvar();
    abrirFolha(`${folhaCab('Inscrição enviada', '')}<div class="stack" style="text-align:center;justify-items:center"><span class="ico-b" style="width:72px;height:72px;border-radius:24px;background:var(--ok-bg);color:var(--ok)">${ic('check','xl')}</span><h2 style="font-size:26px">Namaskar, ${escapeH(d.nome.split(' ')[0])}!</h2><p class="muted" style="max-width:40ch">A Dessa e o Vitor já receberam sua inscrição e a sua ficha. A confirmação do horário chega pelo WhatsApp${d.experimental ? ', junto com a data da aula experimental' : ''}.</p><button class="btn pri" data-act="fechar">Pronto</button></div>`);
    setTimeout(() => mostrarPush('Nova inscrição', `${d.nome} quer ${ATIV[d.atv].curto.toLowerCase()}. A ficha já está no painel.`), 900);
    if (UI.role) setTimeout(reRender, 400);
  },
  verInscricao:(d) => { const i = S.inscricoes.find(x => x.id === d.v), x = i.dados; const a = {id:'_', nome:x.nome, nasc:x.nasc, email:x.email, resp:x.resp, respTel:x.respTel, ficha:{...x, saudeOk: x.saudeOk !== false && x.temSaude === 'sim'}};
    abrirFolha(`${folhaCab(escapeH(x.nome), `Inscrição de ${dataBR(i.d)}${i.origem === 'forms' ? ' · veio do Google Forms' : ' · pelo app'}`)}<div class="stack">
      <div class="list"><div class="li"><span class="ico-b" style="color:${ATIV[x.atv].hex}">${ic(ATIV[x.atv].icon)}</span><div class="main-c"><span class="t">${ATIV[x.atv].nome}${x.plano && x.atv === 'yoga' ? ' · ' + PLANOS_YOGA[x.plano].nome : ''}</span><span class="s">${(x.turmas || '').split(',').filter(Boolean).map(t => `${DIAS[TURMA[t].dia]} ${TURMA[t].h}`).join(', ') || 'horário a combinar'}${x.experimental ? ' · quer aula experimental' : ''}</span></div></div>
      <div class="li"><span class="ico-b">${ic('phone')}</span><div class="main-c"><span class="t num">${escapeH(x.tel || '—')}</span><span class="s">WhatsApp</span></div>${x.tel ? `<button class="btn ghost sm" data-act="copiar" data-v="${escapeH(x.tel)}">${ic('copy','sm')}Copiar</button>` : ''}</div></div>
      ${blocoFicha(a, 'admin')}
      ${i.origem === 'forms' && !x.termos ? `<div class="alert warn"><span class="ib">${ic('circle-alert')}</span><div><div class="t">Falta o aceite</div><div class="s">Quem veio do Google Forms recebe o link para aceitar os termos e a privacidade no primeiro acesso.</div></div></div>` : ''}
      <div class="sheet-foot"><button class="btn sec" data-act="fechar">Depois</button><button class="btn pri" data-act="confirmarInscricao" data-v="${i.id}">${ic('check')}Confirmar matrícula</button></div></div>`); },
  confirmarInscricao:(d) => { const r = confirmarInscricao(d.v); salvar(); fecharFolha(); reRender(); avisar(`Matrícula confirmada. A ficha já aparece para ${r.quem.join(', ') || 'a equipe'}, e o aluno recebeu o WhatsApp de boas-vindas.`, 'user-plus'); },
  linkInscricao:() => ACT.copiar({v:'https://rottaguide.com/anirvana#inscricao'}),
  salvarMinhaFicha:() => { inscSalvar(); const falta = inscValida(3); if (falta.length){ avisar('Falta ' + falta.join(', '), 'circle-alert'); return; } const a = alunoPor(S, UI.who.aluno), d = UI.insc.d;
    a.ficha = {...(a.ficha || {}), exp:d.exp, obj:d.obj, temSaude:d.temSaude, saude:d.temSaude === 'sim' ? d.saude : '', saudeOk:d.temSaude === 'sim' && d.saudeOk !== false, emerg:d.emerg, emergTel:d.emergTel, como:d.como, indicou:d.indicou, completa:true};
    const novo = !((S.pontosAcoes || {})[a.id] || {}).ficha && !(a.ficha && a.ficha.completa); ganhar('ficha'); salvar(); fecharFolha(); reRender(); avisar(novo ? 'Ficha salva: +30 pontos' : 'Ficha atualizada. A instrutora já vê.', 'clipboard-check'); },
  verMinhaFicha:() => { const a = alunoPor(S, UI.who.aluno); if (!a.ficha) a.ficha = {}; const eraCompleta = a.ficha.completa; UI.insc = {passo:3, d:{...a.ficha, nome:a.nome, nasc:a.nasc, tel:a.tel, email:a.email, atv:a.mats[0].atv, termos:true, priv:true}, minha:true}; folhaInscricao(); },

  /* pontos */
  instalarApp:() => folhaInstalar(),
  instalarAgora:async () => { const p = window.__pedidoInstalar; if (!p) return; p.prompt(); try{ const r = await p.userChoice; if (r.outcome === 'accepted') ACT.instalouDemo(); }catch(e){} },
  instalouDemo:() => { ganhar('instalar'); fecharFolha(); reRender(); avisar('App instalado: +50 pontos', 'gift'); },
  ativarAvisos:() => { ganhar('notif'); reRender(); mostrarPush('Avisos ligados', 'Pronto! Você recebe o lembrete 2 horas antes de cada aula. +20 pontos.'); },
  indicar:() => { const a = alunoPor(S, UI.who.aluno); ACT.copiar({v:`Vem praticar comigo no Espaço Anirvana! Inscrição aqui: https://rottaguide.com/anirvana#inscricao (indicação de ${a.nome})`}); setTimeout(() => avisar('Convite copiado. Quando a pessoa se matricular, você ganha 100 pontos.', 'user-plus'), 900); },
  trocarPontos:() => folhaTrocar(alunoPor(S, UI.who.aluno)),
  pedirPremio:(d) => { const a = alunoPor(S, UI.who.aluno), pr = PREMIOS.find(p => p.id === d.v); if (pontosAluno(S, a.id).saldo < pr.custo) return; (S.trocas = S.trocas || []).push({id:'tr' + (S.seq++), a:a.id, premio:pr.id, custo:pr.custo, d:HOJE_ISO, estado:'pendente'}); salvar(); folhaTrocar(a); reRender(); avisar(`Troca feita: ${pr.nome}. Retire no Espaço.`, 'gift'); },
  extratoPontos:() => { const a = alunoPor(S, UI.who.aluno), P = pontosAluno(S, a.id); abrirFolha(`${folhaCab('Seus pontos', `${P.total} ganhos · ${P.saldo} para trocar · nível ${P.nivel}`)}<div class="list">${P.itens.map(i => `<div class="li"><span class="ico-b">${ic('check')}</span><div class="main-c"><span class="t">${escapeH(i.lab)}</span>${i.d ? `<span class="s">${dataBR(i.d)}</span>` : ''}</div><b class="num">+${i.pts}</b></div>`).join('')}${(S.trocas || []).filter(t => t.a === a.id).map(t => `<div class="li"><span class="ico-b">${ic('gift')}</span><div class="main-c"><span class="t">${PREMIOS.find(p => p.id === t.premio).nome}</span><span class="s">${dataBR(t.d)}</span></div><b class="num" style="color:var(--sol-ink)">−${t.custo}</b></div>`).join('')}</div>`); },
  entregarTroca:(d) => { const t = S.trocas.find(x => x.id === d.v); t.estado = 'entregue'; t.entregue = HOJE_ISO; salvar(); reRender(); avisar(`Entregue para ${alunoPor(S, t.a).nome.split(' ')[0]}`, 'gift'); },

  /* eventos */
  novoEvento:() => folhaEvento(),
  divulgarEvento:(d) => { const e = S.eventos.find(x => x.id === d.v); UI.div.alvo = e.alvo || 'todos'; UI.div.canais = (e.canais || ['push','whatsapp']).slice(); UI.div.msg = null; folhaDivulgar(d.v); },
  divAlvo:(d) => { UI.div.alvo = d.v; UI.div.msg = $('#dMsg')?.value ?? null; folhaDivulgar(d.ev); },
  divCanal:(d) => { const c = new Set(UI.div.canais); c.has(d.v) ? c.delete(d.v) : c.add(d.v); UI.div.canais = [...c]; UI.div.msg = $('#dMsg')?.value ?? null; folhaDivulgar(d.ev); },
  enviarDivulgacao:(d) => {
    const e = S.eventos.find(x => x.id === d.v), {alvo, canais} = UI.div, A = alcance(alvo, canais), msg = ($('#dMsg')?.value || textoEvento(e)).trim();
    e.divulgado = HOJE_ISO; e.alvo = alvo; e.canais = canais.slice(); e.msg = msg; e.lembrete = $('#dLembrete')?.checked !== false;
    canais.forEach(c => (S.enviados = S.enviados || []).push({para:`${A.c[c].length} alunos · ${ALVOS[alvo].nome}`, canal:c, regra:'evento', quando:'hoje 10:50'}));
    S.caixa = S.caixa || {};
    A.al.forEach(a => (S.caixa['a:' + a.id] = S.caixa['a:' + a.id] || []).unshift({t:`Novo evento: ${e.nome}`, s:`${dataBR(e.data)} às ${e.h} · toque para ver`, icon:'ticket', go:'eventos'}));
    salvar(); fecharFolha(); reRender();
    mostrarPush(`${e.nome} · Espaço Anirvana`, msg);
    setTimeout(() => avisar(`Enviado para ${A.unicos.size} pessoas: ${canais.map(c => `${A.c[c].length} por ${CANAIS[c].nome.toLowerCase()}`).join(', ')}`, 'send'), 1200);
  },
  arteEvento:(d) => folhaArte(d.v),
  arteFmt:(d) => { UI.div.fmt = d.v; folhaArte(d.ev); },
  baixarArte:(d) => { const cv = $('#arteCv'), e = S.eventos.find(x => x.id === d.v); if (!cv) return; try{ cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${e.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-')}-${UI.div.fmt || 'story'}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); avisar('Imagem baixada. É só postar no Instagram.', 'download'); }, 'image/png'); }catch(err){ avisar('Segure o dedo na imagem para salvar', 'image'); } },
  inscritosEvento:(d) => folhaInscritosEv(d.v),
  evPago:(d) => { const e = S.eventos.find(x => x.id === d.v), i = e.inscritos.find(x => x.a === d.x); i.pago = true; salvar(); folhaInscritosEv(d.v); reRender(); avisar(`Recebido de ${alunoPor(S, d.x).nome.split(' ')[0]}`); },
  queroIr:(d) => folhaReservaEv(d.v),
  reservaEv:(d) => { const e = S.eventos.find(x => x.id === d.v), aid = UI.who.aluno; let i = e.inscritos.find(x => x.a === aid); if (!i){ i = {a:aid, d:HOJE_ISO, pago:false}; e.inscritos.push(i); } if (d.x === '1') i.aviso = HOJE_ISO; salvar(); fecharFolha(); reRender(); avisar(d.x === '1' ? `Vaga reservada. A administração confirma o Pix e na véspera o app te lembra.` : `Vaga reservada. Pague no dia, na entrada.`, 'ticket'); },

  /* aluno */
  alunoAtv:(d) => { UI.alunoAtv = d.v; reRender(); },
  vou:(d) => { S.vou[d.v] = d.x === '1'; salvar(); reRender(); const [, tid] = d.v.split('_'); avisar(d.x === '1' ? `Presença confirmada · ${PESSOA[TURMA[tid].instr].nome} já sabe` : 'Tudo bem, avisamos a instrutora', d.x === '1' ? 'check' : 'bell'); },
  experimental:(d) => abrirFolha(`${folhaCab(`Aula experimental de ${ATIV[d.v].curto}`, 'Escolha um horário. A gente confirma pelo WhatsApp.')}<div class="stack">${ATIV[d.v].agendada ? `<div class="field"><label for="expD">Dia preferido</label><input class="inp" type="date" id="expD" value="${iso(addD(HOJE,2))}"></div>` : `<div class="optgrid">${TURMAS.filter(t=>t.atv===d.v).map((t,i) => `<button class="opt ${i===0?'on':''}" data-act="opt" data-grp="expT" data-v="${t.id}">${DIAS_L[t.dia]} ${t.h}</button>`).join('')}</div>`}<div class="sheet-foot"><button class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" data-act="expOk" data-v="${d.v}">Quero experimentar</button></div></div>`),
  estagio:(d) => { const f = S.formandos.find(x => x.id === d.v); f.estagio = Math.min(60, f.estagio + 4); salvar(); reRender(); avisar(`${f.nome.split(' ')[0]}: ${f.estagio}h de estágio`); },
  formacaoInteresse:() => avisar('Pedido enviado. A equipe avisa quando abrir a próxima turma.', 'graduation-cap'),
  expOk:(d) => { fecharFolha(); avisar(`Pedido enviado. A equipe de ${ATIV[d.v].curto} vai confirmar.`); },
  reposicao:(d) => { const t = TURMA[d.v]; avisar(`Reposição marcada: ${DIAS_L[t.dia].toLowerCase()} ${t.h} com ${PESSOA[t.instr].nome}`); },
  pagar:(d) => folhaPagar(d.v, 'pix'),
  pagarModo:(d) => folhaPagar(d.v, d.x),
  confirmarPag:(d) => {
    const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), st = statusPagamento(S,a,m);
    const mes = st.st === 'pago' ? (() => { const x = pd(proximaCobranca(S,m)); return `${x.getFullYear()}-${pad(x.getMonth()+1)}`; })() : MES_ATUAL;
    /* o aluno só AVISA que pagou; quem dá baixa é a administração */
    if (!(S.avisosPag || []).some(x => x.mat === m.id && x.mes === mes && x.estado === 'aguardando'))
      (S.avisosPag = S.avisosPag || []).push({id:'ap'+(S.seq++), a:a.id, mat:m.id, mes, valor:valorMat(S,m), d:HOJE_ISO, h:`${pad(HOJE.getHours())}:${pad(HOJE.getMinutes())}`, metodo:d.x, estado:'aguardando'});
    if (d.x === 'cartao' && $('#cRec')?.checked){ m.metodo = 'cartao'; m.cartaoFim = ($('#cNum').value.replace(/\D/g,'').slice(-4)) || m.cartaoFim || '4242'; }
    salvar(); fecharFolha(); reRender(); avisar(`Pronto! Avisamos a administração. Assim que a Dessa ou o Vitor confirmarem, aparece como pago.`, 'send');
  },
  maisFin:(d) => folhaMaisFin(d.v, d.x || 'menu'),
  salvarMetodo:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); m.metodo = $('#fMet').value; if (m.metodo === 'cartao' && !m.cartaoFim) m.cartaoFim = '4242'; salvar(); fecharFolha(); reRender(); avisar({cartao:'Pronto: cobrança automática no cartão', pixauto:'Pronto: autorize o Pix Automático no app do seu banco', pix:'Pronto: você vai receber o Pix todo mês'}[m.metodo]); },
  pausar:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), dias = +$('#fPausa').value; m.status = 'pausado'; m.pausaAte = iso(addD(HOJE, dias)); salvar(); fecharFolha(); reRender(); avisar(`Plano pausado até ${dataBR(m.pausaAte)}. Sem cobrança nesse período.`, 'pause'); },
  retomar:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); m.status = 'ativo'; delete m.pausaAte; salvar(); fecharFolha(); reRender(); avisar('Plano retomado. Bom te ver de volta!'); },
  cancelarPlano:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v); const dias = diasEntre(pd(m.inicio || a.desde), HOJE); m.status = 'cancelado'; m.fim = HOJE_ISO; salvar(); fecharFolha(); reRender(); avisar(dias <= 7 ? 'Plano cancelado. Como foi nos 7 primeiros dias, o valor pago volta inteiro.' : 'Plano cancelado. Nenhuma cobrança nova.', 'check'); },
  consent:(d) => { const a = alunoPor(S, UI.who.aluno); const c = (S.consent = S.consent || {})[a.id] = S.consent[a.id] || {}; c[d.v] = !c[d.v]; c[d.v + 'Em'] = HOJE_ISO; salvar(); reRender(); avisar(c[d.v] ? 'Autorização registrada com data' : 'Autorização retirada'); },
  lgpd:(d) => avisar(d.v === 'copia' ? 'Pedido registrado. A cópia chega no seu e-mail dentro do prazo da LGPD.' : 'Pedido registrado. A administração confirma com você antes de apagar.', 'check'),
  saudade:(d) => { const a = alunoPor(S, d.v), nome = a.nome.split(' ')[0]; const txt = `Oi, ${nome}! Sentimos sua falta no Espaço Anirvana 🙏 Está tudo bem? Se quiser, a gente te ajuda a encaixar um horário esta semana.`; try{ navigator.clipboard.writeText(txt).then(() => avisar('Mensagem copiada. É só colar no WhatsApp.'), () => avisar(txt)); }catch(e){ avisar(txt); } },
  alterarPlano:(d) => { const a = alunoPor(S, UI.who.aluno), m = a.mats.find(x => x.id === d.v), novo = $('#fPlano').value; if (novo === m.plano){ fecharFolha(); return; } m.plano = novo; salvar(); fecharFolha(); reRender(); avisar(`Plano alterado para ${PLANOS_YOGA[novo].nome} · ${brl(S.regras.planos[novo])} a partir da próxima cobrança`); },
};

/* cliques */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault(); fn({...el.dataset}, el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheet').classList.contains('on')) fecharFolha();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')){ e.preventDefault(); e.target.click(); }
});
$('#scrim').addEventListener('click', fecharFolha);

/* campos de regra e busca */
let _buscaT;
document.addEventListener('input', e => {
  const el = e.target, k = el.dataset.actIn; if (!k) return;
  if (k === 'fnPct'){ const v = num(el.value), a = $('#fnPctAj'); if (a && v >= 0 && v <= 100) a.textContent = `O Espaço fica com ${Math.round(100 - v)}%.${$('#fForn')?.dataset.id ? ' Vendas antigas não mudam.' : ''}`; return; }
  if (k === 'divMsg'){ const pv = $('#dPrev'); if (pv) pv.textContent = el.value; return; }
  if (k === 'busca'){ UI.busca = el.value; clearTimeout(_buscaT); _buscaT = setTimeout(() => { const pos = el.selectionStart; reRender(); const b = $('#busca'); if (b){ b.focus(); b.setSelectionRange(pos,pos); } }, 220); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'csvForms' && e.target.files[0]){ const fr = new FileReader(); fr.onload = () => { const n = importarForms(String(fr.result)); salvar(); reRender(); avisar(n ? `${n} ${n===1?'inscrição importada':'inscrições importadas'} do Google Forms` : 'Não achei respostas nesse arquivo', n ? 'check' : 'circle-alert'); }; fr.readAsText(e.target.files[0]); return; }
  const el = e.target, k = el.dataset.actIn; if (!k) return;
  if (k === 'inscNasc'){ const i = idade(el.value), f = $('#iRespF'); if (f) f.hidden = !(i !== null && i < 18); return; }
  if (k === 'preco'){ const v = num(el.value); if (v > 0){ S.regras.planos[el.dataset.v] = v; salvar(); reRender(); avisar(`${PLANOS_YOGA[el.dataset.v].nome}: ${brl(v)} · presença agora vale ${brl(taxasYoga(S.regras.planos, S.regras.pct.yoga)[el.dataset.v])}`); } }
  if (k === 'pct'){ const v = num(el.value); if (v >= 0 && v <= 100){ S.regras.pct[el.dataset.v] = v/100; salvar(); reRender(); avisar(`${ATIV[el.dataset.v].curto}: equipe ${v}% · Espaço ${100-v}%`); } }
  if (k === 'vazia'){ const v = num(el.value); if (v >= 0){ S.regras[el.dataset.v] = v; salvar(); reRender(); avisar(`Aula vazia: ${brl(v)}`); } }
});

/* formulários */
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'fLanc'){
    const valor = num($('#lValor').value), desc = $('#lDesc').value.trim(), tipo = $('#lTipo').value, cat = $('#lCat').value, d = $('#lData').value || HOJE_ISO;
    if (!valor){ $('#lValor').focus(); avisar('Digite o valor','circle-alert'); return; }
    if (!desc){ $('#lDesc').focus(); avisar('Diga o que foi','circle-alert'); return; }
    S.lanc.push({id:'l'+(S.seq++), tipo, d, valor, desc, cat}); salvar(); fecharFolha(); UI.balMes = mesDe(d); reRender();
    avisar(`${tipo==='saida'?'Saída':'Entrada'} lançada: ${brl(valor)} · ${cat}`);
  }
  if (f.id === 'fReceber'){
    const m = S.alunos.flatMap(a => a.mats.map(x => ({a,x}))).find(o => o.x.id === f.dataset.mat);
    const valor = num($('#rValor').value) || valorMat(S, m.x);
    S.pagamentos.push({id:'pg'+(S.seq++), a:m.a.id, mat:m.x.id, mes:MES_ATUAL, valor, d:$('#rData').value || HOJE_ISO, metodo:$('#rMet').value});
    salvar(); fecharFolha(); reRender(); avisar(`Pagamento registrado: ${m.a.nome.split(' ')[0]} · ${brl(valor)}`);
  }
  if (f.id === 'fNovo'){
    const nome = $('#nNome').value.trim(); if (!nome) return;
    const atv = $('#nAtv').value, plano = atv === 'yoga' ? $('#nPlano').value : null, turmas = $('#nTur').value.split(',').filter(Boolean);
    const id = 'a' + (S.seq++);
    const instrEsc = $('#nInstr')?.value || null;
    if (ATIV[atv].vis === 'escolhido' && !instrEsc){ avisar('Escolha com quem a pessoa vai fazer', 'circle-alert'); return; }
    S.alunos.push({id, nome, desde:HOJE_ISO, obs:'', status:'ativo', tel:$('#nTel').value || '(41) 9 0000-0000', mats:[{id:id+'-0', atv, plano, valor: plano ? null : 150, turmas, venc: Math.min(28, +$('#nVenc').value || HOJE.getDate()), metodo:$('#nMet').value, cartaoFim: $('#nMet').value==='cartao' ? '4242' : null, instr:instrEsc, status:'ativo'}]});
    salvar(); fecharFolha(); reRender();
    const quem = EQUIPE.filter(p => p.atvs.includes(atv)).map(p => p.nome);
    avisar(`${nome.split(' ')[0]} cadastrado. Já aparece para ${quem.join(', ')}.`, 'user-plus');
  }
  if (f.id === 'fSub'){
    const para = $('#sPara').value || null;
    S.subs.push({id:'sb'+(S.seq++), turma:f.dataset.t, d:f.dataset.d, de:UI.who.instrutor, para:null, pedidoPara:para, motivo:$('#sMot').value.trim() || 'Sem motivo informado', status:'aberto', criado:HOJE_ISO});
    salvar(); fecharFolha(); reRender();
    const t = TURMA[f.dataset.t];
    avisar(para ? `Pedido enviado para ${PESSOA[para].nome}` : `Pedido enviado para todas de ${ATIV[t.atv].curto}`, 'repeat');
  }
  if (f.id === 'fEvento'){
    const nome = $('#eNome').value.trim(), valor = num($('#eValor').value), vagas = parseInt($('#eVagas').value, 10), data = $('#eData').value, h = $('#eHora').value || '18:30';
    if (!nome){ $('#eNome').focus(); avisar('Dê um nome para o evento', 'circle-alert'); return; }
    if (!data || data < HOJE_ISO){ $('#eData').focus(); avisar('Escolha um dia de hoje em diante', 'circle-alert'); return; }
    if (!(valor >= 0) || !(vagas > 0)){ avisar('Confira valor e vagas', 'circle-alert'); return; }
    const id = 'ev' + (S.seq++);
    S.eventos.push({id, nome, data, h, valor, vagas, desc:$('#eDesc').value.trim(), icon:$('#eIcon').value, alvo:'todos', canais:['push','whatsapp'], criado:HOJE_ISO, divulgado:null, inscritos:[], externos:0});
    salvar(); reRender(); UI.div.alvo = 'todos'; UI.div.canais = ['push','whatsapp']; UI.div.msg = null; folhaDivulgar(id);
    return;
  }
  if (f.id === 'fForn'){
    const nome = $('#fnNome').value.trim(), curto = ($('#fnCurto').value.trim() || nome.split(/[ ·(]/)[0]).slice(0, 18), modelo = $('#fnModelo').value;
    const pct = modelo === 'proprio' ? 0 : modelo === 'integral' ? 1 : num($('#fnPct').value) / 100;
    if (!nome){ $('#fnNome').focus(); avisar('Digite o nome do fornecedor', 'circle-alert'); return; }
    if (modelo === 'consig' && !(pct > 0 && pct < 1)){ $('#fnPct').focus(); avisar('O % do fornecedor vai de 1 a 99', 'circle-alert'); return; }
    const dados = {nome, curto, modelo, pct, pix:$('#fnPix').value.trim(), tel:$('#fnTel').value.trim(), obs:$('#fnObs').value.trim()};
    const ed = f.dataset.id && FORN[f.dataset.id];
    if (ed){
      if (ed.pct !== pct) S.vendas.filter(v => v.forn === ed.id && v.pct === undefined).forEach(v => { v.pct = ed.pct; });   /* congela o % das vendas antigas */
      Object.assign(ed, dados);
    } else {
      if (S.fornecedores.some(x => x.nome.toLowerCase() === nome.toLowerCase())){ avisar('Esse fornecedor já está cadastrado', 'circle-alert'); return; }
      const CORES = ['#0E7266','#C08A12','#B9488E','#2F7FB8','#5B8C2A','#A2563A','#6A55C9','#D46A8C','#1F8A9E','#7A5C2E'];
      S.fornecedores.push({id:'f' + (S.seq++), ...dados, hue:CORES[S.fornecedores.length % CORES.length], ativo:true});
    }
    ligarFornecedores(); salvar(); fecharFolha(); reRender();
    avisar(`${curto}: ${modelo === 'proprio' ? 'estoque do Espaço' : modelo === 'integral' ? 'repasse de 100%' : `${Math.round(pct*100)}% fornecedor · ${Math.round((1-pct)*100)}% Espaço`}${ed ? ' · vendas antigas ficam como estavam' : ''}`, 'store');
    return;
  }
  if (f.id === 'fProduto'){
    const nome = $('#pdNome').value.trim(), preco = num($('#pdPreco').value), forn = $('#pdForn').value, cat = $('#pdCat').value;
    if (!nome){ $('#pdNome').focus(); avisar('Dê um nome para o produto', 'circle-alert'); return; }
    if (!(preco > 0)){ $('#pdPreco').focus(); avisar('Digite o preço', 'circle-alert'); return; }
    S.produtos = S.produtos || [];
    const ed = f.dataset.id && prodPor(f.dataset.id);
    if (ed) Object.assign(ed, {nome, preco, forn, cat, icon:CATS_LOJA[cat]?.icon || 'tag'});
    else if (S.produtos.some(p => p.nome.toLowerCase() === nome.toLowerCase() && p.forn === forn)){ avisar('Esse produto já está cadastrado para esse fornecedor', 'circle-alert'); return; }
    else S.produtos.push({id:'p' + (S.seq++), nome, preco, forn, cat, icon:CATS_LOJA[cat]?.icon || 'tag'});
    salvar(); fecharFolha(); reRender(); avisar(`${nome} · ${brl(preco)} ${ed ? 'atualizado' : 'na lojinha'} (${FORN[forn].curto})`, 'store');
    return;
  }
  if (f.id === 'fLivre'){
    const nome = $('#ilNome').value.trim(), valor = num($('#ilValor').value), forn = $('#ilForn').value;
    if (!nome || !valor) return;
    const id = 'x' + (S.seq++);
    if ($('#ilGuardar')?.checked){ (S.produtos = S.produtos || []).push({id, nome:nome.replace(/^\d+\s+/, ''), preco:valor, forn, cat:'casa', icon:'tag'}); salvar(); }
    else UI.livres[id] = {id, nome, preco:valor, forn, cat:'casa', icon:'tag'};
    UI.cart[id] = 1; fecharFolha(); reRender(); avisar(`${nome} na venda`);
  }
});

window.addEventListener('hashchange', () => { lerHash(); render(); });
lerHash();
render();
if (UI.abrirInscricao){ UI.abrirInscricao = false; history.replaceState(null, '', location.pathname); ACT.inscricao(); }

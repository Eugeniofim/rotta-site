/* ============================================================
   PAINEL — ADMINISTRAÇÃO (Dessa e Vitor)
   ============================================================ */
function vAdmin(){
  const t = UI.tab.admin;
  if (t === 'balanco') return vBalanco();
  if (t === 'mensalidades') return vMensalidades();
  if (t === 'lojinha') return vLojinha();
  if (t === 'escola') return vEscola();
  if (t === 'divulgar') return vDivulgar();
  if (t === 'inscricoes') return vInscricoes();
  if (t === 'atividades') return `<div class="pagehead"><div><h1>Atividades e cursos</h1><p>O que o Espaço oferece: aparece na inscrição, na grade, na chamada e nas mensalidades.</p></div></div>${vAtividadesAdmin()}`;
  return vAdminInicio();
}

/* ---------- INÍCIO ---------- */
function vAdminInicio(){
  const b = balancoMes(S, MES_ATUAL);
  let devidos = 0, pagos = 0;
  S.alunos.forEach(a => a.mats.forEach(m => { if (m.status !== 'ativo' || a.desde > HOJE_ISO) return; devidos++; if (statusPagamento(S,a,m).st === 'pago') pagos++; }));
  const contas = contasDoMes(S, MES_ATUAL), cPagas = contas.filter(c => c.pago).length;
  const aulasMes = Object.values(S.aulas).filter(a => mesDe(a.d) === MES_ATUAL), feitas = aulasMes.filter(a => a.feita).length;
  const diasFalta = diasEntre(HOJE, pd(fimDoMes(MES_ATUAL)));
  const arcos = [
    {lab:'Mensalidades recebidas', val:`${pagos} de ${devidos}`, pct:pagos/devidos},
    {lab:'Contas do mês pagas', val:`${cPagas} de ${contas.length}`, pct:cPagas/contas.length},
    {lab:'Chamadas feitas', val:`${feitas} de ${aulasMes.length}`, pct:feitas/aulasMes.length},
  ];
  const alertas = alertasAdmin(S);
  const rep = repassesEquipe(S, MES_ATUAL).reduce((s,r) => s + r.total, 0) + saldoFornecedores(S).reduce((s,f) => s + Math.max(0,f.saldo), 0);
  return `
  <div class="pagehead anim-in"><div><h1>${saudacao()}, ${quemNome()}</h1><p>${dataLonga(HOJE_ISO).replace(/^./, c => c.toUpperCase())} · ${diasFalta} dias para fechar ${nomeMes(MES_ATUAL).toLowerCase()}</p></div>
    <button class="btn pri" data-act="lancar">${ic('plus')}Lançar</button></div>
  ${faixaProto('Protótipo. Mensalidades de jan–mar e vendas da lojinha de mar–jul são os números reais das planilhas. Nomes de alunos, horários e o resto são exemplo.')}
  ${(S.inscricoes || []).some(i => i.estado === 'nova') ? cardInscricoes() : ''}
  <section class="hero anim-in">
    ${solArcos(arcos, diasFalta + (diasFalta===1?' dia':' dias'), `para fechar ${mesCurto(MES_ATUAL)}`)}
    <div class="legend"><h2>${nomeMes(MES_ATUAL)} em andamento</h2><p class="lead">Saldo do Espaço até agora: <b class="num" style="color:${b.saldo>=0?'var(--ok)':'var(--bad)'}">${brl(b.saldo)}</b></p>${legendaArcos(arcos)}</div>
  </section>
  <div class="grid g4">
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-in)"></i>Entradas do Espaço</span><span class="v">${brl0(b.entradas)}</span><span class="d">já sem a parte da equipe</span></div>
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-out)"></i>Saídas</span><span class="v">${brl0(b.saidasTot)}</span><span class="d">${b.saidas.length} lançamentos</span></div>
    <div class="stat"><span class="k">${ic(b.saldo>=0?'trending-up':'trending-down','sm')}Saldo do mês</span><span class="v" style="color:${b.saldo>=0?'var(--ok)':'var(--bad)'}">${brl0(b.saldo)}</span><span class="d">entradas − saídas</span></div>
    <div class="stat"><span class="k">${ic('repeat','sm')}A repassar</span><span class="v">${brl0(rep)}</span><span class="d">equipe + fornecedores</span></div>
  </div>
  <div class="split">
    <div class="card"><div class="card-h"><h3>O que pede atenção</h3><span class="sub">${alertas.length} itens</span></div>
      <div class="grid" style="gap:10px">${alertas.map(a => `<div class="alert ${a.cls} tap" data-act="ir" data-v="${a.go}" data-sub="${a.sub||''}" role="button" tabindex="0"><span class="ib">${ic(a.icon)}</span><div style="min-width:0"><div class="t">${a.t}</div><div class="s">${escapeH(a.s)}</div></div><span class="go">${ic('chevron-right','sm')}</span></div>`).join('') || '<p class="muted">Tudo em dia.</p>'}</div>
    </div>
    ${cardContas()}
  </div>
  <div class="card"><div class="card-h"><div><h3>2026 mês a mês</h3><span class="sub">Entradas do Espaço e saídas · toque num mês</span></div><button class="btn sec sm" data-act="tab" data-v="balanco">Abrir balanço${ic('chevron-right','sm')}</button></div>
    <div class="ckey" style="margin-bottom:10px"><span><i style="background:var(--chart-in)"></i>Entradas do Espaço</span><span><i style="background:var(--chart-out)"></i>Saídas</span></div>
    ${graficoAno(dadosAno(), {alto:200})}
  </div>`;
}
function cardContas(){
  const contas = contasDoMes(S, MES_ATUAL).sort((a,b) => (!!a.pago - !!b.pago) || a.dia - b.dia);
  const falta = contas.filter(c => !c.pago);
  return `<div class="card"><div class="card-h"><div><h3>Contas de ${nomeMes(MES_ATUAL).toLowerCase()}</h3><span class="sub">${falta.length ? `${falta.length} por pagar · ${brl(falta.reduce((s,c)=>s+c.valor,0))}` : 'Todas pagas'}</span></div></div>
    <div class="list">${contas.map(c => `<div class="li"><span class="ico-b" style="${c.pago?'background:var(--ok-bg);color:var(--ok)':''}">${ic(c.pago?'check':(CAT_SAIDA[c.cat] || {}).icon || 'receipt')}</span><div class="main-c"><span class="t">${c.nome}</span><span class="s">${c.cat} · ${c.pago ? 'paga em '+dataBR(c.pago.d) : 'vence dia '+c.dia}</span></div><div class="end"><b class="num">${brl(c.pago ? c.pago.valor : c.valor)}</b>${c.pago ? '' : `<button class="btn ok sm" data-act="pagarConta" data-v="${c.id}">Paguei</button>`}</div></div>`).join('')}</div>
  </div>`;
}

/* ---------- BALANÇO ---------- */
function vBalanco(){
  const chipsMes = MESES.map((m,i) => { const k = `2026-${pad(i+1)}`; return `<button class="chip ${UI.balMes===k?'on':''}" data-act="balMes" data-v="${k}" ${k>MES_ATUAL?'disabled style="opacity:.4"':''}>${MESES_C[i]}</button>`; }).join('');
  return `
  <div class="pagehead"><div><h1>Balanço</h1><p>Entradas, saídas e o saldo do Espaço. Mensalidades e lojinha entram sozinhas.</p></div>
    <div class="row wrap"><div class="seg">${[['mes','Mês'],['ano','Ano'],['cat','Categorias']].map(([k,l]) => `<button class="${UI.balVis===k?'on':''}" data-act="balVis" data-v="${k}">${l}</button>`).join('')}</div><button class="btn sec" data-act="editarCats">${ic('tags')}Categorias</button><button class="btn pri" data-act="lancar">${ic('plus')}Lançar</button></div></div>
  ${UI.balVis === 'ano' ? vBalancoAno() : UI.balVis === 'cat' ? vBalancoCategorias() : `<div class="chips">${chipsMes}</div>${vBalancoMes(UI.balMes)}`}`;
}
function vBalancoMes(mes){
  const b = balancoMes(S, mes);
  const fonteTag = f => f === 'planilha' ? '<span class="tag real">planilha</span>' : f === 'app' ? '<span class="tag">automático</span>' : '<span class="tag">exemplo</span>';
  const porCat = {};
  b.saidas.forEach(l => porCat[l.cat] = (porCat[l.cat]||0) + l.valor);
  const cats = Object.entries(porCat).sort((a,b) => b[1]-a[1]).map(([lab,v]) => ({lab, v}));
  const inCat = {}; b.manualIn.forEach(l => inCat[l.cat] = (inCat[l.cat]||0) + l.valor);
  const F = FECH_PLANILHA[mes];
  const ingMan = b.manualIn.filter(l => l.cat === 'Inglês').reduce((t,l) => t + l.valor, 0);   /* inglês agora é lançado à mão */
  const difPlan = F && Math.abs(F.entradaEA - (b.rec.ea + ingMan)) > 1;
  return `
  <div class="grid g4">
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-in)"></i>Entradas do Espaço</span><span class="v">${brl0(b.entradas)}</span><span class="d">${nomeMes(mes)}</span></div>
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-out)"></i>Saídas</span><span class="v">${brl0(b.saidasTot)}</span><span class="d">${b.saidas.length} lançamentos</span></div>
    <div class="stat"><span class="k">Saldo</span><span class="v" style="color:${b.saldo>=0?'var(--ok)':'var(--bad)'}">${brl0(b.saldo)}</span><span class="d">${b.saldo>=0?'sobrou':'faltou'} no mês</span></div>
    <div class="stat"><span class="k">Passou pelo caixa</span><span class="v">${brl0(b.rec.bruto + b.loja.bruto + b.manualIn.reduce((s,l)=>s+l.valor,0))}</span><span class="d">${brl0(b.repassar)} era da equipe e fornecedores</span></div>
  </div>
  ${difPlan ? `<div class="alert warn"><span class="ib">${ic('triangle-alert')}</span><div><div class="t">A planilha de ${nomeMes(mes).toLowerCase()} somou ${brl(F.entradaEA)} para o Espaço; pelas contas do app são ${brl(b.rec.ea + ingMan)}.</div><div class="s">A diferença de ${brl(b.rec.ea + ingMan - F.entradaEA)} é a parte do Espaço na musicalização (R$ 300,00 × 30%), que ficou fora do total "ENTRADA ANIRVANA". No app o total é sempre a soma das partes.</div></div></div>` : ''}
  <div class="grid g2">
    <div class="card"><div class="card-h"><h3>Entradas</h3><b class="num">${brl(b.entradas)}</b></div>
      <div class="eyebrow" style="margin-bottom:6px">Mensalidades · parte do Espaço ${fonteTag(b.rec.fonte)}</div>
      <div class="list">${b.rec.linhas.filter(l => l.bruto > 0).map(l => `<div class="li"><span class="ico-b" style="color:${ATIV[l.atv].hex}">${ic(ATIV[l.atv].icon)}</span><div class="main-c"><span class="t">${ATIV[l.atv].nome}</span><span class="s">${brl(l.bruto)} recebidos · ${Math.round((1-l.pct)*100)}% do Espaço</span></div><b class="num">${brl(l.ea)}</b></div>`).join('')}</div>
      <div class="eyebrow" style="margin:14px 0 6px">Lojinha · parte do Espaço ${b.loja.n ? (mes >= '2026-08' ? '<span class="tag">automático</span>' : '<span class="tag real">planilha</span>') : ''}</div>
      <div class="li"><span class="ico-b" style="color:var(--sol-ink)">${ic('store')}</span><div class="main-c"><span class="t">${b.loja.n} vendas</span><span class="s">${brl(b.loja.bruto)} vendidos · ${brl(b.loja.forn)} vão para fornecedores</span></div><b class="num">${brl(b.loja.ea)}</b></div>
      <div class="eyebrow" style="margin:14px 0 6px">Lançadas à mão</div>
      <div class="list">${Object.entries(inCat).map(([c,v]) => `<div class="li"><span class="ico-b">${ic(CAT_ENTRADA[c]?.icon || 'banknote')}</span><div class="main-c"><span class="t">${c}</span><span class="s">${b.manualIn.filter(l=>l.cat===c).map(l=>escapeH(l.desc)).filter((x,i,a)=>a.indexOf(x)===i).join(', ')}</span></div><b class="num">${brl(v)}</b></div>`).join('') || '<p class="muted small">Nenhuma entrada manual.</p>'}</div>
    </div>
    <div class="card"><div class="card-h"><h3>Saídas por categoria</h3><div class="row"><b class="num">${brl(b.saidasTot)}</b><button class="btn ghost sm" data-act="balVis" data-v="cat">${ic('chart-column','sm')}Gráficos</button></div></div>
      ${cats.length ? hbarras(cats) : '<p class="muted">Nenhuma saída lançada.</p>'}
      <div class="eyebrow" style="margin:10px 0 6px">Lançamentos do mês · toque para corrigir</div>
      <div class="list">${[...b.saidas, ...b.manualIn].sort((a,b)=>a.d<b.d?1:-1).map(l => `<div class="li tap" data-act="editarLanc" data-v="${l.id}" role="button" tabindex="0"><span class="ico-b" style="${l.tipo === 'entrada' ? 'background:var(--ok-bg);color:var(--ok)' : ''}">${ic((l.tipo === 'entrada' ? CAT_ENTRADA : CAT_SAIDA)[l.cat]?.icon || 'receipt')}</span><div class="main-c"><span class="t">${escapeH(l.desc)}</span><span class="s">${dataBR(l.d)} · ${escapeH(l.cat)} · ${l.tipo === 'entrada' ? 'entrada' : 'saída'}</span></div><b class="num" style="${l.tipo === 'entrada' ? 'color:var(--ok)' : ''}">${l.tipo === 'entrada' ? '+' : ''}${brl(l.valor)}</b></div>`).join('') || '<p class="muted small">Nenhum lançamento neste mês.</p>'}</div>
    </div>
  </div>`;
}
function vBalancoAno(){
  const d = dadosAno().filter(x => !x.futuro);
  const e = d.reduce((s,x) => s + x.entradas, 0), sa = d.reduce((s,x) => s + x.saidas, 0);
  const porCat = {};
  S.lanc.filter(l => l.tipo === 'saida' && l.d.startsWith('2026')).forEach(l => porCat[l.cat] = (porCat[l.cat]||0) + l.valor);
  const melhor = d.slice().sort((a,b) => (b.entradas-b.saidas) - (a.entradas-a.saidas))[0], pior = d.slice().sort((a,b) => (a.entradas-a.saidas) - (b.entradas-b.saidas))[0];
  return `
  <div class="grid g4">
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-in)"></i>Entradas no ano</span><span class="v">${brl0(e)}</span><span class="d">jan a ${mesCurto(MES_ATUAL)}</span></div>
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-out)"></i>Saídas no ano</span><span class="v">${brl0(sa)}</span><span class="d">média ${brl0(sa/d.length)}/mês</span></div>
    <div class="stat"><span class="k">Saldo do ano</span><span class="v" style="color:${e-sa>=0?'var(--ok)':'var(--bad)'}">${brl0(e-sa)}</span><span class="d">entradas − saídas</span></div>
    <div class="stat"><span class="k">Melhor e pior mês</span><span class="v" style="font-size:20px">${mesCurto(melhor.mes)} · ${mesCurto(pior.mes)}</span><span class="d">${brl0(melhor.entradas-melhor.saidas)} · ${brl0(pior.entradas-pior.saidas)}</span></div>
  </div>
  <div class="card pad-lg"><div class="card-h"><div><h3>Entradas do Espaço × saídas</h3><span class="sub">Toque num mês para ver os números. Embaixo, o saldo de cada mês.</span></div>
    <div class="ckey"><span><i style="background:var(--chart-in)"></i>Entradas do Espaço</span><span><i style="background:var(--chart-out)"></i>Saídas</span></div></div>
    ${graficoAno(dadosAno(), {alto:260})}
  </div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><div><h3>Para onde foi o dinheiro</h3><span class="sub">saídas de 2026 por categoria</span></div><button class="btn ghost sm" data-act="balVis" data-v="cat">${ic('chart-column','sm')}Cada categoria</button></div>${hbarras(Object.entries(porCat).sort((a,b)=>b[1]-a[1]).map(([lab,v])=>({lab,v})))}</div>
    <div class="card"><div class="card-h"><h3>De onde veio</h3><span class="sub">parte do Espaço em 2026</span></div>${(() => {
      const o = {Mensalidades:0, Lojinha:0}; d.forEach(x => { const b = balancoMes(S, x.mes); o.Mensalidades += b.rec.ea; o.Lojinha += b.loja.ea; b.manualIn.forEach(l => o[l.cat] = (o[l.cat]||0) + l.valor); });
      return hbarras(Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([lab,v])=>({lab,v})), 'var(--chart-in)'); })()}</div>
  </div>
  <div class="card"><div class="card-h"><h3>Mês a mês</h3></div><div class="tbl-w"><table class="tbl"><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo</th><th>Acumulado</th></tr></thead><tbody>${(() => { let ac = 0; return d.map(x => { ac += x.entradas - x.saidas; return `<tr><td>${nomeMes(x.mes)}</td><td>${brl(x.entradas)}</td><td>${brl(x.saidas)}</td><td class="${x.entradas-x.saidas>=0?'pos':'neg'}">${brl(x.entradas-x.saidas)}</td><td>${brl(ac)}</td></tr>`; }).join(''); })()}<tr class="tot"><td>Total</td><td>${brl(e)}</td><td>${brl(sa)}</td><td>${brl(e-sa)}</td><td></td></tr></tbody></table></div></div>`;
}

/* folha: lançar entrada/saída */
function folhaLancar(tipo='saida', id){
  const L = id ? S.lanc.find(l => l.id === id) : null; if (L) tipo = L.tipo;
  const cats = tipo === 'saida' ? CAT_SAIDA : CAT_ENTRADA, catSel = L && cats[L.cat] ? L.cat : (L ? L.cat : Object.keys(cats)[0]);
  const lista = L && !cats[L.cat] ? {...cats, [L.cat]:{icon:'tag'}} : cats;
  const sugest = [...new Set(S.lanc.filter(l => l.tipo === tipo).map(l => l.desc))].slice(0,40);
  abrirFolha(`${folhaCab(L ? 'Corrigir lançamento' : 'Novo lançamento', L ? `${L.tipo === 'saida' ? 'Saída' : 'Entrada'} de ${dataBR(L.d)}` : 'Mensalidades e lojinha já entram sozinhas. Aqui vai o resto.')}
    <form class="stack" id="fLanc" data-id="${L ? L.id : ''}">
      ${L ? '' : `<div class="seg" style="width:100%">${[['saida','Saída'],['entrada','Entrada']].map(([k,l]) => `<button type="button" style="flex:1" class="${tipo===k?'on':''}" data-act="lancTipo" data-v="${k}">${l}</button>`).join('')}</div>`}
      <input type="hidden" id="lTipo" value="${tipo}">
      <div class="field"><label for="lValor">Valor</label><input class="inp money num" id="lValor" inputmode="decimal" placeholder="0,00" required value="${L ? L.valor.toFixed(2).replace('.',',') : ''}"></div>
      <div class="field"><label>Categoria <button type="button" class="btn ghost sm" data-act="editarCats" style="margin-left:6px">${ic('pencil','sm')}Editar categorias</button></label><div class="optgrid">${Object.entries(lista).map(([c,o]) => `<button type="button" class="opt ${c===catSel?'on':''}" data-act="opt" data-grp="lCat" data-v="${escapeH(c)}">${ic(o.icon || 'tag')}<span>${escapeH(c)}</span></button>`).join('')}</div><input type="hidden" id="lCat" value="${escapeH(catSel)}"><span class="help" id="lDica">${escapeH((lista[catSel] || {}).dica || '')}</span></div>
      <div class="field"><label for="lDesc">Descrição ou fornecedor</label><input class="inp" id="lDesc" list="lSug" value="${L ? escapeH(L.desc) : ''}" placeholder="${tipo==='saida'?'Ex.: Luz, Diarista Sonia, lâmpadas':'Ex.: Hospedagem Airbnb, Coworking'}" required><datalist id="lSug">${sugest.map(s => `<option value="${escapeH(s)}">`).join('')}</datalist><span class="help">O app lembra o que você já lançou e sugere a categoria.</span></div>
      <div class="field"><label for="lData">Data</label><input class="inp" type="date" id="lData" value="${L ? L.d : HOJE_ISO}"></div>
      <div class="sheet-foot">${L ? `<button type="button" class="btn ghost" data-act="lancDel" data-v="${L.id}">${ic('x','sm')}Apagar</button>` : `<button type="button" class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" type="submit">${ic('check')}${L ? 'Salvar' : `Lançar ${tipo==='saida'?'saída':'entrada'}`}</button></div>
    </form>`);
}
/* categorias do balanço: criar, renomear e tirar (os lançamentos antigos vão junto no renomear) */
function folhaCategorias(){
  const linha = (nome, o, tipo) => `<div class="li"><span class="ico-b">${ic(o.icon || 'tag')}</span><div class="main-c"><span class="t">${escapeH(nome)}</span><span class="s">${tipo === 'ambos' ? 'entrada e saída' : tipo} · ${S.lanc.filter(l => l.cat === nome).length} lançamentos</span></div><div class="end"><button class="iconbtn" data-act="catRen" data-v="${escapeH(nome)}" aria-label="Renomear ${escapeH(nome)}" title="Renomear">${ic('pencil','sm')}</button><button class="iconbtn" data-act="catTirar" data-v="${escapeH(nome)}" aria-label="Tirar ${escapeH(nome)}" title="Tirar">${ic('x','sm')}</button></div></div>`;
  const todas = {}; Object.entries(CAT_ENTRADA).forEach(([n, o]) => todas[n] = {o, t:'entrada'}); Object.entries(CAT_SAIDA).forEach(([n, o]) => todas[n] = todas[n] ? {o, t:'ambos'} : {o, t:'saída'});
  abrirFolha(`${folhaCab('Categorias do balanço', 'Tirar não apaga nada: os lançamentos antigos continuam no balanço')}
  <div class="stack">
    <div class="list">${Object.entries(todas).sort((a, b) => a[0].localeCompare(b[0])).map(([n, x]) => linha(n, x.o, x.t)).join('')}</div>
    <form class="stack" id="fCat" style="padding:12px;border-radius:14px;background:var(--surface-2);border:1px solid var(--line)">
      <b class="small">Nova categoria</b>
      <div class="field" style="margin:0"><label for="catNome">Nome</label><input class="inp" id="catNome" maxlength="32" placeholder="Ex.: Retiros" required></div>
      <div class="optgrid">${[['saida','Saída'],['entrada','Entrada'],['ambos','Entrada e saída']].map(([k, l], i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-act="opt" data-grp="catTipo" data-v="${k}">${l}</button>`).join('')}</div><input type="hidden" id="catTipo" value="saida">
      <button class="btn pri" type="submit">${ic('plus')}Criar categoria</button>
    </form>
    ${(S.cats && S.cats.fora || []).length ? `<p class="tiny muted">Tiradas: ${S.cats.fora.map(escapeH).join(', ')}. <button class="btn ghost sm" data-act="catVoltar">Trazer de volta</button></p>` : ''}
  </div>`);
}

/* ---------- MENSALIDADES ---------- */
function vMensalidades(){
  return `
  <div class="pagehead"><div><h1>Mensalidades</h1><p>Quem pagou, quem está devendo e quanto vai para cada pessoa da equipe.</p></div>
    <div class="seg">${[['alunos','Alunos'],['fechamento','Fechamento'],['regras','Regras']].map(([k,l]) => `<button class="${UI.mensVis===k?'on':''}" data-act="mensVis" data-v="${k}">${l}</button>`).join('')}</div></div>
  ${UI.mensVis === 'fechamento' ? vFechamento() : UI.mensVis === 'regras' ? vRegras() : vMensAlunos()}`;
}
function vMensAlunos(){
  const linhas = [];
  S.alunos.forEach(a => a.mats.forEach(m => linhas.push({a, m, st:statusPagamento(S,a,m)})));
  const cont = st => linhas.filter(l => st==='todos' || l.st.st === st).length;
  const ordem = {analise:0, atrasado:1, avencer:2, pausado:3, pago:4, plataforma:5, cancelado:6};
  const plat = plataformaMes(S, MES_ATUAL), platTot = plat.reduce((s, x) => s + x.valor, 0);
  const vis = linhas.filter(l => (UI.mensSt === 'todos' || l.st.st === UI.mensSt) && (UI.mensAtv === 'todas' || l.m.atv === UI.mensAtv)).sort((x,y) => ordem[x.st.st] - ordem[y.st.st] || x.a.nome.localeCompare(y.a.nome));
  const recebido = linhas.filter(l => l.st.st === 'pago' && l.st.pg.mes === MES_ATUAL).reduce((s,l) => s + l.st.pg.valor, 0);
  const aberto = linhas.filter(l => l.st.st === 'atrasado').reduce((s,l) => s + valorMat(S,l.m), 0);
  const aVencer = linhas.filter(l => l.st.st === 'avencer').reduce((s,l) => s + valorMat(S,l.m), 0);
  const atvs = [...new Set(linhas.map(l => l.m.atv))];
  return `
  <div class="grid g4">
    <div class="stat"><span class="k">${ic('check','sm')}Recebido em ${mesCurto(MES_ATUAL)}</span><span class="v">${brl0(recebido)}</span><span class="d">${cont('pago')} pagamentos</span></div>
    <div class="stat"><span class="k">${ic('clock','sm')}A vencer</span><span class="v">${brl0(aVencer)}</span><span class="d">${cont('avencer')} até o fim do mês</span></div>
    <div class="stat"><span class="k" style="color:var(--bad)">${ic('circle-alert','sm')}Atrasado</span><span class="v" style="color:var(--bad)">${brl0(aberto)}</span><span class="d">${cont('atrasado')} mensalidades</span></div>
    <div class="stat"><span class="k">${ic('badge-check','sm')}Wellhub e GoGood</span><span class="v">${brl0(platTot)}</span><span class="d">${plat.map(x => `${x.nome}: ${x.n} ${x.n === 1 ? 'aula' : 'aulas'} × ${brl(S.regras.planos[x.k])}`).join(' · ')}</span></div>
  </div>
  ${(() => { const av_ = S.presencas.filter(p => !p.a && p.t === 'avulsa' && S.aulas[p.s] && mesDe(S.aulas[p.s].d) === MES_ATUAL && p.nome !== 'Visitante'), deve = av_.filter(p => !p.pago || p.pago === 'depois');
    return av_.length ? `<div class="card"><div class="card-h"><div><h3>Aulas avulsas de ${nomeMes(MES_ATUAL).toLowerCase()}</h3><span class="sub">${av_.length} ${av_.length === 1 ? 'aula' : 'aulas'} · ${brl(S.regras.planos.avulsa)} cada${deve.length ? ` · <b style="color:var(--warn)">${deve.length} para receber</b>` : ''}</span></div></div>
      <div class="list">${av_.slice().sort((x, y) => (x.pago && x.pago !== 'depois') - (y.pago && y.pago !== 'depois')).map(p => { const au = S.aulas[p.s], t = TURMA[au.turma]; return `<div class="li">${av(p.nome)}<div class="main-c"><span class="t">${escapeH(p.nome)}</span><span class="s">${dataBR(au.d)} · ${t ? nomeTurma(t) + ' ' + t.h : ''}${p.tel ? ' · ' + escapeH(p.tel) : ''}</span></div><div class="end">${p.pago && p.pago !== 'depois' ? `<span class="pill ok">${ic('check')}${p.pago}</span>` : `<button class="btn sec sm" data-act="avulsaReceber" data-v="${escapeH(p.s + '|' + p.nome)}" data-x="pix">Recebi</button>`}</div></div>`; }).join('')}</div></div>` : ''; })()}
  <div class="card">
    <div class="chips" style="margin-bottom:10px">${[['todos','Todos'],['analise','Para confirmar'],['atrasado','Atrasados'],['avencer','A vencer'],['pago','Pagos'],['plataforma','Wellhub e GoGood']].map(([k,l]) => `<button class="chip ${UI.mensSt===k?'on':''}" data-act="mensSt" data-v="${k}">${l} <span class="n">${cont(k)}</span></button>`).join('')}</div>
    <div class="chips" style="margin-bottom:6px">${['todas',...atvs].map(k => `<button class="chip ${UI.mensAtv===k?'on':''}" data-act="mensAtv" data-v="${k}">${k==='todas'?'Todas as atividades':ATIV[k].curto}</button>`).join('')}</div>
    <div class="list">${vis.map(({a,m,st}) => `<div class="li"><span class="tap" data-act="verAluno" data-v="${a.id}" role="button" tabindex="0">${av(a.nome)}</span><div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${st.st === 'plataforma' ? `${nomePlano(m)} · ${st.txt}` : `${nomePlano(m)} · ${brl(valorMat(S,m))}${m.ajuste ? ' (ajustado)' : ''} · ${m.metodo === 'cartao' ? `cartão (+ ${brl(S.regras.taxaCartao ?? TAXA_CARTAO)})` : 'Pix'} · ${st.txt}`}</span></div><div class="end">${pillPag(st.st)}${st.st==='analise'?`<button class="btn ghost sm" data-act="recusarAviso" data-v="${st.aviso.id}">Não caiu</button><button class="btn pri sm" data-act="darBaixa" data-v="${st.aviso.id}">${ic('check','sm')}Dar baixa</button>`:st.st!=='pago'&&st.st!=='pausado'&&st.st!=='cancelado'&&st.st!=='plataforma'?`<button class="btn sec sm" data-act="receber" data-v="${m.id}">Receber</button>`:''}</div></div>`).join('') || '<p class="muted">Ninguém nesse filtro.</p>'}</div>
  </div>`;
}
function folhaReceber(matId){
  const a = S.alunos.find(x => x.mats.some(m => m.id === matId)), m = a.mats.find(x => x.id === matId);
  abrirFolha(`${folhaCab('Registrar pagamento', `${escapeH(a.nome)} · ${nomePlano(m)} · ${nomeMes(MES_ATUAL)}`)}
  <form class="stack" id="fReceber" data-mat="${matId}">
    ${(() => { const ps = (S.pacotes || []).filter(p => p.atv === m.atv && (!p.plano || p.plano === (m.plano || m.planoPart || m.planoAtv))); return ps.length ? `<div class="field"><label>Período</label><div class="optgrid">${[['', `1 mês<br><b class="num">${brl(valorMat(S,m))}</b>`, valorMat(S,m), 1], ...ps.map(p => [p.id, `${escapeH(p.nome)}<br><b class="num">${brl(p.valor)}</b>`, p.valor, p.meses])].map(([k, l, v, n], i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-act="opt" data-grp="rPac" data-v="${k}" data-valor="${v}" data-meses="${n}">${l}</button>`).join('')}</div><input type="hidden" id="rPac" value=""><input type="hidden" id="rMeses" value="1"></div>` : '<input type="hidden" id="rMeses" value="1">'; })()}
    <div class="field"><label for="rValor">Valor</label><input class="inp money num" id="rValor" inputmode="decimal" value="${valorMat(S,m).toFixed(2).replace('.',',')}"></div>
    <div class="field"><label>Como pagou</label><div class="optgrid">${[['pix','Pix','qr-code'],['cartao','Cartão','credit-card'],['dinheiro','Dinheiro','banknote']].map(([k,l,i],j) => `<button type="button" class="opt ${j===0?'on':''}" data-act="opt" data-grp="rMet" data-v="${k}">${ic(i)}${l}</button>`).join('')}</div><input type="hidden" id="rMet" value="pix"></div>
    <div class="field"><label for="rData">Data</label><input class="inp" type="date" id="rData" value="${HOJE_ISO}"></div>
    <div class="sheet-foot"><button type="button" class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" type="submit">${ic('check')}Registrar pagamento</button></div>
  </form>`);
}
function chipsFech(sel, act){
  const meses = [...Object.keys(FECH_PLANILHA), '2026-08','2026-09','2026-10'];
  return `<div class="chips">${meses.map(k => `<button class="chip ${sel===k?'on':''}" data-act="${act}" data-v="${k}">${nomeMes(k)}${FECH_PLANILHA[k]?' <span class="n">planilha</span>':k===MES_ATUAL?' <span class="n">em andamento</span>':''}</button>`).join('')}</div>`;
}
function vFechamento(){
  const mes = UI.fechMes, fy = fechamentoYoga(S, mes), rec = receitaMes(S, mes), reps = repassesEquipe(S, mes);
  const confere = fy.fonte === 'planilha' && fy.linhas.filter(l => l.conferido !== undefined).every(l => Math.abs(l.total - l.conferido) < .01);
  const negativos = fy.linhas.filter(l => l.yoga < -0.004);
  const t = fy.taxas;
  return `
  ${chipsFech(mes, 'fechMes')}
  <div class="card pad-lg">
    <div class="card-h"><div><h3>Yoga — turmas · ${nomeMes(mes)}</h3><span class="sub">A regra da aba "Alunos / Instrutoras": paga por presença e divide a sobra (ou a falta) por aula dada.</span></div>
      ${confere ? `<span class="pill ok">${ic('check')}Confere com a planilha, centavo por centavo</span>` : fy.fonte==='app' ? `<span class="pill pri">${ic('refresh-cw')}Calculado da chamada${mes===MES_ATUAL?' · parcial':''}</span>` : ''}</div>
    <div class="grid g4" style="margin-bottom:14px">
      <div class="stat"><span class="k">Mensalidades de yoga</span><span class="v">${brl0(fy.bruto)}</span><span class="d">recebidas no mês</span></div>
      <div class="stat"><span class="k">${Math.round(fy.pctYoga*100)}% para as instrutoras</span><span class="v">${brl0(fy.pool)}</span><span class="d">${100-Math.round(fy.pctYoga*100)}% fica no Espaço</span></div>
      <div class="stat"><span class="k">Soma por presença</span><span class="v">${brl0(fy.somaAR)}</span><span class="d">${fy.totalAulas} aulas dadas</span></div>
      <div class="stat"><span class="k">${fy.excedente>=0?'Sobra':'Falta'} por aula</span><span class="v" style="color:${fy.excedente>=0?'var(--ok)':'var(--bad)'}">${brl(fy.porAula)}</span><span class="d">excedente ${brl(fy.excedente)}</span></div>
    </div>
    <div class="tbl-w"><table class="tbl"><thead><tr><th>Instrutora</th><th>Aulas</th><th>Presenças</th><th>Por presença</th><th>Ajuste do mês</th><th title="70% de particular, gestantes e meditação">Extras</th><th>Total</th>${fy.fonte==='planilha'?'<th>Planilha</th>':''}</tr></thead><tbody>
      ${fy.linhas.map(l => `<tr><td><b>${l.nome}</b></td><td>${l.aulas}</td><td>${['2x','1x','3x','4x','avulsa'].filter(k=>l.c[k]).map(k=>`${l.c[k]}×${k}`).join(' · ')}${l.c.vazia?` · ${l.c.vazia} vazia`:''}</td><td>${brl(l.aReceber)}</td><td class="${l.ajuste<0?'neg':'pos'}">${brl(l.ajuste)}</td><td>${brl(l.extras.particular+l.extras.gestantes+l.extras.meditacao)}</td><td><b>${brl(l.total)}</b></td>${fy.fonte==='planilha'?`<td>${l.conferido!==undefined?`${brl(l.conferido)} ${Math.abs(l.total-l.conferido)<.01?'✓':''}`:'—'}</td>`:''}</tr>`).join('')}
      <tr class="tot"><td>Total</td><td>${fy.totalAulas}</td><td></td><td>${brl(fy.somaAR)}</td><td>${brl(fy.excedente)}</td><td>${brl(fy.linhas.reduce((s,l)=>s+l.extras.particular+l.extras.gestantes+l.extras.meditacao,0))}</td><td>${brl(fy.linhas.reduce((s,l)=>s+l.total,0))}</td>${fy.fonte==='planilha'?'<td></td>':''}</tr>
    </tbody></table></div>
    <div class="row wrap small muted" style="margin-top:12px;gap:14px"><b style="color:var(--ink-2)">Cada presença vale:</b>${['4x','3x','2x','1x','avulsa'].map(k => `<span class="num">${k} = ${brl(t[k])}</span>`).join('')}<span class="num">aula vazia = ${brl(fy.aulaVazia)}${fy.obsVazia?` (${fy.obsVazia})`:''}</span><span>Extras = 70% de particular, gestantes e meditação</span></div>
  </div>
  ${fy.fonte === 'app' && mes < MES_ATUAL ? ((S.fechados || {})[mes]
      ? `<div class="alert ok"><span class="ib">${ic('check')}</span><div><div class="t">${nomeMes(mes)} está fechado desde ${dataBR(S.fechados[mes])}</div><div class="s">Chamadas e pagamentos deste mês não mudam mais. Tudo o que foi feito fica registrado.</div></div></div>`
      : `<div class="alert pri"><span class="ib">${ic('list-checks')}</span><div style="flex:1"><div class="t">Conferiu tudo? Feche ${nomeMes(mes).toLowerCase()}.</div><div class="s">Depois de fechado, ninguém altera chamada nem pagamento do mês sem reabrir. É o que garante que o repasse pago bate com o registrado.</div><button class="btn pri sm" style="margin-top:10px" data-act="fecharMes" data-v="${mes}">${ic('check','sm')}Fechar ${nomeMes(mes).toLowerCase()}</button></div></div>`) : ''}
  ${negativos.length ? `<div class="alert bad"><span class="ib">${ic('triangle-alert')}</span><div style="flex:1"><div class="t">Pela regra atual, ${negativos.map(l => `${l.nome} ficaria com ${brl(l.yoga)} na yoga`).join(' e ')}.</div><div class="s">Quando o mês tem pouca receita e muita presença, o ajuste negativo é dividido por aula e pode zerar quem deu poucas aulas. Uma saída: garantir o valor da aula vazia como mínimo por aula dada (o Espaço cobre a diferença).</div>
    <button class="btn ${S.regras.piso?'pri':'sec'} sm" style="margin-top:10px" data-act="piso">${ic(S.regras.piso?'check':'plus')}${S.regras.piso?'Piso ligado':'Simular piso por aula'}</button></div></div>` : ''}
  <div class="card"><div class="card-h"><div><h3>Demais atividades</h3><span class="sub">Divisão fixa: instrutor leva a parte dele, o resto fica no Espaço</span></div></div>
    <div class="tbl-w"><table class="tbl"><thead><tr><th>Atividade</th><th>Recebido</th><th>Equipe</th><th>Para a equipe</th><th>Para o Espaço</th></tr></thead><tbody>
      ${rec.linhas.filter(l => l.bruto > 0).map(l => `<tr><td>${ATIV[l.atv].nome}</td><td>${brl(l.bruto)}</td><td>${Math.round(l.pct*100)}%</td><td>${brl(l.instr)}</td><td><b>${brl(l.ea)}</b></td></tr>`).join('')}
      <tr class="tot"><td>Total</td><td>${brl(rec.bruto)}</td><td></td><td>${brl(rec.instr)}</td><td>${brl(rec.ea)}</td></tr>
    </tbody></table></div></div>
  <div class="card"><div class="card-h"><div><h3>Repasses da equipe · ${nomeMes(mes)}</h3><span class="sub">Quanto pagar a cada pessoa, já somando tudo o que ela dá no Espaço</span></div></div>
    <div class="list">${reps.map(r => `<div class="li">${av(r.nome)}<div class="main-c"><span class="t">${r.nome}</span><span class="s">${r.itens.map(i => `${i.lab} ${brl(i.v)}`).join(' · ')}</span><span class="s">Pix ${PESSOA[r.id].pix}</span></div><div class="end"><b class="num" style="font-size:16px">${brl(r.total)}</b>${r.pago ? `<span class="pill ok">${ic('check')}Pago ${dataBR(r.pago.d)}</span>` : fy.fonte==='planilha' ? '<span class="pill neu">fechado na planilha</span>' : `<button class="btn ok sm" data-act="pagarEquipe" data-v="${r.id}" data-mes="${mes}">Marcar pago</button>`}</div></div>`).join('')}</div></div>`;
}
function vRegras(){
  const t = taxasYoga(S.regras.planos, S.regras.pct.yoga);
  return `
  <div class="grid g2">
    <div class="card"><div class="card-h"><div><h3>Planos de yoga</h3><span class="sub">Mudou o preço, o valor de cada presença se ajusta sozinho</span></div></div>
      <div class="list">${Object.entries(PLANOS_YOGA).map(([k,p]) => `<div class="li"><div class="main-c"><span class="t">${p.nome}</span><span class="s">Cada presença vale <b class="num">${brl(t[k])}</b> para a instrutora${p.sem?` · ${Math.round(S.regras.pct.yoga*100)}% ÷ ${p.sem*4} aulas`:''}</span></div><div style="width:130px"><input class="inp num" style="height:42px;text-align:right" inputmode="decimal" id="pl-${k}" data-act-in="preco" data-v="${k}" value="${S.regras.planos[k].toFixed(2).replace('.',',')}" aria-label="Preço ${p.nome}"></div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><div><h3>Yoga particular</h3><span class="sub">Valores 2026 · presencial ou online</span></div></div>
      <div class="list">${Object.entries(PLANOS_PART).map(([k,p]) => `<div class="li"><div class="main-c"><span class="t">${p.nome}</span><span class="s">${k === 'avulsa' ? 'por aula' : 'por mês'} · a professora recebe ${Math.round((S.regras.pct.particular ?? .7)*100)}%</span></div><div style="width:130px"><input class="inp num" style="height:42px;text-align:right" inputmode="decimal" aria-label="Valor ${p.nome}" data-act-in="precoPart" data-v="${k}" value="${((S.regras.planosPart || {})[k] ?? p.preco).toFixed(2).replace('.',',')}"></div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><div><h3>Mensalidade das outras atividades</h3><span class="sub">Mudou aqui, muda na inscrição e na cobrança de quem paga o valor normal</span></div></div>
      <div class="list">${Object.entries(ATIV).filter(([k]) => !['yoga','particular'].includes(k)).map(([k, a]) => PLANOS_ATV[k]
        ? Object.entries(PLANOS_ATV[k]).map(([pk, p]) => `<div class="li"><span class="ico-b" style="color:${a.hex}">${ic(a.icon)}</span><div class="main-c"><span class="t">${escapeH(a.curto)} · ${p.nome}</span><span class="s">por mês</span></div><div style="width:130px"><input class="inp num" style="height:42px;text-align:right" inputmode="decimal" placeholder="a definir" aria-label="Valor ${escapeH(a.curto)} ${p.nome}" data-act-in="precoAtv" data-atv="${k}" data-k="${pk}" value="${(((S.regras.planosAtv || {})[k] || {})[pk] ?? '') === '' ? '' : (+S.regras.planosAtv[k][pk]).toFixed(2).replace('.',',')}"></div></div>`).join('')
        : `<div class="li"><span class="ico-b" style="color:${a.hex}">${ic(a.icon)}</span><div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">por mês</span></div><div style="width:130px"><input class="inp num" style="height:42px;text-align:right" inputmode="decimal" placeholder="a definir" aria-label="Valor ${escapeH(a.nome)}" data-act-in="precoAtv" data-atv="${k}" value="${a.valor ? (+a.valor).toFixed(2).replace('.',',') : ''}"></div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><div><h3>Pacotes</h3><span class="sub">Vários meses pagos de uma vez (ex.: 3 meses de yoga)</span></div><button class="btn sec sm" data-act="pacote">${ic('plus','sm')}Novo pacote</button></div>
      <div class="list">${(S.pacotes || []).map(p => `<div class="li tap" data-act="pacote" data-v="${p.id}" role="button" tabindex="0"><span class="ico-b" style="color:${ATIV[p.atv]?.hex || 'var(--pri)'}">${ic('package')}</span><div class="main-c"><span class="t">${escapeH(p.nome)}</span><span class="s">${ATIV[p.atv]?.curto || p.atv}${p.plano ? ' ' + p.plano : ''} · ${p.meses} meses · ${brl(p.valor)} (${brl(p.valor / p.meses)} por mês)</span></div>${ic('pencil','sm')}</div>`).join('') || '<p class="small muted">Nenhum pacote ainda. Crie um e ele aparece na hora de receber e para o aluno pagar.</p>'}</div></div>
    <div class="card"><div class="card-h"><div><h3>Formas de pagamento</h3><span class="sub">Pix sem taxa · cartão pelo link, com acréscimo</span></div></div>
      <div class="field"><label for="cfgPix">Chave Pix do Espaço</label><input class="inp" id="cfgPix" data-act-in="cfgPag" data-v="chavePix" placeholder="CNPJ, e-mail, celular ou chave aleatória" value="${escapeH((S.config || {}).chavePix || '')}"><span class="help">Com a chave, o app monta o Pix copia e cola com o valor certo de cada aluno.</span></div>
      <div class="field"><label for="cfgLink">Link do cartão (sem valor)</label><input class="inp" id="cfgLink" data-act-in="cfgPag" data-v="linkCartao" placeholder="https://… (link de pagamento da maquininha)" value="${escapeH((S.config || {}).linkCartao || '')}"><span class="help">O aluno abre o link, digita o valor que o app mostra (já com o acréscimo) e manda o comprovante.</span></div>
      <div class="field"><label for="cfgTaxa">Acréscimo no cartão (crédito ou débito)</label><input class="inp money num" id="cfgTaxa" inputmode="decimal" data-act-in="cfgPag" data-v="taxaCartao" value="${(S.regras.taxaCartao ?? TAXA_CARTAO).toFixed(2).replace('.',',')}"></div>
      <p class="small muted">O comprovante chega pelo WhatsApp do Espaço (${ESPACO.tel}). Quem dá baixa é sempre a administração.</p></div>
    <div class="card"><div class="card-h"><div><h3>Parte da equipe por atividade</h3><span class="sub">O resto fica com o Espaço</span></div></div>
      <div class="list">${Object.entries(ATIV).map(([k,a]) => `<div class="li"><span class="ico-b" style="color:${a.hex}">${ic(a.icon)}</span><div class="main-c"><span class="t">${a.nome}</span><span class="s">Espaço fica com ${Math.round((1-S.regras.pct[k])*100)}%</span></div><div style="width:96px" class="row"><input class="inp num" style="height:42px;text-align:right" inputmode="numeric" id="pct-${k}" data-act-in="pct" data-v="${k}" value="${Math.round(S.regras.pct[k]*100)}" aria-label="Porcentagem da equipe em ${a.nome}"><span class="muted">%</span></div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><div><h3>Aula vazia</h3><span class="sub">Quanto a instrutora recebe quando ninguém vem</span></div></div>
      <div class="grid g2"><div class="field"><label for="rgVazia">Mês normal</label><input class="inp num" id="rgVazia" data-act-in="vazia" data-v="aulaVazia" value="${S.regras.aulaVazia.toFixed(2).replace('.',',')}"></div>
      <div class="field"><label for="rgVaziaF">Férias e feriadões</label><input class="inp num" id="rgVaziaF" data-act-in="vazia" data-v="aulaVaziaFerias" value="${S.regras.aulaVaziaFerias.toFixed(2).replace('.',',')}"></div></div>
      <p class="small muted" style="margin-top:10px">Mensalidade atrasada: multa de 2% e juros de 1% ao mês, no máximo. O banco de dados recusa valores acima disso.</p>
      <p class="small muted" style="margin-top:6px">Os meses que vieram da planilha (jan–mar) continuam com as regras da época. As novas regras valem do mês aberto em diante.</p></div>
    ${cardBackup()}
  </div>`;
}

/* ---------- ESCOLA: alunos, horários, equipe, substituições ---------- */
function vEscola(){
  return `
  <div class="pagehead"><div><h1>Escola</h1><p>Alunos, horários, equipe e trocas de aula.</p></div>
    <div class="row wrap"><div class="seg">${[['alunos','Alunos'],['horarios','Horários'],['equipe','Equipe'],['subs','Trocas']].map(([k,l]) => `<button class="${UI.escolaVis===k?'on':''}" data-act="escolaVis" data-v="${k}">${l}</button>`).join('')}</div>${UI.escolaVis==='alunos'?`<button class="btn pri" data-act="novoAluno">${ic('user-plus')}Novo aluno</button>`:''}</div></div>
  ${UI.escolaVis === 'horarios' ? vGrade(null) : UI.escolaVis === 'equipe' ? vEquipe() : UI.escolaVis === 'subs' ? vSubsAdmin() : vEscolaAlunos()}`;
}
function vEscolaAlunos(){
  const q = UI.busca.trim().toLowerCase();
  const lista = S.alunos.filter(a => (!q || a.nome.toLowerCase().includes(q)) && (UI.escAtv === 'todas' || a.mats.some(m => m.atv === UI.escAtv)));
  const atvs = Object.keys(ATIV).filter(k => S.alunos.some(a => a.mats.some(m => m.atv === k)));
  return `${cardInscricoes()}<div class="card">
    <div class="row wrap" style="margin-bottom:10px"><input class="inp" style="max-width:360px" id="busca" placeholder="Buscar aluno" value="${escapeH(UI.busca)}" data-act-in="busca" aria-label="Buscar aluno"><span class="small muted">${lista.length} de ${S.alunos.length} alunos</span></div>
    <div class="chips" style="margin-bottom:6px">${['todas',...atvs].map(k => `<button class="chip ${UI.escAtv===k?'on':''}" data-act="escAtv" data-v="${k}">${k==='todas'?'Todas':ATIV[k].curto} <span class="n">${k==='todas'?S.alunos.length:S.alunos.filter(a=>a.mats.some(m=>m.atv===k)).length}</span></button>`).join('')}</div>
    <div class="list">${lista.map(a => { const f = freqStatus(S,a); const sts = a.mats.map(m => statusPagamento(S,a,m).st); const pior = sts.includes('atrasado') ? 'atrasado' : sts.includes('avencer') ? 'avencer' : sts.includes('pausado') ? 'pausado' : 'pago';
      return `<div class="li tap" data-act="verAluno" data-v="${a.id}" role="button" tabindex="0">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">${a.mats.map(nomePlano).join(' + ')} · desde ${dataBR(a.desde)}/${a.desde.slice(2,4)}</span></div><div class="end">${pillPag(pior)}${pillFreq(f)}</div></div>`; }).join('')}</div></div>`;
}
function vGrade(meu){
  const dias = [1,2,3,4,5,6];
  return `<div class="card"><div class="card-h"><div><h3>Grade da semana</h3><span class="sub">${meu ? 'Suas aulas em destaque. Toque numa delas para ver a chamada ou pedir troca.' : 'Horários de exemplo · ajustar com a grade real do Espaço'}</span></div></div>
    <div class="week">${dias.map(d => `<div class="day"><h4 class="${HOJE.getDay()===d?'today':''}"><span>${DIAS[d]}</span></h4><div>${TURMAS.filter(t => t.dia === d).sort((a,b)=>a.h.localeCompare(b.h)).map(t => { const mine = meu && t.instr === meu; const n = t.aluno ? 1 : matriculadosNaTurma(S,t.id).length;
      return `<button class="slot ${meu ? (mine?'mine':'dim') : ''}" style="--c:${ATIV[t.atv].hex}" ${(!meu||mine)?`data-act="${meu?'minhaTurma':'verTurma'}" data-v="${t.id}"`:'tabindex="-1"'}><span class="tiny muted">${t.h} · ${t.sala}</span><b>${nomeTurma(t)}</b><span class="tiny">${PESSOA[t.instr].nome} · ${n} ${n===1?'aluno':'alunos'}</span></button>`; }).join('')}</div></div>`).join('')}</div>
    <p class="small muted" style="margin-top:6px">Inglês, massagem terapêutica e terapias integrais não entram na grade: são lançados à mão no balanço.</p></div>
  ${meu ? '' : vFeriados()}`;
}
/* feriados e dias sem aula: a aula sai da agenda sozinha e os alunos recebem o aviso */
function vFeriados(){
  const X = S.feriados = S.feriados || {extra:[], comAula:[]}, fim = iso(addD(HOJE, 120));
  const lista = [...Object.entries(FERIADOS_BASE).filter(([d]) => d >= HOJE_ISO && d <= fim).map(([d, nome]) => ({d, nome, base:true})), ...(X.extra || []).filter(x => x.d >= HOJE_ISO).map(x => ({...x, extra:true}))].sort((a, b) => a.d < b.d ? -1 : 1);
  return `<div class="card"><div class="card-h"><div><h3>Feriados e dias sem aula</h3><span class="sub">No feriado a aula é desmarcada sozinha e os alunos recebem o aviso dois dias antes</span></div><button class="btn sec sm" data-act="feriadoNovo">${ic('plus','sm')}Dia sem aula</button></div>
    <div class="list">${lista.map(f => { const tem = f.base && (X.comAula || []).includes(f.d), n = TURMAS.filter(t => t.dia === pd(f.d).getDay() && !t.aluno).length;
      return `<div class="li" style="${tem ? 'opacity:.6' : ''}"><span class="ico-b">${ic(tem ? 'calendar-check' : 'calendar-x')}</span><div class="main-c"><span class="t">${DIAS_L[pd(f.d).getDay()]}, ${dataBR(f.d)} · ${escapeH(f.nome)}</span><span class="s">${tem ? 'Vai ter aula normal' : `Sem aula · ${n} ${n === 1 ? 'turma' : 'turmas'} desmarcada${n === 1 ? '' : 's'}`}${f.extra ? ' · dia que vocês fecharam' : ''}</span></div>
        <div class="end">${f.base ? `<button class="chip ${tem ? '' : 'on'}" style="height:30px" data-act="feriadoToggle" data-v="${f.d}">${tem ? 'Tem aula' : 'Sem aula'}</button>` : `<button class="btn ghost sm" data-act="feriadoDel" data-v="${f.d}">${ic('x','sm')}Tirar</button>`}</div></div>`; }).join('') || '<p class="small muted">Nenhum feriado nos próximos meses.</p>'}</div>
    <p class="tiny muted" style="margin-top:8px">Feriados nacionais já vêm marcados. Feriado da cidade, recesso ou férias: toque em "Dia sem aula".</p></div>`;
}
const MONO = {nao:['Não começou','neu'], tema:['Tema definido','pri'], escrevendo:['Escrevendo','warn'], entregue:['Entregue','ok']};
function vFormacaoAdmin(){
  const st = formacaoStatus(), fs = S.formandos.map(f => ({f, s:formandoSituacao(f, st)}));
  const abaixo = fs.filter(x => x.s.st !== 'ok'), mediaEst = fs.reduce((t,x) => t + x.f.estagio, 0) / fs.length;
  const fimProx = st.prox ? iso(addD(pd(st.prox),1)) : null;
  return `
  <div class="card pad-lg" style="border-top:4px solid var(--pri)">
    <div class="row wrap" style="justify-content:space-between;align-items:flex-start;gap:14px">
      <div style="min-width:0;flex:1"><div class="eyebrow">${FORMACAO.turma} · começou em ${nomeMes(FORMACAO.inicio).toLowerCase()}</div><h2 style="font-size:24px;margin-top:4px">${FORMACAO.nome}</h2><p class="small muted" style="margin-top:6px;max-width:62ch">${FORMACAO.formato}</p></div>
      ${st.prox ? `<div class="stat" style="min-width:200px"><span class="k">${ic('calendar','sm')}Próximo módulo</span><span class="v" style="font-size:22px">${dataBR(st.prox)} e ${dataBR(fimProx)}</span><span class="d">módulo ${st.feitos+1} de ${FORMACAO.modulos} · data de exemplo</span></div>` : ''}
    </div>
    <div style="margin-top:14px"><div class="row" style="justify-content:space-between" ><span class="small strong">${st.feitos} de ${FORMACAO.modulos} módulos</span><span class="small muted">${Math.round(st.feitos/FORMACAO.modulos*100)}%</span></div>
      <div class="hbar"><div class="track" style="margin-top:6px"><span style="width:${RM?Math.round(st.feitos/FORMACAO.modulos*100):0}%;background:var(--pri)" data-w="${Math.round(st.feitos/FORMACAO.modulos*100)}"></span></div></div></div>
  </div>
  <div class="grid g4">
    <div class="stat"><span class="k">${ic('graduation-cap','sm')}Formandos</span><span class="v">${fs.length}</span><span class="d">${fs.filter(x => x.f.aluno).length} já são alunos do Espaço</span></div>
    <div class="stat"><span class="k">${ic('check','sm')}Frequência média</span><span class="v">${Math.round(fs.reduce((t,x)=>t+x.s.pct,0)/fs.length*100)}%</span><span class="d">80% do curso para certificar (até ${Math.floor(FORMACAO.modulos*2*.2)} faltas)</span></div>
    <div class="stat"><span class="k" style="color:${abaixo.length?'var(--warn)':'inherit'}">${ic('triangle-alert','sm')}Perto do limite de faltas</span><span class="v" style="color:${abaixo.length?'var(--warn)':'inherit'}">${abaixo.length}</span><span class="d">${abaixo.map(x => x.f.nome.split(' ')[0]).join(', ') || 'ninguém'}</span></div>
    <div class="stat"><span class="k">${ic('clock','sm')}Estágio médio</span><span class="v">${Math.round(mediaEst)}h</span><span class="d">de 60 horas</span></div>
  </div>
  <div class="card"><div class="card-h"><div><h3>Formandos</h3><span class="sub">Presença por dia de módulo (${st.diasDados} dias até agora), estágio e monografia</span></div></div>
    <div class="list">${fs.map(({f,s}) => `<div class="li">${av(f.nome)}<div class="main-c"><span class="t">${escapeH(f.nome)}${f.aluno?' <span class="tag">aluno do Espaço</span>':''}</span>
        <span class="s">${f.dias} de ${st.diasDados} dias · ${s.st === 'ok' ? s.txt : `<b style="color:var(${s.st==='bad'?'--bad':'--warn'})">${s.txt}</b>`}</span>
        <div class="hbar" style="margin-top:6px;max-width:320px"><span class="tiny muted">Estágio ${f.estagio}h de 60h</span><span></span><div class="track" style="margin-bottom:0"><span style="width:${RM?Math.round(f.estagio/60*100):0}%;background:var(--folha)" data-w="${Math.round(f.estagio/60*100)}"></span></div></div></div>
      <div class="end"><span class="pill ${s.st}">${ic(s.st==='ok'?'check':'circle-alert')}${Math.round(s.pct*100)}% de presença</span><span class="pill ${MONO[f.mono][1]}">${MONO[f.mono][0]}</span><button class="btn ghost sm" data-act="estagio" data-v="${f.id}">${ic('plus','sm')}4h estágio</button></div></div>`).join('')}</div></div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><h3>Para receber o certificado</h3></div><div class="list">${FORMACAO.requisitos.map(([k,t]) => `<div class="li"><span class="ico-b">${ic({freq:'check',estagio:'clock',mono:'notebook-pen',aval:'clipboard-check'}[k])}</span><div class="main-c"><span class="t">${t}</span></div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Mentores</h3><span class="sub">como estão no site</span></div><div class="list">${FORMACAO.mentores.map(m => `<div class="li">${av(m.nome)}<div class="main-c"><span class="t">${m.nome}</span><span class="s">${m.bio}</span></div></div>`).join('')}</div></div>
  </div>`;
}
function vEquipe(){
  const sairam = (S.equipe || []).filter(p => p.ativo === false);
  return `<div class="card"><div class="card-h"><div><h3>Equipe</h3><span class="sub">Quem dá aula, quais alunos cada pessoa enxerga e o código de acesso de cada uma</span></div><button class="btn sol" data-act="novoInstrutor">${ic('user-plus')}Cadastrar instrutor</button></div>
    <div class="list">${EQUIPE.map(p => { const c = (S.codigos || {})[p.id], ver = UI.verCod === p.id;
      return `<div class="li" style="align-items:flex-start">${av(p.nome)}<div class="main-c" style="flex:1;min-width:0"><span class="t">${p.nomeCompleto ? `${p.nome} <span class="small muted" style="font-weight:500">· ${p.nomeCompleto}</span>` : p.nome}${p.obs?` <span class="tag">${p.obs}</span>`:''}</span><span class="s">${p.atvs.filter(a => ATIV[a]).map(a => ATIV[a].curto).join(', ')} · vê ${alunosVisiveis(S,p.id).length} alunos · ${p.atvs.filter(a => ATIV[a]).map(a => Math.round(S.regras.pct[a]*100)+'%').filter((x,i,arr)=>arr.indexOf(x)===i).join(' / ')}</span>${p.bio?`<span class="s">${p.bio}</span>`:''}
        ${c ? `<div class="row wrap" style="gap:6px;margin-top:8px;align-items:center"><span class="pill neu">${ic('lock')}PIN <b class="num" style="letter-spacing:.12em;margin-left:4px">${ver ? c.c.slice(0,3) + ' ' + c.c.slice(3) : '••• •••'}</b></span><button class="btn ghost sm" data-act="verCodigo" data-v="${p.id}">${ver ? 'Esconder' : 'Ver'}</button><button class="btn sec sm" data-act="novoCodigo" data-v="${p.id}">${ic('rotate-ccw','sm')}Gerar novo</button><span class="tiny muted">desde ${dataBR(c.em)}</span></div>` : ''}</div><button class="iconbtn" data-act="editarInstrutor" data-v="${p.id}" aria-label="Editar ou excluir ${escapeH(p.nome)}">${ic('pencil','sm')}</button></div>`; }).join('')}</div>
    ${sairam.length ? `<div class="eyebrow" style="margin:14px 0 6px">Saíram da equipe</div><div class="list">${sairam.map(p => `<div class="li" style="opacity:.7">${av(p.nome)}<div class="main-c"><span class="t">${escapeH(p.nome)}</span><span class="s">saiu em ${dataBR(p.saiu || HOJE_ISO)} · aulas e repasses continuam no histórico</span></div></div>`).join('')}</div>` : ''}
    <div class="alert pri" style="margin-top:12px"><span class="ib">${ic('lock')}</span><div><div class="t">Cada instrutor entra só com o PIN</div><div class="s">São 6 números, só dela, e nenhum se repete: a entrada do app não mostra nomes, o PIN já diz quem é. Ela digita uma vez no celular dela. Se alguém sair da equipe ou o PIN vazar, toque em "Gerar novo": o antigo para de valer na hora, em todo aparelho. Cinco erros seguidos bloqueiam por 15 minutos.</div></div></div>
    <div class="eyebrow" style="margin:16px 0 6px">Administração · dois logins</div>
    <div class="list">${ADMINS.map(a => `<div class="li">${av(a.nome)}<div class="main-c"><span class="t">${escapeH(a.nome)}</span><span class="s">Entra com a conta Google + PIN do painel ${UI.verPinAdm === a.id ? `<b class="num">${(S.pinAdmin || {})[a.id] || '—'}</b>` : '••••'}</span></div><div class="end">${UI.who.admin === a.id ? `<button class="btn ghost sm" data-act="verPinAdm" data-v="${a.id}">${UI.verPinAdm === a.id ? 'Esconder' : 'Ver'}</button><button class="btn sec sm" data-act="trocarPinAdm" data-v="${a.id}">${ic('rotate-ccw','sm')}Trocar PIN</button>` : '<span class="tiny muted">só ela troca o dela</span>'}</div></div>`).join('')}</div>
    <div class="alert pri" style="margin-top:8px"><span class="ib">${ic('users')}</span><div><div class="t">Quem vê quem</div><div class="s">Aluno de yoga em turma aparece para todas as instrutoras de yoga. Aluno de yoga particular aparece só para a instrutora que ele escolheu. Aquarela só para o professor de aquarela, e assim por diante.</div></div></div></div>`;
}
function vSubsAdmin(){
  return `<div class="card"><div class="card-h"><div><h3>Pedidos de troca de aula</h3><span class="sub">As instrutoras pedem e aceitam pelo app; vocês só acompanham</span></div></div>
  <div class="list">${S.subs.slice().reverse().map(s => `<div class="li"><span class="ico-b">${ic('repeat')}</span><div class="main-c"><span class="t">${nomeTurma(TURMA[s.turma])} · ${DIAS[pd(s.d).getDay()]} ${dataBR(s.d)} ${TURMA[s.turma].h}</span><span class="s">${PESSOA[s.de].nome} pediu${s.para?` · ${PESSOA[s.para].nome} assume`:''} · "${escapeH(s.motivo)}"</span></div>${s.status==='aberto'?'<span class="pill warn">Aguardando</span>':s.status==='aceito'?`<span class="pill ok">${ic('check')}Coberta</span>`:'<span class="pill neu">Cancelado</span>'}</div>`).join('') || '<p class="muted">Nenhum pedido.</p>'}</div>
  <h3 style="font-size:15px;margin:16px 0 6px">Trocas que já aconteceram</h3>
  <div class="list">${Object.values(S.aulas).filter(a => a.sub).map(a => `<div class="li"><span class="ico-b">${ic('check')}</span><div class="main-c"><span class="t">${nomeTurma(TURMA[a.turma])} · ${dataBR(a.d)}</span><span class="s">${PESSOA[a.instr].nome} cobriu ${PESSOA[TURMA[a.turma].instr].nome}. A aula conta para quem deu.</span></div></div>`).join('')}</div></div>`;
}

/* ficha do aluno */
function folhaAluno(aid, modo='admin'){
  const a = alunoPor(S, aid), f = freqStatus(S, a), pres = presencasDoAluno(S, aid);
  const pags = S.pagamentos.filter(p => p.a === aid).sort((x,y) => x.d < y.d ? 1 : -1).slice(0,6);
  abrirFolha(`${folhaCab(escapeH(a.nome), `Aluno desde ${dataBR(a.desde)}/${a.desde.slice(0,4)}${a.obs?' · '+escapeH(a.obs):''}`)}
  <div class="stack">
    <div class="row wrap">${pillFreq(f)}<span class="sp"></span><span class="small muted">${pres.length} aulas desde agosto</span></div>
    <div><div class="eyebrow" style="margin-bottom:6px">Presença nas últimas 12 semanas</div>${pontosSemanas(aid, 12)}</div>
    <div class="list">${(modo === 'admin' ? a.mats : matsVisiveis(a, UI.who.instrutor)).map(m => { const st = statusPagamento(S,a,m); return `<div class="li"><span class="ico-b" style="color:${ATIV[m.atv].hex}">${ic(ATIV[m.atv].icon)}</span><div class="main-c"><span class="t">${nomePlano(m)}${m.instr?` com ${PESSOA[m.instr].nome}`:''}</span><span class="s">${m.turmas.map(t => TURMA[t] ? `${DIAS[TURMA[t].dia]} ${TURMA[t].h}` : '').join(', ')}${modo==='admin'?` · ${brl(valorMat(S,m))}${m.ajuste ? ` <b style="color:var(--pri)">(${m.ajuste.tipo === 'pct' ? m.ajuste.v + '% de desconto' : 'valor próprio'}${m.ajuste.motivo ? ': ' + escapeH(m.ajuste.motivo) : ''})</b>` : ''} · vence dia ${m.venc}`:''}</span></div>${modo==='admin'?`<div class="end">${pillPag(st.st)}${ehPlataforma(m.plano) ? '' : `<button class="btn ghost sm" data-act="ajusteMat" data-v="${m.id}">${ic('percent','sm')}Ajustar valor</button>`}</div>`:''}</div>`; }).join('')}</div>
    ${blocoFicha(a, modo)}
    <div class="row wrap"><span class="small muted">Telefone</span><b class="num">${a.tel}</b><button class="btn ghost sm" data-act="copiar" data-v="${a.tel}">${ic('copy','sm')}Copiar</button>${f.st !== 'ok' ? `<button class="btn sec sm" data-act="saudade" data-v="${a.id}">${ic('heart','sm')}Mensagem de saudade</button>` : ''}</div>
    ${modo==='admin' ? `<div><div class="eyebrow" style="margin-bottom:6px">Pagamentos</div><div class="list">${pags.map(p => `<div class="li"><div class="main-c"><span class="t">${nomeMes(p.mes)}</span><span class="s">${dataBR(p.d)} · ${p.metodo==='cartao'?'cartão':p.metodo}</span></div><b class="num">${brl(p.valor)}</b></div>`).join('') || '<p class="muted small">Nenhum pagamento registrado.</p>'}</div></div>` : ''}
  </div>`);
}
function folhaNovoAluno(){
  const atvs = Object.entries(ATIV);
  abrirFolha(`${folhaCab('Novo aluno', 'Assim que salvar, ele aparece para quem dá a atividade escolhida.')}
  <form class="stack" id="fNovo">
    <div class="field"><label for="nNome">Nome</label><input class="inp" id="nNome" required placeholder="Nome completo"></div>
    <div class="field"><label for="nTel">WhatsApp</label><input class="inp" id="nTel" inputmode="tel" placeholder="(41) 9 0000-0000"></div>
    <div class="field"><label>Atividade</label><div class="optgrid">${atvs.map(([k,a],i) => `<button type="button" class="opt ${i===0?'on':''}" data-act="opt" data-grp="nAtv" data-v="${k}">${ic(a.icon)}${a.curto}</button>`).join('')}</div><input type="hidden" id="nAtv" value="yoga"></div>
    <div class="field" id="nPlanoF"><label>Plano de yoga</label><div class="optgrid">${Object.entries(PLANOS_YOGA).filter(([k])=>k!=='avulsa').map(([k,p],i) => `<button type="button" class="opt ${k==='2x'?'on':''}" data-act="opt" data-grp="nPlano" data-v="${k}"><span>${p.nome}<br><b class="num">${brl(S.regras.planos[k])}</b></span></button>`).join('')}</div><input type="hidden" id="nPlano" value="2x"></div>
    <div class="field" id="nInstrF" hidden><label>Com quem</label><div class="optgrid"></div><input type="hidden" id="nInstr" value=""><span class="help">O aluno só aparece para quem você escolher.</span></div>
    <div class="field"><label>Turmas</label><div class="optgrid" id="nTurmas">${TURMAS.filter(t=>t.atv==='yoga').map(t => `<button type="button" class="opt" data-act="optMulti" data-grp="nTur" data-v="${t.id}">${DIAS[t.dia]} ${t.h}<br><span class="tiny muted">${PESSOA[t.instr].nome}</span></button>`).join('')}</div><input type="hidden" id="nTur" value=""></div>
    <div class="grid g2"><div class="field"><label for="nVenc">Dia do vencimento</label><input class="inp num" id="nVenc" inputmode="numeric" value="${HOJE.getDate()}"></div>
    <div class="field"><label>Pagamento</label><div class="optgrid">${[['pix','Pix'],['cartao','Cartão automático']].map(([k,l],i)=>`<button type="button" class="opt ${i===0?'on':''}" data-act="opt" data-grp="nMet" data-v="${k}">${l}</button>`).join('')}</div><input type="hidden" id="nMet" value="pix"></div></div>
    <div class="sheet-foot"><button type="button" class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" type="submit">${ic('user-plus')}Cadastrar aluno</button></div>
  </form>`);
}

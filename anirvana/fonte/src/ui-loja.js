/* ============================================================
   LOJINHA — lançamento de vendas (não é catálogo para alunos)
   separa por fornecedor e calcula o repasse de cada um
   ============================================================ */
const prodPor = id => (S.produtos || []).find(p => p.id === id);
function vLojinha(){
  const abas = [['vender','Vender'],['produtos','Produtos'],['vendas','Vendas'],['fornecedores','Fornecedores'],['receber','A receber']];
  const forn = saldoFornecedores(S).reduce((s,f) => s + Math.max(0,f.saldo), 0), fi = S.fiado.filter(f => !f.pago).reduce((s,f) => s + f.valor, 0);
  return `
  <div class="pagehead"><div><h1>Lojinha</h1><p>Registre a venda e o app separa o que é de cada fornecedor e o que fica no Espaço.</p></div>
    <div class="seg">${abas.map(([k,l]) => `<button class="${UI.lojaVis===k?'on':''}" data-act="lojaVis" data-v="${k}">${l}${k==='fornecedores'&&forn>0?` · ${brl0(forn)}`:k==='receber'&&fi>0?` · ${brl0(fi)}`:''}</button>`).join('')}</div></div>
  ${UI.lojaVis === 'produtos' ? vLojaProdutos() : UI.lojaVis === 'vendas' ? vLojaVendas() : UI.lojaVis === 'fornecedores' ? vLojaForn() : UI.lojaVis === 'receber' ? vLojaReceber() : vLojaVender()}`;
}
function vLojaVender(){
  const fs = FORNECEDORES.filter(f => f.ativo !== false), todos = (S.produtos || []).filter(p => FORN[p.forn] && FORN[p.forn].ativo !== false);
  const n = fs.length, raio = Math.round(70 / Math.tan(Math.PI / n));
  const prods = todos.filter(p => (!UI.lojaForn || p.forn === UI.lojaForn) && (!UI.lojaCat || p.cat === UI.lojaCat));
  const cats = Object.entries(CATS_LOJA).filter(([k]) => todos.some(p => p.cat === k && (!UI.lojaForn || p.forn === UI.lojaForn)));
  const hoje = lojaMes(S, MES_ATUAL), vHoje = S.vendas.filter(v => v.d === HOJE_ISO), tHoje = vHoje.reduce((s, v) => s + v.valor, 0);
  const modelo = f => f.modelo === 'proprio' ? 'estoque do Espaço' : f.modelo === 'integral' ? 'repasse de 100%' : `consignado ${Math.round(f.pct*100)}/${Math.round((1-f.pct)*100)}`;
  return `
  <div class="loja-topo">
    <button class="loja-livre" data-act="itemLivre"><span class="ico-b">${ic('pencil')}</span><span class="tx"><b>Outro item</b><small>Digite o que foi vendido, o valor e de quem é. Pode guardar como produto.</small></span><span class="mais">${ic('plus')}</span></button>
    <div class="loja-resumo"><div><span class="k">Hoje</span><b class="num">${brl(tHoje)}</b><small>${vHoje.length} ${vHoje.length === 1 ? 'item vendido' : 'itens vendidos'}</small></div><div><span class="k">${nomeMes(MES_ATUAL)}</span><b class="num">${brl(hoje.bruto)}</b><small>${brl(hoje.ea)} ficam no Espaço</small></div></div>
  </div>
  ${todos.length ? `<div class="loja-busca"><label class="busca-w">${ic('search','sm')}<input class="inp" id="lojaBusca" placeholder="Buscar produto" data-act-in="lojaBusca" aria-label="Buscar produto" autocomplete="off"></label><button class="btn sec" data-act="novoProduto" data-forn="${UI.lojaForn || ''}">${ic('plus','sm')}Produto</button></div>` : ''}
  <section class="shop-hero"><div class="raios" aria-hidden="true"></div>
    <div class="cap"><div><div class="eyebrow">Fornecedores · gire e toque para filtrar</div><b style="font-family:var(--f-display);font-size:20px">${UI.lojaForn ? FORN[UI.lojaForn].nome : 'Todos os fornecedores'}</b>${UI.lojaForn ? `<div class="small muted">${modelo(FORN[UI.lojaForn])}${FORN[UI.lojaForn].obs?' · '+FORN[UI.lojaForn].obs:''}</div>` : `<div class="small muted">${hoje.n} vendas em ${nomeMes(MES_ATUAL).toLowerCase()} · ${brl(hoje.bruto)}</div>`}</div>
      ${UI.lojaForn ? `<button class="btn sec sm" data-act="lojaForn" data-v="">${ic('x','sm')}Ver todos</button>` : ''}</div>
    <div class="ring-stage" id="ringStage" aria-label="Carrossel de fornecedores">
      <div class="ring" id="ring" style="--r:${raio}px">${fs.map((f,i) => `<button class="fcard ${UI.lojaForn===f.id?'on':''}" style="--hue:${f.hue};transform:rotateY(${(360/n*i).toFixed(2)}deg) translateZ(${raio}px)" data-act="lojaForn" data-v="${f.id}" data-i="${i}"><span class="mono">${escapeH(f.curto[0])}</span><span><b>${escapeH(f.curto)}</b><small>${f.modelo==='consig'?Math.round(f.pct*100)+'% fornecedor':f.modelo==='integral'?'100% fornecedor':'100% Espaço'}</small></span></button>`).join('')}</div>
    </div>
  </section>
  <div class="chips"><button class="chip ${!UI.lojaCat?'on':''}" data-act="lojaCat" data-v="">Tudo</button>${cats.map(([k,c]) => `<button class="chip ${UI.lojaCat===k?'on':''}" data-act="lojaCat" data-v="${k}">${ic(c.icon,'sm')}${c.nome}</button>`).join('')}</div>
  ${!todos.length ? `<div class="card vazio-loja"><span class="ico-b">${ic('store','lg')}</span><div style="flex:1;min-width:0"><h3>A lojinha está pronta para os produtos de vocês</h3><p class="small muted" style="margin-top:4px">Os fornecedores já estão aqui, com o % de cada um. Cadastre cada produto uma vez (nome, preço e de quem é) e ele aparece para vender com um toque. Enquanto isso, use "Outro item" lá em cima: ele já guarda o produto para a próxima venda.</p></div><button class="btn sol" data-act="novoProduto" data-forn="${UI.lojaForn || ''}">${ic('plus')}Cadastrar produto</button></div>` : UI.lojaForn && !prods.length ? `<div class="card vazio-loja"><div style="flex:1;min-width:0"><h3>${escapeH(FORN[UI.lojaForn].nome)} ainda não tem produto</h3></div><button class="btn sol" data-act="novoProduto" data-forn="${UI.lojaForn}">${ic('plus')}Cadastrar produto</button></div>` : ''}
  <div class="shopgrid" id="shopgrid">${prods.map(p => { const f = FORN[p.forn], q = UI.cart[p.id]||0;
    return `<button class="prod" style="--hue:${f.hue}" data-act="addCart" data-v="${p.id}" data-nome="${escapeH(p.nome.toLowerCase() + ' ' + f.curto.toLowerCase())}" aria-label="Adicionar ${escapeH(p.nome)}">${q?`<span class="q">${q}</span>`:''}<span class="ped">${ic(p.icon)}</span><span class="nm">${escapeH(p.nome)}</span><span class="fo">${escapeH(f.curto)}</span><span class="pr"><b>${brl(p.preco)}</b><span class="add">${ic('plus','sm')}</span></span></button>`; }).join('')}
  </div>
  ${barraCarrinho()}`;
}
function itensCarrinho(){ return Object.entries(UI.cart).filter(([,q]) => q > 0).map(([id,q]) => { const p = prodPor(id) || UI.livres[id]; return {...p, q, total:r2(p.preco*q)}; }); }
function barraCarrinho(){
  const it = itensCarrinho(), n = it.reduce((s,i) => s + i.q, 0), tot = it.reduce((s,i) => s + i.total, 0);
  return `<div class="cartbar ${n?'on':''}" id="cartbar"><span class="ci">${ic('shopping-bag','lg')}<b>${n}</b></span><div style="flex:1;min-width:0"><div class="tiny" style="opacity:.7">${n} ${n===1?'item':'itens'} · ${[...new Set(it.map(i => FORN[i.forn].curto))].join(', ')}</div><div class="tt">${brl(tot)}</div></div><button class="btn" data-act="checkout">Fechar venda${ic('arrow-right','sm')}</button></div>`;
}
const FORMAS = [['pix','Pix','qr-code'],['debito','Débito','credit-card'],['credito','Crédito','credit-card'],['credito2x','Crédito 2x','credit-card'],['credito3x','Crédito 3x','credit-card'],['dinheiro','Dinheiro','banknote'],['fiado','Fiado','receipt'],['descontado','Descontar do repasse','repeat']];
const nomeForma = k => (FORMAS.find(f => f[0] === k) || [k,k])[1];
function folhaCheckout(){
  const it = itensCarrinho(); if (!it.length) return;
  const tot = it.reduce((s,i) => s + i.total, 0);
  const porF = {}; it.forEach(i => { const f = FORN[i.forn]; const x = porF[f.id] = porF[f.id] || {f, total:0, forn:0}; x.total += i.total; x.forn += i.total * f.pct; });
  const fornTot = Object.values(porF).reduce((s,x) => s + x.forn, 0), eaTot = tot - fornTot;
  abrirFolha(`${folhaCab('Fechar venda', `${it.reduce((s,i)=>s+i.q,0)} itens · ${brl(tot)}`)}
  <div class="stack">
    <div class="list">${it.map(i => `<div class="li"><span class="ico-b" style="color:${FORN[i.forn].hue}">${ic(i.icon)}</span><div class="main-c"><span class="t">${escapeH(i.nome)}</span><span class="s">${FORN[i.forn].curto} · ${brl(i.preco)}</span></div><div class="row"><button class="iconbtn" data-act="qtd" data-v="${i.id}" data-x="-1" aria-label="Menos">${ic('minus')}</button><b class="num">${i.q}</b><button class="iconbtn" data-act="qtd" data-v="${i.id}" data-x="1" aria-label="Mais">${ic('plus')}</button></div></div>`).join('')}</div>
    <div><div class="row" style="justify-content:space-between;margin-bottom:8px"><b class="small">Para onde vai o dinheiro</b><span class="small muted num">${brl(tot)}</span></div>
      <div class="split-bar"><span style="flex-grow:${eaTot};background:var(--sol)"></span><span style="flex-grow:${fornTot};background:var(--chart-in)"></span></div>
      <div class="list" style="margin-top:6px">
        <div class="li"><i class="fdot" style="background:var(--sol)"></i><div class="main-c"><span class="t">Fica no Espaço</span></div><b class="num">${brl(eaTot)}</b></div>
        ${Object.values(porF).filter(x => x.forn > 0).map(x => `<div class="li"><i class="fdot" style="background:var(--chart-in)"></i><div class="main-c"><span class="t">${x.f.nome}</span><span class="s">${x.f.modelo==='integral'?'repasse de 100%':Math.round(x.f.pct*100)+'% de '+brl(x.total)}</span></div><b class="num">${brl(x.forn)}</b></div>`).join('')}
      </div></div>
    <div class="field"><label>Forma de pagamento</label><div class="optgrid">${FORMAS.map(([k,l,i],j) => `<button type="button" class="opt ${j===0?'on':''}" data-act="opt" data-grp="vForma" data-v="${k}">${ic(i)}${l}</button>`).join('')}</div><input type="hidden" id="vForma" value="pix"></div>
    <div class="field" id="vClienteF" hidden><label for="vCliente">Quem levou</label><input class="inp" id="vCliente" placeholder="Nome de quem vai pagar depois" list="vCliSug"><datalist id="vCliSug">${S.alunos.map(a => `<option value="${escapeH(a.nome)}">`).join('')}${EQUIPE.map(p => `<option value="${p.nome}">`).join('')}</datalist></div>
    <div class="sheet-foot"><button class="btn sec" data-act="fechar">Continuar vendendo</button><button class="btn pri" data-act="registrarVenda">${ic('check')}Registrar ${brl(tot)}</button></div>
  </div>`);
}
function folhaRecibo(venda){
  const ps = venda.itens.map(i => ({...i, f:FORN[i.forn]}));
  const ea = ps.reduce((s,i) => s + i.total*(1-i.f.pct), 0);
  abrirFolha(`<div class="receipt"><div class="paper">
    <div class="row" style="justify-content:space-between"><div><div class="eyebrow">Venda registrada</div><h2 style="font-size:26px;margin-top:4px" class="num">${brl(venda.total)}</h2></div><span class="ico-b" style="background:var(--ok-bg);color:var(--ok);width:48px;height:48px;border-radius:16px">${ic('check','lg')}</span></div>
    <div class="small muted" style="margin:4px 0 12px">${dataLonga(venda.d)} · ${nomeForma(venda.forma)}${venda.cliente?' · '+escapeH(venda.cliente):''}</div>
    <div class="list">${ps.map(i => `<div class="li"><div class="main-c"><span class="t">${i.q}× ${escapeH(i.nome)}</span><span class="s">${i.f.curto}${i.f.pct>0?` · ${brl(i.total*i.f.pct)} para o fornecedor`:' · tudo do Espaço'}</span></div><b class="num">${brl(i.total)}</b></div>`).join('')}</div>
    <div class="row" style="justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line-2)"><b>Fica no Espaço</b><b class="num" style="color:var(--sol-ink)">${brl(ea)}</b></div>
  </div></div>
  <div class="sheet-foot"><button class="btn pri" data-act="fechar">${ic('plus')}Nova venda</button></div>`);
  confete();
}
function confete(){
  if (RM) return;
  const cores = ['#EE7A2F','#F2B724','#78BC3A'], cx = innerWidth/2, cy = innerHeight*.45;
  for (let i=0;i<26;i++){
    const d = document.createElement('i'); d.className = 'confetti'; d.style.background = cores[i%3]; d.style.left = cx+'px'; d.style.top = cy+'px';
    document.body.appendChild(d);
    const ang = Math.random()*Math.PI*2, dist = 90 + Math.random()*160;
    d.animate([{transform:'translate(0,0) scale(1)', opacity:1},{transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist - 60}px) scale(.4)`, opacity:0}], {duration:900+Math.random()*400, easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish = () => d.remove();
  }
}
function vLojaVendas(){
  const meses = ['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10'];
  const L = lojaMes(S, UI.vendasMes);
  const porF = {}; L.vendas.forEach(v => { const p = partesVenda(v); const x = porF[v.forn] = porF[v.forn] || {v:0, forn:0}; x.v += v.valor; x.forn += p.forn; });
  return `<div class="chips">${meses.map(k => `<button class="chip ${UI.vendasMes===k?'on':''}" data-act="vendasMes" data-v="${k}">${nomeMes(k)}${k<='2026-07'?' <span class="n">planilha</span>':''}</button>`).join('')}</div>
  <div class="grid g4">
    <div class="stat"><span class="k">Vendido</span><span class="v">${brl0(L.bruto)}</span><span class="d">${L.n} vendas</span></div>
    <div class="stat"><span class="k"><i class="sw" style="background:var(--sol)"></i>Fica no Espaço</span><span class="v">${brl0(L.ea)}</span><span class="d">${L.bruto?Math.round(L.ea/L.bruto*100):0}% do vendido</span></div>
    <div class="stat"><span class="k"><i class="sw" style="background:var(--chart-in)"></i>Dos fornecedores</span><span class="v">${brl0(L.forn)}</span><span class="d">${Object.keys(porF).filter(k => FORN[k].pct>0).length} fornecedores</span></div>
    <div class="stat"><span class="k">Ticket médio</span><span class="v">${brl0(L.n?L.bruto/L.n:0)}</span><span class="d">por venda</span></div>
  </div>
  <div class="split">
    <div class="card"><div class="card-h"><h3>Vendas de ${nomeMes(UI.vendasMes).toLowerCase()}</h3>${UI.vendasMes<='2026-07'?'<span class="tag real">planilha</span>':'<span class="tag">exemplo</span>'}</div>
      <div class="list">${L.vendas.slice().sort((a,b) => a.d < b.d ? 1 : -1).map(v => { const p = partesVenda(v), f = FORN[v.forn]; return `<div class="li"><span class="ico-b" style="background:color-mix(in srgb,${f.hue} 18%,var(--surface));color:${f.hue}">${ic(v.evento?'ticket':'shopping-bag')}</span><div class="main-c"><span class="t">${escapeH(v.desc)}</span><span class="s">${dataBR(v.d)} · ${f.curto} · ${nomeForma(v.forma)}${v.evento?' · '+v.evento:''}</span></div><div class="end"><b class="num">${brl(v.valor)}</b><span class="tiny muted num">Espaço ${brl(p.ea)}</span></div></div>`; }).join('') || '<p class="muted">Sem vendas neste mês.</p>'}</div></div>
    <div class="card"><div class="card-h"><h3>Por fornecedor</h3></div>${hbarras(Object.entries(porF).sort((a,b)=>b[1].v-a[1].v).map(([k,x]) => ({lab:FORN[k].curto, v:x.v})), 'var(--sol)')}</div>
  </div>`;
}
function vLojaForn(){
  const fs = saldoFornecedores(S);
  const tot = fs.reduce((s,f) => s + Math.max(0,f.saldo), 0);
  const proprios = FORNECEDORES.filter(f => f.pct === 0 && f.ativo !== false), inativos = FORNECEDORES.filter(f => f.ativo === false && !fs.some(x => x.id === f.id));
  return `<div class="row wrap" style="justify-content:space-between;align-items:center"><div class="alert pri" style="flex:1;min-width:260px"><span class="ib">${ic('store')}</span><div><div class="t">${brl(tot)} a pagar aos fornecedores</div><div class="s">Cada fornecedor tem a sua regra: consignado (ele fica com uma parte), repasse de 100% ou estoque do Espaço. Mudar o % vale só para as vendas novas.</div></div></div><button class="btn sol" data-act="novoForn">${ic('user-plus')}Cadastrar fornecedor</button></div>
  <div class="grid g3">${fs.map(f => `<div class="card" style="border-top:4px solid ${f.hue};${f.ativo === false ? 'opacity:.7' : ''}">
    <div class="row" style="margin-bottom:10px"><span class="ico-b" style="background:${f.hue};color:#fff;font-weight:800;font-family:var(--f-display)">${escapeH(f.curto[0])}</span><div class="main-c" style="min-width:0;flex:1"><b style="font-size:15px">${escapeH(f.nome)}</b><span class="tiny muted">${f.modelo==='integral'?'Repasse de 100%':`Consignado · ${Math.round(f.pct*100)}% fornecedor`}${f.ativo === false ? ' · fora da lojinha' : ''}</span></div><button class="iconbtn" data-act="editarForn" data-v="${f.id}" aria-label="Editar ${escapeH(f.curto)}">${ic('pencil','sm')}</button></div>
    <div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="tiny muted">A pagar</div><div class="num" style="font-family:var(--f-display);font-size:26px;font-weight:750;color:${f.saldo>.01?'var(--ink)':'var(--muted)'}">${brl(Math.max(0,f.saldo))}</div></div><div class="tiny muted" style="text-align:right">vendido ${brl(f.devido + (f.pct<1? f.devido/f.pct*(1-f.pct):0))}<br>já pago ${brl(f.pago)}</div></div>
    <div class="row wrap" style="margin-top:12px">${f.pix?`<button class="btn ghost sm" data-act="copiar" data-v="${f.pix}">${ic('copy','sm')}Pix ${f.pix}</button>`:'<span class="tiny muted">Pix não cadastrado</span>'}<span class="sp"></span>${f.saldo > .01 ? `<button class="btn ok sm" data-act="pagarForn" data-v="${f.id}">Paguei</button>` : `<span class="pill ok">${ic('check')}Em dia</span>`}</div>
  </div>`).join('')}</div>
  ${proprios.length ? `<div class="card"><div class="card-h"><div><h3>Estoque do Espaço</h3><span class="sub">Tudo o que vende fica com o Espaço</span></div></div><div class="list">${proprios.map(f => `<div class="li tap" data-act="editarForn" data-v="${f.id}" role="button" tabindex="0"><span class="ico-b" style="background:${f.hue};color:#fff;font-weight:800">${escapeH(f.curto[0])}</span><div class="main-c"><span class="t">${escapeH(f.nome)}</span><span class="s">${escapeH(f.obs || 'estoque próprio')}</span></div>${ic('pencil','sm')}</div>`).join('')}</div></div>` : ''}
  ${inativos.length ? `<div class="card flat"><div class="eyebrow" style="margin-bottom:6px">Fora da lojinha</div><div class="list">${inativos.map(f => `<div class="li"><div class="main-c"><span class="t">${escapeH(f.nome)}</span></div><button class="btn ghost sm" data-act="reativarForn" data-v="${f.id}">Voltar para a lojinha</button></div>`).join('')}</div></div>` : ''}
  <p class="small muted">As chaves Pix aparecem mascaradas neste protótipo. No app de verdade ficam guardadas no banco, visíveis só para a administração.</p>`;
}
function vLojaReceber(){
  const ab = S.fiado.filter(f => !f.pago), ok = S.fiado.filter(f => f.pago);
  return `<div class="grid g3"><div class="stat"><span class="k">A receber</span><span class="v">${brl(ab.reduce((s,f)=>s+f.valor,0))}</span><span class="d">${ab.length} pendências · o mesmo total da planilha</span></div></div>
  <div class="card"><div class="card-h"><h3>Compras fiadas e parcelas</h3><span class="sub">Quando a pessoa acerta, toque em Recebi</span></div>
  <div class="list">${ab.map(f => `<div class="li">${av(f.cliente)}<div class="main-c"><span class="t">${escapeH(f.cliente)}</span><span class="s">${escapeH(f.desc)} · desde ${dataBR(f.d)} (${diasEntre(pd(f.d),HOJE)} dias)</span></div><div class="end"><b class="num">${brl(f.valor)}</b><button class="btn ok sm" data-act="recebiFiado" data-v="${f.id}">Recebi</button></div></div>`).join('') || '<p class="muted">Ninguém devendo.</p>'}
  ${ok.map(f => `<div class="li" style="opacity:.6">${av(f.cliente)}<div class="main-c"><span class="t">${escapeH(f.cliente)}</span><span class="s">${escapeH(f.desc)}</span></div><span class="pill ok">${ic('check')}Recebido</span></div>`).join('')}</div></div>`;
}
function folhaItemLivre(){
  abrirFolha(`${folhaCab('Outro item', 'Para o que ainda não está no catálogo')}
  <form class="stack" id="fLivre">
    <div class="field"><label for="ilNome">O que foi vendido</label><input class="inp" id="ilNome" required placeholder="Ex.: 1 vela de massagem"></div>
    <div class="field"><label for="ilValor">Valor</label><input class="inp money num" id="ilValor" inputmode="decimal" required placeholder="0,00"></div>
    <div class="field"><label>Fornecedor</label><div class="optgrid">${FORNECEDORES.filter(f => f.ativo !== false).map((f,i) => `<button type="button" class="opt ${i===0?'on':''}" data-act="opt" data-grp="ilForn" data-v="${f.id}"><i class="fdot" style="background:${f.hue}"></i>${escapeH(f.curto)}</button>`).join('')}</div><input type="hidden" id="ilForn" value="ea"></div>
    <label class="row small" style="gap:10px;cursor:pointer"><input type="checkbox" id="ilGuardar" checked style="width:20px;height:20px;accent-color:var(--pri)"> Guardar como produto para as próximas vendas</label>
    <div class="sheet-foot"><button type="button" class="btn sec" data-act="fechar">Cancelar</button><button class="btn pri" type="submit">${ic('plus')}Pôr na venda</button></div>
  </form>`);
}

/* ---------- fornecedores: cadastro e edição ---------- */
function folhaFornecedor(id){
  const f = id ? FORN[id] : {nome:'', curto:'', modelo:'consig', pct:.8, pix:'', tel:'', obs:''};
  const vendas = id ? S.vendas.filter(v => v.forn === id).length : 0;
  abrirFolha(`${folhaCab(id ? `Editar ${escapeH(f.curto)}` : 'Cadastrar fornecedor', id ? `${vendas} vendas no histórico` : 'Quem deixa produto para vender na lojinha')}
  <form class="stack" id="fForn" data-id="${id || ''}">
    <div class="field"><label for="fnNome">Nome</label><input class="inp" id="fnNome" required maxlength="60" value="${escapeH(f.nome)}" placeholder="Ex.: Ateliê Lua Nova (Joana)"></div>
    <div class="grid g2"><div class="field"><label for="fnCurto">Nome curto</label><input class="inp" id="fnCurto" maxlength="18" value="${escapeH(f.curto)}" placeholder="Aparece nos botões"></div>
      <div class="field"><label for="fnTel">WhatsApp</label><input class="inp" id="fnTel" inputmode="tel" value="${escapeH(f.tel || '')}" placeholder="(41) 9 0000-0000"></div></div>
    <div class="field"><label>Como funciona com ele</label><div class="optgrid">${[['consig','Consignado','ele fica com uma parte'],['integral','Repasse de 100%','tudo vai para ele'],['proprio','Estoque do Espaço','tudo fica no Espaço']].map(([k,l,d]) => `<button type="button" class="opt ${f.modelo===k?'on':''}" data-act="opt" data-grp="fnModelo" data-v="${k}"><span>${l}<br><span class="tiny muted">${d}</span></span></button>`).join('')}</div><input type="hidden" id="fnModelo" value="${f.modelo}"></div>
    <div class="field" id="fnPctF" ${f.modelo === 'consig' ? '' : 'hidden'}><label for="fnPct">% que fica com o fornecedor</label><input class="inp num" id="fnPct" inputmode="numeric" data-act-in="fnPct" value="${Math.round((f.pct || .8) * 100)}"><span class="help" id="fnPctAj">O Espaço fica com ${100 - Math.round((f.pct || .8) * 100)}%.${id ? ' Vendas antigas não mudam.' : ''}</span></div>
    <div class="field"><label for="fnPix">Chave Pix (para pagar o repasse)</label><input class="inp" id="fnPix" value="${escapeH(f.pix || '')}" placeholder="CPF, telefone, e-mail ou chave aleatória"></div>
    <div class="field"><label for="fnObs">Observação</label><input class="inp" id="fnObs" maxlength="120" value="${escapeH(f.obs || '')}" placeholder="Ex.: acerta todo dia 5"></div>
    <div class="sheet-foot">${id && f.id !== 'ea' ? `<button type="button" class="btn ghost" data-act="desativarForn" data-v="${id}">${ic('x','sm')}${vendas ? 'Tirar da lojinha' : 'Apagar'}</button>` : `<button type="button" class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" type="submit">${ic('check')}Salvar</button></div>
  </form>`);
}

/* ---------- produtos: a administração cadastra, edita e tira ---------- */
function vLojaProdutos(){
  const todos = S.produtos || [];
  return `<div class="row wrap" style="justify-content:space-between;align-items:center"><p class="small muted" style="max-width:60ch">${todos.length ? `${todos.length} ${todos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}. Toque num produto para mudar o preço ou tirar da lojinha.` : 'Nenhum produto ainda. Cadastre por fornecedor: o % de cada um já está certo.'}</p><button class="btn sol" data-act="novoProduto">${ic('plus')}Novo produto</button></div>
  <div class="grid g2">${FORNECEDORES.filter(f => f.ativo !== false).map(f => { const ps = todos.filter(p => p.forn === f.id);
    return `<div class="card" style="border-top:4px solid ${f.hue}"><div class="card-h"><div><h3>${escapeH(f.nome)}</h3><span class="sub">${f.modelo === 'proprio' ? 'estoque do Espaço' : f.modelo === 'integral' ? 'repasse de 100%' : `consignado ${Math.round(f.pct*100)}% fornecedor · ${Math.round((1-f.pct)*100)}% Espaço`}</span></div><button class="btn ghost sm" data-act="novoProduto" data-forn="${f.id}">${ic('plus','sm')}Produto</button></div>
      <div class="list">${ps.map(p => `<div class="li tap" data-act="editarProduto" data-v="${p.id}" role="button" tabindex="0"><span class="ico-b" style="color:${f.hue}">${ic(p.icon || CATS_LOJA[p.cat]?.icon || 'tag')}</span><div class="main-c"><span class="t">${escapeH(p.nome)}</span><span class="s">${CATS_LOJA[p.cat]?.nome || 'Outros'}</span></div><b class="num">${brl(p.preco)}</b></div>`).join('') || '<p class="small muted">Nenhum produto cadastrado.</p>'}</div></div>`; }).join('')}</div>`;
}
function folhaProduto(id, forn){
  const p = id ? prodPor(id) : {nome:'', preco:'', forn: forn || FORNECEDORES[0].id, cat:'casa'};
  abrirFolha(`${folhaCab(id ? 'Editar produto' : 'Novo produto', 'Aparece na tela de vender. O app já separa a parte do fornecedor.')}
  <form class="stack" id="fProduto" data-id="${id || ''}">
    <div class="field"><label for="pdNome">Nome do produto</label><input class="inp" id="pdNome" required maxlength="60" value="${escapeH(p.nome)}" placeholder="Ex.: Incenso nag champa"></div>
    <div class="field"><label for="pdPreco">Preço</label><input class="inp money num" id="pdPreco" inputmode="decimal" required value="${p.preco === '' ? '' : String(p.preco.toFixed(2)).replace('.', ',')}" placeholder="0,00"></div>
    <div class="field"><label>De quem é</label><div class="optgrid">${FORNECEDORES.filter(f => f.ativo !== false).map(f => `<button type="button" class="opt ${p.forn===f.id?'on':''}" data-act="opt" data-grp="pdForn" data-v="${f.id}"><i class="fdot" style="background:${f.hue}"></i>${escapeH(f.curto)}</button>`).join('')}</div><input type="hidden" id="pdForn" value="${p.forn}"></div>
    <div class="field"><label>Categoria</label><div class="optgrid">${Object.entries(CATS_LOJA).map(([k,c]) => `<button type="button" class="opt ${p.cat===k?'on':''}" data-act="opt" data-grp="pdCat" data-v="${k}">${ic(c.icon)}<span>${c.nome}</span></button>`).join('')}</div><input type="hidden" id="pdCat" value="${p.cat}"></div>
    <div class="sheet-foot">${id ? `<button type="button" class="btn ghost" data-act="removerProduto" data-v="${id}">${ic('x','sm')}Tirar da lojinha</button>` : `<button type="button" class="btn sec" data-act="fechar">Cancelar</button>`}<button class="btn pri" type="submit">${ic('check')}Salvar produto</button></div>
  </form>`);
}

/* ---------- 3D: anel de fornecedores e cartões que inclinam ---------- */
let RING = {rot:0, vel:0, drag:false, raf:0, lastX:0, moved:0, idle:0};
function ligarLoja(){
  const stage = $('#ringStage'), ring = $('#ring');
  if (stage && ring){
    const n = ring.children.length, passo = 360/n;
    if (UI.lojaForn){ const i = +($(`.fcard[data-v="${UI.lojaForn}"]`, ring)?.dataset.i || 0); RING.rot = -i*passo; }
    ring.style.setProperty('--rot', RING.rot + 'deg');
    stage.onpointerdown = e => { RING.drag = true; RING.lastX = e.clientX; RING.moved = 0; RING.vel = 0; };
    window.onpointermove = e => { if (!RING.drag) return; const dx = e.clientX - RING.lastX; RING.lastX = e.clientX; RING.moved += Math.abs(dx); RING.rot += dx * .35; RING.vel = dx * .35; ring.style.setProperty('--rot', RING.rot + 'deg'); };
    window.onpointerup = () => { RING.drag = false; RING.idle = performance.now(); };
    stage.addEventListener('click', e => { if (RING.moved > 6){ e.stopPropagation(); e.preventDefault(); } }, true);
    cancelAnimationFrame(RING.raf);
    const tick = () => {
      if (!document.body.contains(ring)) return;
      if (!RING.drag){
        if (Math.abs(RING.vel) > .02){ RING.rot += RING.vel; RING.vel *= .94; }
        else if (!RM && !UI.lojaForn && performance.now() - RING.idle > 1500) RING.rot -= .08;
        ring.style.setProperty('--rot', RING.rot + 'deg');
      }
      RING.raf = requestAnimationFrame(tick);
    };
    RING.raf = requestAnimationFrame(tick);
  }
  if (!RM) $$('.prod').forEach(c => {
    c.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left)/r.width, y = (e.clientY - r.top)/r.height; c.style.transform = `perspective(700px) rotateY(${(x-.5)*16}deg) rotateX(${(.5-y)*14}deg) translateZ(6px)`; c.style.setProperty('--mx', x*100+'%'); c.style.setProperty('--my', y*100+'%'); });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}
function voar(de){
  const bar = $('#cartbar'); if (!de || !bar || RM) return;
  const a = de.querySelector('.ped').getBoundingClientRect(), b = bar.querySelector('.ci').getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'flyer'; f.style.setProperty('--hue', getComputedStyle(de).getPropertyValue('--hue')); f.style.left = (a.left + a.width/2 - 22) + 'px'; f.style.top = (a.top + a.height/2 - 22) + 'px';
  f.innerHTML = de.querySelector('.ped').innerHTML; document.body.appendChild(f);
  const dx = b.left - a.left - a.width/2 + 22, dy = b.top - a.top - a.height/2 + 22;
  f.animate([{transform:'translate(0,0) scale(1) rotate(0)'},{transform:`translate(${dx*.5}px,${dy*.5 - 140}px) scale(.85) rotate(-12deg)`, offset:.5},{transform:`translate(${dx}px,${dy}px) scale(.3) rotate(8deg)`, opacity:.3}], {duration:650, easing:'cubic-bezier(.45,.05,.35,1)'}).onfinish = () => { f.remove(); bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump'); };
}

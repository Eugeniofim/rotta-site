/* Painel da Fada (ADM), dentro do próprio app.
   Prévia: abre por #/adm. Na versão final, só abre com o login da Paula (papel "dona" no banco).
   Avisos: aqui ficam guardados e aparecem na central de avisos do app; o envio para todos os
   celulares é feito pelo servidor (Web Push) na versão final. Neste aparelho, "Testar" mostra o aviso de verdade. */
(function () {
  const ICA = {
    hoje: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    avisos: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    lotes: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="m9.5 15 2 2 3.5-4"/>',
    clube: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5C10 4 6.5 5 7.5 7.5c.5 1 4.5 1 4.5 1s4-.1 4.5-1C17.5 5 14 4 12 8.5z"/>',
    clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2 .8 3.5 2.8 3.5 5.7"/>'
  };
  const ABAS = [['hoje', 'Hoje'], ['avisos', 'Avisos'], ['lotes', 'Lotes'], ['clube', 'Clube'], ['clientes', 'Clientes']];
  const NIVEIS = () => Pontos.CFG.fada.niveis;
  const n = x => Number(x).toLocaleString('pt-BR');

  let rasc = { titulo: '', texto: '', link: '#/lancamentos', foto: true, publico: 'todos', quando: 'agora', data: '', email: false };
  let sub = 'push', busca = '', nivelF = 'todos';

  /* membros da Fada (exemplo: as clientes da loja de demonstração) */
  function membros() {
    const rg = Pontos.regras(M), ns = NIVEIS();
    return Loja.estado().clientes.filter(c => c.marca === 'fada' || c.marca === 'ambas').map((c, i) => {
      const ped = c.pedidos.filter(p => p.marca === 'fada'), total = ped.reduce((s, p) => s + p.valor, 0);
      const pts = Math.floor(total * rg.compra) + (c.app ? rg.app : 0) + ((c.pontosExtra || {}).fada || 0);
      const nv = ns.reduce((k, x, j) => pts >= x.de ? j : k, 0);
      const ult = ped[0] ? Math.floor((Date.now() - new Date(ped[0].em)) / 864e5) : null;
      return Object.assign({}, c, { ped, total, pts, nivelI: nv, nivel: ns[nv].n, ult, push: !!c.app && i % 3 !== 0 });
    }).sort((a, b) => b.pts - a.pts);
  }
  function publicos() {
    const ms = membros(), comPush = ms.filter(m => m.push), mes = new Date().getMonth();
    const fila = Loja.produtos(M).filter(p => p.fila && p.status !== 'disponivel').sort((a, b) => b.fila - a.fila).slice(0, 4);
    return [['todos', 'Todos os membros', comPush.length]]
      .concat(NIVEIS().map((x, i) => ['nivel:' + i, x.n, comPush.filter(m => m.nivelI === i).length]))
      .concat([['aniv', 'Aniversariantes do mês', comPush.filter(m => new Date(m.nascimento + 'T12:00').getMonth() === mes).length],
               ['sumidas', 'Sem comprar há 90 dias', comPush.filter(m => m.ult != null && m.ult > 90).length]])
      .concat(fila.map(p => ['fila:' + p.id, 'Na fila de ' + p.nome, p.fila]));
  }
  function alvo(k) { const p = publicos().find(x => x[0] === k); if (p) return p; if (/^pessoa:/.test(k)) { const m = membros().find(x => x.id === k.slice(7)); return [k, m ? m.nome : 'Uma cliente', 1]; } return publicos()[0]; }
  function quandoTx(iso) { const d = new Date(iso); return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '') + ', ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); }
  function presentes() { return Est.ler().cupons; }

  /* ---------- abas ---------- */
  function hoje() {
    const ms = membros(), push = ms.filter(m => m.push).length, abertos = ms.reduce((s, m) => s + m.pts, 0) + Pontos.meu(M).saldo;
    const sep = presentes().filter(c => c.tipo === 'brinde' && !c.entregue).length, l = lanc()[0], lp = l && Loja.produto(M, l.produto);
    const env = Est.ler().avisos.slice().sort((a, b) => a.quando < b.quando ? 1 : -1).slice(0, 3), h = new Date().getHours();
    return `<header class="adm-cab"><p class="rotulo">${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}, Paula</p><h1>O Clube hoje</h1></header>
    <div class="kpis">
     <div class="kpi"><span>Membros</span><b>${n(ms.length + 1)}</b></div>
     <div class="kpi"><span>Com avisos ligados</span><b>${n(push)}</b><small>${Math.round(100 * push / Math.max(1, ms.length))}% dos membros</small></div>
     <div class="kpi"><span>Pontos em aberto</span><b>${n(abertos)}</b></div>
     <a class="kpi" href="#/adm/clube"><span>Brindes para separar</span><b>${sep}</b>${sep ? '<small>Ver quem →</small>' : ''}</a>
    </div>
    <a class="acao" href="#/adm/avisos">${I(ICA.avisos)}Mandar um aviso</a>
    ${l && lp ? `<section class="bl"><h2>Próximo lote</h2><div class="lote-c"><div><b>${esc(lp.nome)}</b><span>${quandoTx(l.quando)} · ${l.lote || '—'} unidades</span><div class="conta" data-fim="${l.quando}">${contaHTML(falta(l.quando))}</div></div>${fotoTag(lp.fotos[0], 240, '')}</div></section>` : ''}
    <section class="bl"><h2>Últimos avisos <a href="#/adm/avisos">Todos</a></h2>${env.length ? `<ul class="hist">${env.map(histItem).join('')}</ul>` : '<p class="miudo">Nenhum aviso ainda. O primeiro costuma ser o do próximo lote.</p>'}</section>`;
  }
  function histItem(a) {
    const fut = new Date(a.quando) > new Date();
    return `<li><div><b>${esc(a.titulo)}</b><span>${esc(a.texto)}</span><small>${fut ? 'Agendado · ' + quandoTx(a.quando) : 'Enviado · ' + quandoTx(a.quando)} · ${esc(a.publico)} · ${n(a.alcance)} ${a.alcance === 1 ? 'pessoa' : 'pessoas'}${a.canais && a.canais.includes('email') ? ' · também por e-mail' : ''}${a.auto ? ' · automático' : ''}</small></div>${fut ? `<button class="mini-b" onclick="Adm.cancela('${a.id}')">Cancelar</button>` : ''}</li>`;
  }

  function avisos() {
    const ps = publicos(), al = alvo(rasc.publico), prods = Loja.produtos(M).filter(p => p.tipo === 'perfume').sort(ordem).slice(0, 12);
    const links = [['#/lancamentos', 'Lançamentos'], ['#/loja', 'A loja'], ['#/receitas', 'Receitas da Fada'], ['#/clube', 'Clube da Fada']].concat(prods.map(p => ['#/p/' + p.id, p.nome]));
    const lp = /^#\/p\//.test(rasc.link) && Loja.produto(M, rasc.link.slice(4)), foto = lp && rasc.foto ? lp.fotos[0] + '-480-0.webp' : '';
    const hist = Est.ler().avisos.slice().sort((a, b) => a.quando < b.quando ? 1 : -1);
    const seg = `<div class="seg adm-seg" role="group" aria-label="Tipo de aviso"><span class="pilula" style="width:calc((100% - 8px)/2);transform:translateX(${sub === 'push' ? 0 : 100}%)"></span><button aria-pressed="${sub === 'push'}" onclick="Adm.sub('push')">Avisos no celular</button><button aria-pressed="${sub === 'emails'}" onclick="Adm.sub('emails')">E-mails automáticos</button></div>`;
    if (sub === 'emails') return `<header class="adm-cab"><h1>Avisos</h1></header>${seg}${emails()}`;
    const modelos = [['Lote abrindo', 'Sereias, abriu!', 'O lote acabou de abrir para membros. Você tem 1 hora antes de todo mundo.', '#/lancamentos'], ['Voltou à tona', 'Voltou à tona', 'Um perfume esgotado acabou de voltar, em poucas unidades.', '#/loja'], ['Receita nova', 'Receita nova no app', 'Tem fórmula nova na Receitas da Fada, só para membros.', '#/receitas'], ['Pontos', 'Seus pontos viraram presente', 'Já dá para trocar por amostra ou frete grátis no Clube da Fada.', '#/clube']];
    return `<header class="adm-cab"><h1>Avisos</h1><p class="miudo">Chega na tela do celular de quem ligou os avisos, mesmo com o app fechado.</p></header>${seg}
    <div class="tela-cel" aria-label="Prévia do aviso"><div class="tc-hora">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div><div class="tc-aviso"><img src="icone-192.png" alt=""><div><b><span>FADA MARINHA</span><span>agora</span></b><strong id="pv-t">${esc(rasc.titulo) || 'Título do aviso'}</strong><p id="pv-x">${esc(rasc.texto) || 'A mensagem aparece aqui, do jeito que chega no celular.'}</p></div>${foto ? `<img class="tc-foto" src="${foto}" alt="">` : ''}</div></div>
    <div class="modelos">${modelos.map(m => `<button onclick="Adm.modelo(${JSON.stringify(m).replace(/"/g, '&quot;')})">${m[0]}</button>`).join('')}</div>
    <div class="form-a">
     <label class="campo">Título <small id="ct-t">${rasc.titulo.length}/50</small><input maxlength="50" value="${esc(rasc.titulo)}" oninput="Adm.r('titulo',this.value)" placeholder="Ex.: Sereia da Lua abriu"></label>
     <label class="campo">Mensagem <small id="ct-x">${rasc.texto.length}/140</small><textarea maxlength="140" rows="3" oninput="Adm.r('texto',this.value)" placeholder="Curta e com o que ela ganha: hora, lote, vantagem.">${esc(rasc.texto)}</textarea></label>
     <label class="campo">Ao tocar, abre<select onchange="Adm.r('link',this.value,true)">${links.map(([v, t]) => `<option value="${v}" ${rasc.link === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
     ${lp ? `<label class="op"><input type="checkbox" ${rasc.foto ? 'checked' : ''} onchange="Adm.r('foto',this.checked,true)">Mostrar a foto do perfume (Android)</label>` : ''}
     <p class="campo" style="margin-bottom:0">Para quem</p><div class="chips chips-a">${ps.concat(/^pessoa:/.test(rasc.publico) ? [alvo(rasc.publico)] : []).map(([k, t, c]) => `<button aria-pressed="${rasc.publico === k}" onclick="Adm.r('publico','${k}',true)">${esc(t)} <i>${n(c)}</i></button>`).join('')}</div>
     <p class="campo" style="margin-bottom:0">Quando</p><div class="chips chips-a"><button aria-pressed="${rasc.quando === 'agora'}" onclick="Adm.r('quando','agora',true)">Agora</button><button aria-pressed="${rasc.quando === 'depois'}" onclick="Adm.r('quando','depois',true)">Agendar</button></div>
     ${rasc.quando === 'depois' ? `<label class="campo">Dia e hora<input type="datetime-local" value="${rasc.data}" onchange="Adm.r('data',this.value)"></label>` : ''}
     <label class="op"><input type="checkbox" ${rasc.email ? 'checked' : ''} onchange="Adm.r('email',this.checked)">Mandar também por e-mail para quem aceitou</label>
     <button class="acao" onclick="Adm.envia()">${rasc.quando === 'agora' ? 'Enviar para ' + n(al[2]) + (al[2] === 1 ? ' pessoa' : ' pessoas') : 'Agendar para ' + n(al[2]) + (al[2] === 1 ? ' pessoa' : ' pessoas')}</button>
     <button class="acao vazada" onclick="Adm.testa()">Testar no meu celular</button>
     <p class="dica">${EST}<span>Até 2 avisos por semana mantêm as clientes com os avisos ligados. Aviso bom tem hora, lote e vantagem de membro.</span></p>
    </div>
    <section class="bl"><h2>Enviados e agendados</h2>${hist.length ? `<ul class="hist">${hist.map(histItem).join('')}</ul>` : '<p class="miudo">Nada enviado ainda.</p>'}</section>`;
  }
  function emails() {
    const liga = Est.ler().emails;
    return `<p class="miudo" style="margin:14px 18px 0">Saem sozinhos, do e-mail da Fada, no momento certo. Toque para ver como chega.</p><ul class="mails">${EMAILS.map(e => {
      const on = liga[e.id] != null ? liga[e.id] : !e.desligado;
      return `<li><button class="mail-v" onclick="Adm.verEmail('${e.id}')"><b>${esc(e.nome)}</b><span>${esc(e.quando)}</span><small>${esc(Email.preenche(e.assunto, dadosEx()))}</small></button><label class="chave"><input type="checkbox" ${on ? 'checked' : ''} onchange="Adm.liga('${e.id}',this.checked)" aria-label="${on ? 'Desligar' : 'Ligar'} ${esc(e.nome)}"><i></i></label></li>`;
    }).join('')}</ul><p class="exemplo">Na versão final saem pelo Brevo com o domínio fadamarinha.com.</p>`;
  }
  function dadosEx() { const c = Rec.conta(M), eu = Pontos.meu(M), l = lanc()[0], lp = l && Loja.produto(M, l.produto); const prox = Pontos.premios(M).map(p => p.pts).sort((a, b) => a - b).find(x => x > (eu.saldo || 480)); return { nome: c ? c.nome.split(' ')[0] : 'Marina', pontos: n(eu.saldo || 480), ganhou: n(629), falta: n(prox ? prox - (eu.saldo || 480) : 20), nivel: 'Pérola', cupom: 'FADA-K7Q2', produto: lp ? lp.nome : 'Sereia da Lua', hora: l ? new Date(l.quando).getHours() + 'h' : '19h' }; }

  function lotes() {
    const ls = lanc(), esg = Loja.produtos(M).filter(p => p.tipo === 'perfume' && p.status !== 'disponivel').sort((a, b) => (b.fila || 0) - (a.fila || 0));
    const sug = new Date(Date.now() + 3 * 864e5); sug.setHours(19, 0, 0, 0); const v = new Date(sug - sug.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    return `<header class="adm-cab"><h1>Lotes</h1><p class="miudo">Marque o dia do lote e o app avisa sozinho: véspera, membros e todo mundo.</p></header>
    ${ls.map(l => { const p = Loja.produto(M, l.produto); if (!p) return ''; const t = new Date(l.quando), ant = new Date(t - 36e5), vesp = new Date(t - 864e5);
      return `<section class="bl lote-b"><div class="lote-c"><div><b>${esc(p.nome)}</b><span>${quandoTx(l.quando)} · ${l.lote || '—'} unidades · ${n(p.fila || 0)} na fila</span><div class="conta" data-fim="${l.quando}">${contaHTML(falta(l.quando))}</div></div>${fotoTag(p.fotos[0], 240, '')}</div>
      <ol class="linha-t"><li><b>${quandoTx(vesp)}</b>E-mail e aviso para quem está na fila: “${esc(p.nome)} volta amanhã”.</li><li><b>${quandoTx(ant)}</b>Abre para membros do Clube da Fada, com aviso no celular.</li><li><b>${quandoTx(t)}</b>Abre para todo mundo.</li></ol>
      <button class="mini-b" onclick="Adm.tiraLote('${l.id}')">Cancelar o lote</button></section>`; }).join('')}
    <section class="bl"><h2>Marcar um lote</h2><form class="form-a" onsubmit="Adm.novoLote(event)">
     <label class="campo">Perfume<select name="p">${esg.map(p => `<option value="${p.id}">${esc(p.nome)}${p.fila ? ' · ' + p.fila + ' na fila' : ''}</option>`).join('')}</select></label>
     <label class="campo">Dia e hora<input type="datetime-local" name="q" required value="${v}"></label>
     <label class="campo">Quantas unidades<input name="u" inputmode="numeric" required value="60"></label>
     <button class="acao">Marcar o lote e os avisos</button></form></section>`;
  }

  function clube() {
    const r = Pontos.regras(M), pr = Pontos.premios(M), ms = membros(), ps = presentes();
    const RG = [['compra', 'Pontos por real gasto'], ['app', 'Baixar o app'], ['avisos', 'Ligar os avisos'], ['voto', 'Votar no próximo lote'], ['senha', 'Entrar na fila de um lote'], ['aniversario', 'Contar o aniversário'], ['aniversarioMes', 'No mês do aniversário'], ['avaliar', 'Avaliar um perfume'], ['amiga', 'Amiga que comprou']];
    const sep = ps.filter(c => c.tipo === 'brinde' && !c.entregue), cup = ps.filter(c => c.tipo === 'cupom');
    return `<header class="adm-cab"><h1>Clube da Fada</h1><p class="miudo">Cada compra vira ponto. Os pontos viram desconto ou brinde. Você decide quanto vale cada coisa.</p></header>
    <div class="kpis kpis-3">${NIVEIS().map((x, i) => `<div class="kpi"><span>${x.n}${x.de ? ' · ' + n(x.de) + '+' : ''}</span><b>${ms.filter(m => m.nivelI === i).length}</b></div>`).join('')}</div>
    ${sep.length ? `<section class="bl"><h2>Brindes para separar</h2><ul class="hist">${sep.map(c => `<li><div><b>${esc(c.t)}</b><span>${esc(c.nome)} · vai junto no próximo pedido</span><small>Trocado em ${quandoTx(c.em)}${c.usado ? ' · pedido já feito' : ''}</small></div><button class="mini-b" onclick="Adm.separado('${c.id}')">Separado</button></li>`).join('')}</ul></section>` : ''}
    <section class="bl"><h2>Quanto vale cada coisa</h2><div class="regras">${RG.map(([k, t]) => `<label class="rg"><span>${t}</span><input inputmode="numeric" value="${r[k]}" onchange="Adm.pts('regras','${k}',this.value)"></label>`).join('')}</div></section>
    <section class="bl"><h2>Prêmios <small>em pontos</small></h2><div class="regras">${pr.map(p => `<label class="rg"><span>${esc(p.t)}<small>${p.tipo === 'cupom' ? 'Cupom na loja' : 'Brinde no pedido'}</small></span><input inputmode="numeric" value="${p.pts}" onchange="Adm.pts('premios','${p.id}',this.value)"></label>`).join('')}</div></section>
    ${cup.length ? `<section class="bl"><h2>Cupons gerados</h2><ul class="hist">${cup.map(c => `<li><div><b>${c.codigo}</b><span>${esc(c.t)} · ${esc(c.nome)}</span><small>${c.usado ? 'Usado' : 'Vale até ' + new Date(c.validade).toLocaleDateString('pt-BR')}</small></div></li>`).join('')}</ul></section>` : ''}
    <p class="exemplo">Na versão final, o cupom é criado na Nuvemshop da Fada e vale só uma vez.</p>`;
  }

  function clientes() {
    const ms = membros().filter(m => (nivelF === 'todos' || String(m.nivelI) === nivelF) && m.nome.toLowerCase().includes(busca.toLowerCase()));
    return `<header class="adm-cab"><h1>Clientes</h1><p class="miudo">Membros do Clube da Fada, de quem tem mais pontos para quem tem menos.</p></header>
    <div class="form-a" style="padding-top:0"><label class="campo"><span class="vh">Buscar pelo nome</span><input id="busca-a" value="${esc(busca)}" oninput="Adm.busca(this.value)" placeholder="Buscar pelo nome"></label></div>
    <div class="chips chips-a" style="padding:10px 18px 0"><button aria-pressed="${nivelF === 'todos'}" onclick="Adm.nivel('todos')">Todas</button>${NIVEIS().map((x, i) => `<button aria-pressed="${nivelF === String(i)}" onclick="Adm.nivel('${i}')">${x.n}</button>`).join('')}</div>
    <ul class="clis" id="clis">${linhas(ms)}</ul><p class="exemplo">Clientes de exemplo.</p>`;
  }
  function linhas(ms) { return ms.map(m => `<li><button onclick="Adm.ficha('${m.id}')"><span class="av">${esc(m.nome[0])}</span><span><b>${esc(m.nome)}</b><small>${m.nivel} · ${n(m.pts)} pontos${m.ult != null ? ' · comprou há ' + m.ult + ' dias' : ''}</small></span>${m.push ? I(ICA.avisos, 'i i-on') : '<span></span>'}</button></li>`).join('') || '<li class="vazio">Ninguém com esse filtro.</li>'; }

  /* ---------- casca do painel ---------- */
  function tela(aba) {
    const k = ABAS.findIndex(x => x[0] === aba), f = { hoje, avisos, lotes, clube, clientes }[aba] || hoje;
    return `<div class="adm">
     <div class="adm-topo fixo"><a class="ib" href="#/" aria-label="Voltar para o app">${I(IC.volta)}</a><span>Painel da Fada</span><span class="av av-p" title="Paula">P</span></div>
     ${f()}
     <p class="exemplo" style="margin-top:22px">Prévia: na versão final, só a Paula entra aqui, com o login dela.</p>
     <nav class="nav adm-nav fixo" aria-label="Painel"><span class="nav-pilula" style="transform:translateX(${Math.max(0, k) * 100}%)"></span>${ABAS.map(([a, t]) => `<a href="#/adm/${a}" ${a === aba ? 'aria-current="page"' : ''}>${I(ICA[a])}${t}</a>`).join('')}</nav>
    </div>`;
  }
  function monta() { /* nada extra por enquanto: os campos atualizam a prévia sozinhos */ }

  /* ---------- ações ---------- */
  function r(k, v, redesenha) {
    rasc[k] = v;
    if (k === 'titulo') { const e = $('#pv-t'); if (e) e.textContent = v || 'Título do aviso'; const c = $('#ct-t'); if (c) c.textContent = v.length + '/50'; }
    if (k === 'texto') { const e = $('#pv-x'); if (e) e.textContent = v || 'A mensagem aparece aqui, do jeito que chega no celular.'; const c = $('#ct-x'); if (c) c.textContent = v.length + '/140'; }
    if (redesenha) { const y = scrollY; desenha(true); scrollTo({ top: y, behavior: 'instant' }); }
  }
  function modelo(m) { rasc.titulo = m[1]; rasc.texto = m[2]; rasc.link = m[3]; const y = scrollY; desenha(true); scrollTo({ top: y, behavior: 'instant' }); }
  function pronto() { if (!rasc.titulo.trim() || !rasc.texto.trim()) { toast('Escreva o título e a mensagem primeiro'); return false; } return true; }
  function fotoDe() { const lp = /^#\/p\//.test(rasc.link) && Loja.produto(M, rasc.link.slice(4)); return lp && rasc.foto ? lp.fotos[0] + '-480-0.webp' : ''; }
  function envia() {
    if (!pronto()) return;
    let quando = new Date();
    if (rasc.quando === 'depois') { if (!rasc.data) { toast('Escolha o dia e a hora'); return; } quando = new Date(rasc.data); if (quando < new Date()) { toast('Escolha uma hora que ainda não passou'); return; } }
    const al = alvo(rasc.publico);
    const a = { id: 'a' + Date.now(), titulo: rasc.titulo.trim(), texto: rasc.texto.trim(), link: rasc.link, imagem: fotoDe(), publico: al[1], alcance: al[2], canais: ['app'].concat(rasc.email ? ['email'] : []), quando: quando.toISOString(), criado: new Date().toISOString() };
    Est.mexe(s => s.avisos.unshift(a));
    if (rasc.quando === 'agora') notifica(a);
    toast(rasc.quando === 'agora' ? `Aviso enviado para ${n(al[2])} ${al[2] === 1 ? 'pessoa' : 'pessoas'}` : 'Aviso agendado');
    rasc = { titulo: '', texto: '', link: '#/lancamentos', foto: true, publico: 'todos', quando: 'agora', data: '', email: false };
    desenha(true); scrollTo({ top: 0, behavior: reduz ? 'instant' : 'smooth' });
  }
  function testa() {
    if (!pronto()) return;
    const a = { id: 'teste', titulo: rasc.titulo.trim(), texto: rasc.texto.trim(), link: rasc.link, imagem: fotoDe() };
    if (Pontos.permissao() === 'granted') { notifica(a); toast('Aviso de teste enviado para este celular'); return; }
    if (Pontos.permissao() === 'sem') { abre('<h2>Teste no celular</h2><p>No iPhone, o aviso de teste aparece com o app instalado na tela de início. Baixe o app, abra por ele e teste de novo.</p><button class="acao" onclick="baixar()">Baixar o app</button>'); return; }
    if (Pontos.permissao() === 'denied') { toast('Os avisos estão bloqueados neste celular'); return; }
    Pontos.ativarAvisos(M); setTimeout(() => { if (Pontos.permissao() === 'granted') notifica(a); }, 1200);
  }
  function cancela(id) { Est.mexe(s => { s.avisos = s.avisos.filter(a => a.id !== id); }); toast('Aviso cancelado'); desenha(true); }
  function verEmail(id) {
    const e = EMAILS.find(x => x.id === id);
    abre(`<h2>${esc(e.nome)}</h2><p class="miudo" style="margin-top:4px">${esc(e.quando)}</p><p class="mail-assunto"><b>Assunto:</b> ${esc(Email.preenche(e.assunto, dadosEx()))}</p><iframe class="mail-prev" title="Prévia do e-mail" sandbox srcdoc="${Email.html(e, dadosEx()).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></iframe>`);
  }
  function liga(id, v) { Est.mexe(s => { s.emails[id] = v; }); toast(v ? 'E-mail ligado' : 'E-mail desligado'); }
  function novoLote(ev) {
    ev.preventDefault();
    const f = ev.target, p = Loja.produto(M, f.p.value), q = new Date(f.q.value), u = parseInt(f.u.value, 10) || 0;
    if (q < new Date()) { toast('Escolha um dia que ainda não passou'); return; }
    semAviso = true; Loja.mexe(s => { s.lancamentos.unshift({ id: 'l' + Date.now(), marca: M, produto: p.id, nome: p.nome + ' · ' + p.medida, quando: q.toISOString(), lote: u }); }); semAviso = false;
    const base = { link: '#/p/' + p.id, imagem: p.fotos[0] + '-480-0.webp', criado: new Date().toISOString(), auto: true };
    Est.mexe(s => {
      s.avisos.unshift(Object.assign({ id: 'a' + Date.now() + 'v', titulo: p.nome + ' volta amanhã', texto: `O lote abre amanhã, às ${q.getHours()}h. Membros entram 1 hora antes.`, publico: 'Na fila de ' + p.nome, alcance: p.fila || 0, canais: ['app', 'email'], quando: new Date(q - 864e5).toISOString() }, base));
      s.avisos.unshift(Object.assign({ id: 'a' + Date.now() + 'm', titulo: 'Sereias, abriu!', texto: `${p.nome} acabou de abrir para membros. Você tem 1 hora antes de todo mundo.`, publico: 'Todos os membros', alcance: membros().filter(m => m.push).length, canais: ['app'], quando: new Date(q - 36e5).toISOString() }, base));
    });
    toast('Lote marcado com 2 avisos automáticos'); desenha(true); scrollTo({ top: 0, behavior: 'instant' });
  }
  function tiraLote(id) { semAviso = true; Loja.mexe(s => { s.lancamentos = s.lancamentos.filter(l => l.id !== id); }); semAviso = false; toast('Lote cancelado'); desenha(true); }
  function pts(tipo, k, v) { const x = Math.max(0, parseInt(String(v).replace(/\D/g, ''), 10) || 0); semAviso = true; Loja.mexe(s => { s.pontos = s.pontos || {}; s.pontos[M] = s.pontos[M] || {}; (s.pontos[M][tipo] = s.pontos[M][tipo] || {})[k] = x; }); semAviso = false; toast('Pronto: o app já mostra o valor novo'); }
  function separado(id) { Est.mexe(s => { const c = s.cupons.find(x => x.id === id); if (c) c.entregue = true; }); toast('Marcado como separado'); desenha(true); }
  function ficha(id) {
    const m = membros().find(x => x.id === id); if (!m) return;
    abre(`<div class="ficha-c"><span class="av av-g">${esc(m.nome[0])}</span><div><h2>${esc(m.nome)}</h2><p class="rotulo" style="margin-top:6px">${m.nivel} · ${n(m.pts)} pontos</p></div></div>
     <div class="dados"><div><span>Comprou na Fada</span><b>${R(m.total)}</b></div><div><span>Pedidos</span><b>${m.ped.length}</b></div><div><span>Última compra</span><b>${m.ult != null ? m.ult + ' dias' : '—'}</b></div><div><span>Avisos no celular</span><b>${m.push ? 'Ligados' : 'Desligados'}</b></div><div><span>WhatsApp</span><b>${esc(m.wa)}</b></div><div><span>Aniversário</span><b>${new Date(m.nascimento + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</b></div></div>
     <form class="dar" onsubmit="Adm.darPontos(event,'${m.id}')"><label class="campo">Dar pontos<input name="n" inputmode="numeric" required placeholder="50"></label><label class="campo">Por quê<input name="m" placeholder="Ex.: presente de Natal"></label><button class="acao">Dar</button></form>
     <button class="acao vazada" onclick="Adm.paraEla('${m.id}')">Mandar um aviso só para ela</button>
     <button class="acao vazada" onclick="conversa('Oi, ${esc(m.nome.split(' ')[0])}! Aqui é a Paula, da Fada Marinha.')">Chamar no WhatsApp</button>`);
  }
  function darPontos(ev, id) {
    ev.preventDefault(); const f = ev.target, x = parseInt(f.n.value.replace(/\D/g, ''), 10) || 0; if (!x) return; let nome = '';
    semAviso = true; Loja.mexe(s => { const c = s.clientes.find(c => c.id === id); nome = c.nome; c.pontosExtra = c.pontosExtra || {}; c.pontosExtra.fada = (c.pontosExtra.fada || 0) + x; (c.pontosLog = c.pontosLog || []).unshift({ marca: 'fada', n: x, m: f.m.value.trim(), em: new Date().toISOString() }); }); semAviso = false;
    toast(`+${x} pontos para ${nome.split(' ')[0]}. Ela recebe o aviso no app.`); ficha(id); desenha(true);
  }
  function paraEla(id) { dlg.close(); rasc.publico = 'pessoa:' + id; sub = 'push'; location.hash = '#/adm/avisos'; }

  window.Adm = {
    tela, monta, r, modelo, envia, testa, cancela, verEmail, liga, novoLote, tiraLote, pts, separado, ficha, darPontos, paraEla,
    sub(v) { sub = v; desenha(true); },
    busca(v) { busca = v; const l = $('#clis'); if (l) l.innerHTML = linhas(membros().filter(m => (nivelF === 'todos' || String(m.nivelI) === nivelF) && m.nome.toLowerCase().includes(busca.toLowerCase()))); },
    nivel(v) { nivelF = v; desenha(true); }
  };
})();

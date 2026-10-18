/* =====================================================
   PEDIDOS DA VITRINE — Sandra Santos · Sikania Tour (17/10/2026)

   Três portas, e as três caem em ORÇAMENTOS no painel (orcamentos.js):
   - TRANSFER: aeroporto, estação, porto, hotel ou de uma cidade a outra.
   - VIAGEM SOB MEDIDA: o produto principal dela. O cliente conta quando
     vem, quem vem, por onde quer ir e do que gosta; ela devolve a proposta.
   - PASSEIO COM VALOR A COMBINAR: o cliente escolhe a data e quantos são,
     e pede o valor (todos os passeios dela nascem assim até ela dar preço).

   O app não inventa preço: ele faz a parte chata (perguntar data, voo,
   malas, quem vem, do que gosta) e entrega tudo organizado.

   Como chega nela:
   - com a nuvem ligada: tabela `pedidos` → o banco avisa (push + e-mail)
     e o pedido aparece em Orçamentos;
   - sempre: a mesma ficha pronta para o WhatsApp dela (sem nuvem, é o
     caminho; com nuvem, é um atalho para quem quer falar na hora).
   ===================================================== */
'use strict';

/* ---------- opções de lá ---------- */
const TRF_TIPOS = [
  ['chegada', 'Chegada', 'aeroporto, estação ou porto → hotel'],
  ['saida', 'Saída', 'hotel → aeroporto, estação ou porto'],
  ['cidades', 'Entre cidades', 'de uma cidade a outra'],
  ['outro', 'Outro trajeto', 'restaurante, evento, passeio…'],
];
const TRF_AEROPORTO = 'Aeroporto de Nápoles (NAP)';
const TRF_HOTEL = 'Hotel';
/* atalhos de um toque; o campo continua livre */
const TRF_ATALHOS = [TRF_AEROPORTO, 'Napoli Centrale (trem)', 'Porto de Nápoles', 'Aeroporto de Roma (FCO)', 'Aeroporto de Catânia (CTA)', 'Aeroporto de Faro (FAO)', 'Aeroporto de Lisboa (LIS)', TRF_HOTEL];
/* os lugares dos passeios dela */
function trfCidades() {
  return ['Nápoles', 'Amalfi', 'Ravello', 'Maiori', 'Marina di Camerota', 'Castellabate', 'Benevento', 'Telese', 'Catânia', 'Randazzo', 'Tavira', 'Olhão', 'Faro', 'Lisboa'];
}

/* VIAGEM SOB MEDIDA: por onde e do que gosta */
const SM_DESTINOS = [['italia-sul', 'Sul da Itália (Nápoles, Amalfi, Cilento)'], ['sicilia', 'Sicília'], ['algarve', 'Algarve'], ['portugal', 'Outros lugares de Portugal'], ['italia', 'Outros lugares da Itália']];
const RT_TEMAS = [
  ['comida', 'Comida e quem cozinha'], ['historia', 'História e curiosidades'], ['mar', 'Mar, praias e barco'],
  ['vinho', 'Vinhos'], ['vilarejos', 'Vilarejos e campo'], ['arte', 'Arte e igrejas'], ['criancas', 'Viagem com crianças'], ['fora', 'Fora do roteiro de sempre'],
];
const RT_RITMO = [['calmo', 'Tranquilo'], ['medio', 'Equilibrado'], ['intenso', 'Ver tudo que der']];
const RT_PRECISA = [['transfer', 'Transfer'], ['carro', 'Motorista nos passeios'], ['hotel', 'Dica de hospedagem'], ['restaurante', 'Restaurantes'], ['ingressos', 'Ingressos']];
const rtNome = (lista, v) => (lista.find(o => o[0] === v) || [v, v])[1];

/* ---------- a ficha (o texto que chega nela) ---------- */
const pdData = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
const pdPlural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
function pdGrupo(p) {
  return pdPlural(p.adultos, 'adulto', 'adultos') + (p.criancas ? ', ' + pdPlural(p.criancas, 'criança', 'crianças') + (p.idades ? ' (' + p.idades + ')' : '') : '');
}
function pdAssinatura(p) { return '— ' + p.nome + (p.whats ? ' · ' + p.whats : '') + (p.email ? ' · ' + p.email : ''); }

function fichaTransfer(p) {
  const L = ['Olá, ' + guiaNome() + '! Quero um transfer:', ''];
  L.push('🚘 ' + rtNome(TRF_TIPOS, p.tipoTrf) + ': ' + (p.de || '?') + ' → ' + (p.para || '?'));
  L.push('🗓 ' + [pdData(p.data), p.hora].filter(Boolean).join(' às ') + (p.voo ? ' · voo/trem ' + p.voo : ''));
  if (p.volta) L.push('↩️ Volta: ' + [pdData(p.voltaData), p.voltaHora].filter(Boolean).join(' às ') + (p.voltaVoo ? ' · voo/trem ' + p.voltaVoo : ''));
  L.push('👥 ' + pdGrupo(p));
  L.push('🧳 ' + pdPlural(p.malas, 'mala grande', 'malas grandes') + ', ' + pdPlural(p.malasMao, 'de mão', 'de mão'));
  if (p.obs) L.push('', p.obs);
  L.push('', pdAssinatura(p));
  return L.join('\n');
}
function fichaSobMedida(p) {
  const L = ['Olá, ' + guiaNome() + '! Quero uma viagem sob medida:', ''];
  if (p.ini || p.fim) L.push('🗓 ' + [pdData(p.ini), pdData(p.fim)].filter(Boolean).join(' → ') + (p.flex ? ' (datas flexíveis)' : ''));
  L.push('👥 ' + pdGrupo(p));
  if (p.destinos.length) L.push('📍 Por onde: ' + p.destinos.map(v => rtNome(SM_DESTINOS, v)).join(', '));
  if (p.passeios.length) L.push('⭐ Passeios que viu no app: ' + p.passeios.join(', '));
  if (p.temas.length) L.push('❤️ Interesses: ' + p.temas.map(v => rtNome(RT_TEMAS, v)).join(', '));
  if (p.ritmo) L.push('⏱ Ritmo: ' + rtNome(RT_RITMO, p.ritmo).toLowerCase());
  if (p.precisa.length) L.push('🧳 Precisa também: ' + p.precisa.map(v => rtNome(RT_PRECISA, v).toLowerCase()).join(', '));
  if (p.obs) L.push('', p.obs);
  L.push('', pdAssinatura(p));
  return L.join('\n');
}
function fichaPasseio(p) {
  const L = ['Olá, ' + guiaNome() + '! Quero o valor do passeio:', ''];
  L.push('📍 ' + (p.tourNome || p.tourId || '?'));
  L.push('🗓 ' + (pdData(p.data) || 'data a combinar') + (p.flex ? ' (data flexível)' : ''));
  L.push('👥 ' + pdGrupo(p));
  if (p.obs) L.push('', p.obs);
  L.push('', pdAssinatura(p));
  return L.join('\n');
}
const fichaRoteiro = fichaSobMedida;   /* nome antigo */
/* uma linha: o push no celular dela e a lista do painel */
function resumoPedido(p) {
  const gente = pdPlural(p.adultos + p.criancas, 'pessoa', 'pessoas');
  if (p.tipo === 'transfer') return [p.nome, [pdData(p.data), p.hora].filter(Boolean).join(' '), (p.de || '?') + ' → ' + (p.para || '?'), gente].filter(Boolean).join(' · ');
  if (p.tipo === 'passeio') return [p.nome, p.tourNome, pdData(p.data), gente].filter(Boolean).join(' · ');
  return [p.nome, [pdData(p.ini), pdData(p.fim)].filter(Boolean).join(' → '), gente].filter(Boolean).join(' · ');
}
/* rótulo do tipo de pedido (painel e assistente) */
const PEDIDO_TIPOS = { transfer: ['🚘', 'Transfer'], sobmedida: ['🧭', 'Viagem sob medida'], passeio: ['📍', 'Passeio'], roteiro: ['🧭', 'Viagem sob medida'] };
const pedidoRotulo = (p) => (PEDIDO_TIPOS[p.tipo] || ['✉️', 'Pedido'])[1];
const pedidoIcone = (p) => (PEDIDO_TIPOS[p.tipo] || ['✉️'])[0];

/* ---------- guardar ---------- */
const Pedidos = {
  all() { return [...(DB.pedidos || [])].sort((a, b) => (b.criado || '').localeCompare(a.criado || '')); },
  novos() { return (DB.pedidos || []).filter(p => !p.respondido).length; },
  cria(tipo, r) {
    const s = (v) => String(v || '').trim().slice(0, 600);
    const n = (v, min) => Math.max(min, Math.min(60, Math.round(+v) || 0));
    const p = { id: uid() + uid(), tipo, criado: new Date().toISOString(), respondido: false,
      nome: s(r.nome), whats: s(r.whats), email: s(r.email), obs: String(r.obs || '').trim().slice(0, 1500),
      adultos: n(r.adultos, 1), criancas: n(r.criancas, 0), idades: r.criancas ? s(r.idades) : '' };
    if (tipo === 'transfer') Object.assign(p, {
      tipoTrf: r.tipoTrf, de: s(r.de), para: s(r.para), data: s(r.data), hora: s(r.hora), voo: s(r.voo),
      volta: !!r.volta, voltaData: r.volta ? s(r.voltaData) : '', voltaHora: r.volta ? s(r.voltaHora) : '', voltaVoo: r.volta ? s(r.voltaVoo) : '',
      malas: n(r.malas, 0), malasMao: n(r.malasMao, 0) });
    else if (tipo === 'passeio') Object.assign(p, { tourId: s(r.tourId), tourNome: s(r.tourNome), data: s(r.data), flex: !!r.flex });
    else Object.assign(p, {
      ini: s(r.ini), fim: s(r.fim), flex: !!r.flex, destinos: [...(r.destinos || [])].map(s), passeios: [...(r.passeios || [])].map(s),
      temas: [...(r.temas || [])].map(s), ritmo: s(r.ritmo), precisa: [...(r.precisa || [])].map(s) });
    p.ficha = tipo === 'transfer' ? fichaTransfer(p) : tipo === 'passeio' ? fichaPasseio(p) : fichaSobMedida(p);
    p.resumo = resumoPedido(p);
    DB.pedidos = DB.pedidos || [];
    DB.pedidos.push(p);
    /* só neste aparelho: pedido NUNCA vai no appstate (que é público) */
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
    return p;
  },
  marca(id, respondido) {
    const p = (DB.pedidos || []).find(x => x.id === id);
    if (!p) return;
    p.respondido = !!respondido;
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
    if (typeof cloudUpdatePedido === 'function') cloudUpdatePedido(p);
  },
  /* liga o pedido ao orçamento que nasceu dele (orcamentos.js) */
  ligaOrcamento(id, orcId) {
    const p = (DB.pedidos || []).find(x => x.id === id);
    if (!p) return;
    p.orcamentoId = orcId; p.respondido = true;
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
    if (typeof cloudUpdatePedido === 'function') cloudUpdatePedido(p);
  },
};

/* ---------- telas do cliente ---------- */
function pdTopo(titulo) {
  return `<header class="topbar">
    <button class="backbtn" id="bk" aria-label="${t('back')}">←</button>
    <span class="tbrand">${logoMark(24, 'var(--brand-assinatura)')}<b>${esc(guiaNome())}</b></span>
  </header>`;
}
const pdContador = (k, v, rot, sub) => `<div class="paxrow"><span><b>${rot}</b>${sub ? `<small>${sub}</small>` : ''}</span>
  <div class="pm"><button type="button" data-rc="${k}" data-d="-1" aria-label="menos ${rot}">−</button><span>${v}</span><button type="button" data-rc="${k}" data-d="1" aria-label="mais ${rot}">+</button></div></div>`;
const pdVoce = (R) => `<section class="rtbloco"><h3>Seus dados</h3>
  <label class="fld">Nome completo<input id="pdNome" autocomplete="name" value="${esc(R.nome || '')}"></label>
  <label class="fld">WhatsApp (com DDI)<input id="pdWhats" type="tel" autocomplete="tel" placeholder="+55 11 …" value="${esc(R.whats || '')}"></label>
  <label class="fld">E-mail<input id="pdEmail" type="email" autocomplete="email" value="${esc(R.email || '')}"></label>
</section>`;
function pdLeVoce(R) { R.nome = $('#pdNome').value; R.whats = $('#pdWhats').value; R.email = $('#pdEmail').value; }

/* a tela de "enviado": com nuvem, ela já recebeu; sem nuvem, o WhatsApp é o envio */
function pdEnviado(p, chegou) {
  const wa = waLink(p.ficha);
  app.innerHTML = `${pdTopo()}
  <main class="wrap roteiro fim">
    <div class="okc">✓</div>
    <h2 class="okh">${chegou ? 'Pedido enviado' : 'Quase lá'}</h2>
    <p class="hint center">${chegou
      ? `${esc(guiaNome())} já recebeu e responde com ${p.tipo === 'sobmedida' ? 'a proposta da sua viagem' : 'o valor'} pelo WhatsApp ou e-mail.`
      : `O WhatsApp de ${esc(guiaNome())} abriu com o pedido pronto — é só apertar enviar. Não abriu? Toque abaixo.`}</p>
    <a class="cta" id="pdWa" target="_blank" rel="noopener" href="${esc(wa)}">${ICONE_WA_BTN} ${chegou ? 'Falar no WhatsApp agora' : 'Mandar no WhatsApp'}</a>
    <button class="cta soft" id="pdPasseios">${t('seeTours')}</button>
  </main>`;
  $('#bk').onclick = () => go('/');
  $('#pdPasseios').onclick = () => go('/tours');
}
async function pdEnvia(tipo, R) {
  const p = Pedidos.cria(tipo, R);
  const nuvem = typeof temNuvem === 'function' && temNuvem() && typeof cloudPushPedido === 'function';
  /* sem nuvem o WhatsApp é o único caminho: abre JÁ, no mesmo toque
     (depois de um await o iPhone bloqueia a janela nova) */
  if (!nuvem) { window.open(waLink(p.ficha), '_blank'); return pdEnviado(p, false); }
  const b = $('#pdEnviar'); if (b) { b.disabled = true; b.textContent = 'Enviando…'; }
  const r = await cloudPushPedido(p);
  pdEnviado(p, !!(r && r.ok));
}

/* TRANSFER */
function viewTransfer() {
  const R = viewTransfer._s = viewTransfer._s || { tipoTrf: 'chegada', de: TRF_AEROPORTO, para: '', adultos: 2, criancas: 0, malas: 2, malasMao: 2, volta: false };
  const chega = R.tipoTrf === 'chegada', sai = R.tipoTrf === 'saida', cid = R.tipoTrf === 'cidades';
  const lugares = cid ? trfCidades() : TRF_ATALHOS;
  const atalhos = (campo) => `<div class="chips pdAtalhos">${lugares.map(l =>
    `<button type="button" class="chip ${R[campo] === l ? 'on' : ''}" data-at="${campo}" data-v="${esc(l)}">${esc(l.replace(/ \(.*\)$/, ''))}</button>`).join('')}</div>`;
  const hoje = isoToday();
  app.innerHTML = `${pdTopo()}
  <main class="wrap roteiro">
    <h1 class="pageh">Transfer</h1>
    <p class="rtintro">Do aeroporto, da estação, do porto, do hotel ou de uma cidade a outra, na Itália ou em Portugal. Preencha e ${esc(guiaNome())} responde com o valor.</p>

    <section class="rtbloco"><h3>Qual trajeto?</h3>
      <div class="pdTipos" role="radiogroup" aria-label="Tipo de transfer">${TRF_TIPOS.map(([v, n, sub]) =>
        `<button type="button" role="radio" aria-checked="${R.tipoTrf === v}" class="pdTipo ${R.tipoTrf === v ? 'on' : ''}" data-tipo="${v}"><b>${n}</b><small>${sub}</small></button>`).join('')}</div>
      <label class="fld">De onde<input id="trDe" list="trLugares" value="${esc(R.de || '')}" placeholder="${sai ? 'nome e endereço do hotel' : cid ? 'cidade' : 'aeroporto, estação ou endereço'}"></label>
      ${atalhos('de')}
      <label class="fld">Para onde<input id="trPara" list="trLugares" value="${esc(R.para || '')}" placeholder="${chega ? 'nome e endereço do hotel' : cid ? 'cidade' : 'aeroporto, estação ou endereço'}"></label>
      ${atalhos('para')}
      <datalist id="trLugares">${TRF_ATALHOS.concat(trfCidades()).map(l => `<option value="${esc(l)}">`).join('')}</datalist>
    </section>

    <section class="rtbloco"><h3>Quando</h3>
      <div class="frow">
        <label class="fld">Data<input type="date" id="trData" min="${hoje}" value="${esc(R.data || '')}"></label>
        <label class="fld">${chega ? 'Hora que chega' : sai ? 'Hora do voo/trem' : 'Hora de sair'}<input type="time" id="trHora" value="${esc(R.hora || '')}"></label>
      </div>
      ${chega || sai ? `<label class="fld">Nº do voo ou trem <small class="why">opcional — ajuda a acompanhar atraso</small><input id="trVoo" value="${esc(R.voo || '')}" placeholder="ex.: TP 1234"></label>` : ''}
      ${sai ? `<small class="why pdDica">${esc(guiaNome())} calcula a hora de buscar no hotel.</small>` : ''}
      <label class="pdCheck"><input type="checkbox" id="trVolta" ${R.volta ? 'checked' : ''}> Quero a volta também</label>
      ${R.volta ? `<div class="frow">
        <label class="fld">Data da volta<input type="date" id="trVData" min="${esc(R.data || hoje)}" value="${esc(R.voltaData || '')}"></label>
        <label class="fld">Hora<input type="time" id="trVHora" value="${esc(R.voltaHora || '')}"></label>
      </div>
      ${chega || sai ? `<label class="fld">Voo ou trem da volta <small class="why">opcional</small><input id="trVVoo" value="${esc(R.voltaVoo || '')}"></label>` : ''}` : ''}
    </section>

    <section class="rtbloco"><h3>Quem vai e quanta bagagem</h3>
      ${pdContador('adultos', R.adultos, 'Adultos', '')}
      ${pdContador('criancas', R.criancas, 'Crianças', 'até 12 anos')}
      ${R.criancas ? `<label class="fld">Idade de cada criança <small class="why">para a cadeirinha do carro</small><input id="pdIdades" value="${esc(R.idades || '')}" placeholder="ex.: 3 e 7 anos"></label>` : ''}
      ${pdContador('malas', R.malas, 'Malas grandes', 'de despachar')}
      ${pdContador('malasMao', R.malasMao, 'Malas de mão', 'e mochilas')}
    </section>

    <section class="rtbloco"><h3>Algo mais?</h3>
      <label class="fld"><textarea id="pdObs" rows="3" placeholder="Carrinho de bebê, cadeira de rodas, parada no caminho…">${esc(R.obs || '')}</textarea></label>
    </section>

    ${pdVoce(R)}
    <button class="cta" id="pdEnviar">Enviar pedido para ${esc(guiaNome())}</button>
    <p class="fine">Sem compromisso: você recebe o valor e decide.</p>
  </main>`;
  const guarda = () => {
    R.de = $('#trDe').value; R.para = $('#trPara').value; R.data = $('#trData').value; R.hora = $('#trHora').value;
    R.voo = $('#trVoo') ? $('#trVoo').value : ''; R.volta = $('#trVolta').checked;
    if ($('#trVData')) { R.voltaData = $('#trVData').value; R.voltaHora = $('#trVHora').value; R.voltaVoo = $('#trVVoo') ? $('#trVVoo').value : ''; }
    R.idades = $('#pdIdades') ? $('#pdIdades').value : (R.idades || ''); R.obs = $('#pdObs').value; pdLeVoce(R);
  };
  $('#bk').onclick = () => go('/');
  $$('[data-tipo]').forEach(b => b.onclick = () => {
    guarda();
    const v = b.dataset.tipo; if (v === R.tipoTrf) return;
    /* a origem/destino óbvios de cada tipo — sem apagar o que a pessoa já digitou de próprio */
    const auto = (x) => !x || TRF_ATALHOS.includes(x) || trfCidades().includes(x);
    R.tipoTrf = v;
    if (auto(R.de)) R.de = v === 'chegada' ? TRF_AEROPORTO : v === 'saida' ? '' : v === 'cidades' ? 'Nápoles' : '';
    if (auto(R.para)) R.para = v === 'saida' ? TRF_AEROPORTO : '';
    viewTransfer();
  });
  $$('[data-at]').forEach(b => b.onclick = () => { guarda(); R[b.dataset.at] = b.dataset.v; viewTransfer(); });
  $('#trVolta').onchange = () => { guarda(); viewTransfer(); };
  $$('[data-rc]').forEach(b => b.onclick = () => {
    guarda(); const k = b.dataset.rc;
    R[k] = Math.max(k === 'adultos' ? 1 : 0, Math.min(60, R[k] + +b.dataset.d)); viewTransfer();
  });
  $('#pdEnviar').onclick = () => {
    guarda();
    if (!R.de.trim() || !R.para.trim()) return toast('Diga de onde e para onde');
    if (!R.data) return toast('Escolha a data');
    if (!R.nome.trim() || !R.whats.trim()) return toast('Falta seu nome e WhatsApp');
    viewTransfer._s = null;
    pdEnvia('transfer', R);
  };
}

/* VIAGEM SOB MEDIDA — o produto principal dela ("15 dias e 12 cidades, não") */
function viewSobMedida() {
  const R = viewSobMedida._s = viewSobMedida._s || { adultos: 2, criancas: 0, destinos: [], passeios: [], temas: [], precisa: [], ritmo: 'calmo', flex: false };
  const chips = (grupo, lista) => lista.map(([v, n]) =>
    `<button type="button" class="chip ${R[grupo].includes(v) ? 'on' : ''}" data-g="${grupo}" data-v="${esc(v)}" aria-pressed="${R[grupo].includes(v)}">${esc(n)}</button>`).join('');
  const passeios = Tours.live().filter(x => x.pedido !== 'sobmedida' && !x.oculto);
  const hoje = isoToday();
  app.innerHTML = `${pdTopo()}
  <main class="wrap roteiro">
    <h1 class="pageh">Sua viagem sob medida</h1>
    <p class="rtintro">Viagem personalizada pela Itália ou por Portugal, com curadoria e acompanhamento. Conte quem vem, quando e do que gosta: ${esc(guiaNome())} monta o roteiro e manda a proposta.</p>

    <section class="rtbloco"><h3>Quando você vem?</h3>
      <div class="frow">
        <label class="fld">Chego em<input type="date" id="rtIni" min="${hoje}" value="${esc(R.ini || '')}"></label>
        <label class="fld">Vou embora em<input type="date" id="rtFim" min="${esc(R.ini || hoje)}" value="${esc(R.fim || '')}"></label>
      </div>
      <label class="pdCheck"><input type="checkbox" id="rtFlex" ${R.flex ? 'checked' : ''}> As datas são flexíveis</label>
    </section>

    <section class="rtbloco"><h3>Quem vem</h3>
      ${pdContador('adultos', R.adultos, 'Adultos', '')}
      ${pdContador('criancas', R.criancas, 'Crianças', 'até 12 anos')}
      ${R.criancas ? `<label class="fld">Idades<input id="pdIdades" value="${esc(R.idades || '')}" placeholder="ex.: 5 e 9 anos"></label>` : ''}
    </section>

    <section class="rtbloco"><h3>Por onde quer ir</h3><small class="why">Toque em quantos quiser</small>
      <div class="chips">${chips('destinos', SM_DESTINOS)}</div>
    </section>

    ${passeios.length ? `<section class="rtbloco"><h3>Passeios que quer incluir</h3><small class="why">Opcional · toque em quantos quiser</small>
      <div class="pdPasseios">${passeios.map(x => { const n = tl(x.name), on = R.passeios.includes(n);
        return `<button type="button" class="pdPasseio ${on ? 'on' : ''}" data-g="passeios" data-v="${esc(n)}" aria-pressed="${on}">
          <img src="${esc(x.photo || '')}" alt="" loading="lazy"><span><b>${esc(n)}</b><small>${esc(regiaoLabel(x.region))}</small></span><i aria-hidden="true">${on ? '✓' : '+'}</i></button>`; }).join('')}</div>
    </section>` : ''}

    <section class="rtbloco"><h3>O que te interessa</h3><small class="why">Toque em quantos quiser</small>
      <div class="chips">${chips('temas', RT_TEMAS)}</div>
      <h3 class="pdSub">Ritmo</h3>
      <div class="chips">${RT_RITMO.map(([v, n]) => `<button type="button" class="chip ${R.ritmo === v ? 'on' : ''}" data-ritmo="${v}" aria-pressed="${R.ritmo === v}">${esc(n)}</button>`).join('')}</div>
    </section>

    <section class="rtbloco"><h3>Precisa também de</h3>
      <div class="chips">${chips('precisa', RT_PRECISA)}</div>
    </section>

    <section class="rtbloco"><h3>Conte mais</h3>
      <label class="fld"><textarea id="pdObs" rows="4" placeholder="Primeira vez na Itália? Algum lugar que não pode faltar? Mobilidade reduzida? Ocasião especial?">${esc(R.obs || '')}</textarea></label>
    </section>

    ${pdVoce(R)}
    <button class="cta" id="pdEnviar">Pedir a proposta para ${esc(guiaNome())}</button>
    <p class="fine">Sem compromisso: você recebe a proposta e decide.</p>
  </main>`;
  const guarda = () => {
    R.ini = $('#rtIni').value; R.fim = $('#rtFim').value; R.flex = $('#rtFlex').checked;
    R.idades = $('#pdIdades') ? $('#pdIdades').value : (R.idades || ''); R.obs = $('#pdObs').value; pdLeVoce(R);
  };
  $('#bk').onclick = () => go('/');
  $$('[data-g]').forEach(b => b.onclick = () => {
    guarda();
    const g = R[b.dataset.g], v = b.dataset.v, i = g.indexOf(v);
    if (i >= 0) g.splice(i, 1); else g.push(v);
    viewSobMedida();
  });
  $$('[data-ritmo]').forEach(b => b.onclick = () => { guarda(); R.ritmo = b.dataset.ritmo; viewSobMedida(); });
  $$('[data-rc]').forEach(b => b.onclick = () => {
    guarda(); const k = b.dataset.rc;
    R[k] = Math.max(k === 'adultos' ? 1 : 0, Math.min(60, R[k] + +b.dataset.d)); viewSobMedida();
  });
  $('#rtIni').onchange = () => { guarda(); viewSobMedida(); };
  $('#pdEnviar').onclick = () => {
    guarda();
    if (!R.nome.trim() || !R.whats.trim()) return toast('Falta seu nome e WhatsApp');
    viewSobMedida._s = null;
    pdEnvia('sobmedida', R);
  };
}

/* PASSEIO COM VALOR A COMBINAR — o quadro de reserva vira "pedir o valor".
   Desenhado dentro do #book da página do passeio (app.js chama). */
function pedirValorHtml(x) {
  const R = pedirValorHtml._s && pedirValorHtml._s.tourId === x.id ? pedirValorHtml._s : (pedirValorHtml._s = { tourId: x.id, adultos: 2, criancas: 0, flex: false });
  return `<div class="bhead"><span class="bprice">${t('onRequest')}</span></div>
    <p class="why">Conte a data e quantos são: ${esc(guiaNome())} responde com o valor.</p>
    <label class="fld">Data que você quer<input type="date" id="pvData" min="${isoToday()}" value="${esc(R.data || '')}"></label>
    <label class="pdCheck"><input type="checkbox" id="pvFlex" ${R.flex ? 'checked' : ''}> A data é flexível</label>
    ${pdContador('adultos', R.adultos, 'Adultos', '')}
    ${pdContador('criancas', R.criancas, 'Crianças', 'até 12 anos')}
    <label class="fld">Nome<input id="pdNome" autocomplete="name" value="${esc(R.nome || '')}"></label>
    <label class="fld">WhatsApp (com DDI)<input id="pdWhats" type="tel" autocomplete="tel" placeholder="+55 11 …" value="${esc(R.whats || '')}"></label>
    <label class="fld">E-mail <small class="why">opcional</small><input id="pdEmail" type="email" autocomplete="email" value="${esc(R.email || '')}"></label>
    <label class="fld">Algo mais? <small class="why">opcional</small><textarea id="pdObs" rows="2">${esc(R.obs || '')}</textarea></label>
    <button class="cta wide" id="pdEnviar">${t('askQuoteBtn')}</button>
    <p class="fine">Sem compromisso: você recebe o valor e decide.</p>`;
}
function ligaPedirValor(x, redesenha) {
  const R = pedirValorHtml._s;
  const guarda = () => { R.data = $('#pvData').value; R.flex = $('#pvFlex').checked; R.obs = $('#pdObs').value; pdLeVoce(R); };
  $$('#book [data-rc]').forEach(b => b.onclick = () => {
    guarda(); const k = b.dataset.rc;
    R[k] = Math.max(k === 'adultos' ? 1 : 0, Math.min(60, R[k] + +b.dataset.d)); redesenha();
  });
  $('#pdEnviar').onclick = () => {
    guarda();
    if (!R.nome.trim() || !R.whats.trim()) return toast('Falta seu nome e WhatsApp');
    pedirValorHtml._s = null;
    pdEnvia('passeio', { ...R, tourNome: tl(x.name) });
  };
}

/* ---------- painel: Reservas → os pedidos agora moram em Orçamentos ---------- */
function pedidosHtml() {
  const novos = Pedidos.novos();
  return `<a class="card pedidos pdAtalho" href="#/adm/orcamentos"><b>Pedidos de transfer, viagem sob medida e valor de passeio</b>
    <small>${novos ? `<span class="pill warn">${novos} ${novos === 1 ? 'novo' : 'novos'}</span> ` : ''}Ficam em Orçamentos →</small></a>`;
}
function ligaPedidos() {}

if (typeof module !== 'undefined') module.exports = { fichaTransfer, fichaSobMedida, fichaPasseio, resumoPedido, TRF_TIPOS, RT_TEMAS };

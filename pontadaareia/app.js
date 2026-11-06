/* =====================================================
   PONTA DA AREIA · PAINEL DO ROBÔ (03/11/2026).

   O robô atende 24 h no WhatsApp com os imóveis do site deles. Este painel é
   onde a equipe vê cada conversa, os leads que o robô anotou (quem quer visitar,
   reservar, fazer proposta ou anunciar) e responde pelo mesmo número.

   Um arquivo, sem framework, rotas por #/, um clique tratado por data-act,
   só com o que vale para quem já tem o próprio sistema de imóveis:
     #/whats      as conversas (whats.js)
     #/leads      os pedidos que o robô anotou, com o status
     #/imoveis    os imóveis da API do site deles (dados/imoveis.json)

   Sem banco (config.js do fonte) abre a demonstração com conversas de exemplo.
   Com banco, só a conta dona da sala entra (a RLS confere de novo no banco).
   ===================================================== */
'use strict';

const MARCA = (typeof APP_CONFIG !== 'undefined' && (APP_CONFIG.curto || APP_CONFIG.nome)) || 'Imobiliária';
const SITE = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.site) || '';
const ICO = {
  whats: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-4.6A8 8 0 1 1 21 12zM9 10h6M9 14h4',
  leads: 'M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01',
  imoveis: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  site: 'M4 12h16M12 4a16 16 0 0 1 0 16M12 4a16 16 0 0 0 0 16M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
  equipe: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M15.5 4.1a3.5 3.5 0 0 1 0 6.8',
};
const MENU = [['whats', 'WhatsApp'], ['leads', 'Leads'], ['imoveis', 'Imóveis'], ['equipe', 'Equipe']];
const LEAD_ABERTO = s => !['atendido', 'perdido'].includes(s);

/* ---------- estado ---------- */
const S = { neg: '', q: '', bairro: '', leadFiltro: 'abertos', rotaAnterior: '', senhaNova: false, entrarMsg: '' };
const LD = { lista: [], carregou: false, buscando: false, erro: '' };
const EQ = { lista: [], carregou: false, buscando: false, erro: '', salvando: false };
const EQ_MAX = 5;

/* ---------- peças ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
function fmtReal(v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); }
const capa = im => (im && (im.capa || (im.fotos || [])[0])) || '';
function tituloCurto(im) {
  if (!im) return '';
  const d = im.dorm ? im.dorm + ' dorm · ' : '';
  return im.tipo + ' · ' + d + (im.bairro || im.cidade || '');
}
function precoIm(im) {
  if (!im || !im.preco) return 'Consulte';
  if (im.transacao === 'aluguel') return fmtReal(im.preco) + '/mês';
  if (im.transacao === 'temporada') return fmtReal(im.preco) + '/diária';
  return fmtReal(im.preco);
}
const TR = { venda: 'Venda', aluguel: 'Aluguel', temporada: 'Temporada' };
const tag = (sc, t) => `<span class="tag tag-${sc}">${esc(t)}</span>`;
function av(nome, extra) {
  const ini = String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('') || '?';
  return `<span class="av p ${extra || ''}" title="${esc(nome)}" aria-label="${esc(nome)}">${esc(ini)}</span>`;
}
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 3600); }
const LOGO = `<img src="arte/logo.svg" alt="${esc(MARCA)}">`;

/* ---------- rota ---------- */
function rota() {
  const h = location.hash.replace(/^#\/?/, '');
  const [tela, param] = h.split('/');
  return { tela: MENU.some(([id]) => id === tela) ? tela : 'whats', param: param ? decodeURIComponent(param) : '' };
}
const ir = h => { location.hash = h; };

/* ---------- a porta: só a conta dona da sala entra ---------- */
const REAL = () => typeof WZ_REAL === 'function' && WZ_REAL();
const LOGADO = () => typeof isLoggedIn === 'function' && isLoggedIn();
function vEntrar() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="entrar-form" aria-label="Entrar no painel">
    <img class="logo-entrar" src="arte/logo.svg" alt="${esc(MARCA)}">
    <div style="text-align:center"><h1 style="font-size:22px">Painel do atendimento</h1><div class="sm" style="margin-top:4px">As conversas do WhatsApp são dados de clientes: só a conta da ${esc(MARCA)} entra.</div></div>
    <label for="e-mail" class="sm b">E-mail</label><input id="e-mail" class="inp" type="email" autocomplete="username" required>
    <label for="e-senha" class="sm b">Senha</label><input id="e-senha" class="inp" type="password" autocomplete="current-password" required>
    <button type="submit" class="btn btn-navy" style="min-height:46px">Entrar</button>
    <div class="sm" id="entrar-msg" role="status" style="text-align:center">${esc(S.entrarMsg)}</div>
    <button type="button" class="btn btn-line btn-p" data-act="esqueci">Esqueci a senha</button>
    ${SITE ? `<a href="${esc(SITE)}" class="sm" style="text-align:center" target="_blank" rel="noopener">Ir para o site da ${esc(MARCA)}</a>` : ''}
  </form></div>`;
}
function vSenhaNova() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="senha-form" aria-label="Criar senha nova">
    <img class="logo-entrar" src="arte/logo.svg" alt="${esc(MARCA)}">
    <h1 style="font-size:22px;text-align:center">Crie a sua senha nova</h1>
    <label for="s-nova" class="sm b">Senha nova (mínimo 8 caracteres)</label><input id="s-nova" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <button type="submit" class="btn btn-navy" style="min-height:46px">Salvar e entrar</button>
    <div class="sm" id="senha-msg" role="status" style="text-align:center"></div>
  </form></div>`;
}
function vNaoDona() {
  return `${faixaCel()}<div class="topo"><h1>Painel</h1></div><div class="box"><b>Esta conta não é a dona do painel da ${esc(MARCA)}.</b><div class="sm">Entre com a conta que manda no painel para ver as conversas e os leads.</div><button type="button" class="btn btn-line btn-p" data-act="sair">Sair desta conta</button></div>`;
}
async function confereDona() {
  if (!REAL() || !LOGADO() || WZ.dona !== null || confereDona.indo) return;
  confereDona.indo = true;
  try {
    await authEnsure();
    const r = await supaFetch('app_config?id=eq.1&select=owner_uid');
    if (r.status === 401) { authSave(null); return; }
    const c = r.ok ? await r.json() : [];
    WZ.dona = !!(c[0] && authUser() && c[0].owner_uid === authUser().id);
  } catch (e) { /* sem rede: tenta de novo no próximo render */ } finally { confereDona.indo = false; render(); }
}

/* ---------- menu lateral e barra do celular ---------- */
function contagens() {
  const leads = (REAL() ? LD.lista : (typeof wzDemo === 'function' ? (WZ_EXEMPLO || (WZ_EXEMPLO = wzDemo())).ped : [])).filter(p => p.status === 'novo').length;
  return { whats: typeof wzNaoLidas === 'function' ? wzNaoLidas() : 0, leads };
}
function renderLado() {
  const r = rota(), n = contagens();
  const quem = REAL() && LOGADO() ? (authEmail() || '') : 'demonstração';
  $('lado').innerHTML = `
    <div class="marca"><span class="logo-fundo">${LOGO}</span><span><b>Painel do atendimento</b><small>${esc(quem)}</small></span></div>
    ${MENU.map(([id, l]) => `<a class="mi ${r.tela === id ? 'on' : ''}" href="#/${id}">${svg(ICO[id])}<span>${l}</span>${n[id] ? `<span class="n">${n[id]}</span>` : ''}</a>`).join('')}
    <div class="rodape">O robô responde 24 h pelo número da ${esc(MARCA)}. Quem responde aqui assume a conversa; o robô volta quando você devolver.</div>
    ${SITE ? `<a class="mi site" href="${esc(SITE)}" target="_blank" rel="noopener">${svg(ICO.site)}<span>Ver o site</span></a>` : ''}
    ${REAL() && LOGADO() ? '<button type="button" class="zerar" data-act="sair">Sair</button>' : ''}
    ${REAL() ? '' : '<div class="zerar" style="text-decoration:none">Demonstração · conversas de exemplo</div>'}`;
  $('barra-cel').innerHTML = MENU.map(([id, l]) => `<a href="#/${id}" class="${r.tela === id ? 'on' : ''}">${svg(ICO[id])}${l}${n[id] ? `<span class="n-cel">${n[id]}</span>` : ''}</a>`).join('');
}
function faixaCel() {
  return `<div class="demo-faixa">${LOGO}${REAL() && LOGADO() ? '<button type="button" class="vc" data-act="sair" style="flex:0 0 auto">Sair</button>' : '<span class="sm" style="color:#fff">demonstração</span>'}</div>`;
}

/* ---------- LEADS: o que o robô anotou ---------- */
async function ldCarregar() {
  if (!REAL()) { WZ_EXEMPLO = WZ_EXEMPLO || wzDemo(); LD.lista = WZ_EXEMPLO.ped; LD.carregou = true; return; }
  if (!LOGADO() || LD.buscando) return;
  LD.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('pedidos?select=id,data,created_at&order=created_at.desc&limit=500');
    if (r.status === 401) { authSave(null); throw new Error('sessao'); }
    if (!r.ok) throw new Error('banco ' + r.status);
    LD.lista = (await r.json()).map(x => Object.assign({ criadoEm: x.created_at }, x.data || {}, { id: x.id }));
    LD.erro = ''; LD.carregou = true;
  } catch (e) { LD.erro = 'Não consegui ler os leads agora. Tente de novo em alguns segundos.'; }
  finally { LD.buscando = false; }
}
function quandoLead(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function vLeads() {
  const f = S.leadFiltro;
  const todos = LD.lista;
  const l = todos.filter(p => f === 'todos' || (f === 'abertos' && LEAD_ABERTO(p.status)) || p.status === f);
  const chips = [['abertos', 'Em aberto', todos.filter(p => LEAD_ABERTO(p.status)).length], ['novo', 'Novos', todos.filter(p => p.status === 'novo').length], ['visita marcada', 'Visita marcada', todos.filter(p => p.status === 'visita marcada').length], ['todos', 'Todos', todos.length]];
  const linha = p => {
    const im = p.imovelRef ? porRef(p.imovelRef) : null;
    const nome = p.nome || (typeof wzNum === 'function' ? wzNum(p.telefone) : p.telefone) || 'Sem nome';
    const extras = Object.entries(p.extra || {}).filter(([, v]) => v && typeof v !== 'object').map(([k, v]) => `${k}: ${v}`).join(' · ');
    const eq = eqDoLead(p);
    return `<div class="lead">${im && capa(im) ? `<img src="${esc(capa(im))}" alt="" loading="lazy">` : '<span class="sem-foto" aria-hidden="true"></span>'}
      <span class="lt"><b>${esc(nome)}</b><span class="sm">${esc(p.rotulo || 'Lead')}${im ? ' · Ref. ' + esc(im.ref) + ' · ' + esc(tituloCurto(im)) + ' · ' + esc(precoIm(im)) : (p.imovelRef ? ' · Ref. ' + esc(p.imovelRef) : '')}</span>
        ${extras ? `<span class="sm">${esc(extras)}</span>` : ''}${p.mensagem ? `<span class="resumo">${esc(p.mensagem)}</span>` : ''}${eq ? `<span class="sm eq-lead ${eq.sc}">${esc(eq.t)}</span>` : ''}<span class="sm">${esc(quandoLead(p.criadoEm))}${p.origem ? ' · ' + esc(String(p.origem).replace('robo-', 'robô · ')) : ''}</span></span>
      <span class="lr"><select class="inp wz-st" data-act="ld-status" data-id="${esc(p.id)}" aria-label="Status do lead de ${esc(nome)}">${WZ_STATUS.map(([v, t]) => `<option value="${v}" ${p.status === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
        ${p.telefone ? `<a class="btn btn-line btn-p" href="#/whats/${esc(p.telefone)}">Abrir a conversa</a>` : ''}</span></div>`;
  };
  return `${faixaCel()}<div class="topo"><div><h1>Leads <small>· o que o robô anotou</small></h1>${REAL() ? '' : '<div class="sm" style="margin-top:4px">Demonstração: os leads das conversas de exemplo.</div>'}</div></div>
    <div class="chips">${chips.map(([v, t, q]) => `<button type="button" class="chip ${f === v ? 'on' : ''}" data-act="ld-filtro" data-v="${esc(v)}">${t} <span class="n">${q}</span></button>`).join('')}</div>
    ${LD.erro ? `<div class="wz-aviso sm">${esc(LD.erro)}</div>` : ''}
    <div class="lead-lista">${!LD.carregou ? '<div class="sm">Carregando os leads…</div>' : (l.map(linha).join('') || `<div class="box sm">${todos.length ? 'Nenhum lead neste filtro.' : 'Nenhum lead ainda. Quando o robô anotar uma visita, uma reserva ou um pedido, aparece aqui.'}</div>`)}</div>`;
}

/* ---------- EQUIPE: quem recebe o aviso de cada pedido no WhatsApp (05/11/2026) ----------
   Quando o robô anota um pedido, o cofre (aviso-equipe.js) manda para cada pessoa desta lista,
   saindo do número do robô, o pedido com os botões Confirmar / Outro horário / Eu assumo.
   A lista mora na sala: itens · equipe_wa, uma linha por número (só a dona grava — RLS). */
const EQ_ACAO = { confirmado: 'confirmou', outro: 'pediu outro horário', assumido: 'assumiu a conversa' };
function eqDoLead(p) {
  const e = p && p.equipe;
  if (!e) return null;
  if (e.resposta) return { sc: 'ok', t: `✅ ${e.resposta.por} ${EQ_ACAO[e.resposta.acao] || e.resposta.acao}${e.resposta.clienteAvisado === false ? ' · o cliente não foi avisado pelo robô (passou de 24 h): fale direto' : ''}` };
  if ((e.avisados || []).length) return { sc: '', t: 'Aviso no WhatsApp: ' + e.avisados.join(', ') + ' · esperando alguém tocar' };
  if ((e.falhou || []).length) return { sc: 'warn', t: 'O aviso não saiu: ' + (e.falhou[0].porque || 'erro') };
  return null;
}
const eqNum = v => { let d = String(v || '').replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d.length >= 12 && d.length <= 15 ? d : ''; };
async function eqCarregar() {
  if (!REAL()) { if (!EQ.carregou) EQ.lista = [{ nome: 'Corretor de plantão', numero: '5541999990000' }]; EQ.carregou = true; return; }
  if (!LOGADO() || EQ.buscando) return;
  EQ.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('itens?colecao=eq.equipe_wa&apagado=eq.false&select=id,dados&order=atualizado_em.asc&limit=20');
    if (r.status === 401) { authSave(null); throw new Error('sessao'); }
    if (!r.ok) throw new Error('banco ' + r.status);
    EQ.lista = (await r.json()).map(x => ({ nome: (x.dados && x.dados.nome) || 'Equipe', numero: (x.dados && x.dados.numero) || x.id }));
    EQ.erro = ''; EQ.carregou = true;
  } catch (e) { EQ.erro = 'Não consegui ler a equipe agora. Tente de novo em alguns segundos.'; }
  finally { EQ.buscando = false; }
}
function vEquipe() {
  const cheia = EQ.lista.length >= EQ_MAX;
  const linha = x => `<div class="lead eq-linha">${av(x.nome)}<span class="lt"><b>${esc(x.nome)}</b><span class="sm">${esc(typeof wzNum === 'function' ? wzNum(x.numero) : x.numero)}</span></span>
    <span class="lr"><button type="button" class="btn btn-line btn-p" data-act="eq-tirar" data-n="${esc(x.numero)}" aria-label="Tirar ${esc(x.nome)} da lista">Tirar</button></span></div>`;
  return `${faixaCel()}<div class="topo"><div><h1>Equipe <small>· quem recebe o aviso de cada pedido</small></h1>${REAL() ? '' : '<div class="sm" style="margin-top:4px">Demonstração: a lista não é gravada.</div>'}</div></div>
    <div class="box">
      <div>Quando o robô anota um pedido (visita, reserva, proposta), cada pessoa desta lista recebe no WhatsApp dela, saindo do número do robô, o pedido com 3 botões:</div>
      <div class="eq-botoes"><span><b>Confirmar</b> o cliente recebe a confirmação na hora.</span><span><b>Outro horário</b> o robô pede outros dias ao cliente.</span><span><b>Eu assumo</b> o robô fica quieto na conversa e você recebe o link para falar com o cliente.</span></div>
      <div class="sm">Vale o primeiro toque: quem tocar depois fica sabendo quem já respondeu. Até ${EQ_MAX} pessoas.</div>
    </div>
    ${EQ.erro ? `<div class="wz-aviso sm">${esc(EQ.erro)}</div>` : ''}
    <div class="lead-lista">${!EQ.carregou ? '<div class="sm">Carregando a equipe…</div>' : (EQ.lista.map(linha).join('') || '<div class="box sm">Ninguém na lista ainda: os pedidos só aparecem aqui no painel, em Leads.</div>')}</div>
    ${cheia ? '' : `<form class="box eq-form" id="eq-form" aria-label="Pôr alguém na equipe">
      <label class="sm b" for="eq-nome">Nome</label><input id="eq-nome" class="inp" maxlength="40" placeholder="Ex.: Silvana" autocomplete="off" required>
      <label class="sm b" for="eq-num">WhatsApp com DDD</label><input id="eq-num" class="inp" inputmode="tel" placeholder="(41) 99999-9999" autocomplete="off" required>
      <button type="submit" class="btn btn-navy" ${EQ.salvando ? 'disabled' : ''}>Pôr na equipe</button>
    </form>`}
    <div class="sm eq-nota">A Meta aprova a mensagem de aviso uma vez só, em minutos até 1 dia. Enquanto isso, o aviso só chega para quem mandou qualquer mensagem ao número do robô nas últimas 24 h. Quem escreve ao número do robô é atendido como cliente: é assim que dá para testar sozinho, pedindo uma visita.</div>`;
}
async function eqGrava(numero, dados, apagado) {
  if (!REAL()) return true;
  try {
    await authEnsure();
    const r = await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify({ colecao: 'equipe_wa', id: numero, dados, apagado }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
    return r.ok;
  } catch (e) { return false; }
}

/* ---------- IMÓVEIS: os da API do site deles ---------- */
function vImoveis() {
  if (!CAT.pronto) return `${faixaCel()}<div class="topo"><h1>Imóveis</h1></div><div class="sm">Carregando os imóveis…</div>`;
  const res = resumoCatalogo();
  const chips = [['', 'Todos', res.total], ['temporada', 'Temporada', res.porTransacao.temporada || 0], ['venda', 'Venda', res.porTransacao.venda || 0], ['aluguel', 'Aluguel', res.porTransacao.aluguel || 0]];
  const bairros = [...new Set(IMOVEIS.map(im => im.bairro).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return `${faixaCel()}
    <div class="topo"><div><h1>Imóveis <small>· ${res.total} no site da ${esc(MARCA)}</small></h1><div class="sm" style="margin-top:4px">São os mesmos que o robô procura. Vêm da API do site; para mudar um imóvel, mude no sistema de vocês.</div></div>
      <div class="acoes"><label for="bq" class="oculto">Buscar</label><input id="bq" class="inp" type="search" placeholder="Ref., bairro, tipo…" value="${esc(S.q)}" style="width:220px">
      <label for="bb" class="oculto">Bairro</label><select id="bb" class="inp" data-act="bairro"><option value="">Todos os bairros</option>${bairros.map(b => `<option ${S.bairro === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></div></div>
    <div class="chips">${chips.map(([v, l, n]) => `<button type="button" class="chip ${S.neg === v ? 'on' : ''}" data-act="neg" data-v="${v}">${l} <span class="n">${n}</span></button>`).join('')}<span class="dica">Toque para abrir a página do imóvel no site.</span></div>
    <div class="cards" id="lista-imoveis">${cardsImoveis()}</div>`;
}
function cardsImoveis() {
  const lista = filtrar({ neg: S.neg, q: S.q, bairro: S.bairro || undefined });
  if (!lista.length) return '<div class="sm">Nenhum imóvel com essa busca.</div>';
  return lista.map(im => `<a class="card" href="${esc(im.url || SITE)}" target="_blank" rel="noopener"><img src="${esc(capa(im))}" alt="" loading="lazy"><span class="cb"><span class="l1"><b>Ref. ${esc(im.ref)}</b>${tag(im.transacao === 'venda' ? 'neu' : 'gold', TR[im.transacao])}</span><span class="t">${esc(tituloCurto(im))}</span><span class="v num">${esc(precoIm(im))}</span>${im.maxPessoas ? `<span class="pessoas">até ${esc(im.maxPessoas)} pessoas</span>` : ''}</span></a>`).join('');
}

/* ---------- cliques e formulários ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el || el.dataset.act.startsWith('wz-')) return;
  const a = el.dataset.act, v = el.dataset.v;
  if (a === 'ir') { e.preventDefault(); ir(el.dataset.h); return; }
  if (a === 'neg') { S.neg = v; render(); return; }
  if (a === 'ld-filtro') { S.leadFiltro = v; render(); return; }
  if (a === 'eq-tirar') {
    const x = EQ.lista.find(y => y.numero === el.dataset.n); if (!x) return;
    if (!confirm('Tirar ' + x.nome + ' da equipe? Esse número deixa de receber o aviso dos pedidos.')) return;
    el.disabled = true;
    const ok = await eqGrava(x.numero, { nome: x.nome, numero: x.numero }, true);
    if (ok) EQ.lista = EQ.lista.filter(y => y !== x);
    toast(ok ? x.nome + ' saiu da equipe.' : 'Não gravou. Tente de novo.'); render(); return;
  }
  if (a === 'sair') { await authSignOut(); WZ.dona = null; WZ.lista = []; WZ.carregou = false; LD.lista = []; LD.carregou = false; S.entrarMsg = ''; render(); return; }
  if (a === 'esqueci') {
    const email = ($('e-mail') && $('e-mail').value.trim()) || '';
    if (!email) { $('entrar-msg').textContent = 'Escreva o seu e-mail acima e toque de novo em "Esqueci a senha".'; return; }
    el.disabled = true;
    const r = await authReset(email);
    el.disabled = false;
    $('entrar-msg').textContent = r.ok ? 'Pronto: chegou um e-mail com o link para criar a senha nova. Abra o link neste mesmo aparelho.' : (r.error || 'Não consegui mandar agora. Tente de novo.');
  }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'bb') { S.bairro = e.target.value; const l = $('lista-imoveis'); if (l) l.innerHTML = cardsImoveis(); return; }
  if (e.target.dataset.act !== 'ld-status') return;
  const id = e.target.dataset.id, status = e.target.value;
  const p = LD.lista.find(x => x.id === id); if (!p) return;
  const antes = p.status; p.status = status;
  let ok = true;
  if (REAL()) {
    const dados = Object.assign({}, p); delete dados.id; delete dados.criadoEm;
    try { const r = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ data: dados }), headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (x) { ok = false; }
  }
  if (!ok) p.status = antes;
  toast(ok ? 'Status do lead: ' + (WZ_STATUS.find(s => s[0] === status) || [, status])[1] + '.' : 'Não gravou. Tente de novo.');
  render();
});
document.addEventListener('input', e => {
  if (e.target.id !== 'bq') return;
  S.q = e.target.value; const l = $('lista-imoveis'); if (l) l.innerHTML = cardsImoveis();
});
document.addEventListener('submit', async e => {
  if (e.target.id === 'eq-form') {
    e.preventDefault();
    const nome = $('eq-nome').value.trim().slice(0, 40), numero = eqNum($('eq-num').value);
    if (!nome) { toast('Escreva o nome.'); return; }
    if (!numero) { toast('O WhatsApp precisa do DDD: (41) 99999-9999.'); $('eq-num').focus(); return; }
    if (EQ.lista.some(x => x.numero.slice(-8) === numero.slice(-8))) { toast('Esse número já está na equipe.'); return; }
    EQ.salvando = true;
    const ok = await eqGrava(numero, { nome, numero, criadoEm: new Date().toISOString() }, false);
    EQ.salvando = false;
    if (ok) EQ.lista.push({ nome, numero });
    toast(ok ? nome + ' entrou na equipe: o próximo pedido já chega nesse WhatsApp.' : 'Não gravou. Tente de novo.'); render(); return;
  }
  if (e.target.id === 'entrar-form') {
    e.preventDefault();
    const msg = $('entrar-msg'); msg.textContent = 'Entrando…';
    const r = await authSignIn($('e-mail').value.trim(), $('e-senha').value);
    if (!r || !r.ok) { msg.textContent = (r && r.error) || 'E-mail ou senha não conferem.'; return; }
    WZ.dona = null; WZ.carregou = false; WZ.erro = ''; LD.carregou = false; S.entrarMsg = ''; render(); return;
  }
  if (e.target.id === 'senha-form') {
    e.preventDefault();
    const msg = $('senha-msg'); msg.textContent = 'Salvando…';
    const r = await authSetPassword($('s-nova').value);
    if (!r.ok) { msg.textContent = r.error || 'Não consegui salvar. Peça um link novo em "Esqueci a senha".'; return; }
    S.senhaNova = false; WZ.dona = null; toast('Senha nova salva.'); render();
  }
});

/* ---------- render ---------- */
function render() {
  const real = REAL(), logado = LOGADO();
  const porta = S.senhaNova ? vSenhaNova() : (real && !logado ? vEntrar() : '');
  document.body.classList.toggle('entrar', !!porta);
  if (porta) { $('meio').innerHTML = porta; $('lado').innerHTML = ''; $('barra-cel').innerHTML = ''; document.title = 'Painel ' + MARCA + ' · entrar'; return; }
  if (real && WZ.dona === null) { confereDona(); $('meio').innerHTML = '<div class="sm" style="padding:24px">Conferindo a conta…</div>'; renderLado(); return; }
  const r = rota();
  const chave = r.tela + '/' + r.param;
  if (chave !== S.rotaAnterior) {
    S.rotaAnterior = chave; window.scrollTo(0, 0);
    if (r.tela === 'leads') ldCarregar().then(() => { if (rota().tela === 'leads') render(); });
    if (r.tela === 'equipe') eqCarregar().then(() => { if (rota().tela === 'equipe') render(); });
  }
  let html;
  if (real && WZ.dona === false) html = vNaoDona();
  else if (r.tela === 'leads') html = vLeads();
  else if (r.tela === 'imoveis') html = vImoveis();
  else if (r.tela === 'equipe') html = vEquipe();
  else html = vWhats(r.param);
  $('meio').innerHTML = html;
  renderLado();
  document.body.classList.toggle('tela-whats', r.tela === 'whats');
  if (r.tela === 'whats' && !(real && WZ.dona === false)) wzLiga();
  document.title = 'Painel ' + MARCA + ' · ' + ({ whats: 'WhatsApp', leads: 'Leads', imoveis: 'Imóveis', equipe: 'Equipe' }[r.tela]);
}
window.addEventListener('hashchange', render);

/* o link do e-mail de "Esqueci a senha" volta para cá com a sessão no endereço */
(function inicio() {
  const volta = typeof authFromHash === 'function' ? authFromHash() : null;
  if (volta && volta.tipo === 'recovery') S.senhaNova = true;
  if (volta && volta.erro) S.entrarMsg = 'O link do e-mail não valeu (' + volta.erro + '). Peça outro em "Esqueci a senha".';
  if (!REAL()) { WZ_EXEMPLO = WZ_EXEMPLO || wzDemo(); LD.lista = WZ_EXEMPLO.ped; LD.carregou = true; }
  render();
  carregarCatalogo('2026-11-03').then(() => render());
})();

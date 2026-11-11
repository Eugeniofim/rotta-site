/* =====================================================
   APP DA MILLA (10/11/2026) — nasceu do painel do robô de 03/11/2026.
   Um app por imobiliária: a marca da imobiliária vem do config.js e os dados
   moram na sala dela (jamais misturar uma imobiliária com outra).

   A Milla atende 24 h no WhatsApp com os imóveis do site deles. Este painel é
   onde a equipe vê cada conversa, os leads que a Milla anotou (quem quer visitar,
   reservar, fazer proposta ou anunciar) e responde pelo mesmo número.

   Um arquivo, sem framework, rotas por #/, um clique tratado por data-act,
   só com o que vale para quem já tem o próprio sistema de imóveis:
     #/inicio     o que precisa da equipe agora (resumo do dia)
     #/whats      as conversas (whats.js)
     #/leads      os pedidos que a Milla anotou, com o status
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
  inicio: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  sair: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  equipe: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M15.5 4.1a3.5 3.5 0 0 1 0 6.8',
};
const MENU = [['inicio', 'Início'], ['whats', 'WhatsApp'], ['leads', 'Leads'], ['imoveis', 'Imóveis'], ['equipe', 'Equipe']];
const menuVisivel = () => MENU.filter(([id]) => id !== 'equipe' || GESTOR());
const LEAD_ABERTO = s => !['atendido', 'perdido'].includes(s);

/* ---------- estado ---------- */
const S = { neg: '', q: '', bairro: '', leadFiltro: 'abertos', rotaAnterior: '', senhaNova: false, entrarMsg: '', primeiro: false };
/* quem entra no app (11/11/2026): cada pessoa com o próprio e-mail; a sala diz o papel (meu_acesso) */
const AC = { lista: [], carregou: false, erro: '', salvando: false, semTabela: false };
const PAPEIS = [['corretor', 'Corretora', 'conversas, leads e imóveis'], ['dono', 'Dono', 'tudo, inclusive a Equipe e quem entra']];
const LD = { lista: [], carregou: false, buscando: false, erro: '' };
const EQ = { lista: [], carregou: false, buscando: false, erro: '', salvando: false, cfg: { modo: 'todos', prazoMin: 10, fds: 'segura' } };
/* rodízio por produto (10/11/2026): a vez gira em venda, locação e temporada; cada pessoa pode ter os seus */
const EQ_PRODUTOS = [['venda', 'Venda'], ['aluguel', 'Locação'], ['temporada', 'Temporada']];
const eqProds = x => (Array.isArray(x && x.produtos) && x.produtos.length ? x.produtos : EQ_PRODUTOS.map(p => p[0]));
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
/* o símbolo da Milla: quatro vidraças formando um balão; a de cima à direita é a luz acesa */
const SIMBOLO = (cls = '') => `<svg class="simbolo ${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 8H46.5V41.5H8V26A18 18 0 0 1 26 8Z"/><path d="M8 48.5H46.5V82H26L8 92Z"/><path d="M53.5 48.5H92V64A18 18 0 0 1 74 82H53.5Z"/><path class="luz" d="M53.5 8H74A18 18 0 0 1 92 26V41.5H53.5Z"/></svg>`;
const LOGO = `<span class="logo-milla">${SIMBOLO()}<b>Milla</b></span>`;

/* ---------- rota ---------- */
function rota() {
  const h = location.hash.replace(/^#\/?/, '');
  const [tela, param] = h.split('/');
  return { tela: MENU.some(([id]) => id === tela) ? tela : 'inicio', param: param ? decodeURIComponent(param) : '' };
}
const ir = h => { location.hash = h; };

/* ---------- a porta: entra quem está na lista da sala (a RLS confere de novo no banco) ---------- */
const REAL = () => typeof WZ_REAL === 'function' && WZ_REAL();
const LOGADO = () => typeof isLoggedIn === 'function' && isLoggedIn();
/* quem gere: a conta do estúdio (admin) e o dono da imobiliária. Na demonstração, tudo aberto. */
const GESTOR = () => !REAL() || WZ.papel === 'admin' || WZ.papel === 'dono';
function vEntrar() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="entrar-form" aria-label="Entrar no app da Milla">
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">Atendimento da ${esc(MARCA)}</span><h1>Entrar no app da Milla</h1><div class="sm">Cada pessoa da equipe entra com o próprio e-mail e a própria senha.</div></div>
    <label for="e-mail" class="sm b">E-mail</label><input id="e-mail" class="inp" type="email" autocomplete="username" required>
    <label for="e-senha" class="sm b">Senha</label><input id="e-senha" class="inp" type="password" autocomplete="current-password" required>
    <button type="submit" class="btn btn-navy btn-g">Entrar</button>
    <div class="sm" id="entrar-msg" role="status" style="text-align:center">${esc(S.entrarMsg)}</div>
    <button type="button" class="btn btn-line btn-p" data-act="esqueci">Esqueci a senha</button>
    <button type="button" class="btn btn-line btn-p" data-act="primeiro">Primeiro acesso: criar a minha senha</button>
    ${SITE ? `<a href="${esc(SITE)}" class="sm entrar-site" target="_blank" rel="noopener">Ir para o site da ${esc(MARCA)}</a>` : ''}
  </form><div class="entrar-pe">Milla · por studio Ti Artes</div></div>`;
}
/* primeiro acesso: a própria pessoa cria a senha; a conta só abre o app se o e-mail estiver na lista da sala */
function vPrimeiro() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="primeiro-form" aria-label="Primeiro acesso">
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">Atendimento da ${esc(MARCA)}</span><h1>Primeiro acesso</h1><div class="sm">Use o e-mail que o responsável da ${esc(MARCA)} pôs no app e crie a sua senha. Ela é só sua: não mande para ninguém.</div></div>
    <label for="p-mail" class="sm b">E-mail</label><input id="p-mail" class="inp" type="email" autocomplete="username" required>
    <label for="p-senha" class="sm b">Crie a senha (mínimo 8 caracteres)</label><input id="p-senha" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <label for="p-senha2" class="sm b">Repita a senha</label><input id="p-senha2" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <button type="submit" class="btn btn-navy btn-g">Criar o meu acesso</button>
    <div class="sm" id="primeiro-msg" role="status" style="text-align:center"></div>
    <button type="button" class="btn btn-line btn-p" data-act="primeiro-volta">Já tenho senha: entrar</button>
  </form><div class="entrar-pe">Milla · por studio Ti Artes</div></div>`;
}
/* conta de demonstração (sem banco): a mesma porta do app de verdade, para mostrar na venda */
const DEMO_CHAVE = 'milla_demo_dentro';
function demoDentro() { try { return localStorage.getItem(DEMO_CHAVE) === '1'; } catch (e) { return true; } }
function vEntrarDemo() {
  return `<div class="entrar-fundo"><div class="entrar-caixa" role="group" aria-label="Conta de demonstração">
    <div class="entrar-marca">${SIMBOLO('grande')}<span class="olho">Conta de demonstração</span><h1>Entrar no app da Milla</h1><div class="sm">${esc(MARCA)} é uma imobiliária de exemplo: conversas, fichas e imóveis inventados. Na sua imobiliária, você entra com o seu e-mail e a sua senha.</div></div>
    <label class="sm b" for="d-mail">E-mail</label><input id="d-mail" class="inp" value="demonstracao@milla" readonly>
    <button type="button" class="btn btn-navy btn-g" data-act="demo-entrar">Entrar na demonstração</button>
  </div><div class="entrar-pe">Milla · por studio Ti Artes</div></div>`;
}
function vSenhaNova() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="senha-form" aria-label="Criar senha nova">
    <div class="entrar-marca">${SIMBOLO('grande')}<h1>Crie a sua senha nova</h1></div>
    <label for="s-nova" class="sm b">Senha nova (mínimo 8 caracteres)</label><input id="s-nova" class="inp" type="password" minlength="8" autocomplete="new-password" required>
    <button type="submit" class="btn btn-navy btn-g">Salvar e entrar</button>
    <div class="sm" id="senha-msg" role="status" style="text-align:center"></div>
  </form></div>`;
}
function vNaoDona() {
  return `${faixaCel()}<div class="topo"><h1>App da Milla</h1></div><div class="box"><b>Esta conta ainda não tem acesso ao app da ${esc(MARCA)}.</b><div class="sm">${authEmail() ? 'Você entrou como ' + esc(authEmail()) + '. ' : ''}Peça ao responsável da ${esc(MARCA)} para pôr este e-mail em Equipe → Quem entra no app. Depois, é só entrar de novo.</div><button type="button" class="btn btn-line btn-p" data-act="sair">Sair desta conta</button></div>`;
}
function vSoGestor() {
  return `${faixaCel()}<div class="topo"><h1>Equipe</h1></div><div class="box"><b>Só o responsável da ${esc(MARCA)} mexe na Equipe.</b><div class="sm">As conversas, os leads e os imóveis estão no menu.</div></div>`;
}
/* quem é esta conta nesta sala: 'admin' (o estúdio), 'dono', 'corretor' ou nada */
async function confereDona() {
  if (!REAL() || !LOGADO() || WZ.dona !== null || confereDona.indo) return;
  confereDona.indo = true;
  try {
    await authEnsure();
    /* quem chega pelo link de confirmação do e-mail ainda não tem os dados da conta na sessão */
    if (!authUser() && authToken()) {
      const u = await comPrazo(SUPA_URL + '/auth/v1/user', { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + authToken() } });
      if (u.status === 401) { authSave(null); return; }
      if (u.ok && SESSION) { SESSION.user = await u.json(); authSave(SESSION); }
    }
    const r = await supaFetch('rpc/meu_acesso', { method: 'POST', body: '{}' });
    if (r.status === 401) { authSave(null); return; }
    if (r.ok) {
      const papel = await r.json().catch(() => null);
      WZ.papel = typeof papel === 'string' ? papel : '';
    } else {
      /* sala sem a lista de acesso (SQL antigo): vale só a dona, como antes */
      const c0 = await supaFetch('app_config?id=eq.1&select=owner_uid');
      const c = c0.ok ? await c0.json() : [];
      WZ.papel = c[0] && authUser() && c[0].owner_uid === authUser().id ? 'admin' : '';
    }
    WZ.dona = !!WZ.papel;
    /* quem tem acesso: a conta passa a lembrar onde fica este app (o Entrar do site usa) */
    if (WZ.dona && typeof authLembraApp === 'function') authLembraApp({ sala: APP_CONFIG.sala, nome: APP_CONFIG.nome, url: appHome() }).catch(() => {});
  } catch (e) { confereDona.falhou = true; /* sem rede: tenta de novo em 3 s, sem martelar o banco */ }
  finally {
    confereDona.indo = false;
    if (confereDona.falhou) { confereDona.falhou = false; setTimeout(render, 3000); } else render();
  }
}

/* ---------- menu lateral e barra do celular ---------- */
function contagens() {
  const leads = (REAL() ? LD.lista : (typeof wzDemo === 'function' ? (WZ_EXEMPLO || (WZ_EXEMPLO = wzDemo())).ped : [])).filter(p => p.status === 'novo').length;
  return { whats: typeof wzNaoLidas === 'function' ? wzNaoLidas() : 0, leads };
}
function renderLado() {
  const r = rota(), n = contagens();
  const quem = REAL() && LOGADO() ? (authEmail() || '') + ({ dono: ' · dono', corretor: ' · corretora' }[WZ.papel] || '') : 'demonstração · dados de exemplo';
  $('lado').innerHTML = `
    <a class="marca" href="#/inicio" aria-label="Milla, início">${LOGO}</a>
    <div class="conta"><span class="conta-rot">Imobiliária</span><b>${esc(MARCA)}</b><span class="online"><i aria-hidden="true"></i>Milla atendendo · 24 h</span></div>
    <nav class="menu" aria-label="Menu">${menuVisivel().map(([id, l]) => `<a class="mi ${r.tela === id ? 'on' : ''}" href="#/${id}" ${r.tela === id ? 'aria-current="page"' : ''}>${svg(ICO[id])}<span>${l}</span>${n[id] ? `<span class="n">${n[id]}</span>` : ''}</a>`).join('')}</nav>
    <div class="rodape">A Milla responde 24 h pelo número da ${esc(MARCA)}. Quem responde aqui assume a conversa; a Milla volta quando você devolver.</div>
    ${SITE ? `<a class="mi site" href="${esc(SITE)}" target="_blank" rel="noopener">${svg(ICO.site)}<span>Ver o site</span></a>` : ''}
    <div class="quem"><span class="sm">${esc(quem)}</span>${REAL() && LOGADO() ? `<button type="button" class="btn btn-line btn-p" data-act="sair">${svg(ICO.sair)}Sair</button>` : (REAL() ? '' : `<button type="button" class="btn btn-line btn-p" data-act="demo-sair">${svg(ICO.sair)}Sair da demonstração</button>`)}</div>`;
  $('barra-cel').innerHTML = menuVisivel().map(([id, l]) => `<a href="#/${id}" class="${r.tela === id ? 'on' : ''}" ${r.tela === id ? 'aria-current="page"' : ''}>${svg(ICO[id])}${l}${n[id] ? `<span class="n-cel">${n[id]}</span>` : ''}</a>`).join('');
}
function faixaCel() {
  return `<div class="demo-faixa"><a href="#/inicio" class="faixa-marca" aria-label="Milla, início">${SIMBOLO()}<span><b>Milla</b><small>${esc(MARCA)}</small></span></a>${REAL() && LOGADO() ? '<button type="button" class="btn btn-line btn-p" data-act="sair">Sair</button>' : (REAL() ? '' : '<button type="button" class="btn btn-line btn-p" data-act="demo-sair">Sair</button>')}</div>`;
}

/* ---------- INÍCIO: o que precisa da equipe agora ---------- */
const IN = { carregando: false };
function saudacao() { const h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'; }
const hoje = iso => iso && new Date(iso).toDateString() === new Date().toDateString();
const ehVisita = p => /visita/i.test(JSON.stringify(p.extra || {}) + ' ' + (p.rotulo || '') + ' ' + (p.status || ''));
async function inCarregar() {
  if (IN.carregando) return;
  IN.carregando = true;
  try { await Promise.all([typeof wzCarregar === 'function' ? wzCarregar('') : null, ldCarregar()]); } finally { IN.carregando = false; }
}
function vInicio() {
  const conv = (typeof WZ !== 'undefined' && WZ.lista) || [];
  const leads = LD.lista || [];
  const pausado = c => typeof wzPausado === 'function' && wzPausado(c);
  const novos = leads.filter(p => p.status === 'novo');
  const kpis = [
    ['Conversas hoje', conv.filter(c => hoje(c.ultimaEm)).length, 'no WhatsApp da ' + MARCA, '#/whats'],
    ['Fichas novas', novos.length, 'esperando a equipe', '#/leads'],
    ['Visitas pedidas', leads.filter(p => LEAD_ABERTO(p.status) && ehVisita(p)).length, 'a equipe confirma', '#/leads'],
    ['Com a equipe', conv.filter(pausado).length, 'a Milla fica quieta nelas', '#/whats'],
  ];
  const nome = p => p.nome || (typeof wzNum === 'function' ? wzNum(p.telefone) : p.telefone) || 'Sem nome';
  const ORDEM_T = { quente: 0, morno: 1, frio: 2 };
  const precisa = novos.slice().sort((a, b) => ORDEM_T[tempDe(a)] - ORDEM_T[tempDe(b)]).slice(0, 6).map(p => {
    const im = p.imovelRef ? porRef(p.imovelRef) : null;
    const eq = eqDoLead(p);
    const pedido = (p.extra && (p.extra.Pedido || p.extra.pedido)) || p.rotulo || 'Lead';
    const quando = p.extra && (p.extra.Quando || p.extra.quando);
    return `<article class="pc">
      ${im && capa(im) ? `<img src="${esc(capa(im))}" alt="" loading="lazy">` : `<span class="pc-ico" aria-hidden="true">${svg(ICO.leads)}</span>`}
      <div class="pc-tx"><div class="pc-l1"><b>${esc(nome(p))}</b>${tempTag(p)}<span class="tag tag-ok">${esc(pedido)}</span>${quando ? `<span class="sm">${esc(quando)}</span>` : ''}</div>
        ${p.mensagem ? `<p>${esc(p.mensagem)}</p>` : ''}
        <span class="sm">${esc(quandoLead(p.criadoEm))}${im ? ' · Ref. ' + esc(im.ref) + ' · ' + esc(precoIm(im)) : ''}${eq ? ' · ' + esc(eq.t) : ''}</span></div>
      ${p.telefone ? `<a class="btn btn-navy btn-p" href="#/whats/${esc(p.telefone)}">Abrir a conversa</a>` : ''}
    </article>`;
  }).join('');
  const ultimas = conv.slice(0, 5).map(c => `<a class="ult" href="#/whats/${esc(c.numero)}">${av(wzNome(c) || '?')}<span class="ult-tx"><b>${esc(wzNome(c))}</b><span class="sm">${esc((c.ultimaDir === 'robo' ? 'Milla: ' : c.ultimaDir === 'equipe' ? 'Equipe: ' : '') + (c.ultima || ''))}</span></span><span class="ult-dir"><span class="sm num">${esc(wzQuando(c.ultimaEm))}</span>${c.naoLidas ? `<span class="wz-n">${c.naoLidas}</span>` : ''}</span></a>`).join('');
  const carregando = REAL() && (!LD.carregou || !(typeof WZ !== 'undefined' && WZ.carregou));
  return `${faixaCel()}
    <header class="ini-topo"><div><span class="olho">Atendimento da ${esc(MARCA)}</span><h1>${saudacao()}.</h1><p class="lead-tx">A Milla está no WhatsApp da ${esc(MARCA)}. Aqui está o que chegou e o que precisa de você.</p>${REAL() ? '' : '<p class="sm">Demonstração: conversas e imóveis de exemplo.</p>'}</div>
      <a class="btn btn-line" href="#/whats">${svg(ICO.whats)}Ver as conversas</a></header>
    <section class="kpis" aria-label="Resumo">${kpis.map(([t, v, s, h], i) => `<a class="kpi ${i === 1 && v ? 'quente' : ''}" href="${h}"><span class="kpi-rot">${esc(t)}</span><b class="num">${carregando ? '–' : v}</b><span class="sm">${esc(s)}</span></a>`).join('')}</section>
    <div class="ini-grade">
      <section class="bloco" aria-labelledby="t-precisa"><div class="bloco-cab"><h2 id="t-precisa">Precisa de você</h2><a class="sm" href="#/leads">Todas as fichas</a></div>
        <div class="pcs">${carregando ? '<div class="sm vazio">Carregando…</div>' : (precisa || '<div class="vazio"><b>Tudo em dia.</b><span class="sm">Quando a Milla anotar uma visita, uma reserva ou um pedido, a ficha aparece aqui.</span></div>')}</div></section>
      <section class="bloco" aria-labelledby="t-ult"><div class="bloco-cab"><h2 id="t-ult">Últimas conversas</h2><a class="sm" href="#/whats">Abrir o WhatsApp</a></div>
        <div class="ults">${carregando ? '<div class="sm vazio">Carregando…</div>' : (ultimas || '<div class="vazio"><span class="sm">Nenhuma conversa ainda. Quando alguém escrever para o número da ' + esc(MARCA) + ', aparece aqui.</span></div>')}</div></section>
    </div>`;
}

/* ---------- LEADS: o que a Milla anotou ---------- */
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
  const l = todos.filter(p => f === 'todos' || (f === 'abertos' && LEAD_ABERTO(p.status)) || p.status === f || (String(f).startsWith('t:') && LEAD_ABERTO(p.status) && tempDe(p) === f.slice(2)));
  const chips = [['abertos', 'Em aberto', todos.filter(p => LEAD_ABERTO(p.status)).length], ['novo', 'Novos', todos.filter(p => p.status === 'novo').length], ['visita marcada', 'Visita marcada', todos.filter(p => p.status === 'visita marcada').length], ['todos', 'Todos', todos.length]];
  const chipsT = WZ_TEMPS.map(([t, n]) => ['t:' + t, n + 's', todos.filter(p => LEAD_ABERTO(p.status) && tempDe(p) === t).length, t]);
  const linha = p => {
    const im = p.imovelRef ? porRef(p.imovelRef) : null;
    const nome = p.nome || (typeof wzNum === 'function' ? wzNum(p.telefone) : p.telefone) || 'Sem nome';
    const extras = Object.entries(p.extra || {}).filter(([, v]) => v && typeof v !== 'object').map(([k, v]) => `${k}: ${v}`).join(' · ');
    const eq = eqDoLead(p);
    return `<div class="lead">${im && capa(im) ? `<img src="${esc(capa(im))}" alt="" loading="lazy">` : '<span class="sem-foto" aria-hidden="true"></span>'}
      <span class="lt"><b>${esc(nome)}</b><span class="sm">${esc(p.rotulo || 'Lead')}${im ? ' · Ref. ' + esc(im.ref) + ' · ' + esc(tituloCurto(im)) + ' · ' + esc(precoIm(im)) : (p.imovelRef ? ' · Ref. ' + esc(p.imovelRef) : '')}</span>
        ${extras ? `<span class="sm">${esc(extras)}</span>` : ''}${p.mensagem ? `<span class="resumo">${esc(p.mensagem)}</span>` : ''}${eq ? `<span class="sm eq-lead ${eq.sc}">${esc(eq.t)}</span>` : ''}<span class="sm">${esc(quandoLead(p.criadoEm))}${p.origem ? ' · ' + esc(String(p.origem).replace('robo-', 'Milla · ')) : ''}</span></span>
      <span class="lr">${tempSelect(p, 'ld-temp')}<select class="inp wz-st" data-act="ld-status" data-id="${esc(p.id)}" aria-label="Status do lead de ${esc(nome)}">${WZ_STATUS.map(([v, t]) => `<option value="${v}" ${p.status === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
        ${p.telefone ? `<a class="btn btn-line btn-p" href="#/whats/${esc(p.telefone)}">Abrir a conversa</a>` : ''}</span></div>`;
  };
  return `${faixaCel()}<div class="topo"><div><h1>Leads <small>· o que a Milla anotou</small></h1>${REAL() ? '' : '<div class="sm" style="margin-top:4px">Demonstração: os leads das conversas de exemplo.</div>'}</div></div>
    <div class="chips">${chips.map(([v, t, q]) => `<button type="button" class="chip ${f === v ? 'on' : ''}" data-act="ld-filtro" data-v="${esc(v)}">${t} <span class="n">${q}</span></button>`).join('')}</div>
    <div class="chips chips-temp" aria-label="Calor dos leads em aberto">${chipsT.map(([v, t, q, c]) => `<button type="button" class="chip chip-${c} ${f === v ? 'on' : ''}" data-act="ld-filtro" data-v="${esc(v)}"><span class="bolinha" aria-hidden="true"></span>${t} <span class="n">${q}</span></button>`).join('')}</div>
    ${LD.erro ? `<div class="wz-aviso sm">${esc(LD.erro)}</div>` : ''}
    <div class="lead-lista">${!LD.carregou ? '<div class="sm">Carregando os leads…</div>' : (l.map(linha).join('') || `<div class="box sm">${todos.length ? 'Nenhum lead neste filtro.' : 'Nenhum lead ainda. Quando a Milla anotar uma visita, uma reserva ou um pedido, aparece aqui.'}</div>`)}</div>`;
}

/* ---------- EQUIPE: quem recebe o aviso de cada pedido no WhatsApp (05/11/2026) ----------
   Quando a Milla anota um pedido, o cofre (aviso-equipe.js) manda para cada pessoa desta lista,
   saindo do número da Milla, o pedido com os botões Confirmar / Outro horário / Eu assumo.
   A lista mora na sala: itens · equipe_wa, uma linha por número (só a dona grava — RLS). */
const EQ_ACAO = { confirmado: 'confirmou', outro: 'pediu outro horário', assumido: 'assumiu a conversa' };
function eqDoLead(p) {
  const e = p && p.equipe;
  if (!e) return null;
  if (e.resposta) return { sc: 'ok', t: `${e.resposta.por} ${EQ_ACAO[e.resposta.acao] || e.resposta.acao}${e.resposta.clienteAvisado === false ? ' · o cliente não foi avisado pela Milla (passou de 24 h): fale direto' : ''}` };
  if (e.modo === 'rodizio') {
    if (e.esgotou) return { sc: 'warn', t: 'Ninguém respondeu: ' + (e.avisados || []).join(', ') + ' foram avisadas' };
    if (e.vez) {
      const dp = e.prazo ? new Date(e.prazo) : null, mesmoDia = dp && dp.toDateString() === new Date().toDateString();
      const hora = dp ? (mesmoDia ? '' : dp.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') + ' ') + dp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const prod = (EQ_PRODUTOS.find(x => x[0] === e.produto) || [, ''])[1];
      return { sc: '', t: `Vez de ${e.vez}${prod ? ' (' + prod.toLowerCase() + ')' : ''}${e.doDono ? ' · já atendeu este cliente' : ''}${hora ? ' · passa às ' + hora + ' se ninguém tocar' : ''}${(e.passouDe || []).length ? ' · passou de ' + e.passouDe.join(', ') : ''}` };
    }
  }
  if ((e.avisados || []).length) return { sc: '', t: 'Aviso no WhatsApp: ' + e.avisados.join(', ') + ' · esperando alguém tocar' };
  if ((e.falhou || []).length) return { sc: 'warn', t: 'O aviso não saiu: ' + (e.falhou[0].porque || 'erro') };
  return null;
}
const eqNum = v => { let d = String(v || '').replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d.length >= 12 && d.length <= 15 ? d : ''; };
async function eqCarregar() {
  if (!REAL()) { if (!EQ.carregou) { EQ.lista = [{ nome: 'Ana', numero: '5511900000011' }, { nome: 'Bruno', numero: '5511900000012' }, { nome: 'Carla', numero: '5511900000013', produtos: ['venda', 'aluguel'] }]; EQ.cfg = { modo: 'rodizio', prazoMin: 10, fds: 'segura' }; } EQ.carregou = true; return; }
  if (!LOGADO() || EQ.buscando) return;
  EQ.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('itens?colecao=eq.equipe_wa&apagado=eq.false&select=id,dados&order=atualizado_em.asc&limit=20');
    if (r.status === 401) { authSave(null); throw new Error('sessao'); }
    if (!r.ok) throw new Error('banco ' + r.status);
    EQ.lista = (await r.json()).map(x => ({ nome: (x.dados && x.dados.nome) || 'Equipe', numero: (x.dados && x.dados.numero) || x.id, ...(x.dados && Array.isArray(x.dados.produtos) ? { produtos: x.dados.produtos } : {}) }));
    try {
      const c = await supaFetch('itens?colecao=eq.equipe_cfg&id=eq.cfg&apagado=eq.false&select=dados');
      const l = c.ok ? await c.json() : [];
      if (l[0] && l[0].dados) EQ.cfg = { modo: l[0].dados.modo === 'rodizio' ? 'rodizio' : 'todos', prazoMin: +l[0].dados.prazoMin || 10, fds: l[0].dados.fds === 'igual' ? 'igual' : 'segura' };
    } catch (x) { /* sem a configuração: avisa todos, como antes */ }
    EQ.erro = ''; EQ.carregou = true;
  } catch (e) { EQ.erro = 'Não consegui ler a equipe agora. Tente de novo em alguns segundos.'; }
  finally { EQ.buscando = false; }
}
/* ---------- QUEM ENTRA NO APP (11/11/2026) ----------
   A lista mora na sala: acessos (e-mail, nome, papel). Só quem gere vê e muda (RLS).
   A pessoa cria a própria senha em "Primeiro acesso": aqui não existe campo de senha. */
const acMail = v => String(v || '').trim().toLowerCase();
const acOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
async function acCarregar() {
  if (!REAL()) { if (!AC.carregou) AC.lista = [{ email: 'ana@exemplo.com', nome: 'Ana', papel: 'corretor' }, { email: 'dono@exemplo.com', nome: 'Responsável', papel: 'dono' }]; AC.carregou = true; return; }
  if (!LOGADO()) return;
  try {
    await authEnsure();
    const r = await supaFetch('acessos?select=email,nome,papel&order=criado_em.asc&limit=50');
    if (r.status === 404) { AC.semTabela = true; AC.carregou = true; return; }
    if (!r.ok) throw new Error('banco ' + r.status);
    AC.lista = await r.json(); AC.erro = ''; AC.semTabela = false; AC.carregou = true;
  } catch (e) { AC.erro = 'Não consegui ler quem entra no app agora. Tente de novo em alguns segundos.'; }
}
function acConvite(x) {
  return `Oi, ${x.nome || ''}! O seu acesso ao app da Milla (${MARCA}) está liberado.\n1. Abra ${appHome()}\n2. Toque em "Primeiro acesso: criar a minha senha"\n3. Use este e-mail: ${x.email}\n4. Crie a sua senha.\n5. Vai chegar um e-mail de "Ti Arts", em inglês ("Confirm your email address"): abra neste mesmo celular e toque em "Confirm email address".\nA senha é só sua: não mande para ninguém.`;
}
/* o WhatsApp da pessoa, se ela também está na lista de avisos com o mesmo primeiro nome */
function acWhats(x) {
  const pn = s => String(s || '').trim().split(/\s+/)[0].toLowerCase();
  const eq = EQ.lista.find(y => pn(y.nome) && pn(y.nome) === pn(x.nome));
  return eq ? eq.numero : '';
}
function vAcessos() {
  if (AC.semTabela) return `<div class="box ac-box"><div class="sm">A lista de acesso ainda não foi ligada nesta conta. Fale com o studio Ti Artes.</div></div>`;
  const papel = v => (PAPEIS.find(p => p[0] === v) || PAPEIS[0])[1];
  const linha = x => {
    const wa = acWhats(x);
    return `<div class="lead eq-linha">${av(x.nome || x.email)}<span class="lt"><b>${esc(x.nome || x.email)}</b><span class="sm">${esc(x.email)} · ${esc(papel(x.papel))}</span></span>
    <span class="lr ac-acoes">${wa ? `<a class="btn btn-line btn-p" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent(acConvite(x))}" target="_blank" rel="noopener">Mandar o convite</a>` : ''}<button type="button" class="btn btn-line btn-p" data-act="ac-copiar" data-e="${esc(x.email)}">Copiar o convite</button><button type="button" class="btn btn-line btn-p" data-act="ac-tirar" data-e="${esc(x.email)}" aria-label="Tirar o acesso de ${esc(x.nome || x.email)}">Tirar</button></span></div>`;
  };
  return `<div class="box ac-box">
      <div class="sm">Cada pessoa entra com o próprio e-mail e cria a própria senha em "Primeiro acesso", na tela de entrar. Ninguém passa senha para ninguém. ${REAL() ? '' : 'Demonstração: a lista não é gravada.'}</div>
    </div>
    ${AC.erro ? `<div class="wz-aviso sm">${esc(AC.erro)}</div>` : ''}
    <div class="lead-lista">${!AC.carregou ? '<div class="sm">Carregando…</div>' : (AC.lista.map(linha).join('') || '<div class="box sm">Ninguém da equipe entra no app ainda.</div>')}</div>
    <form class="box eq-form" id="ac-form" aria-label="Dar acesso ao app">
      <label class="sm b" for="ac-nome">Nome</label><input id="ac-nome" class="inp" maxlength="40" placeholder="Ex.: Poliana" autocomplete="off" required>
      <label class="sm b" for="ac-mail">E-mail dela ou dele</label><input id="ac-mail" class="inp" type="email" maxlength="120" placeholder="nome@email.com" autocomplete="off" required>
      <label class="sm b" for="ac-papel">O que pode fazer</label><select id="ac-papel" class="inp">${PAPEIS.map(([v, t, d]) => `<option value="${v}">${t}: ${d}</option>`).join('')}</select>
      <button type="submit" class="btn btn-navy" ${AC.salvando ? 'disabled' : ''}>Dar acesso</button>
    </form>`;
}
function vEquipe() {
  const cheia = EQ.lista.length >= EQ_MAX;
  const rz = EQ.cfg.modo === 'rodizio';
  const prods = x => `<span class="eq-prods" role="group" aria-label="O que ${esc(x.nome)} atende">${EQ_PRODUTOS.map(([v, t]) => `<button type="button" class="chip ${eqProds(x).includes(v) ? 'on' : ''}" data-act="eq-prod" data-n="${esc(x.numero)}" data-p="${v}" aria-pressed="${eqProds(x).includes(v)}">${t}</button>`).join('')}</span>`;
  const linha = x => `<div class="lead eq-linha">${av(x.nome)}<span class="lt"><b>${esc(x.nome)}</b><span class="sm">${esc(typeof wzNum === 'function' ? wzNum(x.numero) : x.numero)}</span>${rz ? prods(x) : ''}</span>
    <span class="lr"><button type="button" class="btn btn-line btn-p" data-act="eq-tirar" data-n="${esc(x.numero)}" aria-label="Tirar ${esc(x.nome)} da lista">Tirar</button></span></div>`;
  return `${faixaCel()}<div class="topo"><div><h1>Equipe <small>· quem recebe o aviso de cada pedido</small></h1>${REAL() ? '' : '<div class="sm" style="margin-top:4px">Demonstração: a lista não é gravada.</div>'}</div></div>
    <div class="box eq-modo-box">
      <div class="b">Como avisar a equipe</div>
      <div class="eq-modo" role="group" aria-label="Como avisar a equipe">
        <button type="button" data-act="eq-modo" data-v="todos" aria-pressed="${!rz}" class="${rz ? '' : 'on'}">Todos de uma vez</button>
        <button type="button" data-act="eq-modo" data-v="rodizio" aria-pressed="${rz}" class="${rz ? 'on' : ''}">Rodízio, uma por vez</button>
      </div>
      ${rz ? `<div class="sm">Em cada produto (venda, locação e temporada) a vez gira. Só a da vez recebe o aviso; se ela não tocar em <select class="inp wz-st" data-act="eq-prazo" aria-label="Prazo para tocar">${[5, 10, 15, 30].map(m => `<option value="${m}" ${EQ.cfg.prazoMin === m ? 'selected' : ''}>${m} min</option>`).join('')}</select>, passa para a próxima. À noite, o prazo começa às 9h. No fim de semana, <select class="inp wz-st" data-act="eq-fds" aria-label="Fim de semana"><option value="segura" ${EQ.cfg.fds !== 'igual' ? 'selected' : ''}>o aviso chega, mas só passa adiante na segunda às 9h</option><option value="igual" ${EQ.cfg.fds === 'igual' ? 'selected' : ''}>gira igual aos outros dias</option></select>. Quem não respondeu perde a vez, e o cliente que volta fica com quem já atendeu. Marque abaixo o que cada pessoa atende.</div>` : '<div class="sm">Todo pedido chega para todas as pessoas da lista; vale o primeiro toque.</div>'}
    </div>
    <div class="box">
      <div>Quando a Milla anota um pedido (visita, reserva, proposta), ${rz ? 'a pessoa da vez' : 'cada pessoa desta lista'} recebe no WhatsApp dela, saindo do número da Milla, o pedido com 3 botões:</div>
      <div class="eq-botoes"><span><b>Confirmar</b> o cliente recebe a confirmação na hora.</span><span><b>Outro horário</b> a Milla pede outros dias ao cliente.</span><span><b>Eu assumo</b> a Milla fica quieta na conversa e você recebe o link para falar com o cliente.</span></div>
      <div class="sm">Vale o primeiro toque: quem tocar depois fica sabendo quem já respondeu. Até ${EQ_MAX} pessoas.</div>
    </div>
    ${EQ.erro ? `<div class="wz-aviso sm">${esc(EQ.erro)}</div>` : ''}
    <div class="lead-lista">${!EQ.carregou ? '<div class="sm">Carregando a equipe…</div>' : (EQ.lista.map(linha).join('') || '<div class="box sm">Ninguém na lista ainda: os pedidos só aparecem aqui no painel, em Leads.</div>')}</div>
    ${cheia ? '' : `<form class="box eq-form" id="eq-form" aria-label="Pôr alguém na equipe">
      <label class="sm b" for="eq-nome">Nome</label><input id="eq-nome" class="inp" maxlength="40" placeholder="Ex.: Ana" autocomplete="off" required>
      <label class="sm b" for="eq-num">WhatsApp com DDD</label><input id="eq-num" class="inp" inputmode="tel" placeholder="(41) 99999-9999" autocomplete="off" required>
      <button type="submit" class="btn btn-navy" ${EQ.salvando ? 'disabled' : ''}>Pôr na equipe</button>
    </form>`}
    <h2 class="ac-tit">Quem entra no app</h2>
    ${vAcessos()}
    <div class="sm eq-nota">A Meta aprova a mensagem de aviso uma vez só, em minutos até 1 dia. Enquanto isso, o aviso só chega para quem mandou qualquer mensagem ao número da Milla nas últimas 24 h. Quem escreve ao número da Milla é atendido como cliente: é assim que dá para testar sozinho, pedindo uma visita.</div>`;
}
async function eqGravaCfg() {
  if (!REAL()) return true;
  try {
    await authEnsure();
    const r = await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify({ colecao: 'equipe_cfg', id: 'cfg', dados: { modo: EQ.cfg.modo, prazoMin: EQ.cfg.prazoMin, fds: EQ.cfg.fds }, apagado: false }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
    return r.ok;
  } catch (e) { return false; }
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
    <div class="topo"><div><h1>Imóveis <small>· ${res.total} no site da ${esc(MARCA)}</small></h1><div class="sm" style="margin-top:4px">São os mesmos que a Milla procura. Vêm da API do site; para mudar um imóvel, mude no sistema de vocês.</div></div>
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
  if (a === 'eq-modo') {
    const antes = EQ.cfg.modo; EQ.cfg.modo = v === 'rodizio' ? 'rodizio' : 'todos';
    const ok = await eqGravaCfg(); if (!ok) EQ.cfg.modo = antes;
    toast(!ok ? 'Não gravou. Tente de novo.' : EQ.cfg.modo === 'rodizio' ? 'Rodízio ligado: o próximo pedido vai só para a pessoa da vez.' : 'Todos de uma vez: o próximo pedido chega para toda a equipe.'); render(); return;
  }
  if (a === 'eq-prod') {
    const x = EQ.lista.find(y => y.numero === el.dataset.n); if (!x) return;
    const atual = eqProds(x), p = el.dataset.p, novo = atual.includes(p) ? atual.filter(y => y !== p) : [...atual, p];
    if (!novo.length) { toast('Cada pessoa precisa atender pelo menos um produto.'); return; }
    const antes = x.produtos; x.produtos = EQ_PRODUTOS.map(y => y[0]).filter(y => novo.includes(y));
    const ok = await eqGrava(x.numero, { nome: x.nome, numero: x.numero, produtos: x.produtos }, false);
    if (!ok) x.produtos = antes;
    toast(ok ? x.nome + ' atende: ' + x.produtos.map(y => (EQ_PRODUTOS.find(z => z[0] === y) || [, y])[1].toLowerCase()).join(', ') + '.' : 'Não gravou. Tente de novo.'); render(); return;
  }
  if (a === 'eq-tirar') {
    const x = EQ.lista.find(y => y.numero === el.dataset.n); if (!x) return;
    if (!confirm('Tirar ' + x.nome + ' da equipe? Esse número deixa de receber o aviso dos pedidos.')) return;
    el.disabled = true;
    const ok = await eqGrava(x.numero, { nome: x.nome, numero: x.numero, ...(x.produtos ? { produtos: x.produtos } : {}) }, true);
    if (ok) EQ.lista = EQ.lista.filter(y => y !== x);
    toast(ok ? x.nome + ' saiu da equipe.' : 'Não gravou. Tente de novo.'); render(); return;
  }
  if (a === 'primeiro') { S.primeiro = true; render(); return; }
  if (a === 'primeiro-volta') { S.primeiro = false; render(); return; }
  if (a === 'ac-copiar') {
    const x = AC.lista.find(y => y.email === el.dataset.e); if (!x) return;
    const t = acConvite(x);
    try { await navigator.clipboard.writeText(t); toast('Convite copiado: cole no WhatsApp de ' + (x.nome || x.email) + '.'); }
    catch (e) { window.prompt('Copie o convite:', t); }
    return;
  }
  if (a === 'ac-tirar') {
    const x = AC.lista.find(y => y.email === el.dataset.e); if (!x) return;
    if (!confirm('Tirar o acesso de ' + (x.nome || x.email) + '? Essa pessoa deixa de entrar no app na hora.')) return;
    el.disabled = true;
    let ok = true;
    if (REAL()) { try { await authEnsure(); const r = await supaFetch('acessos?email=eq.' + encodeURIComponent(x.email), { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (e) { ok = false; } }
    if (ok) AC.lista = AC.lista.filter(y => y !== x);
    toast(ok ? (x.nome || x.email) + ' não entra mais no app.' : 'Não gravou. Tente de novo.'); render(); return;
  }
  if (a === 'demo-entrar') { try { localStorage.setItem(DEMO_CHAVE, '1'); } catch (x) {} location.hash = '#/inicio'; render(); return; }
  if (a === 'demo-sair') { try { localStorage.removeItem(DEMO_CHAVE); } catch (x) {} render(); return; }
  if (a === 'sair') { await authSignOut(); WZ.dona = null; WZ.papel = ''; AC.carregou = false; AC.lista = []; EQ.carregou = false; WZ.lista = []; WZ.carregou = false; LD.lista = []; LD.carregou = false; S.entrarMsg = ''; render(); return; }
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
  if (e.target.dataset.act === 'eq-fds') {
    const antes = EQ.cfg.fds; EQ.cfg.fds = e.target.value === 'igual' ? 'igual' : 'segura';
    const ok = await eqGravaCfg(); if (!ok) EQ.cfg.fds = antes;
    toast(!ok ? 'Não gravou. Tente de novo.' : EQ.cfg.fds === 'igual' ? 'No fim de semana o rodízio gira igual aos outros dias.' : 'No fim de semana o aviso chega, mas só passa adiante na segunda às 9h.'); render(); return;
  }
  if (e.target.dataset.act === 'eq-prazo') {
    const antes = EQ.cfg.prazoMin; EQ.cfg.prazoMin = +e.target.value || 10;
    const ok = await eqGravaCfg(); if (!ok) EQ.cfg.prazoMin = antes;
    toast(ok ? 'Prazo para tocar: ' + EQ.cfg.prazoMin + ' minutos.' : 'Não gravou. Tente de novo.'); render(); return;
  }
  const act = e.target.dataset.act;
  if (act !== 'ld-status' && act !== 'ld-temp') return;
  const campo = act === 'ld-temp' ? 'temperatura' : 'status';
  const id = e.target.dataset.id, status = e.target.value;
  const p = LD.lista.find(x => x.id === id); if (!p) return;
  const antes = p[campo]; p[campo] = status;
  let ok = true;
  if (REAL()) {
    const dados = Object.assign({}, p); delete dados.id; delete dados.criadoEm;
    try { const r = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ data: dados }), headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (x) { ok = false; }
  }
  if (!ok) p[campo] = antes;
  toast(!ok ? 'Não gravou. Tente de novo.' : campo === 'temperatura' ? 'Lead ' + tempNome(status).toLowerCase() + '.' : 'Status do lead: ' + (WZ_STATUS.find(s => s[0] === status) || [, status])[1] + '.');
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
  if (e.target.id === 'ac-form') {
    e.preventDefault();
    const nome = $('ac-nome').value.trim().slice(0, 40), email = acMail($('ac-mail').value), papel = $('ac-papel').value === 'dono' ? 'dono' : 'corretor';
    if (!nome) { toast('Escreva o nome.'); return; }
    if (!acOk(email)) { toast('Confira o e-mail: nome@email.com'); $('ac-mail').focus(); return; }
    if (AC.lista.some(x => x.email === email)) { toast('Esse e-mail já entra no app.'); return; }
    AC.salvando = true;
    let ok = true;
    if (REAL()) { try { await authEnsure(); const r = await supaFetch('acessos', { method: 'POST', body: JSON.stringify({ email, nome, papel }), headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (x) { ok = false; } }
    AC.salvando = false;
    if (ok) AC.lista.push({ email, nome, papel });
    toast(ok ? nome + ' pode entrar. Mande o convite: ela cria a própria senha em "Primeiro acesso".' : 'Não gravou. Tente de novo.'); render(); return;
  }
  if (e.target.id === 'primeiro-form') {
    e.preventDefault();
    const msg = $('primeiro-msg'), email = acMail($('p-mail').value), s1 = $('p-senha').value, s2 = $('p-senha2').value;
    if (!acOk(email)) { msg.textContent = 'Confira o e-mail.'; return; }
    if (s1.length < 8) { msg.textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; }
    if (s1 !== s2) { msg.textContent = 'As duas senhas não são iguais.'; return; }
    msg.textContent = 'Criando…';
    const r = await authSignUp(email, s1);
    if (!r.ok) { msg.textContent = /already|registered|exist/i.test(r.error || '') ? 'Esse e-mail já tem conta. Volte e use "Esqueci a senha" para criar uma senha nova.' : (r.error || 'Não consegui criar agora. Tente de novo.'); return; }
    if (r.logged) { S.primeiro = false; WZ.dona = null; render(); return; }
    msg.textContent = 'Pronto. Chegou um e-mail de "Ti Arts", em inglês ("Confirm your email address"): abra neste mesmo aparelho e toque em "Confirm email address". Se não chegar em 2 minutos, olhe o spam ou use "Esqueci a senha" com o mesmo e-mail.';
    return;
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
  const porta = S.senhaNova ? vSenhaNova() : (real && !logado ? (S.primeiro ? vPrimeiro() : vEntrar()) : (!real && !demoDentro() ? vEntrarDemo() : ''));
  document.body.classList.toggle('entrar', !!porta);
  if (porta) { $('meio').innerHTML = porta; $('lado').innerHTML = ''; $('barra-cel').innerHTML = ''; document.title = 'Milla · ' + MARCA + ' · entrar'; return; }
  if (real && WZ.dona === null) { confereDona(); $('meio').innerHTML = '<div class="sm" style="padding:24px">Conferindo a conta…</div>'; renderLado(); return; }
  const r = rota();
  const chave = r.tela + '/' + r.param;
  if (chave !== S.rotaAnterior) {
    S.rotaAnterior = chave; window.scrollTo(0, 0);
    if (r.tela === 'leads') ldCarregar().then(() => { if (rota().tela === 'leads') render(); });
    if (r.tela === 'inicio') inCarregar().then(() => { if (rota().tela === 'inicio') render(); });
    if (r.tela === 'equipe' && GESTOR()) Promise.all([eqCarregar(), acCarregar()]).then(() => { if (rota().tela === 'equipe') render(); });
  }
  let html;
  if (real && WZ.dona === false) html = vNaoDona();
  else if (r.tela === 'inicio') html = vInicio();
  else if (r.tela === 'leads') html = vLeads();
  else if (r.tela === 'imoveis') html = vImoveis();
  else if (r.tela === 'equipe') html = GESTOR() ? vEquipe() : vSoGestor();
  else html = vWhats(r.param);
  $('meio').innerHTML = html;
  renderLado();
  document.body.classList.toggle('tela-whats', r.tela === 'whats');
  document.body.classList.toggle('tela-inicio', r.tela === 'inicio');
  if (r.tela === 'whats' && !(real && WZ.dona === false)) wzLiga();
  document.title = 'Milla · ' + MARCA + ' · ' + ({ inicio: 'Início', whats: 'WhatsApp', leads: 'Leads', imoveis: 'Imóveis', equipe: 'Equipe' }[r.tela]);
}
window.addEventListener('hashchange', render);

/* o link do e-mail de "Esqueci a senha" volta para cá com a sessão no endereço */
(function inicio() {
  const volta = typeof authFromHash === 'function' ? authFromHash() : null;
  if (volta && volta.tipo === 'recovery') S.senhaNova = true;
  if (volta && volta.tipo === 'signup') setTimeout(() => toast('E-mail confirmado: bem-vinda ao app da Milla.'), 400);
  if (volta && volta.erro) S.entrarMsg = 'O link do e-mail não valeu (' + volta.erro + '). Peça outro em "Esqueci a senha".';
  if (!REAL()) { WZ_EXEMPLO = WZ_EXEMPLO || wzDemo(); LD.lista = WZ_EXEMPLO.ped; LD.carregou = true; }
  render();
  carregarCatalogo('2026-11-03').then(() => render());
})();

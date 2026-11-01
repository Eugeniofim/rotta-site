/* =====================================================
   AD7 IMÓVEIS — o site (entrega 1): início, busca, imóvel, área do cliente,
   negocie, financie, sobre, contato, favoritos, entrar e o painel de pedidos.
   Formato espelhado da Casa Prates (casaprates.com.br), medido em 22/10/2026:
   cabeçalho transparente sobre a foto, títulos centrados e leves, carrossel de
   3 cartões com a foto de canto arredondado, pílulas pretas, área do cliente em
   cartões com botão teal, página do imóvel com a foto inteira e a caixa de preço.
   Um app só: a gestão (entrega 2) entra como rotas de painel neste mesmo arquivo.
   ===================================================== */
'use strict';

const APP_VERSAO = '0.6.0';
const FAV_KEY = 'ad7_fav_v1', COOKIE_KEY = 'ad7_cookies_v1', VISTOS_KEY = 'ad7_vistos_v1', VITRINE_KEY = 'ad7_vitrine_v1';
const C = APP_CONFIG;
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wa = (texto, num) => 'https://wa.me/' + (num || C.whatsapp) + (texto ? '?text=' + encodeURIComponent(texto) : '');
const fone = n => { const d = String(n).replace(/\D/g, '').replace(/^55/, ''); return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7); };

/* ---------- rota ---------- */
function rota() {
  let h = location.hash.replace(/^#\/?/, '');
  /* páginas por imóvel geradas para o Google (imovel/<ref>/): sem hash, a rota vem do caminho */
  const pm = !location.hash && location.pathname.match(/\/imovel\/([^/]+)\/?$/);
  if (pm) h = 'imovel/' + decodeURIComponent(pm[1]);
  const pl = !location.hash && location.pathname.match(/\/imoveis\/(venda|aluguel|temporada)(?:\/([^/]+))?(?:\/([^/]+))?\/?$/);
  if (pl) { const q = { neg: pl[1] }; if (pl[2]) q.tipo = deslug('tipos', pl[2]); if (pl[3]) q.cidade = deslug('cidades', pl[3]); h = 'imoveis' + qs(q); }
  const [caminho, busca] = h.split('?');
  const partes = caminho.split('/').filter(Boolean);
  const query = {};
  if (busca) for (const par of busca.split('&')) { const [k, v] = par.split('='); if (k) query[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' ')); }
  return { nome: partes[0] || 'inicio', param: partes[1] || '', sub: partes[2] || '', query, caminho };
}
function qs(obj) { const p = Object.entries(obj).filter(([, v]) => v !== '' && v != null && v !== false).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)); return p.length ? '?' + p.join('&') : ''; }
function navegar(h) { location.hash = h; }
function slug(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function deslug(chave, sl) { const o = opcoes({}); return (o[chave] || []).find(v => slug(v) === sl) || sl; }
/* últimos imóveis vistos neste aparelho (como no site antigo) */
function vistos() { try { return JSON.parse(localStorage.getItem(VISTOS_KEY)) || []; } catch (e) { return []; } }
function vistoAgora(ref) { const l = vistos().filter(r => r !== ref); l.unshift(ref); try { localStorage.setItem(VISTOS_KEY, JSON.stringify(l.slice(0, 8))); } catch (e) {} }
/* a vitrine da home (listas escolhidas pela AD7 no painel): no banco (itens/vitrine/home), senão neste aparelho, senão o config */
async function vitrineCarregar() {
  let v = null;
  if (typeof temNuvem === 'function' && temNuvem()) { try { const r = await supaFetch('itens?colecao=eq.vitrine&id=eq.home&apagado=eq.false&select=dados'); if (r.ok) { const l = await r.json(); if (l[0]) v = l[0].dados; } } catch (e) {} }
  if (!v) { try { v = JSON.parse(localStorage.getItem(VITRINE_KEY)); } catch (e) {} }
  vitrineSet(v || C.vitrine || {});
}
async function vitrineGravar(v) {
  vitrineSet(v); let nuvem = false;
  if (typeof temNuvem === 'function' && temNuvem() && typeof isLoggedIn === 'function' && isLoggedIn()) {
    try { const r = await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify({ colecao: 'vitrine', id: 'home', dados: Object.assign({ atualizadoEm: new Date().toISOString() }, v), apagado: false }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }); nuvem = r.ok; } catch (e) {}
  }
  if (!nuvem) try { localStorage.setItem(VITRINE_KEY, JSON.stringify(v)); } catch (e) {}
  return nuvem;
}
function youtubeId(u) { const m = String(u || '').match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(String(u || '')) ? u : ''); }
function videoHtml(id, titulo, cls) { return id ? '<button type="button" class="video ' + (cls || '') + '" data-act="video" data-id="' + esc(id) + '" style="background-image:url(https://i.ytimg.com/vi/' + esc(id) + '/hqdefault.jpg)" aria-label="Assistir: ' + esc(titulo || 'vídeo') + '"></button>' : ''; }
const MEL = '<label class="oculto" aria-hidden="true">Não preencha <input name="site" tabindex="-1" autocomplete="off"></label>';
const linkBusca = f => '#/imoveis' + qs(f);

/* ---------- favoritos / cookies ---------- */
function favs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
function favToggle(ref) { const l = favs(); const i = l.indexOf(ref); if (i >= 0) l.splice(i, 1); else l.push(ref); try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch (e) {} return i < 0; }
function cookiesDecidido() { try { return !!localStorage.getItem(COOKIE_KEY); } catch (e) { return true; } }

/* ---------- pedaços ---------- */
const ICO = {
  cama: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/></svg>',
  suite: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5M4 18h16M7 11V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M12 2v2"/></svg>',
  banho: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12V6a2 2 0 0 1 4 0M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2z"/></svg>',
  carro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14l-1.5-5H6.5L5 17zM7 17v2M17 17v2M8 12l1-3h6l1 3"/></svg>',
  area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v18H3zM3 9h6M9 3v6"/></svg>',
  terreno: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M4 20l4-9 4 6 3-4 5 7"/></svg>',
  casa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/></svg>',
  pessoa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
  foto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l2-2h6l2 2h3v12H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
  cod: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM8 10v4M12 10v4M16 10v4"/></svg>',
  sofa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 12h18v5H3zM5 17v2M19 17v2"/></svg>',
  coracao: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  coracaoCheio: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  wa: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19.1L4 20z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.3-1.3 2 .9-.3 1.8c-3.6.6-8.8-4.6-8.2-8.2l1.8-.3.9 2L9 9.5z"/></svg>',
  insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  face: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>',
};
const EMBLEMA = '<img class="ico" src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt="">';

function tituloGenerico(im) { return im.tipo + ' ' + TRANS_VERBO[im.transacao] + ' em ' + im.cidade + ' no ' + im.bairro; }
function linhaExtra(im) {
  const t = String(im.titulo || '').trim();
  const generico = new RegExp('^' + im.tipo + '\\s+em\\s', 'i').test(t) || !t;
  const s = (im.selo || '').trim();
  const selo = s.length > 3 && s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s;
  return generico ? [selo, im.situacao].filter(Boolean)[0] || '' : t;
}
function totalAluguel(im) { return im.transacao === 'aluguel' && (im.condominio || im.iptu) ? im.preco + (im.condominio || 0) + (im.iptu || 0) / 12 : null; }
function metaCard(im) {
  const p = [];
  if (im.dorm) p.push(ICO.cama + im.dorm);
  if (im.suites) p.push(ICO.suite + im.suites);
  if (im.banheiros) p.push(ICO.banho + im.banheiros);
  if (im.vagas) p.push(ICO.carro + im.vagas);
  if (im.areaConstruida) p.push(ICO.area + fmtArea(im.areaConstruida));
  else if (im.areaTotal) p.push(ICO.terreno + fmtArea(im.areaTotal));
  return '<div class="meta">' + p.map(x => '<span>' + x + '</span>').join('') + '</div>';
}
function cardImovel(im) {
  const f = favs().includes(im.ref), total = totalAluguel(im);
  return '<a class="card" href="#/imovel/' + esc(im.ref) + '">'
    + '<div class="foto"><img src="' + esc(im.capa) + '" alt="" loading="lazy"><span class="chip-neg">' + TRANS[im.transacao] + '</span></div>'
    + '<button type="button" class="fav' + (f ? ' on' : '') + '" data-act="fav" data-ref="' + esc(im.ref) + '" aria-label="' + (f ? 'Tirar dos favoritos' : 'Salvar nos favoritos') + '" aria-pressed="' + f + '">' + (f ? ICO.coracaoCheio : ICO.coracao) + '</button>'
    + '<div class="corpo"><span class="neg">' + TRANS[im.transacao] + (im.transacao === 'temporada' ? ' · a partir de' : '') + '</span><div class="preco">' + esc(rotuloPreco(im)) + '</div>'
    + (total ? '<div class="total">Total: ' + esc(fmtPreco(total)) + '</div>' : '')
    + '<div class="titulo">' + esc(tituloGenerico(im)) + '</div><div class="cond">' + esc(linhaExtra(im)) + '</div>'
    + metaCard(im) + '<div class="cod"><small>CÓD. IMÓVEL</small><b>' + esc(im.ref) + '</b></div></div></a>';
}
function grade(lista, cls) { return lista.length ? '<div class="grid ' + (cls || '') + '">' + lista.map(cardImovel).join('') + '</div>' : '<div class="vazio">Nenhum imóvel aqui por enquanto.</div>'; }
function carrossel(id, lista) {
  if (!lista.length) return '<div class="vazio">Nenhum imóvel aqui por enquanto.</div>';
  return '<div class="faixa-cards"><button type="button" class="seta esq" data-act="seta" data-alvo="' + id + '" data-dir="-1" aria-label="Anteriores">‹</button><div class="carrossel" id="' + id + '">' + lista.map(cardImovel).join('') + '</div><button type="button" class="seta dir" data-act="seta" data-alvo="' + id + '" data-dir="1" aria-label="Próximos">›</button></div>';
}
function opts(lista, atual, vazio) { return '<option value="">' + esc(vazio) + '</option>' + lista.map(v => '<option value="' + esc(v) + '"' + (v === atual ? ' selected' : '') + '>' + esc(v) + '</option>').join(''); }
function secao(titulo, sub, corpo, mais, maisRotulo) {
  return '<section class="sec"><div class="wrap">' + EMBLEMA + '<h2>' + esc(titulo) + '</h2><p class="sub">' + esc(sub) + '</p>' + corpo + (mais ? '<div class="centro"><a class="btn btn-navy" href="' + mais + '">' + esc(maisRotulo || 'VEJA MAIS IMÓVEIS') + '</a></div>' : '') + '</div></section>';
}

/* ---------- INÍCIO ---------- */
function vInicio() {
  const o = opcoes({});
  const temporada = destaques({ neg: 'temporada' }, 6), casas = destaques({ neg: 'venda', tipo: 'Casa' }, 6);
  const outros = filtrar({ neg: 'venda' }).filter(im => im.tipo !== 'Casa').slice(0, 6);
  const r = resumoCatalogo();
  const estilos = [['Frente ao mar', { mar: '1' }], ['Casa de família', { dorm: '3', neg: 'venda' }], ['Temporada', { neg: 'temporada' }], ['Com piscina', { piscina: '1' }], ['Mobiliados', { mobiliado: '1' }], ['Comercial', { perfil: 'Comercial' }], ['Terrenos para construir', { tipo: 'Terreno' }], ['Sobrados', { tipo: 'Sobrado' }]];
  const ladrilhos = estilos.map(([nome, f]) => { const im = filtrar(f)[0]; return '<a class="ladrilho" href="' + linkBusca(f) + '" style="background-image:url(' + esc(im ? im.capa : 'arte/capa-1400.jpg') + ')"><span>' + esc(nome) + '</span></a>'; }).join('');
  const porTipo = ['Casa', 'Apartamento', 'Sobrado', 'Terreno'].map(t => '<a href="' + linkBusca({ neg: 'venda', tipo: t }) + '">' + t + (t === 'Terreno' ? 's' : 's') + ' à venda em Pontal do Paraná</a>').join('');
  const porBairro = r.bairros.slice(0, 7).map(b => '<a href="' + linkBusca({ bairro: b }) + '">Imóveis em ' + esc(b) + '</a>').join('');
  const porTemporada = ['Casa', 'Apartamento', 'Sobrado'].map(t => '<a href="' + linkBusca({ neg: 'temporada', tipo: t }) + '">' + t + ' para temporada no litoral</a>').join('') + '<a href="' + linkBusca({ neg: 'temporada', mar: '1' }) + '">Temporada frente ao mar</a>';
  const oport = vitrineLista('oportunidade'), slide = vitrineLista('slide'), vistosL = vistos().map(porRef).filter(Boolean).slice(0, 3);
  const videos = (C.videos || []).map(v => videoHtml(youtubeId(v.url || v), v.titulo || 'Vídeo da AD7')).join('');
  return '<section class="hero" aria-label="Busca de imóveis"><div>'
    + '<h1>A sua imobiliária no litoral do Paraná</h1>'
    + '<p>Na AD7 você tem a melhor e mais completa experiência imobiliária em Pontal do Paraná: compra, venda, aluguel e temporada.</p>'
    + '<form class="busca" data-form="busca" aria-label="Buscar imóvel">'
    + '<label class="oculto" for="b-neg">Negócio</label><select id="b-neg" name="neg"><option value="">Alugar ou Comprar?</option><option value="venda">Quero Comprar</option><option value="aluguel">Quero Alugar</option><option value="temporada">Temporada</option></select>'
    + '<label class="oculto" for="b-tipo">Tipo</label><select id="b-tipo" name="tipo">' + opts(o.tipos, '', 'Qual Tipo?') + '</select>'
    + '<label class="oculto" for="b-cidade">Cidade</label><select id="b-cidade" name="cidade">' + opts(o.cidades, '', 'Qual Cidade?') + '</select>'
    + '<label class="oculto" for="b-bairro">Bairro</label><select id="b-bairro" name="bairro">' + opts(o.bairros, '', 'Qual Bairro?') + '</select>'
    + '<a class="mais" href="#/imoveis?abrir=1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/></svg>Mais filtros</a>'
    + '<button type="submit" class="btn btn-navy">BUSCAR</button></form>'
    + '<div class="links"><a href="#/imoveis?foco=ref">Busca por Código</a><a href="#/" data-act="rolar" data-alvo="estilo">Busca por Estilo de Vida</a></div>'
    + '</div></section>'
    + (oport.length ? secao('Ótima oportunidade', 'Os imóveis que a AD7 separou esta semana: preço bom, documentação em dia, pronto para fechar.', carrossel('c-oport', oport), '#/imoveis?neg=venda') : '')
    + (slide.length ? secao('Destaques da AD7', 'Escolhidos a dedo pela equipe.', carrossel('c-slide', slide), '#/imoveis') : '')
    + secao('Temporada no litoral do Paraná', 'Casas e apartamentos mobiliados a passos da praia, em Pontal do Sul e região, com calendário de datas disponíveis. Reserve o fim de ano antes que acabe.', carrossel('c-temporada', temporada), linkBusca({ neg: 'temporada' }))
    + secao('Casas à Venda em Pontal do Paraná', 'Da casa de praia simples ao sobrado em condomínio: imóveis escriturados, com a documentação conferida pela AD7 antes de anunciar.', carrossel('c-casas', casas), linkBusca({ neg: 'venda', tipo: 'Casa' }))
    + secao('Apartamentos, Sobrados e Terrenos', 'No Centro de Pontal, frente ao mar ou em Curitiba: prontos para morar, lançamentos e lotes para construir a casa que você quer.', carrossel('c-outros', outros), linkBusca({ neg: 'venda' }))
    + '<section class="sec" id="estilo"><div class="wrap">' + EMBLEMA + '<h2>Estilo de Vida: imóveis que refletem a sua essência</h2><p class="sub">Comece pelo jeito que você quer viver no litoral, não pelo tipo de imóvel.</p><div class="ladrilhos">' + ladrilhos + '</div><div class="centro"><a class="btn btn-navy" href="#/imoveis">CONFIRA MAIS</a></div></div></section>'
    + '<section class="sobre-faixa" id="sobre"><div class="wrap"><img src="arte/sobre.jpg" alt="Sobrado anunciado pela AD7 em Pontal do Sul" loading="lazy"><div><h3>AD7 Imóveis · Pontal do Paraná/PR</h3><h2>Cuidamos de tudo com você!</h2>'
    + '<p>Na AD7, em Pontal do Paraná, oferecemos uma experiência personalizada na compra, venda, aluguel e temporada de imóveis no litoral.</p>'
    + '<p>Especializados na assessoria completa, garantimos uma transação segura e tranquila, com acompanhamento jurídico e operacional de qualidade, do primeiro contato à entrega das chaves.</p>'
    + '<p>Venha realizar o sonho de morar ou veranear bem com a AD7, a sua imobiliária no litoral!</p>'
    + '<div class="acoes"><a class="btn btn-branco" href="#/sobre">CONHEÇA NOSSA IMOBILIÁRIA</a></div></div></div></section>'
    + '<section class="sec"><div class="wrap">' + EMBLEMA + '<h2>Área do Cliente</h2><p class="sub">Proprietários e inquilinos da AD7 resolvem o dia a dia sem ligar: extrato, boleto, chamado de manutenção e aviso de desocupação.</p><div class="grid grid-2">'
    + '<a class="card-linha" href="#/cliente"><span class="ico">' + ICO.casa + '</span><span><b>Sou proprietário</b><span>Extrato de contas, repasses, informe de rendimentos, vistorias.</span></span></a>'
    + '<a class="card-linha" href="#/cliente"><span class="ico">' + ICO.pessoa + '</span><span><b>Sou inquilino</b><span>2ª via do boleto, contrato, chamado de manutenção, aviso de desocupação.</span></span></a>'
    + '</div></div></section>'
    + faixaParceiros()
    + (videos ? '<section class="sec"><div class="wrap">' + EMBLEMA + '<h2>Conheça os imóveis em vídeo</h2><p class="sub">Tours gravados pela AD7. O vídeo só carrega quando você toca.</p><div class="videos">' + videos + '</div></div></section>' : '')
    + (vistosL.length ? '<section class="sec vistos"><div class="wrap">' + EMBLEMA + '<h2>Você viu recentemente</h2><p class="sub">Os últimos imóveis que você abriu neste aparelho.</p>' + grade(vistosL) + '</div></section>' : '')
    + '<section class="buscas"><div class="wrap"><div><h3>Buscas por Tipos de Imóveis</h3>' + porTipo + '</div><div><h3>Buscas por Bairros</h3>' + porBairro + '</div><div><h3>Buscas por Temporada</h3>' + porTemporada + '</div></div></section>';
}

/* ---------- BUSCA ---------- */
function vBusca(q) {
  const f = { neg: q.neg || '', tipo: q.tipo || '', cidade: q.cidade || '', bairro: q.bairro || '', q: q.q || '', min: q.min || '', max: q.max || '', dorm: q.dorm || '', suites: q.suites || '', banheiros: q.banheiros || '', vagas: q.vagas || '', areaMin: q.areaMin || '', areaMax: q.areaMax || '', mar: q.mar || '', piscina: q.piscina || '', mobiliado: q.mobiliado || '', financiavel: q.financiavel || '', perfil: q.perfil || '', ordem: q.ordem || 'recentes' };
  const o = opcoes(f), lista = filtrar(f);
  const pag = Math.max(1, parseInt(q.pag, 10) || 1), POR_PAG = 24, mostra = lista.slice(0, POR_PAG * pag);
  const titulo = lista.length + ' ' + (f.tipo ? f.tipo + (lista.length === 1 ? '' : 's') : (lista.length === 1 ? 'Imóvel' : 'Imóveis')) + (f.neg ? ' ' + TRANS_VERBO[f.neg] : '') + (f.bairro ? ' em ' + f.bairro : f.cidade ? ' em ' + f.cidade : ' no litoral do Paraná');
  TITULO_BUSCA = titulo;
  const aba = (v, rot) => '<label><input type="radio" name="neg" value="' + v + '"' + (f.neg === v ? ' checked' : '') + '><span>' + rot + '</span></label>';
  const pil = (nome, atual) => '<div class="pilulas">' + ['', '1', '2', '3', '4'].map(v => '<label><input type="radio" name="' + nome + '" value="' + v + '"' + (atual === v ? ' checked' : '') + '>' + (v ? v + (v === '4' ? '+' : '') : 'Todos') + '</label>').join('') + '</div>';
  const marca = (nome, rot, on) => '<label class="marca"><input type="checkbox" name="' + nome + '"' + (on ? ' checked' : '') + '> ' + rot + '</label>';
  return '<div class="wrap lista">'
    + '<form class="filtros' + (q.abrir ? '' : ' fechado') + '" id="filtros" data-form="filtros">'
    + '<div class="abas">' + aba('venda', 'Comprar') + aba('aluguel', 'Alugar') + aba('temporada', 'Temporada') + '</div>'
    + '<label class="campo">Buscar por código ou palavra <input type="search" name="q" value="' + esc(f.q) + '" placeholder="ex.: 406, piscina, Atami…" autocomplete="off"></label>'
    + '<label class="campo">Tipo de Imóvel <select name="tipo">' + opts(o.tipos, f.tipo, 'Todos') + '</select></label>'
    + '<label class="campo">Cidade <select name="cidade">' + opts(o.cidades, f.cidade, 'Todas') + '</select></label>'
    + '<label class="campo">Bairro <select name="bairro">' + opts(o.bairros, f.bairro, 'Selecione o Bairro') + '</select></label>'
    + '<div class="grupo">Dependências</div><div class="campo" role="group" aria-label="Quartos"><span style="font-size:13px;color:var(--suave)">Quartos</span>' + pil('dorm', f.dorm) + '</div><div class="campo" role="group" aria-label="Suítes"><span style="font-size:13px;color:var(--suave)">Suítes</span>' + pil('suites', f.suites) + '</div><div class="campo" role="group" aria-label="Banheiros"><span style="font-size:13px;color:var(--suave)">Banheiros</span>' + pil('banheiros', f.banheiros) + '</div><div class="campo" role="group" aria-label="Vagas"><span style="font-size:13px;color:var(--suave)">Vagas</span>' + pil('vagas', f.vagas) + '</div>'
    + '<div class="grupo">Área</div><div class="duas" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="campo">m² mínimo <input type="number" name="areaMin" inputmode="numeric" value="' + esc(f.areaMin) + '" placeholder="ex.: 80"></label><label class="campo">m² máximo <input type="number" name="areaMax" inputmode="numeric" value="' + esc(f.areaMax) + '" placeholder="ex.: 300"></label></div>'
    + '<div class="grupo">Valores</div><div class="duas" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="campo">R$ Mínimo <input type="number" name="min" inputmode="numeric" value="' + esc(f.min) + '" placeholder="ex.: 200000"></label><label class="campo">R$ Máximo <input type="number" name="max" inputmode="numeric" value="' + esc(f.max) + '" placeholder="ex.: 800000"></label></div>'
    + '<div class="grupo">Características</div>' + marca('mar', 'Próximo ao mar', f.mar) + marca('piscina', 'Com piscina', f.piscina) + marca('mobiliado', 'Mobiliado', f.mobiliado) + (f.neg !== 'temporada' && f.neg !== 'aluguel' ? marca('financiavel', 'Aceita financiamento', f.financiavel) : '')
    + '<div class="acoes"><a href="#/imoveis?abrir=1" class="btn btn-line">LIMPAR</a><button type="submit" class="btn btn-navy">BUSCAR</button></div></form>'
    + '<div class="resultados"><h1>' + esc(titulo) + '</h1><nav class="caminho" aria-label="Caminho"><a href="#/">Home</a> › ' + (f.neg ? '<a href="' + linkBusca({ neg: f.neg }) + '">' + TRANS[f.neg] + '</a> › ' : '') + esc(f.tipo || 'Imóveis') + (f.bairro ? ' em ' + esc(f.bairro) : '') + '</nav>'
    + '<div class="encontrados"><span>Encontramos ' + lista.length + ' ' + (lista.length === 1 ? 'imóvel' : 'imóveis') + ' com seus critérios de busca</span><div style="display:flex;gap:8px;align-items:center"><button type="button" class="btn btn-line btn-p abrir-filtros" data-act="filtros">Filtros</button><label class="oculto" for="ordem">Ordenar</label><select id="ordem" data-act="ordem"><option value="recentes"' + (f.ordem === 'recentes' ? ' selected' : '') + '>Ordenar</option><option value="menor"' + (f.ordem === 'menor' ? ' selected' : '') + '>Menor Preço</option><option value="maior"' + (f.ordem === 'maior' ? ' selected' : '') + '>Maior Preço</option></select></div></div>'
    + grade(mostra, 'grid-2') + (mostra.length < lista.length ? '<div class="centro"><a class="btn btn-navy" href="' + linkBusca({ ...f, ordem: f.ordem === 'recentes' ? '' : f.ordem, pag: pag + 1 }) + '">MOSTRAR MAIS IMÓVEIS (' + (lista.length - mostra.length) + ')</a></div>' : '') + '</div></div>';
}

/* ---------- IMÓVEL ---------- */
let LB = { fotos: [], i: 0 };
let TITULO_BUSCA = '';
function calendario(im) {
  return '<section id="cal-dispo">' + dispoVisitanteHtml(im, { wa: t => wa(t, C.whatsappAdriana) }) + '<p style="color:var(--suave);font-size:13px;margin:14px 0 0">A reserva é confirmada pela AD7 no WhatsApp. Fim de ano e feriados: consulte o valor.</p></section>';
}
function vImovel(ref) {
  const im = porRef(ref);
  if (!im) return '<div class="wrap pagina"><h1>Imóvel não encontrado</h1><p class="intro">A referência ' + esc(ref) + ' não está no site. <a href="#/imoveis">Ver todos os imóveis</a></p></div>';
  LB = { fotos: im.fotos, i: 0 };
  const fav = favs().includes(im.ref);
  const endereco = (im.endereco.mostrarExato && im.endereco.rua ? im.endereco.rua + (im.endereco.numero ? ', ' + im.endereco.numero : '') + ' - ' : (im.endereco.rua ? im.endereco.rua + ' - ' : '')) + im.bairro + ' - ' + im.cidade + '/' + im.uf;
  const num = [[ICO.cod, im.ref, 'Código']];
  if (im.dorm) num.push([ICO.cama, im.dorm, im.dorm > 1 ? 'Quartos' : 'Quarto']);
  if (im.suites) num.push([ICO.suite, im.suites, im.suites > 1 ? 'Suítes' : 'Suíte']);
  if (im.banheiros) num.push([ICO.banho, im.banheiros, im.banheiros > 1 ? 'Banheiros' : 'Banheiro']);
  if (im.vagas) num.push([ICO.carro, im.vagas, im.vagas > 1 ? 'Vagas' : 'Vaga']);
  if (im.areaTotal) num.push([ICO.terreno, fmtArea(im.areaTotal), 'Totais']);
  if (im.areaConstruida) num.push([ICO.area, fmtArea(im.areaConstruida), 'Construídos']);
  if (im.transacao === 'temporada' && im.maxPessoas) num.push([ICO.pessoa, im.maxPessoas, 'Hóspedes']);
  num.push([ICO.foto, im.fotos.length, 'Fotos']);
  if (/mobiliado/i.test(im.mobiliado || '')) num.push([ICO.sofa, '', 'Mobiliado']);
  const custos = [];
  if (im.condominio) custos.push(['+ Condomínio*', fmtPreco(im.condominio)]);
  if (im.iptu) custos.push(['+ IPTU* (ano)', fmtPreco(im.iptu)]);
  const total = totalAluguel(im);
  const msgWa = 'Olá! Tenho interesse no imóvel Ref. ' + im.ref + ' (' + im.titulo + '). Pode me passar mais informações?';
  const mapa = im.lat && im.lng && im.mostrarMapa ? '<div class="mapa" id="mapa-im"><span>' + esc(im.endereco.mostrarExato ? 'Endereço exato no mapa.' : 'A localização exata é informada na visita.') + '</span><button type="button" class="btn btn-line btn-p" data-act="mapa-im" data-lat="' + esc(im.lat) + '" data-lng="' + esc(im.lng) + '">Mostrar o mapa</button><a class="btn btn-line btn-p" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + esc(im.lat) + ',' + esc(im.lng) + '">Abrir no Google Maps</a></div>' : '';
  const vid = youtubeId(im.video);
  const medidas = [im.frente ? 'frente ' + fmtArea(im.frente).replace(' m²', ' m') : '', im.fundo ? 'fundo ' + fmtArea(im.fundo).replace(' m²', ' m') : ''].filter(Boolean).join(' · ');
  const lista = (t, l) => l && l.length ? '<details open><summary>' + EMBLEMA_P + t + '</summary><ul class="pontos">' + l.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></details>' : '';
  const ficha = [['Perfil', im.perfil + (im.transacao === 'temporada' ? ' · temporada' : '')], ['Situação', [im.situacao, im.mobiliado].filter(Boolean).join(', ')], ['Próximo ao mar', im.proximoMar >= 3 ? 'Sim' : im.proximoMar === 2 ? 'Médio' : 'Não informado'], ['Escriturado', im.escriturado ? 'Sim' : 'Não informado'], ['Averbado', im.averbado ? 'Sim' : 'Não informado'], ['Aceita financiamento', im.financiavel ? 'Sim' : 'Consulte'], ['Aceita permuta', im.aceitaPermuta ? 'Sim' : 'Não']];
  if (im.posicaoSolar) ficha.push(['Posição solar', im.posicaoSolar]);
  if (im.terreno && !/^\d+$/.test(String(im.terreno))) ficha.push(['Terreno', im.terreno]);   /* o Tecimob manda um código numérico; só mostra se vier o nome */
  if (medidas) ficha.push(['Medidas do terreno', medidas]);
  if (im.condominioNome) ficha.push(['Condomínio', im.condominioNome]);
  if (im.iptuIsento) ficha.push(['IPTU', 'Isento']);
  if ((im.garantias || []).length && im.transacao !== 'venda') ficha.push(['Garantia', im.garantias.join(', ')]);
  return '<section class="im-heroi" style="background-image:url(' + esc(im.capa) + ')"><div class="wrap"><div><nav class="caminho" aria-label="Caminho" style="color:#C9D1D6;margin-bottom:10px"><a href="#/" style="color:#fff">Início</a> › <a href="' + linkBusca({ neg: im.transacao }) + '" style="color:#fff">' + TRANS[im.transacao] + '</a> › <a href="' + linkBusca({ cidade: im.cidade, bairro: im.bairro }) + '" style="color:#fff">' + esc(im.bairro) + '</a></nav><h1>' + esc(tituloGenerico(im)) + '</h1><div class="end">' + esc(endereco) + '</div></div><button type="button" class="fotos" data-act="lb" data-i="0">' + ICO.foto.replace('viewBox', 'width="18" height="18" style="stroke:#fff;fill:none;stroke-width:1.6" viewBox') + 'Ver as ' + im.fotos.length + ' fotos</button></div></section>'
    + '<section class="im-numeros"><div class="wrap">' + num.map(([i, v, r]) => '<div>' + i + '<div>' + (v !== '' ? '<b>' + esc(v) + '</b><br>' : '') + '<span>' + esc(r) + '</span></div></div>').join('') + '</div></section>'
    + '<div class="wrap im-corpo"><div class="im-main">'
    + (im.fotos.length > 1 ? '<div class="mosaico">' + im.fotos.slice(1, 4).map((f, i) => '<button type="button" data-act="lb" data-i="' + (i + 1) + '" aria-label="Abrir foto ' + (i + 2) + '"><img src="' + esc(f) + '" alt="Foto ' + (i + 2) + ' de ' + im.fotos.length + '" loading="lazy"></button>').join('') + '</div>' : '')
    + '<div><h2>' + esc(im.titulo) + '</h2><p class="cond">' + esc([im.selo, im.situacao, im.mobiliado].filter(Boolean).join(' · ')) + '</p>'
    + (im.descricao.length ? '<div class="descricao">' + im.descricao.map(p => '<p>' + esc(p) + '</p>').join('') + '</div>' : '') + '</div>'
    + (im.comodos.length ? '<ul class="lista-inline">' + im.comodos.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')
    + '<div>' + lista('O que tem no imóvel', im.caracteristicas) + lista(im.condominioNome ? 'O condomínio ' + im.condominioNome : 'O condomínio', im.caracCondominio) + lista('Proximidades', im.proximidades) + '<details><summary>' + EMBLEMA_P + 'Ficha do imóvel</summary><ul class="pontos">' + ficha.map(([k, v]) => '<li>' + esc(k) + ': ' + esc(v) + '</li>').join('') + '</ul></details></div>'
    + (im.transacao === 'temporada' ? calendario(im) : '')
    + (vid ? '<div><h2 class="end">Vídeo</h2>' + videoHtml(vid, tituloGenerico(im), 'video-im') + '</div>' : '')
    + '<div class="fotos-imprimir">' + im.fotos.slice(0, 9).map((f, i) => '<img src="' + esc(f) + '" alt="Foto ' + (i + 1) + '" loading="lazy">').join('') + '</div>'
    + '<div><h2 class="end">Endereço</h2><p style="margin:0 0 12px">' + esc(endereco) + '</p>' + mapa + '</div>'
    + '</div><aside class="im-lado">'
    + '<div class="caixa-preco"><h2>' + TRANS[im.transacao] + '</h2>' + (im.precoAnterior && im.precoAnterior > (im.preco || 0) ? '<span class="preco-antes">de ' + esc(fmtPreco(im.precoAnterior)) + '</span>' : '') + '<div class="valor">' + esc(rotuloPreco(im)) + (im.transacao === 'temporada' ? ' <small style="font-weight:400;color:#C9D1D6">a partir de</small>' : '') + '</div>'
    + (custos.length ? '<div class="custos"><div><span>Custos Adicionais</span></div>' + custos.map(([k, v]) => '<div><span>' + esc(k) + '</span><span>' + esc(v) + '</span></div>').join('') + (total ? '<div class="tot"><span>Valor Total Estimado*</span><span>' + esc(fmtPreco(total)) + '</span></div>' : '') + '</div><div class="nota">*Valores aproximados, sujeitos a confirmação.</div>' : (im.transacao === 'temporada' ? '<div class="nota">Valor por período; fim de ano e feriados sob consulta.</div>' : im.transacao === 'aluguel' ? '<div class="nota">Garantia: só seguro fiança (Fiança Aluguel Loft), sem fiador e sem caução.</div>' : ''))
    + '<a class="btn btn-gold btn-quad" target="_blank" rel="noopener" href="' + wa(msgWa, C.whatsappAdriana) + '">' + ICO.wa.replace('viewBox', 'width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:1.8" viewBox') + 'Fale pelo WhatsApp</a>'
    + '<div class="acoes-im"><button type="button" class="btn btn-ghost btn-p" data-act="fav" data-ref="' + esc(im.ref) + '" aria-pressed="' + fav + '">' + (fav ? '♥ Salvo' : '♡ Favoritar') + '</button><a class="btn btn-ghost btn-p" target="_blank" rel="noopener" href="' + wa('Olha este imóvel da AD7: ' + tituloGenerico(im) + ' (Ref. ' + im.ref + ') ' + location.href, '') + '">Compartilhar</a>'
    + '<a class="btn btn-ghost btn-p" href="#/imovel/' + esc(im.ref) + '/visita">Agendar visita</a><button type="button" class="btn btn-ghost btn-p" data-act="imprimir">Imprimir ficha</button></div></div>'
    + '<form class="caixa f" data-form="pedido" data-tipo="interesse" data-ref="' + esc(im.ref) + '" id="form-interesse"><h3>Entre em contato</h3>'
    + '<label>Nome <input name="nome" autocomplete="name" required></label><label>Email <input name="email" type="email" autocomplete="email" spellcheck="false" autocapitalize="none"></label><label>Telefone ou WhatsApp <input name="telefone" type="tel" autocomplete="tel" placeholder="ex.: (41) 99999-9999" required></label>'
    + '<label>Sua mensagem <textarea name="mensagem">Olá! Tenho interesse no imóvel código ' + esc(im.ref) + '. Gostaria de mais informações e de agendar uma visita.</textarea></label>' + MEL
    + '<label class="aceite"><input type="checkbox" name="aceite"> Autorizo a AD7 a usar estes dados só para responder a este pedido. <a href="privacidade.html">Política de privacidade</a></label>'
    + '<div class="aviso erro" hidden data-aviso></div><button type="submit" class="btn btn-navy btn-quad" style="text-transform:uppercase;font-size:14px">ENVIAR</button>'
    + '<div class="corretora"><img src="arte/adriana.jpg" alt=""><span><b>' + esc(C.dona) + ' · ' + esc(C.nome) + '</b><span style="color:var(--suave)">' + esc(C.creci) + ' · ' + fone(C.whatsappAdriana) + '</span></span></div></form>'
    + '</aside></div>'
    + '<div class="wrap chame"><a class="btn btn-navy btn-quad" style="font-size:18px;min-height:52px;padding:0 48px" target="_blank" rel="noopener" href="' + wa(msgWa, C.whatsappAdriana) + '">Chame no WhatsApp</a></div>'
    + secao('Imóveis parecidos', 'Outras opções ' + TRANS_VERBO[im.transacao] + ' perto deste.', grade(parecidos(im, 3)), linkBusca({ neg: im.transacao, tipo: im.tipo }));
}
const EMBLEMA_P = '<img src="arte/emblema.png" alt="" style="height:22px;width:auto">';

/* ---------- ÁREA DO CLIENTE ---------- */
const SERVICOS = {
  inquilino: [
    { id: 'boleto', t: '2ª Via de Boletos', p: 'O boleto do aluguel chega todo mês no e-mail do titular do contrato. Precisa de novo? Informe o CPF do titular e a AD7 manda a 2ª via no WhatsApp.', b: 'Pedir 2ª Via de Boletos', foto: 'arte/s-boleto.jpg' },
    { id: 'reembolso', t: 'Reembolso de Taxas', p: 'Pagou fundo de reserva ou outra taxa extraordinária do condomínio? Informe o valor e o mês: o reembolso volta no seu próximo boleto de aluguel.', b: 'Solicitar Reembolso', foto: 'arte/s-reembolso.jpg' },
    { id: 'chamado', t: 'Chamados de Manutenção', p: 'Registre o problema do imóvel. A AD7 pede o orçamento, combina com o proprietário e agenda a visita do prestador com você.', b: 'Abrir Chamado', foto: 'arte/s-chamado.jpg' },
    { id: 'desocupacao', t: 'Aviso de Desocupação', p: 'Vai sair do imóvel? Formalize o aviso e receba o passo a passo da vistoria de saída e do acerto final.', b: 'Quero Desocupar', foto: 'arte/s-desocupacao.jpg' },
  ],
  proprietario: [
    { id: 'extrato', t: 'Extrato de Contas', p: 'Todo mês você recebe o extrato por e-mail: aluguel recebido, taxa de administração, descontos e o repasse líquido. Peça aqui uma via a qualquer hora.', b: 'Acessar Extrato', foto: 'arte/s-extrato.jpg' },
    { id: 'informe', t: 'Informe de Rendimentos', p: 'O informe anual para a declaração do Imposto de Renda, com os valores separados por imóvel.', b: 'Pedir Informe', foto: 'arte/s-informe.jpg' },
    { id: 'vistoria', t: 'Vistorias e Fotos', p: 'Vistoria de entrada e de saída com fotos datadas e laudo. Peça a sua, ou saiba como está um chamado do inquilino.', b: 'Pedir Vistoria', foto: 'arte/s-vistoria.jpg' },
  ],
};
function cardServico(s, grupo) {
  return '<article class="card-serv"><div class="foto"><img src="' + s.foto + '" alt="" loading="lazy"><span class="chip">' + grupo + '</span></div><h3>' + esc(s.t) + '</h3><p>→ ' + esc(s.p) + '</p><a class="btn btn-teal" href="#/cliente/' + s.id + '">' + esc(s.b) + '</a></article>';
}
function vCliente() {
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Área do Cliente</h1><p>Tudo o que proprietários e inquilinos da AD7 precisam, sem precisar ligar. Escolha o serviço e identifique-se pelo CPF do titular do contrato.</p></section>'
    + '<div class="wrap pagina" style="gap:44px">'
    + '<section><h2 style="margin:0 0 6px;font-size:28px;font-weight:400">Inquilinos</h2><div class="grid">' + SERVICOS.inquilino.map(s => cardServico(s, 'Inquilinos')).join('') + '</div></section>'
    + '<section><h2 style="margin:0 0 6px;font-size:28px;font-weight:400">Proprietários</h2><div class="grid">' + SERVICOS.proprietario.map(s => cardServico(s, 'Proprietários')).join('') + '</div></section>'
    + '<section class="grid grid-2">'
    + '<div class="bloco soft"><span class="rotulo teal">Seus dados · LGPD</span><h3>Você manda nos seus dados</h3><p>A AD7 guarda só o que o contrato e a lei exigem. Você pode pedir uma cópia, corrigir um dado ou pedir a exclusão do que não for mais obrigatório. Respondemos em até 15 dias.</p><div style="display:flex;flex-wrap:wrap;gap:16px;font-size:14px"><a href="privacidade.html">Política de privacidade</a><a href="mailto:' + esc(C.emailPrivacidade) + '">' + esc(C.emailPrivacidade) + '</a></div></div>'
    + '<div class="bloco navy"><span class="rotulo gold">Prefere falar com alguém?</span><h3>A ' + esc(C.dona) + ' responde no WhatsApp</h3><p>' + esc(C.horario) + '. Fora desse horário, mande a mensagem que a equipe retoma no dia seguinte.</p><div class="acoes"><a class="btn btn-wa btn-quad" target="_blank" rel="noopener" href="' + wa('', C.whatsappAdriana) + '">Chamar no WhatsApp</a></div><div style="font-size:13px;color:#8A98A2">Equipe AD7? <a href="gestao/" style="color:#C9D1D6">Entrar no painel</a></div></div>'
    + '</section></div>';
}
function campo(nome, rot, attrs) {
  const extra = nome === 'email' ? ' spellcheck="false" autocapitalize="none"' : nome === 'telefone' ? ' placeholder="ex.: (41) 99999-9999"' : '';
  return '<label>' + rot + ' <input name="' + nome + '" ' + (attrs || '') + extra + '></label>';
}
function campoDoErro(msg) { return /nome/i.test(msg) ? 'nome' : /WhatsApp/.test(msg) ? 'telefone' : /e-mail/i.test(msg) ? 'email' : /CPF/.test(msg) ? 'cpf' : /aceite/i.test(msg) ? 'aceite' : ''; }
function vServico(id) {
  const s = [...SERVICOS.inquilino, ...SERVICOS.proprietario].find(x => x.id === id);
  if (!s) return vCliente();
  const extras = {
    boleto: campo('extra_mes', 'Mês do boleto', 'placeholder="ex.: outubro/2026"'),
    reembolso: '<div class="duas">' + campo('extra_valor', 'Valor pago (R$)', 'inputmode="decimal"') + campo('extra_mes', 'Mês', 'placeholder="ex.: setembro/2026"') + '</div>',
    chamado: '<label>Urgência <select name="extra_urgencia"><option>Pode esperar alguns dias</option><option>Precisa de atenção esta semana</option><option>Urgente (vazamento, falta de luz, risco)</option></select></label>',
    desocupacao: campo('extra_data', 'Data prevista para sair', 'type="date"'),
    extrato: campo('extra_mes', 'Mês do extrato', 'placeholder="ex.: setembro/2026"'),
    informe: campo('extra_ano', 'Ano-calendário', 'placeholder="ex.: 2026" inputmode="numeric"'),
    vistoria: '<label>Tipo <select name="extra_tipo"><option>Vistoria de entrada</option><option>Vistoria de saída</option><option>Acompanhar um chamado</option></select></label>',
  };
  const msgRot = { chamado: 'Descreva o problema (onde, desde quando)', desocupacao: 'Alguma observação' }[id] || 'Mensagem';
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>' + esc(s.t) + '</h1><p>' + esc(s.p) + '</p></section><div class="wrap pagina estreita"><nav class="caminho"><a href="#/cliente">Área do Cliente</a> › ' + esc(s.t) + '</nav>'
    + '<form class="caixa f" data-form="pedido" data-tipo="' + id + '">'
    + '<div class="duas">' + campo('nome', 'Nome completo', 'autocomplete="name" required') + campo('cpf', 'CPF do titular do contrato', 'inputmode="numeric" autocomplete="off" placeholder="000.000.000-00" required') + '</div>'
    + '<div class="duas">' + campo('telefone', 'WhatsApp', 'type="tel" autocomplete="tel" required') + campo('email', 'E-mail', 'type="email" autocomplete="email"') + '</div>'
    + campo('extra_imovel', 'Imóvel (endereço ou código)', '')
    + (extras[id] || '')
    + '<label>' + msgRot + ' <textarea name="mensagem"></textarea></label>' + MEL
    + '<label class="aceite"><input type="checkbox" name="aceite"> Autorizo a AD7 a usar estes dados só para atender a este pedido. O CPF serve para localizar o seu contrato. <a href="privacidade.html">Política de privacidade</a></label>'
    + '<div class="aviso erro" hidden data-aviso></div><button type="submit" class="btn btn-teal">' + esc(s.b) + '</button></form></div>';
}

/* ---------- NEGOCIE / FINANCIE / SOBRE / CONTATO / FAVORITOS ---------- */
function vNegocie() {
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Anuncie seu Imóvel</h1><p>Conte sobre o imóvel. A AD7 avalia, fotografa, anuncia nos portais e cuida do contrato. Sem compromisso até você autorizar.</p></section><div class="wrap pagina estreita">'
    + '<form class="caixa f" data-form="pedido" data-tipo="anuncio">'
    + '<h3>Seus dados</h3><div class="duas">' + campo('nome', 'Nome', 'autocomplete="name" required') + campo('telefone', 'WhatsApp', 'type="tel" autocomplete="tel" required') + '</div>' + campo('email', 'E-mail', 'type="email" autocomplete="email"')
    + '<h3 style="margin-top:10px">O imóvel</h3>'
    + '<label>Você gostaria de</label><div class="opcoes"><label><input type="radio" name="extra_quer" value="Vender" checked> Vender</label><label><input type="radio" name="extra_quer" value="Alugar"> Alugar</label><label><input type="radio" name="extra_quer" value="Temporada"> Temporada</label></div>'
    + '<div class="duas"><label>Tipo <select name="extra_tipo"><option>Casa</option><option>Apartamento</option><option>Sobrado</option><option>Terreno</option><option>Comercial</option><option>Chácara</option></select></label><label>Perfil <select name="extra_perfil"><option>Residencial</option><option>Comercial</option></select></label></div>'
    + '<div class="duas">' + campo('extra_cep', 'CEP', 'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"') + campo('extra_cidade', 'Cidade', 'value="Pontal do Paraná"') + '</div>'
    + '<div class="duas">' + campo('extra_bairro', 'Bairro', '') + campo('extra_endereco', 'Rua', '') + '</div>'
    + '<div class="duas">' + campo('extra_numero', 'Número', 'inputmode="numeric"') + campo('extra_complemento', 'Complemento', '') + '</div>'
    + '<div class="duas">' + campo('extra_preco', 'Preço pretendido (R$)', 'inputmode="decimal"') + campo('extra_condominio', 'Condomínio (R$/mês)', 'inputmode="decimal"') + '</div>'
    + '<div class="duas">' + campo('extra_iptu', 'IPTU (R$/ano)', 'inputmode="decimal"') + '<label>Aceita permuta? <select name="extra_permuta"><option>Não</option><option>Sim</option></select></label></div>'
    + '<label>Descreva o imóvel <textarea name="mensagem" placeholder="Situação do imóvel, pontos fortes, vizinhança, ventilação, iluminação…"></textarea></label>' + MEL
    + '<label class="aceite"><input type="checkbox" name="extra_autoriza"> Autorizo a AD7 a avaliar o imóvel e entrar em contato para combinar a intermediação.</label>'
    + '<label class="aceite"><input type="checkbox" name="aceite"> Concordo com a <a href="privacidade.html">Política de privacidade</a>.</label>'
    + '<div class="aviso erro" hidden data-aviso></div><button type="submit" class="btn btn-navy btn-quad" style="text-transform:uppercase;font-size:14px">ENVIAR</button></form></div>';
}
function vFinancie() {
  const bancos = [['Caixa', 'https://www.caixa.gov.br/voce/habitacao/Paginas/default.aspx'], ['Banco do Brasil', 'https://www.bb.com.br/site/pra-voce/financiamentos/financiamento-imobiliario/'], ['Itaú', 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario/'], ['Bradesco', 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/credito-imobiliario.shtm'], ['Santander', 'https://www.santander.com.br/creditos-e-financiamentos/credito-imobiliario'], ['Banrisul', 'https://www.banrisul.com.br/']];
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Financie seu Imóvel</h1><p>Simule o financiamento no banco de sua preferência. Com a carta de aprovação em mãos, a AD7 acompanha a documentação até a assinatura.</p></section><div class="wrap pagina">'
    + '<div class="grid">' + bancos.map(([n, u]) => '<a class="card-linha" href="' + u + '" target="_blank" rel="noopener"><span class="ico">' + ICO.casa + '</span><span><b>' + n + '</b><span>Simular agora →</span></span></a>').join('') + '</div>'
    + '<div class="bloco soft"><h3>Dica da AD7</h3><p>Imóveis que aceitam financiamento estão marcados na ficha. Na dúvida, <a href="' + wa('Olá! Quero saber quais imóveis da AD7 aceitam financiamento.') + '" target="_blank" rel="noopener">pergunte no WhatsApp</a>.</p></div></div>';
}
function vSobre() {
  const r = resumoCatalogo();
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Sobre a AD7</h1><p>A sua imobiliária em Pontal do Paraná: compra, venda, aluguel e temporada no litoral.</p></section><div class="wrap pagina">'
    + '<div class="sobre-faixa" style="margin:0;padding:48px;color:#fff"><div class="wrap" style="padding:0"><img src="arte/sobre.jpg" alt="Sobrado anunciado pela AD7 em Pontal do Sul"><div><h2>Cuidamos de tudo com você!</h2>'
    + '<p>Precisando de uma solução ou querendo investir no mercado imobiliário, conte com a máxima transparência e a atenção de uma corretora especializada.</p>'
    + '<p>Somos especializados na compra, venda e aluguel de imóveis e prestamos toda a assessoria necessária à realização de uma transação segura e tranquila, com acompanhamento jurídico e operacional de qualidade.</p>'
    + '<p>Reconhecidos pela ética profissional e transparência no mercado imobiliário, oferecemos a nossos clientes um atendimento personalizado, resultando em segurança e satisfação em todos os negócios realizados.</p></div></div></div>'
    + '<div class="resumo"><div><span>Imóveis</span><b>' + r.total + '</b></div><div><span>À venda</span><b>' + (r.porTransacao.venda || 0) + '</b></div><div><span>Temporada</span><b>' + (r.porTransacao.temporada || 0) + '</b></div><div><span>Cidades</span><b>' + r.cidades.length + '</b></div></div>'
    + '<div class="bloco soft"><h3>Onde estamos</h3><p>' + esc(C.endereco) + '<br>' + esc(C.cidade) + ' · <a href="' + esc(C.maps) + '" target="_blank" rel="noopener">ver no Google Maps</a></p><div class="acoes"><a class="btn btn-navy" href="#/contato">FALE COM A GENTE</a><a class="btn btn-line" href="#/negocie">ANUNCIE SEU IMÓVEL</a></div></div></div>' + faixaParceiros();
}
function vContato() {
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Contato</h1><p>' + esc(C.endereco) + ' · ' + esc(C.cidade) + '</p></section><div class="wrap pagina"><div class="grid grid-2" style="align-items:start">'
    + '<form class="caixa f" data-form="pedido" data-tipo="contato"><h3>Entre em contato</h3>' + campo('nome', 'Nome', 'autocomplete="name" required') + '<div class="duas">' + campo('telefone', 'Telefone ou WhatsApp', 'type="tel" autocomplete="tel" required') + campo('email', 'Email', 'type="email" autocomplete="email"') + '</div>'
    + '<label>Sua mensagem <textarea name="mensagem" required></textarea></label>' + MEL + '<label class="aceite"><input type="checkbox" name="aceite"> Concordo com a <a href="privacidade.html">Política de privacidade</a>.</label><div class="aviso erro" hidden data-aviso></div><button type="submit" class="btn btn-navy btn-quad" style="text-transform:uppercase;font-size:14px">ENVIAR</button></form>'
    + '<div class="caixa"><h3>' + esc(C.nome) + '</h3><p style="margin:0">' + esc(C.endereco) + '<br>' + esc(C.cidade) + '</p><a href="' + esc(C.maps) + '" target="_blank" rel="noopener">Veja como chegar</a>'
    + '<p style="margin:0"><a href="' + wa() + '" target="_blank" rel="noopener">' + fone(C.whatsapp) + '</a><br><a href="' + wa('', C.whatsappAdriana) + '" target="_blank" rel="noopener">' + fone(C.whatsappAdriana) + '</a><br>' + esc(C.fixo) + '</p><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a><p style="margin:0;color:var(--suave);font-size:14px">' + esc(C.horario) + '</p>'
    + '<div class="mapa-bloco" id="mapa-bloco"><button type="button" class="btn btn-line btn-p" data-act="mapa">Mostrar o mapa</button><span class="nota">O mapa é do Google e só carrega quando você pede.</span></div>'
    + '<a class="avaliar" href="' + esc(C.maps) + '" target="_blank" rel="noopener">★ Já foi atendido pela AD7? Deixe sua avaliação no Google</a></div></div></div>';
}
function vFavoritos() {
  const lista = favs().map(porRef).filter(Boolean);
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Meus Favoritos</h1><p>Os imóveis que você salvou ficam neste aparelho. Compartilhe a lista com quem decide junto.</p></section><div class="wrap pagina">' + (lista.length ? grade(lista) + '<div class="centro"><a class="btn btn-wa btn-quad" target="_blank" rel="noopener" href="' + wa('Olá! Separei estes imóveis da AD7: ' + lista.map(im => 'Ref. ' + im.ref + ' (' + tituloGenerico(im) + ')').join('; ')) + '">Mandar a lista no WhatsApp</a></div>' : '<div class="vazio">Você ainda não salvou nenhum imóvel. Toque no coração de um imóvel para guardar aqui.</div>') + '</div>';
}

/* ---------- ENTRAR / PAINEL ---------- */
function vEntrar(msg) {
  return '<div class="wrap pagina estreita"><h1>Entrar · equipe AD7</h1><p class="intro">Só para a ' + esc(C.dona) + ' e a equipe. Clientes usam a <a href="#/cliente">Área do Cliente</a>.</p>'
    + (temNuvem() ? '' : '<div class="aviso neutro">Este app ainda está sem banco: o painel mostra os pedidos recebidos neste aparelho. Com a sala no ar, o login passa a valer em qualquer aparelho.</div>')
    + '<form class="caixa f" data-form="entrar">' + campo('email', 'E-mail', 'type="email" autocomplete="username" required') + campo('senha', 'Senha', 'type="password" autocomplete="current-password" required') + '<div class="aviso erro"' + (msg ? '' : ' hidden') + ' data-aviso>' + esc(msg || '') + '</div><button type="submit" class="btn btn-navy btn-quad">Entrar</button><a href="#/entrar/esqueci" style="font-size:14px">Esqueci a senha</a></form></div>';
}
async function vPainel() {
  if (temNuvem() && !isLoggedIn()) return vEntrar();
  const r = await listarPedidos();
  const tag = s => s === 'atendido' ? 'tag-ok' : s === 'novo' ? 'tag-novo' : 'tag-neu';
  const linhas = r.lista.map(p => '<tr><td>' + esc(new Date(p.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) + '</td><td><b>' + esc(p.rotulo) + '</b>' + (p.imovelRef ? '<br><small>' + (/^\d+$/.test(p.imovelRef) ? 'Ref. ' : 'Imóvel: ') + esc(p.imovelRef) + '</small>' : '') + '</td><td>' + esc(p.nome) + '<br><a href="' + wa('Olá ' + p.nome.split(' ')[0] + '! Aqui é da AD7, sobre o seu pedido: ' + p.rotulo + '.', p.telefone) + '" target="_blank" rel="noopener">' + fone(p.telefone) + '</a>' + (p.email ? '<br><small>' + esc(p.email) + '</small>' : '') + '</td><td>' + esc(p.mensagem || '') + (Object.entries(p.extra || {}).filter(([, v]) => v).map(([k, v]) => '<br><small>' + esc(k) + ': ' + esc(v) + '</small>').join('')) + '</td><td><span class="tag ' + tag(p.status) + '">' + esc(p.status) + '</span></td><td>' + (p.status === 'atendido' ? '<button type="button" class="btn btn-line btn-p" data-act="pedido" data-id="' + esc(p.id) + '" data-status="novo">Reabrir</button>' : '<button type="button" class="btn btn-navy btn-p" data-act="pedido" data-id="' + esc(p.id) + '" data-status="atendido">Atendido</button>') + '</td></tr>').join('');
  return '<div class="wrap painel"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px"><h1 style="margin:0;font-size:28px;font-weight:400">Pedidos recebidos <small style="color:var(--suave);font-size:15px">· ' + r.lista.length + '</small></h1><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-navy btn-p" href="#/painel/temporada">Calendário de temporada</a><a class="btn btn-line btn-p" href="#/painel/vitrine">Vitrine da home</a>' + (isLoggedIn() ? '<span style="font-size:13px;color:var(--suave);align-self:center">' + esc(authEmail() || '') + '</span><button type="button" class="btn btn-line btn-p" data-act="sair">Sair</button>' : '') + '</div></div>'
    + (r.nuvem ? '' : '<div class="aviso neutro">Sem banco ainda: estes são os pedidos feitos neste aparelho. Os que vieram pelo WhatsApp estão lá.</div>')
    + (r.lista.length ? '<div class="rolar"><table><thead><tr><th>Quando</th><th>Pedido</th><th>Quem</th><th>Detalhes</th><th>Situação</th><th></th></tr></thead><tbody>' + linhas + '</tbody></table></div>' : '<div class="vazio">Nenhum pedido ainda.</div>') + '</div>';
}
async function vPainelTemporada(refPedida) {
  if (temNuvem() && !isLoggedIn()) return vEntrar();
  const lista = filtrar({ neg: 'temporada', ordem: 'menor' });
  const im = porRef(refPedida) || lista[0];
  if (!im) return '<div class="wrap painel"><h1>Calendário de temporada</h1><p class="intro">Nenhum imóvel de temporada no catálogo.</p></div>';
  const sel = '<label class="dispo-sel">Imóvel <select data-act="dispo-ref">' + lista.map(x => '<option value="' + esc(x.ref) + '"' + (x.ref === im.ref ? ' selected' : '') + '>Ref. ' + esc(x.ref) + ' · ' + esc(x.tipo) + ' · ' + esc(x.bairro) + ' · ' + esc(rotuloPreco(x)) + '/diária</option>').join('') + '</select></label>';
  return '<div class="wrap painel"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px"><h1 style="margin:0;font-size:28px;font-weight:400">Calendário de temporada</h1><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-line btn-p" href="#/painel">← Pedidos</a>' + (isLoggedIn() ? '<button type="button" class="btn btn-line btn-p" data-act="sair">Sair</button>' : '') + '</div></div>'
    + (DISPO.nuvem ? '' : (temNuvem() ? '<div class="aviso neutro">O banco não respondeu: o que você marcar fica só neste aparelho até entrar de novo.</div>' : '<div class="aviso neutro">Sem banco ainda: o calendário fica neste aparelho (e o site deste aparelho já mostra).</div>'))
    + '<div class="caixa" style="margin-top:16px;display:flex;flex-direction:column;gap:16px">' + sel + '<div><a href="#/imovel/' + esc(im.ref) + '" style="font-size:14px">Ver como fica no site →</a></div>' + dispoEditorHtml(im.ref, im) + '</div></div>';
}
async function vPainelVitrine(msg) {
  if (temNuvem() && !isLoggedIn()) return vEntrar();
  const v = Object.assign({ oportunidade: [], slide: [] }, VITRINE);
  const mostra = chave => { const l = vitrineLista(chave); return l.length ? grade(l, 'grid') : '<div class="vazio">Nenhum imóvel nesta lista.</div>'; };
  return '<div class="wrap painel"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px"><h1 style="margin:0;font-size:28px;font-weight:400">Vitrine da home</h1><a class="btn btn-line btn-p" href="#/painel">← Pedidos</a></div>'
    + '<p class="intro" style="margin:8px 0 0">Os códigos dos imóveis que aparecem nas listas da página inicial, separados por vírgula. Como no site antigo: "Ótima oportunidade" e os destaques.</p>'
    + '<form class="caixa f" data-form="vitrine" style="margin-top:16px"><label>Ótima oportunidade <input name="oportunidade" value="' + esc(v.oportunidade.join(', ')) + '" placeholder="ex.: 315, 392, 408"></label><label>Destaques da AD7 <input name="slide" value="' + esc(v.slide.join(', ')) + '" placeholder="códigos separados por vírgula"></label><div class="aviso"' + (msg ? '' : ' hidden') + ' data-aviso>' + esc(msg || '') + '</div><button type="submit" class="btn btn-navy btn-quad">Salvar</button></form>'
    + '<h2 style="font-size:22px;font-weight:500;margin:28px 0 10px">Ótima oportunidade</h2>' + mostra('oportunidade') + '<h2 style="font-size:22px;font-weight:500;margin:28px 0 10px">Destaques da AD7</h2>' + mostra('slide') + '</div>';
}
/* CEP → cidade, bairro e rua (ViaCEP, só quando a pessoa digita o CEP no "Anuncie") */
async function cepPreencher(input) {
  const cep = String(input.value || '').replace(/\D/g, ''); if (cep.length !== 8) return;
  const form = input.closest('form'); if (!form) return;
  try {
    const r = await fetch('https://viacep.com.br/ws/' + cep + '/json/'); if (!r.ok) return; const d = await r.json(); if (d.erro) return;
    const poe = (n, v) => { const el = form.elements[n]; if (el && v && !el.value) el.value = v; };
    poe('extra_cidade', d.localidade); poe('extra_bairro', d.bairro); poe('extra_endereco', d.logradouro);
    if (form.elements.extra_cidade && d.localidade) form.elements.extra_cidade.value = d.localidade;
  } catch (e) {}
}
function vServicoVisita(im) {
  return '<section class="faixa-cliente"><img src="arte/emblema.png" srcset="arte/emblema@2x.png 2x" alt=""><h1>Agendar visita</h1><p>Código ' + esc(im.ref) + ' · ' + esc(im.bairro) + '. Diga quando é bom para você; a ' + esc(C.dona) + ' confirma no WhatsApp.</p></section><div class="wrap pagina estreita"><nav class="caminho"><a href="#/imovel/' + esc(im.ref) + '">' + esc(tituloGenerico(im)) + '</a> › Agendar visita</nav>'
    + '<form class="caixa f" data-form="pedido" data-tipo="interesse" data-ref="' + esc(im.ref) + '"><div class="duas">' + campo('nome', 'Nome', 'autocomplete="name" required') + campo('telefone', 'WhatsApp', 'type="tel" autocomplete="tel" required') + '</div><div class="duas">' + campo('extra_dia', 'Dia', 'type="date"') + campo('extra_horario', 'Horário', 'placeholder="ex.: de manhã"') + '</div>'
    + '<label>Observações <textarea name="mensagem">Quero agendar uma visita ao imóvel código ' + esc(im.ref) + '.</textarea></label>' + MEL + '<label class="aceite"><input type="checkbox" name="aceite"> Autorizo a AD7 a usar estes dados só para combinar a visita. <a href="privacidade.html">Política de privacidade</a></label><div class="aviso erro" hidden data-aviso></div><button type="submit" class="btn btn-navy btn-quad">Pedir visita</button></form></div>';
}
function vEsqueci() {
  return '<div class="wrap pagina estreita"><h1>Esqueci a senha</h1><p class="intro">Informe o e-mail da conta: chega um link para criar uma senha nova.</p><form class="caixa f" data-form="esqueci">' + campo('email', 'E-mail', 'type="email" required') + '<div class="aviso" hidden data-aviso></div><button type="submit" class="btn btn-navy btn-quad">Mandar o link</button></form></div>';
}

/* ---------- para o Google: descrição, canonical e dados estruturados por tela ---------- */
function baseSite() { const b = document.querySelector('base'); return b ? b.href : location.origin + location.pathname.replace(/[^/]*$/, ''); }
function descricaoSeo(im) {
  const p = [tituloGenerico(im)];
  if (im.dorm) p.push(im.dorm + ' dorm'); if (im.vagas) p.push(im.vagas + ' vaga' + (im.vagas > 1 ? 's' : '')); if (im.areaConstruida) p.push(fmtArea(im.areaConstruida));
  p.push(rotuloPreco(im));
  const t = p.join(' · ') + '. ' + (im.descricao || []).join(' ');
  return t.length > 158 ? t.slice(0, 157).trimEnd() + '…' : t;
}
function ldAgente() {
  return { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: C.nome, url: baseSite(), telephone: '+' + C.whatsapp, email: C.email, image: baseSite() + 'arte/logo.png',
    address: { '@type': 'PostalAddress', streetAddress: C.rua + ', ' + C.bairro, addressLocality: C.municipio, addressRegion: C.uf, postalCode: C.cep, addressCountry: 'BR' },
    geo: { '@type': 'GeoCoordinates', latitude: C.lat, longitude: C.lng }, hasMap: C.maps, openingHours: C.horarioSchema,
    sameAs: [C.instagram, C.facebook, C.maps].filter(Boolean), areaServed: ['Pontal do Paraná', 'Matinhos', 'Paranaguá', 'Curitiba'], priceRange: '$$' };
}
function ldImovel(im) {
  return { '@context': 'https://schema.org', '@type': 'RealEstateListing', url: baseSite() + 'imovel/' + im.ref + '/', name: tituloGenerico(im), description: descricaoSeo(im), image: (im.fotos || []).slice(0, 5),
    about: { '@type': im.tipo === 'Apartamento' ? 'Apartment' : 'House', name: tituloGenerico(im), numberOfRooms: im.dorm || undefined, address: { '@type': 'PostalAddress', addressLocality: im.cidade, addressRegion: im.uf, addressCountry: 'BR', streetAddress: im.bairro } },
    offers: { '@type': 'Offer', price: im.preco, priceCurrency: 'BRL', availability: 'https://schema.org/InStock', seller: { '@type': 'RealEstateAgent', name: C.nome, url: baseSite() } } };
}
function seoTela(r, im) {
  const desc = im ? descricaoSeo(im) : r.nome === 'imoveis' ? 'Casas, apartamentos, sobrados e terrenos à venda, para alugar e para temporada em Pontal do Paraná e litoral, com a assessoria da AD7 Imóveis.' : 'Compra, venda, aluguel e temporada em Pontal do Paraná, com a assessoria da AD7 Imóveis do primeiro contato à entrega das chaves.';
  let canon = im ? baseSite() + 'imovel/' + im.ref + '/' : baseSite();
  if (!im && r.nome === 'imoveis' && r.query.neg && ['venda', 'aluguel', 'temporada'].includes(r.query.neg)) canon = baseSite() + 'imoveis/' + r.query.neg + '/' + (r.query.tipo ? slug(r.query.tipo) + '/' + (r.query.cidade ? slug(r.query.cidade) + '/' : '') : '');
  const m = $('meta[name=description]'); if (m) m.setAttribute('content', desc);
  let c = $('link[rel=canonical]'); if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); } c.href = canon;
  let ld = $('#ld-tela'); if (!ld) { ld = document.createElement('script'); ld.id = 'ld-tela'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify(im ? ldImovel(im) : ldAgente());
}

/* ---------- parceiros: só seguro fiança (Loft) e cobrança pela Imobia ---------- */
function faixaParceiros() {
  return '<section class="sec parceiros" id="parceiros"><div class="wrap">' + EMBLEMA + '<h2>Alugar com a AD7 é simples e seguro</h2><p class="sub">Trabalhamos só com seguro fiança: sem fiador, sem caução e com aprovação em poucas horas. A cobrança do aluguel chega todo mês pela Imobia, com Pix, boleto e 2ª via na Área do Cliente.</p>'
    + '<div class="parceiros-grid">'
    + '<a class="parceiro" href="https://loft.com.br/para-imobiliarias/fianca-aluguel/" target="_blank" rel="noopener"><img src="arte/loft-fianca.svg" alt="Loft Fiança Aluguel" width="276" height="95" loading="lazy"><span><b>Garantia: Fiança Aluguel Loft</b><span>A única garantia que aceitamos. Análise digital, sem fiador e sem caução.</span></span></a>'
    + '<a class="parceiro" href="https://imobia.app/" target="_blank" rel="noopener"><img src="arte/imobia.png" alt="Imobia" width="640" height="114" loading="lazy"><span><b>Cobrança e boletos pela Imobia</b><span>Boleto ou Pix todo mês, lembrete de vencimento e repasse ao proprietário em dia.</span></span></a>'
    + '</div></div></section>';
}

/* ---------- moldura: cabeçalho, menu, rodapé ---------- */
function moldura() {
  const links = [['#/', 'Home'], ['#/imoveis?neg=venda', 'Comprar'], ['#/imoveis?neg=aluguel', 'Alugar'], ['#/imoveis?neg=temporada', 'Temporada'], ['#/negocie', 'Anuncie seu Imóvel'], ['#/financie', 'Financie'], ['#/sobre', 'Empresa'], ['#/favoritos', 'Favoritos'], ['#/contato', 'Contato'], ['#/cliente', 'Área do Cliente']];
  $('#menu').innerHTML = links.map(([h, t]) => '<a href="' + h + '">' + t + '</a>').join('');
  $('#topo-creci').textContent = C.creci;
  $('#topo-links').innerHTML = '<div class="fone"><small>Atendimento</small><a href="' + wa() + '" target="_blank" rel="noopener">' + fone(C.whatsapp) + '</a><a href="tel:' + esc(C.fixo.replace(/\D/g, '')) + '">' + esc(C.fixo) + '</a></div>'
    + '<div class="fone"><small>' + esc(C.dona) + '</small><a href="' + wa('', C.whatsappAdriana) + '" target="_blank" rel="noopener">' + fone(C.whatsappAdriana) + '</a></div>'
    + '<a class="area" href="#/cliente">Área do Cliente</a><a href="#/favoritos">Meus Favoritos</a>'
    + '<div class="social"><a href="' + esc(C.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICO.insta + '</a><a href="' + esc(C.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook">' + ICO.face + '</a></div>';
  $('#wa-flut').innerHTML = '<a href="' + wa() + '" target="_blank" rel="noopener" aria-label="Falar no WhatsApp do atendimento">' + ICO.wa + '</a><a href="' + wa('', C.whatsappAdriana) + '" target="_blank" rel="noopener" aria-label="Falar com a ' + esc(C.dona) + ' no WhatsApp">' + ICO.wa + '</a>';
  $('#rodape').innerHTML = '<div><a class="marca" href="#/"><img src="arte/logo-claro.png" srcset="arte/logo-claro@2x.png 2x, arte/logo-claro@3x.png 3x" alt="' + esc(C.nome) + '"></a><div class="social"><a href="' + esc(C.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICO.insta + '</a><a href="' + esc(C.facebook) + '" target="_blank" rel="noopener" aria-label="Facebook">' + ICO.face + '</a></div><span style="font-size:13px;font-weight:300;display:block;margin-top:6px">' + esc(C.slogan) + ' em Pontal do Paraná, do primeiro contato até a entrega das chaves.</span></div>'
    + '<div><b>Para você</b><a href="#/negocie">Anuncie seu imóvel</a><br><a href="#/financie">Financie seu imóvel</a><br><a href="privacidade.html">Política de privacidade</a><br><a href="mailto:' + esc(C.emailPrivacidade) + '">Seus dados (LGPD)</a></div>'
    + '<div><b>Acesso Rápido</b><a href="#/">Home</a><br><a href="#/imoveis?neg=aluguel">Alugar</a><br><a href="#/imoveis?neg=venda">Comprar</a><br><a href="#/imoveis?neg=temporada">Temporada</a><br><a href="#/sobre">Empresa</a><br><a href="#/favoritos">Favoritos</a><br><a href="#/contato">Contato</a><br><a href="#/cliente">Área do Cliente</a><br><a href="gestao/" style="color:var(--dourado)">Equipe AD7</a></div>'
    + '<div style="font-size:15px;font-weight:300;line-height:1.7"><b>Contatos</b>' + esc(C.nome) + '<br>' + esc(C.endereco) + '<br>' + esc(C.cidade) + '<br><a href="' + wa() + '" target="_blank" rel="noopener">' + fone(C.whatsapp) + '</a><br><a href="' + wa('', C.whatsappAdriana) + '" target="_blank" rel="noopener">' + fone(C.whatsappAdriana) + '</a><br>' + esc(C.fixo) + '<br><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a><br><a href="' + esc(C.maps) + '" target="_blank" rel="noopener">Como chegar · Google Maps</a></div>';
  $('#rodape-fim').innerHTML = '<span>' + esc(C.nome) + ' · CNPJ ' + esc(C.cnpj) + ' · ' + esc(C.creci) + '</span><span>© ' + new Date().getFullYear() + ' ' + esc(C.nome) + ' · v' + APP_VERSAO + '</span>';
  $('#cookies').hidden = cookiesDecidido();
}
function cabecalhoRolagem() {
  const cab = $('#cab'); if (!cab) return;
  cab.classList.toggle('fixa', !document.body.classList.contains('sem-heroi') && window.scrollY > 120);
}

/* ---------- render ---------- */
let ROTA_ANTES = '';
async function render() {
  const r = rota();
  const app = $('#app');
  let html = '', titulo = C.nome + ' · ' + C.slogan + ' em Pontal do Paraná';
  let heroi = false;
  if (!CAT.pronto) html = '<div class="carregando">Carregando os imóveis…</div>';
  else switch (r.nome) {
    case 'inicio': html = vInicio(); heroi = true; break;
    case 'imoveis': html = vBusca(r.query); titulo = (TITULO_BUSCA || 'Imóveis') + ' · ' + C.nome; break;
    case 'imovel': { const im = porRef(r.param); if (r.sub === 'visita' && im) html = vServicoVisita(im); else { html = vImovel(r.param); heroi = !!im; } if (im) titulo = tituloGenerico(im) + ' · cód. ' + im.ref + ' · ' + C.nome; break; }
    case 'cliente': html = r.param ? vServico(r.param) : vCliente(); titulo = 'Área do Cliente · ' + C.nome; break;
    case 'negocie': html = vNegocie(); titulo = 'Anuncie seu imóvel · ' + C.nome; break;
    case 'financie': html = vFinancie(); titulo = 'Financie · ' + C.nome; break;
    case 'sobre': html = vSobre(); titulo = 'Sobre · ' + C.nome; break;
    case 'contato': html = vContato(); titulo = 'Contato · ' + C.nome; break;
    case 'favoritos': html = vFavoritos(); titulo = 'Favoritos · ' + C.nome; break;
    case 'entrar': html = r.param === 'esqueci' ? vEsqueci() : vEntrar(); titulo = 'Entrar · ' + C.nome; break;
    case 'painel': html = r.param === 'temporada' ? await vPainelTemporada(r.query.ref) : r.param === 'vitrine' ? await vPainelVitrine() : await vPainel(); titulo = (r.param === 'temporada' ? 'Calendário de temporada' : r.param === 'vitrine' ? 'Vitrine' : 'Pedidos') + ' · ' + C.nome; break;
    default: html = '<div class="wrap pagina"><h1>Página não encontrada</h1><p class="intro"><a href="#/">Voltar ao início</a></p></div>';
  }
  document.body.classList.toggle('sem-heroi', !heroi);
  document.body.classList.toggle('inicio', r.nome === 'inicio');
  app.innerHTML = html;
  document.title = titulo;
  if (CAT.pronto) seoTela(r, r.nome === 'imovel' && !r.sub ? porRef(r.param) : null);
  if (r.nome === 'imovel' && !r.sub && porRef(r.param)) vistoAgora(r.param);
  moldura();
  const chave = r.nome + '/' + r.param + '/' + r.sub;
  if (chave !== ROTA_ANTES) window.scrollTo(0, 0);
  ROTA_ANTES = chave;
  if (r.nome === 'imoveis' && r.query.foco === 'ref' && window.matchMedia && matchMedia('(pointer: fine)').matches) { const i = $('input[name=q]'); if (i) i.focus(); }
  $('#menu-cel').classList.remove('aberto'); $('#hamb').setAttribute('aria-expanded', 'false');
  cabecalhoRolagem();
}

/* ---------- eventos ---------- */
function dadosForm(form) { const d = {}; const extra = {}; for (const [k, v] of new FormData(form).entries()) { if (k.startsWith('extra_')) extra[k.slice(6)] = String(v).trim(); else d[k] = v; } d.extra = extra; d.aceite = form.elements.aceite ? form.elements.aceite.checked : false; if (form.elements.extra_autoriza && !form.elements.extra_autoriza.checked) d.extra.autoriza = ''; return d; }
function aviso(form, texto, cls) { const a = form.querySelector('[data-aviso]'); if (!a) return; a.className = 'aviso ' + (cls || 'erro'); a.setAttribute('role', (cls || 'erro') === 'erro' ? 'alert' : 'status'); a.textContent = texto; a.hidden = !texto; }
const movimentoReduzido = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('submit', async e => {
  const form = e.target; const tipo = form.dataset.form; if (!tipo) return;
  e.preventDefault();
  if (tipo === 'busca' || tipo === 'filtros') {
    const d = Object.fromEntries(new FormData(form).entries());
    for (const k of ['mar', 'piscina', 'mobiliado', 'financiavel']) if (d[k] === 'on') d[k] = '1';
    const q = rota().query; if (q.ordem) d.ordem = q.ordem;
    navegar('#/imoveis' + qs(d)); return;
  }
  if (tipo === 'vitrine') {
    const d = Object.fromEntries(new FormData(form).entries());
    const lista = v => String(v || '').split(/[\s,;]+/).map(x => x.trim()).filter(x => x && porRef(x));
    const nuvem = await vitrineGravar({ oportunidade: lista(d.oportunidade), slide: lista(d.slide) });
    $('#app').innerHTML = await vPainelVitrine(nuvem ? 'Salvo: a home já mostra.' : (temNuvem() ? 'O banco não respondeu: ficou só neste aparelho.' : 'Sem banco: ficou neste aparelho (e a home deste aparelho já mostra).')); return;
  }
  if (tipo === 'pedido') {
    const d = dadosForm(form); d.imovelRef = form.dataset.ref || d.extra.imovel || '';
    if (d.site) { form.innerHTML = '<div class="aviso ok">Pronto! Seu pedido foi anotado.</div>'; return; }   /* robô caiu na armadilha: nada é gravado */
    if (form.dataset.tipo === 'anuncio' && !form.elements.extra_autoriza.checked) { aviso(form, 'Marque a autorização para a AD7 avaliar o imóvel.'); return; }
    const bt = form.querySelector('button[type=submit]'); const rot = bt.textContent; bt.disabled = true; bt.textContent = 'Enviando…';
    const r = await enviarPedido(form.dataset.tipo, d);
    if (!r.ok) { aviso(form, r.erro); bt.disabled = false; bt.textContent = rot; const c = form.elements[campoDoErro(r.erro)]; if (c && c.focus) c.focus(); return; }
    const nome = r.pedido.nome.split(' ')[0];
    form.innerHTML = '<div class="aviso ok"><b>Pronto, ' + esc(nome) + '!</b> ' + (r.nuvem ? 'Seu pedido chegou na AD7 (nº ' + esc(r.pedido.id) + '). A ' + esc(C.dona) + ' responde no WhatsApp.' : 'Seu pedido está anotado (nº ' + esc(r.pedido.id) + '). Para a AD7 receber agora, mande também pelo WhatsApp com um toque:') + '</div><a class="btn btn-wa btn-quad" target="_blank" rel="noopener" href="' + r.whatsapp + '">' + (r.nuvem ? 'Adiantar no WhatsApp' : 'Mandar pelo WhatsApp') + '</a>';
    return;
  }
  if (tipo === 'entrar') {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!temNuvem()) { navegar('#/painel'); return; }
    aviso(form, '');
    const r = await authSignIn(d.email, d.senha);
    if (!r.ok) { aviso(form, r.error || 'Não deu certo. Confira o e-mail e a senha.'); return; }
    if (typeof claimOwnership === 'function') claimOwnership().catch(() => {});
    navegar('#/painel'); return;
  }
  if (tipo === 'esqueci') {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!temNuvem()) { aviso(form, 'Ainda sem banco: a senha só existe com a sala no ar.', 'neutro'); return; }
    const r = await authReset(d.email);
    aviso(form, r.ok ? 'Se existir uma conta com esse e-mail, o link já foi. Olhe a caixa de entrada e o spam.' : (r.error || 'Não deu certo.'), r.ok ? 'ok' : 'erro'); return;
  }
});

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act;
  if (act.startsWith('dispo-')) {
    e.preventDefault();
    await dispoClique(el, { aoMudar: ref => { const s = $('#cal-dispo'), im = porRef(ref); if (s && im && rota().nome === 'imovel') s.outerHTML = calendario(im); else render(); } });
    return;
  }
  if (act === 'fav') { e.preventDefault(); const on = favToggle(el.dataset.ref); el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); if (el.classList.contains('fav')) el.innerHTML = on ? ICO.coracaoCheio : ICO.coracao; else el.textContent = on ? '♥ Salvo' : '♡ Favoritar'; return; }
  if (act === 'cookies-sim' || act === 'cookies-nao') { try { localStorage.setItem(COOKIE_KEY, act === 'cookies-sim' ? 'sim' : 'nao'); } catch (x) {} $('#cookies').hidden = true; return; }
  if (act === 'mapa') { const b = $('#mapa-bloco'); if (b) b.innerHTML = '<iframe title="Mapa: ' + esc(C.nome) + '" src="https://www.google.com/maps?q=' + esc(C.lat) + ',' + esc(C.lng) + '&z=16&hl=pt-BR&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>'; return; }
  if (act === 'filtros') { $('#filtros').classList.toggle('fechado'); return; }
  if (act === 'mapa-im') { const b = $('#mapa-im'); if (b) b.innerHTML = '<iframe title="Mapa do imóvel" src="https://www.google.com/maps?q=' + esc(el.dataset.lat) + ',' + esc(el.dataset.lng) + '&z=16&hl=pt-BR&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><a class="btn btn-line btn-p" target="_blank" rel="noopener" href="https://www.google.com/maps?q=' + esc(el.dataset.lat) + ',' + esc(el.dataset.lng) + '">Abrir no Google Maps</a>'; return; }
  if (act === 'video') { const id = el.dataset.id; const w = document.createElement('div'); w.className = el.className.replace('video ', 'video carregado '); w.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + '?autoplay=1&rel=0" title="Vídeo" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'; el.replaceWith(w); return; }
  if (act === 'imprimir') { window.print(); return; }
  if (act === 'seta') { const c = document.getElementById(el.dataset.alvo); if (c) c.scrollBy({ left: (+el.dataset.dir || 1) * c.clientWidth, behavior: movimentoReduzido() ? 'auto' : 'smooth' }); return; }
  if (act === 'rolar') { e.preventDefault(); const alvo = document.getElementById(el.dataset.alvo); if (alvo) alvo.scrollIntoView({ behavior: movimentoReduzido() ? 'auto' : 'smooth', block: 'start' }); return; }
  if (act === 'pular') { e.preventDefault(); const m = $('#app'); m.focus(); m.scrollIntoView({ block: 'start' }); return; }
  if (act === 'lb') { LB.i = +el.dataset.i || 0; LB.abriu = el; lightbox(true); return; }
  if (act === 'lb-fechar') { lightbox(false); return; }
  if (act === 'lb-ant') { LB.i = (LB.i - 1 + LB.fotos.length) % LB.fotos.length; lightbox(true); return; }
  if (act === 'lb-prox') { LB.i = (LB.i + 1) % LB.fotos.length; lightbox(true); return; }
  if (act === 'pedido') { el.disabled = true; await marcarPedido(el.dataset.id, el.dataset.status); render(); return; }
  if (act === 'sair') { await authSignOut(); navegar('#/'); return; }
});
document.addEventListener('change', e => {
  if (e.target.dataset.act === 'dispo-ref') { navegar('#/painel/temporada?ref=' + encodeURIComponent(e.target.value)); return; }
  if (e.target.dataset.act === 'dispo-regra') { dispoCampo(e.target, { avisar: () => render() }); return; }
  if (e.target.dataset.act === 'ordem') { const q = rota().query; q.ordem = e.target.value; navegar('#/imoveis' + qs(q)); return; }
  const form = e.target.closest('form[data-form=filtros]');
  if (form && ['neg', 'dorm', 'suites', 'banheiros', 'vagas'].includes(e.target.name)) form.requestSubmit();
  if (e.target.name === 'extra_cep') { cepPreencher(e.target); return; }
});
document.addEventListener('keydown', e => { if ($('#lightbox').hidden) return; if (e.key === 'Escape') lightbox(false); if (e.key === 'ArrowRight') { LB.i = (LB.i + 1) % LB.fotos.length; lightbox(true); } if (e.key === 'ArrowLeft') { LB.i = (LB.i - 1 + LB.fotos.length) % LB.fotos.length; lightbox(true); } });
function lightbox(abrir) {
  const lb = $('#lightbox'); const estava = !lb.hidden; lb.hidden = !abrir;
  if (abrir && LB.fotos.length) { $('#lb-img').src = LB.fotos[LB.i]; $('#lb-img').alt = 'Foto ' + (LB.i + 1) + ' de ' + LB.fotos.length; $('#lb-n').textContent = (LB.i + 1) + ' / ' + LB.fotos.length; if (!estava) $('#lb-fechar').focus(); }
  if (!abrir && estava && LB.abriu && LB.abriu.isConnected) LB.abriu.focus();
  document.body.style.overflow = abrir ? 'hidden' : '';
}
$('#hamb').addEventListener('click', () => { const m = $('#menu-cel'); m.classList.toggle('aberto'); $('#hamb').setAttribute('aria-expanded', m.classList.contains('aberto')); });
window.addEventListener('scroll', cabecalhoRolagem, { passive: true });

/* ---------- início ---------- */
window.addEventListener('hashchange', render);
(async function iniciar() {
  if (typeof authLoad === 'function') authLoad();
  if (typeof authFromHash === 'function') try { await authFromHash(); } catch (e) {}
  await carregarCatalogo(APP_VERSAO);
  try { await dispoCarregarTudo(); } catch (e) {}
  try { await vitrineCarregar(); } catch (e) {}
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

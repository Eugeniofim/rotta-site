/* =====================================================
   AD7 GESTÃO — o app por trás do site (demonstração navegável).

   Um arquivo só, sem framework, igual ao resto do app: rotas por #/, telas
   montadas em HTML, um clique tratado por data-act. O catálogo é o MESMO do
   site (../catalogo.js + ../dados/imoveis.json); pessoas e negócios vêm de
   dados.js. O que a pessoa faz na demonstração (arrastar negócio, fechar,
   abrir chamado) fica neste aparelho (localStorage) e some em "Recomeçar".

   Na entrega 2 as telas ficam; DEMO vira o banco (sala ad7) e a trava de
   quem-vê-o-quê passa a ser do banco (RLS), não só da tela.
   ===================================================== */
'use strict';

const PKEY = 'ad7_gestao_demo_v1';
const ET_VENDA = ['Novo', 'Em contato', 'Visita', 'Proposta', 'Fechamento'];
const ET_CAPT = ['Contato do dono', 'Visita de avaliação', 'Autorização', 'Anunciado'];
const ICO = {
  hoje: 'M3 11l9-7 9 7M5 10v10h14V10', imoveis: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  negocios: 'M3 5h18l-7 8v6l-4 2v-8L3 5z', carteiras: 'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  entradas: 'M3 12h4l2 3h6l2-3h4M3 12v7h18v-7M3 12l3-7h12l3 7', agenda: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4',
  chamados: 'M14 7a4 4 0 0 0-5 5l-6 6 2 2 6-6a4 4 0 0 0 5-5l-2 2-2-2 2-2z', locacoes: 'M4 6h16v12H4zM4 10h16M8 15h3',
  equipe: 'M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1M16 13h1a4 4 0 0 1 4 4v1',
  portais: 'M4 12h16M12 4v16M6 6l12 12M18 6L6 18', privacidade: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  mais: 'M5 12h.01M12 12h.01M19 12h.01'
};
const MENU = [
  ['hoje', 'Hoje'], ['imoveis', 'Imóveis'], ['negocios', 'Negócios'], ['carteiras', 'Carteiras'], ['entradas', 'Caixa de entrada'],
  ['agenda', 'Agenda'], ['chamados', 'Chamados'], ['locacoes', 'Locações'], ['equipe', 'Equipe'], ['portais', 'Portais e canais'], ['privacidade', 'Privacidade']
];
const SO_CORRETOR = ['hoje', 'imoveis', 'negocios', 'carteiras', 'entradas', 'agenda', 'chamados', 'portais'];

/* ---------- estado ---------- */
const S = { funil: 'venda', so: 'todos', tipo: 'todos', carteira: 'procura', temp: 'todas', q: '', neg: '', aba: '', etapaCel: 0, ia: false, rotaAnterior: '' };
let P = carregarP();
function carregarP() {
  const base = { logado: false, vistos: {}, como: 'dona', moves: {}, ganhos: [], perdidos: {}, chamado214: false, enviados: {}, visitas: {}, chat: [], cartao: 'nao' };
  try { return Object.assign(base, JSON.parse(localStorage.getItem(PKEY)) || {}); } catch (e) { return base; }
}
function salvarP() { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) {} }

/* ---------- utilidades ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dona = () => P.como === 'dona';
const EU = () => (dona() ? 'Adriana' : 'Rafael');
const minha = r => dona() || r === 'Rafael';
const $ = id => document.getElementById(id);
function fmtReal(v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); }
function fmtMil(v) {
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
  if (v >= 1e4) return 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
  return fmtReal(v);
}
const pessoa = id => DEMO.pessoas.find(p => p.id === id);
const donoDe = id => DEMO.donos.find(d => d.id === id);
const imv = ref => (ref ? porRef(ref) : null);
const capa = im => (im && (im.capa || (im.fotos || [])[0])) || '';
function tituloCurto(im) {
  if (!im) return '';
  const d = im.dorm ? im.dorm + ' dorm · ' : '';
  return im.tipo + ' · ' + d + (im.bairro || im.cidade || '');
}
function precoIm(im) {
  if (!im || im.preco == null) return 'Consulte';
  if (im.transacao === 'aluguel') return fmtReal(im.preco) + '/mês';
  if (im.transacao === 'temporada') return fmtReal(im.preco) + '/diária';
  return fmtReal(im.preco);
}
const TR = { venda: 'Venda', aluguel: 'Aluguel', temporada: 'Temporada' };
const tag = (sc, t) => `<span class="tag tag-${sc}">${esc(t)}</span>`;
function av(nome, extra) {
  const ini = nome.split(/\s+e\s+|\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');
  const cls = /rafael/i.test(nome) ? 'r' : (/adriana/i.test(nome) ? '' : 'p');
  return `<span class="av ${cls} ${extra || ''}" title="${esc(nome)}" aria-label="${esc(nome)}">${esc(ini)}</span>`;
}
const CALOR = { quente: ['c3', 'quente'], morno: ['c2', 'morno'], frio: ['c1', 'frio'] };
function calor(t, semTexto) {
  const c = CALOR[t] || CALOR.frio;
  return `<span class="temp ${t}"><span class="calor ${c[0]}" aria-hidden="true"><i></i><i></i><i></i></span>${semTexto ? '' : esc(c[1])}</span>`;
}
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const SETA = 'M5 12h14M13 6l6 6-6 6';
function proxHtml(p) {
  if (!p) return '';
  return `<span class="prox ${p.atraso ? 'atraso' : ''}">${svg(SETA)}<span>${esc(p.o)}${p.quando ? ' · ' + esc(p.quando) : ''}</span></span>`;
}
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 3200); }

/* ---------- a história de cada imóvel (overlay sobre o catálogo) ---------- */
const AUT_TXT = { ok: ['assinada', 'ok'], vence: ['vence', 'bad'], falta: ['sem autorização assinada', 'bad'], loc: ['contrato de administração', 'ok'], vendido: ['encerrada · vendido', 'neu'] };
function hist(ref) {
  const o = DEMO.imoveis[ref];
  if (o) return o;
  const n = parseInt(ref, 10) || 0, im = imv(ref);
  const resp = n % 3 === 0 ? 'Rafael' : 'Adriana';
  const loc = im && im.transacao !== 'venda';
  return { resp, cap: resp === 'Rafael' ? 'Rafael Costa' : 'Adriana', aut: loc ? 'loc' : 'ok', autDe: loc ? '2025' : (String(10 + (n % 18)).padStart(2, '0') + '/0' + (1 + (n % 7)) + '/2026'), autAte: loc ? 'renovação anual' : (String(10 + (n % 18)).padStart(2, '0') + '/0' + (1 + (n % 7)) + '/2027'), excl: n % 2 ? 'Com exclusividade' : 'Sem exclusividade', dono: 'd-generico', chaves: 'Na loja', obs: '—', visitas: '—', hist: [], derivado: true };
}
function autTag(h) {
  const a = AUT_TXT[h.aut] || AUT_TXT.ok;
  const t = h.aut === 'ok' ? 'autorização até ' + h.autAte : (h.aut === 'vence' ? 'vence ' + h.autAte + ' · renovar' : a[0]);
  return tag(a[1], t);
}
const podeVer = h => dona() || h.resp === EU();

/* ---------- o cruzamento imóvel × pessoa (a mesma regra vale nos dois lados) ---------- */
function combina(p, im) {
  const f = p.perfil;
  if (!f || !im || f.neg !== im.transacao) return null;
  const crit = [];
  crit.push({ ok: !f.max || (im.preco != null && im.preco <= f.max), t: 'até ' + fmtMil(f.max) + (im.transacao === 'aluguel' ? '/mês' : im.transacao === 'temporada' ? '/diária' : '') });
  if (f.bairros && f.bairros.length) crit.push({ ok: f.bairros.includes(im.bairro), t: f.bairros.join(' ou ') });
  if (f.tipos && f.tipos.length) crit.push({ ok: f.tipos.includes(im.tipo), t: f.tipos.join(' / ') });
  if (f.dorm) crit.push({ ok: (im.dorm || 0) >= f.dorm, t: f.dorm + '+ dorm' });
  if (f.extra) { const re = new RegExp(f.extra, 'i'); crit.push({ ok: (im.caracteristicas || []).concat(im.comodos || []).some(c => re.test(c)), t: f.extra }); }
  const n = crit.filter(c => c.ok).length;
  return { n, total: crit.length, crit, ok: n >= Math.max(2, crit.length - 1) && crit[0].ok };
}
function quemCombina(im) {
  return DEMO.pessoas.map(p => ({ p, m: combina(p, im) })).filter(x => x.m && x.m.ok).sort((a, b) => b.m.n - a.m.n);
}
function imoveisQueCombinam(p, n) {
  const l = IMOVEIS.map(im => ({ im, m: combina(p, im) })).filter(x => x.m && x.m.ok);
  l.sort((a, b) => (b.m.n - a.m.n) || ((a.im.preco || 0) - (b.im.preco || 0)));
  return n ? l.slice(0, n) : l;
}

/* ---------- negócios (com o que a pessoa já mexeu na demonstração) ---------- */
function deals() {
  return DEMO.negocios.filter(d => !P.ganhos.some(g => g.id === d.id) && !P.perdidos[d.id]).map(d => {
    const p = pessoa(d.pessoa);
    const etapa = P.moves[d.id] != null ? P.moves[d.id] : d.etapa;
    const dias = P.moves[d.id] != null ? 0 : d.dias;
    return Object.assign({}, d, { p, etapa, dias, resp: p.resp, im: imv(d.ref) });
  });
}
function capts() { return DEMO.captacoes.map(c => Object.assign({}, c, { etapa: P.moves[c.id] != null ? P.moves[c.id] : c.etapa, dias: P.moves[c.id] != null ? 0 : c.dias })); }
function valorNeg(d) {
  if (d.tipo === 'aluguel') return fmtReal(d.valor) + '<small>/mês</small>';
  if (d.tipo === 'temporada') return fmtMil(d.valor) + (d.extra ? ' <small>· ' + esc(d.extra) + '</small>' : '');
  return fmtMil(d.valor) + (d.extra && d.ref ? ' <small>· ' + esc(d.extra) + '</small>' : '');
}
function rateio(tipo, valor, vendeu, captou, capExterno) {
  const r = DEMO.comissao[tipo] || DEMO.comissao.venda;
  const com = valor * r.pct;
  const mesma = vendeu === captou;
  return { pct: r.pct === 1 ? '1º aluguel' : Math.round(r.pct * 100) + '% ' + r.base, com, ad7: com * r.partes.ad7, vend: com * r.partes.vendeu, cap: com * r.partes.captou, vendeu, captou, mesma, capExterno, pctAd7: r.partes.ad7, pctV: r.partes.vendeu, pctC: r.partes.captou };
}
function ganhos() { return DEMO.ganhos.concat(P.ganhos); }
function esfriando() { return deals().filter(d => d.dias > 5 && minha(d.resp)); }

/* ---------- rota ---------- */
function rota() {
  const h = location.hash.replace(/^#\/?/, '');
  const [tela, param] = h.split('/');
  let t = tela || 'hoje';
  if (!dona() && !SO_CORRETOR.includes(t) && !['imovel', 'pessoa', 'dono'].includes(t)) t = 'hoje';
  return { tela: t, param: param ? decodeURIComponent(param) : '' };
}
const ir = h => { location.hash = h; };

/* ---------- entrada (na demonstração qualquer senha entra; no app de verdade é a conta dela) ---------- */
function vEntrar() {
  return `<div class="entrar-fundo"><form class="entrar-caixa" id="entrar-form" aria-label="Entrar na gestão">
    <img src="../arte/logo.png" srcset="../arte/logo@2x.png 2x" alt="AD7 Imóveis" style="height:64px;width:auto;align-self:center">
    <div style="text-align:center"><h1 style="font-size:22px">Equipe AD7</h1><div class="sm" style="margin-top:4px">O site, por dentro. Só quem tem login entra.</div></div>
    <label for="e-mail" class="sm b">E-mail</label><input id="e-mail" class="inp" type="email" autocomplete="username" value="adriana@ad7imoveis.com.br" required>
    <label for="e-senha" class="sm b">Senha</label><input id="e-senha" class="inp" type="password" autocomplete="current-password" placeholder="na demonstração, qualquer senha" required>
    <button type="submit" class="btn btn-navy" style="min-height:46px">Entrar</button>
    <a href="#" class="sm" style="text-align:center" data-act="toast" data-t="No app de verdade chega um link por e-mail para criar uma senha nova.">Esqueci a senha</a>
    <div style="border-top:1px solid var(--linha);padding-top:12px;display:flex;flex-direction:column;gap:8px"><div class="sm">Demonstração: veja o app como cada pessoa da equipe.</div><div class="chips"><button type="button" class="chip" data-act="entrar-como" data-v="dona">Adriana · dona</button><button type="button" class="chip" data-act="entrar-como" data-v="corretor">Rafael · corretor</button></div></div>
    <div class="sm" style="text-align:center">O captador externo não tem login: recebe a parte dele por e-mail.</div>
    <a href="../" class="sm" style="text-align:center">← Voltar ao site</a>
  </form></div>`;
}

/* ---------- balões de dica: um por tela, some no "Entendi", volta pelo menu ---------- */
const TUT = {
  hoje: ['O dia num olhar só.', 'Os quatro números em cima são o que precisa de você hoje. Toque em qualquer linha para abrir a pessoa ou o imóvel. "Esfriando" é negócio parado há mais de 5 dias; a assistente sugere o que fazer primeiro.'],
  imoveis: ['Os mesmos imóveis do site.', 'Busque por referência, bairro ou tipo e filtre por venda, temporada ou aluguel. Toque no imóvel para abrir a ficha. O que você mudar aqui muda no site e nos portais na hora.'],
  imovel: ['A ficha tem duas metades.', 'O que é público vai para o site. "Dados privativos" e "Documentos" só a dona e o responsável veem. Em "Quem combina" o app mostra quem da carteira procura um imóvel assim, pronto para mandar pelo WhatsApp.'],
  negocios: ['Seu funil de vendas.', 'Cada cartão é um negócio: foto do imóvel, temperatura (barrinhas), dias parados e o próximo passo. No computador, arraste o cartão para a etapa seguinte; no celular, toque em Avançar. Solte em "Ganhos" e o app calcula a comissão. O botão "Captação" mostra o funil de quem quer vender ou alugar com você.'],
  carteiras: ['Quem procura e quem tem imóvel.', 'Filtre por temperatura: quente primeiro. A fileira de fotos no fim de cada cartão são os imóveis do seu catálogo que combinam com a pessoa. Em "Proprietários" estão os donos, com a autorização de cada imóvel.'],
  pessoa: ['A ficha de quem procura.', 'O perfil de busca é o que o app cruza com o catálogo. A temperatura vem dos sinais (respondeu, abriu, visitou). O próximo passo já vem com a mensagem escrita: toque em "Mandar pelo WhatsApp" ou mude o texto.'],
  dono: ['A ficha do proprietário.', 'Os imóveis dele, a autorização com validade, a prestação de contas e o que a assistente sugere. Só a dona e o responsável pelo imóvel veem o telefone.'],
  entradas: ['Tudo que chegou, e onde foi parar.', 'Site, portais, WhatsApp e Instagram caem aqui. Cada linha mostra o que o app fez sozinho: virou negócio, captação ou chamado, e para quem foi pelo rodízio. Toque na linha para abrir a pessoa.'],
  agenda: ['Visitas, vistorias e plantão.', 'Cada um vê a própria agenda; a dona vê a de todos. O cliente recebe o lembrete por WhatsApp um dia antes e confirma com um toque.'],
  chamados: ['Manutenção e pedidos da Área do Cliente.', '2ª via, reembolso, chamado, desocupação, extrato, informe e vistoria chegam pelo site identificados pelo CPF. Marque como atendido ou mande para o prestador.'],
  locacoes: ['Fase seguinte, orçada à parte.', 'Boletos, repasses ao proprietário, reajuste e vistoria com fotos. Está aqui para você ver como fica.'],
  equipe: ['Quem entra e o que cada um vê.', 'Convide pelo e-mail. A regra de comissão você define uma vez e o app usa em todo fechamento. O rodízio decide para quem vai cada lead novo.'],
  portais: ['Os canais ligados ao app.', 'Portais, WhatsApp, Instagram, Google e assinatura digital. Verde é tudo certo; amarelo pede uma ação sua.'],
  privacidade: ['A LGPD no dia a dia.', 'Quem da equipe viu o quê, pedidos de titulares, o que o app apaga sozinho e os consentimentos. É o que te protege se alguém perguntar.'],
  mais: ['As outras abas.', 'No celular, o que não cabe na barra de baixo fica aqui.']
};
function balao(tela) {
  const t = TUT[tela]; if (!t || P.vistos[tela]) return;
  const topo = $('meio').querySelector('.topo'); if (!topo) return;
  topo.insertAdjacentHTML('afterend', `<div class="balao" role="note"><span class="bl-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.3 1 2.5h6c0-1.2.3-1.9 1-2.5A6 6 0 0 0 12 3z"/></svg></span><span class="bl-tx"><b>${esc(t[0])}</b> ${esc(t[1])}</span><span class="bl-ac"><button type="button" class="bl-btn" data-act="dica-ok" data-v="${tela}">Entendi</button><button type="button" class="bl-btn bl-todas" data-act="dica-nenhuma">Esconder todas</button></span></div>`);
}

/* ---------- menu lateral e barra do celular ---------- */
function renderLado() {
  const r = rota();
  const ativa = { imovel: 'imoveis', pessoa: 'carteiras', dono: 'carteiras' }[r.tela] || r.tela;
  const itens = (dona() ? MENU : MENU.filter(([id]) => SO_CORRETOR.includes(id)));
  const n = { negocios: deals().filter(d => minha(d.resp)).length, entradas: DEMO.entradas.filter(e => /hoje/.test(e.q)).length, chamados: DEMO.chamados.filter(c => c.sc !== 'ok').length + (P.chamado214 ? 1 : 0) };
  const esf = esfriando().length;
  $('lado').innerHTML = `
    <div class="marca"><img src="../arte/logo-claro.png" srcset="../arte/logo-claro@2x.png 2x" alt="AD7 Imóveis"><span><b>AD7 Gestão</b><small>${dona() ? 'Adriana · dona' : 'Rafael · corretor'}</small></span></div>
    <div class="rot">Ver o app como</div>
    <div class="vc-row"><button type="button" class="vc ${dona() ? 'on' : ''}" data-act="ver-como" data-v="dona">Adriana · dona</button><button type="button" class="vc ${dona() ? '' : 'on'}" data-act="ver-como" data-v="corretor">Rafael · corretor</button></div>
    ${itens.map(([id, label]) => `<a class="mi ${ativa === id ? 'on' : ''}" href="#/${id}">${svg(ICO[id])}<span>${label}</span>${id === 'negocios' && esf ? `<span class="n alerta" title="esfriando">${esf}</span>` : (n[id] ? `<span class="n">${n[id]}</span>` : '')}</a>`).join('')}
    <div class="rodape">${dona() ? 'Equipe: Adriana (dona) e Rafael (corretor). O captador externo não entra: recebe a parte dele por e-mail.' : 'Você vê o catálogo inteiro, os seus contatos e a sua parte da comissão. Dados do dono: só dos imóveis seus.'}</div>
    <a class="mi site" href="../">${svg('M4 12h16M12 4a16 16 0 0 1 0 16M12 4a16 16 0 0 0 0 16M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0')}<span>Ver o site</span></a>
    <button type="button" class="zerar" data-act="dica-todas">Mostrar as dicas de novo</button>
    <button type="button" class="zerar" data-act="sair">Sair</button>
    <button type="button" class="zerar" data-act="zerar">Demonstração · dados fictícios · recomeçar</button>`;
  const cel = [['hoje', 'Hoje'], ['imoveis', 'Imóveis'], ['negocios', 'Negócios'], ['carteiras', 'Carteiras'], ['mais', 'Mais']];
  $('barra-cel').innerHTML = cel.map(([id, l]) => `<a href="#/${id}" class="${ativa === id || (id === 'mais' && !['hoje', 'imoveis', 'negocios', 'carteiras'].includes(ativa)) ? 'on' : ''}">${svg(ICO[id])}${l}</a>`).join('');
}
function faixaCel() {
  return `<div class="demo-faixa"><img src="../arte/logo-claro.png" srcset="../arte/logo-claro@2x.png 2x" alt="AD7"><div class="vc-row"><button type="button" class="vc ${dona() ? 'on' : ''}" data-act="ver-como" data-v="dona">Adriana</button><button type="button" class="vc ${dona() ? '' : 'on'}" data-act="ver-como" data-v="corretor">Rafael</button></div></div>`;
}

/* ---------- HOJE ---------- */
function vHoje() {
  const ag = DEMO.agenda.filter(a => a.hoje && minha(a.r));
  const novos = deals().filter(d => d.etapa === 0 && minha(d.resp));
  const esf = esfriando();
  const vencendo = Object.keys(DEMO.imoveis).filter(ref => DEMO.imoveis[ref].aut === 'vence' && minha(DEMO.imoveis[ref].resp));
  const ent = DEMO.entradas.filter(e => dona() || (e.pessoa && pessoa(e.pessoa).resp === 'Rafael')).slice(0, 5);
  const sug = dona()
    ? [['p-juliana', 'Juliana Prado espera desde ontem 21:40 pela casa 406 para o réveillon. Mandar o total e as fotos da piscina agora.'], ['p-henrique', 'Henrique Sales e a Família Nogueira estão a R$ 15 mil de distância na 350. Uma ligação hoje fecha.'], ['d-jose', 'A autorização da 309 vence 02/11: mandar a renovação para o José assinar no celular, com o relatório das visitas.']]
    : [['p-ramos', 'A Família Ramos não confirmou a visita de hoje às 15:00 no 402. Mensagem pronta para confirmar.'], ['p-tiago', 'Tiago Moraes quer terreno até R$ 400 mil: o 120 (R$ 350 mil) cabe e nunca foi enviado.'], ['p-roberto', 'Roberto Nunes favoritou 3 aptos no site. Ligar hoje com os aptos do Centro até R$ 400 mil.']];
  return `${faixaCel()}
    <div class="topo"><div><h1>Hoje, ${esc(DEMO.hoje.texto)}</h1><div class="sm" style="margin-top:4px">${dona() ? 'Bom dia, Adriana. ' : 'Bom dia, Rafael. '}${ag.length} visita${ag.length === 1 ? '' : 's'}, ${novos.length} lead${novos.length === 1 ? '' : 's'} novo${novos.length === 1 ? '' : 's'}, ${esf.length} negócio${esf.length === 1 ? '' : 's'} esfriando.</div></div>
      <div class="acoes"><a class="btn btn-line" href="#/imoveis">+ Imóvel</a><a class="btn btn-line" href="#/carteiras">+ Pessoa</a><a class="btn btn-navy fica" href="#/agenda">+ Visita</a></div></div>
    <div class="grid4">
      <a class="kpi" href="#/agenda"><b class="num">${ag.length}</b><span>visitas hoje</span></a>
      <a class="kpi" href="#/negocios"><b class="num">${novos.length}</b><span>leads novos para responder</span></a>
      <a class="kpi ${esf.length ? 'alerta' : ''}" href="#/negocios"><b class="num">${esf.length}</b><span>negócios esfriando (5+ dias parados)</span></a>
      <a class="kpi ${vencendo.length ? 'alerta' : ''}" href="#/imoveis"><b class="num">${vencendo.length}</b><span>autorizações vencendo em 30 dias</span></a>
    </div>
    <div class="grid2">
      <div class="box"><h3>Agenda de hoje</h3>${ag.map(a => `<div class="row ${a.pessoa ? 'link' : ''}" ${a.pessoa ? `data-act="ir" data-h="#/pessoa/${a.pessoa}"` : ''}><span><b>${a.h}</b> · ${esc(a.t)} <span class="sm">· ${a.r}</span></span>${tag(a.sc, a.s)}</div>`).join('') || '<div class="sm">Nada marcado.</div>'}</div>
      <div class="box"><h3>Chegou pelos canais <span class="nota">· o app já pôs cada um no lugar</span></h3>${ent.map(e => `<div class="row ${e.pessoa ? 'link' : ''}" ${e.pessoa ? `data-act="ir" data-h="#/pessoa/${e.pessoa}"` : ''}><span><b>${esc(e.quem)}</b> · ${esc(e.tipo)} <span class="sm">· ${esc(e.canal)} · ${esc(e.q)}</span><br><span class="sm">${esc(e.fez)}</span></span>${tag(e.sc, e.canal === 'site' ? 'site' : e.canal)}</div>`).join('')}<a href="#/entradas" class="sm">Ver a caixa de entrada inteira</a></div>
      <div class="box"><h3>Esfriando <span class="nota">· parado há mais de 5 dias</span></h3>${esf.map(d => `<div class="row link" data-act="ir" data-h="#/pessoa/${d.pessoa}"><span><b>${esc(d.p.nome)}</b> · ${esc(d.im ? 'Ref. ' + d.im.ref + ' · ' + tituloCurto(d.im) : d.extra)}<br><span class="sm">${ET_VENDA[d.etapa]} há ${d.dias} dias · ${esc(d.p.prox.o)}</span></span><span class="dias tarde">${d.dias} dias</span></div>`).join('') || '<div class="sm">Nenhum. Tudo andando.</div>'}</div>
      <div class="box"><h3>Vence esta semana</h3>
        ${vencendo.map(ref => `<div class="row link" data-act="ir" data-h="#/imovel/${ref}"><span>Autorização de venda · casa Ref. ${ref} · ${esc(donoDe(DEMO.imoveis[ref].dono).nome)}</span>${tag('bad', 'vence 02/11 · renovar')}</div>`).join('')}
        ${dona() ? `<div class="row"><span>Boleto aluguel · Marta Lopes · casa R. das Gaivotas 112</span>${tag('warn', 'vence 30/10')}</div><div class="row"><span>Repasse de outubro · 14 proprietários</span>${tag('ok', 'pronto p/ gerar')}</div>` : ''}
        <div class="row link" data-act="ir" data-h="#/pessoa/p-patricia"><span>Proposta · casa Ref. 382 · Patrícia Mendes · resposta da dona</span>${tag('warn', 'até 28/10')}</div>
      </div>
      <div class="box ouro"><h3>A assistente sugere <span class="nota">· você decide, ela executa</span></h3>${sug.map(([id, t]) => `<div class="row link" data-act="ir" data-h="#/${id.startsWith('d-') ? 'dono' : 'pessoa'}/${id}"><span>${esc(t)}</span><span class="btn btn-line btn-p">Abrir</span></div>`).join('')}</div>
      <div class="box"><h3>Site e portais</h3><div class="row"><span>ZAP · VivaReal · OLX · Imovelweb</span>${tag('ok', '115 sincronizados 08:10')}</div><div class="row link" data-act="ir" data-h="#/imovel/391"><span>Casa Ref. 391 · Shangri-la · sem autorização assinada</span>${tag('bad', 'não vai pros portais')}</div><div class="row"><span>Site ad7imoveis.com.br · 116 imóveis · Área do Cliente</span>${tag('ok', 'no ar')}</div></div>
    </div>`;
}

/* ---------- IMÓVEIS ---------- */
function vImoveis() {
  const res = resumoCatalogo();
  const chips = [['', 'Todos', res.total], ['venda', 'Venda', res.porTransacao.venda || 0], ['temporada', 'Temporada', res.porTransacao.temporada || 0], ['aluguel', 'Aluguel', res.porTransacao.aluguel || 0]];
  return `${faixaCel()}
    <div class="topo"><h1>Imóveis <small>· ${res.total} no catálogo, os mesmos do site</small></h1><div class="acoes"><label for="bq" class="oculto">Buscar</label><input id="bq" class="inp" type="search" placeholder="Ref., bairro, tipo…" value="${esc(S.q)}" style="width:220px"><button type="button" class="btn btn-navy fica">+ Novo imóvel</button></div></div>
    <div class="chips">${chips.map(([v, l, n]) => `<button type="button" class="chip ${S.neg === v ? 'on' : ''}" data-act="neg" data-v="${v}">${l} <span class="n">${n}</span></button>`).join('')}<span class="dica">${dona() ? 'Você vê tudo de todos.' : 'Você vende qualquer imóvel; dono, chaves e documentos só dos seus.'} Toque para abrir a ficha.</span></div>
    <div class="cards" id="lista-imoveis">${cardsImoveis()}</div>`;
}
function cardsImoveis() {
  const lista = filtrar({ neg: S.neg, q: S.q });
  if (!lista.length) return '<div class="sm">Nenhum imóvel com essa busca.</div>';
  return lista.map(im => { const h = hist(im.ref); return `<button type="button" class="card" data-act="ir" data-h="#/imovel/${esc(im.ref)}"><img src="${esc(capa(im))}" alt="" loading="lazy"><span class="cb"><span class="l1"><b>Ref. ${esc(im.ref)}</b>${tag(im.transacao === 'venda' ? 'neu' : 'gold', TR[im.transacao])}</span><span class="t">${esc(tituloCurto(im))}</span><span class="v num">${esc(precoIm(im))}</span><small>${esc(h.resp)} cuida · captou ${esc(h.cap.split(' ')[0])}</small>${autTag(h)}</span></button>`; }).join('');
}

function vImovel(ref) {
  const im = imv(ref);
  if (!im) return `${faixaCel()}<div class="topo"><h1>Imóvel não encontrado</h1></div><a href="#/imoveis" class="btn btn-line">← Imóveis</a>`;
  const h = hist(ref), pode = podeVer(h), d = h.dono ? donoDe(h.dono) : null;
  const fotos = (im.fotos || []).slice(0, 5);
  const aba = S.aba || 'publico';
  const abas = [['publico', 'Público'], ['combina', 'Quem combina', quemCombina(im).length], ['priv', 'Dados privativos'], ['aut', 'Autorização e comissão'], ['docs', 'Documentos'], ['hist', 'Histórico']];
  const r = rateio(im.transacao, im.preco || 0, h.resp, h.cap, /externo/.test(h.cap));
  let corpo = '';
  if (aba === 'publico') corpo = `<div class="grid2">
      <div class="box"><h3>O que vai para o site e os portais</h3><div style="font-size:14px;line-height:1.6">${esc((im.descricao || '').slice(0, 600))}${(im.descricao || '').length > 600 ? '…' : ''}</div><div class="carac">${(im.comodos || []).concat(im.caracteristicas || []).slice(0, 12).map(c => tag('neu', c)).join('')}</div>${(im.proximidades || []).length ? `<div class="sm">Perto de: ${esc(im.proximidades.join(', '))}</div>` : ''}</div>
      <div class="box"><h3>Como está anunciado</h3><div class="row"><span>Site ad7imoveis.com.br</span>${h.aut === 'falta' ? tag('bad', 'segurado') : tag('ok', 'publicado')}</div><div class="row"><span>ZAP · VivaReal · OLX</span>${h.aut === 'falta' ? tag('bad', 'sem autorização') : (im.transacao === 'temporada' ? tag('neu', 'só site e OLX') : tag('ok', 'sincronizado 08:10'))}</div><div class="row"><span>Instagram</span>${tag('neu', 'card pronto para postar')}</div><div class="row"><span>Fotos</span><span class="sm">${(im.fotos || []).length} no anúncio</span></div><div class="row"><span>Favoritado no site</span><span class="sm">${(parseInt(ref, 10) % 7)} vezes nos últimos 30 dias</span></div></div>
    </div>`;
  else if (aba === 'combina') corpo = vQuemCombina(im);
  else if (aba === 'priv') corpo = pode ? `<div class="grid2">
      <div class="box"><h3>Proprietário <span class="nota">· só a dona e o responsável veem</span></h3><dl class="dl"><dt>Nome</dt><dd>${d ? `<a href="#/dono/${d.id}">${esc(d.nome)}</a>` : '—'}</dd><dt>Telefone</dt><dd>${esc(d ? d.tel : '—')}</dd><dt>E-mail</dt><dd>${esc(d ? d.mail : '—')}</dd><dt>Combinado</dt><dd>${esc(h.obs)}</dd></dl></div>
      <div class="box"><h3>Chaves e acesso</h3><dl class="dl"><dt>Chaves</dt><dd>${esc(h.chaves)}</dd><dt>Placa</dt><dd>${im.transacao === 'venda' ? 'Sim, na frente' : 'Não'}</dd><dt>Visita</dt><dd>Avisar o dono com 1 dia</dd></dl><div class="sm">Cada abertura desta aba fica registrada em Privacidade → "quem viu o quê".</div></div>
    </div>` : `<div class="box trancado"><h3>Dados do dono trancados</h3><div style="font-size:14px;line-height:1.6">Este imóvel é da carteira de <b>${esc(h.resp)}</b>. Você vende ele normalmente pelo catálogo; o contato do proprietário, as chaves e os documentos só a Adriana e o responsável veem. Para fazer uma visita, peça pelo assistente: ele agenda com o responsável sem mostrar o telefone do dono.</div><div><button type="button" class="btn btn-gold" data-act="pedir-visita" data-ref="${esc(ref)}">Pedir visita ao responsável</button></div></div>`;
  else if (aba === 'aut') corpo = `<div class="grid2">
      <div class="box"><h3>${im.transacao === 'venda' ? 'Autorização de venda' : 'Contrato de administração'}</h3><dl class="dl"><dt>Assinada em</dt><dd>${esc(h.autDe)}</dd><dt>Válida até</dt><dd>${esc(h.autAte)}</dd><dt>Exclusividade</dt><dd>${esc(h.excl)}</dd><dt>Comissão</dt><dd>${esc(r.pct)}</dd><dt>Documento</dt><dd>${autTag(h)}</dd></dl><div class="chips"><button type="button" class="btn btn-line btn-p">Ver o PDF assinado</button><button type="button" class="btn btn-line btn-p">Renovar (assinatura no celular)</button></div><div class="sm">Sem autorização assinada o imóvel não vai para os portais nem para o site. O app avisa 30 dias antes de vencer (Lei 6.530/78, art. 20).</div></div>
      <div class="box"><h3>Como a comissão se divide neste imóvel</h3><div class="row"><span>Comissão · ${esc(r.pct)}</span><b class="num">${fmtReal(r.com)}</b></div><div class="row"><span>AD7 Imóveis · ${Math.round(r.pctAd7 * 100)}%</span><span class="num">${fmtReal(r.ad7)}</span></div><div class="row"><span>Quem vender · ${Math.round(r.pctV * 100)}% <span class="sm">(${esc(h.resp)} é o responsável)</span></span><span class="num">${fmtReal(r.vend)}</span></div>${r.pctC ? `<div class="row"><span>Quem captou · ${Math.round(r.pctC * 100)}% · ${esc(h.cap)}</span><span class="num">${fmtReal(r.cap)}</span></div>` : ''}<div class="sm">Regra padrão da Equipe, sobre o preço de anúncio. Se a mesma pessoa captou e vendeu, as duas partes somam. Dá para mudar só neste imóvel.</div></div>
    </div>`;
  else if (aba === 'docs') corpo = pode ? `<div class="box tabela"><table><thead><tr><th>Documento</th><th>Quem vê</th><th>Situação</th><th>Guarda até</th></tr></thead><tbody>
      <tr><td><b>Matrícula atualizada</b></td><td>dona e responsável</td><td>${tag('ok', 'ok · 09/2026')}</td><td>venda + 5 anos</td></tr>
      <tr><td><b>IPTU 2026</b></td><td>dona e responsável</td><td>${tag('ok', 'quitado')}</td><td>venda + 5 anos</td></tr>
      <tr><td><b>${im.transacao === 'venda' ? 'Autorização de venda assinada' : 'Contrato de administração'}</b></td><td>dona e responsável</td><td>${autTag(h)}</td><td>venda + 5 anos</td></tr>
      <tr><td><b>Fotos privadas (planta, laudo)</b></td><td>dona e responsável</td><td>${tag('neu', '4 arquivos')}</td><td>até sair do catálogo</td></tr></tbody></table></div>`
    : `<div class="box trancado"><h3>Documentos trancados</h3><div class="sm">Só a Adriana e ${esc(h.resp)} veem os documentos deste imóvel.</div></div>`;
  else corpo = `<div class="box"><h3>Histórico</h3>${(h.hist || []).map(([q, t, s, sc]) => `<div class="linha"><span class="q">${esc(q)}</span><span class="tx">${esc(t)}</span>${tag(sc, s)}</div>`).join('') || '<div class="sm">Importado do Tecimob; o histórico começa quando o app entra no ar.</div>'}${dona() ? `<div class="linha"><span class="q">hoje 08:40</span><span class="tx">Adriana abriu os dados do dono</span><span class="sm">registro de acesso</span></div>` : ''}</div>`;
  return `${faixaCel()}
    <div class="topo"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><a class="btn btn-line btn-p" href="#/imoveis">← Imóveis</a><h1>Ref. ${esc(im.ref)} <small>· ${esc(tituloCurto(im))}</small></h1></div><div class="acoes"><a class="btn btn-wa" href="https://wa.me/?text=${encodeURIComponent('Olha este imóvel da AD7: Ref. ' + im.ref + ' · ' + tituloCurto(im) + ' · ' + precoIm(im) + ' · https://ad7.eugeniofim.com/#/imovel/' + im.ref)}" target="_blank" rel="noopener">Mandar no WhatsApp</a><button type="button" class="btn btn-navy">Editar</button></div></div>
    <div class="ftop">
      <div class="galeria"><img class="g1" src="${esc(fotos[0] || capa(im))}" alt="Foto principal do imóvel Ref. ${esc(im.ref)}"><div class="gs">${fotos.slice(1).map((u, i) => `<img src="${esc(u)}" alt="Foto ${i + 2} do imóvel" loading="lazy">`).join('')}</div></div>
      <div class="box"><div class="row" style="padding-top:0"><span class="preco num">${esc(precoIm(im))}</span>${tag(im.transacao === 'venda' ? 'neu' : 'gold', TR[im.transacao])}</div>
        <dl class="dl"><dt>Tipo</dt><dd>${esc(im.tipo)}${im.perfil ? ' · ' + esc(im.perfil) : ''}</dd><dt>Bairro</dt><dd>${esc(im.bairro || '')} · ${esc(im.cidade || '')}</dd><dt>Tamanho</dt><dd>${im.dorm ? im.dorm + ' dorm · ' : ''}${im.vagas ? im.vagas + ' vaga' + (im.vagas > 1 ? 's' : '') + ' · ' : ''}${esc(fmtArea(im.areaConstruida || im.areaTotal) || '—')}</dd><dt>Responsável</dt><dd>${esc(h.resp)}</dd><dt>Captado por</dt><dd>${esc(h.cap)}</dd><dt>Autorização</dt><dd>${autTag(h)}</dd><dt>Visitas</dt><dd>${esc(h.visitas)}</dd><dt>Combina com</dt><dd><a href="#/imovel/${esc(ref)}" data-act="aba" data-v="combina">${quemCombina(im).length} contato${quemCombina(im).length === 1 ? '' : 's'}</a></dd></dl></div>
    </div>
    <div class="abas">${abas.map(([id, l, n]) => `<button type="button" class="aba ${aba === id ? 'on' : ''}" data-act="aba" data-v="${id}">${l}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>
    ${corpo}`;
}
function vQuemCombina(im) {
  const todos = quemCombina(im);
  const meus = todos.filter(x => minha(x.p.resp));
  const outros = todos.length - meus.length;
  const enviados = Object.keys(P.enviados).filter(pid => (P.enviados[pid] || []).includes(im.ref));
  const queda = im.ref === '382';
  return `${queda ? `<div class="box ouro"><h3>Preço caiu em 02/10 <span class="nota">· de R$ 790 mil para R$ 750 mil</span></h3><div class="row"><span>${meus.length} contato${meus.length === 1 ? '' : 's'} que combina${meus.length === 1 ? '' : 'm'} ainda não ${meus.length === 1 ? 'recebeu' : 'receberam'} o preço novo.</span><button type="button" class="btn btn-gold btn-p" data-act="avisar-todos" data-ref="${esc(im.ref)}">Avisar pelo WhatsApp</button></div></div>` : ''}
    <div class="box"><h3>Quem combina com este imóvel <span class="nota">· cruzamento automático com o perfil de busca</span></h3>
      ${meus.map(({ p, m }) => `<div class="match"><span class="av ${p.resp === 'Rafael' ? 'r' : ''}">${esc(p.ini)}</span><span class="mt"><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b><a href="#/pessoa/${p.id}">${esc(p.nome)}</a></b>${calor(p.temp)}<span class="sm">· ${esc(p.resp)}</span></span><span class="crit">${m.crit.map(c => `<span class="c ${c.ok ? '' : 'nao'}">${c.ok ? '✓ ' : ''}${esc(c.t)}</span>`).join('')}</span></span><span class="pts">${m.n} de ${m.total}</span><span class="acoes">${enviados.includes(p.id) ? tag('ok', 'enviado') : `<button type="button" class="btn btn-line btn-p" data-act="mandar" data-p="${p.id}" data-ref="${esc(im.ref)}">Mandar</button>`}<button type="button" class="btn btn-line btn-p" data-act="visita" data-p="${p.id}" data-ref="${esc(im.ref)}">Visita</button></span></div>`).join('') || `<div class="sm">Ninguém da sua carteira combina com este imóvel agora.</div>`}
      ${outros ? `<div class="sm" style="padding-top:8px;border-top:1px solid var(--linha2)">Mais ${outros} contato${outros === 1 ? '' : 's'} da Adriana combina${outros === 1 ? '' : 'm'}: ela foi avisada. Você não vê o nome deles.</div>` : ''}
    </div>
    <div class="sm">Como o app decide: mesma finalidade (${esc(TR[im.transacao])}), preço dentro da faixa, bairro, tipo, quartos e o extra que a pessoa pediu. Quem bate em quase tudo aparece; quem muda o perfil muda a lista na hora.</div>`;
}

/* ---------- NEGÓCIOS (pipeline) ---------- */
function vNegocios() {
  const capt = S.funil === 'captacao';
  return `${faixaCel()}
    <div class="topo"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><h1>Negócios</h1><div class="seg" role="group" aria-label="Funil"><button type="button" class="${capt ? '' : 'on'}" data-act="funil" data-v="venda">Quem compra ou aluga</button><button type="button" class="${capt ? 'on' : ''}" data-act="funil" data-v="captacao">Captação</button></div></div>
      <div class="acoes">${!capt && dona() ? `<div class="seg" role="group" aria-label="De quem"><button type="button" class="${S.so === 'todos' ? 'on' : ''}" data-act="so" data-v="todos">Todos</button><button type="button" class="${S.so === 'meus' ? 'on' : ''}" data-act="so" data-v="meus">Só os meus</button></div>` : ''}<button type="button" class="btn btn-navy fica">+ Negócio</button></div></div>
    ${capt ? vCaptacao() : vFunilVenda()}`;
}
function filtroDeals() {
  return deals().filter(d => minha(d.resp) && (S.so === 'todos' || d.resp === EU()) && (S.tipo === 'todos' || d.tipo === S.tipo));
}
function cardDeal(d, cel) {
  const im = d.im;
  const foto = im ? `<img class="foto" src="${esc(capa(im))}" alt="" loading="lazy">` : `<span class="sem">${svg(ICO.imoveis)}sem imóvel ainda · ${esc(d.extra)}</span>`;
  return `<button type="button" class="kc ${d.dias > 5 ? 'esfria' : ''}" draggable="${cel ? 'false' : 'true'}" data-id="${d.id}" data-act="ir" data-h="#/pessoa/${d.pessoa}" aria-label="${esc(d.p.nome)}, ${ET_VENDA[d.etapa]}">
    ${foto}<span class="kb"><span class="nome">${esc(d.p.nome)}</span><span class="val num">${valorNeg(d)}${im ? ` <small>· Ref. ${esc(im.ref)}</small>` : ''}</span>
    <span class="meta">${calor(d.p.temp)}<span class="dias ${d.dias > 5 ? 'tarde' : ''}">${d.dias === 0 ? 'hoje' : d.dias + ' dia' + (d.dias === 1 ? '' : 's')}</span>${av(d.resp)}</span>
    ${proxHtml(d.p.prox)}
    ${cel ? `<span class="ac">${d.etapa < 4 ? `<span class="btn btn-line btn-p" data-act="avancar" data-id="${d.id}">Avançar →</span>` : ''}${d.etapa >= 3 ? `<span class="btn btn-gold btn-p" data-act="ganhar" data-id="${d.id}">Ganho ✓</span>` : ''}</span>` : ''}
    </span></button>`;
}
function vFunilVenda() {
  const lista = filtroDeals();
  const tipos = [['todos', 'Todos'], ['venda', 'Venda'], ['aluguel', 'Locação'], ['temporada', 'Temporada']];
  const cols = ET_VENDA.map((t, e) => { const cs = lista.filter(d => d.etapa === e); return { t, e, cs, soma: cs.reduce((s, d) => s + (d.tipo === 'venda' ? d.valor : 0), 0) }; });
  const gs = ganhos().filter(g => minha(g.vendeu));
  const somaG = gs.reduce((s, g) => s + g.valor, 0);
  const perd = DEMO.perdidos.filter(p => minha(p.resp)).length + Object.keys(P.perdidos).length;
  return `<div class="chips">${tipos.map(([v, l]) => `<button type="button" class="chip ${S.tipo === v ? 'on' : ''}" data-act="tipo" data-v="${v}">${l}</button>`).join('')}<span class="dica">${dona() ? 'No computador, arraste o cartão para mudar de etapa ou solte em Ganho e Perdido; no celular, toque em Avançar. Borda amarela = parado há mais de 5 dias.' : 'Só os seus negócios. No computador, arraste o cartão; no celular, toque em Avançar.'}</span></div>
    <div class="kan">${cols.map(c => `<div class="col" data-etapa="${c.e}"><div class="col-h"><b>${c.t}<span class="n num">${c.cs.length}</span></b><span class="num">${c.soma ? fmtMil(c.soma) : (c.cs.length ? 'locação / temporada' : '—')}</span></div>${c.cs.map(d => cardDeal(d)).join('')}</div>`).join('')}</div>
    <div class="kan-cel"><div class="etapas">${ET_VENDA.map((t, e) => `<button type="button" class="chip ${S.etapaCel === e ? 'on' : ''}" data-act="etapa-cel" data-v="${e}">${t} <span class="n">${cols[e].cs.length}</span></button>`).join('')}</div>${cols[S.etapaCel].cs.map(d => cardDeal(d, true)).join('') || '<div class="sm">Nada nesta etapa.</div>'}</div>
    <div class="ganhos">
      <div class="zona" data-zona="ganho"><h3><span>Ganhos em ${esc(DEMO.hoje.mes)} · ${gs.length}</span><span class="num" style="color:var(--tinta)">${fmtMil(somaG)}</span></h3><div class="fila">${gs.map(g => `<button type="button" class="gk" data-act="abrir-ganho" data-id="${g.id}"><img src="${esc(capa(imv(g.ref)))}" alt=""><span><b>${esc(g.titulo)}</b><small>${esc(g.data)} · ${esc(g.vendeu)} · ${fmtMil(g.valor)}</small></span></button>`).join('')}</div><div class="dica">Toque num ganho para ver o rateio. Arraste um negócio para cá quando fechar.</div></div>
      <div class="zona perd" data-zona="perdido"><h3><span>Perdidos · ${perd}</span></h3><div class="sm">${DEMO.perdidos.filter(p => minha(p.resp)).map(p => `${esc(p.nome)} · ${esc(p.motivo)}`).concat(Object.keys(P.perdidos).map(id => { const d = DEMO.negocios.find(x => x.id === id); return esc(pessoa(d.pessoa).nome) + ' · ' + esc(P.perdidos[id]); })).join('<br>')}</div><div class="dica">Motivo obrigatório ao sair do funil.</div></div>
    </div>`;
}
function vCaptacao() {
  const lista = capts().filter(c => minha(c.resp));
  const cols = ET_CAPT.map((t, e) => ({ t, e, cs: lista.filter(c => c.etapa === e) }));
  const card = (c, cel) => `<button type="button" class="kc capt" draggable="${cel ? 'false' : 'true'}" data-id="${c.id}" data-act="ir" data-h="${c.dono ? '#/dono/' + c.dono : '#/negocios'}"><span class="kb"><span class="nome">${esc(c.nome)}</span><span>${esc(c.o)}</span><span class="val num">${fmtMil(c.valor)} <small>· estimado</small></span><span class="meta"><span class="sm">${esc(c.origem)}</span><span class="dias ${c.alerta ? 'tarde' : ''}">${c.dias === 0 ? 'hoje' : c.dias + ' dias'}</span>${av(c.resp)}</span><span class="prox ${c.alerta ? 'atraso' : ''}">${svg(SETA)}<span>${esc(c.prox)}</span></span>${cel && c.etapa < 3 ? `<span class="ac"><span class="btn btn-line btn-p" data-act="avancar-capt" data-id="${c.id}">Avançar →</span></span>` : ''}</span></button>`;
  return `<div class="dica">Quem tem imóvel para vender ou alugar com a AD7. A autorização assinada é o que libera o anúncio no site e nos portais.</div>
    <div class="kan c4">${cols.map(c => `<div class="col" data-etapa="${c.e}" data-capt="1"><div class="col-h"><b>${c.t}<span class="n num">${c.cs.length}</span></b><span class="num">${c.cs.length ? fmtMil(c.cs.reduce((s, x) => s + x.valor, 0)) : '—'}</span></div>${c.cs.map(x => card(x)).join('')}</div>`).join('')}</div>
    <div class="kan-cel"><div class="etapas">${ET_CAPT.map((t, e) => `<button type="button" class="chip ${S.etapaCel === e ? 'on' : ''}" data-act="etapa-cel" data-v="${e}">${t} <span class="n">${cols[e].cs.length}</span></button>`).join('')}</div>${(cols[Math.min(S.etapaCel, 3)].cs).map(x => card(x, true)).join('') || '<div class="sm">Nada nesta etapa.</div>'}</div>
    <div class="grid2"><div class="box"><h3>Entra sozinho na captação</h3><div class="row"><span>Site · "Anuncie seu imóvel"</span>${tag('site', 'site')}</div><div class="row"><span>WhatsApp e direct com "quero vender / alugar"</span>${tag('ok', 'o atendimento classifica')}</div><div class="row"><span>Autorização a vencer em 30 dias</span>${tag('warn', 'volta para Autorização')}</div></div>
    <div class="box"><h3>Ao anunciar, o app faz sozinho</h3><div class="row"><span>Imóvel no site e nos portais</span>${tag('ok', 'na hora')}</div><div class="row"><span>Cruza com a carteira e avisa quem combina</span>${tag('ok', 'automático')}</div><div class="row"><span>Placa, fotos e card do Instagram</span>${tag('neu', 'lista para o responsável')}</div></div></div>`;
}

/* ---------- CARTEIRAS ---------- */
function vCarteiras() {
  const proc = S.carteira === 'procura';
  const temps = [['todas', 'Todas'], ['quente', 'Quentes'], ['morno', 'Mornas'], ['frio', 'Frias']];
  return `${faixaCel()}
    <div class="topo"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><h1>Carteiras</h1><div class="seg" role="group" aria-label="Carteira"><button type="button" class="${proc ? 'on' : ''}" data-act="carteira" data-v="procura">Quem procura</button><button type="button" class="${proc ? '' : 'on'}" data-act="carteira" data-v="donos">Proprietários</button></div></div>
      <div class="acoes">${dona() ? `<div class="seg" role="group" aria-label="De quem"><button type="button" class="${S.so === 'todos' ? 'on' : ''}" data-act="so" data-v="todos">Carteira da AD7</button><button type="button" class="${S.so === 'meus' ? 'on' : ''}" data-act="so" data-v="meus">Minha carteira</button></div>` : ''}<button type="button" class="btn btn-navy fica">+ Pessoa</button></div></div>
    ${proc ? `<div class="chips">${temps.map(([v, l]) => `<button type="button" class="chip ${S.temp === v ? 'on' : ''}" data-act="temp" data-v="${v}">${l}</button>`).join('')}<span class="dica">${dona() ? 'Todos os contatos da AD7, com quem cuida de cada um.' : 'Só os seus contatos. Lead que caiu no seu rodízio aparece aqui na hora.'} A fileira de fotos é o que combina com a pessoa hoje.</span></div><div class="pcs">${cardsPessoas()}</div>
      <div class="sm">LGPD na prática: no primeiro contato só nome e telefone. CPF e renda entram apenas quando há proposta ou contrato, com aceite registrado e data. Lead sem negócio há 12 meses é apagado sozinho.</div>`
    : `<div class="dica">Quem tem imóvel com a AD7. Mais 98 proprietários vieram da importação do Tecimob sem ficha: o app pede os dados no primeiro contato.</div><div class="pcs">${cardsDonos()}</div>`}`;
}
function cardsPessoas() {
  const lista = DEMO.pessoas.filter(p => minha(p.resp) && (S.so === 'todos' || p.resp === EU()) && (S.temp === 'todas' || p.temp === S.temp));
  const ordem = { quente: 0, morno: 1, frio: 2 };
  lista.sort((a, b) => ordem[a.temp] - ordem[b.temp]);
  if (!lista.length) return '<div class="sm">Ninguém com esse filtro.</div>';
  return lista.map(p => {
    const comb = imoveisQueCombinam(p, 5), d = deals().find(x => x.pessoa === p.id);
    return `<button type="button" class="pc" data-act="ir" data-h="#/pessoa/${p.id}"><span class="pt"><span class="av g ${p.resp === 'Rafael' ? 'r' : ''}">${esc(p.ini)}</span><span class="nm"><b>${esc(p.nome)}</b><small>${esc(p.origem)} · entrou ${esc(p.entrou)}</small></span>${calor(p.temp)}</span>
      <span class="quer">${esc(querTexto(p))}</span>
      <span class="meta2"><span>${d ? ET_VENDA[d.etapa] + (d.dias ? ' há ' + d.dias + ' dias' : ' · hoje') : 'sem negócio aberto'}</span><span>último contato: ${esc(p.ultimo)}</span><span>cuida: ${esc(p.resp)}</span></span>
      ${proxHtml(p.prox)}
      <span class="fileira">${comb.slice(0, 4).map(x => `<img src="${esc(capa(x.im))}" alt="" title="Ref. ${esc(x.im.ref)}" loading="lazy">`).join('')}${comb.length > 4 ? `<span class="mais">+${comb.length - 4}</span>` : ''}${comb.length ? `<span class="mais">${comb.length} combina${comb.length === 1 ? '' : 'm'}</span>` : '<span class="zero">nada no catálogo combina ainda · captar</span>'}</span></button>`;
  }).join('');
}
function querTexto(p) {
  const f = p.perfil;
  const neg = { venda: 'Comprar', aluguel: 'Alugar', temporada: 'Temporada' }[f.neg];
  const faixa = f.neg === 'venda' ? 'até ' + fmtMil(f.max) : (f.neg === 'aluguel' ? 'até ' + fmtReal(f.max) + '/mês' : 'até ' + fmtReal(f.max) + '/diária');
  return `${neg} · ${f.tipos.join(' ou ').toLowerCase()}${f.dorm ? ' · ' + f.dorm + '+ quartos' : ''} · ${faixa} · ${f.bairros.join(' ou ')}${f.extra ? ' · ' + f.extra.toLowerCase() : ''}`;
}
function cardsDonos() {
  const lista = DEMO.donos.filter(d => d.id !== 'd-generico' && minha(d.resp) && (S.so === 'todos' || d.resp === EU()));
  return lista.map(d => {
    const ims = d.refs.map(imv).filter(Boolean);
    const alerta = d.refs.some(r => ['vence', 'falta'].includes(hist(r).aut));
    return `<button type="button" class="pc" data-act="ir" data-h="#/dono/${d.id}"><span class="pt"><span class="av g p">${esc(d.ini)}</span><span class="nm"><b>${esc(d.nome)}</b><small>com a AD7 desde ${esc(d.desde)} · cuida: ${esc(d.resp)}</small></span>${alerta ? tag('bad', 'autorização') : tag('ok', ims.length + ' imóve' + (ims.length === 1 ? 'l' : 'is'))}</span>
      <span class="fileira">${ims.map(im => `<img src="${esc(capa(im))}" alt="" title="Ref. ${esc(im.ref)}" loading="lazy">`).join('')}<span class="mais">${ims.map(im => 'Ref. ' + im.ref).join(' · ')}</span></span>
      <span class="refs">${d.refs.map(r => autTag(hist(r))).join('')}</span>
      ${d.sugere !== '—' ? `<span class="ia-diz"><span class="ia-b">IA</span><span>${esc(d.sugere)}</span></span>` : ''}</button>`;
  }).join('');
}

/* ---------- FICHA DA PESSOA ---------- */
function vPessoa(id) {
  const p = pessoa(id);
  if (!p || !minha(p.resp)) return `${faixaCel()}<div class="topo"><h1>Contato da carteira da Adriana</h1></div><div class="box trancado"><div class="sm">Você só vê os seus contatos. Este é de outra carteira.</div><a class="btn btn-line" href="#/carteiras" style="align-self:flex-start">← Carteiras</a></div>`;
  const d = deals().find(x => x.pessoa === id), f = p.perfil;
  const comb = imoveisQueCombinam(p);
  const aba = S.aba || 'linha';
  const enviados = P.enviados[id] || [];
  const zap = textoZap(p, comb[0] && comb[0].im);
  const abas = [['linha', 'Linha do tempo'], ['combina', 'Imóveis que combinam', comb.length], ['visitou', 'Visitou', p.visitou.length], ['dados', 'Dados e consentimento']];
  let corpo = '';
  if (aba === 'linha') corpo = `<div class="box">${(P.visitas[id] ? [[P.visitas[id].q, 'Visita marcada à Ref. ' + P.visitas[id].ref + ' (nesta demonstração)', 'visita', 'warn']] : []).concat(enviados.map(r => ['agora', 'Enviou a Ref. ' + r + ' pelo WhatsApp (nesta demonstração)', 'enviado', 'ok'])).concat(p.hist).map(([q, t, s, sc]) => `<div class="linha"><span class="q">${esc(q)}</span><span class="tx">${esc(t)}</span>${tag(sc, s)}</div>`).join('')}</div>`;
  else if (aba === 'combina') corpo = `<div class="box"><h3>Imóveis do catálogo que combinam <span class="nota">· o app refaz a lista a cada imóvel novo ou preço que muda</span></h3>${comb.map(({ im, m }) => `<div class="match"><img src="${esc(capa(im))}" alt=""><span class="mt"><b><a href="#/imovel/${esc(im.ref)}">Ref. ${esc(im.ref)} · ${esc(tituloCurto(im))}</a></b><span class="num" style="font-weight:800">${esc(precoIm(im))}</span><span class="crit">${m.crit.map(c => `<span class="c ${c.ok ? '' : 'nao'}">${c.ok ? '✓ ' : ''}${esc(c.t)}</span>`).join('')}</span></span><span class="pts">${m.n} de ${m.total}</span><span class="acoes">${enviados.includes(im.ref) ? tag('ok', 'enviado') : `<button type="button" class="btn btn-line btn-p" data-act="mandar" data-p="${id}" data-ref="${esc(im.ref)}">Mandar</button>`}<button type="button" class="btn btn-line btn-p" data-act="visita" data-p="${id}" data-ref="${esc(im.ref)}">Visita</button></span></div>`).join('') || `<div class="sm">Nada no catálogo bate com o perfil. É pedido de captação: o app já pôs "${esc(querTexto(p))}" na lista de procura da Equipe.</div>`}</div>`;
  else if (aba === 'visitou') corpo = `<div class="box">${p.visitou.map(([r, q, nota]) => { const im = imv(r); return `<div class="match"><img src="${esc(capa(im))}" alt=""><span class="mt"><b><a href="#/imovel/${r}">Ref. ${r} · ${esc(tituloCurto(im))}</a></b><span class="sm">${esc(q)} · ${esc(nota)}</span></span></div>`; }).join('') || '<div class="sm">Ainda não visitou nenhum imóvel.</div>'}</div>`;
  else corpo = `<div class="grid2"><div class="box"><h3>O que a AD7 guarda desta pessoa</h3><dl class="dl"><dt>Dados</dt><dd>${esc(p.dados)}</dd><dt>Para quê</dt><dd>atender o interesse em imóveis</dd><dt>Política</dt><dd>aceita em ${esc(p.entrou)} · versão 1.0</dd><dt>Marketing</dt><dd>${p.temp === 'frio' ? 'não aceitou' : 'aceitou novidades por WhatsApp'}</dd><dt>Apaga em</dt><dd>12 meses sem negócio</dd></dl></div><div class="box"><h3>Pedidos do titular</h3><div class="row"><span>Cópia dos dados</span><button type="button" class="btn btn-line btn-p">Gerar PDF</button></div><div class="row"><span>Apagar tudo (se não houver contrato)</span><button type="button" class="btn btn-line btn-p">Pedir confirmação</button></div><div class="sm">Quem da equipe abriu esta ficha fica em Privacidade → "quem viu o quê".</div></div></div>`;
  return `${faixaCel()}
    <div class="topo"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><a class="btn btn-line btn-p" href="#/carteiras">← Carteiras</a><span class="av g ${p.resp === 'Rafael' ? 'r' : ''}">${esc(p.ini)}</span><div><h1>${esc(p.nome)}</h1><div class="sm" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:2px">${calor(p.temp)}<span>· ${esc(p.origem)} · entrou ${esc(p.entrou)} · cuida: ${esc(p.resp)}</span>${d ? tag(d.dias > 5 ? 'warn' : 'neu', ET_VENDA[d.etapa] + (d.dias ? ' há ' + d.dias + ' dias' : ' · hoje')) : ''}</div></div></div>
      <div class="acoes"><a class="btn btn-wa fica" href="https://wa.me/?text=${encodeURIComponent(zap)}" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn btn-line" data-act="visita" data-p="${id}" data-ref="${esc(comb[0] ? comb[0].im.ref : '')}">Marcar visita</button><button type="button" class="btn btn-navy" data-act="aba" data-v="combina">Mandar imóveis</button></div></div>
    <div class="grid2">
      <div class="box"><h3>Perfil de busca <span class="nota">· é o que o app cruza com o catálogo</span></h3><dl class="dl"><dt>Quer</dt><dd>${esc({ venda: 'Comprar', aluguel: 'Alugar', temporada: 'Temporada' }[f.neg])}</dd><dt>Tipo</dt><dd>${esc(f.tipos.join(' ou '))}</dd><dt>Quartos</dt><dd>${f.dorm ? f.dorm + ' ou mais' : '—'}</dd><dt>Faixa</dt><dd>${esc(f.neg === 'venda' ? 'até ' + fmtReal(f.max) : (f.neg === 'aluguel' ? 'até ' + fmtReal(f.max) + '/mês' : 'até ' + fmtReal(f.max) + '/diária'))}</dd><dt>Onde</dt><dd>${esc(f.bairros.join(' ou '))}</dd><dt>Extra</dt><dd>${esc(f.extra || '—')}</dd><dt>Pagamento</dt><dd>${esc(f.paga)}</dd><dt>Prazo</dt><dd>${esc(f.prazo)}</dd></dl><div class="chips"><button type="button" class="btn btn-line btn-p">Editar o perfil</button></div></div>
      <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
        <div class="box"><h3>Temperatura: ${esc(p.temp)} <span class="nota">· calculada pelos sinais, você pode mudar</span></h3><div class="sinais">${p.sinais.map(s => `<span class="s">${esc(s)}</span>`).join('')}</div><div class="ia-diz"><span class="ia-b">IA</span><span>${esc(p.resumo)}</span></div></div>
        <div class="box ouro"><h3>Próximo passo sugerido</h3>${proxHtml(p.prox)}<div class="zap">${esc(zap)}</div><div class="chips"><a class="btn btn-wa btn-p" href="https://wa.me/?text=${encodeURIComponent(zap)}" target="_blank" rel="noopener">Mandar pelo WhatsApp</a><button type="button" class="btn btn-line btn-p">Mudar o texto</button><button type="button" class="btn btn-line btn-p">Deixar para amanhã</button></div></div>
      </div>
    </div>
    <div class="abas">${abas.map(([k, l, n]) => `<button type="button" class="aba ${aba === k ? 'on' : ''}" data-act="aba" data-v="${k}">${l}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>
    ${corpo}`;
}
function textoZap(p, im) {
  const nome = p.nome.split(' ')[0];
  const quem = EU();
  if (p.id === 'p-juliana') return `Oi, ${nome}! Aqui é ${quem}, da AD7. Para o réveillon (28/12 a 02/01, 8 pessoas) tenho a casa mobiliada com piscina em Pontal do Sul, Ref. 406: 7 diárias saem R$ 11.200, 50% na reserva. Mando as fotos da piscina?`;
  if (p.id === 'p-ramos') return `Oi! Aqui é ${quem}, da AD7. Confirmando a visita de hoje às 15:00 no sobrado de 4 quartos em Pontal do Sul (Ref. 402). Posso contar com vocês? Se preferirem outro horário, me diz.`;
  if (p.id === 'p-henrique') return `Oi, ${nome}! Aqui é ${quem}, da AD7. A família Nogueira respondeu à sua proposta pela casa Ref. 350: pediram R$ 795 mil. Estão a R$ 15 mil de você. Se eu levar R$ 788 mil, fechamos esta semana?`;
  if (p.id === 'p-patricia') return `Oi, ${nome}! Aqui é ${quem}, da AD7. Sua proposta de R$ 720 mil pela casa Ref. 382 está com a dona; ela responde até quarta (28/10). Assim que ela falar, te aviso na hora.`;
  if (p.id === 'p-livia') return `Oi, ${nome}! Aqui é ${quem}, da AD7. Você ainda está procurando casa para alugar em Pontal do Sul até R$ 2.000? Estou captando duas novas esta semana e queria te avisar primeiro.`;
  if (im) return `Oi, ${nome}! Aqui é ${quem}, da AD7. Separei um imóvel que bate com o que você procura: ${tituloCurto(im)}, Ref. ${im.ref}, ${precoIm(im)}. Veja as fotos: https://ad7.eugeniofim.com/#/imovel/${im.ref} — quer visitar?`;
  return `Oi, ${nome}! Aqui é ${quem}, da AD7. Vi o seu pedido e queria entender melhor o que você procura, para separar só o que faz sentido. Pode me dizer faixa de valor e bairro?`;
}

/* ---------- FICHA DO PROPRIETÁRIO ---------- */
function vDono(id) {
  const d = donoDe(id);
  if (!d || d.id === 'd-generico') return `${faixaCel()}<div class="topo"><h1>Proprietário</h1></div><div class="box"><div class="sm">Cadastro importado do Tecimob, ainda sem ficha. O app pede os dados no primeiro contato.</div><a class="btn btn-line" href="#/carteiras" style="align-self:flex-start">← Carteiras</a></div>`;
  if (!minha(d.resp)) return `${faixaCel()}<div class="topo"><h1>Proprietário da carteira da Adriana</h1></div><div class="box trancado"><div class="sm">Os dados deste proprietário só a Adriana e o responsável veem.</div><a class="btn btn-line" href="#/carteiras" style="align-self:flex-start">← Carteiras</a></div>`;
  const ims = d.refs.map(imv).filter(Boolean);
  return `${faixaCel()}
    <div class="topo"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><a class="btn btn-line btn-p" href="#/carteiras">← Carteiras</a><span class="av g p">${esc(d.ini)}</span><div><h1>${esc(d.nome)}</h1><div class="sm" style="margin-top:2px">proprietário · com a AD7 desde ${esc(d.desde)} · cuida: ${esc(d.resp)} · ${esc(d.tel)}</div></div></div>
      <div class="acoes"><a class="btn btn-wa fica" href="https://wa.me/" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn btn-line">Prestação de contas</button><button type="button" class="btn btn-navy">+ Imóvel dele</button></div></div>
    <div class="grid2">
      <div class="box"><h3>Imóveis com a AD7</h3>${ims.map(im => { const h = hist(im.ref); return `<div class="match"><img src="${esc(capa(im))}" alt=""><span class="mt"><b><a href="#/imovel/${esc(im.ref)}">Ref. ${esc(im.ref)} · ${esc(tituloCurto(im))}</a></b><span class="num" style="font-weight:800">${esc(precoIm(im))} <span class="sm" style="font-weight:600">· ${TR[im.transacao]} · ${esc(h.visitas)}</span></span><span>${autTag(h)}</span></span></div>`; }).join('') || '<div class="sm">Ainda sem imóvel anunciado.</div>'}</div>
      <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
        ${d.sugere !== '—' ? `<div class="box ouro"><h3>A assistente sugere</h3><div class="ia-diz"><span class="ia-b">IA</span><span>${esc(d.sugere)}</span></div><div class="chips"><button type="button" class="btn btn-gold btn-p">Preparar a mensagem</button><button type="button" class="btn btn-line btn-p">Depois</button></div></div>` : ''}
        <div class="box"><h3>Prestação de contas</h3><div style="font-size:13.5px">${esc(d.contas)}</div><div class="sm">Repasses, boletos e relatório mensal entram na fase de Locações. O proprietário acompanha pelo portal dele no site.</div></div>
      </div>
    </div>
    <div class="box"><h3>Linha do tempo</h3>${d.hist.map(([q, t, sc]) => `<div class="linha"><span class="q">${esc(q)}</span><span class="tx">${esc(t)}</span>${tag(sc, sc === 'warn' ? 'pendente' : sc === 'ok' ? 'feito' : 'registro')}</div>`).join('')}</div>`;
}

/* ---------- AGENDA · CAIXA DE ENTRADA · CHAMADOS · LOCAÇÕES ---------- */
function vAgenda() {
  const l = DEMO.agenda.filter(a => minha(a.r));
  return `${faixaCel()}<div class="topo"><h1>Agenda <small>· semana de 26 de outubro a 1º de novembro</small></h1><div class="acoes"><button type="button" class="btn btn-navy fica">+ Visita</button></div></div>
    <div class="box">${l.map(a => `<div class="row ${a.pessoa ? 'link' : ''}" ${a.pessoa ? `data-act="ir" data-h="#/pessoa/${a.pessoa}"` : ''}><span><b>${a.d} · ${a.h}</b> · ${esc(a.t)} <span class="sm">· ${a.r}</span></span>${tag(a.sc, a.s)}</div>`).join('')}${Object.keys(P.visitas).map(pid => `<div class="row link" data-act="ir" data-h="#/pessoa/${pid}"><span><b>${esc(P.visitas[pid].q)}</b> · Visita Ref. ${esc(P.visitas[pid].ref)} · ${esc(pessoa(pid).nome)} <span class="sm">· ${EU()}</span></span>${tag('warn', 'marcada nesta demonstração')}</div>`).join('')}</div>
    <div class="sm">Cada um vê a própria agenda; a Adriana vê a de todos. O cliente recebe lembrete por WhatsApp um dia antes e confirma com um toque. A visita feita vira registro na ficha da pessoa e do imóvel.</div>`;
}
function vEntradas() {
  let extra = [];
  try { extra = (JSON.parse(localStorage.getItem('ad7_pedidos_v1')) || []).slice(-5).reverse(); } catch (e) {}
  const l = DEMO.entradas.filter(e => dona() || (e.pessoa && pessoa(e.pessoa).resp === 'Rafael'));
  const DEST = { interesse: 'Negócio em Novo · rodízio', contato: 'Lead em Novo · rodízio', anuncio: 'Captação · Contato do dono', boleto: 'Chamado (financeiro)', reembolso: 'Chamado (financeiro)', chamado: 'Chamado (manutenção)', desocupacao: 'Locações · aviso de saída', extrato: 'Chamado (financeiro)', informe: 'Chamado (financeiro)', vistoria: 'Chamado (vistoria)' };
  return `${faixaCel()}<div class="topo"><h1>Caixa de entrada <small>· tudo que chegou e onde o app pôs</small></h1></div>
    ${extra.length && dona() ? `<div class="box ouro"><h3>Chegou agora pelo site desta demonstração</h3>${extra.map(p => `<div class="row"><span><b>${esc(p.nome)}</b> · ${esc(p.rotulo)}${p.imovelRef ? ' · Ref. ' + esc(p.imovelRef) : ''} <span class="sm">· site · ${new Date(p.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span><br><span class="sm">${esc(DEST[p.tipo] || 'Caixa de entrada')} · aceite da política ${p.consentimento && p.consentimento.politica ? 'gravado' : 'faltando'}</span></span>${tag('site', 'site')}</div>`).join('')}<div class="sm">É o mesmo pedido que você acabou de fazer no site: aqui, sem banco, ele fica só neste aparelho. Com a sala no Supabase, ele cai na tabela de pedidos e aparece para a equipe na hora.</div></div>` : ''}
    <div class="box tabela"><table><thead><tr><th>Quando</th><th>Canal</th><th>O que</th><th>Quem</th><th>Detalhe</th><th>O que o app fez</th></tr></thead><tbody>${l.map(e => `<tr class="${e.pessoa ? 'link' : ''}" ${e.pessoa ? `data-act="ir" data-h="#/pessoa/${e.pessoa}"` : ''}><td class="sm" style="white-space:nowrap">${esc(e.q)}</td><td>${tag(e.canal === 'site' ? 'site' : (e.canal === 'WhatsApp' ? 'ok' : 'neu'), e.canal)}</td><td><b>${esc(e.tipo)}</b></td><td>${esc(e.quem)}</td><td class="sm">${esc(e.det)}</td><td>${esc(e.fez)}</td></tr>`).join('')}</tbody></table></div>
    <div class="grid2"><div class="box"><h3>Do site vem</h3><div class="sm">Interesse em imóvel, contato, "Anuncie seu imóvel", simulação do Financie, favoritos e os 7 serviços da Área do Cliente: 2ª via, reembolso, chamado, desocupação, extrato, informe e vistoria. Cada um já nasce com o aceite da política e, nos serviços, o CPF do titular para achar o contrato.</div></div><div class="box"><h3>Regra do rodízio</h3><div class="row"><span>Site, ZAP, VivaReal, OLX e WhatsApp da loja</span>${tag('ok', '1º Adriana · 2º Rafael · alterna')}</div><div class="row"><span>Instagram e WhatsApp pessoal da Adriana</span>${tag('neu', 'sempre Adriana')}</div><div class="row"><span>Lead sem resposta em 2 horas</span>${tag('warn', 'passa para o próximo e avisa')}</div></div></div>`;
}
function vChamados() {
  const l = (P.chamado214 ? [DEMO.chamadoNovo] : []).concat(DEMO.chamados);
  return `${faixaCel()}<div class="topo"><h1>Chamados</h1><div class="acoes"><button type="button" class="btn btn-navy fica">+ Novo chamado</button></div></div>
    <div class="box tabela"><table><thead><tr><th>Nº</th><th>Imóvel</th><th>Quem pediu</th><th>Pedido</th><th>Com quem</th><th>Chegou por</th><th>Situação</th></tr></thead><tbody>${l.map(c => `<tr><td><b>${c.n}</b></td><td>${esc(c.im)}</td><td>${esc(c.q)}</td><td>${esc(c.p)}</td><td>${esc(c.pr)}</td><td class="sm">${esc(c.origem)}</td><td>${tag(c.sc, c.s)}</td></tr>`).join('')}</tbody></table></div>
    <div class="sm">Os pedidos da Área do Cliente do site (2ª via, reembolso, chamado, desocupação, extrato, informe, vistoria) caem aqui identificados pelo CPF do titular. O inquilino e o dono acompanham pelo portal; o prestador recebe o endereço e as fotos pelo WhatsApp.</div>`;
}
function vLocacoes() {
  return `${faixaCel()}<div class="topo"><h1>Locações <small>· 27 contratos</small></h1>${tag('gold', 'fase seguinte · orçada à parte')}</div>
    <div class="grid3"><div class="kpi"><b class="num">R$ 48.900</b><span>aluguéis de outubro · 25 de 27 pagos</span></div><div class="kpi"><b class="num">R$ 4.890</b><span>taxa de administração (10%)</span></div><div class="kpi alerta"><b class="num">2</b><span>em atraso · aviso automático enviado</span></div></div>
    <div class="box tabela"><table><thead><tr><th>Contrato</th><th>Imóvel</th><th>Inquilino</th><th>Aluguel</th><th>Boleto</th><th>Repasse ao dono</th><th>Vencimento</th></tr></thead><tbody>
      <tr><td>2024-017</td><td>Casa R. das Gaivotas 112</td><td>Marta Lopes</td><td>R$ 1.600</td><td>${tag('warn', 'vence 30/10')}</td><td>R$ 1.440 · após pagamento</td><td>Reajuste IPCA em nov.</td></tr>
      <tr><td>2026-011</td><td>Casa Ref. 407</td><td>Débora Antunes</td><td>R$ 2.200</td><td>${tag('neu', 'assina quinta')}</td><td>R$ 1.980 a partir de dez.</td><td>out/2029</td></tr>
      <tr><td>2023-031</td><td>Apto Ref. 221</td><td>Família Souza</td><td>R$ 950</td><td>${tag('neu', 'saindo · vistoria hoje')}</td><td>R$ 855</td><td>encerra 27/10</td></tr>
      <tr><td>2025-008</td><td>Apto Centro 12</td><td>Lucas Ferreira</td><td>R$ 1.350</td><td>${tag('ok', 'pago 05/10')}</td><td>${tag('ok', 'R$ 1.215 repassado')}</td><td>ago/2027</td></tr></tbody></table></div>
    <div class="sm">Boleto, repasse, vistoria com fotos e portal do proprietário e do inquilino: é o que o Tecimob não faz e a Casa Prates faz.</div>`;
}

/* ---------- EQUIPE · PORTAIS · PRIVACIDADE ---------- */
function vEquipe() {
  const c = DEMO.comissao;
  return `${faixaCel()}<div class="topo"><h1>Equipe e acessos</h1><div class="acoes"><label for="conv" class="oculto">E-mail de quem convidar</label><input id="conv" class="inp" type="email" placeholder="e-mail do corretor novo" style="width:220px"><button type="button" class="btn btn-navy fica">Convidar</button></div></div>
    <div class="box tabela"><table><thead><tr><th>Pessoa</th><th>Papel</th><th>O que vê</th><th>Último acesso</th><th></th></tr></thead><tbody>${DEMO.equipe.map(m => `<tr><td><b>${esc(m.nome)}</b><br><span class="sm">${esc(m.sub)}</span></td><td>${tag(m.papel === 'Dona' ? 'gold' : m.papel === 'Corretor' ? 'ok' : 'neu', m.papel)}</td><td style="max-width:380px">${esc(m.ve)}</td><td>${esc(m.ultimo)}</td><td><button type="button" class="btn btn-line btn-p">${m.papel === 'Corretor' ? 'Desligar acesso' : 'Editar'}</button></td></tr>`).join('')}</tbody></table></div>
    <div class="grid2">
      <div class="box"><h3>Quem pode o quê</h3><div class="box tabela" style="border:0"><table><thead><tr><th></th><th>Dona</th><th>Corretor</th><th>Captador externo</th></tr></thead><tbody>${DEMO.matriz.map(([o, d, cr, x]) => `<tr><td>${esc(o)}</td><td>${tag(d[1], d[0])}</td><td>${tag(cr[1], cr[0])}</td><td>${tag(x[1], x[0])}</td></tr>`).join('')}</tbody></table></div><div class="sm">A trava fica no banco, não só na tela: um corretor não consegue puxar os dados dos outros nem mexendo na programação.</div></div>
      <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
        <div class="box"><h3>Regra de comissão <span class="nota">· você define uma vez</span></h3><div class="row"><span><b>Venda</b> · ${Math.round(c.venda.pct * 100)}% do valor</span><span>AD7 <b>${c.venda.partes.ad7 * 100}%</b> · vendeu <b>${c.venda.partes.vendeu * 100}%</b> · captou <b>${c.venda.partes.captou * 100}%</b></span></div><div class="row"><span><b>Locação</b> · 1º aluguel</span><span>AD7 <b>${c.aluguel.partes.ad7 * 100}%</b> · corretor <b>${c.aluguel.partes.vendeu * 100}%</b></span></div><div class="row"><span><b>Temporada</b> · ${c.temporada.pct * 100}% das diárias</span><span>AD7 <b>${c.temporada.partes.ad7 * 100}%</b> · quem atendeu <b>${c.temporada.partes.vendeu * 100}%</b></span></div><div class="sm">Percentuais de exemplo; a Adriana ajusta. Vale como padrão e pode mudar imóvel por imóvel. No fechamento o app calcula a parte de cada um sozinho.</div></div>
        <div class="box"><h3>Rodízio de leads</h3><div class="row"><span>Site, ZAP, VivaReal, OLX e WhatsApp da loja</span>${tag('ok', '1º Adriana · 2º Rafael · alterna')}</div><div class="row"><span>Instagram e WhatsApp pessoal da Adriana</span>${tag('neu', 'sempre Adriana')}</div><div class="row"><span>Lead sem resposta em 2 horas</span>${tag('warn', 'passa para o próximo e avisa')}</div><div class="row"><span>Corretor desligado</span>${tag('neu', 'carteira volta para a Adriana')}</div></div>
      </div>
    </div>`;
}
function vPortais() {
  const cx = (t, d, s, sc) => `<div class="box"><h3>${t}</h3><div style="font-size:13.5px;line-height:1.5">${d}</div><span>${tag(sc, s)}</span></div>`;
  return `${faixaCel()}<div class="topo"><h1>Portais e canais</h1></div><div class="grid3">
    ${cx('ZAP · VivaReal · OLX', 'Feed atualizado a cada hora. 115 imóveis publicados, 1 segurado por falta de autorização.', 'sincronizado 08:10', 'ok')}
    ${cx('WhatsApp da AD7', 'Número na API oficial. Mensagens caem como lead com o imóvel de origem; fora do horário o atendimento responde e registra.', 'conectado', 'ok')}
    ${cx('Instagram @ad7imoveis', 'Direct vira lead. Cards de imóvel prontos para postar com um toque.', '2 imóveis sem post há 30 dias', 'warn')}
    ${cx('Google · Meu Negócio', 'Avaliações e horário da loja. Pedido de avaliação automático após a entrega das chaves.', '4,9 · 37 avaliações', 'ok')}
    ${cx('Assinatura digital', 'Autorizações de venda e contratos assinados no celular, com validade jurídica.', '1 autorização aguardando', 'neu')}
    ${cx('Site ad7imoveis.com.br', 'O site e esta gestão são o mesmo app: mudou aqui, mudou lá na hora. Pedidos da Área do Cliente caem na caixa de entrada.', 'no ar', 'ok')}</div>`;
}
function vPrivacidade() {
  return `${faixaCel()}<div class="topo"><h1>Privacidade e LGPD</h1></div><div class="grid2">
    <div class="box"><h3>Pedidos de titulares</h3><div class="row"><span>Cópia dos dados · Lucas Ferreira</span>${tag('warn', 'responder até 02/11')}</div><div class="row"><span>Exclusão · lead Ricardo A. (sem negócio)</span>${tag('ok', 'apagado 15/10')}</div></div>
    <div class="box"><h3>Expurgo automático</h3><div class="row"><span>Leads sem negócio há 12 meses</span>${tag('ok', '7 apagados este mês')}</div><div class="row"><span>Contratos encerrados: guarda 5 anos (fiscal), depois apaga</span>${tag('neu', 'regra ativa')}</div></div>
    <div class="box"><h3>Quem viu o quê</h3><div class="row"><span>Adriana abriu os dados do dono · casa Ref. 382</span><span class="sm">hoje 08:40</span></div><div class="row"><span>Rafael abriu os dados do dono · sobrado Ref. 402</span><span class="sm">hoje 07:55</span></div><div class="row"><span>Rafael tentou abrir o dono da casa Ref. 309 (não é dele)</span>${tag('bad', 'bloqueado')}</div></div>
    <div class="box"><h3>Consentimentos</h3><div class="row"><span>Marketing (novidades por WhatsApp)</span>${tag('neu', '61 pessoas aceitaram')}</div><div class="row"><span>Política de privacidade · versão 1.0</span>${tag('ok', 'publicada')}</div><div class="row"><span>Canal: privacidade@ad7imoveis.com.br</span>${tag('ok', 'Adriana responde')}</div></div></div>`;
}
function vMais() {
  const itens = (dona() ? MENU : MENU.filter(([id]) => SO_CORRETOR.includes(id))).filter(([id]) => !['hoje', 'imoveis', 'negocios', 'carteiras'].includes(id));
  return `${faixaCel()}<div class="topo"><h1>Mais</h1></div><div class="box" style="padding:6px 0">${itens.map(([id, l]) => `<a class="row link" href="#/${id}" style="padding:12px 16px;text-decoration:none;color:inherit"><span style="display:flex;gap:10px;align-items:center"><svg viewBox="0 0 24 24" width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:1.8" aria-hidden="true"><path d="${ICO[id]}"/></svg>${l}</span><span class="sm">›</span></a>`).join('')}<a class="row link" href="../" style="padding:12px 16px;text-decoration:none;color:var(--teal)">Ver o site</a><button type="button" class="row link" data-act="dica-todas" style="width:100%;border:0;background:none;padding:12px 16px;font:inherit;color:var(--suave)">Mostrar as dicas de novo</button><button type="button" class="row link" data-act="sair" style="width:100%;border:0;background:none;padding:12px 16px;font:inherit;color:var(--suave)">Sair</button><button type="button" class="row link" data-act="zerar" style="width:100%;border:0;background:none;padding:12px 16px;font:inherit;color:var(--suave)">Recomeçar a demonstração</button></div>`;
}

/* ---------- ASSISTENTE ---------- */
function renderIA() {
  const sug = dona()
    ? ['Abre um chamado pra Marta: vazamento na pia da cozinha', 'Quem combina com o sobrado 402?', 'Quanto o Rafael tem a receber este mês?', 'O que está esfriando?']
    : ['Quem combina com o 402?', 'Me passa o telefone do dono da casa 309', 'Quanto eu recebo do 269?', 'O que está esfriando?'];
  const chat = P.chat.filter(m => m.como === P.como);
  $('ia').innerHTML = `<div class="cab"><span class="ia-b">IA</span><span><b>Assistente da AD7</b><small>${dona() ? 'Alcança todas as abas · confirma antes de mudar' : 'Alcança só o que você pode ver · confirma antes de mudar'}</small></span><button type="button" class="btn btn-line btn-p fechar" data-act="ia-fechar" aria-label="Fechar o assistente">✕</button></div>
    <div class="conversa" id="conversa">${chat.length ? chat.map(m => m.de === 'u' ? `<div class="bal bal-u">${esc(m.t)}</div>` : (m.cartao ? cartaoHtml() : `<div class="bal bal-a">${m.html}</div>`)).join('') : `<div class="bal bal-a">${dona() ? 'Bom dia, Adriana. Eu leio e escrevo em todas as abas, mas antes de mudar qualquer dado eu mostro um cartão e você confirma. Experimente um dos botões.' : 'Bom dia, Rafael. Eu enxergo só o que você pode ver: os seus contatos, o catálogo e a sua parte da comissão. Experimente um dos botões.'}</div>`}</div>
    <div class="sugest">${sug.map(s => `<button type="button" data-act="ia-sug" data-t="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <form id="ia-form" aria-label="Escrever para o assistente"><label for="chat" class="oculto">Mensagem</label><input id="chat" class="inp" type="text" placeholder="Fala com o assistente…" autocomplete="off"><button type="submit" class="btn btn-navy btn-ico" aria-label="Enviar">${svg(SETA)}</button></form>`;
  const c = $('conversa'); c.scrollTop = c.scrollHeight;
}
function cartaoHtml() {
  return `<div class="cartao"><div class="t">${P.chamado214 ? 'Confirmado' : 'Vou fazer isso. Confirma?'}</div><div><b>Chamado de manutenção</b> · prioridade alta</div><div class="sm">Imóvel: casa R. das Gaivotas 112 · Quem pediu: Marta Lopes<br>Problema: vazamento na pia da cozinha<br>Prestador: Jorge Silva · pede orçamento primeiro</div>${P.chamado214 ? `<span>${tag('ok', 'chamado #214 aberto')}</span>` : `<div class="ac"><button type="button" class="btn btn-gold btn-p" data-act="ia-confirmar">Confirmar</button><button type="button" class="btn btn-line btn-p">Mudar algo</button></div>`}</div>`;
}
function responder(t) {
  const q = t.toLowerCase();
  const refM = q.match(/\b(\d{3})\b/);
  const im = refM ? imv(refM[1]) : null;
  const diz = (html) => P.chat.push({ de: 'a', html, como: P.como });
  P.chat.push({ de: 'u', t, como: P.como });
  if (/chamado|vazamento|marta/.test(q) && dona()) {
    diz(`Achei a <b>casa R. das Gaivotas 112</b> (contrato 2024-017), inquilina <b>Marta Lopes</b>, e o prestador <b>Jorge Silva (encanador)</b>. Vou abrir este chamado:`);
    P.chat.push({ de: 'a', cartao: true, como: P.como });
  } else if (/combina/.test(q) && im) {
    const todos = quemCombina(im), meus = todos.filter(x => minha(x.p.resp)), outros = todos.length - meus.length;
    diz(meus.length ? `${meus.length === 1 ? 'Um contato' : meus.length + ' contatos'} ${dona() ? 'da AD7' : 'seus'} combina${meus.length === 1 ? '' : 'm'} com a <b>Ref. ${im.ref}</b> (${esc(tituloCurto(im))}, ${esc(precoIm(im))}): ${meus.map(x => `<b>${esc(x.p.nome)}</b> (${x.m.n} de ${x.m.total})`).join(', ')}.${outros ? ` Mais ${outros} da carteira da Adriana, que já foi avisada.` : ''} Quer que eu monte a mensagem com as fotos?<div class="links"><a class="btn btn-line btn-p" href="#/imovel/${im.ref}" data-act="ir-aba" data-v="combina">Ver quem combina</a></div>` : `Ninguém ${dona() ? 'da carteira' : 'dos seus contatos'} combina com a Ref. ${im.ref} hoje. Quem muda o perfil de busca entra na lista na hora.`);
  } else if (/telefone|contato|dono|dona\b/.test(q) && im) {
    const h = hist(im.ref), d = donoDe(h.dono);
    diz(podeVer(h) ? `Dono da <b>Ref. ${im.ref}</b>: <b>${esc(d.nome)}</b>, ${esc(d.tel)}. Registrei que você abriu o contato (Privacidade → quem viu o quê).` : `A <b>Ref. ${im.ref}</b> é da carteira de <b>${esc(h.resp)}</b>, então o contato do dono eu não mostro. Posso <b>pedir a visita</b> para ${esc(h.resp)}: me diz o dia e a hora e eu já mando.`);
  } else if (/receb|comiss|ganh|quanto/.test(q)) {
    const quem = dona() ? (/rafael/.test(q) ? 'Rafael' : 'Adriana') : 'Rafael';
    const gs = ganhos().filter(g => g.vendeu === quem || (g.captou || '').startsWith(quem));
    const tot = gs.reduce((s, g) => { const r = rateio(g.tipo, g.valor, g.vendeu, g.captou, g.capExterno); return s + (g.vendeu === quem ? r.vend : 0) + ((g.captou || '').startsWith(quem) ? r.cap : 0); }, 0);
    diz(gs.length ? `${quem === 'Rafael' && !dona() ? 'Você tem' : quem + ' tem'} <b>${fmtReal(tot)}</b> a receber de ${gs.length} fechamento${gs.length === 1 ? '' : 's'} em ${DEMO.hoje.mes}: ${gs.map(g => { const r = rateio(g.tipo, g.valor, g.vendeu, g.captou, g.capExterno); return `<b>${esc(g.titulo)}</b> (${fmtReal((g.vendeu === quem ? r.vend : 0) + ((g.captou || '').startsWith(quem) ? r.cap : 0))})`; }).join(', ')}. Paga depois do registro da escritura.${dona() ? ' Quer que eu gere o recibo?' : ''}` : `Nenhum fechamento de ${quem} em ${DEMO.hoje.mes}.`);
  } else if (/esfri|parad/.test(q)) {
    const l = esfriando();
    diz(l.length ? `Parados há mais de 5 dias: ${l.map(d => `<b>${esc(d.p.nome)}</b> (${ET_VENDA[d.etapa]} há ${d.dias} dias, ${esc(d.p.prox.o.toLowerCase())})`).join('; ')}. Quer que eu prepare as mensagens?<div class="links"><a class="btn btn-line btn-p" href="#/negocios">Abrir o pipeline</a></div>` : 'Nada esfriando. Tudo andando.');
  } else if (/agenda|hoje|visita/.test(q)) {
    const ag = DEMO.agenda.filter(a => a.hoje && minha(a.r));
    diz(`Hoje: ${ag.map(a => `<b>${a.h}</b> ${esc(a.t)}`).join('; ')}.`);
  } else {
    diz(`Na demonstração eu respondo sobre quem combina com um imóvel, comissões, o que está esfriando e a agenda. No app de verdade uso o motor de IA do estúdio e alcanço ${dona() ? 'todas as abas' : 'tudo que você vê'}, sempre com o cartão de confirmação antes de mudar um dado.`);
  }
  salvarP(); renderIA();
}

/* ---------- MODAL (rateio / perdido) ---------- */
function modalRateio(g, novo) {
  const r = rateio(g.tipo, g.valor, g.vendeu, g.captou, g.capExterno);
  const im = imv(g.ref);
  $('modal').innerHTML = `<div class="caixa" role="dialog" aria-modal="true" aria-label="Fechamento"><div class="fx"><h2>${novo ? 'Negócio ganho · ' : 'Fechamento · '}${esc(g.titulo)}</h2><button type="button" class="btn btn-line btn-p" data-act="modal-fechar" aria-label="Fechar">✕</button></div>
    ${im ? `<div class="match" style="border:0;padding:0"><img src="${esc(capa(im))}" alt="" style="width:96px;height:72px"><span class="mt"><b>Ref. ${esc(im.ref)} · ${esc(tituloCurto(im))}</b><span class="sm">${esc(g.data)} · vendeu: ${esc(g.vendeu)} · captou: ${esc(g.captou)}</span></span></div>` : ''}
    <div class="grid2"><div class="box ouro"><h3>Rateio pela regra da Equipe</h3><div class="row"><span>Valor do negócio</span><b class="num">${fmtReal(g.valor)}</b></div><div class="row"><span>Comissão · ${esc(r.pct)}</span><b class="num">${fmtReal(r.com)}</b></div>
      ${dona() ? `<div class="row"><span>AD7 Imóveis · ${Math.round(r.pctAd7 * 100)}%</span><span class="num">${fmtReal(r.ad7)}</span></div><div class="row"><span>Quem vendeu · ${esc(g.vendeu)} · ${Math.round(r.pctV * 100)}%</span><span class="num">${fmtReal(r.vend)}</span></div>${r.pctC ? `<div class="row"><span>Quem captou · ${esc(g.captou)} · ${Math.round(r.pctC * 100)}%${r.mesma ? ' <span class="sm">· soma com a parte de quem vendeu</span>' : ''}</span><span class="num">${fmtReal(r.cap)}</span></div>` : ''}<div class="chips"><button type="button" class="btn btn-navy btn-p" data-act="modal-fechar">Marcar como pago</button><button type="button" class="btn btn-line btn-p">Recibo em PDF</button></div>`
      : `<div class="row"><span>Sua parte · ${Math.round(r.pctV * 100)}% de quem vendeu</span><b class="num">${fmtReal(g.vendeu === 'Rafael' ? r.vend : 0)}</b></div><div class="sm">Paga depois do registro da escritura. A parte da AD7 e do captador só a Adriana vê.</div>`}</div>
    <div class="box"><h3>O que o app fez sozinho ao fechar</h3><div class="row"><span>Imóvel saiu do site e dos portais</span>${tag('ok', 'feito')}</div><div class="row"><span>Comissão calculada pela regra da Equipe</span>${tag('ok', 'feito')}</div>${g.capExterno ? `<div class="row"><span>Aviso ao captador externo com a parte dele</span>${tag('ok', 'e-mail enviado')}</div>` : ''}<div class="row"><span>Pedido de avaliação no Google ao comprador</span>${tag('neu', 'em 7 dias')}</div>${g.tipo === 'aluguel' ? `<div class="row"><span>Contrato, 1º boleto e portal do inquilino</span>${tag('ok', 'gerados')}</div>` : ''}</div></div></div>`;
  $('modal').hidden = false;
}
function modalPerdido(d) {
  const motivos = ['comprou com outra imobiliária', 'desistiu de mudar', 'não conseguiu o financiamento', 'preço fora do orçamento', 'sumiu (sem resposta há 30 dias)'];
  $('modal').innerHTML = `<div class="caixa" role="dialog" aria-modal="true" aria-label="Negócio perdido"><div class="fx"><h2>Perdido · ${esc(d.p.nome)}</h2><button type="button" class="btn btn-line btn-p" data-act="modal-fechar" aria-label="Fechar">✕</button></div><div class="sm">Motivo obrigatório: é o que depois mostra onde a AD7 perde negócio.</div><div class="chips">${motivos.map(m => `<button type="button" class="chip" data-act="perder-ok" data-id="${d.id}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>`;
  $('modal').hidden = false;
}

/* ---------- ações ---------- */
function mover(id, etapa, capt) {
  if (capt) { P.moves[id] = etapa; salvarP(); render(); return; }
  const d = deals().find(x => x.id === id); if (!d) return;
  P.moves[id] = etapa; salvarP(); render();
  if (etapa === 2) toast('Visita: o app pede a data e manda o lembrete ao cliente um dia antes.');
  else if (etapa === 3) toast('Proposta: o app prepara o documento e avisa o dono.');
  else if (etapa === 4) toast('Fechamento: checklist de documentos e escritura na agenda.');
}
function ganhar(id) {
  const d = deals().find(x => x.id === id); if (!d) return;
  const h = d.im ? hist(d.im.ref) : { cap: d.resp };
  const g = { id, titulo: (d.im ? d.im.tipo + ' Ref. ' + d.im.ref : d.p.nome) + (d.tipo === 'temporada' ? ' · ' + d.extra : ''), ref: d.ref, tipo: d.tipo, valor: d.valor, data: 'hoje', vendeu: d.resp, captou: h.cap.replace(' Costa', '').replace(' (externo)', ''), capExterno: /externo/.test(h.cap) };
  P.ganhos.push(g); salvarP(); render(); modalRateio(g, true);
}
function bindDnd() {
  let arrasto = null, capt = false;
  document.querySelectorAll('.kc[draggable="true"]').forEach(el => {
    el.addEventListener('dragstart', e => { arrasto = el.dataset.id; capt = !!el.closest('[data-capt]'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', arrasto); } catch (x) {} el.classList.add('ghost'); $('app').classList.add('arrastando'); });
    el.addEventListener('dragend', () => { el.classList.remove('ghost'); $('app').classList.remove('arrastando'); document.querySelectorAll('.sobre').forEach(x => x.classList.remove('sobre')); });
  });
  document.querySelectorAll('.col[data-etapa], .zona[data-zona]').forEach(z => {
    z.addEventListener('dragover', e => { if (!arrasto) return; e.preventDefault(); z.classList.add('sobre'); });
    z.addEventListener('dragleave', () => z.classList.remove('sobre'));
    z.addEventListener('drop', e => {
      e.preventDefault(); z.classList.remove('sobre'); if (!arrasto) return;
      const id = arrasto; arrasto = null; $('app').classList.remove('arrastando');
      if (z.dataset.zona === 'ganho') { if (!capt) ganhar(id); else toast('Captação não tem "ganho": ela termina em Anunciado.'); }
      else if (z.dataset.zona === 'perdido') { const d = deals().find(x => x.id === id); if (d) modalPerdido(d); }
      else { const e2 = +z.dataset.etapa; if (!!z.dataset.capt === capt) mover(id, e2, capt); }
    });
  });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v;
  if (a === 'dica-ok') { P.vistos[v] = true; salvarP(); const b = el.closest('.balao'); if (b) b.remove(); return; }
  if (a === 'dica-nenhuma') { Object.keys(TUT).forEach(k => { P.vistos[k] = true; }); salvarP(); const b = el.closest('.balao'); if (b) b.remove(); toast('Dicas escondidas. Voltam pelo menu, em "Mostrar as dicas de novo".'); return; }
  if (a === 'dica-todas') { P.vistos = {}; salvarP(); render(); toast('As dicas voltaram em todas as telas.'); return; }
  if (a === 'entrar-como') { P.logado = true; P.como = v; salvarP(); render(); return; }
  if (a === 'sair') { P.logado = false; salvarP(); location.hash = '#/hoje'; render(); return; }
  if (a === 'toast') { e.preventDefault(); toast(el.dataset.t); return; }
  if (a === 'ver-como') { P.como = v; salvarP(); S.so = 'todos'; render(); return; }
  if (a === 'ir') { e.preventDefault(); ir(el.dataset.h); return; }
  if (a === 'ir-aba') { S.aba = v; return; }
  if (a === 'funil') { S.funil = v; S.etapaCel = 0; render(); return; }
  if (a === 'so') { S.so = v; render(); return; }
  if (a === 'tipo') { S.tipo = v; render(); return; }
  if (a === 'carteira') { S.carteira = v; render(); return; }
  if (a === 'temp') { S.temp = v; render(); return; }
  if (a === 'etapa-cel') { S.etapaCel = +v; render(); return; }
  if (a === 'aba') { e.preventDefault(); S.aba = v; render(); window.scrollTo({ top: Math.min(window.scrollY, 420) }); return; }
  if (a === 'neg') { S.neg = v; render(); return; }
  if (a === 'abrir-ganho') { const g = ganhos().find(x => x.id === el.dataset.id); if (g) modalRateio(g); return; }
  if (a === 'avancar') { const d = deals().find(x => x.id === el.dataset.id); if (d) mover(d.id, Math.min(4, d.etapa + 1)); return; }
  if (a === 'avancar-capt') { const c = capts().find(x => x.id === el.dataset.id); if (c) mover(c.id, Math.min(3, c.etapa + 1), true); return; }
  if (a === 'ganhar') { ganhar(el.dataset.id); return; }
  if (a === 'perder-ok') { P.perdidos[el.dataset.id] = el.dataset.m; salvarP(); $('modal').hidden = true; render(); toast('Saiu do funil com o motivo registrado.'); return; }
  if (a === 'modal-fechar') { $('modal').hidden = true; return; }
  if (a === 'mandar') { const pid = el.dataset.p, ref = el.dataset.ref; P.enviados[pid] = (P.enviados[pid] || []).concat([ref]); salvarP(); render(); toast('Ref. ' + ref + ' enviada por WhatsApp para ' + pessoa(pid).nome.split(' ')[0] + ' e registrada na ficha.'); return; }
  if (a === 'avisar-todos') { const im = imv(el.dataset.ref); quemCombina(im).filter(x => minha(x.p.resp)).forEach(x => { P.enviados[x.p.id] = (P.enviados[x.p.id] || []).concat([im.ref]); }); salvarP(); render(); toast('Preço novo enviado a quem combina. Cada envio ficou na linha do tempo da pessoa.'); return; }
  if (a === 'visita') { const pid = el.dataset.p, ref = el.dataset.ref || '—'; P.visitas[pid] = { ref, q: 'Qui 29 · 10:00' }; salvarP(); render(); toast('Visita marcada quinta 29 às 10:00 na Ref. ' + ref + '. Lembrete por WhatsApp um dia antes.'); return; }
  if (a === 'pedir-visita') { toast('Pedido enviado ao responsável pela Ref. ' + el.dataset.ref + '. O telefone do dono não foi mostrado.'); return; }
  if (a === 'ia-sug') { responder(el.dataset.t); return; }
  if (a === 'ia-confirmar') { P.chamado214 = true; P.chat.push({ de: 'a', html: 'Pronto: <b>chamado #214</b> aberto, já aparece na aba Chamados e no portal da Marta. Preparei a mensagem para o Jorge no WhatsApp com o endereço; você só aperta enviar.<div class="links"><a class="btn btn-line btn-p" href="#/chamados">Ver o chamado</a><a class="btn btn-wa btn-p" href="https://wa.me/" target="_blank" rel="noopener">WhatsApp do Jorge</a></div>', como: P.como }); salvarP(); render(); return; }
  if (a === 'ia-abrir') { $('app').classList.add('ia-aberta'); return; }
  if (a === 'ia-fechar') { $('app').classList.remove('ia-aberta'); return; }
  if (a === 'zerar') { localStorage.removeItem(PKEY); P = carregarP(); S.aba = ''; location.hash = '#/hoje'; render(); toast('Demonstração recomeçada.'); return; }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'entrar-form') { e.preventDefault(); P.logado = true; P.como = 'dona'; salvarP(); render(); toast('Bom dia, Adriana. Na demonstração qualquer senha entra; no app de verdade é a senha da sua conta.'); return; }
  if (e.target.id !== 'ia-form') return;
  e.preventDefault(); const i = $('chat'); const t = i.value.trim(); if (!t) return; i.value = ''; responder(t);
});
document.addEventListener('input', e => {
  if (e.target.id !== 'bq') return;
  S.q = e.target.value; const l = $('lista-imoveis'); if (l) l.innerHTML = cardsImoveis();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) $('modal').hidden = true; });
$('ia-flut').addEventListener('click', () => $('app').classList.add('ia-aberta'));

/* ---------- render ---------- */
function render() {
  document.body.classList.toggle('entrar', !P.logado);
  if (!P.logado) { $('meio').innerHTML = vEntrar(); $('lado').innerHTML = ''; $('ia').innerHTML = ''; $('barra-cel').innerHTML = ''; document.title = 'AD7 Gestão · entrar'; return; }
  const r = rota();
  const chave = r.tela + '/' + r.param;
  if (chave !== S.rotaAnterior) { S.aba = ''; S.rotaAnterior = chave; window.scrollTo(0, 0); }
  const V = { hoje: vHoje, imoveis: vImoveis, negocios: vNegocios, carteiras: vCarteiras, agenda: vAgenda, entradas: vEntradas, chamados: vChamados, locacoes: vLocacoes, equipe: vEquipe, portais: vPortais, privacidade: vPrivacidade, mais: vMais };
  let html;
  if (r.tela === 'imovel') html = vImovel(r.param);
  else if (r.tela === 'pessoa') html = vPessoa(r.param);
  else if (r.tela === 'dono') html = vDono(r.param);
  else html = (V[r.tela] || vHoje)();
  $('meio').innerHTML = html;
  const bq = $('bq'); if (bq && S.q && document.activeElement !== bq) { /* mantém a busca */ }
  balao(r.tela);
  renderLado(); renderIA(); bindDnd();
  document.title = 'AD7 Gestão · ' + ({ hoje: 'Hoje', imoveis: 'Imóveis', imovel: 'Ref. ' + r.param, negocios: 'Negócios', carteiras: 'Carteiras', pessoa: 'Contato', dono: 'Proprietário', agenda: 'Agenda', entradas: 'Caixa de entrada', chamados: 'Chamados', locacoes: 'Locações', equipe: 'Equipe', portais: 'Portais e canais', privacidade: 'Privacidade', mais: 'Mais' }[r.tela] || r.tela);
}
window.addEventListener('hashchange', render);

(async function boot() {
  try {
    let r = await fetch('../dados/imoveis.json?v=0.3.0');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    IMOVEIS = (await r.json()).filter(im => im && im.publicado !== false);
  } catch (e) { IMOVEIS = []; }
  CAT.pronto = true;
  if (!location.hash) location.hash = '#/hoje';
  render();
})();

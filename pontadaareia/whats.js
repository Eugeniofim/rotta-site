/* =====================================================
   WHATSAPP — as conversas do número de atendimento (03/11/2026).
   O nome da imobiliária vem do config.js (APP_CONFIG.curto) e os exemplos são
   do teste do robô da Ponta da Areia.

   O robô responde 24 h num número que só existe na API da Meta: ninguém abre
   esse WhatsApp num celular. Esta tela é onde a equipe VÊ cada conversa, a
   ficha de quem quer visitar, reservar ou fazer proposta, e RESPONDE pelo
   mesmo número. Quem responde aqui assume a conversa: o robô fica quieto
   nela até alguém tocar em "Devolver ao robô" (ou 24 h depois, sozinho).

   De onde vem cada coisa (a sala do Supabase, só a conta dona lê — RLS):
     itens · whats_conversas   uma linha por número (o cofre grava a cada mensagem)
     itens · whats_msgs        uma linha por mensagem (cliente, robô, equipe)
     pedidos                   o lead que o robô anotou
   Para responder e para assumir/devolver: rota whats-enviar do cofre, com o
   login da dona (o cofre confere que ela é a dona da sala).

   Sem banco (demonstração), a tela mostra conversas de exemplo — os textos do
   robô são de um teste real (03/11/2026) com os 207 imóveis da API do site deles.
   ===================================================== */
'use strict';

const WZ = { lista: [], msgs: [], pedidos: [], leads: new Set(), erro: '', carregou: false, buscando: false, filtro: 'todas', timer: null, dona: null, enviando: false, ultimaRota: null };
const WZ_REAL = () => typeof temNuvem === 'function' && temNuvem() && typeof SUPA_SALA !== 'undefined' && !!SUPA_SALA;
const WZ_LOGADO = () => typeof isLoggedIn === 'function' && isLoggedIn();
const WZ_COFRE = () => String(SUPA_URL).replace(/\/+$/, '') + '/functions/v1/cofre';
const WZ_STATUS = [['novo', 'Novo'], ['em atendimento', 'Em atendimento'], ['visita marcada', 'Visita marcada'], ['proposta', 'Proposta'], ['atendido', 'Fechado'], ['perdido', 'Perdido']];
const WZ_DIA = 86400000;
const WZ_MARCA = (typeof APP_CONFIG !== 'undefined' && (APP_CONFIG.curto || APP_CONFIG.nome)) || 'imobiliária';

/* ---------- formatos ---------- */
function wzNum(n) {
  const d = String(n || '').replace(/\D/g, '');
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : (d ? '+' + d : '');
}
function wzQuando(iso) {
  if (!iso) return '';
  const d = new Date(iso), hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === new Date(hoje.getTime() - WZ_DIA).toDateString()) return 'ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
const wzHora = iso => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
const wzPausado = c => !!(c && c.robo === 'pausado' && c.pausadoAte && Date.parse(c.pausadoAte) > Date.now());
const wzNome = c => (c && (c.nome || wzNum(c.numero))) || '';
/* texto do robô com o link clicável (só links do próprio site e http(s)) */
const wzTexto = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');

/* ---------- dados de exemplo (sem banco) ---------- */
function wzDemo() {
  const h = (min) => new Date(Date.now() - min * 60000).toISOString();
  const conv = [
    { numero: '5541991234567', nome: 'Juliana', ultima: "Anotei tudo! A equipe da Ponta da Areia vai confirmar em seguida se a D050 está livre nessas datas, o valor final da sua reserva e como você faz o pagamento. El", ultimaEm: h(4), ultimaDir: 'robo', clienteEm: h(5), naoLidas: 3, robo: 'ligado' },
    { numero: '5541998887766', nome: 'Fernando', ultima: 'Oi Fernando, aqui é da Ponta da Areia! Sábado às 10h está confirmado no V024.', ultimaEm: h(40), ultimaDir: 'equipe', clienteEm: h(59), naoLidas: 0, robo: 'pausado', pausadoAte: new Date(Date.now() + 20 * 3600000).toISOString() },
    { numero: '5541995554433', nome: 'Marta', ultima: "Perfeito, Marta! Anotei tudo: sobrado de 3 quartos com piscina, perto da praia, no Atami Sul. A equipe da Ponta da Areia vai entrar em contato por aqui mesmo em", ultimaEm: h(190), ultimaDir: 'robo', clienteEm: h(192), naoLidas: 2, robo: 'ligado' },
  ];
  const m = (numero, dir, texto, min, extra) => Object.assign({ numero, dir, texto, quando: h(min) }, extra || {});
  /* os textos do robô são do teste de 03/11/2026 (clientes/simula-pontadaareia.mjs no cofre) */
  const msgs = [
    m('5541991234567', 'cliente', "Oi! Vocês têm casa com piscina no Atami pra 8 pessoas, de 10 a 17 de janeiro?", 9),
    m('5541991234567', 'robo', "Achei 49 casas com piscina no Atami para 8 pessoas! Aqui estão as primeiras:\n\nRef. D050 · Casa em Atami Norte com Piscina e Churrasqueira — 2 quartos, piscina, churrasqueira. R$ 1.100 por diária (7 noites = R$ 7.700 referência). https://www.pontadaareiaimoveis.com.br/imovel/excelente-sobrado-atami-norte-542\n\nRef. D035 · Casa em Atami Sul — 2 quartos, piscina, churrasqueira, perto do mar. R$ 1.350 por diária (7 noites = R$ 9.450 referência). https://www.pontadaareiaimoveis.com.br/imovel/excelente-casa-119\n\nRef. D019 · Casa Espaçosa em Atami Sul — 4 quartos, piscina, churrasqueira. R$ 1.500 por diária (7 noites = R$ 10.500 referência). https://www.pontadaareiaimoveis.com.br/imovel/excelente-casa-atami-sul-472\n\nOs preços que passei são diária × 7 noites, só pra você ter uma ideia. Se alguma dessas interessar, a equipe da Ponta da Areia confirma se está livre nessas datas e passa o valor final exato. Qual delas chamou sua atenção?", 8),
    m('5541991234567', 'cliente', "Quanto fica no total a primeira que você mandou?", 7),
    m('5541991234567', 'robo', "A D050 fica R$ 1.100 × 7 noites = R$ 7.700 como referência.\n\nMas janeiro é alta temporada, e muitas casas pedem um mínimo de 10 diárias nessa época — se for o caso dessa, o total pode ser diferente. A equipe da Ponta da Areia confirma o valor final exato e se ela está livre de 10 a 17 de janeiro. Quer que eu anote seu interesse?", 6),
    m('5541991234567', 'cliente', "Quero reservar essa. Meu nome é Juliana", 5),
    m('5541991234567', 'robo', "Anotei tudo! A equipe da Ponta da Areia vai confirmar em seguida se a D050 está livre nessas datas, o valor final da sua reserva e como você faz o pagamento. Eles respondem por aqui mesmo.", 4),
    m('5541998887766', 'cliente', "Boa tarde. Procuro um sobrado pra comprar em Pontal do Sul, até uns 600 mil. Dá pra financiar?", 62),
    m('5541998887766', 'robo', "Achei um sobrado ótimo na sua faixa:\n\nRef. V024 · Sobrado em Pontal do Sul, 1 quarto (1 suíte), 2 banheiros, garagem, 65,95 m² — cozinha e churrasqueira — R$ 450.000\nhttps://www.pontadaareiaimoveis.com.br/imovel/excelente-sobrado-325\n\nSobre financiamento: a Ponta da Areia tem corretores que ajudam do começo até a assinatura, simulação tudo. No anúncio dele não aparece se aceita, mas o corretor confirma na mesma hora. Taxa, prazo e aprovação quem define é o banco. Quer agendar uma visita ou quer conversar com um corretor sobre o financiamento?", 61),
    m('5541998887766', 'cliente', "Gostei do primeiro. Dá pra ver sábado às 10h? Sou o Fernando", 60),
    m('5541998887766', 'robo', "Anotei sua visita pro sábado às 10h no V024. A equipe da Ponta da Areia confirma em seguida por aqui mesmo. Qualquer dúvida sobre o sobrado ou o financiamento, é só chamar!", 59),
    m('5541995554433', 'cliente', "Olá, tenho uma casa no Atami Sul e queria colocar pra alugar na temporada. Vocês fazem?", 196),
    m('5541995554433', 'robo', "Já anotei aqui. A equipe da Ponta da Areia vai retornar com você em breve pra conversar sobre a avaliação e como colocar no ar.", 195),
    m('5541995554433', 'cliente', "É um sobrado de 3 quartos com piscina, perto da praia. Meu nome é Marta", 194),
    m('5541995554433', 'robo', "Perfeito, Marta! Anotei tudo: sobrado de 3 quartos com piscina, perto da praia, no Atami Sul. A equipe da Ponta da Areia vai entrar em contato por aqui mesmo em breve pra conversar sobre a avaliação e colocar seu imóvel na temporada. \n\nBoa sorte! 🏡", 193),
    m('5541998887766', 'equipe', 'Oi Fernando, aqui é da Ponta da Areia! Sábado às 10h está confirmado no V024. Te espero na loja de Pontal do Sul (Av. Beira Mar, 1792).', 40, { por: 'atendimento@pontadaareiaimoveis.com.br' }),
  ];
  const ped = [
    { id: 'demo-p1', telefone: '5541991234567', nome: 'Juliana', rotulo: 'Interesse em imóvel', imovelRef: 'D050', status: 'novo', mensagem: 'Juliana quer reservar a D050 (Atami Norte, piscina) para 8 pessoas de 10 a 17 de janeiro (7 noites). Referência: R$ 7.700.', extra: { Pedido: 'Reserva de temporada', Quando: '10/01 a 17/01' }, criadoEm: h(4),
      equipe: { avisados: ['Corretor de plantão'], falhou: [], em: h(4) } },
    { id: 'demo-p2', telefone: '5541998887766', nome: 'Fernando', rotulo: 'Interesse em imóvel', imovelRef: 'V024', status: 'visita marcada', mensagem: 'Fernando quer visitar o sobrado V024 em Pontal do Sul e pensa em financiar.', extra: { Pedido: 'Visita', Quando: 'sábado às 10h' }, criadoEm: h(59),
      equipe: { avisados: ['Corretor de plantão'], falhou: [], em: h(59), resposta: { acao: 'confirmado', por: 'Corretor de plantão', em: h(41), clienteAvisado: true } } },
    { id: 'demo-p3', telefone: '5541995554433', nome: 'Marta', rotulo: 'Anunciar imóvel', imovelRef: '', status: 'novo', mensagem: 'Marta tem um sobrado de 3 quartos com piscina, perto da praia, no Atami Sul, e quer alugar na temporada.', extra: { Pedido: 'Anunciar para temporada' }, criadoEm: h(190) },
  ];
  return { conv, msgs, ped };
}
let WZ_EXEMPLO = null;

/* ---------- banco ---------- */
async function wzLer(path) {
  const r = await supaFetch(path);
  if (r.status === 401) throw new Error('sessao');
  if (!r.ok) throw new Error('banco ' + r.status);
  return r.json();
}
async function wzCarregar(numero) {
  if (!WZ_REAL()) {
    WZ_EXEMPLO = WZ_EXEMPLO || wzDemo();
    WZ.lista = WZ_EXEMPLO.conv.slice().sort((a, b) => b.ultimaEm.localeCompare(a.ultimaEm));
    WZ.msgs = numero ? WZ_EXEMPLO.msgs.filter(m => m.numero === numero) : [];
    WZ.pedidos = numero ? WZ_EXEMPLO.ped.filter(p => p.telefone === numero) : [];
    WZ.leads = new Set(WZ_EXEMPLO.ped.filter(p => !['atendido', 'perdido'].includes(p.status)).map(p => p.telefone));
    WZ.carregou = true; return;
  }
  if (!WZ_LOGADO() || WZ.buscando) return;
  WZ.buscando = true;
  try {
    if (typeof authEnsure === 'function') await authEnsure();
    if (WZ.dona === null) {
      const c = await wzLer('app_config?id=eq.1&select=owner_uid').catch(() => []);
      WZ.dona = !!(c[0] && authUser() && c[0].owner_uid === authUser().id);
    }
    const [l, ab] = await Promise.all([
      wzLer('itens?colecao=eq.whats_conversas&apagado=eq.false&select=id,dados&order=atualizado_em.desc&limit=300'),
      /* quem tem lead em aberto (a etiqueta "lead" na lista) */
      wzLer('pedidos?select=tel:data->>telefone,st:data->>status&order=created_at.desc&limit=500').catch(() => []),
    ]);
    WZ.leads = new Set(ab.filter(x => x.tel && !['atendido', 'perdido'].includes(x.st)).map(x => x.tel));
    WZ.lista = l.map(x => Object.assign({ numero: x.id }, x.dados || {})).sort((a, b) => String(b.ultimaEm || '').localeCompare(String(a.ultimaEm || '')));
    if (numero) {
      const n = encodeURIComponent(numero);
      const [ms, ps] = await Promise.all([
        wzLer(`itens?colecao=eq.whats_msgs&apagado=eq.false&dados->>numero=eq.${n}&select=id,dados&order=atualizado_em.asc&limit=600`),
        wzLer(`pedidos?data->>telefone=eq.${n}&select=id,data,created_at&order=created_at.desc&limit=30`),
      ]);
      WZ.msgs = ms.map(x => x.dados || {}).sort((a, b) => String(a.quando || '').localeCompare(String(b.quando || '')));
      WZ.pedidos = ps.map(x => Object.assign({}, x.data || {}, { id: x.id }));
    } else { WZ.msgs = []; WZ.pedidos = []; }
    WZ.erro = ''; WZ.carregou = true;
  } catch (e) {
    WZ.erro = String(e.message) === 'sessao' ? 'sessao' : 'Não consegui ler as conversas agora. Tento de novo sozinho em alguns segundos.';
    if (WZ.erro === 'sessao' && typeof authSave === 'function') authSave(null);
  } finally { WZ.buscando = false; }
}
/* abriu a conversa: zera o "não lidas" (a dona escreve na própria sala) */
async function wzMarcarLida(c) {
  if (!c || !c.naoLidas) return;
  c.naoLidas = 0;
  if (!WZ_REAL()) return;
  const dados = Object.assign({}, c); delete dados.id;
  try { await supaFetch('itens?on_conflict=colecao,id', { method: 'POST', body: JSON.stringify({ colecao: 'whats_conversas', id: c.numero, dados, apagado: false }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }); } catch (e) {}
}
async function wzCofre(corpo) {
  if (!WZ_REAL()) return { ok: true, demo: true };
  if (typeof authEnsure === 'function') await authEnsure();
  const r = await fetch(WZ_COFRE() + '/whats-enviar', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + authToken() },
    body: JSON.stringify(Object.assign({ sala: SUPA_SALA, por: (typeof authEmail === 'function' && authEmail()) || '' }, corpo)) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && !j.erro) j.erro = 'O envio falhou (' + r.status + ').';
  return j;
}

/* ---------- telas ---------- */
function wzItem(c, aberto) {
  const quem = c.ultimaDir === 'robo' ? 'Robô: ' : c.ultimaDir === 'equipe' ? 'Você: ' : '';
  const temLead = WZ.leads.has(c.numero);
  return `<button type="button" class="wz-item ${aberto ? 'on' : ''} ${c.naoLidas ? 'nova' : ''}" data-act="wz-abrir" data-n="${esc(c.numero)}">
    ${av(wzNome(c) || '?')}
    <span class="wz-meio"><span class="wz-l1"><b>${esc(wzNome(c))}</b><span class="sm">${esc(wzQuando(c.ultimaEm))}</span></span>
      <span class="wz-l2"><span class="wz-ult">${esc(quem + (c.ultima || ''))}</span>${c.naoLidas ? `<span class="wz-n" aria-label="${c.naoLidas} não lidas">${c.naoLidas}</span>` : ''}</span>
      <span class="wz-l3">${wzPausado(c) ? tag('gold', 'equipe atendendo') : tag('ok', 'robô atendendo')}${temLead ? ' ' + tag('warn', 'lead') : ''}</span></span>
  </button>`;
}
function wzListaHtml(aberto) {
  const f = WZ.filtro;
  const l = WZ.lista.filter(c => f === 'todas' || (f === 'naolidas' && c.naoLidas) || (f === 'equipe' && wzPausado(c)) || (f === 'robo' && !wzPausado(c)));
  if (!WZ.carregou) return '<div class="sm wz-vazio">Carregando as conversas…</div>';
  if (!l.length) return `<div class="sm wz-vazio">${WZ.lista.length ? 'Nenhuma conversa neste filtro.' : 'Nenhuma conversa ainda. Quando alguém escrever para o número da ' + esc(WZ_MARCA) + ', aparece aqui na hora.'}</div>`;
  return l.map(c => wzItem(c, c.numero === aberto)).join('');
}
function wzLeadHtml(p) {
  const im = p.imovelRef ? porRef(p.imovelRef) : null;
  const extras = Object.entries(p.extra || {}).filter(([, v]) => v && typeof v !== 'object');
  return `<div class="wz-lead"><div class="wz-lead-cab"><b>${esc(p.rotulo || 'Lead')}</b><label class="sm">Status <select class="inp wz-st" data-act="wz-status" data-id="${esc(p.id)}" aria-label="Status do lead">${WZ_STATUS.map(([v, l]) => `<option value="${v}" ${p.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    ${im ? `<a class="wz-im" href="${esc(im.url || '#/imoveis')}" target="_blank" rel="noopener"><img src="${esc(capa(im))}" alt="" loading="lazy"><span><b>Ref. ${esc(im.ref)} · ${esc(tituloCurto(im))}</b><span class="sm">${esc(precoIm(im))} · ${esc(TR[im.transacao] || '')}</span></span></a>` : (p.imovelRef ? `<div class="sm">Imóvel: ${esc(p.imovelRef)}</div>` : '')}
    ${extras.map(([k, v]) => `<div class="wz-kv"><span class="sm">${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}
    ${p.mensagem ? `<div class="wz-kv"><span class="sm">Resumo</span><span>${esc(p.mensagem)}</span></div>` : ''}
  </div>`;
}
function wzMsgsHtml() {
  if (!WZ.msgs.length) return '<div class="sm wz-vazio">Sem mensagens guardadas nesta conversa.</div>';
  let dia = '';
  return WZ.msgs.map(m => {
    const d = m.quando ? new Date(m.quando).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '';
    const sep = d && d !== dia ? `<div class="wz-dia">${esc(d)}</div>` : ''; dia = d || dia;
    const quem = m.dir === 'robo' ? 'Robô' : m.dir === 'equipe' ? (String(m.por || 'Equipe').split('@')[0] || 'Equipe') : '';
    return `${sep}<div class="wz-bal wz-${esc(m.dir)}">${quem ? `<span class="wz-quem">${esc(quem)}${m.como === 'modelo' ? ' · mensagem modelo' : ''}</span>` : ''}<span>${wzTexto(m.texto)}</span><i>${esc(wzHora(m.quando))}</i></div>`;
  }).join('');
}
function wzCorpoHtml(c) {
  const pausa = wzPausado(c);
  const fora = c.clienteEm && Date.now() - Date.parse(c.clienteEm) > WZ_DIA;
  return `<div class="wz-estado ${pausa ? 'eq' : ''}">${pausa
      ? `<span><b>Você assumiu esta conversa.</b> O robô fica quieto até você devolver (ou volta sozinho ${esc(new Date(c.pausadoAte).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }))}).</span><button type="button" class="btn btn-line btn-p" data-act="wz-robo" data-v="ligar" data-n="${esc(c.numero)}">Devolver ao robô</button>`
      : `<span><b>O robô está atendendo.</b> Ao responder aqui, você assume e ele fica quieto nesta conversa.</span><button type="button" class="btn btn-line btn-p" data-act="wz-robo" data-v="pausar" data-n="${esc(c.numero)}">Assumir sem responder</button>`}</div>
    ${WZ.pedidos.map(wzLeadHtml).join('')}
    <div class="wz-msgs" id="wz-msgs">${wzMsgsHtml()}</div>
    ${fora ? '<div class="wz-aviso sm">A última mensagem desta pessoa tem mais de 24 h. A Meta só deixa a empresa escrever com mensagem modelo aprovada: o app tenta pelo modelo e avisa se ele ainda estiver em aprovação.</div>' : ''}`;
}
function vWhats(numero) {
  const real = WZ_REAL();
  if (real && !WZ_LOGADO()) return vEntrar();
  if (real && WZ.dona === false) return vNaoDona();
  const c = numero ? WZ.lista.find(x => x.numero === numero) : null;
  const n = (k) => WZ.lista.filter(k).length;
  const filtros = [['todas', 'Todas', WZ.lista.length], ['naolidas', 'Não lidas', n(x => x.naoLidas)], ['robo', 'Robô atendendo', n(x => !wzPausado(x))], ['equipe', 'Equipe atendendo', n(wzPausado)]];
  return `${faixaCel()}<div class="topo"><div><h1>WhatsApp <small>· número de atendimento da ${esc(WZ_MARCA)}</small></h1>${real ? '' : '<div class="sm" style="margin-top:4px">Demonstração: conversas de exemplo. Os textos do robô são de um teste real com os imóveis do site da ' + esc(WZ_MARCA) + '.</div>'}</div></div>
    <div class="wz ${c ? 'com-conversa' : ''}">
      <div class="wz-col-lista"><div class="chips wz-filtros">${filtros.map(([v, l, q]) => `<button type="button" class="chip ${WZ.filtro === v ? 'on' : ''}" data-act="wz-filtro" data-v="${v}">${l}${q ? ` <span class="n">${q}</span>` : ''}</button>`).join('')}</div>
        <div class="wz-lista" id="wz-lista">${wzListaHtml(numero)}</div>${WZ.erro && WZ.erro !== 'sessao' ? `<div class="wz-aviso sm">${esc(WZ.erro)}</div>` : ''}</div>
      <div class="wz-col-conversa">${c ? `
        <div class="wz-cab"><button type="button" class="btn btn-line btn-p wz-voltar" data-act="ir" data-h="#/whats" aria-label="Voltar para a lista">‹</button>${av(wzNome(c))}<span class="wz-cab-tx"><b>${esc(wzNome(c))}</b><span class="sm">${esc(wzNum(c.numero))}</span></span>
          <a class="btn btn-wa btn-p" href="https://wa.me/${esc(c.numero)}" target="_blank" rel="noopener" title="Abre a conversa no SEU WhatsApp, por outro número">Meu WhatsApp</a></div>
        <div class="wz-corpo" id="wz-corpo">${wzCorpoHtml(c)}</div>
        <form class="wz-form" id="wz-form" aria-label="Responder pelo número da ${esc(WZ_MARCA)}"><label for="wz-texto" class="oculto">Resposta</label><textarea id="wz-texto" class="inp" rows="2" placeholder="Responder pelo número da ${esc(WZ_MARCA)}…">${esc(WZ.rascunho && WZ.rascunho[c.numero] || '')}</textarea><button type="submit" class="btn btn-navy" ${WZ.enviando ? 'disabled' : ''}>Enviar</button></form>`
      : `<div class="wz-nada sm">${WZ.lista.length ? 'Escolha uma conversa na lista.' : ''}</div>`}</div>
    </div>`;
}

/* ---------- atualização: só a lista e as mensagens, nunca a caixa de texto ---------- */
function wzNaTela() { return location.hash.replace(/^#\/?/, '').split('/')[0] === 'whats'; }
function wzAberto() { const p = location.hash.replace(/^#\/?/, '').split('/'); return p[0] === 'whats' && p[1] ? decodeURIComponent(p[1]) : ''; }
function wzPinta() {
  const numero = wzAberto(), l = $('wz-lista'), corpo = $('wz-corpo');
  if (!l) return;
  l.innerHTML = wzListaHtml(numero);
  const c = numero ? WZ.lista.find(x => x.numero === numero) : null;
  if (corpo && c) {
    /* quem está lendo lá em cima não é puxado para baixo; quem está no fim acompanha a conversa */
    const noFim = corpo.scrollHeight - corpo.scrollTop - corpo.clientHeight < 80;
    corpo.innerHTML = wzCorpoHtml(c);
    if (noFim) corpo.scrollTop = corpo.scrollHeight;
  }
}
async function wzAtualiza(primeira) {
  if (!wzNaTela()) { clearInterval(WZ.timer); WZ.timer = null; return; }
  const numero = wzAberto();
  await wzCarregar(numero);
  if (WZ.erro === 'sessao') { render(); return; }
  const c = numero ? WZ.lista.find(x => x.numero === numero) : null;
  if (c && c.naoLidas) await wzMarcarLida(c);
  if (primeira || !$('wz-lista')) render(); else wzPinta();
  if (typeof renderLado === 'function') renderLado();
}
function wzLiga() {
  if (!wzNaTela()) return;
  /* recarrega quando muda a conversa aberta ou o login (entrou/saiu); o resto é o relógio */
  const chave = wzAberto() + '|' + (WZ_LOGADO() ? 1 : 0);
  if (WZ.ultimaRota !== chave) { WZ.ultimaRota = chave; wzAtualiza(true); }
  if (!WZ.timer) WZ.timer = setInterval(() => { if (document.visibilityState === 'visible') wzAtualiza(false); }, 12000);
  const corpo = $('wz-corpo'); if (corpo) corpo.scrollTop = corpo.scrollHeight;
}
const wzNaoLidas = () => WZ.lista.reduce((s, c) => s + (+c.naoLidas || 0), 0);

/* ---------- cliques e formulários ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act^="wz-"]'); if (!el) return;
  const a = el.dataset.act;
  if (a === 'wz-abrir') { ir('#/whats/' + encodeURIComponent(el.dataset.n)); return; }
  if (a === 'wz-filtro') { WZ.filtro = el.dataset.v; document.querySelectorAll('.wz-filtros .chip').forEach(b => b.classList.toggle('on', b.dataset.v === WZ.filtro)); wzPinta(); return; }
  if (a === 'wz-sair') { if (typeof authSignOut === 'function') await authSignOut(); WZ.dona = null; WZ.lista = []; WZ.carregou = false; render(); return; }
  if (a === 'wz-robo') {
    const ligar = el.dataset.v === 'ligar', n = el.dataset.n;
    el.disabled = true;
    const r = await wzCofre({ acao: 'robo', ligar, para: n });
    const c = WZ.lista.find(x => x.numero === n);
    if (r.ok) {
      if (c) Object.assign(c, ligar ? { robo: 'ligado', pausadoAte: '' } : { robo: 'pausado', pausadoAte: r.pausadoAte || new Date(Date.now() + WZ_DIA).toISOString() });
      toast(ligar ? 'Devolvido: o robô volta a responder esta pessoa.' : 'Assumido: o robô fica quieto nesta conversa.');
    } else toast(r.erro || 'Não consegui agora. Tente de novo.');
    wzPinta(); return;
  }
});
document.addEventListener('change', async e => {
  if (e.target.dataset.act !== 'wz-status') return;
  const id = e.target.dataset.id, status = e.target.value;
  const p = WZ.pedidos.find(x => x.id === id); if (p) p.status = status;
  let ok = true;
  if (WZ_REAL() && p) {
    const dados = Object.assign({}, p); delete dados.id;
    try { const r = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ data: dados }), headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (x) { ok = false; }
  }
  if (ok) { if (['atendido', 'perdido'].includes(status)) WZ.leads.delete(p && p.telefone); else if (p) WZ.leads.add(p.telefone); wzPinta(); }
  toast(ok ? 'Status do lead: ' + (WZ_STATUS.find(s => s[0] === status) || [, status])[1] + '.' : 'Não gravou. Tente de novo.');
});
document.addEventListener('input', e => {
  if (e.target.id !== 'wz-texto') return;
  WZ.rascunho = WZ.rascunho || {}; WZ.rascunho[wzAberto()] = e.target.value;
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'wz-form') return;
  e.preventDefault();
  const n = wzAberto(), caixa = $('wz-texto'), texto = caixa.value.trim();
  if (!n || !texto || WZ.enviando) return;
  const c = WZ.lista.find(x => x.numero === n);
  WZ.enviando = true; const bt = e.target.querySelector('button'); bt.disabled = true; bt.textContent = 'Enviando…';
  const r = await wzCofre({ para: n, texto, nome: c ? (c.nome || '').split(' ')[0] : '' });
  WZ.enviando = false; bt.disabled = false; bt.textContent = 'Enviar';
  if (r.ok) {
    caixa.value = ''; if (WZ.rascunho) delete WZ.rascunho[n];
    const agora = new Date().toISOString();
    WZ.msgs.push({ numero: n, dir: 'equipe', texto, quando: agora, por: (typeof authEmail === 'function' && authEmail()) || 'você', como: r.como });
    if (c) Object.assign(c, { ultima: texto, ultimaEm: agora, ultimaDir: 'equipe', naoLidas: 0, robo: 'pausado', pausadoAte: r.pausadoAte || new Date(Date.now() + WZ_DIA).toISOString() });
    if (WZ_EXEMPLO) WZ_EXEMPLO.msgs.push(WZ.msgs[WZ.msgs.length - 1]);
    wzPinta(); toast(r.demo ? 'Demonstração: no app de verdade a mensagem sai pelo número da ' + WZ_MARCA + '.' : r.como === 'modelo' ? 'Enviada como mensagem modelo (passou das 24 h).' : 'Enviada pelo número da ' + WZ_MARCA + '. O robô fica quieto nesta conversa.');
  } else {
    const t = { fora_da_janela: r.erro, sem_numero: 'O número do WhatsApp ainda não está ligado no robô.', sem_cliente: 'Esta conta não manda no número da ' + WZ_MARCA + '.', sem_login: 'Entre de novo com a conta da ' + WZ_MARCA + '.' };
    toast(t[r.codigo] || r.erro || 'Não consegui enviar.');
  }
});

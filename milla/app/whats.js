/* =====================================================
   WHATSAPP — as conversas do número de atendimento (03/11/2026).
   O nome da imobiliária vem do config.js (APP_CONFIG.curto) e os exemplos são
   do teste da Milla da imobiliária.

   A Milla responde 24 h num número que só existe na API da Meta: ninguém abre
   esse WhatsApp num celular. Esta tela é onde a equipe VÊ cada conversa, a
   ficha de quem quer visitar, reservar ou fazer proposta, e RESPONDE pelo
   mesmo número. Quem responde aqui assume a conversa: a Milla fica quieta
   nela até alguém tocar em "Devolver à Milla" (ou 24 h depois, sozinho).

   De onde vem cada coisa (a sala do Supabase, só a conta dona lê — RLS):
     itens · whats_conversas   uma linha por número (o cofre grava a cada mensagem)
     itens · whats_msgs        uma linha por mensagem (cliente, Milla, equipe)
     pedidos                   o lead que a Milla anotou
   Para responder e para assumir/devolver: rota whats-enviar do cofre, com o
   login da dona (o cofre confere que ela é a dona da sala).

   Sem banco (demonstração), a tela mostra conversas de exemplo — os textos do
   Milla são de um teste real (03/11/2026) com os 207 imóveis da API do site deles.
   ===================================================== */
'use strict';

const WZ = { lista: [], msgs: [], pedidos: [], leads: new Set(), erro: '', carregou: false, buscando: false, filtro: 'todas', timer: null, dona: null, enviando: false, ultimaRota: null };
const WZ_REAL = () => typeof temNuvem === 'function' && temNuvem() && typeof SUPA_SALA !== 'undefined' && !!SUPA_SALA;
const WZ_LOGADO = () => typeof isLoggedIn === 'function' && isLoggedIn();
const WZ_COFRE = () => String(SUPA_URL).replace(/\/+$/, '') + '/functions/v1/cofre';
/* o calor do lead (10/11/2026): a Milla diz ao anotar e a equipe pode trocar. Ficha antiga sem calor:
   visita, proposta ou data = quente; perdido = frio; o resto morno. */
const WZ_TEMPS = [['quente', 'Quente'], ['morno', 'Morno'], ['frio', 'Frio']];
function tempDe(p) {
  if (p && ['quente', 'morno', 'frio'].includes(p.temperatura)) return p.temperatura;
  const q = p && p.extra && (p.extra.Quando || p.extra.quando);
  return p && (p.status === 'visita marcada' || p.status === 'proposta' || q) ? 'quente' : (p && p.status === 'perdido' ? 'frio' : 'morno');
}
const tempNome = t => (WZ_TEMPS.find(x => x[0] === t) || [, ''])[1];
function tempTag(p) { const t = tempDe(p); return `<span class="temp t-${t}">${tempNome(t)}</span>`; }
function tempSelect(p, act) {
  const t = tempDe(p);
  return `<select class="inp wz-st temp-sel t-${t}" data-act="${act}" data-id="${esc(p.id)}" aria-label="Calor do lead">${WZ_TEMPS.map(([v, l]) => `<option value="${v}" ${t === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
}
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
/* texto da Milla com o link clicável (só links do próprio site e http(s)) */
const wzTexto = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');

/* ---------- dados de exemplo (sem banco) ---------- */
function wzDemo() {
  const h = (min) => new Date(Date.now() - min * 60000).toISOString();
  const conv = [
    { numero: '5511900000001', nome: 'Carla', ultima: 'Obrigada, Carla! A equipe confirma o horário e eu te aviso por aqui.', ultimaEm: h(4), ultimaDir: 'robo', clienteEm: h(5), naoLidas: 2, robo: 'ligado' },
    { numero: '5511900000002', nome: 'Rafael', ultima: 'Oi Rafael, aqui é a Ana! Sábado às 10h está confirmado no V204.', ultimaEm: h(38), ultimaDir: 'equipe', clienteEm: h(58), naoLidas: 0, robo: 'pausado', pausadoAte: new Date(Date.now() + 20 * 3600000).toISOString() },
    { numero: '5511900000003', nome: 'Júlia', ultima: 'Perfeito, Júlia! Anotei tudo e a equipe fala com você por aqui para avaliar o imóvel.', ultimaEm: h(171), ultimaDir: 'robo', clienteEm: h(173), naoLidas: 1, robo: 'ligado' },
    { numero: '5511900000004', nome: 'Marcos', ultima: 'Separei 2 apartamentos para aluguel anual no Centro. Quer ver as fotos?', ultimaEm: h(264), ultimaDir: 'robo', clienteEm: h(266), naoLidas: 0, robo: 'ligado' },
  ];
  const m = (numero, dir, texto, min, extra) => Object.assign({ numero, dir, texto, quando: h(min) }, extra || {});
  const msgs = [
    m('5511900000001', 'cliente', 'Boa noite! Vocês têm casa pra 6 pessoas no Natal?', 12),
    m('5511900000001', 'robo', 'Boa noite! Sou a Milla, agente virtual da Sua Imobiliária. Separei 3 casas para 6 pessoas no Natal. A primeira fica a duas quadras do mar:\n\nRef. T108 · Casa com piscina na Praia Mansa, 3 quartos, até 6 pessoas. R$ 780 por diária.', 12),
    m('5511900000001', 'cliente', 'Gostei dessa. Posso ver sábado de manhã?', 7),
    m('5511900000001', 'robo', 'Anotei sábado de manhã e já avisei a equipe. Assim que confirmarem, te aviso por aqui. Como posso te chamar?', 7),
    m('5511900000001', 'cliente', 'Carla', 5),
    m('5511900000001', 'robo', 'Obrigada, Carla! A equipe confirma o horário e eu te aviso por aqui.', 4),
    m('5511900000002', 'cliente', 'Áudio de 14 segundos', 62),
    m('5511900000002', 'robo', 'Entendi: apartamento de 2 quartos para comprar, até R$ 450 mil, perto do centro. Tenho uma opção boa:\n\nRef. V204 · Apartamento no Centro, 2 quartos, 1 vaga, 68 m². R$ 430.000.', 62),
    m('5511900000002', 'cliente', 'Gostei. Dá pra ver sábado às 10h? Sou o Rafael', 59),
    m('5511900000002', 'robo', 'Anotei sua visita para sábado às 10h no V204. A equipe confirma em seguida por aqui mesmo.', 58),
    m('5511900000002', 'equipe', 'Oi Rafael, aqui é a Ana! Sábado às 10h está confirmado no V204.', 38, { por: 'Ana' }),
    m('5511900000003', 'cliente', 'Olá, tenho uma casa e queria colocar para alugar na temporada. Vocês fazem?', 175),
    m('5511900000003', 'robo', 'Fazemos sim. Me conta como é a casa e em que bairro fica?', 174),
    m('5511900000003', 'cliente', 'É um sobrado de 3 quartos com piscina, no Jardim das Palmeiras. Meu nome é Júlia', 173),
    m('5511900000003', 'robo', 'Perfeito, Júlia! Anotei tudo e a equipe fala com você por aqui para avaliar o imóvel.', 171),
    m('5511900000004', 'cliente', 'Bom dia, procuro apartamento pra alugar no Centro, até 2.500', 266),
    m('5511900000004', 'robo', 'Separei 2 apartamentos para aluguel anual no Centro. Quer ver as fotos?', 264),
  ];
  const ped = [
    { id: 'demo-p1', temperatura: 'quente', telefone: '5511900000001', nome: 'Carla', rotulo: 'Interesse em imóvel', imovelRef: 'T108', status: 'novo', mensagem: 'Carla quer ver a T108 (Praia Mansa, piscina) para 6 pessoas no Natal.', extra: { Pedido: 'Visita', Quando: 'sábado de manhã' }, criadoEm: h(4),
      equipe: { modo: 'rodizio', produto: 'temporada', vez: 'Bruno', passouDe: ['Ana'], avisados: ['Ana', 'Bruno'], falhou: [], em: h(14), prazo: new Date(Date.now() + 6 * 60000).toISOString() } },
    { id: 'demo-p2', temperatura: 'quente', telefone: '5511900000002', nome: 'Rafael', rotulo: 'Interesse em imóvel', imovelRef: 'V204', status: 'visita marcada', mensagem: 'Rafael quer visitar o apartamento V204 no Centro, até R$ 450 mil.', extra: { Pedido: 'Visita', Quando: 'sábado às 10h' }, criadoEm: h(58),
      equipe: { avisados: ['Ana', 'Bruno'], falhou: [], em: h(58), resposta: { acao: 'confirmado', por: 'Ana', em: h(38), clienteAvisado: true } } },
    { id: 'demo-p3', temperatura: 'morno', telefone: '5511900000003', nome: 'Júlia', rotulo: 'Anunciar imóvel', imovelRef: '', status: 'novo', mensagem: 'Júlia tem um sobrado de 3 quartos com piscina no Jardim das Palmeiras e quer alugar na temporada.', extra: { Pedido: 'Anunciar para temporada' }, criadoEm: h(171),
      equipe: { avisados: ['Ana'], falhou: [], em: h(171) } },
    { id: 'demo-p4', temperatura: 'frio', telefone: '5511900000004', nome: 'Marcos', rotulo: 'Interesse em imóvel', imovelRef: 'A302', status: 'novo', mensagem: 'Marcos procura apartamento para aluguel anual no Centro, até R$ 2.500.', extra: { Pedido: 'Aluguel anual' }, criadoEm: h(264) },
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
  const quem = c.ultimaDir === 'robo' ? 'Milla: ' : c.ultimaDir === 'equipe' ? 'Você: ' : '';
  const temLead = WZ.leads.has(c.numero);
  return `<button type="button" class="wz-item ${aberto ? 'on' : ''} ${c.naoLidas ? 'nova' : ''}" data-act="wz-abrir" data-n="${esc(c.numero)}">
    ${av(wzNome(c) || '?')}
    <span class="wz-meio"><span class="wz-l1"><b>${esc(wzNome(c))}</b><span class="sm">${esc(wzQuando(c.ultimaEm))}</span></span>
      <span class="wz-l2"><span class="wz-ult">${esc(quem + (c.ultima || ''))}</span>${c.naoLidas ? `<span class="wz-n" aria-label="${c.naoLidas} não lidas">${c.naoLidas}</span>` : ''}</span>
      <span class="wz-l3">${wzPausado(c) ? tag('gold', 'equipe atendendo') : tag('ok', 'Milla atendendo')}${temLead ? ' ' + tag('warn', 'lead') : ''}</span></span>
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
  return `<div class="wz-lead"><div class="wz-lead-cab"><b>${esc(p.rotulo || 'Lead')}</b><span class="wz-lead-sel"><label class="sm">Calor ${tempSelect(p, 'wz-temp')}</label><label class="sm">Status <select class="inp wz-st" data-act="wz-status" data-id="${esc(p.id)}" aria-label="Status do lead">${WZ_STATUS.map(([v, l]) => `<option value="${v}" ${p.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></span></div>
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
    const quem = m.dir === 'robo' ? 'Milla' : m.dir === 'equipe' ? (String(m.por || 'Equipe').split('@')[0] || 'Equipe') : '';
    return `${sep}<div class="wz-bal wz-${esc(m.dir)}">${quem ? `<span class="wz-quem">${esc(quem)}${m.como === 'modelo' ? ' · mensagem modelo' : ''}</span>` : ''}<span>${wzTexto(m.texto)}</span><i>${esc(wzHora(m.quando))}</i></div>`;
  }).join('');
}
function wzCorpoHtml(c) {
  const pausa = wzPausado(c);
  const fora = c.clienteEm && Date.now() - Date.parse(c.clienteEm) > WZ_DIA;
  return `<div class="wz-estado ${pausa ? 'eq' : ''}"><i class="ponto" aria-hidden="true"></i>${pausa
      ? `<span><b>Você assumiu esta conversa.</b> A Milla fica quieta até você devolver (ou volta sozinha ${esc(new Date(c.pausadoAte).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }))}).</span><button type="button" class="btn btn-line btn-p" data-act="wz-robo" data-v="ligar" data-n="${esc(c.numero)}">Devolver à Milla</button>`
      : `<span><b>A Milla está atendendo.</b> Ao responder aqui, você assume e ela fica quieta nesta conversa.</span><button type="button" class="btn btn-line btn-p" data-act="wz-robo" data-v="pausar" data-n="${esc(c.numero)}">Assumir sem responder</button>`}</div>
    <div class="wz-ficha-dentro">${WZ.pedidos.map(wzLeadHtml).join('')}</div>
    <div class="wz-msgs" id="wz-msgs">${wzMsgsHtml()}</div>
    ${fora ? '<div class="wz-aviso sm">A última mensagem desta pessoa tem mais de 24 h. A Meta só deixa a empresa escrever com mensagem modelo aprovada: o app tenta pelo modelo e avisa se ele ainda estiver em aprovação.</div>' : ''}`;
}
function vWhats(numero) {
  const real = WZ_REAL();
  if (real && !WZ_LOGADO()) return vEntrar();
  if (real && WZ.dona === false) return vNaoDona();
  const c = numero ? WZ.lista.find(x => x.numero === numero) : null;
  const n = (k) => WZ.lista.filter(k).length;
  const filtros = [['todas', 'Todas', WZ.lista.length], ['naolidas', 'Não lidas', n(x => x.naoLidas)], ['robo', 'Milla atendendo', n(x => !wzPausado(x))], ['equipe', 'Equipe atendendo', n(wzPausado)]];
  return `${faixaCel()}<div class="topo"><div><h1>WhatsApp <small>· número de atendimento da ${esc(WZ_MARCA)}</small></h1>${real ? '' : '<div class="sm" style="margin-top:4px">Demonstração: conversas e imóveis de exemplo.</div>'}</div></div>
    <div class="wz ${c ? 'com-conversa' : ''}">
      <div class="wz-col-lista"><div class="chips wz-filtros">${filtros.map(([v, l, q]) => `<button type="button" class="chip ${WZ.filtro === v ? 'on' : ''}" data-act="wz-filtro" data-v="${v}">${l}${q ? ` <span class="n">${q}</span>` : ''}</button>`).join('')}</div>
        <div class="wz-lista" id="wz-lista">${wzListaHtml(numero)}</div>${WZ.erro && WZ.erro !== 'sessao' ? `<div class="wz-aviso sm">${esc(WZ.erro)}</div>` : ''}</div>
      <div class="wz-col-conversa">${c ? `
        <div class="wz-cab"><button type="button" class="btn btn-line btn-p wz-voltar" data-act="ir" data-h="#/whats" aria-label="Voltar para a lista">‹</button>${av(wzNome(c))}<span class="wz-cab-tx"><b>${esc(wzNome(c))}</b><span class="sm">${esc(wzNum(c.numero))}</span></span>
          <a class="btn btn-wa btn-p" href="https://wa.me/${esc(c.numero)}" target="_blank" rel="noopener" title="Abre a conversa no SEU WhatsApp, por outro número">Meu WhatsApp</a></div>
        <div class="wz-corpo" id="wz-corpo">${wzCorpoHtml(c)}</div>
        <form class="wz-form" id="wz-form" aria-label="Responder pelo número da ${esc(WZ_MARCA)}"><label for="wz-texto" class="oculto">Resposta</label><textarea id="wz-texto" class="inp" rows="1" placeholder="Responder para ${esc(wzNome(c).split(' ')[0])}…">${esc(WZ.rascunho && WZ.rascunho[c.numero] || '')}</textarea><button type="submit" class="btn btn-navy" ${WZ.enviando ? 'disabled' : ''}>Enviar</button></form>`
      : `<div class="wz-nada"><span class="wz-nada-ico" aria-hidden="true">${typeof SIMBOLO === 'function' ? SIMBOLO() : ''}</span><b>${WZ.lista.length ? 'Escolha uma conversa' : 'Nenhuma conversa ainda'}</b><span class="sm">${WZ.lista.length ? 'A Milla responde sozinha. Abra uma conversa para ver tudo, assumir ou responder pelo número da ' + esc(WZ_MARCA) + '.' : ''}</span></div>`}</div>
      ${c ? `<aside class="wz-col-ficha" aria-label="Ficha de ${esc(wzNome(c))}"><div class="ficha-cab">${av(wzNome(c))}<span><b>${esc(wzNome(c))}</b><span class="sm">${esc(wzNum(c.numero))}</span></span></div>
        ${WZ.pedidos.length ? WZ.pedidos.map(wzLeadHtml).join('') : '<div class="sm ficha-vazia">A Milla ainda não anotou um pedido desta pessoa. Quando ela pedir visita, reserva ou proposta, a ficha aparece aqui.</div>'}
        <div class="ficha-acoes"><a class="btn btn-wa btn-p" href="https://wa.me/${esc(c.numero)}" target="_blank" rel="noopener">Abrir no meu WhatsApp</a></div></aside>` : ''}
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
      toast(ligar ? 'Devolvido: a Milla volta a responder esta pessoa.' : 'Assumido: a Milla fica quieta nesta conversa.');
    } else toast(r.erro || 'Não consegui agora. Tente de novo.');
    wzPinta(); return;
  }
});
document.addEventListener('change', async e => {
  const act = e.target.dataset.act;
  if (act !== 'wz-status' && act !== 'wz-temp') return;
  const id = e.target.dataset.id, valor = e.target.value, campo = act === 'wz-temp' ? 'temperatura' : 'status';
  const status = campo === 'status' ? valor : null;
  const p = WZ.pedidos.find(x => x.id === id); const antes = p ? p[campo] : undefined; if (p) p[campo] = valor;
  let ok = true;
  if (WZ_REAL() && p) {
    const dados = Object.assign({}, p); delete dados.id;
    try { const r = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ data: dados }), headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (x) { ok = false; }
  }
  if (!ok && p) p[campo] = antes;
  if (ok && status) { if (['atendido', 'perdido'].includes(status)) WZ.leads.delete(p && p.telefone); else if (p) WZ.leads.add(p.telefone); }
  if (ok) wzPinta();
  toast(!ok ? 'Não gravou. Tente de novo.' : campo === 'temperatura' ? 'Lead ' + tempNome(valor).toLowerCase() + '.' : 'Status do lead: ' + (WZ_STATUS.find(s => s[0] === status) || [, status])[1] + '.');
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
    wzPinta(); toast(r.demo ? 'Demonstração: no app de verdade a mensagem sai pelo número da ' + WZ_MARCA + '.' : r.como === 'modelo' ? 'Enviada como mensagem modelo (passou das 24 h).' : 'Enviada pelo número da ' + WZ_MARCA + '. A Milla fica quieta nesta conversa.');
  } else {
    const t = { fora_da_janela: r.erro, sem_numero: 'O número do WhatsApp ainda não está ligado na Milla.', sem_cliente: 'Esta conta não manda no número da ' + WZ_MARCA + '.', sem_login: 'Entre de novo com a conta da ' + WZ_MARCA + '.' };
    toast(t[r.codigo] || r.erro || 'Não consegui enviar.');
  }
});

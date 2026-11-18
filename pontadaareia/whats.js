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

   Sem banco (demonstração), a tela mostra as conversas de exemplo da Imobiliária Milla
   (fictícia, 16/11/2026), com os mesmos imóveis do site de demonstração.
   ===================================================== */
'use strict';

const WZ = { lista: [], msgs: [], pedidos: [], leads: new Set(), erro: '', carregou: false, buscando: false, filtro: 'todas', timer: null, dona: null, papel: '', enviando: false, ultimaRota: null };
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

/* ---------- dados de exemplo (sem banco) ----------
   16/11/2026: a demonstração é a Imobiliária Milla (fictícia), a mesma do site de demonstração
   (rottaguide.com/milla/imobiliaria): os mesmos imóveis (dados/puxa-demo.py) e a mesma equipe —
   Carla Menezes (dona, vendas e captação), Rafael Duarte (temporada), Bianca Torres (locação).
   A conversa da Juliana (Ref. 528) é a mesma da faixa "Pergunte. A Milla responde" do site.
   Os números de telefone são de mentira (5541900000…) e nada sai daqui. */
const DEMO_EQUIPE = [
  { nome: 'Carla', numero: '5541900000011', produtos: ['venda'] },
  { nome: 'Rafael', numero: '5541900000012', produtos: ['temporada'] },
  { nome: 'Bianca', numero: '5541900000013', produtos: ['aluguel'] },
];
function wzDemo() {
  const h = (min) => new Date(Date.now() - min * 60000).toISOString();
  const em = (min) => new Date(Date.now() + min * 60000).toISOString();
  const T = { ju: '5541900000101', ma: '5541900000102', pa: '5541900000103', an: '5541900000104', da: '5541900000105', fe: '5541900000106' };
  const conv = [
    { numero: T.ju, nome: 'Juliana', ultima: 'Anotei, Juliana! O Rafael, que cuida da temporada, confirma a reserva com você por aqui.', ultimaEm: h(5), ultimaDir: 'robo', clienteEm: h(6), naoLidas: 2, robo: 'ligado' },
    { numero: T.ma, nome: 'Marcelo', ultima: 'Oi Marcelo, aqui é a Carla! Sábado às 10h está confirmado na Ref. 612.', ultimaEm: h(38), ultimaDir: 'equipe', clienteEm: h(59), naoLidas: 0, robo: 'pausado', pausadoAte: em(20 * 60) },
    { numero: T.an, nome: 'Antônio', ultima: 'Obrigada, Antônio! Anotei tudo e a Carla, que cuida das vendas, combina a avaliação com você por aqui.', ultimaEm: h(171), ultimaDir: 'robo', clienteEm: h(173), naoLidas: 1, robo: 'ligado' },
    { numero: T.pa, nome: 'Patrícia', ultima: 'Oi Patrícia, é a Bianca! Aceita pet pequeno, sim. Quarta às 15h fica bom?', ultimaEm: h(240), ultimaDir: 'equipe', clienteEm: h(295), naoLidas: 0, robo: 'pausado', pausadoAte: em(14 * 60) },
    { numero: T.da, nome: 'Daniel', ultima: 'Anotei a sua proposta: R$ 350.000 com 30% de entrada. A Carla leva ao proprietário e te responde por aqui.', ultimaEm: h(1458), ultimaDir: 'robo', clienteEm: h(1460), naoLidas: 0, robo: 'ligado' },
    { numero: T.fe, nome: 'Fernanda', ultima: 'Combinado! Quando decidirem, é só me chamar aqui.', ultimaEm: h(2890), ultimaDir: 'robo', clienteEm: h(2891), naoLidas: 0, robo: 'ligado' },
  ];
  const m = (numero, dir, texto, min, extra) => Object.assign({ numero, dir, texto, quando: h(min) }, extra || {});
  const msgs = [
    m(T.ju, 'cliente', 'Oi! Tem casa com piscina pro réveillon? Somos 8, de 28/12 a 02/01', 14),
    m(T.ju, 'robo', 'Tenho sim! A Ref. 528 é uma casa em Pontal do Sul com piscina, 5 quartos e até 12 pessoas. Livre nas suas datas: 5 noites × R$ 1.180 = R$ 5.900. O sinal de 50% (R$ 2.950) garante as datas. Quer que eu anote a reserva?', 14),
    m(T.ju, 'cliente', 'Quero! Sou a Juliana', 6),
    m(T.ju, 'robo', 'Anotei, Juliana! O Rafael, que cuida da temporada, confirma a reserva com você por aqui.', 5),
    m(T.ma, 'cliente', 'Áudio de 14 segundos', 62),
    m(T.ma, 'robo', 'Entendi: casa de 3 quartos para comprar em Pontal do Sul, até R$ 800 mil. Tenho uma que acabou de baixar o preço:\n\nRef. 612 · Casa nova em Pontal do Sul, 3 quartos (1 suíte), 2 vagas, piscina, 167 m². Era R$ 790.000, agora R$ 750.000.', 61),
    m(T.ma, 'cliente', 'Gostei. Dá pra ver sábado às 10h? Sou o Marcelo', 59),
    m(T.ma, 'robo', 'Anotei a sua visita para sábado às 10h na Ref. 612. A Carla confirma em seguida por aqui mesmo.', 58),
    m(T.ma, 'equipe', 'Oi Marcelo, aqui é a Carla! Sábado às 10h está confirmado na Ref. 612.', 38, { por: 'Carla' }),
    m(T.pa, 'cliente', 'Bom dia, procuro casa pra alugar o ano todo em Pontal do Sul, até 2.500', 300),
    m(T.pa, 'robo', 'Bom dia! Tenho uma boa:\n\nRef. 621 · Casa mobiliada em Pontal do Sul, 3 quartos (1 suíte), piscina, 2 vagas. R$ 2.200 por mês. Quer que eu marque uma visita?', 299),
    m(T.pa, 'cliente', 'Quero, pode ser quarta à tarde? E aceita pet?', 296),
    m(T.pa, 'robo', 'Anotei a visita para quarta à tarde. Sobre o pet, quem confirma é a Bianca, que cuida da locação: ela fala com você por aqui.', 295),
    m(T.pa, 'equipe', 'Oi Patrícia, é a Bianca! Aceita pet pequeno, sim. Quarta às 15h fica bom?', 240, { por: 'Bianca' }),
    m(T.an, 'cliente', 'Boa tarde. Tenho um sobrado em Shangri-lá e quero vender. Vocês avaliam?', 175),
    m(T.an, 'robo', 'Avaliamos sim, sem custo. Me conta: quantos quartos, o tamanho do terreno e se a documentação está em dia?', 174),
    m(T.an, 'cliente', '3 quartos, terreno de 12 por 30, escriturado. Sou o Antônio', 173),
    m(T.an, 'robo', 'Obrigada, Antônio! Anotei tudo e a Carla, que cuida das vendas, combina a avaliação com você por aqui.', 171),
    m(T.da, 'cliente', 'Oi, o apartamento 627 aceita financiamento?', 1470),
    m(T.da, 'robo', 'Aceita sim. A Ref. 627 é um apartamento em Praia de Leste com elevador e vaga coberta: 2 quartos (1 suíte), 62 m², R$ 380.000.', 1469),
    m(T.da, 'cliente', 'Quero fazer uma proposta de 350 mil com 30% de entrada', 1460),
    m(T.da, 'robo', 'Anotei a sua proposta: R$ 350.000 com 30% de entrada. A Carla leva ao proprietário e te responde por aqui.', 1458),
    m(T.fe, 'cliente', 'Quanto fica a 618 no réveillon pra 10 pessoas?', 2895),
    m(T.fe, 'robo', 'A Ref. 618 é uma casa mobiliada com piscina em Pontal do Sul: 4 quartos (2 suítes), até 10 pessoas, R$ 1.600 por diária. De 29/12 a 02/01 são 4 noites: R$ 6.400. O sinal de 50% (R$ 3.200) garante as datas.', 2894),
    m(T.fe, 'cliente', 'Vou ver com o pessoal e te falo', 2891),
    m(T.fe, 'robo', 'Combinado! Quando decidirem, é só me chamar aqui.', 2890),
  ];
  const ped = [
    { id: 'demo-p1', temperatura: 'quente', telefone: T.ju, nome: 'Juliana', rotulo: 'Reserva de temporada', imovelRef: '528', status: 'novo', mensagem: 'Juliana quer reservar a Ref. 528 (Pontal do Sul, piscina) de 28/12 a 02/01 para 8 pessoas: 5 noites × R$ 1.180 = R$ 5.900, sinal de R$ 2.950.', extra: { Pedido: 'Reserva', Datas: '28/12 a 02/01', Pessoas: 8 }, criadoEm: h(5), origem: 'robo-whatsapp',
      equipe: { modo: 'rodizio', produto: 'temporada', vez: 'Rafael', passouDe: [], avisados: ['Rafael'], falhou: [], em: h(5), prazo: em(6) } },
    { id: 'demo-p2', temperatura: 'quente', telefone: T.ma, nome: 'Marcelo', rotulo: 'Interesse em imóvel', imovelRef: '612', status: 'visita marcada', mensagem: 'Marcelo quer visitar a casa Ref. 612 em Pontal do Sul (baixou para R$ 750 mil).', extra: { Pedido: 'Visita', Quando: 'sábado às 10h' }, criadoEm: h(58), origem: 'robo-whatsapp', statusEm: h(38),
      equipe: { modo: 'rodizio', produto: 'venda', avisados: ['Carla'], falhou: [], em: h(58), resposta: { acao: 'confirmado', por: 'Carla', em: h(38), clienteAvisado: true } } },
    { id: 'demo-p3', temperatura: 'morno', telefone: T.an, nome: 'Antônio', rotulo: 'Anunciar imóvel', imovelRef: '', status: 'novo', mensagem: 'Antônio quer vender um sobrado de 3 quartos em Shangri-lá (terreno 12 × 30, escriturado).', extra: { Pedido: 'Vender o imóvel', 'Balneário': 'Shangri-lá' }, criadoEm: h(171), origem: 'robo-whatsapp',
      equipe: { modo: 'rodizio', produto: 'venda', vez: 'Carla', avisados: ['Carla'], passouDe: [], falhou: [], em: h(171), prazo: h(161) } },
    { id: 'demo-p4', temperatura: 'quente', telefone: T.pa, nome: 'Patrícia', rotulo: 'Aluguel anual', imovelRef: '621', status: 'em atendimento', mensagem: 'Patrícia quer visitar a casa Ref. 621 (R$ 2.200 por mês) e pergunta se aceita pet.', extra: { Pedido: 'Visita', Quando: 'quarta à tarde' }, criadoEm: h(295), origem: 'robo-whatsapp', statusEm: h(240),
      equipe: { modo: 'rodizio', produto: 'aluguel', avisados: ['Bianca'], falhou: [], em: h(295), resposta: { acao: 'assumido', por: 'Bianca', em: h(262), clienteAvisado: true } } },
    { id: 'demo-p5', temperatura: 'quente', telefone: T.da, nome: 'Daniel', rotulo: 'Interesse em imóvel', imovelRef: '627', status: 'proposta', mensagem: 'Daniel propõe R$ 350.000 pelo apartamento Ref. 627, com 30% de entrada e o resto financiado.', extra: { Pedido: 'Proposta', Valor: 'R$ 350.000', Entrada: '30%' }, criadoEm: h(1458), origem: 'robo-whatsapp', statusEm: h(1400),
      equipe: { modo: 'rodizio', produto: 'venda', avisados: ['Carla'], falhou: [], em: h(1458), resposta: { acao: 'assumido', por: 'Carla', em: h(1441), clienteAvisado: true } } },
  ];
  const todos = ped.concat(wzDemoHistorico()).sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
  return { conv, msgs, ped: todos };
}
/* seis meses de leads de exemplo para os relatórios: sempre os mesmos (sorteio com semente),
   contados a partir de hoje. Sem telefone: são só números, não há conversa por trás. */
function wzDemoHistorico() {
  let s = 20261116;
  const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const um = l => l[Math.floor(rnd() * l.length)];
  const NOMES = ['Ana Paula', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João Pedro', 'Karina', 'Lucas', 'Mariana', 'Natália', 'Otávio', 'Priscila', 'Renato', 'Sabrina', 'Thiago', 'Vanessa', 'William', 'Aline', 'Caio', 'Débora', 'Everton', 'Fabiana', 'Gustavo', 'Helena', 'Igor', 'Jéssica', 'Leandro', 'Michele', 'Paulo', 'Raquel', 'Sérgio', 'Tatiane', 'Vitor', 'Yasmin', 'Rodrigo', 'Luana'];
  /* os imóveis mais procurados aparecem mais vezes (a lista repete) */
  const REFS = {
    venda: ['612', '612', '627', '627', '615', '615', '624', '636', '639', '642', '645', '651', '654', '660', '663', '666', '630', '648', '519', '522', '510'],
    aluguel: ['621', '621', '621', '514', '515', '520', '531', '540'],
    temporada: ['528', '528', '528', '618', '618', '657', '657', '633', '633', '524', '539', '516', '513', '507', '505'],
  };
  const BALN = ['Shangri-lá', 'Pontal do Sul', 'Ipanema', 'Praia de Leste', 'Atami', 'Canoas', 'Grajaú'];
  /* leads por mês, do mais antigo ao atual (o atual vale até hoje): a temporada sobe no verão */
  const POR_MES = { venda: [13, 14, 15, 17, 20, 24], aluguel: [8, 7, 7, 6, 6, 6], temporada: [3, 4, 6, 11, 21, 38], captacao: [2, 2, 3, 4, 5, 7] };
  const FECHA = { venda: .14, aluguel: .32, temporada: .46, captacao: .4 };
  const QUEM = { venda: [['Carla', .85], ['Rafael', 1]], captacao: [['Carla', 1]], temporada: [['Rafael', .8], ['Bianca', 1]], aluguel: [['Bianca', .9], ['Carla', 1]] };
  const ROT = { venda: 'Interesse em imóvel', aluguel: 'Aluguel anual', temporada: 'Reserva de temporada', captacao: 'Anunciar imóvel' };
  const agora = Date.now(), hoje = new Date(), DIA = 86400000, saida = [];
  /* cada pessoa da equipe tem um jeito (Gestão · Desempenho da equipe, 16/11/2026): a Carla é rápida e
     fecha mais; o Rafael responde no meio-termo e às vezes perde a vez; a Bianca demora mais e deixa
     lead parado, mas fecha bem a locação */
  const PERFIL = { Carla: { vel: .5, fecha: 1.3, falta: .03, para: .12 }, Rafael: { vel: 1.1, fecha: 1, falta: .13, para: .3 }, Bianca: { vel: 2.3, fecha: .95, falta: .06, para: .5 } };
  const OUTRO = { Carla: 'Rafael', Rafael: 'Bianca', Bianca: 'Carla' };
  /* quando as pessoas escrevem: mais à noite e no fim de semana (0 a 23 h) */
  const HORA = [1, .5, .3, .2, .2, .4, 1, 2, 3, 3.2, 3.2, 3, 3.3, 3, 2.8, 2.8, 3, 3.5, 4.3, 5.2, 5.6, 5, 3.6, 2];
  const HORA_SOMA = HORA.reduce((a, b) => a + b, 0);
  const SEMANA = [1.55, 1, .95, .95, 1, 1.1, 1.4];   /* domingo a sábado */
  const umaHora = () => { let r = rnd() * HORA_SOMA; for (let h = 0; h < 24; h++) { r -= HORA[h]; if (r <= 0) return h; } return 20; };
  const quando = (ini, fim) => {
    for (let t = 0; t < 30; t++) {
      const d = new Date(ini + rnd() * Math.max(0, fim - ini)); d.setHours(umaHora(), Math.floor(rnd() * 60), 0, 0);
      if (d.getTime() >= ini && d.getTime() <= fim && rnd() * 1.55 <= SEMANA[d.getDay()]) return d.getTime();
    }
    return ini + rnd() * Math.max(0, fim - ini);
  };
  let n = 0;
  for (let i = 0; i < 6; i++) {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1).getTime();
    const fim = Math.min(new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i) + 1, 1).getTime(), agora - 3 * 3600000);
    const fracao = i === 5 ? (fim - ini) / (new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).getTime() - ini) : 1;
    for (const prod of Object.keys(POR_MES)) {
      const qtd = Math.round(POR_MES[prod][i] * fracao);
      for (let k = 0; k < qtd; k++) {
        const criado = quando(ini, fim), idade = (agora - criado) / DIA;
        const q = rnd(); const por = QUEM[prod].find(([, lim]) => q <= lim)[0], pf_ = PERFIL[por];
        /* perdeu a vez: o aviso foi para outra pessoa antes, que não tocou no prazo */
        const perdeu = rnd() < PERFIL[OUTRO[por]].falta ? OUTRO[por] : '';
        /* ninguém respondeu (o rodízio deu a volta): raro, e só nos recentes */
        const esgotou = idade < 12 && rnd() < .035;
        const novinho = !esgotou && idade < 1.3 && rnd() < .55;
        const r = rnd(), pf = FECHA[prod] * pf_.fecha * (idade > 25 ? 1 : .5);
        let status = esgotou || novinho ? 'novo' : r < pf ? 'atendido' : (idade > 25 ? 'perdido' : idade > 6 ? um(['proposta', 'visita marcada', 'em atendimento', 'perdido', 'perdido']) : um(['em atendimento', 'visita marcada', 'proposta']));
        const decidido = status === 'atendido' || status === 'perdido';
        /* quando o status andou pela última vez: quem deixa parado tem leads em aberto sem mexer há dias */
        const mexeu = decidido ? criado + (1 + rnd() * 11) * DIA
          : status === 'novo' ? 0 : (rnd() < pf_.para ? criado + rnd() * Math.min(idade, 2) * DIA : agora - rnd() * Math.min(idade, 5) * DIA);
        const statusEm = mexeu ? new Date(Math.min(agora - 3600000, Math.max(criado + 600000, mexeu))).toISOString() : '';
        const respMin = (3 + rnd() * rnd() * 30) * (2.6 - i * .4) * pf_.vel;   /* a equipe fica mais rápida mês a mês */
        const ref = REFS[prod] ? um(REFS[prod]) : '';
        const nome = um(NOMES);
        const pedido = prod === 'venda' ? um(['Visita', 'Visita', 'Proposta', 'Financiamento']) : prod === 'temporada' ? 'Reserva' : prod === 'aluguel' ? 'Visita' : um(['Vender o imóvel', 'Vender o imóvel', 'Anunciar para temporada', 'Anunciar para locação']);
        const extra = { Pedido: pedido }; if (prod === 'captacao') extra['Balneário'] = um(BALN);
        const canal = rnd(), origem = canal < .6 ? 'robo-whatsapp' : canal < .83 ? 'robo-instagram' : canal < .95 ? 'site' : 'robo-whatsapp';
        const em = new Date(criado).toISOString();
        const equipe = { modo: 'rodizio', produto: prod === 'captacao' ? 'venda' : prod, falhou: [], em };
        if (esgotou) Object.assign(equipe, { avisados: [por, OUTRO[por]], passouDe: [por, OUTRO[por]], esgotou: true });
        else if (novinho && rnd() < .5) Object.assign(equipe, { avisados: [por], vez: por });
        else Object.assign(equipe, { avisados: perdeu ? [perdeu, por] : [por], ...(perdeu ? { passouDe: [perdeu] } : {}),
          resposta: { acao: um(['confirmado', 'confirmado', 'confirmado', 'assumido', 'outro']), por, em: new Date(criado + respMin * 60000).toISOString(), clienteAvisado: true } });
        saida.push({
          id: 'demo-h' + (++n), nome, telefone: '', rotulo: ROT[prod], imovelRef: ref, status, statusEm: statusEm || undefined,
          temperatura: status === 'atendido' ? 'quente' : status === 'perdido' ? 'frio' : um(['quente', 'morno', 'morno', 'frio']),
          mensagem: prod === 'captacao' ? nome + ' quer ' + pedido.toLowerCase().replace('vender o imóvel', 'vender um imóvel') + ' em ' + extra['Balneário'] + '.' : nome + ' pediu ' + pedido.toLowerCase() + ' da Ref. ' + ref + '.',
          extra, criadoEm: em, origem, ...(canal >= .95 ? { anuncio: { titulo: 'Casas em Pontal do Paraná' } } : {}), equipe,
        });
      }
    }
  }
  return saida;
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
  const p = WZ.pedidos.find(x => x.id === id); const antes = p ? p[campo] : undefined, antesEm = p ? p.statusEm : undefined; if (p) p[campo] = valor;
  /* quando o status mudou: os relatórios contam o Fechado no mês em que fechou (16/11/2026) */
  if (p && status) p.statusEm = new Date().toISOString();
  let ok = true;
  if (WZ_REAL() && p) {
    const dados = Object.assign({}, p); delete dados.id;
    try { const r = await supaFetch('pedidos?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ data: dados }), headers: { Prefer: 'return=minimal' } }); ok = r.ok; } catch (x) { ok = false; }
  }
  if (!ok && p) { p[campo] = antes; if (status) p.statusEm = antesEm; }
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

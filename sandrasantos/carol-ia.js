/* =====================================================
   ASSISTENTE DA SANDRA — alcança TODAS as abas (17/10/2026)

   Regra do Eugênio (skill agente-assistente): o assistente mexe em todos os
   recursos do app. O motor (assistente.js) já cuida de passeios, agenda,
   reservas e bloqueios; aqui ele ganha as abas do painel dela: ORÇAMENTOS
   (pedidos da vitrine, serviços, aceitar → reserva), VOUCHER padronizado,
   roteiros, avaliações, tarefas, recados, clientes e pontos turísticos.
   As ferramentas de cupom e de marketing da base saem (as abas saíram).

   Ferramentas, um chat só:
   - ver_dados {o_que, busca}  — LER qualquer coleção;
   - mexer {onde, acao, quem, campos} — CRIAR / MUDAR / APAGAR, sempre com
     o cartão "vou fazer isso — confirma?";
   - mudar_voucher (o orçamento mora em orcamento-premium-ia.js);
   - anotar_tarefa — o atalho do "anota aí";
   - abrir_aba — quando a coisa se faz tocando, leva até a tela.
   Nome que serve para dois registros → devolve as opções e o assistente
   pergunta qual. Nunca chuta em ferramenta que escreve.
   ===================================================== */
'use strict';

/* ---------- conversores de campo (o que o modelo manda → o que o app grava) ---------- */
const MX = {
  txt: (v) => { const s = String(v == null ? '' : v).trim(); if (!s) throw new Error('texto vazio'); return s.slice(0, 2000); },
  txtOuNada: (v) => String(v == null ? '' : v).trim().slice(0, 2000),
  num: (v) => { const n = +String(v).replace(',', '.').replace(/[£€\s]/g, ''); if (!isFinite(n) || n < 0) throw new Error('número inválido: ' + v); return n; },
  /* valor de orçamento: número ou "a combinar" (vazio) */
  valor: (v) => { const s = String(v == null ? '' : v).trim(); if (!s || /combinar|consulta|sem/i.test(s)) return null; return MX.num(s); },
  bool: (v) => { if (typeof v === 'boolean') return v; const s = String(v).toLowerCase(); if (/^(sim|s|true|1|yes)$/.test(s)) return true; if (/^(n[aã]o|n|false|0|no)$/.test(s)) return false; throw new Error('sim ou não?'); },
  data: (v) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) throw new Error('data AAAA-MM-DD'); return String(v); },
  dataOuNada: (v) => { const s = String(v == null ? '' : v).trim(); if (!s || /^sem/i.test(s)) return ''; return MX.data(s); },
  horaOuNada: (v) => { const s = String(v == null ? '' : v).trim(); if (!s || /^sem/i.test(s)) return ''; if (!/^\d{1,2}:\d{2}$/.test(s)) throw new Error('hora HH:MM'); return s.padStart(5, '0'); },
  um: (lista) => (v) => { const s = String(v).toLowerCase().trim(); if (!lista.includes(s)) throw new Error('use um de: ' + lista.join(', ')); return s; },
};
const dtIa = (iso) => /^\d{4}-\d{2}-\d{2}/.test(iso || '') ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '';
const vOrc = (v) => v === null || v === undefined || v === '' ? 'a combinar' : (typeof eur === 'function' ? eur(v) : v);

/* ---------- o mapa das coleções: rótulo, aba, como achar, como nomear, campos aceitos ---------- */
const IA_COLECOES = {
  pedidos: { rotulo: 'pedido da vitrine', aba: 'orcamentos', achar: ['nome', 'whats', 'resumo'], nomear: (p) => `${p.nome} · ${typeof pedidoRotulo === 'function' ? pedidoRotulo(p) : p.tipo}`,
    campos: { respondido: MX.bool, arquivado: MX.bool }, semCriar: true,
    ver: (p) => ({ id: p.id, tipo: typeof pedidoRotulo === 'function' ? pedidoRotulo(p) : p.tipo, cliente: p.nome, whats: p.whats, chegou: p.criado, resumo: p.resumo,
      respondido: !!p.respondido, orcamento: p.orcamentoId ? ((typeof Orc !== 'undefined' && Orc.get(p.orcamentoId)) || {}).num || p.orcamentoId : 'ainda não montado', ficha: p.ficha || undefined }) },
  voucher: { rotulo: 'bloco do voucher', aba: 'voucher', achar: ['titulo', 'k'], nomear: (b) => b.titulo,
    campos: { titulo: MX.txt, texto: MX.txtOuNada, ativo: MX.bool }, obrigatorios: ['titulo'],
    ver: (b) => ({ id: b.k, titulo: b.titulo, texto: b.k === 'termos' ? '(os termos de Ajustes)' : b.texto, aparece: b.ativo !== false }) },
  roteiros: { rotulo: 'roteiro', aba: 'roteiros', achar: ['nome', 'codigo'], nomear: (r) => `${r.nome} (${r.codigo})`,
    campos: { nome: MX.txt, ini: MX.dataOuNada, fim: MX.dataOuNada, adultos: MX.num, criancas: MX.num, hotel: MX.txtOuNada, obs: MX.txtOuNada, status: MX.um(['rascunho', 'publicado']) },
    obrigatorios: ['nome'],
    ver: (r) => ({ id: r.id, codigo: r.codigo, cliente: r.nome, whats: r.whats, de: r.ini, ate: r.fim, adultos: r.adultos, criancas: r.criancas, hotel: r.hotel,
      obs: r.obs, situacao: r.status, dias: (r.dias || []).map(d => ({ data: d.data, pontos: (d.periodos || []).flatMap(p => p.itens).map(id => ((typeof ponto === 'function' && ponto(id)) || { n: id }).n) })) }) },
  avaliacoes: { rotulo: 'avaliação', aba: 'avaliacoes', achar: ['nome', 'texto'], nomear: (a) => `${a.nome}${+a.estrelas ? ' (' + a.estrelas + '★)' : ''}`,
    campos: { publicar: MX.bool }, semCriar: true,
    ver: (a) => ({ id: a.id, nome: a.nome, estrelas: a.estrelas || 'depoimento em vídeo', texto: a.texto, passeio: a.tourId, data: a.data, video: a.video || undefined, cliente_autorizou: a.autorizou !== false, publicada: !!a.publicar }) },
  tarefas: { rotulo: 'tarefa', aba: 'tarefas', achar: ['texto', 'nota'], nomear: (t) => t.texto + (t.data ? ' · ' + dtIa(t.data) : ''),
    campos: { texto: MX.txt, nota: MX.txtOuNada, data: MX.dataOuNada, hora: MX.horaOuNada, area: MX.um(['pro', 'pessoal']), prioridade: MX.um(['alta', 'media', 'baixa']), feita: MX.bool },
    obrigatorios: ['texto'], novo: () => ({ area: 'pro', prioridade: 'media', feita: false, data: '', hora: '', nota: '' }),
    ver: (t) => ({ id: t.id, texto: t.texto, nota: t.nota || '', dia: t.data || 'sem dia', hora: t.hora || '', area: t.area, prioridade: t.prioridade, feita: !!t.feita }) },
  recados: { rotulo: 'recado', aba: 'tarefas', achar: ['nome', 'texto'], nomear: (r) => `${r.nome}: ${String(r.texto).slice(0, 40)}`,
    campos: { atendido: MX.bool }, semCriar: true,
    ver: (r) => ({ id: r.id, canal: r.canal, nome: r.nome, texto: r.texto, chegou: r.chegou, atendido: !!r.atendido }) },
  fichas: { rotulo: 'ficha de cliente', aba: 'clients', achar: ['nome', 'whats', 'email', 'hotel'], nomear: (f) => f.nome,
    campos: { idades: MX.txtOuNada, pais: MX.txtOuNada, mobilidade: MX.txtOuNada, alimentacao: MX.txtOuNada, ocasiao: MX.txtOuNada, notas: MX.txtOuNada,
      tags: (v) => { const l = (Array.isArray(v) ? v : String(v).split(',')).map(x => String(x).trim()).filter(Boolean);
        const ok = typeof TAGS_FICHA !== 'undefined' ? TAGS_FICHA : l; const fora = l.filter(x => !ok.includes(x));
        if (fora.length) throw new Error('etiquetas aceitas: ' + ok.join(', ')); return l; } },
    semCriar: true,
    ver: (f) => ({ id: f.id, nome: f.nome, whats: f.whats, email: f.email, instagram: f.insta || undefined, hotel: f.hotel, grupo: typeof grupoTexto === 'function' ? grupoTexto(f) : '',
      proximo: f.proximo ? { data: f.proximo.data, passeio: tl((Tours.get(f.proximo.ref.tourId) || { name: { pt: '' } }).name), horario: janelaDoTour({ time: f.proximo.ref.time, horas: f.proximo.ref.horas }),
        pago: Bookings.paid(f.proximo.ref), falta: Bookings.due(f.proximo.ref) } : null,
      compras: f.itens.map(i => (typeof rotuloItem === 'function' ? rotuloItem(i) : i.tipo)), total: f.total, pago: f.pago, a_receber: f.aReceber,
      idades: f.notas.idades, de_onde: f.notas.pais, mobilidade: f.notas.mobilidade, alimentacao: f.notas.alimentacao, ocasiao: f.notas.ocasiao, notas: f.notas.notas, etiquetas: f.notas.tags }) },
  pontos: { rotulo: 'ponto turístico', aba: 'pontos', achar: ['n', 'area'], nomear: (p) => p.n,
    campos: { n: MX.txt, d: MX.txtOuNada, dica: MX.txtOuNada, area: MX.um(Object.keys(typeof AREAS !== 'undefined' ? AREAS : { outros: 1 })) }, obrigatorios: ['n'],
    ver: (p) => ({ id: p.id, nome: p.n, area: p.area, texto: p.d, dica: p.dica || '' }) },
};
/* nomes que o modelo entende, na descrição da ferramenta */
const IA_CAMPOS_TXT = Object.entries(IA_COLECOES).map(([k, c]) => `${k} (${c.rotulo}): ${Object.keys(c.campos).join(', ')}${c.semCriar ? ' — só mudar/apagar' : ''}`).join('; ');

/* a lista de cada coleção (pontos = base + o que ela editou; voucher = os blocos do modelo) */
function iaLista(onde) {
  if (onde === 'pontos') return typeof todosPontos === 'function' ? todosPontos() : (typeof PONTOS !== 'undefined' ? PONTOS : []);
  if (onde === 'fichas') return typeof fichasTodas === 'function' ? fichasTodas() : [];
  if (onde === 'voucher') return typeof voucherModelo === 'function' ? voucherModelo().blocos : [];
  if (!Array.isArray(DB[onde])) DB[onde] = [];
  return DB[onde];
}
/* achar UM registro — por id exato, senão por nome; dois candidatos = pergunta */
function iaAcha(onde, quem) {
  const C = IA_COLECOES[onde], l = iaLista(onde);
  const q = String(quem || '').toLowerCase().trim();
  if (!q) return { erro: 'diga qual ' + C.rotulo };
  const exato = l.find(x => x.id === quem || x.k === quem || (x.codigo && String(x.codigo).toLowerCase() === q) || (x.num && String(x.num).toLowerCase() === q));
  if (exato) return { item: exato };
  const achou = l.filter(x => C.achar.some(k => String(x[k] || '').toLowerCase().includes(q)) || (x.cliente && String(x.cliente.nome || '').toLowerCase().includes(q)));
  if (achou.length === 1) return { item: achou[0] };
  if (achou.length > 1) return { erro: 'mais de um registro serve — pergunte qual', opcoes: achou.slice(0, 8).map(x => ({ id: x.id || x.k, nome: C.nomear(x) })) };
  return { erro: C.rotulo + ' não encontrado(a)', dica: 'use ver_dados para ver os ids' };
}
function iaConverte(C, campos, parcial) {
  const out = {};
  for (const [k, v] of Object.entries(campos || {})) {
    if (!C.campos[k]) throw new Error(`campo "${k}" não existe aqui — aceitos: ${Object.keys(C.campos).join(', ')}`);
    out[k] = C.campos[k](v);
  }
  if (!parcial) for (const k of C.obrigatorios || []) if (out[k] === undefined || out[k] === '') throw new Error('faltou ' + k);
  return { out };
}
const iaMostra = (k, v) => Array.isArray(v) ? (v.join(', ') || '—') : typeof v === 'boolean' ? (v ? 'sim' : 'não')
  : (/^(data|validade|ini|fim)$/.test(k) && v ? dtIa(v) : k === 'valor' ? vOrc(v) : String(v === '' || v === null || v === undefined ? '—' : v));

/* ---------- fora do pacote dela: cupons e marketing saem do assistente ---------- */
const IA_FORA = ['ver_cupons', 'criar_cupom', 'apagar_cupom', 'ver_marketing', 'salvar_posts', 'mudar_post', 'apagar_post',
  'salvar_anuncio', 'apagar_anuncio', 'criar_criativo', 'mudar_criativo', 'apagar_criativo', 'gerar_imagem', 'ver_fotos'];
for (let i = IA_FERRAMENTAS.length - 1; i >= 0; i--) if (IA_FORA.includes(IA_FERRAMENTAS[i].name)) IA_FERRAMENTAS.splice(i, 1);
for (const n of IA_FORA) IA_LEITURA.delete(n);

/* ---------- as ferramentas ---------- */
IA_FERRAMENTAS.push(
  { name: 'ver_dados', description: 'Lê as abas do painel que não têm ferramenta própria: pedidos (o que chegou da vitrine: transfer, viagem sob medida, valor de passeio), voucher (os blocos do voucher padronizado), roteiros, avaliacoes, tarefas, recados, fichas (cliente: tudo de uma pessoa), pontos (pontos turísticos; use busca). Devolve os ids.',
    input_schema: obj({ o_que: { type: 'string', enum: Object.keys(IA_COLECOES) }, busca: S_('texto para filtrar (opcional)') }, ['o_que']) },
  { name: 'mexer', description: 'Cria, muda ou apaga um registro dessas abas. quem = id (de ver_dados) ou nome; se servir para dois, a ferramenta devolve as opções — pergunte qual. Campos aceitos por aba: ' + IA_CAMPOS_TXT + '. Datas AAAA-MM-DD; "sem" tira o dia de uma tarefa.',
    input_schema: obj({ onde: { type: 'string', enum: Object.keys(IA_COLECOES) }, acao: { type: 'string', enum: ['criar', 'mudar', 'apagar'] }, quem: S_('id, número ou nome (mudar/apagar)'),
      campos: { type: 'object', description: 'campo: valor', additionalProperties: true } }, ['onde', 'acao']) },
  { name: 'mudar_voucher', description: 'Muda o cabeçalho do voucher padronizado: faixa (texto ao lado do logo; \\n quebra a linha), frase_faixa, titulo, subtitulo, despedida (antes do nome dela) e presente (pôr os guias de Portugal e da Itália no voucher). Os blocos (o que levar, pagamento…) mudam com mexer onde=voucher.',
    input_schema: obj({ faixa: S_(), frase_faixa: S_(), titulo: S_(), subtitulo: S_(), despedida: S_(), presente: { type: 'boolean' } }) },
  { name: 'anotar_tarefa', description: 'Anota uma tarefa (fazer ou PENSAR depois, ideia, brainstorm). texto = título curto; nota = a ideia inteira. Com data entra na agenda de tarefas.',
    input_schema: obj({ texto: S_(), nota: S_(), data: S_('AAAA-MM-DD'), hora: S_('HH:MM'), area: { type: 'string', enum: ['pro', 'pessoal'] }, prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] } }, ['texto']) },
  { name: 'abrir_aba', description: 'Leva a guia até uma tela do painel quando a coisa se faz tocando (ex.: ver o documento do orçamento, montar os dias de um roteiro, imprimir o QR).',
    input_schema: obj({ aba: { type: 'string', enum: ADM_TABS.map(([id]) => id) } }, ['aba']) },
);
IA_LEITURA.add('ver_dados'); IA_LEITURA.add('abrir_aba');

const _iaLeituraBase = iaLeitura;
iaLeitura = function (nome, i) {
  if (nome === 'abrir_aba') {
    if (!ADM_TABS.some(([id]) => id === i.aba)) return E_('aba não existe');
    setTimeout(() => go('/adm/' + i.aba), 0); return { ok: true, aberta: i.aba };
  }
  if (nome !== 'ver_dados') return _iaLeituraBase(nome, i);
  const C = IA_COLECOES[i.o_que]; if (!C) return E_('não conheço essa aba');
  const q = String(i.busca || '').toLowerCase().trim();
  let l = iaLista(i.o_que);
  if (q) l = l.filter(x => JSON.stringify(C.ver(x)).toLowerCase().includes(q));
  if (i.o_que === 'tarefas' && !q) l = l.filter(t => !t.feita);
  if (i.o_que === 'pedidos' && !q) l = l.filter(p => !p.arquivado);
  const lim = i.o_que === 'pontos' ? 25 : 60;
  return l.length ? { total: l.length, itens: l.slice(0, lim).map(C.ver) } : 'nada' + (q ? ' com "' + i.busca + '"' : '') + ' em ' + i.o_que;
};

const _iaPlanoBase = iaPlano;
iaPlano = function (nome, i) {
  if (nome === 'anotar_tarefa') return iaPlano('mexer', { onde: 'tarefas', acao: 'criar', campos: Object.fromEntries(Object.entries(i).filter(([, v]) => v !== undefined && v !== '')) });
  try {
    if (nome === 'mudar_voucher') {
      const M = voucherModelo(), mapa = { faixa: 'faixa', frase_faixa: 'faixaSub', titulo: 'titulo', subtitulo: 'sub', despedida: 'assinatura', presente: 'presente' };
      const out = {};
      for (const [k, v] of Object.entries(i)) { if (!mapa[k] || v === undefined) continue; out[mapa[k]] = k === 'presente' ? MX.bool(v) : MX.txtOuNada(v); }
      if (!Object.keys(out).length) return E_('diga o que mudar no voucher');
      return { titulo: 'Mudar o voucher', linhas: Object.entries(out).map(([k, v]) => [k, `${iaMostra(k, M[k])} → ${iaMostra(k, v)}`]), assumiu: [],
        fazer: () => { Object.assign(M, out); save(); return { ok: true }; } };
    }
  } catch (e) { return E_(String(e.message || e)); }
  if (nome !== 'mexer') return _iaPlanoBase(nome, i);
  const C = IA_COLECOES[i.onde]; if (!C) return E_('não conheço essa aba');
  const tit = { criar: 'Criar', mudar: 'Mudar', apagar: 'Apagar' }[i.acao] + ' ' + C.rotulo;
  try {
    if (i.acao === 'criar') {
      if (C.semCriar) return E_(`${C.rotulo} não se cria por aqui — nasce do cliente, pelo app. Use mudar, ou abrir_aba ${C.aba}.`);
      const { out } = iaConverte(C, i.campos, false);
      const linhas = Object.entries(out).map(([k, v]) => [k, iaMostra(k, v)]);
      return { titulo: tit, linhas, assumiu: [],
        fazer: () => {
          if (i.onde === 'roteiros') { const r = novoRoteiro(out); return { ok: true, id: r.id, codigo: r.codigo }; }
          if (i.onde === 'voucher') { voucherModelo().blocos.push({ k: 'b' + uid().slice(0, 5), titulo: out.titulo, texto: out.texto || '', ativo: out.ativo !== false }); save(); return { ok: true }; }
          if (i.onde === 'pontos') { const id = 'pt-' + String(out.n).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + uid().slice(0, 3);
            DB.pontos.push({ id, n: out.n, area: out.area || 'outros', lat: null, lng: null, d: out.d || '', dica: out.dica || '', ph: '', cr: '', fonte: 'carol' }); grava(); return { ok: true, id }; }
          const novo = { id: uid(), ...(C.novo ? C.novo() : {}), ...out, criado: new Date().toISOString() }; iaLista(i.onde).push(novo); grava(); return { ok: true, id: novo.id };
        } };
    }
    const r = iaAcha(i.onde, i.quem); if (r.erro) return r;
    const x = r.item;
    if (i.acao === 'apagar') {
      if (i.onde === 'voucher' && VOUCHER_PADRAO.blocos.some(b => b.k === x.k)) return E_('este bloco é do modelo: desligue com mexer mudar ativo=não');
      return { titulo: tit, linhas: [[C.rotulo, C.nomear(x)]], assumiu: [],
        fazer: () => {
          if (i.onde === 'pontos') DB.pontos = (DB.pontos || []).filter(z => z.id !== x.id);
          else if (i.onde === 'fichas') DB.fichas = (DB.fichas || []).filter(z => z.id !== x.id);   /* só as anotações: as compras continuam */
          else if (i.onde === 'voucher') { const M = voucherModelo(); M.blocos = M.blocos.filter(b => b !== x); save(); return { ok: true }; }
          else DB[i.onde] = DB[i.onde].filter(z => z.id !== x.id);
          grava(); return { ok: true };
        } };
    }
    if (i.acao === 'mudar') {
      const { out } = iaConverte(C, i.campos, true);
      if (!Object.keys(out).length) return E_('nada muda — diga os campos');
      if (i.onde === 'avaliacoes' && out.publicar && x.autorizou === false) return E_('o cliente NÃO autorizou publicar esta avaliação');
      const antes = i.onde === 'fichas' ? (x.notas || {}) : x;
      const linhas = [[C.rotulo, C.nomear(x)]].concat(Object.entries(out).map(([k, v]) => [k, `${iaMostra(k, antes[k] === undefined ? '' : antes[k])} → ${iaMostra(k, v)}`]));
      return { titulo: tit, linhas, assumiu: [],
        fazer: () => {
          const extra = {};
          if (i.onde === 'tarefas' && 'feita' in out) extra.feitaEm = out.feita ? new Date().toISOString() : '';
          if (i.onde === 'tarefas' && out.data === '') extra.hora = '';          /* tirou o dia: tira a hora junto */
          if (i.onde === 'pontos') { DB.pontos = (DB.pontos || []).filter(z => z.id !== x.id).concat([{ ...x, ...out, fonte: 'carol' }]); }
          else if (i.onde === 'fichas') { DB.fichas = DB.fichas || []; let f = DB.fichas.find(z => z.id === x.id); if (!f) { f = { id: x.id }; DB.fichas.push(f); } Object.assign(f, out); }
          else if (i.onde === 'voucher') { Object.assign(x, out); save(); return { ok: true }; }
          else if (i.onde === 'pedidos' && 'respondido' in out && typeof Pedidos !== 'undefined') { Pedidos.marca(x.id, out.respondido); if ('arquivado' in out) x.arquivado = out.arquivado; }
          else Object.assign(x, out, extra);
          grava(); return { ok: true };
        } };
    }
    return E_('ação: criar, mudar ou apagar');
  } catch (e) { return E_(String(e.message || e)); }
};

/* ---------- o prompt: mapa "aba → ferramenta" + as regras do negócio ---------- */
const _iaSistemaBase = iaSistema;
iaSistema = function () {
  const blocos = _iaSistemaBase();
  /* a base fala de marketing (posts, criativos, anúncios): as abas saíram do pacote dela */
  if (blocos[0] && blocos[0].text) blocos[0].text = blocos[0].text.split('\n').filter(l => !/^(Plano de postagem|Criativo|Imagem por IA|Anúncio \(Meta\))/.test(l)).join('\n');
  const st = DB.settings || {};
  blocos.push({ type: 'text', text: `## Quem é a guia
${guiaNome()} (Sandra Santos), da ${guiaNegocio()}: tour leader registrada no Turismo de Portugal (RNAAT 1013/2026), mora em Tavira (Algarve). Faz viagens sob medida e passeios pela Itália (Nápoles, Costa Amalfitana, Cilento, Benevento, Sicília) e por Portugal (Algarve). Lema: "Menos estradas, mais histórias." Contra o "15 dias e 12 cidades". Voz próxima, conta a história antes de vender.

## Você alcança TODAS as abas do painel
- Hoje, Agenda, Meus passeios, Reservas: ver_passeios, ver_agenda, ver_reservas, ver_bloqueios e as ferramentas de passeio, horário e bloqueio.
- Orçamentos: ver_orcamentos; criar_orcamento e editar_orcamento; a partir de um pedido da vitrine (ver_dados pedidos): orcamento_do_pedido; a proposta para o cliente (PDF e link): proposta_orcamento; o cliente fechou: orcamento_fechou (vira reserva e abre o kit da viagem).
- Voucher: ver_dados voucher; mexer onde=voucher (blocos: título, texto, ativo; criar bloco novo); mudar_voucher para o cabeçalho e o presente.
- Roteiros (os dias de uma viagem sob medida): ver_dados roteiros; mexer criar/mudar. Pôr pontos em cada dia: abrir_aba roteiros.
- Avaliações: ver_dados avaliacoes; mexer publicar — só se o cliente autorizou.
- Tarefas e recados: anotar_tarefa; ver_dados tarefas / recados; mexer (feita, data, atendido…).
- Clientes (a ficha de cada pessoa): ver_dados fichas com busca pelo nome ou WhatsApp; mexer onde=fichas para anotar idades, mobilidade, alimentação, ocasião, notas e etiquetas.
- Pontos turísticos: ver_dados pontos; mexer criar/mudar (nome, texto, dica, área).
- Financeiro, Extrato, Relatórios e Ajustes: leia com ver_reservas; o que se faz tocando: abrir_aba financeiro / money / reports / settings.
- O que nenhuma ferramenta faz: abrir_aba e diga o que tocar. Nunca responda só "não consigo".

## Onde guardar cada coisa
- Coisa para fazer ou pensar depois → anotar_tarefa: título curto em texto, a ideia inteira em nota.
- Pedido de valor que chegou pelo WhatsApp ou Instagram → criar_orcamento, só com o que ela disse.
- Coisa sobre um cliente (idade, alergia, mobilidade, gosto, aniversário) → mexer fichas mudar, nunca guardar_memoria.
- Regra ou preferência que vale para sempre → guardar_memoria.
- Se você escrever "anotei", "registrei" ou "marquei", você TEM que ter chamado a ferramenta neste mesmo turno.

## Regras do negócio
Todos os passeios estão com VALOR A COMBINAR até ela definir os preços: nunca invente preço, nem em orçamento — valor é sempre o que ela disser; sem valor, o serviço fica "a combinar". O produto principal é a viagem sob medida (de carro, com curadoria e acompanhamento). Sinal, cancelamento e remarcação ainda são provisórios (${st.termos && st.termos.pt ? st.termos.pt.length : 0} linhas de termos em Ajustes): não prometa regra que não está escrita lá. ${st.diaExclusivo === false ? 'Ela aceita mais de um grupo por dia.' : 'Um grupo por dia: dia com reserva fica ocupado (transfer não ocupa).'} Antes de sugerir uma data, olhe ver_agenda.` });
  return blocos;
};

if (typeof module !== 'undefined') module.exports = { IA_COLECOES, IA_FORA };

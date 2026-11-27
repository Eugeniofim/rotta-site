/* =====================================================
   PLANO E PAGAMENTO (27/11/2026) — a mensalidade no cartão, sozinha, e o medidor da inteligência artificial.

   O dono e a gerência veem aqui, numa tela só (#/pagamento):
     - a MENSALIDADE: valor, dia, próxima cobrança e a forma (Pix ou cartão automático). O cartão é cadastrado uma
       vez numa página segura do Stripe (o painel nunca vê o número) e daí em diante a mensalidade cai sozinha;
     - o MEDIDOR DE IA: uma barra que esvazia conforme a Milla usa a inteligência artificial, com recarga na hora
       (um botão por pacote) e recarga automática no mesmo cartão. Enquanto o estúdio só mede (modo sombra), a tela
       mostra o uso e deixa o cartão pronto, sem cobrar nada.
   Quem fala com o Stripe é o cofre (rota pagamento): o navegador só pede ver, cartao, recarregar, confirmar,
   recarga-auto e mensalidade, e o cofre confere de novo quem pode. A corretora não vê nada disso.
   Stripe em modo de teste (stripe: 'teste'): só o estúdio vê a tela, com o aviso do cartão de teste, para ninguém
   da imobiliária digitar um cartão de verdade numa página de teste.
   A volta do Stripe: #/pagamento/s-<sessão> (deu certo: confirma UMA vez e limpa o endereço) ou #/pagamento/cancelou.
   Só aparece no app cujo config.js tem `pagamento: true`. Sem banco (demonstração), números de exemplo.
   ===================================================== */
'use strict';

const PG = { dados: null, carregou: false, buscando: false, erro: '', proibido: false, confirmando: false, feitos: {}, indo: false, salvando: false, msg: '', msgCor: '', msgFica: false };
const PG_LIGADO = () => typeof APP_CONFIG !== 'undefined' && APP_CONFIG.pagamento === true;
const PG_ESTUDIO = () => REAL() && WZ.papel === 'admin';
/* quem pode perguntar ao cofre: o estúdio, o dono e a gerência (VE_CONTA), e só com `pagamento: true` */
const PG_PODE = () => PG_LIGADO() && (PG_ESTUDIO() || VE_CONTA());
/* quem vê a tela com os dados: com o Stripe em teste, só o estúdio (e o cofre tem de dizer que é o estúdio) */
const pgVe = d => !!d && PG_PODE() && !PG.proibido && (d.stripe !== 'teste' || (PG_ESTUDIO() && d.papel === 'admin'));
const PG_STRIPE = /^https:\/\/([a-z0-9-]+\.)*stripe\.com\//i;   /* só sai do app para uma página do Stripe */
const PG_QUANDO = [10, 20, 30];

const pgNum = (v, casas) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const pgReal = v => { const n = Number(v) || 0; return (n < 0 ? '-' : '') + 'R$ ' + pgNum(Math.abs(n), Number.isInteger(n) ? 0 : 2); };
const pgCent = v => { const n = Number(v) || 0; return (n < 0 ? '-' : '') + 'R$ ' + pgNum(Math.abs(n), 2); };
const pgDataAno = s => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(s || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; };
const pgDia = s => { const t = String(s || ''); if (/^\d{4}-\d\d-\d\d$/.test(t)) return t.slice(8, 10) + '/' + t.slice(5, 7); const d = new Date(t); return isNaN(d) ? '' : String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const pgDiaMes = n => Number(n) === 1 ? '1º' : String(Number(n) || '');
const pgMesNome = () => (typeof AS_MES_LONGO !== 'undefined' ? AS_MES_LONGO[new Date().getMonth()] : '') || 'este mês';
const pgCartaoCurto = k => (String((k && k.rotulo) || '').replace(/,\s*vence.*$/i, '').trim()) || 'guardado';
const pgVolta = () => location.origin + location.pathname;
const pgAviso = (t, cor) => { PG.msg = t || ''; PG.msgCor = cor || ''; };

/* demonstração (sem banco): a dona fictícia vê um plano de exemplo; nada é cobrado */
function pgDemo() {
  const h = new Date(), p = new Date(h.getFullYear(), h.getMonth() + 1, 1), ha = n => new Date(h.getTime() - n * 864e5).toISOString();
  const prox = p.getFullYear() + '-' + String(p.getMonth() + 1).padStart(2, '0') + '-01';
  return { papel: 'dono', stripe: 'real', demo: true,
    mensalidade: { valor: 349, vence_dia: 1, primeira_em: prox, forma: 'cartao', status: 'em_dia', proxima: prox, ultima_falha: null },
    cartao: { rotulo: 'Visa final 4242, vence 12/29' },
    ia: { modo: 'ligado', saldo: 143.2, pacote: 200, quando_pct: 20, auto: true, pct: 71.6, media_dia: 5.3, dias: 27, uso_mes: 56.8, respostas_mes: 640,
      margem: 0, imposto: 0.13, falha: null, andando: false,
      lancamentos: [{ quando: ha(9), tipo: 'recarga', valor: 200, origem: 'auto' }, { quando: ha(38), tipo: 'recarga', valor: 200, origem: 'checkout' }] },
    pacotes: [100, 200, 300, 500] };
}

async function pgPede(acao, extra) {
  await authEnsure();
  const r = await fetch(WZ_COFRE() + '/pagamento', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + authToken() },
    body: JSON.stringify(Object.assign({ sala: SUPA_SALA, acao }, extra || {})) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j: j || {} };
}
async function pgCarregar(forcar) {
  if (!PG_PODE()) { PG.dados = null; PG.carregou = true; return; }
  if (!REAL()) { if (!PG.dados || forcar) PG.dados = pgDemo(); PG.carregou = true; return; }
  if (PG.buscando || PG.confirmando || (PG.carregou && !forcar)) return;
  PG.buscando = true;
  try {
    const r = await pgPede('ver');
    if (r.ok) { PG.dados = r.j; PG.erro = ''; PG.proibido = false; }
    else if (r.status === 403) { PG.dados = null; PG.proibido = true; PG.erro = ''; }
    else PG.erro = 'Não consegui ler o plano e o pagamento agora.';
  } catch (e) { PG.erro = 'Sem conexão: não consegui ler o plano e o pagamento.'; }
  finally { PG.buscando = false; PG.carregou = true; }
}

/* o medidor: quanto resta (0 a 100) e a cor (verde acima de 50%, âmbar de 20% a 50%, vermelho abaixo de 20% ou sem saldo) */
function pgMedidor(ia) {
  const saldo = Number(ia && ia.saldo) || 0, pacote = Number(ia && ia.pacote) || 0;
  let pct = ia && ia.pct != null && ia.pct !== '' ? Number(ia.pct) : (pacote > 0 ? saldo / pacote * 100 : 0);
  if (!isFinite(pct) || saldo <= 0) pct = 0;
  pct = Math.max(0, Math.min(100, pct));
  const cor = saldo <= 0 || pct < 20 ? 'verm' : pct <= 50 ? 'ambar' : 'verde';
  const dias = Number(ia && ia.dias);
  return { saldo, pacote, pct, cor, dias: saldo > 0 && dias > 0 ? Math.max(1, Math.round(dias)) : null,
    titulo: saldo <= 0 ? 'O saldo acabou' : { verde: 'Saldo em dia', ambar: 'Saldo baixando', verm: 'Saldo acabando' }[cor] };
}
const pgDias = n => '≈ ' + n + (n === 1 ? ' dia' : ' dias') + ' no ritmo de hoje';
/* a mensalidade numa palavra: cor e título da pílula */
function pgMensal(m) {
  if (!m) return null;
  if (m.status === 'atrasada') return { cor: 'verm', titulo: 'Mensalidade em atraso' };
  if (m.status === 'cancelada') return { cor: 'cinza', titulo: 'Mensalidade cancelada' };
  if (m.forma === 'cartao') return { cor: 'verde', titulo: 'No cartão, automático' };
  return { cor: 'azul', titulo: 'Pix' };
}
/* o resumo do menu e da Gestão: o que mais pede atenção */
function pgResumo(d) {
  const m = d.mensalidade, ia = d.ia, x = pgMensal(m);
  if (m && (m.status === 'atrasada' || (m.forma === 'cartao' && m.ultima_falha))) return { cor: 'verm', titulo: m.status === 'atrasada' ? 'Mensalidade em atraso' : 'O cartão recusou a mensalidade', sub: 'trocar o cartão · ver', c: null };
  if (ia && ia.modo === 'ligado') { const c = pgMedidor(ia); return { cor: c.cor, titulo: 'Saldo de IA: ' + pgCent(c.saldo), sub: (c.dias ? '≈ ' + c.dias + (c.dias === 1 ? ' dia' : ' dias') + ' · ' : '') + 'ver', c }; }
  if (x) return { cor: x.cor, titulo: x.titulo, sub: pgReal(m.valor) + '/mês · ver', c: null };
  if (ia && ia.modo === 'sombra') return { cor: 'ambar', titulo: 'Medindo a IA', sub: 'ver', c: null };
  return null;
}
const pgTrilho = c => `<span class="cr-trilho" aria-hidden="true"><i style="width:${c.pct.toFixed(1)}%"></i></span>`;

/* a linha no menu do computador (embaixo da IA da Milla) e no topo da Gestão no celular */
function pgLinhaLado() {
  const d = PG.dados; if (!pgVe(d)) return '';
  const x = pgResumo(d); if (!x) return '';
  const on = rota().tela === 'pagamento';
  return `<a class="as-lado pg-lado as-${x.cor} ${on ? 'on' : ''}" href="#/pagamento" ${on ? 'aria-current="page"' : ''}><span class="as-rot">Plano e pagamento${d.stripe === 'teste' ? ' · teste' : ''}</span><b class="num">${esc(x.titulo)}</b>${x.c ? pgTrilho(x.c) : ''}<small>${esc(x.sub)}</small></a>`;
}
function pgLinhaCel() {
  const d = PG.dados; if (!pgVe(d)) return '';
  const x = pgResumo(d); if (!x) return '';
  return `<a class="as-cel as-${x.cor}" href="#/pagamento"><span><span class="as-rot">Plano e pagamento</span><b class="num">${esc(x.titulo)}</b></span><span class="sm">ver ›</span></a>`;
}
/* no Início: o medidor quando o saldo está ligado; e uma faixa vermelha se o cartão recusou a mensalidade. No modo sombra, nada */
function pgCartao() {
  const d = PG.dados; if (!pgVe(d)) return '';
  const m = d.mensalidade, ia = d.ia; let h = '';
  if (m && m.forma === 'cartao' && m.ultima_falha) h += `<a class="as-faixa as-verm" href="#/pagamento"><b>O cartão recusou a mensalidade de ${esc(pgDia(m.ultima_falha.em))}.</b><span class="sm">${esc(m.ultima_falha.motivo || 'cobrança recusada')}. Troque o cartão para a mensalidade ficar em dia.</span><span class="btn btn-navy btn-p">Trocar o cartão</span></a>`;
  if (ia && ia.modo === 'ligado') {
    const c = pgMedidor(ia);
    const linha = ia.andando ? 'Recarregando no cartão…' : ia.falha ? 'A recarga automática não passou em ' + pgDia(ia.falha.em) + '. Troque o cartão ou recarregue por Pix.'
      : c.saldo <= 0 ? 'O saldo acabou. A Milla continua atendendo; recarregue para não ficar devendo.'
        : ia.auto && d.cartao ? 'Recarga automática ligada: ' + pgReal(ia.pacote) + ' quando chegar a ' + (Number(ia.quando_pct) || 20) + '%.' : 'Recarregue quando quiser, no cartão ou por Pix.';
    h += `<a class="cr-cartao as-${c.cor}" href="#/pagamento">
      <span class="cr-c1"><span class="as-rot">Saldo da inteligência artificial</span><b class="num">${pgCent(c.saldo)}${c.dias ? ` <small>· ${esc(pgDias(c.dias))}</small>` : ''}</b></span>
      ${pgTrilho(c)}<span class="sm">${esc(linha)}</span><span class="btn btn-line btn-p">Ver</span></a>`;
  }
  return h;
}

/* ---------- a tela ---------- */
function pgCartaoMensal(d, dis) {
  const m = d.mensalidade, k = d.cartao;
  if (!m) return `<div class="as-pagar"><h2>Mensalidade</h2><p class="sm">A mensalidade ainda não aparece aqui. O studio Ti Artes liga a mensalidade ao app; qualquer dúvida sobre valor ou pagamento é direto com o estúdio.</p></div>`;
  const x = pgMensal(m), noCartao = m.forma === 'cartao' && !!k, primeira = pgDataAno(m.proxima || m.primeira_em), dia = pgDiaMes(m.vence_dia);
  const falha = m.ultima_falha ? `<p class="pg-alerta">O cartão recusou a cobrança de ${esc(pgDia(m.ultima_falha.em))}: ${esc(m.ultima_falha.motivo || 'cobrança recusada')}. Troque o cartão.</p>` : '';
  let botoes = '';
  if (m.status !== 'cancelada') botoes = noCartao
    ? `<div class="ia-acoes"><button type="button" class="btn btn-line btn-p" data-act="pg-cartao" data-para="mensalidade" ${dis}>Trocar cartão</button><button type="button" class="pg-lnk" data-act="pg-mensal-pix" ${dis}>Voltar para o Pix</button></div>
       <p class="sm">O cartão é cobrado sozinho todo dia ${esc(dia)}. Se ele recusar, esta tela avisa.</p>`
    : `<div class="ia-acoes"><button type="button" class="btn btn-navy" data-act="pg-mensal-cartao" ${dis}>Pagar no cartão, automático</button></div>
       <p class="sm">${k ? 'Usa o cartão ' + esc(pgCartaoCurto(k)) + ', que já está guardado.' : 'Você cadastra o cartão uma vez numa página segura do Stripe.'} Nada é cobrado agora${primeira ? '; a primeira mensalidade no cartão é em ' + esc(primeira) : ''}.</p>`;
  return `<div class="as-pagar">
      <h2>Mensalidade</h2>
      <span class="as-pill as-${x.cor}"><i></i>${esc(x.titulo)}</span>
      <div class="as-valor num">${esc(pgReal(m.valor))}<small>por mês</small></div>
      <dl class="as-linhas">
        <div><dt>Vence</dt><dd>todo dia ${esc(dia)}</dd></div>
        ${m.proxima ? `<div><dt>Próxima cobrança</dt><dd class="num">${esc(pgDataAno(m.proxima))}</dd></div>` : ''}
        <div><dt>Forma</dt><dd>${m.forma === 'cartao' ? esc(k ? k.rotulo : 'Cartão') : 'Pix'}</dd></div>
      </dl>
      ${falha}${botoes}
      ${typeof vAssinatura === 'function' ? '<p class="sm"><a href="#/assinatura">Ver o Pix e os meses pagos ›</a></p>' : ''}
    </div>`;
}
const pgFraseAuto = (ligada, pacote, quando, k) => ligada
  ? `Quando o saldo chegar a ${quando}% (${pgReal(pacote * quando / 100)}), o cartão ${pgCartaoCurto(k)} é cobrado em ${pgReal(pacote)}.`
  : 'Desligada: o saldo só sobe quando você recarregar.';
function pgAuto(d, ia, pacotes, dis) {
  const k = d.cartao;
  if (!k) return `<div class="cr-recarga"><b>Recarga automática</b><span class="sm">Cadastre um cartão para ligar a recarga automática.</span>
      <div class="ia-acoes"><button type="button" class="btn btn-line btn-p" data-act="pg-cartao" data-para="ia" ${dis}>Cadastrar um cartão</button></div>
      <span class="sm">O cartão é cadastrado numa página segura do Stripe. Nada é cobrado agora.</span></div>`;
  const pac = Number(ia.pacote) || pacotes[0] || 200, q = Number(ia.quando_pct) || 20;
  const opP = [...new Set([...pacotes, pac])].sort((a, b) => a - b).map(v => `<option value="${v}" ${v === pac ? 'selected' : ''}>${esc(pgReal(v))}</option>`).join('');
  const opQ = [...new Set([...PG_QUANDO, q])].sort((a, b) => a - b).map(v => `<option value="${v}" ${v === q ? 'selected' : ''}>${v}%</option>`).join('');
  return `<form class="cr-recarga pg-auto" id="pg-auto-form" autocomplete="off">
      <b>Recarga automática</b>
      <label class="pg-check"><input type="checkbox" id="pg-auto-ligada" ${ia.auto ? 'checked' : ''}>Recarregar sozinho no cartão</label>
      <div class="cr-campos">
        <label class="sm">Pacote<select id="pg-auto-pacote" class="inp">${opP}</select></label>
        <label class="sm">Quando o saldo chegar a<select id="pg-auto-quando" class="inp">${opQ}</select></label>
      </div>
      <p class="sm b" id="pg-auto-resumo">${esc(pgFraseAuto(!!ia.auto, pac, q, k))}</p>
      <div class="ia-acoes"><button type="submit" class="btn btn-line btn-p" ${dis}>Guardar a recarga automática</button></div>
    </form>`;
}
const PG_ORIGEM = { auto: 'Recarga automática', checkout: 'Recarga no cartão', pix: 'Pix', ligar: 'Saldo inicial' };
const pgTipo = l => l.tipo === 'ajuste' ? 'Ajuste' : l.tipo === 'estorno' ? 'Estorno' : (PG_ORIGEM[l.origem] || 'Recarga');
function pgCartaoIa(d, dis) {
  const ia = d.ia; if (!ia || !ia.modo || ia.modo === 'desligado') return '';
  const pacotes = (Array.isArray(d.pacotes) && d.pacotes.length ? d.pacotes : [ia.pacote || 200]).map(Number).filter(n => n > 0);
  let cabeca;
  if (ia.modo === 'sombra') cabeca = `<span class="as-pill as-ambar"><i></i>Medindo</span>
      <p class="cr-prev">A Milla está medindo o uso da inteligência artificial. Em ${esc(pgMesNome())} ela usou ${esc(pgCent(ia.uso_mes))} em ${pgNum(ia.respostas_mes, 0)} ${Number(ia.respostas_mes) === 1 ? 'resposta' : 'respostas'}. A cobrança começa quando o estúdio ligar o saldo.</p>`;
  else {
    const c = pgMedidor(ia), pct = Math.round(c.pct);
    cabeca = `<span class="as-pill as-${c.cor}"><i></i>${esc(c.titulo)}</span>
      <div class="as-valor num">${esc(pgCent(c.saldo))}<small>de saldo</small></div>
      <div class="cr-trilho grande as-${c.cor} pg-medidor" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-valuetext="${esc(pgCent(c.saldo) + ', ' + pct + '% de um pacote de ' + pgReal(c.pacote))}" aria-label="Saldo da inteligência artificial"><i style="width:${c.pct.toFixed(1)}%"></i></div>
      <div class="cr-dias-eixo sm"><span>${c.dias ? esc(pgDias(c.dias)) : ''}</span><span>de um pacote de ${esc(pgReal(c.pacote))}</span></div>
      ${ia.andando ? '<p class="sm b">Recarregando no cartão…</p>' : ''}
      ${ia.falha ? `<p class="pg-alerta">A recarga automática não passou em ${esc(pgDia(ia.falha.em))} (${esc(ia.falha.motivo || 'cartão recusado')}). Troque o cartão ou recarregue por Pix.</p>` : ''}
      ${c.saldo <= 0 ? '<p class="pg-alerta">O saldo acabou. A Milla continua atendendo; recarregue para não ficar devendo.</p>' : ''}
      <h3>Recarregar agora</h3>
      <div class="ia-acoes" role="group" aria-label="Recarregar agora">${pacotes.map(v => `<button type="button" class="btn ${v === Number(ia.pacote) ? 'btn-navy' : 'btn-line'} btn-p num" data-act="pg-recarga" data-valor="${v}" ${dis}>${esc(pgReal(v))}</button>`).join('')}</div>
      <p class="sm">Abre a página segura do Stripe. O valor entra no saldo assim que o cartão aprovar.</p>`;
  }
  const imp = Math.round((Number(ia.imposto) || 0) * 100), mg = Math.round((Number(ia.margem) || 0) * 100);
  const preco = mg > 0 ? `Custo da inteligência artificial + impostos + ${mg}% de operação.` : `Você paga o custo da inteligência artificial e os impostos${imp ? ' (' + imp + '%)' : ''}, sem margem.`;
  const movs = (Array.isArray(ia.lancamentos) ? ia.lancamentos : []).slice(0, 8).map(l => {
    const v = l.tipo === 'estorno' ? -Math.abs(Number(l.valor) || 0) : Number(l.valor) || 0;
    return `<li><span class="num">${esc(pgDia(l.quando))}</span><span>${esc(pgTipo(l))}</span><b class="num">${v > 0 ? '+' : ''}${esc(pgCent(v))}</b></li>`;
  }).join('');
  const pix = typeof vAssinatura === 'function' ? 'pela <a href="#/assinatura">tela de mensalidade</a>' : 'pela tela de mensalidade';
  return `<div class="as-pagar">
      <h2>Inteligência artificial</h2>
      ${cabeca}
      ${pgAuto(d, ia, pacotes, dis)}
      <p class="sm">${esc(preco)}</p>
      ${movs ? `<h3>Últimos lançamentos</h3><ul class="cr-movs">${movs}</ul>` : ''}
      <p class="sm">Prefere Pix? Faça o Pix ${pix} e avise o estúdio: o valor entra no saldo.</p>
    </div>`;
}
function vPagamento() {
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">${esc(MARCA)}</span><h1>Plano e pagamento</h1></div></div>`;
  const msg = `<div class="pg-msg" id="pg-msg" role="status" ${PG.msgCor ? `data-cor="${esc(PG.msgCor)}"` : ''}>${esc(PG.msg)}</div>`;
  const caixa = (b, s) => `${topo}<div class="box"><b>${b}</b><div class="sm">${s}</div></div>`;
  const pixAqui = typeof vAssinatura === 'function' ? ', na tela <a href="#/assinatura">Sua assinatura</a>.' : '.';
  if (!PG_LIGADO()) return caixa('O plano e o pagamento ainda não aparecem neste app.', 'Qualquer dúvida sobre a mensalidade é direto com o studio Ti Artes.');
  if (!PG_PODE()) return caixa('Só o dono e a gerência da ' + esc(MARCA) + ' veem o plano e o pagamento.', 'As conversas, os leads e os imóveis estão no menu.');
  if (PG.proibido) return caixa('Esta conta não vê o plano e o pagamento.', 'Qualquer dúvida sobre a mensalidade é direto com o studio Ti Artes.');
  if (PG.confirmando) return topo + msg + '<div class="sm vazio">Conferindo o pagamento…</div>';
  if (!PG.carregou || PG.buscando && !PG.dados) return topo + msg + '<div class="sm vazio">Carregando…</div>';
  if (PG.erro && !PG.dados) return topo + msg + `<div class="box"><b>${esc(PG.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="pg-tentar">Tentar de novo</button></div>`;
  const d = PG.dados;
  if (!pgVe(d)) return caixa('O pagamento pelo cartão ainda não está pronto aqui.', 'Por enquanto, a mensalidade segue pelo Pix' + pixAqui);
  const dis = PG.indo || PG.salvando ? 'disabled' : '';
  return `${topo}${msg}
    ${d.stripe === 'teste' ? '<div class="pg-teste" role="note">Modo de teste do Stripe: só o estúdio vê esta tela. Use o cartão 4242 4242 4242 4242.</div>' : ''}
    <section class="as-tela pg-tela">
      ${pgCartaoMensal(d, dis)}
      ${pgCartaoIa(d, dis)}
    </section>
    ${d.demo ? '<p class="sm">Demonstração: números de exemplo. Nenhum cartão é cobrado.</p>' : ''}`;
}

/* ---------- a volta do Stripe e os pedidos ---------- */
const pgLimpa = () => { if (/^#\/?pagamento\//.test(location.hash)) location.replace(location.pathname + location.search + '#/pagamento'); };
/* chamado pelo app.js quando o endereço muda para #/pagamento[/…] */
async function pgEntrou(param) {
  if (!PG_PODE()) return;
  const p = String(param || '');
  if (p === 'cancelou') { pgAviso('Pagamento cancelado. Nada foi cobrado.', 'ambar'); PG.msgFica = true; pgLimpa(); return; }
  if (p.startsWith('s-')) { const id = p.slice(2); if (REAL() && /^[A-Za-z0-9_]{6,255}$/.test(id)) await pgConfirmar(id); else pgLimpa(); return; }
  if (PG.msgFica) PG.msgFica = false; else if (!PG.indo && !PG.salvando) pgAviso('');
  await pgCarregar(true);
}
async function pgConfirmar(id) {
  if (PG.feitos[id]) { pgLimpa(); return; }   /* uma vez por sessão do Stripe */
  PG.feitos[id] = true; PG.confirmando = true; pgAviso('');
  try {
    const r = await pgPede('confirmar', { s: id });
    if (r.ok && r.j.ok) pgAviso(r.j.o_que === 'recarga' ? 'Recarga feita.' : r.j.o_que === 'cartao' ? 'Cartão cadastrado.' : 'Pronto: o que está abaixo já está em dia.', 'verde');
    else pgAviso(r.j.texto || 'Não consegui conferir o pagamento agora. Se o cartão foi cobrado, o valor aparece aqui em instantes.', 'verm');
  } catch (e) { pgAviso('Sem conexão: não consegui conferir o pagamento. Abra esta tela de novo em instantes.', 'verm'); }
  PG.confirmando = false; PG.msgFica = true;
  pgLimpa();   /* o endereço volta a #/pagamento e a tela lê tudo de novo */
}
function pgIr(url) { location.assign(url); }
/* cadastrar o cartão ou recarregar: o cofre cria a página do Stripe e o app vai para lá */
async function pgAbrir(acao, extra) {
  if (!REAL()) { toast('Demonstração: no app de verdade abre a página segura do Stripe. Nada é cobrado aqui.'); return; }
  if (PG.indo) return;
  PG.indo = true; pgAviso('Abrindo a página segura do Stripe…'); render();
  try {
    const r = await pgPede(acao, Object.assign({ volta: pgVolta() }, extra));
    if (r.ok && PG_STRIPE.test(String(r.j.url || ''))) { pgIr(r.j.url); return; }   /* segue "abrindo" até a página trocar */
    pgAviso(r.j.texto || (r.ok ? 'O endereço do pagamento veio estranho. Nada foi cobrado.' : 'Não consegui abrir o pagamento agora. Nada foi cobrado.'), 'verm');
  } catch (e) { pgAviso('Sem conexão: não consegui abrir o pagamento. Nada foi cobrado.', 'verm'); }
  PG.indo = false; render();
}
async function pgMuda(acao, extra, feito) {
  PG.salvando = true; pgAviso(''); render();
  let ok = false;
  try {
    const r = await pgPede(acao, extra);
    ok = r.ok && !!r.j.ok;
    if (ok) { pgAviso(feito, 'verde'); toast(feito); }
    else pgAviso(r.j.texto || 'Não consegui guardar. Nada mudou.', 'verm');
  } catch (e) { pgAviso('Sem conexão: nada mudou.', 'verm'); }
  PG.salvando = false;
  if (ok) await pgCarregar(true);
  render();
  return ok;
}
async function pgMensalidade(forma) {
  const feito = forma === 'pix' ? 'A mensalidade voltou para o Pix.' : 'Pronto: a mensalidade agora é cobrada sozinha no cartão.';
  if (!REAL()) { if (PG.dados && PG.dados.mensalidade) PG.dados.mensalidade.forma = forma; pgAviso(feito, 'verde'); toast('Demonstração: nada é gravado.'); render(); return; }
  await pgMuda('mensalidade', { forma }, feito);
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]'); if (!el || !/^pg-/.test(el.dataset.act)) return;
    const a = el.dataset.act, d = PG.dados;
    if (a === 'pg-tentar') { await pgCarregar(true); render(); return; }
    if (!pgVe(d) || el.disabled || PG.indo || PG.salvando) return;
    if (a === 'pg-cartao') { await pgAbrir('cartao', { para: el.dataset.para === 'ia' ? 'ia' : 'mensalidade' }); return; }
    if (a === 'pg-recarga') {
      const v = Number(el.dataset.valor); if (!(v > 0) || !d.ia || d.ia.modo !== 'ligado') return;
      await pgAbrir('recarregar', { valor: v }); return;
    }
    if (a === 'pg-mensal-cartao') {
      if (!d.cartao) { await pgAbrir('cartao', { para: 'mensalidade' }); return; }
      const m = d.mensalidade || {}, q = pgDataAno(m.proxima || m.primeira_em);
      if (!confirm('A mensalidade passa para o cartão ' + pgCartaoCurto(d.cartao) + ' e é cobrada sozinha todo dia ' + pgDiaMes(m.vence_dia) + (q ? ', a partir de ' + q : '') + '. Confirmar?')) return;
      await pgMensalidade('cartao'); return;
    }
    if (a === 'pg-mensal-pix') {
      if (!confirm('A mensalidade volta para o Pix. O cartão continua guardado para a IA.')) return;
      await pgMensalidade('pix');
    }
  });
  const pgLeAuto = () => ({ ligada: !!($('pg-auto-ligada') || {}).checked, pacote: Number(($('pg-auto-pacote') || {}).value), quando_pct: Number(($('pg-auto-quando') || {}).value) });
  /* a frase de baixo acompanha o que a pessoa escolhe, antes de guardar */
  document.addEventListener('change', e => {
    if (!e.target.closest || !e.target.closest('#pg-auto-form')) return;
    const f = pgLeAuto(), el = $('pg-auto-resumo'); if (el && PG.dados) el.textContent = pgFraseAuto(f.ligada, f.pacote, f.quando_pct, PG.dados.cartao);
  });
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'pg-auto-form') return;
    e.preventDefault();
    const d = PG.dados; if (!pgVe(d) || !d.ia || PG.salvando) return;
    const f = pgLeAuto(), feito = f.ligada ? 'Recarga automática ligada.' : 'Recarga automática desligada.';
    if (!(f.pacote > 0) || !(f.quando_pct > 0)) return;
    const antes = { auto: d.ia.auto, pacote: d.ia.pacote, quando_pct: d.ia.quando_pct };
    Object.assign(d.ia, { auto: f.ligada, pacote: f.pacote, quando_pct: f.quando_pct });   /* a tela já mostra a escolha enquanto guarda */
    if (!REAL()) { pgAviso(feito, 'verde'); toast('Demonstração: nada é gravado.'); render(); return; }
    if (!(await pgMuda('recarga-auto', f, feito)) && PG.dados === d) { Object.assign(d.ia, antes); render(); }
  });
  /* voltou do Stripe pelo botão de voltar do navegador (página guardada): destrava os botões */
  window.addEventListener('pageshow', e => { if (e.persisted && PG.indo) { PG.indo = false; pgAviso(''); render(); } });
}
if (typeof module !== 'undefined') module.exports = { pgMedidor, pgMensal, pgFraseAuto };

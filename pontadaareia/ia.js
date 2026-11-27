/* =====================================================
   IA DA MILLA (23/11/2026) — a inteligência artificial na conta da própria imobiliária.

   O acordo novo da Ponta d'a Areia: a mensalidade fica em R$ 350 e a IA é paga direto por ela, na conta dela na
   Anthropic, com recarga automática no cartão. Esta tela é a ponta do painel:
     - o studio Ti Artes (a conta dona da sala) cola a chave, testa e, se precisar, tira;
     - o dono vê se está tudo certo, quanto a IA usou no mês e abre a conta da IA (saldo, recibos, cartão);
     - a corretora não vê nada disso.
   Quem guarda e usa a chave é o cofre (rota ia-chave, _comum/ia-propria.js): ela vai do campo direto para lá,
   testada antes, e nunca volta ao navegador (só os 4 últimos caracteres). Se a conta da imobiliária recusar
   (crédito, cartão, chave), a Milla segue com a IA da Ti Artes e esta tela mostra o aviso em vermelho.
   Só aparece no app cujo config.js tem `ia: true`. Antes de a chave entrar, só o estúdio vê.
   ===================================================== */
'use strict';

const IA = { dados: null, carregou: false, buscando: false, erro: '', colando: false, salvando: false, testando: false, msg: '', msgCor: '' };
const IA_LIGADO = () => typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ia === true && REAL();
/* o dono só vê depois que a chave dele entrou; o estúdio vê sempre */
const IA_VE = () => IA_LIGADO() && (WZ.papel === 'admin' || (VE_CONTA() && !!(IA.dados && IA.dados.tem_chave)));
const IA_ESTUDIO = () => WZ.papel === 'admin';
const IA_CAMBIO = 5.80 * 1.035;   /* dólar + IOF do cartão, a mesma conta do acordo */
const IA_CHAVES = 'https://platform.claude.com/settings/keys';
const iaUsd = v => 'US$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const iaBrl = v => 'R$ ' + Math.round(Number(v || 0) * IA_CAMBIO).toLocaleString('pt-BR');
const iaQuando = s => { if (!s) return ''; const d = new Date(s); if (isNaN(d)) return ''; return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' às ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0'); };
const iaDia = s => { const d = new Date(s); return isNaN(d) ? '' : String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const IA_TESTE = { ok: 'respondeu', chave: 'a chave não vale', credito: 'sem crédito ou cartão recusado', teto: 'limite de gasto do mês', permissao: 'sem permissão', modelo: 'sem acesso ao modelo', conta: 'recurso recusado', ritmo: 'pedidos demais no minuto', rede: 'sem conexão', outro: 'outro erro' };

async function iaPede(acao, extra) {
  await authEnsure();
  const r = await fetch(WZ_COFRE() + '/ia-chave', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + authToken() },
    body: JSON.stringify(Object.assign({ sala: SUPA_SALA, acao }, extra || {})) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j: j || {} };
}
async function iaCarregar(forcar) {
  if (!VE_CONTA() || !IA_LIGADO()) { IA.dados = null; IA.carregou = true; return; }
  if (IA.buscando || (IA.carregou && !forcar)) return;
  IA.buscando = true;
  try {
    const r = await iaPede('ver');
    if (r.ok) { IA.dados = r.j; IA.erro = ''; }
    else IA.erro = r.status === 403 ? 'Esta conta não vê a IA da Milla.' : 'Não consegui ler a IA da Milla agora.';
  } catch (e) { IA.erro = 'Sem conexão: não consegui ler a IA da Milla.'; }
  finally { IA.buscando = false; IA.carregou = true; }
}

/* o estado numa palavra: cor, título e a linha de baixo */
function iaSituacao(d) {
  if (!d) return null;
  if (!d.tem_chave) return { cor: 'azul', titulo: 'Na conta da Ti Artes', sub: 'colar a chave da ' + MARCA };
  if (d.falha) return { cor: 'verm', titulo: 'Usando a reserva da Ti Artes', sub: 'desde ' + iaQuando(d.falha.desde) + ' · ver' };
  if (d.ultimo_teste && d.ultimo_teste !== 'ok') return { cor: 'ambar', titulo: 'O último teste falhou', sub: (IA_TESTE[d.ultimo_teste] || d.ultimo_teste) + ' · ver' };
  return { cor: 'verde', titulo: 'Na conta da ' + MARCA, sub: iaUsd(d.mes && d.mes.usd_propria) + ' este mês · ver' };
}

/* a linha no menu do computador (embaixo da assinatura) e no topo da Gestão no celular */
function iaLinhaLado() {
  const x = IA_VE() && iaSituacao(IA.dados); if (!x) return '';
  const on = rota().tela === 'ia';
  return `<a class="as-lado as-${x.cor} ${on ? 'on' : ''}" href="#/ia" ${on ? 'aria-current="page"' : ''}><span class="as-rot">IA da Milla</span><b>${esc(x.titulo)}</b><small>${esc(x.sub)}</small></a>`;
}
function iaLinhaCel() {
  const x = IA_VE() && iaSituacao(IA.dados); if (!x) return '';
  return `<a class="as-cel as-${x.cor}" href="#/ia"><span><span class="as-rot">IA da Milla</span><b>${esc(x.titulo)}</b></span><span class="sm">ver ›</span></a>`;
}
/* no Início, só quando a conta da imobiliária recusou */
function iaFaixa() {
  const d = IA_VE() && IA.dados; if (!d || !d.falha) return '';
  return `<a class="as-faixa as-verm" href="#/ia"><b>A IA da Milla está usando a reserva da Ti Artes desde ${esc(iaQuando(d.falha.desde))}.</b><span class="sm">A conta da IA recusou: ${esc(d.falha.texto)}. A Milla segue respondendo.</span><span class="btn btn-navy btn-p">Ver</span></a>`;
}

function vIa() {
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">${esc(MARCA)}</span><h1>IA da Milla</h1></div></div>`;
  if (!IA_LIGADO() || !VE_CONTA()) return topo + `<div class="box"><b>${IA_LIGADO() ? 'Só o dono e a gerência da ' + esc(MARCA) + ' veem a IA da Milla.' : 'A IA da Milla não aparece neste app.'}</b><div class="sm">As conversas, os leads e os imóveis estão no menu.</div></div>`;
  if (!IA.carregou || IA.buscando && !IA.dados) return topo + '<div class="sm vazio">Carregando…</div>';
  if (IA.erro && !IA.dados) return topo + `<div class="box"><b>${esc(IA.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="ia-recarregar">Tentar de novo</button></div>`;
  const d = IA.dados;
  if (!IA_VE()) return topo + `<div class="box"><b>A IA da Milla ainda roda na conta do studio Ti Artes.</b><div class="sm">Quando a conta da IA da ${esc(MARCA)} estiver pronta, esta tela mostra o uso do mês e o caminho para o saldo e os recibos.</div></div>`;
  const x = iaSituacao(d), m = d.mes || {}, est = IA_ESTUDIO(), nomeMes = (typeof AS_MES_LONGO !== 'undefined' ? AS_MES_LONGO[Number(String(m.mes || '').slice(5)) - 1] : '') || 'este mês';
  const abrir = `<a class="btn btn-navy btn-p" href="${esc(d.link_conta)}" target="_blank" rel="noopener">Abrir a conta da IA</a>`;
  const alerta = d.falha ? `<div class="ia-alerta" role="alert"><b>Desde ${esc(iaQuando(d.falha.desde))}, a conta da IA recusou os pedidos da Milla: ${esc(d.falha.texto)}.</b>
    <span>A Milla continua respondendo normalmente, com a IA da Ti Artes. ${d.falha.motivo === 'chave' ? 'É preciso colar uma chave nova: fale com a Ti Artes.' : 'Abra a conta da IA e confira o saldo, a recarga automática e o cartão.'} O que a reserva usar entra na próxima mensalidade, pelo custo exato.</span></div>` : '';
  const form = est && IA.colando ? `<form class="ia-form" id="ia-form" autocomplete="off">
      <label for="ia-chave" class="sm b">Chave de API da ${esc(MARCA)} (começa com sk-ant-api)</label>
      <input id="ia-chave" class="inp ia-mono" type="password" autocomplete="off" spellcheck="false" autocapitalize="off" required placeholder="sk-ant-api03-…">
      <div class="ia-acoes"><button type="submit" class="btn btn-navy btn-p" ${IA.salvando ? 'disabled' : ''}>${IA.salvando ? 'Testando…' : 'Testar e salvar'}</button><button type="button" class="btn btn-line btn-p" data-act="ia-cancelar">Cancelar</button></div>
      <span class="sm">Antes de guardar, o painel faz um pedido de teste à conta: a chave só entra se ela responder. Depois disso, ninguém vê a chave inteira, só os 4 últimos caracteres.</span>
    </form>` : '';
  const botoes = `<div class="ia-acoes">${abrir}
      ${d.tem_chave ? `<button type="button" class="btn btn-line btn-p" data-act="ia-testar" ${IA.testando ? 'disabled' : ''}>${IA.testando ? 'Testando…' : 'Testar agora'}</button>` : ''}
      ${est && !IA.colando ? `<button type="button" class="btn btn-line btn-p" data-act="ia-colar">${d.tem_chave ? 'Colar uma chave nova' : 'Colar a chave'}</button>` : ''}
      ${est && d.tem_chave ? '<button type="button" class="btn btn-line btn-p ia-tirar" data-act="ia-tirar">Tirar a chave</button>' : ''}</div>`;
  const linhas = d.tem_chave ? `<dl class="as-linhas">
      <div><dt>Chave colada em</dt><dd>${esc(iaQuando(d.salva_em) || '—')}</dd></div>
      <div><dt>Último teste</dt><dd>${d.testada_em ? esc(iaQuando(d.testada_em)) + ' · ' + esc(IA_TESTE[d.ultimo_teste] || d.ultimo_teste || '') : '—'}</dd></div>
      <div><dt>Última resposta pela conta</dt><dd>${esc(iaQuando(d.ultima_ok) || 'ainda nenhuma')}</dd></div>
    </dl>` : '';
  const passos = !d.tem_chave ? `<ol class="ia-passos">
      <li>Com o dono, criar a conta em <a href="https://platform.claude.com" target="_blank" rel="noopener">platform.claude.com</a> com o e-mail da ${esc(MARCA)}.</li>
      <li>Em Billing: pôr o cartão, comprar US$ 50 e ligar a recarga automática (quando o saldo cair abaixo de US$ 20, comprar US$ 50).</li>
      <li>Em API keys: criar a chave "Milla" e colar aqui, em Colar a chave.</li>
    </ol><a class="btn btn-line btn-p" href="${IA_CHAVES}" target="_blank" rel="noopener">Abrir a página das chaves</a>` : '';
  const reserva = Number(m.usd_reserva) > 0 ? `<div class="cr-amais"><span>Pela reserva da Ti Artes em ${esc(nomeMes)}</span><b class="num">${iaUsd(m.usd_reserva)} <small>em ${Number(m.pedidos_reserva || 0).toLocaleString('pt-BR')} pedidos</small></b><span class="sm">entra na próxima mensalidade, pelo custo</span></div>` : '';
  const uso = d.tem_chave
    ? `<div class="as-valor num">${iaUsd(m.usd_propria)}<small>na conta da ${esc(MARCA)} em ${esc(nomeMes)}${m.desde ? ' (desde ' + esc(iaDia(m.desde)) + ')' : ''} · ≈ ${iaBrl(m.usd_propria)}</small></div>${reserva}`
    : `<p class="cr-prev">Hoje a IA da Milla roda na conta da Ti Artes${est && m.usd_total != null ? ': ' + iaUsd(m.usd_total) + ' em ' + esc(nomeMes) + ' (≈ ' + iaBrl(m.usd_total) + ')' : ''}.</p>`;
  return `${topo}
    <section class="cr-tela ia-tela">
      <div class="as-cartao">
        <span class="as-pill as-${x.cor}"><i></i>${esc(x.titulo)}</span>
        <div class="as-valor ${d.tem_chave ? 'ia-mono' : 'ia-sem'}">${d.tem_chave ? 'sk-ant-…' + esc(d.final) : 'Sem chave da ' + esc(MARCA)}<small>${d.tem_chave ? 'a chave da conta da IA da ' + esc(MARCA) : 'a Milla usa a IA da Ti Artes'}</small></div>
        ${alerta}${linhas}${botoes}${form}
        <div class="sm" id="ia-msg" role="status" ${IA.msgCor ? `data-cor="${esc(IA.msgCor)}"` : ''}>${esc(IA.msg)}</div>
      </div>
      <div class="as-pagar">
        <h2>Uso em ${esc(nomeMes)}</h2>
        ${uso}
        ${est && d.tem_chave && m.usd_total != null ? `<p class="sm">Só o estúdio vê: total do mês no cofre, com o que a Ti Artes pagou antes da chave, ${iaUsd(m.usd_total)} em ${Number(m.respostas || 0).toLocaleString('pt-BR')} respostas.</p>` : ''}
        ${passos}
        <p class="sm">É uma estimativa do painel, pelos tokens de cada resposta, com o dólar a R$ 5,80 mais o IOF. O valor exato, os recibos e o cartão estão na conta da IA.</p>
        ${d.tem_chave ? `<h2 class="cr-h2">Recarga automática</h2><p class="sm">Na conta da IA, em Billing, deixe a recarga automática ligada: quando o saldo cair abaixo de US$ 20, ela compra mais US$ 50 no cartão e manda o recibo por e-mail. Se o crédito acabar ou o cartão recusar, a Milla não para: usa a IA da Ti Artes e este painel avisa.</p>` : ''}
      </div>
    </section>`;
}

const iaAviso = (t, cor) => { IA.msg = t; IA.msgCor = cor || ''; };
if (typeof document !== 'undefined') {
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]'); if (!el || !/^ia-/.test(el.dataset.act)) return;
    const a = el.dataset.act;
    if (a === 'ia-recarregar') { await iaCarregar(true); render(); return; }
    if (a === 'ia-colar') { IA.colando = true; iaAviso(''); render(); const i = $('ia-chave'); if (i) i.focus(); return; }
    if (a === 'ia-cancelar') { IA.colando = false; iaAviso(''); render(); return; }
    if (a === 'ia-testar') {
      IA.testando = true; iaAviso('Fazendo um pedido de teste à conta da IA…'); render();
      try {
        const r = await iaPede('testar');
        if (r.j && r.j.tem_chave !== undefined) IA.dados = r.j;
        const t = r.j && r.j.teste;
        iaAviso(t && t.ok ? 'A conta respondeu: está tudo certo.' : t ? 'A conta não respondeu: ' + t.texto + '. A Milla segue com a reserva da Ti Artes.' : (r.j.texto || 'Não consegui testar agora.'), t && t.ok ? 'verde' : 'verm');
      } catch (x) { iaAviso('Sem conexão: não consegui testar.', 'verm'); }
      IA.testando = false; render(); return;
    }
    if (a === 'ia-tirar') {
      if (!confirm('Tirar a chave da ' + MARCA + '? A Milla volta a usar a IA da Ti Artes na hora, e o gasto volta para a Ti Artes.')) return;
      try {
        const r = await iaPede('tirar');
        if (r.ok) { IA.dados = r.j; iaAviso('Chave tirada: a Milla usa a IA da Ti Artes.', 'ambar'); toast('Chave tirada.'); }
        else iaAviso(r.j.texto || 'Não consegui tirar a chave. Nada mudou.', 'verm');
      } catch (x) { iaAviso('Sem conexão: nada mudou.', 'verm'); }
      render(); return;
    }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'ia-form') return;
    e.preventDefault();
    const campo = $('ia-chave'), k = campo ? campo.value : '';
    if (campo) campo.value = '';   /* a chave não fica na tela nem na memória da página */
    if (!/sk-ant-api/.test(k)) { iaAviso('Isso não parece uma chave da Anthropic: ela começa com sk-ant-api.', 'verm'); render(); return; }
    IA.salvando = true; iaAviso('Testando a chave na conta da IA…'); render();
    try {
      const r = await iaPede('salvar', { chave: k });
      if (r.ok && r.j.salvou) { IA.dados = r.j; IA.colando = false; iaAviso('Chave colada e testada: a Milla já usa a conta da IA da ' + MARCA + '.', 'verde'); toast('A Milla já usa a conta da ' + MARCA + '.'); }
      else iaAviso(r.j.texto || 'Não consegui guardar a chave. Nada mudou.', 'verm');
    } catch (x) { iaAviso('Sem conexão: nada mudou.', 'verm'); }
    IA.salvando = false; render();
  });
}
if (typeof module !== 'undefined') module.exports = { iaSituacao };

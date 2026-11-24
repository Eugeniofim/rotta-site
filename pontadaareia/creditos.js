/* =====================================================
   CRÉDITOS DA MILLA (24/11/2026) — como recarga de celular: 1 crédito = 1 pessoa atendida no mês.

   O acordo novo (pedido do Eugênio): a mensalidade fica limpa para a Ti Artes e a IA vira créditos que a
   imobiliária compra. O dono vê aqui, bem claro: quantos créditos restam, quando acabam no ritmo de agora,
   quantas pessoas a Milla atendeu (no mês e por dia) e as compras. Nunca vê custo de IA nem margem.
   A corretora e a gerência não veem.

   Quem conta é a sala (sql/CREDITOS-IA-<sala>.sql, função meus_creditos_ia): uma pessoa atendida é um número
   que escreveu e recebeu resposta da Milla no mês; acima do teto de respostas no mês (padrão 40), usa mais 1.
   A equipe, as fotos e os avisos às corretoras não contam.
   Modos (o estúdio escolhe aqui mesmo): SOMBRA = só o estúdio vê, para conferir os números (nada é cobrado e
   a Milla não muda); LIGADO = o dono vê; DESLIGADO = some. O estúdio lança créditos (compra por Pix, bônus,
   ajuste, teste) e muda preço, teto e início. O pagamento pelo cartão e a recarga automática são a fase 3.
   Só aparece no app cujo config.js tem `creditos: true`. (Substitui a tela de 20/11, da franquia de mensagens.)
   ===================================================== */
'use strict';

const CR = { dados: null, carregou: false, buscando: false, semFuncao: false, erro: '', salvando: false };
const CR_LIGADO = () => typeof APP_CONFIG !== 'undefined' && APP_CONFIG.creditos === true;
const crInt = n => Math.round(Number(n) || 0).toLocaleString('pt-BR');
const crReal = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const crNomeMes = m => { const [y, mo] = String(m || '').split('-').map(Number); return (typeof AS_MES_LONGO !== 'undefined' && AS_MES_LONGO[mo - 1] || '') + (y && y !== new Date().getFullYear() ? ' de ' + y : ''); };
const crDia = s => { const t = String(s || ''); if (/^\d{4}-\d\d-\d\d$/.test(t)) return t.slice(8, 10) + '/' + t.slice(5, 7); const d = new Date(t); return isNaN(d) ? '' : String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const crData = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
const CR_TIPO = { compra: 'Compra', bonus: 'Bônus', ajuste: 'Ajuste', teste: 'Teste' };
const crHoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* demonstração (sem banco): a dona fictícia vê créditos de exemplo */
function crDemo() {
  const h = new Date(), mes = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0'), dias = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(h.getTime() - i * 864e5); dias.push({ dia: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), pessoas: [9, 12, 14, 8, 11, 15, 13][i % 7] }); }
  return { modo: 'ligado', estudio: false, demo: true, cfg: { preco_brl: 1.5, teto_respostas: 40, inicio: mes + '-01', recarga: { ligada: false, quando_faltar: 20, comprar: 200 } },
    carteira: { comprados: 200, usados: 162, saldo: 38, ultimo: { em: new Date(h.getTime() - 10 * 864e5).toISOString(), qtd: 200, tipo: 'compra' } },
    mes_atual: mes, mes: { mes, pessoas: 151, creditos: 162, respostas: 1012 }, meses: [{ mes, pessoas: 151, creditos: 162, respostas: 1012 }], dias, ritmo_dia: 12.4,
    movimentos: [{ em: new Date(h.getTime() - 10 * 864e5).toISOString(), tipo: 'compra', qtd: 200, valor_brl: 300, ref: 'Pix' }] };
}
async function crCarregar(forcar) {
  if (!DONO() || !CR_LIGADO()) { CR.dados = null; CR.carregou = true; return; }
  if (!REAL()) { if (!CR.dados || forcar) CR.dados = crDemo(); CR.carregou = true; return; }
  if (CR.buscando || (CR.carregou && !forcar)) return;
  CR.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('rpc/meus_creditos_ia', { method: 'POST', body: '{}' });
    if (r.status === 404) { CR.semFuncao = true; CR.dados = null; }
    else if (r.ok) { const d = await r.json().catch(() => null); CR.dados = d && d.modo ? d : null; CR.erro = ''; }
    else CR.erro = 'Não consegui ler os créditos agora.';
  } catch (e) { CR.erro = 'Sem conexão: não consegui ler os créditos.'; }
  finally { CR.buscando = false; CR.carregou = true; }
}
/* quem vê: o dono com os créditos ligados; o estúdio também no modo de teste (a sala só manda a carteira a quem pode) */
const crVe = () => DONO() && CR_LIGADO() && !!(CR.dados && CR.dados.carteira);

/* as contas da tela: o saldo, o último pacote (a barra), quando acaba no ritmo de agora e a cor do aviso */
function crConta(d, agora = new Date()) {
  if (!d || !d.carteira) return null;
  const k = d.carteira, saldo = Number(k.saldo) || 0, pacote = Math.max(1, Number(k.ultimo && k.ultimo.qtd) || Number(k.comprados) || 0);
  const ritmo = Number(d.ritmo_dia) || 0, dias = ritmo > 0 && saldo > 0 ? saldo / ritmo : null;
  const rec = (d.cfg && d.cfg.recarga) || {}, falta = Number(rec.quando_faltar) || 20;
  const cor = saldo <= 0 ? 'verm' : saldo <= falta || (dias != null && dias < 5) || saldo / pacote < .2 ? 'ambar' : 'verde';
  return { saldo, pacote, pct: Math.max(0, Math.min(1, saldo / pacote)), ritmo, dias, acaba: dias != null ? new Date(agora.getTime() + dias * 864e5) : null, cor, rec, k, mes: d.mes || {}, cfg: d.cfg || {} };
}
const crTitulo = c => c.saldo <= 0 ? 'Créditos esgotados' : c.cor === 'ambar' ? 'Créditos acabando' : 'Créditos em dia';
const crQuando = c => c.saldo <= 0 ? `Os créditos acabaram: ${crInt(-c.saldo)} ${-c.saldo === 1 ? 'pessoa atendida' : 'pessoas atendidas'} além do que foi comprado. A Milla continua atendendo, e isso entra na próxima compra.`
  : !c.ritmo ? 'Ainda não há movimento suficiente para prever quando os créditos acabam.'
    : c.dias > 45 ? 'No ritmo de agora, os créditos duram mais de um mês.'
      : `No ritmo de agora (cerca de ${crInt(c.ritmo)} ${Math.round(c.ritmo) === 1 ? 'pessoa nova' : 'pessoas novas'} por dia), acabam por volta de ${crData(c.acaba)}.`;
const crRestam = c => c.saldo <= 0 ? 'Esgotados' : crInt(c.saldo) + (c.saldo === 1 ? ' crédito' : ' créditos');

/* o botão no menu do computador, embaixo da assinatura */
function crLinhaLado() {
  const c = crVe() && crConta(CR.dados); if (!c) return '';
  const on = rota().tela === 'creditos', teste = CR.dados.modo === 'sombra';
  return `<a class="cr-lado as-${c.cor} ${on ? 'on' : ''}" href="#/creditos" ${on ? 'aria-current="page"' : ''}>
    <span class="as-rot">Créditos da Milla${teste ? ' · teste' : ''}</span><b class="num">${esc(crRestam(c))}${c.saldo > 0 ? ' <small>restam</small>' : ''}</b>
    <span class="cr-trilho" aria-hidden="true"><i style="width:${(c.pct * 100).toFixed(1)}%"></i></span>
    <small>${crInt(c.mes.pessoas)} pessoas em ${esc(crNomeMes(CR.dados.mes_atual))} · ver</small></a>`;
}
/* o cartão no Início (computador e celular) */
function crCartao() {
  const c = crVe() && crConta(CR.dados); if (!c) return '';
  return `<a class="cr-cartao as-${c.cor}" href="#/creditos">
    <span class="cr-c1"><span class="as-rot">Créditos da Milla${CR.dados.modo === 'sombra' ? ' · teste, só o estúdio vê' : ''}</span><b class="num">${c.saldo > 0 ? 'Restam ' : ''}${esc(crRestam(c))} <small>· ${crInt(c.mes.pessoas)} pessoas atendidas em ${esc(crNomeMes(CR.dados.mes_atual))}</small></b></span>
    <span class="cr-trilho" aria-hidden="true"><i style="width:${(c.pct * 100).toFixed(1)}%"></i></span>
    <span class="sm">${esc(crQuando(c))}</span><span class="btn btn-line btn-p">Créditos</span></a>`;
}

/* as pessoas novas por dia, nos últimos 30 dias */
function crGrafico(dias) {
  if (!dias || !dias.length) return '';
  const max = Math.max(1, ...dias.map(x => Number(x.pessoas) || 0)), hoje = crHoje();
  const barras = dias.map(x => { const n = Number(x.pessoas) || 0;
    return `<span class="cr-dia ${x.dia === hoje ? 'hoje' : ''}" title="${esc(crDia(x.dia))}: ${crInt(n)} ${n === 1 ? 'pessoa nova' : 'pessoas novas'}"><i style="height:${Math.max(n ? 4 : 0, n / max * 100).toFixed(1)}%"></i></span>`; }).join('');
  return `<h2 class="cr-h2">Pessoas novas por dia</h2>
    <div class="cr-dias" role="img" aria-label="Pessoas novas por dia nos últimos 30 dias; o maior dia teve ${crInt(max)}">${barras}</div>
    <div class="cr-dias-eixo sm"><span>${esc(crDia(dias[0].dia))}</span><span>maior dia: ${crInt(max)}</span><span>hoje</span></div>`;
}

/* o que só o estúdio vê: o modo, lançar créditos e o preço */
function crEstudio(d, c) {
  if (!d.estudio) return '';
  const modo = (m, rot) => `<button type="button" class="btn ${d.modo === m ? 'btn-navy' : 'btn-line'} btn-p" data-act="cr-modo" data-modo="${m}" aria-pressed="${d.modo === m}">${rot}</button>`;
  const vale = Number(c.mes.creditos || 0) * Number(c.cfg.preco_brl || 0), rec = c.rec || {};
  return `<div class="cr-estudio">
    <h2 class="cr-h2">Só o estúdio vê</h2>
    ${d.modo === 'sombra' ? '<p class="sm"><b>Modo de teste:</b> esta tela só aparece para a conta do estúdio. Nada é cobrado e a Milla não muda: serve para conferir a contagem com as conversas de verdade.</p>' : ''}
    <div class="ia-acoes" role="group" aria-label="Quem vê os créditos">${modo('sombra', 'Teste (só o estúdio)')}${modo('ligado', 'Ligado (o dono vê)')}${modo('desligado', 'Desligado')}</div>
    <p class="sm">A ${crReal(c.cfg.preco_brl)} por crédito, os ${crInt(c.mes.creditos)} créditos usados em ${esc(crNomeMes(d.mes_atual))} valem ${crReal(vale)}.</p>
    <form class="ia-form" id="cr-lancar-form" autocomplete="off">
      <b class="sm">Lançar créditos</b>
      <div class="cr-campos">
        <label class="sm">Quantos<input id="cr-qtd" class="inp num" type="number" step="1" min="-100000" max="100000" required></label>
        <label class="sm">Tipo<select id="cr-tipo" class="inp"><option value="compra">Compra</option><option value="bonus">Bônus</option><option value="ajuste">Ajuste (pode ser negativo)</option><option value="teste">Teste (só no modo de teste)</option></select></label>
        <label class="sm">Valor pago (R$)<input id="cr-valor" class="inp num" type="number" step="0.01" min="0" placeholder="opcional"></label>
        <label class="sm">Observação<input id="cr-ref" class="inp" maxlength="200" placeholder="Pix de 24/11"></label>
      </div>
      <div class="ia-acoes"><button type="submit" class="btn btn-navy btn-p" ${CR.salvando ? 'disabled' : ''}>Lançar</button></div>
    </form>
    <form class="ia-form" id="cr-cfg-form" autocomplete="off">
      <b class="sm">Regras</b>
      <div class="cr-campos">
        <label class="sm">Preço do crédito (R$)<input id="cr-preco" class="inp num" type="number" step="0.01" min="0.01" max="99" value="${Number(c.cfg.preco_brl || 1.5)}" required></label>
        <label class="sm">Respostas por crédito<input id="cr-teto" class="inp num" type="number" step="1" min="5" max="500" value="${Number(c.cfg.teto_respostas || 40)}" required></label>
        <label class="sm">Contar desde<input id="cr-inicio" class="inp" type="date" value="${esc(c.cfg.inicio || '')}"></label>
        <label class="sm">Recarga: quando faltar<input id="cr-falta" class="inp num" type="number" step="1" min="1" max="10000" value="${Number(rec.quando_faltar || 20)}" required></label>
        <label class="sm">Recarga: comprar<input id="cr-comprar" class="inp num" type="number" step="1" min="10" max="100000" value="${Number(rec.comprar || 200)}" required></label>
      </div>
      <div class="ia-acoes"><button type="submit" class="btn btn-line btn-p" ${CR.salvando ? 'disabled' : ''}>Guardar as regras</button></div>
      <span class="sm">A recarga automática pelo cartão entra na próxima etapa; por enquanto, estes números só valem para o aviso de "acabando".</span>
    </form>
  </div>`;
}

function vCreditos() {
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">${esc(MARCA)}</span><h1>Créditos da Milla</h1></div></div>`;
  if (!DONO() || !CR_LIGADO()) return `${faixaCel()}<div class="topo"><h1>Créditos</h1></div><div class="box"><b>${CR_LIGADO() ? 'Só o dono da ' + esc(MARCA) + ' vê os créditos.' : 'Os créditos ainda não aparecem neste app.'}</b><div class="sm">As conversas, os leads e os imóveis estão no menu.</div></div>`;
  if (!CR.carregou || CR.buscando && !CR.dados) return topo + '<div class="sm vazio">Carregando…</div>';
  if (CR.erro && !CR.dados) return topo + `<div class="box"><b>${esc(CR.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="cr-recarregar">Tentar de novo</button></div>`;
  const d = CR.dados, c = crConta(d);
  if (!c) return topo + `<div class="box"><b>Os créditos ainda não aparecem aqui.</b><div class="sm">O studio Ti Artes liga os créditos ao app. Qualquer dúvida, é direto com o estúdio.</div></div>`;
  const nomeMes = crNomeMes(d.mes_atual), ult = c.k.ultimo;
  const meses = (d.meses || []).slice(-6).map(x => `<tr><td>${esc(crNomeMes(x.mes))}</td><td class="num">${crInt(x.pessoas)}</td><td class="num">${crInt(x.creditos)}</td></tr>`).join('');
  const movs = (d.movimentos || []).map(m => `<li><span class="num">${esc(crDia(m.em))}</span><span>${esc(CR_TIPO[m.tipo] || m.tipo)}${m.ref ? ' <small>· ' + esc(m.ref) + '</small>' : ''}</span><b class="num">${m.qtd > 0 ? '+' : ''}${crInt(m.qtd)}</b><span class="num">${m.valor_brl != null ? crReal(m.valor_brl) : ''}</span></li>`).join('');
  const rec = c.rec.ligada ? `Ligada: quando faltarem ${crInt(c.rec.quando_faltar)} créditos, compra ${crInt(c.rec.comprar)} no cartão e manda o recibo.`
    : 'A compra pelo cartão, com recarga automática, chega em breve. Por enquanto, para comprar créditos, fale com o studio Ti Artes.';
  return `${topo}
    <section class="cr-tela">
      <div class="as-cartao">
        <span class="as-pill as-${c.cor}"><i></i>${esc(crTitulo(c))}${d.modo === 'sombra' ? ' · teste' : ''}</span>
        <div class="as-valor num">${esc(crRestam(c))}<small>${c.saldo > 0 ? 'restam · ' : ''}1 crédito = 1 pessoa atendida no mês</small></div>
        <div class="cr-trilho grande as-${c.cor}" role="img" aria-label="${c.saldo > 0 ? 'restam ' + crInt(c.saldo) + ' de ' + crInt(c.pacote) + ' do último pacote' : 'créditos esgotados'}"><i style="width:${(c.pct * 100).toFixed(1)}%"></i></div>
        <p class="cr-prev">${esc(crQuando(c))}</p>
        <dl class="as-linhas">
          <div><dt>Comprados desde ${esc(crDia(c.cfg.inicio))}</dt><dd class="num">${crInt(c.k.comprados)}</dd></div>
          <div><dt>Usados</dt><dd class="num">${crInt(c.k.usados)}</dd></div>
          ${ult ? `<div><dt>Último pacote</dt><dd class="num">${crInt(ult.qtd)} em ${esc(crDia(ult.em))}</dd></div>` : ''}
        </dl>
        <div class="cr-recarga"><b>Recarga automática</b><span class="sm">${esc(rec)}</span></div>
        ${crEstudio(d, c)}
      </div>
      <div class="as-pagar">
        <h2>Pessoas atendidas</h2>
        <div class="as-valor num">${crInt(c.mes.pessoas)}<small>${c.mes.pessoas === 1 ? 'pessoa' : 'pessoas'} em ${esc(nomeMes)} · ${crInt(c.mes.creditos)} créditos</small></div>
        ${crGrafico(d.dias)}
        ${meses ? `<h2 class="cr-h2">Mês a mês</h2><table class="cr-meses"><thead><tr><th>Mês</th><th>Pessoas</th><th>Créditos</th></tr></thead><tbody>${meses}</tbody></table>` : ''}
        <h2 class="cr-h2">Como contam os créditos</h2>
        <ul class="cr-regras sm">
          <li>Cada pessoa que conversa com a Milla no mês usa 1 crédito. A mesma pessoa pode conversar o mês inteiro com esse crédito.</li>
          <li>Se a conversa passar de ${crInt(c.cfg.teto_respostas || 40)} respostas da Milla no mês, ela usa mais 1.</li>
          <li>Não contam: a equipe, as fotos dos imóveis, os avisos às corretoras e o que a equipe responde pelo app.</li>
          <li>Quem volta a conversar no mês seguinte conta de novo.</li>
        </ul>
        ${movs ? `<h2 class="cr-h2">Compras</h2><ul class="cr-movs">${movs}</ul>` : ''}
        ${d.demo ? '<p class="sm">Demonstração: números de exemplo.</p>' : ''}
      </div>
    </section>`;
}

/* o estúdio: lançar, mudar as regras e o modo (a sala confere de novo quem pode) */
async function crRpc(fn, corpo) {
  CR.salvando = true; render();
  try {
    await authEnsure();
    const r = await supaFetch('rpc/' + fn, { method: 'POST', body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => null);
    if (r.ok && j && j.modo) { CR.dados = j; return true; }
    toast((j && j.message) || 'Não consegui guardar. Nada mudou.'); return false;
  } catch (e) { toast('Sem conexão: nada mudou.'); return false; }
  finally { CR.salvando = false; render(); }
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]'); if (!el || !/^cr-/.test(el.dataset.act)) return;
    if (el.dataset.act === 'cr-recarregar') { await crCarregar(true); render(); return; }
    if (el.dataset.act === 'cr-modo') {
      const m = el.dataset.modo; if (!CR.dados || CR.dados.modo === m) return;
      const msg = { ligado: 'Ligar os créditos? O dono passa a ver esta tela, o saldo e o aviso de créditos acabando.', desligado: 'Desligar os créditos? A tela some para todos, inclusive para o estúdio (volta pelo SQL).', sombra: 'Voltar ao modo de teste? O dono deixa de ver os créditos.' }[m];
      if (!confirm(msg)) return;
      if (await crRpc('credito_config', { p: { modo: m } })) toast(m === 'ligado' ? 'Créditos ligados: o dono já vê.' : m === 'sombra' ? 'Modo de teste: só o estúdio vê.' : 'Créditos desligados.');
    }
  });
  document.addEventListener('submit', async e => {
    if (e.target.id === 'cr-lancar-form') {
      e.preventDefault();
      const q = Math.round(Number(($('cr-qtd') || {}).value)), t = ($('cr-tipo') || {}).value || 'compra', v = ($('cr-valor') || {}).value, ref = (($('cr-ref') || {}).value || '').trim();
      if (!q || (t !== 'ajuste' && q < 0)) { toast(t === 'ajuste' ? 'Escreva quantos créditos (pode ser negativo).' : 'Escreva quantos créditos (maior que zero).'); return; }
      if (!confirm(`Lançar ${q > 0 ? '+' : ''}${q} créditos (${CR_TIPO[t]})${v ? ' de ' + crReal(v) : ''}?`)) return;
      if (await crRpc('credito_lancar', { p_qtd: q, p_tipo: t, p_valor: v === '' ? null : Number(v), p_ref: ref || null })) toast('Créditos lançados.');
    }
    if (e.target.id === 'cr-cfg-form') {
      e.preventDefault();
      const n = id => Number(($(id) || {}).value);
      const rec = Object.assign({}, (CR.dados && CR.dados.cfg && CR.dados.cfg.recarga) || {}, { quando_faltar: Math.round(n('cr-falta')), comprar: Math.round(n('cr-comprar')) });
      if (await crRpc('credito_config', { p: { preco_brl: n('cr-preco'), teto_respostas: Math.round(n('cr-teto')), inicio: ($('cr-inicio') || {}).value || '', recarga: { ligada: !!rec.ligada, quando_faltar: rec.quando_faltar, comprar: rec.comprar } } })) toast('Regras guardadas.');
    }
  });
}
if (typeof module !== 'undefined') module.exports = { crConta };

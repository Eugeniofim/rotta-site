/* =====================================================
   CRÉDITOS DO MÊS (20/11/2026) — o que o dono da imobiliária vê da franquia de mensagens.
   Pedido do Eugênio: "dentro da conta de cada uma, mostrar nitidamente um botão dos créditos…
   quanto já foi gasto, com limite… uma estimativa de quanto vai ser gasto por mês".

   Os créditos são a franquia de mensagens que o robô já conta (cofre, _comum/uso-robo.js):
   texto + foto + aviso à equipe, no mês. A sala lê pela função meus_creditos (sql/CREDITOS-<sala>.sql),
   que devolve só CONTAGENS: o dono nunca vê custo de IA nem a margem do estúdio.
   Só quem gere vê (dono e estúdio); o corretor não vê nada disso. Não mexe no robô.
   DESLIGADA por padrão: só aparece no app do cliente cujo config.js tem `creditos: true` (20/11: o Eugênio
   ainda vai combinar a franquia com o Jaime; até lá a tela não chega a ele). A unidade da franquia vem da sala:
   'mensagens' (texto + foto + aviso à equipe, como o robô conta hoje) ou 'respostas' (respostas da Milla).
   ===================================================== */
'use strict';

const CR = { dados: null, carregou: false, buscando: false, semFuncao: false, erro: '' };
const CR_LIGADO = () => typeof APP_CONFIG !== 'undefined' && APP_CONFIG.creditos === true;
const crInt = n => Math.round(Number(n) || 0).toLocaleString('pt-BR');
const crReal = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const crNomeMes = m => { const [y, mo] = String(m).split('-').map(Number); return (AS_MES_LONGO[mo - 1] || '') + (y && y !== new Date().getFullYear() ? ' de ' + y : ''); };

/* demonstração (sem banco): a dona fictícia vê créditos de exemplo, a meio caminho no mês */
function crDemo() {
  const h = new Date(), mes = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0');
  const dia = h.getDate(), usadas = Math.min(1900, Math.round(dia * 52)), m1 = new Date(h.getFullYear(), h.getMonth() - 1, 1), m2 = new Date(h.getFullYear(), h.getMonth() - 2, 1);
  const k = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  return { franquia: { mensagens: 2000, excedente_brl: 0.2, cobra: true }, mes_atual: mes, ritmo_dia: 52, demo: true,
    meses: [{ mes, usadas, respostas: Math.round(usadas * .45), texto: Math.round(usadas * .55), foto: Math.round(usadas * .3), equipe: usadas - Math.round(usadas * .55) - Math.round(usadas * .3) },
      { mes: k(m1), usadas: 1640, respostas: 760, texto: 900, foto: 500, equipe: 240 }, { mes: k(m2), usadas: 1210, respostas: 560, texto: 700, foto: 330, equipe: 180 }] };
}
async function crCarregar(forcar) {
  if (!DONO() || !CR_LIGADO()) { CR.dados = null; CR.carregou = true; return; }
  if (!REAL()) { if (!CR.dados || forcar) CR.dados = crDemo(); CR.carregou = true; return; }
  if (CR.buscando || (CR.carregou && !forcar)) return;
  CR.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('rpc/meus_creditos', { method: 'POST', body: '{}' });
    if (r.status === 404) { CR.semFuncao = true; CR.dados = null; }
    else if (r.ok) { const d = await r.json().catch(() => null); CR.dados = d && d.franquia ? d : null; CR.erro = ''; }
    else CR.erro = 'Não consegui ler os créditos agora.';
  } catch (e) { CR.erro = 'Sem conexão: não consegui ler os créditos.'; }
  finally { CR.buscando = false; CR.carregou = true; }
}

/* as contas da tela: usadas, faltam, quando acaba no ritmo dos últimos dias (o maior entre 3 e 7 dias, vem da sala) */
function crConta(d, hoje = new Date()) {
  if (!d || !d.franquia) return null;
  const resp = d.franquia.unidade === 'respostas', un = resp ? 'respostas' : 'mensagens';
  const f = Number(d.franquia.mensagens) || 2000, m = (d.meses || []).find(x => x.mes === d.mes_atual) || { usadas: 0, respostas: 0, texto: 0, foto: 0, equipe: 0 };
  const usadas = Number(resp ? m.respostas : m.usadas) || 0, faltam = Math.max(0, f - usadas), passou = Math.max(0, usadas - f), pct = usadas / f;
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate(), restam = ultimo - hoje.getDate() + 1;
  const ritmo = Number(resp ? d.ritmo_respostas_dia : d.ritmo_dia) || 0, previsto = Math.round(usadas + ritmo * Math.max(0, restam - 0.5));
  let acaba = null;
  if (!passou && ritmo > 0) { const dias = faltam / ritmo; if (dias < restam) acaba = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + Math.floor(dias)); }
  return { f, m, usadas, faltam, passou, pct, ritmo, previsto, acaba, restam, cobra: d.franquia.cobra !== false, preco: Number(d.franquia.excedente_brl) || 0, mes: d.mes_atual, resp, un };
}
const crCor = c => c.passou ? 'verm' : c.pct >= .8 ? 'ambar' : 'verde';
const crData = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');

/* o botão no menu do computador, embaixo da assinatura */
function crLinhaLado() {
  const c = DONO() && CR_LIGADO() && crConta(CR.dados); if (!c) return '';
  const on = rota().tela === 'creditos';
  return `<a class="cr-lado as-${crCor(c)} ${on ? 'on' : ''}" href="#/creditos" ${on ? 'aria-current="page"' : ''}>
    <span class="as-rot">Créditos de ${esc(crNomeMes(c.mes))}</span><b class="num">${crInt(c.usadas)} <small>de ${crInt(c.f)}</small></b>
    <span class="cr-trilho" aria-hidden="true"><i style="width:${Math.min(100, c.pct * 100).toFixed(1)}%"></i></span>
    <small>${c.passou ? crInt(c.passou) + ' a mais · ver' : 'faltam ' + crInt(c.faltam) + ' · ver'}</small></a>`;
}
/* o cartão no Início (computador e celular) */
function crCartao() {
  const c = DONO() && CR_LIGADO() && crConta(CR.dados); if (!c) return '';
  const nota = c.passou ? `A franquia de ${crNomeMes(c.mes)} acabou: ${crInt(c.passou)} ${c.un} a mais até agora.` : c.acaba ? `No ritmo de agora, acabam por volta de ${crData(c.acaba)}.` : 'No ritmo de agora, duram o mês todo.';
  return `<a class="cr-cartao as-${crCor(c)}" href="#/creditos">
    <span class="cr-c1"><span class="as-rot">Créditos de ${esc(crNomeMes(c.mes))}</span><b class="num">${crInt(c.usadas)} <small>de ${crInt(c.f)} ${c.un}</small></b></span>
    <span class="cr-trilho" aria-hidden="true"><i style="width:${Math.min(100, c.pct * 100).toFixed(1)}%"></i></span>
    <span class="sm">${esc(nota)}</span><span class="btn btn-line btn-p">Créditos</span></a>`;
}

function vCreditos() {
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">${esc(MARCA)}</span><h1>Créditos</h1></div></div>`;
  if (!DONO() || !CR_LIGADO()) return `${faixaCel()}<div class="topo"><h1>Créditos</h1></div><div class="box"><b>${CR_LIGADO() ? 'Só o dono da ' + esc(MARCA) + ' vê os créditos.' : 'Os créditos ainda não aparecem neste app.'}</b><div class="sm">As conversas, os leads e os imóveis estão no menu.</div></div>`;
  if (!CR.carregou || CR.buscando) return topo + '<div class="sm vazio">Carregando…</div>';
  if (CR.erro) return topo + `<div class="box"><b>${esc(CR.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="cr-recarregar">Tentar de novo</button></div>`;
  const c = crConta(CR.dados);
  if (!c) return topo + `<div class="box"><b>Os créditos ainda não aparecem aqui.</b><div class="sm">O studio Ti Artes liga a contagem ao app. Qualquer dúvida, é direto com o estúdio.</div></div>`;
  const nomeMes = crNomeMes(c.mes);
  const previsao = c.passou ? `A franquia de ${nomeMes} já acabou. Até agora foram ${crInt(c.passou)} ${c.un} a mais.`
    : !c.ritmo ? 'Ainda não há movimento suficiente para prever quando os créditos acabam.'
      : c.acaba ? `No ritmo dos últimos dias (cerca de ${crInt(c.ritmo)} ${c.un} por dia), os créditos de ${nomeMes} acabam por volta de ${crData(c.acaba)}.`
        : `No ritmo dos últimos dias (cerca de ${crInt(c.ritmo)} ${c.un} por dia), os créditos duram o mês todo: a previsão é fechar ${nomeMes} com ${crInt(c.previsto)} de ${crInt(c.f)}.`;
  const depois = c.cobra ? `Quando os créditos acabam, a Milla continua atendendo normalmente. Cada ${c.resp ? 'resposta' : 'mensagem'} a mais custa ${crReal(c.preco)} e entra na próxima mensalidade.` : 'Neste contrato não há cobrança além da franquia.';
  const aMais = c.cobra && c.passou ? `<div class="cr-amais"><span>${c.resp ? 'Respostas' : 'Mensagens'} a mais em ${esc(nomeMes)}</span><b class="num">${crInt(c.passou)} × ${crReal(c.preco)} = ${crReal(c.passou * c.preco)}</b><span class="sm">entra na próxima mensalidade</span></div>` : '';
  const meses = (CR.dados.meses || []).slice().sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6);
  const uDe = x => Number(c.resp ? x.respostas : x.usadas) || 0, max = Math.max(c.f, ...meses.map(uDe));
  const hist = meses.map(x => { const u = uDe(x), p = u / max * 100, fp = c.f / max * 100;
    return `<div class="cr-hm" title="${esc(crNomeMes(x.mes))}: ${crInt(u)} ${c.un}">
      <span class="cr-hm-n num">${crInt(u)}</span><span class="cr-hm-col"><i class="${u > c.f ? 'passou' : ''}" style="height:${Math.max(u ? 2 : 0, p).toFixed(1)}%"></i><em style="bottom:${fp.toFixed(1)}%" aria-hidden="true"></em></span>
      <span class="cr-hm-m">${esc(AS_MES[Number(x.mes.slice(5)) - 1] || '')}</span></div>`; }).join('');
  return `${topo}
    <section class="cr-tela">
      <div class="as-cartao">
        <span class="as-pill as-${crCor(c)}"><i></i>${c.passou ? 'Franquia de ' + esc(nomeMes) + ' acabou' : c.pct >= .8 ? 'Perto do fim da franquia' : 'Dentro da franquia'}</span>
        <div class="as-valor num">${crInt(c.usadas)}<small>de ${crInt(c.f)} ${c.un} em ${esc(nomeMes)}</small></div>
        <div class="cr-trilho grande as-${crCor(c)}" role="img" aria-label="${crInt(c.usadas)} de ${crInt(c.f)} ${c.un} usadas"><i style="width:${Math.min(100, c.pct * 100).toFixed(1)}%"></i></div>
        <dl class="as-linhas">
          <div><dt>${c.passou ? 'A mais' : 'Faltam'}</dt><dd class="num">${crInt(c.passou || c.faltam)} ${c.un}</dd></div>
          ${c.resp ? '' : `<div><dt>Texto</dt><dd class="num">${crInt(c.m.texto)}</dd></div>
          <div><dt>Fotos de imóveis</dt><dd class="num">${crInt(c.m.foto)}</dd></div>
          <div><dt>Avisos para a equipe</dt><dd class="num">${crInt(c.m.equipe)}</dd></div>`}
        </dl>
        ${aMais}
      </div>
      <div class="as-pagar">
        <h2>Previsão</h2>
        <p class="cr-prev">${esc(previsao)}</p>
        <p class="sm">${esc(depois)}</p>
        <p class="sm">${c.resp ? 'Conta como crédito cada resposta da Milla a um cliente. Fotos, avisos para a equipe e o que a equipe responde pelo app não contam.' : 'Conta como crédito cada mensagem que a Milla manda: texto, foto de imóvel e aviso para a equipe. O que a equipe responde pelo app não conta.'}</p>
        ${CR.dados.demo ? '<p class="sm">Demonstração: números de exemplo.</p>' : ''}
        ${meses.length ? `<h2 class="cr-h2">Mês a mês</h2><div class="cr-hist" aria-label="${c.resp ? 'Respostas' : 'Mensagens'} por mês; a linha é a franquia">${hist}</div><span class="sm">A linha marca a franquia de ${crInt(c.f)} ${c.un}.</span>` : ''}
      </div>
    </section>`;
}

if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.dataset.act !== 'cr-recarregar') return;
  crCarregar(true).then(render);
});
if (typeof module !== 'undefined') module.exports = { crConta };

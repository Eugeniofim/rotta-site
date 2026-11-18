/* =====================================================
   SUA ASSINATURA (16/11/2026) — a mensalidade da imobiliária, vista de dentro do app.

   A ficha da mensalidade é UMA só: mora no banco do estúdio (public.itens, coleção 'mensal',
   a mesma das Mensalidades do TI ARTES OS) e diz de qual sala é (dados.sala). Daqui:
     - o DONO da imobiliária lê a dele pela função da sala (rpc/minha_assinatura), que devolve
       só plano, valor, dia, situação, meses pagos e a chave Pix do estúdio. Ele paga pelo Pix
       e aperta "Já paguei" (rpc/avisar_pagamento): o estúdio confere o extrato e dá o Recebi.
     - o corretor não vê nada disso (a função devolve vazio e a linha não aparece).
     - a conta do estúdio ganha o ADM "Clientes da Milla" (adm.js), que usa as contas daqui.
   As contas (vencimentos, situação, Pix) são as MESMAS do TI ARTES OS (mnVencs, mnSituacao,
   pixPayload), para os dois apps dizerem a mesma coisa da mesma ficha.
   ===================================================== */
'use strict';

/* a conta do estúdio (o TI ARTES OS): a dona das fichas e a única que vê o ADM */
const ESTUDIO_UID = '522c7e45-05ac-42df-9abd-5c0e70c6ee27';
/* as imobiliárias cujo app já mostra a assinatura ao dono (a sala tem o SQL ASSINATURA-<sala>.sql).
   A demonstração (millademo) fica de fora de propósito. */
const MILLA_SALAS = [
  { sala: 'pontadaareia', nome: "Ponta d'a Areia", url: 'https://rottaguide.com/pontadaareia/' },
];

/* ---------- datas: meia-noite local, como no OS ---------- */
const AS_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const AS_MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const asD = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const asIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const asHoje = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const asMais = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const asDias = (s, hoje) => Math.round((asD(s) - hoje) / 86400000);
const asFmt = s => { const d = asD(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const asFmtAno = s => asFmt(s) + '/' + asD(s).getFullYear();
const asReal = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const asOkData = s => /^\d{4}-\d\d-\d\d$/.test(String(s || ''));

function asMesN(base, k, dia) { const y = base.getFullYear(), mo = base.getMonth() + k; const ult = new Date(y, mo + 1, 0).getDate(); return new Date(y, mo, Math.min(dia, ult)); }
/* os vencimentos do começo até "ate" (inclusive) — o mesmo cálculo do mnVencs do OS */
function asVencs(a, ate) {
  if (!a || !asOkData(a.inicio)) return [];
  const b = asD(a.inicio), dia = Number(a.diaVenc) || b.getDate(), L = [];
  for (let k = 0; k < 240; k++) { const d = asMesN(b, k, dia); if (d > ate) break; L.push(asIso(d)); }
  return L;
}
const asPago = (a, v) => !!(a && a.pagos && a.pagos[v]);
/* a situação — a mesma regra do mnSituacao do OS (t, v = o vencimento que importa, n, valor) */
function asSituacao(a, hoje = asHoje()) {
  if (!a) return { t: 'nada' };
  if (a.status === 'pausado') return { t: 'pausado' };
  if (a.status === 'encerrado') return { t: 'encerrado' };
  if (!asOkData(a.inicio)) return { t: 'semdata' };
  if (asD(a.inicio) > hoje) return { t: 'carencia', v: a.inicio, n: asDias(a.inicio, hoje) };
  const abertos = asVencs(a, hoje).filter(v => !asPago(a, v));
  const atr = abertos.filter(v => asDias(v, hoje) < 0);
  if (atr.length) return { t: 'atrasado', v: atr[0], n: atr.length, dias: -asDias(atr[0], hoje), valor: atr.length * (Number(a.valor) || 0) };
  if (abertos.some(v => asDias(v, hoje) === 0)) return { t: 'hoje', v: asIso(hoje) };
  const prox = asVencs(a, asMais(hoje, 400)).find(v => asDias(v, hoje) > 0 && !asPago(a, v));
  if (!prox) return { t: 'emdia' };
  const n = asDias(prox, hoje);
  return { t: n <= 5 ? 'logo' : 'emdia', v: prox, n };
}
/* qual mensalidade pagar ou cobrar agora (o mnVencAlvo do OS) */
function asAlvo(a, hoje = asHoje()) { const s = asSituacao(a, hoje); return s.v || a.inicio || asIso(hoje); }
/* o "Já paguei" que ainda não virou Recebi, para o mês que importa */
function asAvisou(a, v) { const q = a && a.avisos && v ? a.avisos[v] : ''; return q && !asPago(a, v) ? q : ''; }
function asQuando(t) {
  const d = new Date(t); if (isNaN(d)) return '';
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' às ' + String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0');
}
/* o que a situação diz, com palavras de quem paga (dono) ou de quem recebe (estúdio) */
function asTexto(a, s, quem) {
  const dono = quem === 'dono';
  switch (s.t) {
    case 'carencia': return { txt: dono ? 'Primeira mensalidade em ' + asFmt(s.v) : 'Carência · 1ª em ' + asFmtAno(s.v), sub: 'faltam ' + s.n + ' dia' + (s.n === 1 ? '' : 's'), cor: 'azul' };
    case 'atrasado': return { txt: (dono ? 'Em aberto desde ' : 'Atrasado desde ') + asFmt(s.v), sub: s.dias + ' dia' + (s.dias === 1 ? '' : 's') + (s.n > 1 ? ' · ' + s.n + ' meses' : ''), cor: 'verm' };
    case 'hoje': return { txt: 'Vence hoje', sub: asFmt(s.v), cor: 'ambar' };
    case 'logo': return { txt: 'Vence em ' + s.n + ' dia' + (s.n === 1 ? '' : 's'), sub: asFmt(s.v), cor: 'ambar' };
    case 'emdia': return { txt: 'Em dia', sub: s.v ? 'próxima em ' + asFmt(s.v) : '', cor: 'verde' };
    case 'pausado': return { txt: dono ? 'Assinatura pausada' : 'Pausado', sub: '', cor: 'cinza' };
    case 'encerrado': return { txt: 'Encerrado', sub: '', cor: 'cinza' };
    case 'semdata': return { txt: dono ? 'O estúdio ainda vai marcar o primeiro vencimento' : 'Falta a data da 1ª mensalidade', sub: '', cor: 'ambar' };
    default: return { txt: '', sub: '', cor: 'cinza' };
  }
}

/* ---------- Pix: BR Code do Banco Central (o pixPayload do OS, igual) ---------- */
function asPixLimpo(s, max) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 .\-]/g, '').toUpperCase().trim().slice(0, max); }
function asPixChave(k) {
  k = String(k || '').trim();
  if (/^[\d.\-\/\s]+$/.test(k)) { const d = k.replace(/\D/g, ''); if (d.length === 11 || d.length === 14) return d; }
  if (/^\+?[\d\s()\-]{10,}$/.test(k) && !/[.\/]/.test(k)) { const d = k.replace(/\D/g, ''); return '+' + (d.startsWith('55') ? d : '55' + d); }
  if (k.includes('@')) return k.toLowerCase();
  return k;
}
function asPixCRC(s) { let c = 0xFFFF; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) : (c << 1); c &= 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
function asPixPayload({ chave, valor, nome, cidade, txid }) {
  const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
  const conta = f('00', 'br.gov.bcb.pix') + f('01', asPixChave(chave));
  let p = f('00', '01') + f('26', conta) + f('52', '0000') + f('53', '986');
  if (valor > 0) p += f('54', Number(valor).toFixed(2));
  p += f('58', 'BR') + f('59', asPixLimpo(nome || 'TI ARTES', 25) || 'TI ARTES') + f('60', asPixLimpo(cidade || 'CURITIBA', 15) || 'CURITIBA');
  p += f('62', f('05', (String(txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25)) || '***'));
  p += '6304'; return p + asPixCRC(p);
}
/* o Pix de uma mensalidade: a mesma referência (txid) que o OS põe no Pix daquele mês */
function asPix(a, v, pix) {
  if (!pix || !pix.chave || !a) return '';
  return asPixPayload({ chave: pix.chave, valor: Number(a.valor) || 0, nome: pix.nome || 'TI ARTES', cidade: pix.cidade || 'CURITIBA',
    txid: 'TIARTES' + String(v || '').replace(/\D/g, '').slice(0, 6) + String(a.id || '').replace(/[^A-Za-z0-9]/g, '').slice(-6) });
}
function asQr(txt, px) {
  if (typeof qrcode !== 'function' || !txt) return null;
  const q = qrcode(0, 'M'); q.addData(txt); q.make();
  const n = q.getModuleCount(), m = 4, s = Math.max(4, Math.floor((px || 320) / (n + m * 2))), W = (n + m * 2) * s;
  const c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, W); g.fillStyle = '#0B1514';
  for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) if (q.isDark(r, cc)) g.fillRect((cc + m) * s, (r + m) * s, s, s);
  return c;
}
async function asCopiar(t, ok) {
  try { await navigator.clipboard.writeText(t); toast(ok || 'Copiado.'); }
  catch (e) { window.prompt('Copie:', t); }
}

if (typeof module !== 'undefined') module.exports = { ESTUDIO_UID, MILLA_SALAS, asD, asIso, asVencs, asSituacao, asAlvo, asAvisou, asTexto, asPixPayload, asPixCRC, asPix, asFmt };

/* =====================================================
   A TELA DO DONO (#/assinatura) e onde ela aparece
   ===================================================== */
const AS = { dados: null, carregou: false, buscando: false, semFuncao: false, erro: '', avisando: false, pixAberto: false };
/* demonstração (sem banco): a dona fictícia vê uma assinatura de exemplo; o Pix não é gerado */
function asDemo() {
  const h = asHoje(), ini = asIso(new Date(h.getFullYear(), h.getMonth() - 3, 10)), a = { id: 'demo', plano: 'Milla · atendente no WhatsApp + CRM', valor: 460, inicio: ini, diaVenc: 10, status: 'ativo', pagos: {}, avisos: {}, pix: null, estudio: 'studio Ti Artes', demo: true };
  asVencs(a, h).forEach(v => { if (asDias(v, h) < 0) a.pagos[v] = { em: v }; });
  return a;
}
async function asCarregar(forcar) {
  if (!GESTOR()) { AS.dados = null; AS.carregou = true; return; }
  if (!REAL()) { if (!AS.dados || forcar) AS.dados = asDemo(); AS.carregou = true; return; }
  if (AS.buscando || (AS.carregou && !forcar)) return;
  AS.buscando = true;
  try {
    await authEnsure();
    const r = await supaFetch('rpc/minha_assinatura', { method: 'POST', body: '{}' });
    if (r.status === 404) { AS.semFuncao = true; AS.dados = null; }
    else if (r.ok) { const d = await r.json().catch(() => null); AS.dados = d && typeof d === 'object' && d.id ? d : null; AS.erro = ''; }
    else AS.erro = 'Não consegui ler a assinatura agora.';
  } catch (e) { AS.erro = 'Sem conexão: não consegui ler a assinatura.'; }
  finally { AS.buscando = false; AS.carregou = true; }
}
/* precisa de atenção do dono? (vence em até 5 dias, hoje ou em aberto, e ainda não avisou) */
function asAtencao(a) {
  if (!a) return null;
  const s = asSituacao(a);
  if (!['logo', 'hoje', 'atrasado'].includes(s.t) || asAvisou(a, s.v)) return null;
  return s;
}
/* a linha embaixo do nome da imobiliária, no menu do computador */
function asLinhaLado() {
  const a = GESTOR() && AS.dados; if (!a) return '';
  const s = asSituacao(a), x = asTexto(a, s, 'dono'), av = asAvisou(a, s.v);
  const on = rota().tela === 'assinatura';
  return `<a class="as-lado as-${av ? 'azul' : x.cor} ${on ? 'on' : ''}" href="#/assinatura" ${on ? 'aria-current="page"' : ''}>
    <span class="as-rot">Sua assinatura</span><b>${esc(av ? 'Você avisou que pagou' : x.txt)}</b><small>${esc(asReal(a.valor))}/mês · ver e pagar</small></a>`;
}
/* no celular o menu lateral some: a linha vai para o topo da Gestão */
function asLinhaCel() {
  const a = GESTOR() && AS.dados; if (!a) return '';
  const s = asSituacao(a), x = asTexto(a, s, 'dono'), av = asAvisou(a, s.v);
  return `<a class="as-cel as-${av ? 'azul' : x.cor}" href="#/assinatura"><span><span class="as-rot">Sua assinatura</span><b>${esc(av ? 'Você avisou que pagou' : x.txt)}</b></span><span class="sm">${esc(asReal(a.valor))}/mês ›</span></a>`;
}
/* no Início, só quando falta pouco ou passou: uma faixa */
function asFaixa() {
  const a = GESTOR() && AS.dados, s = asAtencao(a); if (!s) return '';
  const msg = s.t === 'atrasado' ? 'A mensalidade da Milla de ' + asFmt(s.v) + ' está em aberto.' : s.t === 'hoje' ? 'A mensalidade da Milla vence hoje.' : 'A mensalidade da Milla vence em ' + s.n + ' dia' + (s.n === 1 ? '' : 's') + ' (' + asFmt(s.v) + ').';
  return `<a class="as-faixa as-${s.t === 'atrasado' ? 'verm' : 'ambar'}" href="#/assinatura"><b>${esc(msg)}</b><span class="sm">${esc(asReal(a.valor))} · pague pelo Pix aqui no app</span><span class="btn btn-navy btn-p">Ver e pagar</span></a>`;
}

function vAssinatura() {
  const topo = `${faixaCel()}<div class="topo"><div><span class="olho">${esc(MARCA)}</span><h1>Sua assinatura</h1></div></div>`;
  if (!GESTOR()) return `${faixaCel()}<div class="topo"><h1>Sua assinatura</h1></div><div class="box"><b>Só quem gere a ${esc(MARCA)} vê a assinatura.</b><div class="sm">O valor e o pagamento ficam com o dono. As conversas, os leads e os imóveis estão no menu.</div></div>`;
  if (!AS.carregou || AS.buscando) return topo + '<div class="sm vazio">Carregando…</div>';
  if (AS.erro) return topo + `<div class="box"><b>${esc(AS.erro)}</b><button type="button" class="btn btn-line btn-p" data-act="as-recarregar">Tentar de novo</button></div>`;
  const a = AS.dados;
  if (!a) return topo + `<div class="box"><b>A assinatura ainda não aparece aqui.</b><div class="sm">O studio Ti Artes liga a mensalidade ao app. Enquanto isso, qualquer dúvida sobre valor ou pagamento é direto com o estúdio.</div></div>`;
  const s = asSituacao(a), x = asTexto(a, s, 'dono'), alvo = asAlvo(a), av = asAvisou(a, alvo);
  const hoje = asHoje(), meses = asVencs(a, asMais(hoje, 62)).slice(-6);
  const pagavel = ['carencia', 'atrasado', 'hoje', 'logo', 'emdia'].includes(s.t);
  const pix = pagavel ? asPix(a, alvo, a.pix) : '';
  const mesAlvo = AS_MES_LONGO[asD(alvo).getMonth()];
  return `${topo}
    <section class="as-tela">
      <div class="as-cartao">
        <span class="as-pill as-${av ? 'azul' : x.cor}"><i></i>${esc(av ? 'Você avisou que pagou a de ' + asFmt(alvo) : x.txt)}${!av && x.sub ? ` <small>${esc(x.sub)}</small>` : ''}</span>
        <div class="as-valor num">${esc(asReal(a.valor))}<small>por mês</small></div>
        <dl class="as-linhas">
          <div><dt>Plano</dt><dd>${esc(a.plano || 'Milla')}</dd></div>
          <div><dt>Vence</dt><dd>todo dia ${esc(String(Number(a.diaVenc) || asD(a.inicio).getDate()))}</dd></div>
          ${s.v && pagavel ? `<div><dt>${s.t === 'atrasado' ? 'Em aberto' : 'Próxima'}</dt><dd>${esc(asFmtAno(s.v))}</dd></div>` : ''}
          <div><dt>Paga para</dt><dd>${esc(a.estudio || 'studio Ti Artes')}</dd></div>
        </dl>
        ${meses.length ? `<div class="as-meses" aria-label="Meses">${meses.map(v => { const p = asPago(a, v), atr = !p && asDias(v, hoje) < 0, aviso = asAvisou(a, v);
          return `<span class="as-mes ${p ? 'ok' : aviso ? 'avisado' : atr ? 'atr' : v === alvo ? 'prox' : ''}" title="${esc(p ? 'Pago' + (a.pagos[v].em ? ' em ' + asFmt(a.pagos[v].em) : '') : aviso ? 'Você avisou que pagou' : atr ? 'Em aberto' : 'A vencer')}">${AS_MES[asD(v).getMonth()]}<small>${p ? 'pago' : aviso ? 'avisado' : atr ? 'aberto' : asFmt(v).slice(0, 2)}</small></span>`; }).join('')}</div>` : ''}
      </div>
      ${pagavel ? `<div class="as-pagar">
        <h2>Pagar a de ${esc(mesAlvo)}</h2>
        ${a.demo ? `<div class="box"><b>Na demonstração o Pix não é gerado.</b><div class="sm">No app de verdade aparece aqui o QR Code e o Pix copia e cola do studio Ti Artes, já com o valor e o mês. O dinheiro cai direto na conta do estúdio.</div></div>`
          : pix ? `<div class="as-pix"><div class="as-qr" id="as-qr" aria-label="QR Code do Pix"></div>
              <div class="as-pix-tx"><span class="sm b">Abra o app do banco, escolha Pix e leia o QR, ou use o copia e cola:</span>
              <textarea class="inp as-cod" id="as-cod" rows="4" readonly aria-label="Pix copia e cola">${esc(pix)}</textarea>
              <button type="button" class="btn btn-navy" data-act="as-copiar">Copiar o código Pix</button></div></div>`
          : `<div class="box"><b>O Pix ainda não está pronto aqui.</b><div class="sm">Fale com o studio Ti Artes para pagar esta mensalidade.</div></div>`}
        <div class="as-ja">${av ? `<div class="sm">Você avisou em ${esc(asQuando(av))}. Assim que o estúdio conferir, a mensalidade fica em dia.</div>`
          : `<button type="button" class="btn btn-line" data-act="as-avisar" data-v="${esc(alvo)}" ${AS.avisando ? 'disabled' : ''}>Já paguei a de ${esc(asFmt(alvo))}</button><span class="sm">Avisa o estúdio, que confere o extrato e dá a baixa.</span>`}</div>
      </div>` : ''}
    </section>`;
}
/* depois de desenhar a tela: o QR */
function asPinta() {
  const box = document.getElementById('as-qr'), cod = document.getElementById('as-cod');
  if (!box || !cod || box.firstChild) return;
  const c = asQr(cod.value, 280); if (c) box.appendChild(c); else box.textContent = 'Use o copia e cola ao lado.';
}
async function asAvisar(venc) {
  if (!asOkData(venc) || AS.avisando) return;
  if (!REAL()) { AS.dados.avisos = { ...(AS.dados.avisos || {}), [venc]: new Date().toISOString() }; toast('Demonstração: no app de verdade o estúdio recebe o aviso na hora.'); render(); return; }
  AS.avisando = true; render();
  let ok = false;
  try {
    await authEnsure();
    const r = await supaFetch('rpc/avisar_pagamento', { method: 'POST', body: JSON.stringify({ venc }) });
    ok = r.ok;
  } catch (e) { ok = false; }
  AS.avisando = false;
  if (ok) { await asCarregar(true); toast('Pronto: o studio Ti Artes recebeu o aviso. Assim que conferir, fica em dia.'); }
  else toast('Não consegui avisar agora. Tente de novo em instantes.');
  render();
}

/* os cliques desta tela (no node, nos testes das contas, não há página) */
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || !el.dataset.act.startsWith('as-')) return;
  const a = el.dataset.act;
  if (a === 'as-recarregar') { asCarregar(true).then(render); return; }
  if (a === 'as-copiar') { const c = document.getElementById('as-cod'); if (c) asCopiar(c.value, 'Código Pix copiado: cole no app do banco, em Pix copia e cola.'); return; }
  if (a === 'as-avisar') { asAvisar(el.dataset.v || ''); }
});

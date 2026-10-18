/* =====================================================
   SIKANIA TOUR · SANDRA SANTOS — telas do cliente (17/10/2026)

   Vitrine pedida pelo Eugênio (e prometida no kit de boas-vindas):
   Passeios e reservas · Transfer · Quem sou eu · Avaliações · Fale comigo
   no WhatsApp · Guias de Portugal e da Itália (e-books de presente).
   Saíram da base (demo de Londres): Consultoria, Monte seu roteiro,
   Ingressos e Vale-presente — os endereços antigos voltam para o início.

   - "Quem sou eu" provisório, da bio do Instagram (ela aprova ou troca);
   - voucher automático no modelo padronizado (voucher-padrao.js);
   - avaliação em 1 toque pelo QR do fim do passeio, e o depoimento em
     vídeo do Marcelo (grupo de 11).
   ===================================================== */
'use strict';

const G = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.guia) || {};
const exemploTag = () => (typeof APP_TABELA_EXEMPLO !== 'undefined' && APP_TABELA_EXEMPLO) ? '<em class="exTag">valores de exemplo</em>' : '';

/* ---------- ícones de linha (mesmo traço dos do app) ---------- */
const IC = {
  livro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2 2 0 0 1 6 4h6v15H6a2 2 0 0 0-2 2V5.5Z"/><path d="M20 5.5A2 2 0 0 0 18 4h-6v15h6a2 2 0 0 1 2 2V5.5Z"/></svg>',
  consulta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="13" height="11" rx="2"/><path d="m16 9 5-3v10l-5-3"/><path d="M7 20h6"/></svg>',
  ingresso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
  presente: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18M12 9v12"/><path d="M12 9S10.5 4 8 4.5 7.5 9 12 9Zm0 0s1.5-5 4-4.5S16.5 9 12 9Z"/></svg>',
  estrela: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  blog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 10h8M8 14h8M8 18h5"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  selo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="m9 14.5-1.5 6.5 4.5-2.5 4.5 2.5-1.5-6.5"/><path d="m9.5 9 1.8 1.8L15 7.2"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg>',
  bussola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  yt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg>',
};

/* ---------- janela do tour: "Manhã · 09:30–13:30" (fim pelo pacote) ---------- */
function janelaDoTour(S) {
  if (!S || !S.time) return '';
  const tu = turnoDaHora(S.time);
  let fim = '';
  if (S.horas) {
    const [hh, mm] = S.time.split(':').map(Number);
    const f = hh * 60 + mm + Math.round(+S.horas * 60);
    fim = String(Math.floor(f / 60)).padStart(2, '0') + ':' + String(f % 60).padStart(2, '0');
  } else if (tu) fim = tu.fim;
  return (tu ? tu.nome + ' · ' : '') + S.time + (fim ? '–' + fim : '');
}

/* ---------- tabela do pacote (horas × grupo), com a regra dela ---------- */
function tabelaPacotes(x) {
  const faixas = x.pacotes[0].faixas;
  const rotFx = (f, i) => i === 0 ? `até ${f.ate} pessoas` : `${faixas[i - 1].ate + 1} a ${f.ate} pessoas`;
  return `<div class="pacTab">
    <div class="pacTopo"><b>Valor do grupo (não é por pessoa)</b>${exemploTag()}</div>
    <table><thead><tr><th>Duração</th>${faixas.map((f, i) => `<th>${rotFx(f, i)}</th>`).join('')}</tr></thead>
    <tbody>${x.pacotes.map(pk => `<tr><th>${rotuloHoras(pk.h)}</th>${pk.faixas.map(f => `<td>${eur(f.v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <ul class="pacNotas">
      <li>Tour <b>privativo</b>: só o seu grupo — e um grupo por dia.</li>
      <li>Sinal de <b>${sinalPct()}%</b> para reservar; o restante no dia.</li>
      ${+DB.settings.horaExtra ? `<li>Hora extra, se houver disponibilidade: <b>${eur(DB.settings.horaExtra)}</b>.</li>` : ''}
      <li>Mais de ${faixas[faixas.length - 1].ate} pessoas? <a target="_blank" rel="noopener" href="${waLink('Olá, ' + guiaNome() + '! Somos um grupo maior e queremos o passeio ' + tl(x.name) + '.')}">peça um orçamento</a>.</li>
    </ul>
  </div>`;
}

/* ---------- termos: junto do preço, no checkout e no voucher ---------- */
function termosLista() { return ((DB.settings.termos && (DB.settings.termos.pt || [])) || []).filter(Boolean); }
function termosHtml(aberto) {
  return `<details class="termos" ${aberto ? 'open' : ''}><summary><b>Termos e condições da reserva</b><small>valor, sinal, cancelamento</small></summary>
    <ul>${termosLista().map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>`;
}
function termosCheckbox() {
  return `<label class="optin termosOk"><input type="checkbox" id="fTermos">
    <span><b>Li e aceito os termos da reserva</b><small>${esc(termosLista()[0] || '')}
    <a href="#" id="verTermos">Ler tudo</a></small></span></label>
    <div id="termosInline" hidden>${termosHtml(true)}</div>`;
}
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'verTermos') { e.preventDefault(); const el = document.getElementById('termosInline'); if (el) el.hidden = !el.hidden; }
});

/* ---------- extras da página do passeio: os vídeos dela (a prova) ---------- */
function extrasDoTour(x) {
  const vs = Array.isArray(x.videos) ? x.videos.filter(v => v && v[1]) : [];
  if (!vs.length) return '';
  return `<div class="sec tourVideos"><span class="seclabel">Veja nos vídeos da ${esc(guiaNome())}</span>
    <div class="tvLista">${vs.map(([tit, url]) => `<a class="tvLink" href="${esc(url)}" target="_blank" rel="noopener"><span class="tvIc">${IC.video}</span><span>${esc(tit)}</span><span class="go" aria-hidden="true">↗</span></a>`).join('')}</div></div>`;
}

/* =====================================================
   PRIMEIRA TELA
   ===================================================== */
function viewHub() {
  const st = DB.settings;
  const aval = typeof avaliacoesPublicadas === 'function' ? avaliacoesPublicadas() : (DB.avaliacoes || []).filter(a => a.publicar);
  const redes = [
    st.insta ? { u: 'https://instagram.com/' + String(st.insta).replace(/^@/, ''), ic: ICONE_IG, n: 'Instagram', c: 'ig' } : null,
    linkExterno(st.site) ? { u: linkExterno(st.site), ic: ICONE_SITE, n: 'Site', c: 'site' } : null,
    linkExterno(st.youtube) ? { u: linkExterno(st.youtube), ic: IC.yt, n: 'YouTube', c: 'yt' } : null,
    st.email ? { u: 'mailto:' + st.email, ic: IC.email, n: 'E-mail', c: 'mail' } : null,
  ].filter(Boolean);
  const bt = (id, ic, tit, sub, cls = '') => `<button class="lk ${cls}" id="${id}"><span class="ic">${ic}</span><span><b>${tit}</b><small>${sub}</small></span><span class="go" aria-hidden="true">→</span></button>`;
  const foto = st.photo ? `<img id="hubFace" src="${esc(st.photo)}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;object-position:center 22%">` : IC.selo;
  app.innerHTML = `
  <div class="hub carol">
    <div class="hub-bg hub-textura" style="background-image:url(${esc(st.homePhoto || 'fotos/fundo.svg')})"></div>
    <div class="hub-in">
      <div class="vcard">
        <div class="hub-brand">${logoImg(96, 'escuro')}</div>
        <p class="lema">Menos estradas, mais histórias.</p>
        <p class="tagline">${esc(noIdioma(st.homeText) || t('tagline'))}</p>
        ${st.badge ? `<p class="hubBadge">${esc(st.badge)}</p>` : ''}
        ${redes.length ? `<nav class="redes" aria-label="Redes de ${esc(guiaNome())}">${redes.map(r =>
          `<a class="rede ${r.c}" href="${esc(r.u)}" target="_blank" rel="noopener" aria-label="${r.n}" title="${r.n}">${r.ic}</a>`).join('')}</nav>` : ''}
      </div>

      <p class="hubRot">Com a ${esc(guiaNome())}</p>
      ${bt('goTours', ICONE_MENU.passeios, t('seeTours'), t('seeToursSub'), 'main')}
      ${bt('goTransfer', ICONE_MENU.transfer, 'Transfer', 'Aeroporto, estação, porto e entre cidades')}

      <p class="hubRot">Conheça</p>
      <button class="lk" id="goAbout"><span class="ic">${foto}</span><span><b>${t('aboutLink')}</b><small>Tour leader · RNAAT 1013/2026 · Tavira</small></span><span class="go" aria-hidden="true">→</span></button>
      ${bt('goAval', IC.estrela, 'Avaliações', aval.length ? `${aval.length} ${aval.length === 1 ? 'depoimento' : 'depoimentos'} · deixe o seu` : 'Viajou comigo? Deixe o seu')}
      <a class="lk" href="${waLink('Olá, ' + guiaNome() + '! Vim pelo app e queria saber mais sobre as viagens e os passeios.')}" target="_blank" rel="noopener"><span class="ic wa">${ICONE_WA}</span><span><b>Fale comigo no WhatsApp</b><small>${esc(st.whats || '')}</small></span><span class="go" aria-hidden="true">→</span></a>

      ${typeof secaoDepoimentos === 'function' ? secaoDepoimentos('noHub') : ''}

      <p class="hubRot">Presente para a sua viagem</p>
      ${bt('goEbooks', IC.livro, 'Guias de Portugal e da Itália', 'E-books de presente para quem viaja comigo')}
      <button class="adm-entry" id="admEntry">🔒 ${t('admEntry')}</button>
    </div>
  </div>`;
  $('#goTours').onclick = () => go('/tours');
  $('#goTransfer').onclick = () => go('/transfer');
  $('#goEbooks').onclick = () => go('/ebooks');
  $('#goAbout').onclick = () => go('/about');
  $('#goAval').onclick = () => go('/avaliacoes');
  $('#admEntry').onclick = () => go('/adm/today');
  fallbackPhoto($('#hubFace'), IC.selo);
}

/* topo das telas internas */
function topoCarol(voltar = '/') {
  return `<header class="topbar"><button class="backbtn" id="bk" aria-label="${t('back')}">←</button>
    <span class="tbrand">${logoImg(30)}</span></header>`;
}
function ligaVoltar(destino = '/') { const b = $('#bk'); if (b) b.onclick = () => go(destino); }

/* =====================================================
   ROTAS NOVAS
   ===================================================== */
function rotaExtra(p) {
  const r = p[0];
  /* telas da base que não estão no pacote dela: voltam para o início */
  if (['consultoria', 'presente', 'vale', 'ingressos'].includes(r)) { go('/'); return true; }
  if (r === 'avaliar') { viewAvaliar(p[1]); return true; }
  if (r === 'avaliacoes') { viewAvaliacoes(); return true; }
  if (r === 'voucher') { viewVoucher(decodeURIComponent(p[1] || '')); return true; }
  if (r === 'vo') { viewVoucherPublico(p.slice(1).join('/')); return true; }
  if (r === 'r' && typeof viewRoteiroPrivado === 'function') { viewRoteiroPrivado(decodeURIComponent(p[1] || '')); return true; }
  return false;
}

/* =====================================================
   QUEM SOU EU — a apresentação da guia
   ===================================================== */
function viewAbout() {
  const st = DB.settings;
  const paras = ((st.bio && tl(st.bio)) || '').split(/\n\s*\n/).filter(Boolean);
  app.innerHTML = `${topoCarol()}
  <main class="wrap about carolAbout">
    ${st.photo ? `<div class="abFoto"><img src="${esc(st.photo)}" alt="${esc(guiaNome())}"></div>` : `<div class="abFoto abSemFoto">${logoMark(120, 'var(--brand-cidra)')}</div>`}
    <p class="lema escuro">Menos estradas, mais histórias.</p>
    <h1 class="pageh">Quem é a ${esc(guiaNome())}</h1>
    <p class="abSub">${esc(st.badge || '')}</p>
    <div class="ab-body">${paras.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="ab-facts">
      <div><small>Mora em</small><b>${esc(guiaBase() || 'Tavira, Algarve')}</b></div>
      <div><small>Registro</small><b>RNAAT 1013/2026</b></div>
      <div><small>Destinos</small><b>Itália e Portugal</b></div>
    </div>
    ${st.photo2 ? `<img class="abFoto2" src="${esc(st.photo2)}" alt="">` : ''}
    ${typeof secaoDepoimentos === 'function' ? secaoDepoimentos('noSobre') : ''}
    <div class="ab-cta">
      <h3>Vamos planejar a sua viagem?</h3>
      <div class="ab-btns">
        <button class="cta" id="abTours">${t('seeTours')}</button>
        <a class="mini" href="${waLink('Olá, ' + guiaNome() + '!')}" target="_blank" rel="noopener">WhatsApp</a>
        ${st.insta ? `<a class="mini" href="https://instagram.com/${esc(st.insta)}" target="_blank" rel="noopener">@${esc(st.insta)}</a>` : ''}
      </div>
    </div>
  </main>`;
  ligaVoltar('/');
  $('#abTours').onclick = () => go('/tours');
}

/* =====================================================
   VOUCHER — sai sozinho por reserva, no modelo PADRONIZADO que ela edita
   no painel (aba Voucher, voucher-padrao.js): faixa, títulos, os blocos
   "o que levar", pagamento, contato e o presente (os guias de Portugal e
   da Itália). A reserva traz os dados; o modelo traz o texto dela.
   ===================================================== */
function dadosVoucher(codigo) {
  const b = Bookings.byCode(codigo);
  if (!b) return null;
  const x = Tours.get(b.tourId) || { name: { pt: 'Passeio' } };
  const pago = Bookings.paid(b);
  const quando = typeof janelaDoTour === 'function' && b.time ? janelaDoTour({ time: b.time, horas: b.horas }) : (b.time || '');
  return { ref: b.code, nome: b.name, hotel: b.hotel || '', emissao: (b.createdAt || '').slice(0, 10) || isoToday(),
    linhas: [{ data: b.date, desc: tl(x.name) + (b.horas ? ` — ${rotuloHoras(b.horas)}` : ''), sub: [`${b.pax} ${b.pax === 1 ? 'pessoa' : 'pessoas'}`, quando].filter(Boolean).join(' · '), valor: b.total }],
    total: b.total, pago, encontro: x.encontroAberto ? '' : noIdioma(x.meeting), whats: b.whats, email: b.email, tipo: 'reserva' };
}
/* a FOLHA do voucher: a mesma na tela do cliente, no PDF e na prévia da aba Voucher */
function voucherFolhaHtml(v, M) {
  const dt = (iso) => iso ? iso.split('-').reverse().join('/') : '';
  const pct = v.total ? Math.round(v.pago / v.total * 100) : 0;
  const estado = v.pago >= v.total && v.total > 0 ? `✓ PAGO — 100% DO VALOR RECEBIDO` : v.pago > 0 ? `✓ SINAL RECEBIDO — ${eur(v.pago)} (${pct}%) · restante ${eur(v.total - v.pago)}` : 'AGUARDANDO O SINAL';
  const blocos = (M.blocos || []).filter(b => b.ativo !== false && (b.k === 'termos' ? termosLista().length : String(b.texto || '').trim()));
  const corpoBloco = (b) => b.k === 'termos'
    ? `<ul>${termosLista().map(t2 => `<li>${esc(t2)}</li>`).join('')}</ul>`
    : `<ul>${String(b.texto).split('\n').map(l => l.trim()).filter(Boolean).map(l => `<li>${esc(l.replace(/^[-•]\s*/, ''))}</li>`).join('')}</ul>`;
  const presente = M.presente && typeof ebooksLista === 'function' ? ebooksLista().filter(e => e.pronto) : [];
  return `<article class="voucherCarol" id="voucherFolha">
      <header class="vchFaixa">
        <img src="arte/logo-escuro.png" alt="${esc(guiaNegocio())}">
        <div><b>${esc(M.faixa).replace(/\n/g, '<br>')}</b><small>${esc(M.faixaSub)}</small></div>
      </header>
      <div class="vchCorpo">
        <h1>${esc(M.titulo)}</h1>
        <p class="vchSub">${esc(M.sub)}</p>
        <dl class="vchDados">
          <div><dt>Em nome de</dt><dd>${esc(v.nome)}</dd></div><div><dt>Nº de referência</dt><dd>${esc(v.ref)}</dd></div>
          <div><dt>Data de emissão</dt><dd>${dt(v.emissao)}</dd></div><div><dt>Hospedagem</dt><dd>${esc(v.hotel || '—')}</dd></div>
        </dl>
        <h2>SERVIÇOS CONTRATADOS</h2>
        <table class="vchTab"><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>VALOR</th></tr></thead>
          <tbody>${v.linhas.map(l => `<tr><td>${dt(l.data)}</td><td><b>${esc(l.desc)}</b><small>${esc(l.sub || '')}</small></td><td>${eur(l.valor)}</td></tr>`).join('')}</tbody></table>
        <p class="vchTotal"><span>TOTAL</span><b>${eur(v.total)}</b></p>
        <p class="vchEstado ${v.pago >= v.total && v.total > 0 ? 'ok' : v.pago > 0 ? 'sinal' : 'falta'}">${estado}</p>
        ${v.encontro ? `<p class="vchInfo"><b>Ponto de encontro:</b> ${esc(v.encontro)}.</p>` : ''}
        ${blocos.map(b => `<div class="vchTermos vchBloco"><b>${esc(b.titulo)}</b>${corpoBloco(b)}</div>`).join('')}
        ${presente.length ? `<div class="vchTermos vchPresente"><b>🎁 Seu presente</b><p>Os meus guias para a sua viagem, completos:</p>
          <ul>${presente.map(e => `<li><a href="${esc(ebookLinkPresente(e.id))}">${esc(e.titulo)}</a></li>`).join('')}</ul></div>` : ''}
        <p class="vchAss">${esc(M.assinatura || 'Com carinho,')}<br><span>${esc(guiaNome())}</span> — ${esc(guiaNegocio())}</p>
      </div>
      <footer class="vchPe">
        <span>☎ ${esc(DB.settings.whats || '')}</span>${DB.settings.email ? `<span>✉ ${esc(DB.settings.email)}</span>` : ''}${DB.settings.insta ? `<span>◎ ${esc(DB.settings.insta)}</span>` : ''}
        <span class="bb">${IC.selo} ${esc(DB.settings.badge || '')}</span>
      </footer>
    </article>`;
}
/* O LINK QUE VAI PARA O CLIENTE: a reserva mora no aparelho dela (e, com banco,
   numa tabela que só ela lê), então #/voucher/CÓDIGO não abriria no celular do
   cliente. O voucher viaja DENTRO do link (#/vo/…), como o orçamento; o modelo
   (faixa, blocos, termos) vem dos ajustes, que são públicos. Sem telefone nem
   e-mail no link. */
function voucherLinkPublico(codigo) {
  const v = dadosVoucher(codigo);
  if (!v) return location.origin + location.pathname + '#/voucher/' + encodeURIComponent(codigo);
  const p = { r: v.ref, n: v.nome, h: v.hotel, e: v.emissao, l: v.linhas.map(l => [l.data, l.desc, l.sub, l.valor]), t: v.total, p: v.pago, m: v.encontro };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(p)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return location.origin + location.pathname + '#/vo/' + b64;
}
function voucherDeLink(b64) {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(String(b64).replace(/-/g, '+').replace(/_/g, '/')))));
    return { ref: p.r, nome: p.n, hotel: p.h, emissao: p.e, linhas: (p.l || []).map(([data, desc, sub, valor]) => ({ data, desc, sub, valor })), total: +p.t || 0, pago: +p.p || 0, encontro: p.m || '', tipo: 'link' };
  } catch (e) { return null; }
}
function viewVoucherPublico(b64) {
  const v = voucherDeLink(b64);
  if (!v) { app.innerHTML = `${topoCarol()}<main class="wrap narrow"><p class="empty">Voucher não encontrado. Peça o link de novo para a ${esc(guiaNome())}.</p></main>`; ligaVoltar('/'); return; }
  const M = typeof voucherModelo === 'function' ? voucherModelo() : { faixa: '', faixaSub: '', titulo: 'VOUCHER', sub: '', blocos: [], presente: false, assinatura: '' };
  app.innerHTML = `${topoCarol()}
  <main class="wrap vchWrap">
    <div class="vchAcoes noprint"><button class="cta sm" id="vchPdf">Salvar em PDF / imprimir</button>
      <a class="mini" target="_blank" rel="noopener" href="${esc(waLink(`Olá, ${guiaNome()}! Estou com o voucher ${v.ref}.`))}">Falar com a ${esc(guiaNome())}</a></div>
    ${voucherFolhaHtml(v, M)}
  </main>`;
  ligaVoltar('/');
  $('#vchPdf').onclick = () => window.print();
}
function viewVoucher(codigo) {
  const v = dadosVoucher(codigo);
  if (!v) { app.innerHTML = `${topoCarol()}<main class="wrap narrow"><p class="empty">Voucher não encontrado. Confira o código ou fale com a ${esc(guiaNome())}.</p></main>`; ligaVoltar('/'); return; }
  const M = typeof voucherModelo === 'function' ? voucherModelo() : { faixa: '', faixaSub: '', titulo: 'VOUCHER', sub: '', blocos: [], presente: false, assinatura: '' };
  const msg = `Olá, ${String(v.nome).split(' ')[0]}! Aqui está o seu voucher da ${guiaNegocio()}: ${voucherLinkPublico(codigo)}`;
  app.innerHTML = `${topoCarol()}
  <main class="wrap vchWrap">
    <div class="vchAcoes noprint">
      <button class="cta sm" id="vchPdf">Salvar em PDF / imprimir</button>
      ${v.whats ? `<a class="mini" target="_blank" rel="noopener" href="${esc(waLink(msg, String(v.whats).replace(/\D/g, '')))}">Mandar no WhatsApp</a>` : ''}
      ${v.email ? `<a class="mini" href="mailto:${esc(v.email)}?subject=${encodeURIComponent('Seu voucher — ' + guiaNegocio())}&body=${encodeURIComponent(msg)}">Mandar por e-mail</a>` : ''}
    </div>
    ${voucherFolhaHtml(v, M)}
  </main>`;
  ligaVoltar(location.hash.includes('adm') ? '/adm/bookings' : '/');
  $('#vchPdf').onclick = () => window.print();
}

/* =====================================================
   AVALIAÇÕES — QR no fim do passeio (a pessoa aponta a câmera e avalia)
   e os depoimentos em vídeo (o do Marcelo, grupo de 11)
   ===================================================== */
function viewAvaliar(tourId) {
  const S = viewAvaliar._s = viewAvaliar._s || { estrelas: 0, tourId: tourId || '' };
  const tours = Tours.all().filter(x => !x.oculto && x.status !== 'draft');
  app.innerHTML = `${topoCarol()}
  <main class="wrap roteiro avaliar">
    <p class="lema escuro">Obrigada por viajar comigo!</p>
    <h1 class="pageh">Como foi a sua experiência?</h1>
    <div class="estrelas" role="radiogroup" aria-label="Nota">${[1, 2, 3, 4, 5].map(n =>
      `<button type="button" role="radio" aria-checked="${S.estrelas === n}" class="est ${n <= S.estrelas ? 'on' : ''}" data-e="${n}" aria-label="${n} estrela${n > 1 ? 's' : ''}">★</button>`).join('')}</div>
    <label class="fld">Conte em poucas palavras<textarea id="avTx" rows="4" placeholder="O que você mais gostou?">${esc(S.texto || '')}</textarea></label>
    <label class="fld">Seu primeiro nome<input id="avNome" value="${esc(S.nome || '')}"></label>
    <label class="fld">Qual passeio ou viagem?<select id="avTour"><option value="">—</option>${tours.map(x => `<option value="${x.id}" ${S.tourId === x.id ? 'selected' : ''}>${esc(tl(x.name))}</option>`).join('')}</select></label>
    <label class="optin"><input type="checkbox" id="avPub" checked><span><b>A ${esc(guiaNome())} pode mostrar minha avaliação no app</b><small>Só o primeiro nome aparece.</small></span></label>
    <button class="cta" id="avEnviar">Enviar avaliação</button>
  </main>`;
  ligaVoltar('/');
  const guarda = () => { S.texto = $('#avTx').value; S.nome = $('#avNome').value; S.tourId = $('#avTour').value; };
  $$('[data-e]').forEach(b => b.onclick = () => { guarda(); S.estrelas = +b.dataset.e; viewAvaliar(S.tourId); });
  $('#avEnviar').onclick = () => {
    guarda();
    if (!S.estrelas) return toast('Toque nas estrelas');
    const av = { id: uid() + uid(), nome: (S.nome || 'Cliente').trim().split(' ')[0], estrelas: S.estrelas, texto: (S.texto || '').trim().slice(0, 600),
      tourId: S.tourId, data: isoToday(), autorizou: $('#avPub').checked, publicar: false };
    DB.avaliacoes.push(av);
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
    /* com o banco ligado, a avaliação chega no painel dela (entra sempre não publicada) */
    if (typeof itAvaliacaoPublica === 'function') itAvaliacaoPublica(av);
    viewAvaliar._s = null;
    const google = linkExterno(DB.settings.reviewGoogle);
    app.innerHTML = `${topoCarol()}<main class="wrap roteiro fim avaliar">
      <div class="okc">✓</div><h2 class="okh">Obrigada! ❤️</h2>
      <p class="hint center">Sua avaliação chegou para a ${esc(guiaNome())}. ${S.estrelas >= 4 && google ? 'Se puder, deixe também no Google: ajuda muito quem está escolhendo com quem viajar.' : ''}</p>
      ${S.estrelas >= 4 && google ? `<a class="cta" target="_blank" rel="noopener" href="${esc(google)}">Avaliar também no Google ↗</a>` : ''}
      <button class="cta soft" id="avVolta">Voltar ao início</button></main>`;
    ligaVoltar('/'); $('#avVolta').onclick = () => go('/');
  };
}
function viewAvaliacoes() {
  const lista = typeof avaliacoesPublicadas === 'function' ? avaliacoesPublicadas() : (DB.avaliacoes || []).filter(a => a.publicar);
  const comNota = lista.filter(a => +a.estrelas > 0);
  const media = comNota.length ? (comNota.reduce((s2, a) => s2 + a.estrelas, 0) / comNota.length).toFixed(1).replace('.', ',') : '';
  app.innerHTML = `${topoCarol()}
  <main class="wrap avaliacoes">
    <h1 class="pageh">Avaliações</h1>
    ${lista.length ? `<p class="avMedia">${media ? `<b>${media}</b> ★ · ` : ''}${lista.length} ${lista.length === 1 ? 'depoimento' : 'depoimentos'}</p>
      <div class="avLista">${lista.map(a => { const x = Tours.get(a.tourId); return `<figure class="depoCard"><span class="depoAspas">“</span><blockquote>${esc(a.texto)}</blockquote>
        <figcaption><b>${esc(a.nome)}</b> ${+a.estrelas ? `<span class="avEst">${'★'.repeat(a.estrelas)}</span>` : ''}<small>${x ? esc(tl(x.name)) : ''}</small>
        ${a.video ? `<a class="mini avVideo" href="${esc(a.video)}" target="_blank" rel="noopener">▶ Ver o depoimento em vídeo</a>` : ''}</figcaption></figure>`; }).join('')}</div>`
      : `<p class="rtintro">Os depoimentos aparecem aqui assim que a ${esc(guiaNome())} aprova. Viajou com ela?</p>`}
    <button class="cta" id="avNova">Deixar a minha avaliação</button>
  </main>`;
  ligaVoltar('/');
  $('#avNova').onclick = () => go('/avaliar');
}

if (typeof module !== 'undefined') module.exports = { janelaDoTour, dadosVoucher, voucherFolhaHtml, voucherLinkPublico, voucherDeLink };

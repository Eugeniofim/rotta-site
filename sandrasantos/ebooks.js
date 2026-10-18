/* =====================================================
   GUIAS DE PORTUGAL E DA ITÁLIA — e-books de presente (17/10/2026)

   O mesmo mecanismo da base (demo de Londres): a vitrine mostra os guias,
   o cliente vê uma prévia, e o guia COMPLETO é presente de quem viaja com
   ela — liberado pelo código do voucher ou pelo link de presente que ela
   manda do painel (aba Voucher → "Enviar um guia de presente").

   Os guias são os PDFs DELA ("Os e-books de Portugal e da Itália, em PDF,
   como estiverem" — kit de boas-vindas, parte 3). Enquanto o PDF não chega,
   o guia aparece como "em preparação" e não entra no voucher.
   Para ligar: pôr o arquivo em ebooks/ e preencher `pdf` abaixo (ou `caps`,
   se um dia ela quiser o guia como página, no leitor da marca).
   ===================================================== */
'use strict';

const EBOOKS = [
  {
    id: 'guia-italia',
    titulo: 'Guia da Itália',
    sub: 'O sul da Itália pelos olhos da Sandra',
    capa: 'fotos/r-napoles.svg',
    cor: '#0E5A78',
    resumo: 'O guia da Sandra para a sua viagem pela Itália: Nápoles, a Costa Amalfitana, o Cilento, Benevento e a Sicília.',
    pdf: '',      /* ex.: 'ebooks/guia-italia.pdf' — quando ela mandar */
    caps: [],
  },
  {
    id: 'guia-portugal',
    titulo: 'Guia de Portugal',
    sub: 'O Portugal de quem mora no Algarve',
    capa: 'fotos/r-algarve.svg',
    cor: '#A9471F',
    resumo: 'O guia da Sandra para a sua viagem por Portugal, a começar pelo Algarve, onde ela mora.',
    pdf: '',      /* ex.: 'ebooks/guia-portugal.pdf' — quando ela mandar */
    caps: [],
  },
];

const ebook = (id) => EBOOKS.find(e => e.id === id);
const ebPronto = (e) => !!(e && (e.pdf || (e.caps && e.caps.length)));

/* ---------- liberação (prévia × completo) ----------
   Na vitrine o cliente vê a capa e a prévia. O completo é liberado quando
   ele fecha com ela: o código do voucher (ou o link de presente) libera
   TODOS os guias neste aparelho. */
const EB_OK = (typeof DB_KEY !== 'undefined' ? String(DB_KEY).replace(/_db_v\d+$/, '') : 'ss') + '_ebooks_ok';
function ebLiberado() { try { return localStorage.getItem(EB_OK) === '1'; } catch (e) { return false; } }
function ebLibera() { try { localStorage.setItem(EB_OK, '1'); } catch (e) {} }
/* quantos capítulos entram na prévia (~20%, no mínimo 1) */
const ebPreviaN = (e) => Math.max(1, Math.round(e.caps.length * 0.2));
/* o código do voucher/reserva vale como chave de desbloqueio */
function ebCodigoVale(codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  if (!c) return false;
  return (DB.bookings || []).some(b => String(b.code || '').toUpperCase() === c && b.status !== 'cancelled');
}

/* ---------- o menu ---------- */
function viewEbooks() {
  app.innerHTML = `${topoCarol()}
  <main class="wrap ebMenu">
    <h1 class="pageh">Guias de Portugal e da Itália</h1>
    <p class="rtintro">Os guias da ${esc(guiaNome())} para a sua viagem. São um presente para quem viaja com ela: leia na tela ou salve para levar no bolso.</p>
    <div class="ebGrade">
      ${EBOOKS.map(e => `<a class="ebCard" href="#/ebook/${e.id}" style="--eb:${e.cor}">
        <span class="ebCapa" style="background-image:url(${esc(e.capa)})"><em>e-book</em></span>
        <span class="ebTx"><b>${esc(e.titulo)}</b><small>${esc(e.sub)}</small>
          <span class="ebMeta">${!ebPronto(e) ? 'em preparação' : ebLiberado() ? 'liberado ✓' : 'presente de quem viaja comigo'}</span></span>
      </a>`).join('')}
    </div>
    <p class="ebNota">${ebLiberado() ? '🎉 Seus guias estão liberados.' : `🎁 Os guias <b>completos</b> são um presente da ${esc(guiaNome())} para quem viaja com ela.`}</p>
  </main>`;
  ligaVoltar('/');
}

/* ---------- o leitor ---------- */
function viewEbook(id) {
  const e = ebook(id);
  if (!e) { app.innerHTML = `${topoCarol()}<main class="wrap narrow"><p class="empty">Guia não encontrado.</p></main>`; ligaVoltar('/ebooks'); return; }
  const lib = ebLiberado(), pronto = ebPronto(e);
  const caps = e.caps || [];
  app.innerHTML = `${topoCarol()}
  <main class="wrap ebRead" style="--eb:${e.cor}">
    <div class="ebAcoes noprint">${lib && caps.length ? '<button class="cta sm" id="ebPdf">🖨 Salvar em PDF / imprimir</button>' : ''}
      ${lib && e.pdf ? `<a class="cta sm" href="${esc(e.pdf)}" target="_blank" rel="noopener">📥 Abrir o guia completo (PDF)</a>` : ''}
      <a class="mini" href="#/ebooks">← Todos os guias</a></div>
    <article class="ebDoc" id="ebDoc">
      <header class="ebCab" style="background-image:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.72)),url(${esc(e.capa)})">
        <div class="ebSelo">${typeof logoImg === 'function' ? logoImg(44, 'escuro') : esc(guiaNegocio())}</div>
        <div class="ebCabTx"><small>e-book de presente</small><h1>${esc(e.titulo)}</h1><p>${esc(e.sub)}</p></div>
      </header>
      <p class="ebIntro">${esc(e.resumo)}</p>
      ${!pronto ? `<section class="ebLock"><span class="ebLockIc">✍️</span>
        <h3>Em preparação</h3>
        <p>A ${esc(guiaNome())} está finalizando este guia. Quem viaja com ela recebe de presente assim que ficar pronto.</p>
        <a class="cta sm" href="#/tours">Ver os passeios e a viagem sob medida</a></section>` : ''}
      ${pronto ? (lib ? caps : caps.slice(0, ebPreviaN(e))).map((c, i) => `<section class="ebCap">
        <h2><span class="ebNum">${i + 1}</span>${esc(c.h)}</h2>
        ${c.ph ? `<figure class="ebFoto"><img src="${esc(c.ph)}" alt="" loading="lazy"></figure>` : ''}
        <div class="ebTexto">${ebHtml(c.t)}</div>
      </section>`).join('') : ''}
      ${pronto && !lib ? `<section class="ebLock noprint">
        <span class="ebLockIc">🎁</span>
        <h3>O guia completo é presente</h3>
        <p>Você viu a prévia. O guia <b>completo</b> é um presente da ${esc(guiaNome())} para quem viaja com ela.</p>
        <a class="cta sm" href="#/tours">Ver os passeios</a>
        <details class="ebCod"><summary>Já viajei ou vou viajar com ela — tenho o código</summary>
          <div class="ebCodIn"><input id="ebCodTxt" placeholder="código do seu voucher (ex.: ${esc(PREFIXO)}-3147)" autocomplete="off">
          <button class="mini" id="ebCodOk">Liberar</button></div><p class="ebCodMsg" id="ebCodMsg"></p></details>
      </section>` : ''}
      <footer class="ebFim">
        <p class="ebAss">Feito com carinho pela <b>${esc(guiaNome())}</b> — ${esc(guiaNegocio())}.</p>
        <p class="ebCta noprint">Quer viajar com ela? <a href="#/tours">Veja os passeios →</a></p>
      </footer>
    </article>
  </main>`;
  ligaVoltar('/ebooks');
  const b = document.getElementById('ebPdf');
  if (b) b.onclick = () => { document.body.classList.add('imprimeEbook'); window.print(); setTimeout(() => document.body.classList.remove('imprimeEbook'), 600); };
  const ok = document.getElementById('ebCodOk');
  if (ok) ok.onclick = () => {
    const txt = document.getElementById('ebCodTxt').value, msg = document.getElementById('ebCodMsg');
    if (ebCodigoVale(txt)) { ebLibera(); if (typeof toast === 'function') toast('Guias liberados ✓'); viewEbook(id); }
    else { msg.textContent = `Código não encontrado. Confira no seu voucher, ou fale com a ${guiaNome()}.`; }
  };
}
/* **negrito** e quebras de linha simples */
function ebHtml(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n{2,}/).map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
}

/* ---------- ligar: rotas ---------- */
const _rotaExtraEbooks = rotaExtra;
rotaExtra = function (p) {
  if (p[0] === 'ebooks') { viewEbooks(); return true; }
  if (p[0] === 'ebook') { viewEbook(decodeURIComponent(p[1] || '')); return true; }
  /* link de presente: libera TODOS os guias neste aparelho e abre o escolhido */
  if (p[0] === 'g') { ebLibera(); viewEbook(decodeURIComponent(p[1] || (EBOOKS[0] && EBOOKS[0].id))); return true; }
  return _rotaExtraEbooks(p);
};
/* a lista dos guias + o link de presente (usado pelo painel e pelo voucher) */
function ebooksLista() { return EBOOKS.map(e => ({ id: e.id, titulo: e.titulo, sub: e.sub, pronto: ebPronto(e) })); }
function ebookLinkPresente(id) { return (typeof linkApp === 'function' ? linkApp('g/' + id) : location.origin + location.pathname + '#/g/' + id); }

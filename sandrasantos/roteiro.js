/* =====================================================
   ROTEIRO PRIVADO — o dia a dia de uma viagem sob medida (17/10/2026)

   A Sandra monta no painel (Roteiros: dias × manhã/tarde × pontos
   turísticos dela, com notas) e publica: o cliente recebe um LINK PRIVADO
   (#/r/<código>) com os dias, os textos e as dicas, e salva em PDF.
   Nada disso aparece na vitrine.

   Veio do "Monte seu roteiro" pago da base (demo de Londres), que NÃO está
   no pacote dela: o questionário e o pagamento saíram; o pedido de viagem
   sob medida (pedidos.js) cai em Orçamentos, e o orçamento aceito abre o
   roteiro aqui.
   ===================================================== */
'use strict';

const diasEntre = (a, b) => { if (!a || !b || b < a) return 0; return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5) + 1; };
const PERIODO_ROT = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', dia: 'Dia inteiro' };
function fmtDiaCurto(iso) { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }); }

function viewRoteiroPrivado(codigo) {
  const naoAchou = () => { app.innerHTML = `${topoCarol()}<main class="wrap narrow"><p class="empty">Roteiro não encontrado. Confira o link que a ${esc(guiaNome())} te mandou.</p></main>`; ligaVoltar('/'); };
  const local = (DB.roteiros || []).find(z => z.codigo === codigo);
  if (local && local.dias && local.dias.length) return desenhaRoteiro(local, codigo);
  /* no celular do cliente o roteiro não está no aparelho: vem da sala, pelo código (só se publicado) */
  if (typeof itRoteiroPublico === 'function' && typeof temNuvem === 'function' && temNuvem()) {
    app.innerHTML = `${topoCarol()}<main class="wrap narrow"><p class="empty">Carregando o seu roteiro…</p></main>`;
    itRoteiroPublico(codigo).then(r => { if (location.hash.indexOf(codigo) < 0) return; if (r && r.dias && r.dias.length) desenhaRoteiro(r, codigo); else naoAchou(); });
    return;
  }
  naoAchou();
}
function desenhaRoteiro(r, codigo) {
  /* o ponto: o do aparelho dela, senão o texto que foi junto quando ela publicou */
  const ponto_ = (pid) => (typeof ponto === 'function' && ponto(pid)) || (r.pontosPub || {})[pid] || null;
  if (viewRoteiroPrivado._cod !== codigo) { viewRoteiroPrivado._cod = codigo; viewRoteiroPrivado._aba = 0; }
  const aba = Math.min(viewRoteiroPrivado._aba || 0, r.dias.length - 1);
  const dia = r.dias[aba];
  let n = 0;
  app.innerHTML = `${topoCarol()}
  <main class="wrap rtPriv">
    ${r.status !== 'publicado' ? `<div class="rtAviso">✎ Prévia — a ${esc(guiaNome())} ainda está montando este roteiro.</div>` : ''}
    <article class="rtFolha">
      <header class="rtCapa"><img src="arte/logo-escuro.png" alt="${esc(guiaNegocio())}">
        <div><b>Roteiro de ${esc(r.nome)}</b><small>${fmtDate(r.ini)} a ${fmtDate(r.fim)} · ${(+r.adultos || 0) + (+r.criancas || 0)} pessoas${r.hotel ? ' · ' + esc(r.hotel) : ''}</small></div></header>
      <nav class="rtDias" aria-label="Dias">${r.dias.map((d, i) => `<button class="${i === aba ? 'on' : ''}" data-dia="${i}"><b>Dia ${i + 1}</b><small>${fmtDiaCurto(d.data)}</small></button>`).join('')}</nav>
      ${dia.periodos.map(pe => `<section class="rtPer">
        <h3><span>${PERIODO_ROT[pe.p] || ''}</span>${esc(pe.titulo || '')}</h3>
        ${pe.itens.map(pid => { const p = ponto_(pid); if (!p) return ''; n++; return `<div class="rtItem">
          <span class="rtFoto" ${p.ph ? `style="background-image:url(${esc(p.ph)})"` : ''}><i>${n}</i></span>
          <div><b>${esc(p.n)}</b>${p.d ? `<p>${esc(p.d.length > 320 ? p.d.slice(0, p.d.lastIndexOf(' ', 310)) + '…' : p.d)}</p>` : ''}
            ${p.dica ? `<small class="rtDica">💡 ${esc(p.dica)}</small>` : ''}</div></div>`; }).join('')}
        ${pe.nota ? `<p class="rtNota">${esc(pe.nota)}</p>` : ''}
      </section>`).join('')}
      <footer class="rtPe">Roteiro feito por ${esc((typeof GUIA_CFG !== 'undefined' && GUIA_CFG.nomeCompleto) || guiaNome())} · ${esc(guiaNegocio())}${DB.settings.badge ? ' · ' + esc(DB.settings.badge) : ''}</footer>
    </article>
    <div class="vchAcoes noprint"><button class="cta sm" id="rtPdf">Salvar em PDF</button>
      <a class="mini" href="${esc(waLink('Olá, ' + guiaNome() + '! Estou com o meu roteiro (' + r.codigo + ') e tenho uma dúvida.'))}" target="_blank" rel="noopener">Falar com a ${esc(guiaNome())}</a></div>
  </main>`;
  ligaVoltar(location.hash.includes('adm') ? '/adm/roteiros' : '/');
  $$('[data-dia]').forEach(b => b.onclick = () => { viewRoteiroPrivado._aba = +b.dataset.dia; desenhaRoteiro(r, codigo); });
  $('#rtPdf').onclick = () => window.print();
}

if (typeof module !== 'undefined') module.exports = { diasEntre, PERIODO_ROT };

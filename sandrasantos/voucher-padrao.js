/* =====================================================
   VOUCHER PADRONIZADO — Sandra Santos · Sikania Tour (17/10/2026)

   Menu próprio no painel. Ela escreve UMA vez o modelo do voucher (faixa,
   título, os blocos "o que levar", pagamento, contato…) e todo voucher de
   reserva sai igual, com os dados da reserva no meio (carol.js,
   voucherFolhaHtml). A prévia ao lado muda enquanto ela digita.

   - DB.settings.voucher: { faixa, faixaSub, titulo, sub, assinatura,
     presente, blocos: [{ k, titulo, texto, ativo }] }. Fica nos ajustes
     (públicos, de propósito: o voucher é para o cliente ler).
   - O bloco 'termos' não tem texto próprio: puxa os termos de Ajustes.
   - "Presente": os guias de Portugal e da Itália entram no voucher (link
     de presente) quando o PDF dela estiver no app (ebooks.js).
   - Embaixo: os vouchers das próximas reservas (abrir / mandar) e o envio
     avulso de um guia de presente (veio de "Cupons e brindes", que saiu).
   Inspiração: o voucher inteligente da Ingrid (blocos editáveis).
   O assistente muda o modelo pelo chat (carol-ia.js: onde=voucher).
   ===================================================== */
'use strict';

/* textos de partida — genéricos, sem regra inventada: ela troca */
const VOUCHER_PADRAO = {
  faixa: 'VIAGENS E PASSEIOS\nPELA ITÁLIA E POR PORTUGAL',
  faixaSub: 'Roteiros autorais · com curadoria e acompanhamento',
  titulo: 'VOUCHER DE SERVIÇOS',
  sub: 'Confirmação de reserva e recibo de pagamento',
  assinatura: 'Com carinho,',
  presente: true,
  blocos: [
    { k: 'levar', titulo: 'O que levar', ativo: true, texto: 'Sapato confortável\nDocumento com foto\nProtetor solar, chapéu e garrafinha de água\nCelular carregado e este voucher' },
    { k: 'contato', titulo: 'Durante a viagem', ativo: true, texto: 'Qualquer imprevisto ou atraso, me avise pelo WhatsApp\nO ponto de encontro e o horário exatos são confirmados comigo antes do passeio' },
    { k: 'pagamento', titulo: 'Pagamento', ativo: true, texto: 'O saldo é pago conforme combinado no orçamento' },
    { k: 'termos', titulo: 'Termos da reserva', ativo: true, texto: '' },
  ],
};
function voucherModelo() {
  const st = DB.settings || {};
  if (!st.voucher || !Array.isArray(st.voucher.blocos)) st.voucher = JSON.parse(JSON.stringify(VOUCHER_PADRAO));
  for (const k of ['faixa', 'faixaSub', 'titulo', 'sub', 'assinatura']) if (typeof st.voucher[k] !== 'string') st.voucher[k] = VOUCHER_PADRAO[k];
  if (typeof st.voucher.presente !== 'boolean') st.voucher.presente = true;
  return st.voucher;
}
/* a reserva de exemplo da prévia (não existe: só para ver a folha) */
function voucherExemplo() {
  const x = Tours.live().find(t2 => !t2.servico && t2.pedido !== 'sobmedida') || { name: { pt: 'Passeio' } };
  return { ref: PREFIXO + '-0000', nome: 'Nome do cliente', hotel: 'Hotel do cliente', emissao: isoToday(),
    linhas: [{ data: addDays(isoToday(), 20), desc: tl(x.name), sub: '2 pessoas', valor: 0 }], total: 0, pago: 0, encontro: '', tipo: 'exemplo' };
}

Object.assign(STR, { admVoucher: { pt: 'Voucher', en: 'Voucher' } });
(function abaVoucher() {
  if (ADM_TABS.some(([x]) => x === 'voucher')) return;
  const i = ADM_TABS.findIndex(([x]) => x === 'orcamentos');
  ADM_TABS.splice(i < 0 ? ADM_TABS.length : i + 1, 0, ['voucher', 'admVoucher']);
})();
const _viewAdmVoucher = viewAdm;
viewAdm = function (tab, arg) {
  if (tab === 'voucher') return admVoucher();
  return _viewAdmVoucher(tab, arg);
};

function admVoucher() {
  const M = voucherModelo();
  const hoje = isoToday();
  const proximas = DB.bookings.filter(b => b.status === 'confirmed' && b.date >= hoje).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12);
  const guias = typeof ebooksLista === 'function' ? ebooksLista() : [];
  const prontos = guias.filter(g => g.pronto);
  const bloco = (b, i) => `<div class="vpBloco ${b.ativo === false ? 'off' : ''}">
    <div class="vpBTopo"><label class="pdCheck"><input type="checkbox" data-bat="${i}" ${b.ativo !== false ? 'checked' : ''}> Aparece no voucher</label>
      ${b.k && VOUCHER_PADRAO.blocos.some(z => z.k === b.k) ? '' : `<button class="mini ghost" data-btira="${i}">Tirar</button>`}</div>
    <label class="fld">Título<input data-btit="${i}" value="${esc(b.titulo || '')}"></label>
    ${b.k === 'termos' ? `<p class="why">Este bloco mostra os seus <a href="#/adm/settings">termos de Ajustes</a> (${termosLista().length} linhas).</p>`
      : `<label class="fld">Texto <small class="why">uma linha = um item</small><textarea data-btx="${i}" rows="4">${esc(b.texto || '')}</textarea></label>`}
  </div>`;
  admShell('voucher', `
    <div class="pagehead"><h1 class="pageh">Voucher</h1></div>
    <p class="why">O seu voucher padronizado: escreva uma vez e todo voucher de reserva sai igual, com os dados da reserva no meio. Ele abre no celular do cliente e sai em PDF.</p>
    <div class="vpGrade">
      <div class="vpForm">
        <section class="card"><h3>Cabeçalho</h3>
          <label class="fld">Faixa <small class="why">ao lado do logo · Enter quebra a linha</small><textarea id="vpFaixa" rows="2">${esc(M.faixa)}</textarea></label>
          <label class="fld">Frase da faixa<input id="vpFaixaSub" value="${esc(M.faixaSub)}"></label>
          <div class="frow"><label class="fld">Título<input id="vpTit" value="${esc(M.titulo)}"></label><label class="fld">Subtítulo<input id="vpSub" value="${esc(M.sub)}"></label></div>
          <label class="fld">Despedida <small class="why">antes do seu nome</small><input id="vpAss" value="${esc(M.assinatura)}"></label>
        </section>
        <section class="card"><h3>Blocos</h3>
          ${M.blocos.map(bloco).join('')}
          <button class="mini" id="vpNovo">+ Bloco</button>
        </section>
        <section class="card"><h3>🎁 Presente no voucher</h3>
          <label class="pdCheck"><input type="checkbox" id="vpPres" ${M.presente ? 'checked' : ''}> Pôr os Guias de Portugal e da Itália no voucher (link de presente)</label>
          <p class="why">${prontos.length ? prontos.map(g => esc(g.titulo)).join(' e ') + ' entram no voucher.' : 'Os guias ainda estão em preparação: entram sozinhos quando o PDF chegar.'}</p>
        </section>
      </div>
      <div class="vpPrevia"><p class="rotMini">Prévia (reserva de exemplo)</p><div id="vpFolha">${voucherFolhaHtml(voucherExemplo(), M)}</div></div>
    </div>

    <section class="card"><h3>Vouchers das próximas reservas</h3>
      ${proximas.length ? proximas.map(b => { const x = Tours.get(b.tourId) || { name: { pt: '' } }; const num = String(b.whats || '').replace(/\D/g, '');
        const msg = `Olá, ${String(b.name).split(' ')[0]}! Aqui está o seu voucher da ${guiaNegocio()}: ${voucherLinkPublico(b.code)}`;
        return `<div class="hjItem"><span class="hjIc">🎟</span><div><b>${esc(b.name)} · ${esc(tl(x.name))}</b><small>${esc(b.code)} · ${b.date.split('-').reverse().join('/')}</small></div>
          <a class="mini" href="#/voucher/${esc(b.code)}">Abrir</a>${num.length >= 8 ? `<a class="mini" target="_blank" rel="noopener" href="${esc(waLink(msg, num))}">WhatsApp</a>` : ''}</div>`; }).join('')
      : '<p class="why">Quando houver reserva (direta ou de um orçamento aceito), o voucher dela aparece aqui.</p>'}
    </section>

    <section class="card" id="ebGiftCard"><h3>📚 Enviar um guia de presente</h3>
      ${prontos.length ? `<p class="why">Mande um dos guias completos para quem você quiser. Quem abrir o link vê o guia inteiro.</p>
      <div class="frow">
        <label class="fld">Guia<select id="ebgSel">${prontos.map(g => `<option value="${esc(g.id)}">${esc(g.titulo)}</option>`).join('')}</select></label>
        <label class="fld">Para quem <small class="why">opcional</small><input id="ebgNome" placeholder="nome"></label>
        <label class="fld">WhatsApp <small class="why">opcional</small><input id="ebgWa" placeholder="+55…"></label>
      </div>
      <div class="tacts"><a class="cta sm" id="ebgWaBtn" target="_blank" rel="noopener">📲 Enviar no WhatsApp</a>
        <button class="mini" id="ebgCopy" type="button">Copiar o link</button><a class="mini" id="ebgVer" target="_blank" rel="noopener">👁 Ver o guia</a></div>`
      : `<p class="why">Os Guias de Portugal e da Itália ainda estão em preparação. Quando o PDF chegar, você manda o link de presente daqui.</p>`}
    </section>`);

  const redesenhaPrevia = () => { const el = $('#vpFolha'); if (el) el.innerHTML = voucherFolhaHtml(voucherExemplo(), M); };
  const guarda = () => {
    M.faixa = $('#vpFaixa').value; M.faixaSub = $('#vpFaixaSub').value; M.titulo = $('#vpTit').value; M.sub = $('#vpSub').value; M.assinatura = $('#vpAss').value;
    M.presente = $('#vpPres').checked;
    $$('[data-btit]').forEach(el => { M.blocos[+el.dataset.btit].titulo = el.value; });
    $$('[data-btx]').forEach(el => { M.blocos[+el.dataset.btx].texto = el.value; });
    $$('[data-bat]').forEach(el => { M.blocos[+el.dataset.bat].ativo = el.checked; });
  };
  $$('.vpForm input, .vpForm textarea').forEach(el => {
    el.addEventListener('input', () => { guarda(); redesenhaPrevia(); });
    el.addEventListener('change', () => { guarda(); save(); redesenhaPrevia(); });
  });
  $('#vpNovo').onclick = () => { guarda(); M.blocos.push({ k: 'b' + uid().slice(0, 5), titulo: 'Novo bloco', texto: '', ativo: true }); save(); admVoucher(); };
  $$('[data-btira]').forEach(b => b.onclick = () => { guarda(); M.blocos.splice(+b.dataset.btira, 1); save(); admVoucher(); });

  const g = document.getElementById('ebGiftCard');
  if (g && g.querySelector('#ebgSel')) {
    const monta = () => {
      const id = g.querySelector('#ebgSel').value;
      const tit = (guias.find(x => x.id === id) || {}).titulo || 'guia';
      const nome = g.querySelector('#ebgNome').value.trim();
      const link = ebookLinkPresente(id);
      const texto = `${nome ? `Oi, ${nome}! ` : 'Oi! '}Aqui é a ${guiaNome()}, da ${guiaNegocio()} 😊 Preparei um presente para você: o meu *${tit}*, completo. É só abrir: ${link}`;
      const wa = g.querySelector('#ebgWa').value.replace(/\D/g, '');
      g.querySelector('#ebgWaBtn').href = waLink(texto, wa);
      g.querySelector('#ebgVer').href = '#/g/' + id;
      g._link = link;
    };
    monta();
    ['#ebgSel', '#ebgNome', '#ebgWa'].forEach(sel => { const el = g.querySelector(sel); el.oninput = monta; el.onchange = monta; });
    g.querySelector('#ebgCopy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(g._link).then(() => toast('Link copiado ✓')); };
  }
}

if (typeof module !== 'undefined') module.exports = { VOUCHER_PADRAO, voucherModelo };

/* Material de viagem: junta, para cada passageiro de um grupo, os PDFs que estão espalhados nas
   subpastas do grupo (E-KT, VOUCHER NY, VOUCHER MIAMI, INGRESSOS, SEGURO...) num PDF só, na ordem
   que o Ademir usa, e grava em MATERIAL DE VIAGENS/<Nome>.pdf.
   Tudo acontece no navegador dele: os arquivos (bilhete, seguro, dados pessoais) não sobem para lugar nenhum.
   A parte de cima (pastas, nomes, ordem) é pura e tem teste; a tela fica embaixo. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MATERIAL = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const semAcento = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const N = (s) => semAcento(s).toUpperCase();

  /* ---------- o que é cada subpasta ---------- */
  const TIPOS = {
    passagem: { nome: 'Passagem', ordem: 1 }, hotel: { nome: 'Hotel', ordem: 2 }, transfer: { nome: 'Transfer', ordem: 3 },
    carro: { nome: 'Carro', ordem: 4 }, ingresso: { nome: 'Ingressos e passeios', ordem: 5 }, outro: { nome: 'Outros', ordem: 6 },
    seguro: { nome: 'Seguro', ordem: 7 }, ignorar: { nome: 'Não entra', ordem: 9 },
  };
  function tipoDaPasta(nome) {
    const t = N(nome);
    if (/COTAC|ORCAMENT|PROPOSTA|FECHAMENTO|PAGAMENTO|RECIBO|PASSAPORTE|DOCUMENTAC|CADASTR/.test(t)) return 'ignorar';
    if (/INGRESS|ENTRADA|PASSEIO|TOUR|EVENTO|CONVITE/.test(t)) return 'ingresso';
    if (/SEGUR|ASSISTENCIA/.test(t)) return 'seguro';
    if (/TRANSFER|TRASLADO/.test(t)) return 'transfer';
    if (/CARRO|LOCAC|ALUGUEL/.test(t)) return 'carro';
    if (/VOUCHER|HOTEL|HOSPED/.test(t)) return 'hotel';
    if (/\bE-?\s?T?KT\b|E-?\s?TICKET|BILHETE|PASSAGE|AEREO|\bVOOS?\b|TRECHO/.test(t)) return 'passagem';
    return 'outro';
  }
  const ehSaida = (nome) => /MATERIA/.test(N(nome));   /* a pasta que o próprio app cria */

  /* ---------- quem é o passageiro de cada arquivo ---------- */
  const LIGA = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'y', 'del', 'di', 'van', 'von', 'la', 'le']);
  const tokens = (s) => semAcento(s).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 1 && !LIGA.has(w));
  const tituloNome = (s) => s.toLowerCase().replace(/(^|[\s'-])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase());

  /* "2) ADRIANE SOUZA.pdf" → ["Adriane Souza"]; "ARTBASEL 2026 - DANIEL BASTOS" → ["Daniel Bastos"];
     "Miami - Pedro Torres e Bianca Lassen" → as duas pessoas */
  function pessoasDoArquivo(arquivo) {
    let b = String(arquivo).replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[_]+/g, ' ').trim();
    b = b.replace(/^\s*\d+\s*[).\-–]\s*/, '').replace(/\s*\(\d+\)\s*$/, '').trim();
    const partes = b.split(/\s+[-–—]\s+/).map(x => x.trim()).filter(Boolean);
    let alvo = partes.length > 1 ? partes[partes.length - 1] : b;
    if (partes.length > 1 && tokens(alvo).length < 2) alvo = partes.slice().reverse().find(p => tokens(p).length >= 2) || alvo;
    const duas = alvo.split(/\s+(?:e|&)\s+/i);
    const lista = duas.length === 2 && duas.every(x => tokens(x).length >= 2) ? duas : [alvo];
    return lista.map(x => x.replace(/\s+/g, ' ').trim()).filter(x => tokens(x).length);
  }

  /* duas grafias do mesmo nome: iguais, ou uma contém a outra (mesmo primeiro nome, 2+ palavras) */
  function mesmaPessoa(a, b) {
    const A = tokens(a), B = tokens(b);
    if (!A.length || !B.length) return false;
    if (A.slice().sort().join(' ') === B.slice().sort().join(' ')) return true;
    if (A[0] !== B[0]) return false;
    const [p, g] = A.length <= B.length ? [A, B] : [B, A];
    return p.length >= 2 && p.every(w => g.includes(w));
  }

  /* entradas: [{ pasta, arquivo, ref }] (pasta = subpasta de 1º nível; '' = solto na pasta do grupo)
     devolve { blocos: [{id, pasta, tipo, n}], pax: [{id, nome, arquivos: {bloco: [ref...]}, duvida}], soltos: [arquivo] } */
  function agrupa(entradas) {
    const blocos = new Map(), pax = [], soltos = [];
    /* as pastas que não entram (cotação, fechamento) vêm por último e não criam passageiro novo */
    entradas = entradas.slice().sort((a, b) => (tipoDaPasta(a.pasta) === 'ignorar') - (tipoDaPasta(b.pasta) === 'ignorar'));
    for (const e of entradas) {
      if (!e.pasta) { soltos.push(e.arquivo); continue; }
      if (ehSaida(e.pasta)) continue;
      if (!blocos.has(e.pasta)) blocos.set(e.pasta, { id: e.pasta, pasta: e.pasta, tipo: tipoDaPasta(e.pasta), n: 0 });
      const bl = blocos.get(e.pasta); bl.n++;
      for (const nome of pessoasDoArquivo(e.arquivo)) {
        const achados = pax.filter(p => p.grafias.some(g => mesmaPessoa(g, nome)));
        let p = achados.length === 1 ? achados[0] : null;
        if (!p && bl.tipo === 'ignorar') continue;
        if (!p) { p = { id: 'p' + (pax.length + 1), grafias: [], arquivos: {}, duvida: achados.length > 1 }; pax.push(p); }
        if (!p.grafias.includes(nome)) p.grafias.push(nome);
        (p.arquivos[bl.id] = p.arquivos[bl.id] || []).push(e.ref);
      }
    }
    for (const p of pax) {
      const maior = p.grafias.slice().sort((a, b) => tokens(b).length - tokens(a).length || b.length - a.length)[0];
      p.nome = /[a-z]/.test(maior) && /[A-Z]/.test(maior) ? maior : tituloNome(maior);
    }
    const lista = [...blocos.values()].sort((a, b) => TIPOS[a.tipo].ordem - TIPOS[b.tipo].ordem || a.pasta.localeCompare(b.pasta, 'pt'));
    pax.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
    return { blocos: lista, pax, soltos };
  }

  /* junta outra linha nesta (quando a mesma pessoa veio com grafias que não bateram) */
  function juntaPax(dados, idFica, idSai) {
    const a = dados.pax.find(p => p.id === idFica), b = dados.pax.find(p => p.id === idSai);
    if (!a || !b || a === b) return;
    for (const [k, v] of Object.entries(b.arquivos)) a.arquivos[k] = (a.arquivos[k] || []).concat(v);
    a.grafias = a.grafias.concat(b.grafias); a.duvida = false;
    dados.pax = dados.pax.filter(p => p !== b);
  }

  const nomeArquivo = (nome) => String(nome).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) + '.pdf';
  const grupoBonito = (pasta) => tituloNome(String(pasta || '').replace(/[_]+/g, ' ')).replace(/\b(\d{2,4})\b/g, '$1');

  /* ======================================================================
     A tela (só no navegador)
     ====================================================================== */
  const CDN = { pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js' };
  const carrega = (url, nome) => new Promise((ok, erro) => {
    if (window[nome]) return ok(window[nome]);
    const s = document.createElement('script'); s.src = url; s.onload = () => ok(window[nome]); s.onerror = () => erro(new Error('Não consegui carregar ' + nome + '. Confira a internet.'));
    document.head.appendChild(s);
  });
  const PREF = 'ademir_material_v1';   /* só preferências: ordem das pastas e a mensagem. Nenhum dado de passageiro. */
  const lePref = () => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch (e) { return {}; } };
  const gravaPref = (p) => { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch (e) { /* sem armazenamento: segue sem lembrar */ } };
  const MSG_PADRAO = 'Olá, {nome}! Segue o seu material de viagem{grupo}: passagem, vouchers e seguro num arquivo só. Qualquer dúvida, estou à disposição. Boa viagem!\n{agencia}';

  /* o estado da tela vive só na memória: fechar a aba esquece os arquivos */
  let S = null;

  async function lePastaHandle(dir) {
    const entradas = [], refs = new Map(), prontos = new Map();
    let n = 0;
    async function anda(h, pasta, nivel) {
      for await (const [nome, x] of h.entries()) {
        if (x.kind === 'directory') {
          if (nivel === 0 && ehSaida(nome)) { for await (const [n2, f] of x.entries()) if (f.kind === 'file' && /\.pdf$/i.test(n2)) prontos.set(n2, f); continue; }
          if (nivel < 3) await anda(x, nivel === 0 ? nome : pasta, nivel + 1);
        } else if (/\.(pdf|jpe?g|png)$/i.test(nome)) {
          const ref = 'r' + (++n); refs.set(ref, { handle: x, nome }); entradas.push({ pasta, arquivo: nome, ref });
        }
      }
    }
    await anda(dir, '', 0);
    return { entradas, refs, prontos };
  }
  function leListaArquivos(files) {
    const entradas = [], refs = new Map(), prontos = new Map();
    let n = 0, grupo = '';
    for (const f of files) {
      const partes = (f.webkitRelativePath || f.name).split('/');
      grupo = grupo || (partes.length > 1 ? partes[0] : '');
      const pasta = partes.length > 2 ? partes[1] : '';
      if (pasta && ehSaida(pasta)) { if (/\.pdf$/i.test(f.name)) prontos.set(f.name, { getFile: async () => f }); continue; }
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) continue;
      const ref = 'r' + (++n); refs.set(ref, { file: f, nome: f.name }); entradas.push({ pasta, arquivo: f.name, ref });
    }
    return { entradas, refs, prontos, grupo };
  }
  const arquivoDe = async (r) => r.file || r.handle.getFile();

  function montaEstado(lido, grupo, dir) {
    const dados = agrupa(lido.entradas);
    const pref = lePref(), daqui = (pref.grupos || {})[grupo] || {};
    /* ordem e quais pastas entram: a que ele deixou da última vez neste grupo, senão a do vídeo */
    if (daqui.ordem) dados.blocos.sort((a, b) => { const ia = daqui.ordem.indexOf(a.id), ib = daqui.ordem.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    for (const b of dados.blocos) b.entra = daqui.fora ? !daqui.fora.includes(b.id) : b.tipo !== 'ignorar';
    for (const p of dados.pax) {
      p.marcado = true;
      const pronto = lido.prontos.get(nomeArquivo(p.nome)) || [...lido.prontos.entries()].find(([k]) => mesmaPessoa(k.replace(/\.pdf$/i, ''), p.nome))?.[1];
      p.pronto = pronto ? { handle: pronto, paginas: null, antigo: true } : null;
    }
    return { dados, refs: lido.refs, grupo, dir, podeGravar: !!(dir && dir.getDirectoryHandle), soltos: dados.soltos, gerando: false };
  }
  function guardaOrdem() {
    const pref = lePref(); pref.grupos = pref.grupos || {};
    pref.grupos[S.grupo] = { ordem: S.dados.blocos.map(b => b.id), fora: S.dados.blocos.filter(b => !b.entra).map(b => b.id) };
    gravaPref(pref);
  }

  function tela(palco, ctx) {
    const { esc, aviso, agencia, icoZap } = ctx;
    const temPasta = 'showDirectoryPicker' in window;

    function pinta() {
      if (!S) {
        palco.innerHTML = `<div class="mat">
          <section class="mat-entrada">
            <h1>Material de viagem</h1>
            <p class="sub">Abra a pasta do grupo (a que tem E-KT, VOUCHER, INGRESSOS, SEGURO…). Eu junto os PDFs de cada passageiro num arquivo só, na ordem certa, gravo em <b>MATERIAL DE VIAGENS</b> e deixo o WhatsApp pronto ao lado de cada nome.</p>
            <div class="mat-solta" id="mat-solta" tabindex="0">
              <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 14a3 3 0 0 1 3-3h10l4 4h16a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>
              <b>Solte aqui a pasta do grupo</b><span>ou</span>
              <button class="btn primario" id="mat-abre">Escolher a pasta do grupo</button>
              <input type="file" id="mat-input" webkitdirectory multiple hidden>
            </div>
            <p class="nota">${temPasta ? 'O navegador vai pedir licença para ler e gravar nesta pasta: é para eu criar a MATERIAL DE VIAGENS lá dentro.' : 'Neste navegador eu leio a pasta, mas não consigo gravar nela: o material sai num arquivo .zip. No Edge ou no Chrome eu gravo direto na pasta.'} Os arquivos não saem do seu computador.</p>
          </section></div>`;
        ligaEntrada(); return;
      }
      const d = S.dados, entram = d.blocos.filter(b => b.entra);
      const marcados = d.pax.filter(p => p.marcado);
      const faltaDe = (p) => entram.filter(b => !(p.arquivos[b.id] || []).length);
      const prontos = d.pax.filter(p => p.pronto).length;
      palco.innerHTML = `<div class="mat">
        <header class="mat-cab"><div><p class="mat-eti">Material de viagem</p><h1>${esc(grupoBonito(S.grupo) || 'Grupo')}</h1>
          <p class="sub">${d.pax.length} passageiro${d.pax.length === 1 ? '' : 's'} · ${d.blocos.length} pasta${d.blocos.length === 1 ? '' : 's'}${prontos ? ` · ${prontos} ${prontos === 1 ? 'material pronto' : 'materiais prontos'}` : ''}</p></div>
          <button class="btn fantasma" id="mat-outra">Abrir outra pasta</button></header>

        <section class="cartao mat-ordem"><h2>A ordem do material</h2>
          <p class="sub">É a ordem das páginas no PDF de cada pessoa. Desmarque o que não vai para o cliente.</p>
          <ol class="mat-blocos">${d.blocos.map((b, i) => `<li class="${b.entra ? '' : 'fora'}">
            <label class="marca"><input type="checkbox" data-entra="${i}"${b.entra ? ' checked' : ''}> <b>${esc(b.pasta)}</b></label>
            <span class="mat-tipo t-${b.tipo}">${esc(TIPOS[b.tipo].nome)}</span><span class="mat-n">${b.n} arquivo${b.n === 1 ? '' : 's'}</span>
            <span class="mat-mexe"><button class="chip" data-sobe="${i}" aria-label="Subir ${esc(b.pasta)}"${i ? '' : ' disabled'}>↑</button><button class="chip" data-desce="${i}" aria-label="Descer ${esc(b.pasta)}"${i < d.blocos.length - 1 ? '' : ' disabled'}>↓</button></span></li>`).join('')}</ol>
          ${S.soltos.length ? `<p class="nota">Soltos na pasta do grupo, fora das subpastas (não entram): ${S.soltos.map(esc).join(' · ')}</p>` : ''}
        </section>

        <section class="cartao mat-pax"><div class="mat-pax-cab"><h2>Passageiros</h2>
          <label class="marca"><input type="checkbox" id="mat-todos"${marcados.length === d.pax.length ? ' checked' : ''}> todos</label></div>
          <div class="mat-tabela" role="table" aria-label="Passageiros e arquivos" style="--cols:${entram.length}">
            <div class="mat-linha mat-titulos" role="row"><span role="columnheader">Nome</span>${entram.map(b => `<span role="columnheader" class="mat-col">${esc(b.pasta)}</span>`).join('')}<span role="columnheader">Material</span></div>
            ${d.pax.map(p => { const f = faltaDe(p); return `<div class="mat-linha${p.marcado ? '' : ' desl'}" role="row">
              <span role="cell" class="mat-nome"><label class="marca"><input type="checkbox" data-marca="${p.id}"${p.marcado ? ' checked' : ''}> <b>${esc(p.nome)}</b></label>
                ${p.duvida ? '<em class="mat-duvida">nome parecido com outro: confira</em>' : ''}
                ${f.length ? `<select class="mat-junta" data-junta="${p.id}" aria-label="Juntar ${esc(p.nome)} com outra linha"><option value="">É a mesma pessoa que…</option>${d.pax.filter(o => o !== p).map(o => `<option value="${o.id}">${esc(o.nome)}</option>`).join('')}</select>` : ''}</span>
              ${entram.map(b => { const q = (p.arquivos[b.id] || []).length; return `<span role="cell" class="mat-col ${q ? 'tem' : 'falta'}" title="${esc(b.pasta)}">${q ? '✓' + (q > 1 ? ' ' + q : '') : 'falta'}</span>`; }).join('')}
              <span role="cell" class="mat-acoes">${p.erro ? `<em class="mat-erro">${esc(p.erro)}</em>` : ''}${p.pronto ? `<span class="mat-ok">${p.pronto.paginas ? p.pronto.paginas + ' pág.' : 'pronto'}</span>
                <button class="btn fantasma mat-abrir" data-abrir="${p.id}">Abrir</button><button class="btn mat-zap" data-zap="${p.id}">${icoZap}WhatsApp</button>` : p.gerando ? '<span class="mat-ok">juntando…</span>' : ''}</span>
            </div>`; }).join('')}
          </div>
          <div class="mat-gera"><button class="btn primario" id="mat-gera"${!marcados.length || !entram.length || S.gerando ? ' disabled' : ''}>${S.gerando ? 'Juntando…' : `Gerar o material de ${marcados.length} passageiro${marcados.length === 1 ? '' : 's'}`}</button>
            <span class="nota">${S.podeGravar ? 'Grava em ' + esc(S.grupo) + ' / MATERIAL DE VIAGENS. Se já existir, troca pelo novo.' : 'Sai um .zip com um PDF por passageiro.'}</span></div>
        </section>

        <details class="cartao mat-msg"><summary>Mensagem que vai junto no WhatsApp</summary>
          <textarea id="mat-texto" rows="4">${esc(lePref().msg || MSG_PADRAO)}</textarea>
          <p class="nota"><b>{nome}</b> vira o primeiro nome do passageiro, <b>{grupo}</b> o nome do grupo e <b>{agencia}</b> ${esc(agencia)}.</p></details>
      </div>`;
      ligaLista();
    }

    function ligaEntrada() {
      const inp = palco.querySelector('#mat-input'), zona = palco.querySelector('#mat-solta');
      palco.querySelector('#mat-abre').onclick = async () => {
        if (!temPasta) return inp.click();
        try { const dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'material-grupo' }); await abre(dir); }
        catch (e) { if (e.name !== 'AbortError') aviso('Não consegui abrir a pasta: ' + e.message); }
      };
      inp.onchange = async () => { if (!inp.files.length) return; const l = leListaArquivos([...inp.files]); S = montaEstado(l, l.grupo, null); pinta(); };
      zona.ondragover = (e) => { e.preventDefault(); zona.classList.add('em-cima'); };
      zona.ondragleave = () => zona.classList.remove('em-cima');
      zona.ondrop = async (e) => {
        e.preventDefault(); zona.classList.remove('em-cima');
        const it = [...e.dataTransfer.items].find(x => x.kind === 'file');
        if (!it) return;
        if (it.getAsFileSystemHandle) {
          const h = await it.getAsFileSystemHandle();
          if (h && h.kind === 'directory') { try { if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') aviso('Sem licença para gravar: o material vai sair num .zip.'); } catch (x) { /* segue só lendo */ } return abre(h); }
        }
        aviso('Solte a pasta do grupo inteira (não os arquivos), ou use o botão.');
      };
    }
    async function abre(dir) {
      aviso('Lendo a pasta ' + dir.name + '…');
      const l = await lePastaHandle(dir);
      let grava = false;
      try { grava = (await dir.queryPermission({ mode: 'readwrite' })) === 'granted'; } catch (e) { grava = false; }
      S = montaEstado(l, dir.name, grava ? dir : null);
      if (!l.entradas.length) aviso('Não achei PDF nas subpastas desta pasta. É a pasta do grupo?');
      pinta();
    }

    function ligaLista() {
      const d = S.dados, q = (s) => palco.querySelectorAll(s);
      palco.querySelector('#mat-outra').onclick = () => { S = null; pinta(); };
      q('[data-entra]').forEach(c => c.onchange = () => { d.blocos[+c.dataset.entra].entra = c.checked; guardaOrdem(); pinta(); });
      const move = (i, j) => { const b = d.blocos; [b[i], b[j]] = [b[j], b[i]]; guardaOrdem(); pinta(); };
      q('[data-sobe]').forEach(b => b.onclick = () => move(+b.dataset.sobe, +b.dataset.sobe - 1));
      q('[data-desce]').forEach(b => b.onclick = () => move(+b.dataset.desce, +b.dataset.desce + 1));
      q('[data-marca]').forEach(c => c.onchange = () => { d.pax.find(p => p.id === c.dataset.marca).marcado = c.checked; pinta(); });
      palco.querySelector('#mat-todos').onchange = (e) => { d.pax.forEach(p => { p.marcado = e.target.checked; }); pinta(); };
      q('[data-junta]').forEach(s => s.onchange = () => { if (!s.value) return; juntaPax(d, s.dataset.junta, s.value); pinta(); aviso('Juntei as duas linhas.'); });
      palco.querySelector('#mat-gera').onclick = gera;
      q('[data-abrir]').forEach(b => b.onclick = async () => { const f = await arquivoPronto(d.pax.find(p => p.id === b.dataset.abrir)); window.open(URL.createObjectURL(f), '_blank', 'noopener'); });
      q('[data-zap]').forEach(b => b.onclick = () => manda(d.pax.find(p => p.id === b.dataset.zap)));
      const t = palco.querySelector('#mat-texto');
      t.oninput = () => { const p = lePref(); p.msg = t.value; gravaPref(p); };
    }

    async function arquivoPronto(p) {
      const x = p.pronto; if (x.blob) return new File([x.blob], nomeArquivo(p.nome), { type: 'application/pdf' });
      const f = await x.handle.getFile(); return new File([f], f.name, { type: 'application/pdf' });
    }
    function mensagem(p) {
      const primeiro = p.nome.split(/\s+/)[0];
      return (lePref().msg || MSG_PADRAO).replace(/\{nome\}/g, primeiro).replace(/\{grupo\}/g, S.grupo ? ' – ' + grupoBonito(S.grupo) : '').replace(/\{agencia\}/g, agencia).trim();
    }
    /* WhatsApp: o link wa.me não leva arquivo. No Windows a janela de compartilhar leva o PDF até o WhatsApp Desktop;
       sem ela, baixo o PDF e abro o WhatsApp com a mensagem para ele arrastar o arquivo. */
    async function manda(p) {
      const f = await arquivoPronto(p), txt = mensagem(p);
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        try { await navigator.share({ files: [f], title: f.name, text: txt }); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click();
      try { await navigator.clipboard.writeText(txt); } catch (e) { /* sem área de transferência: a mensagem vai no link */ }
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      aviso('Baixei ' + f.name + '. No WhatsApp, escolha a conversa e arraste o arquivo.');
    }

    async function gera() {
      const d = S.dados, entram = d.blocos.filter(b => b.entra), alvo = d.pax.filter(p => p.marcado);
      let PDFLib;
      try { PDFLib = await carrega(CDN.pdf, 'PDFLib'); } catch (e) { return aviso(e.message); }
      let saida = null;
      if (S.podeGravar) {
        try { saida = await S.dir.getDirectoryHandle('MATERIAL DE VIAGENS', { create: true }); }
        catch (e) { S.podeGravar = false; aviso('Não consegui criar a pasta: o material vai sair num .zip.'); }
      }
      S.gerando = true; alvo.forEach(p => { p.gerando = true; p.erro = ''; }); pinta();
      const zip = [];
      let ok = 0;
      for (const p of alvo) {
        try {
          const doc = await PDFLib.PDFDocument.create();
          for (const b of entram) {
            for (const ref of (p.arquivos[b.id] || [])) {
              const r = S.refs.get(ref), f = await arquivoDe(r), bytes = await f.arrayBuffer();
              if (/\.pdf$/i.test(r.nome)) {
                let src;
                try { src = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true }); }
                catch (e) { throw new Error('não abriu ' + r.nome); }
                const pags = await doc.copyPages(src, src.getPageIndices()); pags.forEach(x => doc.addPage(x));
              } else {
                const img = /\.png$/i.test(r.nome) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
                const w = 595.28, h = Math.min(841.89, w * img.height / img.width), pg = doc.addPage([w, Math.max(h, 200)]);
                const esc2 = Math.min(w / img.width, h / img.height); pg.drawImage(img, { x: (w - img.width * esc2) / 2, y: 0, width: img.width * esc2, height: img.height * esc2 });
              }
            }
          }
          if (!doc.getPageCount()) throw new Error('nenhum arquivo nas pastas marcadas');
          doc.setTitle('Material de viagem – ' + p.nome); doc.setAuthor(agencia);
          const out = await doc.save(), blob = new Blob([out], { type: 'application/pdf' });
          if (saida) { const fh = await saida.getFileHandle(nomeArquivo(p.nome), { create: true }), w = await fh.createWritable(); await w.write(blob); await w.close(); }
          else zip.push([nomeArquivo(p.nome), out]);
          p.pronto = { blob, paginas: doc.getPageCount() }; ok++;
        } catch (e) { p.erro = e.message; }
        p.gerando = false;
      }
      if (zip.length) {
        try {
          const JSZip = await carrega(CDN.zip, 'JSZip'), z = new JSZip(), pasta = z.folder('MATERIAL DE VIAGENS');
          zip.forEach(([n, b]) => pasta.file(n, b));
          const blob = await z.generateAsync({ type: 'blob' }), a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'MATERIAL DE VIAGENS - ' + (S.grupo || 'grupo') + '.zip'; a.click();
        } catch (e) { aviso('Os PDFs estão prontos, mas o .zip falhou: use Abrir em cada um.'); }
      }
      S.gerando = false; pinta();
      const erros = alvo.length - ok;
      aviso(ok + (ok === 1 ? ' material pronto' : ' materiais prontos') + (saida ? ' em MATERIAL DE VIAGENS' : '') + (erros ? '. ' + erros + ' com problema: veja na lista.' : '.'));
    }

    if (ctx.pastaTeste) abre(ctx.pastaTeste); else pinta();
  }

  /* só para teste no navegador: carregar arquivos sem a janela de pastas */
  function testeCarrega(palco, ctx, grupo, entradasComArquivo) {
    const refs = new Map(), entradas = [];
    entradasComArquivo.forEach((e, i) => { const ref = 'r' + (i + 1); refs.set(ref, { file: e.file, nome: e.arquivo }); entradas.push({ pasta: e.pasta, arquivo: e.arquivo, ref }); });
    S = montaEstado({ entradas, refs, prontos: new Map() }, grupo, null);
    tela(palco, ctx);
  }

  return { tipoDaPasta, pessoasDoArquivo, mesmaPessoa, agrupa, juntaPax, nomeArquivo, grupoBonito, TIPOS, tela, testeCarrega };
});

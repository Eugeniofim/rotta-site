/* O que os dois sites usam igual: busca, frete e cupom de exemplo, conta, cookies, compartilhar e ícones.
   Na versão de verdade, frete, cupom e conta vêm da Nuvemshop e do banco. */
(function () {
  function sem(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function principal(p) { return sem([p.nome, p.familia, p.saida, p.coracao, p.base, p.notas, p.medida].filter(Boolean).join(' ')); }

  function buscar(lista, consulta) {
    var t = sem(consulta).trim();
    if (!t) return [];
    var partes = t.split(/\s+/);
    return lista.map(function (p) {
      var nome = sem(p.nome), base = principal(p), extra = sem(p.historia), pts = 0;
      if (partes.every(function (x) { return base.indexOf(x) >= 0; })) pts = 30;
      else if (partes.every(function (x) { return (base + ' ' + extra).indexOf(x) >= 0; })) pts = 5;
      else return null;
      if (nome.indexOf(t) === 0) pts += 100; else if (nome.indexOf(t) >= 0) pts += 60;
      if (p.status === 'disponivel') pts += 10;
      return { p: p, pts: pts };
    }).filter(Boolean).sort(function (a, b) { return b.pts - a.pts; }).map(function (x) { return x.p; });
  }

  var NOTAS = ['Baunilha', 'Âmbar', 'Rosa', 'Jasmim', 'Sândalo', 'Café', 'Cacau', 'Couro', 'Oud', 'Patchouli', 'Vetiver', 'Coco', 'Pêssego', 'Lírio', 'Magnólia', 'Maçã', 'Mirra', 'Olíbano', 'Caramelo', 'Almíscar', 'Bergamota', 'Cedro', 'Flor de laranjeira', 'Marinho', 'Tuberosa', 'Ylang'];
  function notas(lista, n) {
    return NOTAS.map(function (x) { return [x, buscar(lista, x).length]; })
      .filter(function (x) { return x[1] >= 2; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, n || 8).map(function (x) { return x[0]; });
  }

  function frete(cep) {
    if (String(cep || '').replace(/\D/g, '').length !== 8) return null;
    return [{ id: 'pac', nome: 'PAC', valor: 30.32 }, { id: 'sedex', nome: 'SEDEX', valor: 50.81 }];
  }

  var CUPONS = { paula: { ELENCO10: 10 }, fada: { CARDUME10: 10 } };
  function cupom(marca, codigo) {
    var c = String(codigo || '').trim().toUpperCase(), pct = (CUPONS[marca] || {})[c];
    return pct ? { codigo: c, pct: pct } : null;
  }

  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  function conta(marca) { try { return JSON.parse(ler('pp_conta_' + marca) || 'null'); } catch (e) { return null; } }
  function entrar(marca, dados) { gravar('pp_conta_' + marca, JSON.stringify(dados)); }
  function sair(marca) { gravar('pp_conta_' + marca, null); }

  function redes(url, texto, imagem) {
    var u = encodeURIComponent(url), t = encodeURIComponent(texto), m = encodeURIComponent(imagem || '');
    return [
      { n: 'WhatsApp', u: 'https://wa.me/?text=' + t + '%20' + u },
      { n: 'Facebook', u: 'https://www.facebook.com/sharer/sharer.php?u=' + u },
      { n: 'Pinterest', u: 'https://pinterest.com/pin/create/button/?url=' + u + '&media=' + m + '&description=' + t },
      { n: 'X', u: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u }
    ];
  }

  function mascaraTel(i) {
    var d = i.value.replace(/\D/g, '').slice(0, 11), s = d;
    if (d.length > 2) s = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) s = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    i.value = s;
  }
  function mascaraCep(i) {
    var d = i.value.replace(/\D/g, '').slice(0, 8);
    i.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  }

  function tocaVideo(botao, id, titulo) {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    f.title = titulo;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    f.className = botao.className;
    botao.replaceWith(f);
  }

  function mostraCookies(aceitou) {
    if (ler('pp_cookies')) return;
    setTimeout(function () {
      if (ler('pp_cookies') || document.querySelector('.cookies')) return;
      var d = document.createElement('div');
      d.className = 'cookies';
      d.setAttribute('role', 'region');
      d.setAttribute('aria-label', 'Aviso de cookies');
      d.innerHTML = '<p>Usamos cookies para a sacola funcionar. Com a sua permissão, também para entender o que as pessoas mais procuram.</p><div><button data-v="necessarios">Só os necessários</button><button data-v="todos">Aceitar</button></div>';
      d.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        gravar('pp_cookies', b.dataset.v);
        d.remove();
        if (aceitou) aceitou(b.dataset.v);
      });
      document.body.append(d);
    }, 2600);
  }

  var L = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
  var ICONES = {
    inicio: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    sacola: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    conta: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    filme: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"/>',
    ondas: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    mais: '<path d="M5 12h14M12 5v14"/>',
    membro: '<path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>',
    play: '<path d="M6 3v18l15-9Z" fill="currentColor"/>',
    somon: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    somoff: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="m22 9-6 6M16 9l6 6"/>'
  };
  var WHATS = '<svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
  function ico(n) {
    if (n === 'whats') return WHATS;
    return '<svg viewBox="0 0 24 24" ' + L + ' aria-hidden="true">' + (ICONES[n] || '') + '</svg>';
  }
  function hidrataIcones(raiz) {
    (raiz || document).querySelectorAll('[data-ico]').forEach(function (e) { e.innerHTML = ico(e.dataset.ico); });
  }

  window.Rec = {
    buscar: buscar, notas: notas, frete: frete, cupom: cupom,
    conta: conta, entrar: entrar, sair: sair, redes: redes,
    mascaraTel: mascaraTel, mascaraCep: mascaraCep, tocaVideo: tocaVideo,
    mostraCookies: mostraCookies, ico: ico, hidrataIcones: hidrataIcones
  };
})();

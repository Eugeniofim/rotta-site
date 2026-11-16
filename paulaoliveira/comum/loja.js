/* Loja de demonstração: tudo mora neste aparelho (localStorage).
   Site e painel conversam pelo mesmo cofrinho, então o que muda no painel
   aparece no site na hora, mesmo em outra aba.
   Na versão de verdade, este arquivo vira as chamadas ao banco. */
(function () {
  var CHAVE = 'pp_demo_v2';
  var MARCAS = { paula: 'CAT_PAULA', fada: 'CAT_FADA' };

  function proximoDia(diaSemana, hora) {
    var d = new Date();
    var soma = (diaSemana - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + soma);
    d.setHours(hora, 0, 0, 0);
    return d.toISOString();
  }

  /* Números pseudoaleatórios fixos: o exemplo fica igual em toda abertura. */
  function sorteio(semente) {
    var s = semente;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  var NOMES = ['Marina Lacerda', 'Bruna Tavares', 'Camila Duarte', 'Helena Prado', 'Juliana Rocha', 'Renata Moura', 'Fernanda Alves', 'Isabela Nunes', 'Larissa Pires', 'Patrícia Melo', 'Gabriela Sá', 'Aline Teixeira', 'Tatiana Viana', 'Letícia Campos', 'Vanessa Lima', 'Carolina Reis', 'Mariana Fontes', 'Rafael Antunes', 'Thiago Barros', 'Daniel Couto', 'Bianca Serra', 'Priscila Goes', 'Natália Brandt', 'Luana Peixoto', 'Sofia Andrade', 'Clara Monteiro', 'Beatriz Lobo', 'Amanda Ribas', 'Eduardo Faria', 'Lívia Castro', 'Paola Mendes', 'Roberta Dias'];
  var CIDADES = ['Curitiba/PR', 'São Paulo/SP', 'Florianópolis/SC', 'Rio de Janeiro/RJ', 'Belo Horizonte/MG', 'Porto Alegre/RS', 'Paranaguá/PR', 'Salvador/BA', 'Brasília/DF', 'Campinas/SP'];
  var FAMILIAS = ['Floral branco', 'Gourmand', 'Amadeirado', 'Cítrico fresco', 'Frutal', 'Marinho'];

  function semear() {
    var cat = { paula: window.CAT_PAULA || [], fada: window.CAT_FADA || [] };
    var r = sorteio(20261108);
    var clientes = [];
    NOMES.forEach(function (nome, i) {
      var marca = i % 5 === 4 ? 'ambas' : (i % 2 ? 'fada' : 'paula');
      var lista = marca === 'fada' ? cat.fada : marca === 'paula' ? cat.paula : cat.paula.concat(cat.fada);
      var perfumes = lista.filter(function (p) { return p.tipo === 'perfume'; });
      var pedidos = [];
      var n = Math.floor(Math.pow(r(), 2.2) * 9) + 1;
      for (var k = 0; k < n; k++) {
        var p = perfumes[Math.floor(r() * perfumes.length)];
        if (!p) continue;
        var dias = Math.floor(r() * (i % 7 === 6 ? 420 : 240)) + (i % 7 === 6 ? 180 : 2);
        var em = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
        pedidos.push({ produto: p.id, nome: p.nome, valor: p.preco, em: em, marca: cat.paula.indexOf(p) >= 0 ? 'paula' : 'fada' });
      }
      pedidos.sort(function (a, b) { return a.em < b.em ? 1 : -1; });
      var d = new Date(1975 + Math.floor(r() * 30), Math.floor(r() * 12), 1 + Math.floor(r() * 28));
      clientes.push({
        id: 'c' + i, nome: nome, marca: marca,
        wa: '(41) 9' + (8000 + Math.floor(r() * 1999)) + '-' + (1000 + Math.floor(r() * 8999)),
        email: nome.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').split(' ').join('.') + '@exemplo.com',
        cidade: CIDADES[Math.floor(r() * CIDADES.length)],
        familia: FAMILIAS[Math.floor(r() * FAMILIAS.length)],
        nascimento: d.toISOString().slice(0, 10),
        app: r() > 0.42, pedidos: pedidos, nota: ''
      });
    });
    var espera = [];
    var filas = { paula: { carmem: 84, gigi: 61, eva50: 47, olibano: 22, felina: 73, magnolia: 39, afrodite: 58 }, fada: { sereialua: 112, coffee: 76, menina: 53, sirena: 49, flora: 31, tiare: 26 } };
    return {
      versao: 2, mudancas: {}, novos: { paula: [], fada: [] }, espera: espera, filas: filas,
      sacola: { paula: [], fada: [] }, clientes: clientes, mural: [],
      lancamentos: [
        { id: 'l1', marca: 'paula', produto: 'eva50', nome: 'Eva · 50 ml', quando: proximoDia(6, 20), lote: 60, exemplo: true },
        { id: 'l2', marca: 'fada', produto: 'sereialua', nome: 'Sereia da Lua · 50 ml', quando: proximoDia(5, 19), lote: 80, exemplo: true }
      ],
      avisos: [
        { id: 'a1', marca: 'paula', titulo: 'Lord chega sábado, às 8.', corpo: 'Fique pronta.', canais: ['app', 'whats'], publico: 'Lista do Lord', em: new Date(Date.now() - 6 * 864e5).toISOString(), alcance: 212 }
      ],
      automacoes: { boasvindas: true, fila: true, vespera: true, abriu: true, carrinho: true, pago: true, postado: true, pele: true, recompra: true, aniversario: true, saudade: false }
    };
  }

  function ler() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (bruto) { var o = JSON.parse(bruto); if (o && o.versao === 2) return o; }
    } catch (e) { /* aparelho sem armazenamento: segue com o exemplo */ }
    var novo = semear();
    gravar(novo);
    return novo;
  }
  var memoria = null;
  function gravar(o) {
    memoria = o;
    try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) { /* cheio: mantém em memória */ }
  }
  function estado() { return memoria || (memoria = ler()); }
  function mexe(fn) { var s = estado(); fn(s); gravar(s); avisa(); return s; }
  var ouvintes = [];
  function avisa() { ouvintes.forEach(function (f) { f(); }); }
  window.addEventListener('storage', function (e) {
    if (e.key === CHAVE) { memoria = null; avisa(); }
  });

  function normaliza(p) {
    var st = p.status;
    if (st === 'cartaz' || st === 'atona') st = 'disponivel';
    if (st === 'mare') st = 'esgotado';
    return Object.assign({}, p, { status: st });
  }

  function produtos(marca) {
    var s = estado();
    var base = (window[MARCAS[marca]] || []).map(normaliza);
    var muda = s.mudancas[marca] || {};
    var lista = base.map(function (p) { return Object.assign({}, p, muda[p.id] || {}); });
    var novos = (s.novos[marca] || []).map(normaliza);
    lista = novos.concat(lista).filter(function (p) { return !p.oculto; });
    s.lancamentos.forEach(function (l) {
      if (l.marca !== marca) return;
      var p = lista.filter(function (x) { return x.id === l.produto; })[0];
      if (p && p.status !== 'disponivel') { p.status = 'estreia'; p.estreia = l.quando; p.exemplo = l.exemplo; p.lote = l.lote; }
    });
    lista.forEach(function (p) { p.fila = (s.filas[marca] || {})[p.id] || 0; });
    return lista;
  }
  function produto(marca, id) { return produtos(marca).filter(function (p) { return p.id === id; })[0]; }

  window.Loja = {
    estado: estado, mexe: mexe, produtos: produtos, produto: produto,
    aoMudar: function (f) { ouvintes.push(f); },
    apagarTudo: function () { try { localStorage.removeItem(CHAVE); } catch (e) {} memoria = null; avisa(); },
    alterar: function (marca, id, campos) {
      return mexe(function (s) {
        var novo = (s.novos[marca] || []).filter(function (p) { return p.id === id; })[0];
        if (novo) { Object.assign(novo, campos); return; }
        s.mudancas[marca] = s.mudancas[marca] || {};
        s.mudancas[marca][id] = Object.assign(s.mudancas[marca][id] || {}, campos);
      });
    },
    criar: function (marca, p) { return mexe(function (s) { s.novos[marca].unshift(p); }); },
    entrarNaFila: function (marca, id, dados) {
      var posicao = 0;
      mexe(function (s) {
        s.filas[marca] = s.filas[marca] || {};
        s.filas[marca][id] = (s.filas[marca][id] || 0) + 1;
        posicao = s.filas[marca][id];
        s.espera.unshift(Object.assign({ marca: marca, produto: id, em: new Date().toISOString() }, dados));
      });
      return posicao;
    },
    sacola: function (marca) { return estado().sacola[marca] || []; },
    colocar: function (marca, id) {
      mexe(function (s) {
        var item = s.sacola[marca].filter(function (i) { return i.id === id; })[0];
        if (item) item.qtd++; else s.sacola[marca].push({ id: id, qtd: 1 });
      });
    },
    quantidade: function (marca, id, qtd) {
      mexe(function (s) {
        var item = s.sacola[marca].filter(function (i) { return i.id === id; })[0];
        if (!item) return;
        if (qtd < 1) s.sacola[marca] = s.sacola[marca].filter(function (i) { return i.id !== id; });
        else item.qtd = qtd;
      });
    },
    tirar: function (marca, id) {
      mexe(function (s) { s.sacola[marca] = s.sacola[marca].filter(function (i) { return i.id !== id; }); });
    },
    dinheiro: function (n) {
      return 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 });
    },
    parcela: function (n, x) {
      return x + 'x de R$ ' + (n / x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' sem juros';
    }
  };
})();

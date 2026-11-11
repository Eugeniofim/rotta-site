/* Clube Glikilovers — protótipo.
   Tudo fica no navegador (localStorage), então o clube e o painel conversam
   quando abertos no MESMO aparelho. Na versão de verdade isso vira um banco
   (Supabase) e o aviso chega em todos os celulares. */
(function () {
  const CHAVE = "glk_demo_v3";
  const CHAVE_EU = "glk_eu";

  const CANAIS = {
    maquina: "Máquina · Jockey Plaza",
    "loja-cwb": "Gliki Curitiba",
    "loja-pgua": "Gliki Paranaguá",
    delivery: "Delivery",
    caioba: "Caiobá"
  };
  const CIDADES = ["Curitiba", "Paranaguá", "Caiobá"];

  /* A nota só vale se for destes CNPJs. Falta saber se Caiobá tem CNPJ próprio. */
  const CNPJS = {
    "58476355000131": { canal: "loja-cwb", cidade: "Curitiba" },
    "42656312000106": { canal: "loja-pgua", cidade: "Paranaguá" }
  };
  /* Onde o prêmio é retirado: é o motivo de a pessoa ir até a loja. */
  const LOJAS = [
    { id: "loja-cwb", nome: "Curitiba", end: "R. Hildebrando de Araújo, 1035 · Jardim Botânico", mapa: "R. Hildebrando de Araújo, 1035, Jardim Botânico, Curitiba - PR" },
    { id: "loja-pgua", nome: "Paranaguá", end: "R. Manoel Corrêa, 622 · Costeira", mapa: "R. Manoel Corrêa, 622, Costeira, Paranaguá - PR" }
  ];

  const REGRAS_PADRAO = {
    pontosPorNota: 10,
    notasPorDia: 3,
    notaMeses: 1,
    pontosPorCookie: 10,
    validadeMeses: 3,
    bonusCadastro: 10,
    bonusIndicacao: 20,
    presenteAniversario: "1 cookie tradicional na semana do aniversário"
  };
  const PREMIOS_PADRAO = [
    { id: "bronze", faixa: "Bronze", pontos: 100, nome: "Cookie Tradicional" },
    { id: "prata", faixa: "Prata", pontos: 300, nome: "Cookie recheado à escolha" },
    { id: "ouro", faixa: "Ouro", pontos: 600, nome: "Potinho + cookie" },
    { id: "master", faixa: "Master", pontos: 1000, nome: "Caixa com 6 cookies" }
  ];

  const DIA = 86400000;
  const agora = () => Date.now();

  /* ---------- utilidades ---------- */
  const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function codigoNovo(tam = 6, rnd = Math.random) {
    let s = "";
    for (let i = 0; i < tam; i++) s += LETRAS[Math.floor(rnd() * LETRAS.length)];
    return s;
  }
  const limpaCodigo = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mostraCodigo = (c) => (c.length === 6 ? c.slice(0, 3) + "-" + c.slice(3) : c);
  const soDigitos = (w) => String(w || "").replace(/\D/g, "");
  const dataBR = (t) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const dataHoraBR = (t) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  /* DDD + 8 últimos: o WhatsApp às vezes grava o celular sem o 9. */
  function chaveFone(w) {
    let x = soDigitos(w);
    if (x.length > 11 && x.startsWith("55")) x = x.slice(2);
    return x.length >= 10 ? x.slice(0, 2) + x.slice(-8) : "";
  }
  function mascaraFone(w) {
    const x = soDigitos(w).slice(0, 11);
    if (x.length <= 2) return x ? "(" + x : "";
    const meio = x.length === 11 ? 7 : 6;
    return `(${x.slice(0, 2)}) ${x.slice(2, meio)}${x.length > meio ? "-" + x.slice(meio) : ""}`;
  }

  /* ---------- nota fiscal ----------
     A chave de 44 números já diz, sem consultar ninguém: estado, ano/mês, CNPJ de quem emitiu,
     modelo, número e o dígito verificador. O QR da nota traz essa chave dentro do link da SEFAZ. */
  function dvChave(c43) {
    let peso = 2, soma = 0;
    for (let i = 42; i >= 0; i--) { soma += Number(c43[i]) * peso; peso = peso === 9 ? 2 : peso + 1; }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  }
  function achaChave(texto) {
    const t = String(texto || "");
    const m = t.match(/(?:^|\D)(\d{44})(?:\D|$)/);
    if (m) return m[1];
    const so = soDigitos(t);
    return so.length === 44 ? so : null;
  }
  function analisarNota(texto) {
    const c = achaChave(texto);
    if (!c) return null;
    return {
      chave: c, valida: dvChave(c.slice(0, 43)) === Number(c[43]),
      ano: 2000 + Number(c.slice(2, 4)), mes: Number(c.slice(4, 6)),
      cnpj: c.slice(6, 20), modelo: c.slice(20, 22), numero: String(Number(c.slice(25, 34)))
    };
  }
  function montaChave(cnpj, quando, rnd = Math.random) {
    const t = new Date(quando);
    const aamm = String(t.getFullYear()).slice(2) + String(t.getMonth() + 1).padStart(2, "0");
    const num = String(Math.floor(1000 + rnd() * 90000)).padStart(9, "0");
    const cod = String(Math.floor(rnd() * 99999999)).padStart(8, "0");
    const c43 = "41" + aamm + cnpj + "65" + "001" + num + "1" + cod;
    return c43 + dvChave(c43);
  }

  function semente(n) {
    return function () {
      n = (n * 1664525 + 1013904223) % 4294967296;
      return n / 4294967296;
    };
  }

  /* ---------- exemplo: um clube que já está rodando há um mês ---------- */
  function exemplo() {
    const rnd = semente(20261108);
    const nomes = ["Ana Clara M.", "Bruna S.", "Camila R.", "Diego F.", "Eduarda L.", "Felipe A.", "Gabriela P.", "Helena C.",
      "Isabela T.", "João Pedro B.", "Júlia N.", "Larissa G.", "Lucas V.", "Manuela D.", "Marina K.", "Mateus O.",
      "Nicole H.", "Pedro H.", "Rafaela Z.", "Sofia E.", "Thiago W.", "Valentina I.", "Vitória Q.", "Yasmin U."];
    const d = { regras: { ...REGRAS_PADRAO }, premios: PREMIOS_PADRAO.map((p) => ({ ...p })), membros: [], codigos: {}, notas: {}, lotes: [], resgates: [], avisos: [], criado: agora() };

    const lotes = [
      { canal: "maquina", qtd: 240, dias: 20 }
    ];
    lotes.forEach((l, i) => {
      const lote = { id: "L" + (i + 1), data: agora() - l.dias * DIA, qtd: l.qtd, pontos: 10, canal: l.canal };
      d.lotes.push(lote);
      for (let k = 0; k < l.qtd; k++) d.codigos[codigoNovo(6, rnd)] = { lote: lote.id, pontos: 10, canal: l.canal, usadoPor: null, usadoEm: null };
    });

    const livres = (canal) => Object.entries(d.codigos).filter(([, c]) => c.canal === canal && !c.usadoPor);
    nomes.forEach((nome, i) => {
      const cidade = i % 3 === 0 ? "Paranaguá" : i % 5 === 0 ? "Caiobá" : "Curitiba";
      const desde = agora() - Math.floor(3 + rnd() * 27) * DIA;
      const mes = 1 + Math.floor(rnd() * 12);
      const dia = 1 + Math.floor(rnd() * 28);
      const m = {
        id: "M" + (1001 + i), nome, whats: "41 9" + String(80000000 + Math.floor(rnd() * 19999999)).slice(0, 8),
        niver: (i === 2 || i === 9) ? niverDaqui(i === 2 ? 2 : 5) : String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0"),
        cidade, desde, pontos: 0, total: 0, ultimo: desde, indicacao: codigoNovo(5, rnd), indicadoPor: null, extrato: []
      };
      lancar(m, d.regras.bonusCadastro, "Boas-vindas", null, desde);
      const compras = Math.floor(rnd() * (i < 6 ? 34 : 14));
      for (let k = 0; k < compras; k++) {
        const naMaquina = rnd() < 0.34 && cidade === "Curitiba";
        if (naMaquina) {
          const lista = livres("maquina");
          if (!lista.length) continue;
          const [cod, c] = lista[Math.floor(rnd() * lista.length)];
          const lote = d.lotes.find((x) => x.id === c.lote);
          const quando = Math.max(desde, lote.data) + Math.floor(rnd() * (agora() - Math.max(desde, lote.data)));
          c.usadoPor = m.id; c.usadoEm = quando;
          lancar(m, c.pontos, "Etiqueta " + mostraCodigo(cod), "maquina", quando);
        } else {
          const cnpj = cidade === "Paranaguá" ? "42656312000106" : "58476355000131";
          const quando = desde + Math.floor(rnd() * (agora() - desde));
          const chave = montaChave(cnpj, quando, rnd);
          const nota = analisarNota(chave);
          d.notas[chave] = { membro: m.id, data: quando, canal: CNPJS[cnpj].canal, numero: nota.numero, pontos: d.regras.pontosPorNota };
          lancar(m, d.regras.pontosPorNota, "Nota fiscal nº " + nota.numero, CNPJS[cnpj].canal, quando);
        }
      }
      m.extrato.sort((a, b) => b.data - a.data);
      d.membros.push(m);
    });

    // dois prêmios já trocados, um ainda esperando retirada
    const ricos = d.membros.filter((m) => m.pontos >= 100);
    ricos.slice(0, 3).forEach((m, i) => {
      const r = { codigo: codigoNovo(6, rnd), membro: m.id, premio: "bronze", nome: "Cookie Tradicional", pontos: 100, data: agora() - (i + 1) * 2 * DIA, entregue: i < 2 ? agora() - i * DIA : null, loja: i % 2 ? "loja-pgua" : "loja-cwb" };
      lancar(m, -100, "Trocou: Cookie Tradicional", null, r.data);
      d.resgates.push(r);
    });

    d.avisos.push(
      { id: "A1", data: agora() - 6 * DIA, titulo: "Sabor novo: Brigadeiro Belga", texto: "Chegou o clássico da Gliki com chocolate nobre. Já no delivery!", publico: "todos", alcance: 21 },
      { id: "A2", data: agora() - 1 * DIA, titulo: "Domingo tem inauguração", texto: "A 1ª máquina de cookies do Paraná abre no Jockey Plaza às 10h. Vem com a gente!", publico: "Curitiba", alcance: 13 }
    );
    return d;
  }
  function niverDaqui(dias) {
    const t = new Date(agora() + dias * DIA);
    return String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
  }
  function lancar(m, pontos, motivo, canal, quando = agora()) {
    m.pontos = Math.max(0, m.pontos + pontos);
    if (pontos > 0) m.total += pontos;
    if (pontos > 0 && canal) m.ultimo = Math.max(m.ultimo || 0, quando);
    m.extrato.unshift({ data: quando, pontos, motivo, canal });
  }

  /* ---------- guardar e ler ---------- */
  function ler() {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) { const d = JSON.parse(s); d.notas = d.notas || {}; return d; }
    } catch (e) {}
    const d = exemplo();
    gravar(d);
    return d;
  }
  function gravar(d) {
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) {}
  }
  function mexer(fn) {
    const d = ler();
    const r = fn(d);
    gravar(d);
    return r;
  }

  /* ---------- regras do clube ---------- */
  function faixaDe(pontos, premios) {
    const lista = [...premios].sort((a, b) => a.pontos - b.pontos);
    let atual = null;
    lista.forEach((p) => { if (pontos >= p.pontos) atual = p; });
    const proximo = lista.find((p) => p.pontos > pontos) || null;
    return { atual, proximo };
  }
  function expiraEm(m, regras) {
    const t = new Date(m.ultimo || m.desde);
    t.setMonth(t.getMonth() + regras.validadeMeses);
    return t.getTime();
  }
  function aniversarioPerto(m) {
    if (!m.niver) return false;
    const [mm, dd] = m.niver.split("-").map(Number);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    for (let k = -1; k <= 7; k++) {
      const t = new Date(hoje.getTime() + k * DIA);
      if (t.getMonth() + 1 === mm && t.getDate() === dd) return true;
    }
    return false;
  }

  function premiaIndicacao(d, m, primeira) {
    if (!primeira || !m.indicadoPor) return;
    const quem = Clube.membro(d, m.indicadoPor);
    if (quem) lancar(quem, d.regras.bonusIndicacao, "Sua amiga " + m.nome.split(" ")[0] + " comprou");
  }

  const Clube = {
    CANAIS, CIDADES, CNPJS, LOJAS, REGRAS_PADRAO, PREMIOS_PADRAO,
    mascaraFone, chaveFone, analisarNota,
    notaExemplo() { return montaChave("58476355000131", agora()); },
    ler, mexer, codigoNovo, limpaCodigo, mostraCodigo, soDigitos, dataBR, dataHoraBR, faixaDe, expiraEm, aniversarioPerto,

    eu() { try { return localStorage.getItem(CHAVE_EU); } catch (e) { return null; } },
    entrarComo(id) { try { id ? localStorage.setItem(CHAVE_EU, id) : localStorage.removeItem(CHAVE_EU); } catch (e) {} },
    membro(d, id) { return d.membros.find((m) => m.id === id) || null; },
    porWhats(d, w) { const x = chaveFone(w); return x ? d.membros.find((m) => chaveFone(m.whats) === x) : null; },
    guardarAniversario(id, niver) { return mexer((d) => { const m = Clube.membro(d, id); if (m) m.niver = niver; return m; }); },

    cadastrar({ nome, whats, niver = null, cidade = null, indicacao }) {
      return mexer((d) => {
        const ja = Clube.porWhats(d, whats);
        if (ja) return { membro: ja, novo: false };
        const m = { id: "M" + (1001 + d.membros.length + Math.floor(Math.random() * 90)), nome: nome.trim(), whats: whats.trim(), niver, cidade, desde: agora(), pontos: 0, total: 0, ultimo: agora(), indicacao: codigoNovo(5), indicadoPor: null, extrato: [] };
        lancar(m, d.regras.bonusCadastro, "Boas-vindas");
        const quem = indicacao && d.membros.find((x) => x.indicacao === limpaCodigo(indicacao));
        if (quem) { m.indicadoPor = quem.id; lancar(m, d.regras.bonusIndicacao, "Indicação de " + quem.nome.split(" ")[0]); }
        d.membros.push(m);
        return { membro: m, novo: true, indicadoPor: quem || null };
      });
    },

    /* O coração do clube: o código único da etiqueta. Serve na máquina, na loja e no delivery. */
    usarCodigo(idMembro, bruto) {
      return mexer((d) => {
        const cod = limpaCodigo(bruto);
        const c = d.codigos[cod];
        const m = Clube.membro(d, idMembro);
        if (!m) return { ok: false, erro: "Entre no clube para guardar seus pontos." };
        if (!c) return { ok: false, erro: "Não achei esse código. Confira as letras da etiqueta." };
        if (c.usadoPor) return { ok: false, erro: `Esse código já foi usado em ${dataBR(c.usadoEm)}.` };
        c.usadoPor = m.id; c.usadoEm = agora();
        const primeira = !m.extrato.some((e) => e.canal);
        lancar(m, c.pontos, "Etiqueta " + mostraCodigo(cod), c.canal);
        premiaIndicacao(d, m, primeira);
        return { ok: true, pontos: c.pontos, canal: c.canal, saldo: m.pontos, tipo: "Etiqueta da máquina" };
      });
    },

    /* Cada nota pontua uma vez só, e só se for da Gliki. */
    usarNota(idMembro, texto) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        if (!m) return { ok: false, erro: "Entre no clube para guardar seus pontos." };
        const n = analisarNota(texto);
        if (!n) return { ok: false, erro: "Não reconheci essa nota. Tente de novo ou digite os 44 números." };
        if (!n.valida) return { ok: false, erro: "Esse número tem algum dígito errado. Confira e tente de novo." };
        const loja = CNPJS[n.cnpj];
        if (!loja) return { ok: false, erro: "Essa nota não é da Gliki Sô." };
        if (!["65", "55", "59"].includes(n.modelo)) return { ok: false, erro: "Esse documento não é uma nota de compra." };
        const hoje = new Date();
        const meses = (hoje.getFullYear() - n.ano) * 12 + (hoje.getMonth() + 1 - n.mes);
        if (meses < 0 || meses > d.regras.notaMeses) return { ok: false, erro: `Essa nota é de ${String(n.mes).padStart(2, "0")}/${n.ano}. Valem as notas deste mês e do mês passado.` };
        const ja = d.notas[n.chave];
        if (ja) return { ok: false, erro: ja.membro === m.id ? `Você já pontuou essa nota em ${dataBR(ja.data)}.` : `Essa nota já foi usada em ${dataBR(ja.data)}.` };
        const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
        const deHoje = Object.values(d.notas).filter((x) => x.membro === m.id && x.data >= inicioDia.getTime()).length;
        if (deHoje >= d.regras.notasPorDia) return { ok: false, erro: `Você já pontuou ${deHoje} notas hoje. Guarde esta e volte amanhã.` };
        const primeira = !m.extrato.some((e) => e.canal);
        d.notas[n.chave] = { membro: m.id, data: agora(), canal: loja.canal, numero: n.numero, pontos: d.regras.pontosPorNota };
        lancar(m, d.regras.pontosPorNota, "Nota fiscal nº " + n.numero, loja.canal);
        if (!m.cidade) m.cidade = loja.cidade;
        premiaIndicacao(d, m, primeira);
        return { ok: true, pontos: d.regras.pontosPorNota, canal: loja.canal, saldo: m.pontos, tipo: "Nota fiscal nº " + n.numero };
      });
    },

    trocar(idMembro, idPremio, idLoja) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        const p = d.premios.find((x) => x.id === idPremio);
        if (!m || !p) return { ok: false, erro: "Prêmio não encontrado." };
        if (m.pontos < p.pontos) return { ok: false, erro: `Faltam ${p.pontos - m.pontos} pontos.` };
        const r = { codigo: codigoNovo(6), membro: m.id, premio: p.id, nome: p.nome, pontos: p.pontos, data: agora(), entregue: null, loja: idLoja || null };
        lancar(m, -p.pontos, "Trocou: " + p.nome);
        d.resgates.push(r);
        return { ok: true, resgate: r };
      });
    },

    entregar(bruto) {
      return mexer((d) => {
        const r = d.resgates.find((x) => x.codigo === limpaCodigo(bruto));
        if (!r) return { ok: false, erro: "Esse código de prêmio não existe." };
        if (r.entregue) return { ok: false, erro: `Esse prêmio já foi entregue em ${dataHoraBR(r.entregue)}.` };
        r.entregue = agora();
        return { ok: true, resgate: r, membro: Clube.membro(d, r.membro) };
      });
    },

    pontuarBalcao(idMembro, cookies, canal) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        if (!m) return { ok: false };
        const pts = cookies * d.regras.pontosPorCookie;
        lancar(m, pts, `${cookies} cookie${cookies > 1 ? "s" : ""} no balcão`, canal);
        return { ok: true, pontos: pts, saldo: m.pontos };
      });
    },

    gerarLote(qtd, canal, pontos) {
      return mexer((d) => {
        const lote = { id: "L" + (d.lotes.length + 1), data: agora(), qtd, pontos, canal };
        const lista = [];
        while (lista.length < qtd) {
          const c = codigoNovo(6);
          if (d.codigos[c]) continue;
          d.codigos[c] = { lote: lote.id, pontos, canal, usadoPor: null, usadoEm: null };
          lista.push(c);
        }
        d.lotes.push(lote);
        return { lote, codigos: lista };
      });
    },

    publico(d, publico) {
      const hoje = agora();
      return d.membros.filter((m) => {
        if (publico === "todos") return true;
        if (publico === "aniversario") return aniversarioPerto(m);
        if (publico === "sumidos") return hoje - (m.ultimo || m.desde) > 30 * DIA;
        if (publico === "premio") return m.pontos >= Math.min(...d.premios.map((p) => p.pontos));
        return m.cidade === publico;
      });
    },

    avisar(titulo, texto, publico) {
      return mexer((d) => {
        const a = { id: "A" + (d.avisos.length + 1) + "-" + agora(), data: agora(), titulo, texto, publico, alcance: Clube.publico(d, publico).length };
        d.avisos.push(a);
        return a;
      });
    },

    zerar() { try { localStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE_EU); } catch (e) {} },
    CHAVE
  };
  window.Clube = Clube;
})();

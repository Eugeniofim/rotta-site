/* Clube Glikilovers — protótipo.
   Tudo fica no navegador (localStorage), então o clube e o painel conversam
   quando abertos no MESMO aparelho. Na versão de verdade isso vira um banco
   (Supabase) e o aviso chega em todos os celulares. */
(function () {
  const CHAVE = "glk_demo_v2";
  const CHAVE_EU = "glk_eu";

  const CANAIS = {
    maquina: "Máquina · Jockey Plaza",
    "loja-cwb": "Loja Curitiba",
    "loja-pgua": "Loja Paranaguá",
    delivery: "Delivery",
    caioba: "Caiobá"
  };
  const CIDADES = ["Curitiba", "Paranaguá", "Caiobá"];

  const REGRAS_PADRAO = {
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
    const d = { regras: { ...REGRAS_PADRAO }, premios: PREMIOS_PADRAO.map((p) => ({ ...p })), membros: [], codigos: {}, lotes: [], resgates: [], avisos: [], criado: agora() };

    const lotes = [
      { canal: "maquina", qtd: 160, dias: 20 },
      { canal: "loja-pgua", qtd: 120, dias: 28 },
      { canal: "loja-cwb", qtd: 100, dias: 21 },
      { canal: "delivery", qtd: 120, dias: 25 }
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
        const canal = rnd() < 0.34 ? "maquina" : cidade === "Paranaguá" ? (rnd() < 0.6 ? "loja-pgua" : "delivery") : (rnd() < 0.5 ? "loja-cwb" : "delivery");
        const lista = livres(canal);
        if (!lista.length) continue;
        const [cod, c] = lista[Math.floor(rnd() * lista.length)];
        const lote = d.lotes.find((x) => x.id === c.lote);
        const quando = Math.max(desde, lote.data) + Math.floor(rnd() * (agora() - Math.max(desde, lote.data)));
        c.usadoPor = m.id; c.usadoEm = quando;
        lancar(m, c.pontos, "Código " + mostraCodigo(cod), canal, quando);
      }
      m.extrato.sort((a, b) => b.data - a.data);
      d.membros.push(m);
    });

    // dois prêmios já trocados, um ainda esperando retirada
    const ricos = d.membros.filter((m) => m.pontos >= 100);
    ricos.slice(0, 3).forEach((m, i) => {
      const r = { codigo: codigoNovo(6, rnd), membro: m.id, premio: "bronze", nome: "Cookie Tradicional", pontos: 100, data: agora() - (i + 1) * 2 * DIA, entregue: i < 2 ? agora() - i * DIA : null };
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
      if (s) return JSON.parse(s);
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

  const Clube = {
    CANAIS, CIDADES, REGRAS_PADRAO, PREMIOS_PADRAO,
    ler, mexer, codigoNovo, limpaCodigo, mostraCodigo, soDigitos, dataBR, dataHoraBR, faixaDe, expiraEm, aniversarioPerto,

    eu() { try { return localStorage.getItem(CHAVE_EU); } catch (e) { return null; } },
    entrarComo(id) { try { id ? localStorage.setItem(CHAVE_EU, id) : localStorage.removeItem(CHAVE_EU); } catch (e) {} },
    membro(d, id) { return d.membros.find((m) => m.id === id) || null; },
    porWhats(d, w) { const x = soDigitos(w).slice(-9); return x.length >= 8 ? d.membros.find((m) => soDigitos(m.whats).endsWith(x)) : null; },

    cadastrar({ nome, whats, niver, cidade, indicacao }) {
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
        const primeiro = !m.extrato.some((e) => e.motivo.startsWith("Código"));
        lancar(m, c.pontos, "Código " + mostraCodigo(cod), c.canal);
        if (primeiro && m.indicadoPor) {
          const quem = Clube.membro(d, m.indicadoPor);
          if (quem) lancar(quem, d.regras.bonusIndicacao, "Sua amiga " + m.nome.split(" ")[0] + " comprou");
        }
        return { ok: true, pontos: c.pontos, canal: c.canal, saldo: m.pontos };
      });
    },

    trocar(idMembro, idPremio) {
      return mexer((d) => {
        const m = Clube.membro(d, idMembro);
        const p = d.premios.find((x) => x.id === idPremio);
        if (!m || !p) return { ok: false, erro: "Prêmio não encontrado." };
        if (m.pontos < p.pontos) return { ok: false, erro: `Faltam ${p.pontos - m.pontos} pontos.` };
        const r = { codigo: codigoNovo(6), membro: m.id, premio: p.id, nome: p.nome, pontos: p.pontos, data: agora(), entregue: null };
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

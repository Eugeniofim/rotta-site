/* Leitor da zona de leitura do passaporte (as duas linhas com "<<<" no rodapé).
   Devolve o nome exatamente como está no documento, confere os dígitos verificadores
   e monta os comandos do Amadeus. No app de verdade as duas linhas saem da foto;
   aqui no protótipo elas são coladas. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Passaporte = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const MESES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function valor(c) {
    if (c >= '0' && c <= '9') return +c;
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
    return 0;
  }
  function digito(s) {
    const pesos = [7, 3, 1];
    let t = 0;
    for (let i = 0; i < s.length; i++) t += valor(s[i]) * pesos[i % 3];
    return String(t % 10);
  }

  /* acha as duas linhas dentro de qualquer texto colado */
  function linhas(texto) {
    const cand = String(texto || '').toUpperCase().split(/\n/).map(l => l.replace(/\s/g, '')).filter(l => /^[A-Z0-9<]{30,}$/.test(l));
    const i = cand.findIndex(l => /^P[A-Z<]/.test(l) && l.includes('<<'));
    if (i < 0 || !cand[i + 1]) return null;
    return [cand[i].padEnd(44, '<').slice(0, 44), cand[i + 1].padEnd(44, '<').slice(0, 44)];
  }

  /* AAMMDD -> ISO. Nascimento: século pelo ano atual; validade: sempre 20xx. */
  function dataIso(s, nascimento, hoje) {
    const aa = +s.slice(0, 2), mm = s.slice(2, 4), dd = s.slice(4, 6);
    let a = 2000 + aa;
    if (nascimento && a > (hoje || new Date()).getFullYear()) a -= 100;
    return a + '-' + mm + '-' + dd;
  }

  function ler(texto, opts) {
    const l = linhas(texto);
    if (!l) return null;
    const [l1, l2] = l;
    const nomes = l1.slice(5).split('<<');
    const sobrenome = (nomes[0] || '').replace(/</g, ' ').trim();
    const nome = (nomes[1] || '').replace(/</g, ' ').trim();
    const numero = l2.slice(0, 9).replace(/</g, '');
    const p = {
      emissor: l1.slice(2, 5).replace(/</g, ''), sobrenome, nome, numero,
      nacionalidade: l2.slice(10, 13).replace(/</g, ''),
      nascimento: dataIso(l2.slice(13, 19), true, opts && opts.hoje),
      sexo: l2[20] === 'F' ? 'F' : l2[20] === 'M' ? 'M' : '',
      validade: dataIso(l2.slice(21, 27), false),
    };
    p.confere = digito(l2.slice(0, 9)) === l2[9] && digito(l2.slice(13, 19)) === l2[19] && digito(l2.slice(21, 27)) === l2[27];
    p.nomeCompleto = (nome + ' ' + sobrenome).trim();
    return p;
  }

  /* passaporte precisa valer 6 meses depois da volta na maior parte dos destinos */
  function alertaValidade(p, voltaIso) {
    if (!p || !voltaIso) return '';
    const lim = new Date(voltaIso + 'T12:00:00');
    lim.setMonth(lim.getMonth() + 6);
    const val = new Date(p.validade + 'T12:00:00');
    if (val < new Date(voltaIso + 'T12:00:00')) return 'O passaporte vence antes da volta.';
    if (val < lim) return 'O passaporte vence menos de 6 meses depois da volta. Muitos países barram a entrada.';
    return '';
  }

  const ddmmmaa = (isoData) => { const [a, m, d] = isoData.split('-'); return d + MESES[+m - 1] + a.slice(2); };

  /* comandos para colar de volta no Amadeus: nome (NM) e dados do passaporte (SR DOCS) */
  function comandos(p, n) {
    /* sem sexo lido não se inventa: o título fica em branco e o SR DOCS leva U (não informado) */
    const titulo = p.sexo === 'F' ? ' MRS' : p.sexo === 'M' ? ' MR' : '';
    return [
      'NM1' + p.sobrenome + '/' + p.nome + titulo,
      'SRDOCS YY HK1-P-' + p.emissor + '-' + p.numero + '-' + p.nacionalidade + '-' + ddmmmaa(p.nascimento) + '-' + (p.sexo || 'U') + '-' + ddmmmaa(p.validade) + '-' + p.sobrenome + '-' + p.nome + '/P' + (n || 1),
    ];
  }

  /* monta duas linhas válidas a partir de dados inventados (só para exemplo e teste) */
  function monta(d) {
    const l1 = ('P<' + d.emissor + d.sobrenome.replace(/ /g, '<') + '<<' + d.nome.replace(/ /g, '<')).padEnd(44, '<').slice(0, 44);
    const num = d.numero.padEnd(9, '<');
    const nasc = d.nascimento, val = d.validade, pessoal = ''.padEnd(14, '<');
    let l2 = num + digito(num) + d.nacionalidade + nasc + digito(nasc) + d.sexo + val + digito(val) + pessoal + digito(pessoal);
    l2 += digito(l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43));
    return l1 + '\n' + l2;
  }

  return { ler, linhas, digito, alertaValidade, comandos, monta };
});

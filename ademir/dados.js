/* Tabelas de apoio: companhias, aeroportos, aeronaves e os padrões da agência.
   Nada aqui vem de API: é o que o leitor do Amadeus usa para traduzir os códigos. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DADOS = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const CIAS = {
    AF: 'Air France', UX: 'Air Europa', AZ: 'ITA Airways', LA: 'LATAM', G3: 'GOL', AD: 'Azul',
    TP: 'TAP Air Portugal', IB: 'Iberia', LH: 'Lufthansa', LX: 'Swiss', KL: 'KLM', BA: 'British Airways',
    AA: 'American Airlines', UA: 'United', DL: 'Delta', EK: 'Emirates', QR: 'Qatar Airways',
    TK: 'Turkish Airlines', AT: 'Royal Air Maroc', ET: 'Ethiopian', AC: 'Air Canada', AM: 'Aeroméxico',
    AR: 'Aerolíneas Argentinas', CM: 'Copa Airlines', AV: 'Avianca', EY: 'Etihad', MS: 'Egyptair',
    JJ: 'LATAM', JA: 'JetSMART', H2: 'SKY Airline', DM: 'Arajet', OB: 'BoA', DT: 'TAAG', SA: 'South African Airways',
    NH: 'ANA', JL: 'Japan Airlines', CA: 'Air China', QF: 'Qantas', SQ: 'Singapore Airlines', LY: 'EL AL', HR: 'Hahn Air', NZ: 'Air New Zealand',
    KE: 'Korean Air', CX: 'Cathay Pacific', TS: 'Air Transat', VR: 'Cabo Verde Airlines', DE: 'Condor', GP: 'APG Airlines', MF: 'Xiamen Airlines',
  };

  /* código: [cidade, nome do aeroporto, fuso] */
  const AEROPORTOS = {
    GRU: ['São Paulo', 'Guarulhos', 'America/Sao_Paulo'],
    CGH: ['São Paulo', 'Congonhas', 'America/Sao_Paulo'],
    VCP: ['Campinas', 'Viracopos', 'America/Sao_Paulo'],
    GIG: ['Rio de Janeiro', 'Galeão', 'America/Sao_Paulo'],
    SDU: ['Rio de Janeiro', 'Santos Dumont', 'America/Sao_Paulo'],
    BSB: ['Brasília', 'Brasília', 'America/Sao_Paulo'],
    CNF: ['Belo Horizonte', 'Confins', 'America/Sao_Paulo'],
    CWB: ['Curitiba', 'Afonso Pena', 'America/Sao_Paulo'],
    POA: ['Porto Alegre', 'Salgado Filho', 'America/Sao_Paulo'],
    SSA: ['Salvador', 'Salvador', 'America/Bahia'],
    REC: ['Recife', 'Guararapes', 'America/Recife'],
    FOR: ['Fortaleza', 'Pinto Martins', 'America/Fortaleza'],
    CDG: ['Paris', 'Charles de Gaulle', 'Europe/Paris'],
    ORY: ['Paris', 'Orly', 'Europe/Paris'],
    MAD: ['Madri', 'Barajas', 'Europe/Madrid'],
    BCN: ['Barcelona', 'El Prat', 'Europe/Madrid'],
    LIS: ['Lisboa', 'Humberto Delgado', 'Europe/Lisbon'],
    OPO: ['Porto', 'Francisco Sá Carneiro', 'Europe/Lisbon'],
    FCO: ['Roma', 'Fiumicino', 'Europe/Rome'],
    MXP: ['Milão', 'Malpensa', 'Europe/Rome'],
    VCE: ['Veneza', 'Marco Polo', 'Europe/Rome'],
    LHR: ['Londres', 'Heathrow', 'Europe/London'],
    FRA: ['Frankfurt', 'Frankfurt', 'Europe/Berlin'],
    MUC: ['Munique', 'Munique', 'Europe/Berlin'],
    ZRH: ['Zurique', 'Zurique', 'Europe/Zurich'],
    AMS: ['Amsterdã', 'Schiphol', 'Europe/Amsterdam'],
    IST: ['Istambul', 'Istambul', 'Europe/Istanbul'],
    TIA: ['Tirana', 'Tirana', 'Europe/Tirane'],
    DXB: ['Dubai', 'Dubai', 'Asia/Dubai'],
    DOH: ['Doha', 'Hamad', 'Asia/Qatar'],
    CAI: ['Cairo', 'Cairo', 'Africa/Cairo'],
    RAK: ['Marrakech', 'Menara', 'Africa/Casablanca'],
    CMN: ['Casablanca', 'Mohammed V', 'Africa/Casablanca'],
    JFK: ['Nova York', 'JFK', 'America/New_York'],
    EWR: ['Nova York', 'Newark', 'America/New_York'],
    MIA: ['Miami', 'Miami', 'America/New_York'],
    MCO: ['Orlando', 'Orlando', 'America/New_York'],
    LAX: ['Los Angeles', 'Los Angeles', 'America/Los_Angeles'],
    EZE: ['Buenos Aires', 'Ezeiza', 'America/Argentina/Buenos_Aires'],
    AEP: ['Buenos Aires', 'Aeroparque', 'America/Argentina/Buenos_Aires'],
    MDZ: ['Mendoza', 'El Plumerillo', 'America/Argentina/Mendoza'],
    SCL: ['Santiago', 'Arturo Merino Benítez', 'America/Santiago'],
    FTE: ['El Calafate', 'El Calafate', 'America/Argentina/Rio_Gallegos'],
  };

  const AERONAVES = {
    '77W': 'Boeing 777-300ER', '772': 'Boeing 777-200', '789': 'Boeing 787-9', '788': 'Boeing 787-8',
    '7M8': 'Boeing 737 MAX 8', '73H': 'Boeing 737-800', '738': 'Boeing 737-800', '359': 'Airbus A350-900',
    '339': 'Airbus A330-900', '332': 'Airbus A330-200', '333': 'Airbus A330-300', '388': 'Airbus A380',
    '320': 'Airbus A320', '32S': 'Airbus A320', '321': 'Airbus A321', '223': 'Airbus A220-300', 'E90': 'Embraer 190',
  };

  /* O que a agência repete em toda cotação.
     taxaUSD = a parte da agência por pessoa, por companhia (números de exemplo, vistos numa cotação dele;
     a divisão entre a parte dele e o fee da consolidadora precisa da confirmação dele).
     As parcelas e o fee NÃO moram aqui: vêm das tabelas da consolidadora (tela CNT). */
  const AGENCIA = {
    nome: 'Simonetta Viagens',
    razao: 'Simonetta Viagens e Turismo',
    cidade: 'São Paulo – SP – Brasil',
    fones: ['(55) 11 99841-0681', '(55) 11 99970-1711'],
    email: 'simonetta@simonettaviagens.com.br',
    consultor: 'Ademir',
    whats: '',            /* vazio no protótipo: nenhum botão abre conversa de verdade */
    cartaoPct: 3.7,
    aviso: 'Valores sujeitos a alteração sem aviso prévio',
    porCia: {
      AF: { taxaUSD: 100 },
      UX: { taxaUSD: 110 },
    },
    padrao: { taxaUSD: 100 },
  };

  /* Hotéis que o protótipo conhece. No app de verdade isso vem da busca do Google. */
  const HOTEIS = [
    { nome: 'Savoy Le Grand Hotel Marrakech', chaves: ['savoy', 'marrakech', 'marrakesh'], endereco: 'Avenue de la Menara, Marrakech, 40000', fone: '+212 5 24 35 10 00', estrelas: 5, cidade: 'Marrakech' },
    { nome: 'Sofitel Lisbon Liberdade', chaves: ['sofitel', 'lisbon', 'lisboa', 'liberdade'], endereco: 'Av. da Liberdade 127, 1269-038 Lisboa', fone: '+351 21 322 8300', estrelas: 5, cidade: 'Lisboa' },
    { nome: 'Hôtel de Crillon, A Rosewood Hotel', chaves: ['crillon', 'rosewood'], endereco: '10 Place de la Concorde, 75008 Paris', fone: '+33 1 44 71 15 00', estrelas: 5, cidade: 'Paris' },
  ];

  /* Fotos de capa por destino (Unsplash, licença livre). No app de verdade a busca é pelo nome da cidade;
     aqui só Paris tem foto, e os outros destinos saem com a capa desenhada ou com a foto que ele subir. */
  const FOTOS_DESTINO = {
    Paris: ['arte/destinos/paris-1.jpg', 'arte/destinos/paris-2.jpg', 'arte/destinos/paris-3.jpg'],
  };

  /* A base completa (codigos.js, gerada de fontes abertas) fica por baixo; o que está escrito à mão aqui
     vale por cima, porque é o nome curto que o cliente reconhece ("Guarulhos", "LATAM"). */
  const BASE = (typeof CODIGOS !== 'undefined' && CODIGOS) || (typeof require === 'function' ? (() => { try { return require('./codigos.js'); } catch (e) { return null; } })() : null);
  if (BASE) {
    for (const [k, v] of Object.entries(BASE.cias)) if (!CIAS[k]) CIAS[k] = v;
    for (const [k, v] of Object.entries(BASE.aeroportos)) if (!AEROPORTOS[k]) AEROPORTOS[k] = v;
    for (const [k, v] of Object.entries(BASE.avioes)) if (!AERONAVES[k]) AERONAVES[k] = v;
  }

  /* a sala 'ademir' no Supabase do estúdio. A chave é a publicável (pública por desenho): quem protege
     os dados é a regra do banco, que só deixa o dono logado ler e escrever. */
  const NUVEM = { url: 'https://uopfqlogjzuqpabptxkb.supabase.co', chave: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2', sala: 'ademir' };

  return { CIAS, AEROPORTOS, AERONAVES, AGENCIA, HOTEIS, FOTOS_DESTINO, NUVEM };
});

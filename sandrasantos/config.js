/* Identidade deste app: o UNICO lugar que sabe qual banco usar e de quem
   e o app. cloud.js, auth.js, store.js e app.js leem daqui e nao trazem
   nenhum endereco, nome ou marca fixos.

   SANDRA SANTOS · SIKANIA TOUR (17/10/2026) — cliente da Ti Artes (Rotta).
   Tour Leader registrada no Turismo de Portugal (RNAAT 1013/2026), mora em
   Tavira (Algarve) e leva brasileiros pela Italia e por Portugal.
   Fonte de tudo: ~/Desktop/SANDRA APP (PASSEIOS-SANDRA.md e o kit de
   boas-vindas). Preco, duracao e o que inclui ainda sao DELA confirmar.

   Versao 0.1 = so no aparelho (supabaseUrl vazio): nada sai do navegador.
   Para ir ao ar: sala no Supabase do estudio (ver README.md). */
var APP_CONFIG = {
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* projeto Pro da Ti Artes (sala sandra) */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   /* a publicável: quem protege é a RLS da sala */
  sala: 'sandra',

  /* Assistente: os creditos ficam na conta Anthropic DELA (kit de boas-vindas,
     parte 4). Sem cofre e sem chave, o assistente roda em modo demonstracao.
     Para ligar: ela cola a chave dela no app, ou o cofre ganha a entrada
     'sandra' com a chave dela. */
  cofre: '',
  clienteCofre: '',
  iaIncluida: false,
  /* Atendimento (robo no Instagram e no WhatsApp): liga quando a Meta liberar */
  agenteInstagram: '',
  agenteWhatsapp: '',
  /* o que ela comprou: app + assistente + atendimento. Marketing fica para depois. */
  modulos: { assistente: true, atendimento: true, marketing: false, whatsapp: true },

  /* conversas de EXEMPLO do Atendimento, enquanto a Meta nao libera: mostram
     como o robo vai responder sobre os passeios dela. Nada disso e cliente real. */
  conversasDemo: [
    { id: 'c1', nome: 'Patrícia', lang: 'pt', canal: 'insta', tipo: 'preco', tour: 'costa-amalfitana', pessoas: 4, msg: 'Oi Sandra! Vi seu vídeo de Amalfi vista do mar. Quanto fica o passeio para 4 pessoas?' },
    { id: 'c2', nome: 'Ricardo', lang: 'pt', canal: 'whats', tipo: 'semana', tour: 'napoles-centro', pessoas: 2, msg: 'Olá! Vamos estar em Nápoles na semana que vem. Você faz o centro histórico?' },
    { id: 'c3', nome: 'Juliana', lang: 'pt', canal: 'whats', tipo: 'disp', tour: 'tavira-ria-formosa', pessoas: 3, msg: 'Oi! Tem data em maio para as praias de Tavira? Somos 3.' },
    { id: 'c4', nome: 'Sérgio', lang: 'pt', canal: 'insta', tipo: 'pagar', msg: 'Dá para pagar por Pix? Moro no Brasil.' },
  ],

  emailClientes: false,
  vapidPublica: '',

  /* KIT DA VIAGEM (27/10/2026, kit-viagem.js): o link com tudo o que o cliente
     precisa. Aqui mora o que e DELA: as cores (azul Tirreno + terracota), as
     palavras e as dicas padrao da viagem (Italia e Portugal) — so fatos certos;
     ela edita no painel. O "o que levar" vem do modelo do Voucher dela. */
  kit: {
    artigo: 'a', servico: 'passeio', servicos: 'passeios',
    dicasTitulo: 'Dicas para a viagem',
    dicas: [
      'Emergência: 112, em Portugal e na Itália.',
      'A moeda é o euro (€).',
      'Tomada: a europeia, de dois pinos redondos. Na Itália também há a de três pinos em linha: um adaptador universal resolve.',
      'Portugal continental tem 1 hora a menos que a Itália.',
      'Em muitas igrejas da Itália, ombros e joelhos precisam estar cobertos.',
    ],
    levar: { padrao: ['Sapato confortável', 'Documento com foto', 'Protetor solar, chapéu e garrafinha de água', 'Celular carregado e este kit'] },
    /* o mapa e a agenda de cada passeio no lugar certo (Napoles e Sicilia tem a hora da Italia) */
    mapaPorRegiao: { napoles: 'Nápoles, Itália', amalfi: 'Costa Amalfitana, Itália', cilento: 'Cilento, Itália', benevento: 'Benevento, Itália', sicilia: 'Sicília, Itália', algarve: 'Algarve, Portugal' },
    fusoPorRegiao: { napoles: 'Europe/Rome', amalfi: 'Europe/Rome', cilento: 'Europe/Rome', benevento: 'Europe/Rome', sicilia: 'Europe/Rome', algarve: 'Europe/Lisbon' },
    cores: { faixa: '#0E5A78', destaque: '#A9471F', sobreFaixa: '#F6CDB8', ctaTinta: '#FFFFFF', papel: '#FBF8F3', tinta: '#111111', tinta2: '#4A4F4C',
      linha: '#E6E0D4', rotulo: '#953E1B', pago: '#E6F0E9', resta: '#F3E2DA' },
    sql: 'LIGAR-KIT-SANDRA.sql',
  },

  guia: {
    nome: 'Sandra',
    nomeCompleto: 'Sandra Santos',
    negocio: 'Sikania Tour',
    cidade: 'Tavira, Algarve',
    whats: '+351935918341',
    email: '',
    insta: 'sandrasantospvh',
    /* MOEDA: euro (Italia e Portugal) */
    moeda: 'EUR',
    fuso: 'Europe/Lisbon',
    /* sinal, tolerancia e cancelamento: A CONFIRMAR com ela ("as suas regras",
       kit parte 3). Enquanto isso todos os passeios sao "valor a combinar". */
    sinalPct: 30,
    saldoNoDia: true,
    tolerancia: 20,
    horaExtra: 0,
    diaExclusivo: true,
    site: '',
    blog: '',
    blueBadge: '',
    youtube: '',
    tiktok: '',
    facebook: '',
    spotify: '',
    /* "Para a sua viagem" (hotel, chip, seguro) nao esta no pacote dela */
    parceiros: [],
    depoimentos: [],
    /* o reel em que o Marcelo conta a viagem do grupo de 11 */
    depoimentosVideo: '',
    depoimentosVideoTxt: '',
    badge: 'Tour Leader · RNAAT 1013/2026',
    prefixo: 'SK',                 /* codigo da reserva: SK-4821 */
    idiomas: 'Português',
    /* sem turnos fixos: cada passeio e combinado com ela (data no pedido) */
    turnos: [],
    turnoExclusivo: false,
    linguas: ['pt'],
    /* marca PROVISORIA (Sikania Tour ainda nao tem logo): gerada em arte/ */
    marca: {
      logoClaro: 'arte/logo-claro.png',   logoClaroRazao: 3.9,
      logoEscuro: 'arte/logo-escuro.png', logoEscuroRazao: 3.9,
      monograma: 'arte/monograma.png',    monogramaRazao: 1,
    },
    regioes: [
      ['napoles',   'Nápoles',            'Naples'],
      ['amalfi',    'Costa Amalfitana',   'Amalfi Coast'],
      ['cilento',   'Cilento',            'Cilento'],
      ['benevento', 'Benevento',          'Benevento'],
      ['sicilia',   'Sicília',            'Sicily'],
      ['algarve',   'Algarve',            'Algarve'],
      ['italia-portugal', 'Itália e Portugal', 'Italy and Portugal'],
    ],
    tipos: {
      walk:      { pt: 'A pé',          en: 'Walking' },
      museum:    { pt: 'Gastronômico',  en: 'Food' },
      day:       { pt: 'De carro',      en: 'By car' },
      exclusivo: { pt: 'De barco',      en: 'By boat' },
      photo:     { pt: 'Praia',         en: 'Beach' },
      consult:   { pt: 'Sob medida',    en: 'Tailor-made' },
    },
  },
};

/* A SALA DE PRODUÇÃO (decidido em 18/10/2026: rottaguide.com/sandrasantos, sala
   'sandra' no projeto Pro do estúdio). Fica DORMINDO aqui: o app deste aparelho
   continua sem banco (prévia). O publicar.sh liga estes valores no pacote que
   vai para o rotta-site — só depois que a sala existir (PUBLICAR.md). */
var APP_NUVEM_PRODUCAO = {
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   /* a publicável: quem protege é a RLS da sala */
  sala: 'sandra',
  endereco: 'https://rottaguide.com/sandrasantos/',
};

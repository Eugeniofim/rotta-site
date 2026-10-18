/* =====================================================
   CATÁLOGO — Sandra Santos · Sikania Tour (17/10/2026)

   Os 11 passeios + a viagem sob medida, montados a partir dos vídeos dela
   (~/Desktop/SANDRA APP/PASSEIOS-SANDRA.md). Cada passeio sai de um reel.

   PREÇO: nenhum. Todos nascem "valor a combinar" (price 0): o cliente pede
   e o pedido cai em Orçamentos. Ela põe o preço no painel quando mandar.
   Duração vem do que os vídeos mostram; o que inclui e o ponto de encontro
   ficam vazios até ela confirmar (kit de boas-vindas, parte 1).
   FOTOS: provisórias (a arte da região, fotos/r-*.svg) até ela mandar as
   dela ou autorizar tirar dos vídeos.
   ===================================================== */
'use strict';

const APP_TABELA_EXEMPLO = false;

/* política provisória: o sinal e o cancelamento são dela definir */
const POLITICA_SANDRA = {
  pt: 'Valor, sinal e cancelamento combinados com a Sandra no orçamento',
  en: 'Price, deposit and cancellation agreed with Sandra in the quote',
};
const ENCONTRO_ABERTO = { pt: 'A combinar com a Sandra', en: 'Agreed with Sandra' };
const ig = (id) => 'https://www.instagram.com/reel/' + id + '/';

function catalogoSandra() {
  const base = { pickup: false, privativo: true, min: 1, max: 8, priceMode: 'pp', payPolicy: 'split', price: 0,
    cancel: POLITICA_SANDRA, effort: 'easy', distance: '', meeting: ENCONTRO_ABERTO, encontroAberto: true,
    includes: { pt: [], en: [] }, notIncludes: { pt: [], en: [] }, stops: [] };
  const T = (o) => ({ ...base, ...o });
  return [
    /* ---------------- O PRINCIPAL: SOB MEDIDA ---------------- */
    T({ id: 'sob-medida', type: 'consult', region: 'italia-portugal', order: 0, destaque: true, pedido: 'sobmedida',
      photo: 'fotos/r-italia-portugal.svg', duration: 'Você escolhe os dias', max: 20,
      name: { pt: 'Sua viagem sob medida pela Itália ou por Portugal', en: 'Your tailor-made trip through Italy or Portugal' },
      tagline: { pt: 'Viagem personalizada, com curadoria e acompanhamento, para quem quer viver o lugar e não só passar por ele.', en: '' },
      desc: { pt: 'Eu organizo viagens personalizadas para quem quer conhecer de verdade, e não apenas passar por lugares.\n\nNada de 15 dias e 12 cidades. Você me conta quem vem, quando e do que gosta; eu monto o roteiro de carro, com tempo para cada lugar, e acompanho a viagem.\n\nPara grupos, famílias e casais.', en: '' },
      videos: [['Como eu trabalho', ig('Dcl8-PeO9T5')], ['O roteiro errado de 15 dias', ig('DclnRSSNkl2')], ['O grupo de 11 do Marcelo', ig('DcMi3EEu3xT')]] }),

    /* ---------------- ITÁLIA · NÁPOLES ---------------- */
    T({ id: 'napoles-centro', type: 'walk', region: 'napoles', order: 1, destaque: true,
      photo: 'fotos/r-napoles.svg', duration: 'Meio dia',
      name: { pt: 'Nápoles de verdade: Spaccanapoli e o centro histórico', en: 'The real Naples: Spaccanapoli and the old town' },
      tagline: { pt: 'A rua que corta o centro histórico, Patrimônio da UNESCO, com as histórias que o guia de bolso não conta.', en: '' },
      desc: { pt: 'A pé pela Spaccanapoli, a rua que corta o centro histórico de Nápoles, Patrimônio da UNESCO: igrejas, palácios e vielas.\n\nNo caminho, a história da roda dos expostos e de onde vem o sobrenome Esposito. E uma parada para o café napolitano.', en: '' },
      videos: [['Spaccanapoli', ig('DaXhqxeOb_B')], ['Esposito e a roda dos expostos', ig('DdToLnWukAB')], ['O critério da UNESCO', ig('Daf5bwQt1og')], ['O café', ig('Ddg_VeHt7dQ')]] }),

    T({ id: 'napoles-subterranea', type: 'walk', region: 'napoles', order: 2,
      photo: 'fotos/r-napoles.svg', duration: 'Curto · dá para juntar com o centro histórico',
      name: { pt: 'Nápoles subterrânea', en: 'Underground Naples' },
      tagline: { pt: 'Os túneis e o antigo mercado, metros abaixo da cidade.', en: '' },
      desc: { pt: 'Metros abaixo das ruas de Nápoles: os túneis e o antigo mercado da Napoli Sotterranea.\n\nÉ curto e combina bem com o passeio pelo centro histórico no mesmo dia.', en: '' },
      videos: [['Napoli sotterranea', ig('Dcq7k_TNrPD')]] }),

    T({ id: 'sabores-napoles', type: 'museum', region: 'napoles', order: 3,
      photo: 'fotos/r-napoles.svg', duration: 'A combinar',
      name: { pt: 'Sabores de Nápoles: Pignasecca, pizza, ragù e polpetta', en: 'Flavours of Naples: Pignasecca, pizza, ragù and polpetta' },
      tagline: { pt: 'O mercado da Pignasecca, a pizza, o ragù e a polpetta: a comida de Nápoles e quem cozinha.', en: '' },
      desc: { pt: 'Um passeio gastronômico a pé: o mercado da Pignasecca, a história da pizza (a rainha, 1889), o ragù napoletano com a massa certa, a polpetta e as especialidades de rua.', en: '' },
      videos: [['Pignasecca', ig('Dc2DEXsMbQ6')], ['A pizza', ig('Dai943vIj0X')], ['O ragù', ig('DdM4BrhO5SF')], ['A polpetta', ig('Db9C1LZOrQY')], ['Especialidades', ig('DcybahHNU6v')]] }),

    T({ id: 'lungomare-posillipo', type: 'walk', region: 'napoles', order: 4,
      photo: 'fotos/r-napoles.svg', duration: 'Fim de tarde',
      name: { pt: 'Lungomare, Posillipo e Marechiaro', en: 'Lungomare, Posillipo and Marechiaro' },
      tagline: { pt: 'A Nápoles além do centro histórico: a orla, a costa de Posillipo e Marechiaro.', en: '' },
      desc: { pt: 'A Nápoles que fica fora do roteiro de sempre: a caminhada pela Lungomare, a costa de Posillipo e Marechiaro, no fim da tarde.', en: '' },
      videos: [['Lungomare', ig('DasjtBPNKQo')], ['Marechiaro', ig('DdKb35Guh4y')], ['Nápoles além do centro', ig('DaixBV7Iko6')]] }),

    /* ---------------- ITÁLIA · COSTA AMALFITANA ---------------- */
    T({ id: 'costa-amalfitana', type: 'day', region: 'amalfi', order: 5, destaque: true,
      photo: 'fotos/r-amalfi.svg', duration: 'Dia inteiro · de carro e barco',
      name: { pt: 'Costa Amalfitana: Amalfi vista do mar, Ravello e Maiori', en: 'Amalfi Coast: Amalfi from the sea, Ravello and Maiori' },
      tagline: { pt: 'Amalfi vista do mar e o mirante de Ravello sobre Maiori e Minori.', en: '' },
      desc: { pt: 'Um dia inteiro, de carro e de barco: Amalfi vista do mar, o mirante de Ravello sobre Maiori e Minori, e Maiori.', en: '' },
      videos: [['Amalfi vista do mar', ig('DcO8qDAu7L4')], ['Ravello', ig('DaSyscJNtlk')], ['Maiori', ig('DaSgM8AN9RX')]] }),

    /* ---------------- ITÁLIA · CILENTO ---------------- */
    T({ id: 'cilento-mar', type: 'exclusivo', region: 'cilento', order: 6,
      photo: 'fotos/r-cilento.svg', duration: 'A combinar · de barco',
      name: { pt: 'Cilento pelo mar: 5 grutas e 3 praias', en: 'Cilento by sea: 5 caves and 3 beaches' },
      tagline: { pt: '"5 grutas e 3 praias quase exclusivas" no mar Tirreno.', en: '' },
      desc: { pt: 'De barco pelo mar Tirreno: 5 grutas e 3 praias quase exclusivas.\n\nNo caminho, Marina di Camerota, San Marco e Castellabate.', en: '' },
      videos: [['O passeio de barco', ig('Dd7Bi4uuyWa')], ['Marina di Camerota', ig('DaK_-9ntIOL')], ['Castellabate', ig('DaP6Ns0ozz8')], ['San Marco', ig('DaNT5BvtJWc')]] }),

    T({ id: 'cilento-campo-mesa', type: 'museum', region: 'cilento', order: 7,
      photo: 'fotos/r-cilento.svg', duration: 'Dia inteiro',
      name: { pt: 'Cilento do campo à mesa: a dieta mediterrânea', en: 'Cilento from field to table: the Mediterranean diet' },
      tagline: { pt: 'Colher na horta do pescador Roberto e comer com a chef Amabile.', en: '' },
      desc: { pt: 'Uma experiência gastronômica de dia inteiro na terra da dieta mediterrânea: colher na horta do pescador Roberto, o almoço com a chef Amabile, os vilarejos de pescadores e as torres de vigia do Mediterrâneo.', en: '' },
      videos: [['Do campo à mesa', ig('DcJVfZUNT8E')], ['A dieta mediterrânea', ig('DcySynbNUtv')], ['A chef Amabile', ig('DaRAZACOezy')], ['As torres', ig('Dcq_oCktM7w')], ['O vilarejo', ig('DaLpjsCuL1w')]] }),

    /* ---------------- ITÁLIA · BENEVENTO ---------------- */
    T({ id: 'benevento-falanghina', type: 'day', region: 'benevento', order: 8,
      photo: 'fotos/r-benevento.svg', duration: 'A combinar · de carro, saindo de Nápoles',
      name: { pt: 'Benevento: a Falanghina e o chef Davide', en: 'Benevento: Falanghina wine and chef Davide' },
      tagline: { pt: 'Os vinhedos da Falanghina e o almoço na trattoria do chef Davide, em Telese.', en: '' },
      desc: { pt: 'De carro, saindo de Nápoles: os vinhedos da Falanghina, a uva branca do sul da Itália, e o almoço na trattoria do chef Davide, em Telese.', en: '' },
      videos: [['A Falanghina', ig('DdRZbHPNLUg')], ['O chef Davide em Telese', ig('DcR6KPcx9_p')], ['Benevento', ig('Dc84eZNN7Cz')]] }),

    /* ---------------- ITÁLIA · SICÍLIA ---------------- */
    T({ id: 'sicilia-etna', type: 'day', region: 'sicilia', order: 9,
      photo: 'fotos/r-sicilia.svg', duration: 'Vários dias ou bate-volta · de carro',
      name: { pt: 'Sicília autêntica: o Etna e a cozinha de Randazzo', en: 'Authentic Sicily: Etna and the cooking of Randazzo' },
      tagline: { pt: 'A trattoria da Mamma Paolina, os pansotti ao pistache, as ervas do Etna e os doces da ilha.', en: '' },
      desc: { pt: 'De carro pela Sicília, num roteiro de vários dias ou num bate-volta: a trattoria da Mamma Paolina Mannino em Randazzo, com pansotti ao molho de pistache e ervas do Etna, e os doces da Sicília.', en: '' },
      videos: [['Mamma Paolina', ig('DZaf-lahH1N')], ['As delícias da Sicília', ig('DZaxoRTtoPQ')]] }),

    /* ---------------- PORTUGAL · ALGARVE ---------------- */
    T({ id: 'tavira-ria-formosa', type: 'photo', region: 'algarve', order: 10, destaque: true,
      photo: 'fotos/r-algarve.svg', duration: 'Meio dia ou dia inteiro',
      name: { pt: 'Tavira e as praias da Ria Formosa: Ilha de Tavira e Praia do Barril', en: 'Tavira and the Ria Formosa beaches' },
      tagline: { pt: 'A Ilha de Tavira, a praia que eu mais gosto na região, e a Praia do Barril. Sem escada nem caminhada longa.', en: '' },
      desc: { pt: 'As praias de Tavira, onde eu moro: a Ilha de Tavira, a praia que eu mais gosto na região, e a Praia do Barril.\n\nSão praias sem escada nem caminhada longa.', en: '' },
      videos: [['Ilha de Tavira', ig('DcYTGxIOS7k')], ['Praia do Barril', ig('DcVillSOQ-R')], ['Praias sem escada', ig('DcdcZFkOEkt')], ['Praias do Algarve', ig('DdpG6wBOgIn')]] }),

    /* RASCUNHO: não aparece na vitrine até ela confirmar ("Ilha Perdida"?) */
    T({ id: 'olhao-ilhas', type: 'exclusivo', region: 'algarve', order: 11, status: 'draft',
      photo: 'fotos/r-algarve.svg', duration: 'A combinar · de barco',
      name: { pt: 'Olhão e as ilhas da Ria Formosa: Armona, Culatra e Ilha Deserta', en: 'Olhão and the Ria Formosa islands' },
      tagline: { pt: 'O mercado de Olhão e o barco para a Armona e a Culatra.', en: '' },
      desc: { pt: 'O mercado de Olhão e o barco do cais de Olhão para a Armona e para a Culatra, a vila de pescadores sem carros. A Ilha Deserta sai mais fácil de Faro.\n\n[A confirmar com a Sandra: o roteiro, a "Ilha Perdida" e os horários de barco, que mudam com a estação.]', en: '' },
      videos: [] }),

    /* SERVIÇO INTERNO (não aparece na vitrine nem em "Meus passeios"): dá nome
       às reservas que nascem de um orçamento de transfer. */
    T({ id: 'transfer', type: 'day', region: 'italia-portugal', order: 99, status: 'draft', oculto: true, servico: true, naoOcupaDia: true,
      photo: 'fotos/r-italia-portugal.svg', duration: 'A combinar',
      name: { pt: 'Transfer', en: 'Transfer' }, tagline: { pt: '', en: '' }, desc: { pt: '', en: '' }, videos: [] }),
  ];
}
/* o nome antigo continua valendo (store.js, testes e salas-supabase/gera-estado.js) */
const catalogoCarol = catalogoSandra;

/* 2.5 -> "2h30"; 4 -> "4h" */
function rotuloHoras(h) { const i = Math.floor(h), m = Math.round((h - i) * 60); return i + 'h' + (m ? String(m).padStart(2, '0') : ''); }

if (typeof module !== 'undefined') module.exports = { catalogoSandra, catalogoCarol, rotuloHoras, POLITICA_SANDRA };

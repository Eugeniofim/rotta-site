/* Identidade deste app: o ÚNICO lugar que sabe de quem é o app e qual banco usar.
   nuvem.js, auth.js, pedidos.js e app.js leem daqui e não trazem endereço nem marca fixos.

   AD7 IMÓVEIS · ADRIANA (22/10/2026) — cliente da Ti Artes.
   Assessoria imobiliária em Pontal do Sul (Pontal do Paraná/PR): compra, venda,
   aluguel e temporada. Os 116 imóveis vêm do site atual dela (Tecimob) pelo
   importador dados/importa-tecimob.py.

   Versão 0.1 = só no aparelho (supabaseUrl vazio): os pedidos da área do cliente
   ficam neste navegador e saem pelo WhatsApp. Para ir ao ar com banco: sala no
   Supabase do estúdio (ver README.md). */
var APP_CONFIG = {
  nome: 'AD7 Imóveis',
  slogan: 'Assessoria imobiliária',
  dona: 'Adriana',
  creci: 'CRECI-PR 6205',          /* confirmar com ela: nos anúncios aparece "Imobiliária Dias CRECI 6205" */
  cnpj: '21.866.153/0001-96',
  endereco: 'Av. Beira Mar, 210 · Pontal do Sul',
  cidade: 'Pontal do Paraná/PR · 83255-000',
  whatsapp: '5541997811184',       /* atendimento geral */
  whatsappAdriana: '5541996366637',
  fixo: '(41) 3455-2503',
  email: 'adriana@ad7imoveis.com.br',
  emailPrivacidade: 'privacidade@ad7imoveis.com.br',
  instagram: 'https://www.instagram.com/ad7imoveis',
  facebook: 'https://www.facebook.com/profile.php?id=100094268002270',
  horario: 'Segunda a sábado, das 9h às 18h',

  supabaseUrl: '',   /* vazio = sem banco ainda. Com sala: o projeto Pro do estúdio */
  supabaseKey: '',   /* a chave "publishable" do projeto; nunca a secreta */
  sala: '',          /* schema do banco (ex.: 'ad7'); vazio = sem banco */
};

/* O que o publicar.sh grava no config.js da cópia publicada (nunca aqui no fonte). */
var APP_NUVEM_PRODUCAO = {
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* projeto Pro da Ti Artes (sala ad7, criada 23/10/2026) */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   /* a publicável: quem protege é a RLS da sala */
  sala: 'ad7',
  endereco: 'https://ad7.eugeniofim.com',   /* por enquanto no estúdio; o domínio dela (ad7imoveis.com.br) está no Tecimob */
};

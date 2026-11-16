/* Identidade deste app: o ÚNICO lugar que sabe de quem é o app e qual banco usar.
   nuvem.js, auth.js, whats.js e app.js leem daqui e não trazem endereço nem marca fixos.

   PONTA DA AREIA IMÓVEIS (03/11/2026) — cliente da Ti Artes.
   Imobiliária de Pontal do Paraná/PR, 3 lojas (Pontal do Sul, Atami Norte, Atami Sul).
   O site deles é outro (pontadaareiaimoveis.com.br, feito em Work Control): este app é
   o PAINEL do robô de atendimento — as conversas do WhatsApp, os leads e os imóveis,
   que vêm da API do site deles pelo dados/importa-api.py (o token fica no Mac).

   No fonte o banco fica vazio: abre a demonstração com conversas de exemplo.
   O publicar grava APP_NUVEM_PRODUCAO só na cópia publicada. */
var APP_CONFIG = {
  nome: 'Ponta d’a Areia Imóveis',
  curto: 'Ponta d’a Areia',           /* como o app e o robô chamam a imobiliária numa frase */
  site: 'https://www.pontadaareiaimoveis.com.br',
  instagram: 'https://www.instagram.com/pontadareiaimoveis',
  fixo: '(41) 3455-1277',

  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* vazio = demonstração sem banco. Com sala: o projeto Pro do estúdio */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   /* a chave "publishable" do projeto; nunca a secreta */
  sala: 'pontadaareia',          /* schema do banco ('pontadaareia'); vazio = sem banco */
};

/* O que o publicar grava no config.js da cópia publicada (nunca aqui no fonte). */
var APP_NUVEM_PRODUCAO = {
  supabaseUrl: 'https://uopfqlogjzuqpabptxkb.supabase.co',   /* projeto Pro da Ti Artes */
  supabaseKey: 'sb_publishable_VKIdd2RNpMf3e4IEDprxJw_TOKPIHT2',   /* a publicável: quem protege é a RLS da sala */
  sala: 'pontadaareia',
};

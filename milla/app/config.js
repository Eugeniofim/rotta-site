/* Identidade deste app: o ÚNICO lugar que sabe de quem é o app e qual banco usar.
   nuvem.js, auth.js, whats.js e app.js leem daqui e não trazem endereço nem marca fixos.

   APP DA MILLA (10/11/2026). No fonte fica a DEMONSTRAÇÃO: marca fictícia, dados
   inventados, sem banco. Desde 16/11/2026 a demonstração é a "Imobiliária Milla", a mesma
   do site de demonstração (rottaguide.com/milla/imobiliaria): os mesmos 60 imóveis e a
   mesma equipe (Carla, Rafael, Bianca). Cada imobiliária ganha a sua cópia publicada com o config
   dela (clientes/<slug>.js) e a sala dela no banco — jamais misturar uma com outra. */
var APP_CONFIG = {
  nome: "Imobiliária Milla",
  curto: "Imobiliária Milla",
  site: 'https://rottaguide.com/milla/imobiliaria/',
  instagram: '',
  fixo: '',
  supabaseUrl: '',   /* vazio = demonstração sem banco */
  supabaseKey: '',
  sala: '',
};

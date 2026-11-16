/* =====================================================
   NUVEM — a porta para o banco (Supabase), lendo tudo do config.js.
   Sem supabaseUrl, nada sai do navegador: os pedidos ficam no aparelho
   e vão pelo WhatsApp. É assim que o app nasce (versão 0.1).
   ===================================================== */
'use strict';

const SUPA_URL = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.supabaseUrl) || '';
const SUPA_KEY = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.supabaseKey) || '';
const SUPA_SALA = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.sala) || '';
const NUVEM_PRAZO = 12000;   /* celular com sinal fraco: resposta em vez de tela parada */

function temNuvem() { return !!(SUPA_URL && SUPA_KEY); }

/* a sala é um schema do projeto do estúdio: o PostgREST escolhe pelo cabeçalho */
function cabSala(metodo) {
  if (!SUPA_SALA) return {};
  return metodo === 'GET' || metodo === 'HEAD' ? { 'Accept-Profile': SUPA_SALA } : { 'Content-Profile': SUPA_SALA };
}

async function supaFetch(path, opts = {}) {
  if (!temNuvem()) throw new Error('sem nuvem');
  const metodo = String(opts.method || 'GET').toUpperCase();
  const tok = (typeof authToken === 'function' && authToken()) || SUPA_KEY;
  const headers = { apikey: SUPA_KEY, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', ...cabSala(metodo), ...(opts.headers || {}) };
  const ctrl = new AbortController();
  const corta = setTimeout(() => ctrl.abort(), NUVEM_PRAZO);
  try {
    return await fetch(SUPA_URL + '/rest/v1/' + path, { ...opts, method: metodo, headers, signal: ctrl.signal });
  } finally { clearTimeout(corta); }
}

if (typeof module !== 'undefined') module.exports = { temNuvem, cabSala, supaFetch };

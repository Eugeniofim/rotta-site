/* =====================================================
   BANCO DE PONTOS TURÍSTICOS — Sandra Santos · Sikania Tour (17/10/2026)

   Nasce VAZIO de propósito: os pontos e os textos são dela (Nápoles,
   Amalfi, Cilento, Benevento, Sicília, Algarve). Ela cria no painel
   (Pontos turísticos → + Novo ponto) ou importa o mapa dela do Google
   My Maps (KML). O que ela grava mora em DB.pontos.
   ===================================================== */
'use strict';

const PONTOS = [];

const AREAS = {
  napoles: 'Nápoles', amalfi: 'Costa Amalfitana', cilento: 'Cilento', benevento: 'Benevento',
  sicilia: 'Sicília', algarve: 'Algarve', outros: 'Outros lugares',
};
function ponto(id) { return (typeof DB !== 'undefined' && DB && Array.isArray(DB.pontos) && DB.pontos.find(p => p.id === id)) || PONTOS.find(p => p.id === id) || null; }

if (typeof module !== 'undefined') module.exports = { PONTOS, AREAS, ponto };

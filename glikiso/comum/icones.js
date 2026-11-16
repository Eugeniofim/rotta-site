/* Ícones de linha (24×24), no tom sóbrio da marca: nada de emoji. */
(function () {
  const L = (d, extra = "") => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
  window.ICONE = {
    casa: L('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>'),
    presente: L('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-1.5-3-5-3.5-5-1.2C7 8 9.5 8 12 8Zm0 0c1.5-3 5-3.5 5-1.2C17 8 14.5 8 12 8Z"/>'),
    sino: L('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
    usuario: L('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    qr: L('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>'),
    ticket: L('<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3v2Z"/><path d="M14 6v12" stroke-dasharray="2 2"/>'),
    cookie: L('<circle cx="12" cy="12" r="9"/><path d="M8.5 9h.01M14 8h.01M15.5 13h.01M10 15h.01M12 11.5h.01" stroke-width="2.6"/>'),
    estrela: L('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>'),
    compartilhar: L('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
    maquina: L('<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6h5v9H8zM16 7v1M16 11v1M8 18.5h8"/>'),
    sacola: L('<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
    loja: L('<path d="M4 9h16l-1-5H5L4 9Z"/><path d="M5 9v11h14V9M10 20v-5h4v5"/>'),
    pino: L('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    mais: L('<path d="M12 5v14M5 12h14"/>'),
    check: L('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    fechar: L('<path d="M6 6l12 12M18 6 6 18"/>'),
    voltar: L('<path d="M15 5l-7 7 7 7"/>'),
    imprimir: L('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
    grafico: L('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    megafone: L('<path d="M3 10v4h3l7 4V6L6 10H3Z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>'),
    ajustes: L('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'),
    busca: L('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
    grupo: L('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>'),
    relogio: L('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    whats: '<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>'
  };
  /* QR em SVG (biblioteca qrcode-generator do cdnjs). */
  window.qrSVG = function (texto, tamanho = 180) {
    if (!window.qrcode) return "";
    const q = window.qrcode(0, "M");
    q.addData(texto);
    q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="${tamanho}" height="${tamanho}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#2a1913"/></svg>`;
  };
})();

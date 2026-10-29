#!/usr/bin/env python3
"""Monta o protótipo:
   - anirvana.html          → arquivo único para o Artifact (claude.ai)
   - dist/anirvana/         → app instalável para o endereço próprio (rottaguide.com/anirvana)
"""
import base64, json, re, sys
from pathlib import Path

RAIZ = Path(__file__).parent
SRC = RAIZ / 'src'
LUCIDE = Path(sys.argv[1]) if len(sys.argv) > 1 else None
SCRIPTS = ['data.js', 'engine.js', 'ui-base.js', 'ui-admin.js', 'ui-instr.js', 'ui-aluno.js', 'ui-loja.js', 'main.js', 'pwa.js']
CACHE = 'anirvana-v1'   # SUBIR ESTE NÚMERO A CADA PUBLICAÇÃO NO ENDEREÇO PRÓPRIO

js = '\n'.join((SRC / f).read_text() for f in SCRIPTS)
css = (SRC / 'style.css').read_text()

# ícones: só os nomes do Lucide que aparecem no código
icones = {}
nomes = set(re.findall(r"['\"`]([a-z][a-z0-9-]*)['\"`]", js))
for n in sorted(nomes):
    f = LUCIDE / f'{n}.svg'
    if f.exists():
        svg = f.read_text()
        corpo = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
        corpo = re.sub(r'<!--.*?-->', '', corpo, flags=re.S)
        icones[n] = re.sub(r'\s+', ' ', corpo).strip()

logo = base64.b64encode((SRC / 'logo-site.png').read_bytes()).decode()
FONTES = 'https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@600;700;800&family=Figtree:wght@400;500;600;700;800&display=swap'

corpo = f'''<div id="root"></div>
<div class="scrim" id="scrim"></div>
<div class="sheet" id="sheet" aria-live="polite"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<div class="nova-bar" id="novaBar" role="status">
  <div style="flex:1;min-width:0"><div class="t">Tem uma versão nova</div><div class="s">Seus dados ficam como estão. Leva um segundo.</div></div>
  <button class="btn pri sm" id="btnNova">Atualizar</button>
  <button class="iconbtn" id="btnNovaX" aria-label="Fechar aviso">×</button>
</div>
<script>
const ICONS = {json.dumps(icones, ensure_ascii=False)};
const LOGO_MARK = "data:image/png;base64,{logo}";
{js}
</script>
'''

# 1) Artifact: o claude.ai coloca o esqueleto (doctype, head, body)
artifact = f'''<title>Espaço Anirvana</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Protótipo do app do Espaço Anirvana: administração, instrutores e alunos">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTES}">
<style>
{css}
</style>
{corpo}'''
(RAIZ / 'anirvana.html').write_text(artifact)

# 2) App instalável: documento completo + manifest + service worker
DIST = RAIZ / 'dist' / 'anirvana'
DIST.mkdir(parents=True, exist_ok=True)
pagina = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Espaço Anirvana</title>
<meta name="description" content="App do Espaço Anirvana: administração, instrutores e alunos">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F5E3B8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1B1712" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="icone-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Anirvana">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTES}">
<style>
:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}
{css}
</style>
</head>
<body>
{corpo}</body>
</html>
'''
(DIST / 'index.html').write_text(pagina)

(DIST / 'manifest.webmanifest').write_text(json.dumps({
    'name': 'Espaço Anirvana', 'short_name': 'Anirvana', 'lang': 'pt-BR',
    'description': 'Administração, instrutores e alunos do Espaço Anirvana',
    'start_url': './', 'scope': './', 'display': 'standalone',
    'background_color': '#F5E3B8', 'theme_color': '#F5E3B8',
    'icons': [
        {'src': 'icone-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any maskable'},
        {'src': 'icone-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'},
    ],
}, ensure_ascii=False, indent=2))

(DIST / 'sw.js').write_text(f'''const CACHE = '{CACHE}';   /* SUBIR ESTE NÚMERO A CADA PUBLICAÇÃO */
const ESSENCIAL = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './favicon.png'];

self.addEventListener('install', e => {{
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESSENCIAL)));
}});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('anirvana-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
}});
/* a página pede a troca quando a pessoa aperta "Atualizar" — nunca sozinho */
self.addEventListener('message', e => {{
  if (e.data && e.data.tipo === 'assumir') self.skipWaiting();
}});
self.addEventListener('fetch', e => {{
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  const ehApp = req.mode === 'navigate' || req.destination === 'document' || /\\/(index\\.html)?$/.test(new URL(req.url).pathname);
  const pedido = ehApp ? fetch(new Request(req.url, {{cache:'no-store', credentials:'same-origin'}})) : fetch(req);
  e.respondWith(pedido
    .then(res => {{
      if (res && res.ok) {{ const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {{}}); }}
      return res;
    }})
    .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
}});
''')

print(f'{RAIZ / "anirvana.html"} · {len(artifact)/1024:.0f} KB · {len(icones)} ícones')
print(f'{DIST} · index {len(pagina)/1024:.0f} KB · cache {CACHE}')

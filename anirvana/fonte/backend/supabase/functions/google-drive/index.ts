// CONECTAR O GOOGLE DRIVE (backup 2 na nuvem) — o botão "Conectar o Google Drive" em Mensalidades → Regras.
// 1) o app abre  <funções>/google-drive?acao=conectar&token=<token de login da administração>
// 2) a função confere que é a administração, guarda um "estado" de uso único (10 min) e manda para a tela do Google.
//    Permissão pedida: drive.file (o app só enxerga os arquivos que ele mesmo cria; o resto do Drive fica fechado).
// 3) o Google volta com ?code=...&state=...: a função troca o code pela permissão de longo prazo (refresh token),
//    cria a pasta "Backups Anirvana" e guarda tudo em conexao_google, que nenhum login lê.
// 4) volta para o app. Daí em diante o backup-mensal põe o Excel na pasta todo dia 15.
// Desconectar: POST {"acao":"desconectar"} com Authorization: Bearer <token de login da administração>.
// Publicar SEM conferência de JWT (o Google volta sem login): supabase functions deploy google-drive --no-verify-jwt
// Segredos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, APP_URL
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ESCOPO = 'openid email https://www.googleapis.com/auth/drive.file';
const voltar = (ok: boolean, msg = '') => Response.redirect(`${Deno.env.get('APP_URL') ?? 'https://rottaguide.com/anirvana/'}?drive=${ok ? 'ok' : 'erro'}${msg ? '&msg=' + encodeURIComponent(msg) : ''}#admin-mensalidades`, 302);

Deno.serve(async (req: Request) => {
  const url = new URL(req.url), base = Deno.env.get('SUPABASE_URL')!;
  const db = createClient(base, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const retorno = `${base}/functions/v1/google-drive`;
  const ehAdmin = async (token: string | null) => {
    if (!token) return null;
    const { data } = await db.auth.getUser(token);
    if (!data?.user) return null;
    const { data: p } = await db.from('perfis').select('papel').eq('user_id', data.user.id).maybeSingle();
    return p?.papel === 'admin' ? data.user.id : null;
  };

  // ---------- desconectar ----------
  if (req.method === 'POST') {
    const corpo = await req.json().catch(() => ({}));
    const quem = await ehAdmin((req.headers.get('Authorization') ?? '').replace(/^Bearer /, ''));
    if (!quem) return new Response('só a administração', { status: 403 });
    if (corpo.acao !== 'desconectar') return new Response('ação desconhecida', { status: 400 });
    const { data: cx } = await db.from('conexao_google').select('refresh_token').eq('id', 1).maybeSingle();
    if (cx?.refresh_token) await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(cx.refresh_token), { method: 'POST' }).catch(() => {});
    await db.from('conexao_google').delete().eq('id', 1);
    return Response.json({ desconectado: true });
  }

  // ---------- 1 e 2: ir para a tela do Google ----------
  if (url.searchParams.get('acao') === 'conectar') {
    const quem = await ehAdmin(url.searchParams.get('token'));
    if (!quem) return voltar(false, 'Só a administração conecta o Drive.');
    const estado = crypto.randomUUID();
    await db.from('oauth_estado').delete().lt('criado_em', new Date(Date.now() - 10 * 60e3).toISOString());
    await db.from('oauth_estado').insert({ estado, user_id: quem });
    const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    g.search = new URLSearchParams({ client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!, redirect_uri: retorno, response_type: 'code', scope: ESCOPO,
      access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: estado }).toString();
    return Response.redirect(g.toString(), 302);
  }

  // ---------- 3: o Google voltou ----------
  const code = url.searchParams.get('code'), estado = url.searchParams.get('state');
  if (!code || !estado) return voltar(false, url.searchParams.get('error') === 'access_denied' ? 'Conexão cancelada.' : 'Link inválido.');
  const { data: st } = await db.from('oauth_estado').select('user_id, criado_em').eq('estado', estado).maybeSingle();
  await db.from('oauth_estado').delete().eq('estado', estado);                       // uso único
  if (!st || Date.now() - new Date(st.criado_em).getTime() > 10 * 60e3) return voltar(false, 'O link expirou. Toque em Conectar de novo.');
  const t = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!, client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!, redirect_uri: retorno, grant_type: 'authorization_code' }) });
  if (!t.ok) return voltar(false, 'O Google não aceitou a conexão.');
  const tok = await t.json();
  if (!tok.refresh_token) return voltar(false, 'O Google não mandou a permissão de longo prazo. Tire o acesso do app na conta Google e conecte de novo.');
  const eu = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } }).then(r => r.json()).catch(() => ({}));
  const p = await fetch('https://www.googleapis.com/drive/v3/files', { method: 'POST', headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Backups Anirvana', mimeType: 'application/vnd.google-apps.folder' }) });
  const pasta = p.ok ? (await p.json()).id : null;
  const { error } = await db.from('conexao_google').upsert({ id: 1, conta: eu.email ?? 'conta Google', refresh_token: tok.refresh_token, pasta_id: pasta, conectado_por: st.user_id, conectado_em: new Date().toISOString(), ultimo_envio: null });
  if (error) return voltar(false, 'Não deu para guardar a conexão.');
  return voltar(true);
});

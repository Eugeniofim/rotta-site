-- SITE DA AD7 (31/10/2026) — o que o site precisa do banco. Quem roda é o Eugênio:
-- supabase.com → projeto "APP gestão TI ARTES" (uopfqlogjzuqpabptxkb) → SQL Editor → New query → colar tudo → Run.
-- Pode rodar mais de uma vez: não apaga nada.

-- 1) O site lê sem login o calendário de temporada e a vitrine da home (o que a AD7 marca no painel).
drop policy if exists itens_disponibilidade_publica on ad7.itens;
create policy itens_disponibilidade_publica on ad7.itens for select to anon, authenticated
  using (colecao in ('disponibilidade', 'vitrine') and apagado = false);
grant select on ad7.itens to anon;

-- 2) Cada pedido do site (interesse, contato, visita, anúncio, área do cliente) vira um e-mail para a AD7,
--    pela função "avisos" + Brevo, a mesma dos outros apps do estúdio (AVISOS.sql já criou public.aviso_novo).
drop trigger if exists aviso_novo on ad7.pedidos;
create trigger aviso_novo after insert on ad7.pedidos for each row execute function public.aviso_novo();

-- 3) Para quem vai o e-mail e com que nome. (Trocar o e-mail aqui quando ela migrar a caixa.)
update ad7.appstate
   set data = coalesce(data, '{}'::jsonb) || '{"settings": {"admEmail": "adriana@ad7imoveis.com.br", "negocio": "AD7 Imóveis"}}'::jsonb
 where id = 1;

-- conferir: a política, o gatilho e o e-mail
select policyname from pg_policies where schemaname = 'ad7' and tablename = 'itens';
select trigger_name from information_schema.triggers where event_object_schema = 'ad7' and event_object_table = 'pedidos';
select data->'settings' from ad7.appstate where id = 1;

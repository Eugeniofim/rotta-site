-- =====================================================================
-- SALA "anirvana" no Supabase do estúdio Ti Artes (projeto Pro, cópia diária)
-- Um banco, muitas janelas: cada registro do app é uma linha em anirvana.itens.
-- Ninguém lê a tabela direto: tudo passa pelas funções abaixo, que conferem
-- o token do aparelho e mostram a cada papel só o que é dele.
--   dono / adm  -> tudo
--   instrutor   -> aulas, chamada, alunos (sem CPF, e-mail, endereço), valores do mês
--   aluno       -> a própria ficha, pagamentos, presenças + agenda e eventos
-- Idempotente: pode rodar de novo sem perder nada.
-- =====================================================================
create schema if not exists anirvana;
grant usage on schema anirvana to anon, authenticated;

create table if not exists anirvana.itens (
  colecao text not null,
  id text not null,
  dados jsonb,
  ordem bigint not null default 0,
  apagado boolean not null default false,          -- apagar = marcar, nunca sumir
  atualizado_em timestamptz not null default clock_timestamp(),   -- o SERVIDOR carimba
  por text,
  primary key (colecao, id));
create index if not exists itens_atualizado on anirvana.itens (atualizado_em, colecao, id);

-- códigos de acesso da administração (no banco fica só o hash)
create table if not exists anirvana.acessos (
  pessoa text primary key,
  nome text not null,
  papel text not null check (papel in ('dono','adm')),
  codigo_hash text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now());

-- cada aparelho que entrou: o token fica só com o aparelho; aqui, o hash
create table if not exists anirvana.aparelhos (
  token_hash text primary key,
  papel text not null,
  quem text not null,
  alunos text[],
  v int,
  nome text,
  aparelho text,
  criado_em timestamptz not null default now(),
  visto_em timestamptz not null default now(),
  revogado boolean not null default false);

create table if not exists anirvana.tentativas (
  id bigserial primary key,
  tipo text not null,
  em timestamptz not null default now());
create index if not exists tentativas_tipo_em on anirvana.tentativas (tipo, em);

alter table anirvana.itens enable row level security;
alter table anirvana.acessos enable row level security;
alter table anirvana.aparelhos enable row level security;
alter table anirvana.tentativas enable row level security;
revoke all on all tables in schema anirvana from public, anon, authenticated;
revoke all on all sequences in schema anirvana from public, anon, authenticated;

-- ---------- utilidades ----------
create or replace function anirvana.h(p text) returns text language sql immutable
as $$ select encode(sha256(convert_to(coalesce(p, ''), 'UTF8')), 'hex') $$;

create or replace function anirvana.dig(p text) returns text language sql immutable
as $$ select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 11) $$;

create or replace function anirvana.agora_us() returns bigint language sql volatile
as $$ select (extract(epoch from clock_timestamp()) * 1000000)::bigint $$;

create or replace function anirvana.novo_token() returns text language sql volatile
as $$ select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') $$;

create or replace function anirvana.ping() returns void language plpgsql security definer set search_path = anirvana, public
as $$ begin
  perform realtime.send(jsonb_build_object('em', now()), 'mudou', 'anirvana-mudou', false);
exception when others then null;   -- o aviso é só um cutucão; os aparelhos também conferem sozinhos
end $$;

-- muitas tentativas erradas em 15 minutos: a porta fecha por um tempo
create or replace function anirvana.freio(p_tipo text, p_max int) returns boolean language sql stable security definer set search_path = anirvana, public
as $$ select count(*) >= p_max from anirvana.tentativas where tipo = p_tipo and em > now() - interval '15 minutes' $$;

-- ---------- sessão do aparelho ----------
create or replace function anirvana.sessao(p_token text) returns anirvana.aparelhos
language plpgsql security definer set search_path = anirvana, public as $$
declare a anirvana.aparelhos; cod jsonb; eq jsonb;
begin
  select * into a from anirvana.aparelhos where token_hash = anirvana.h(p_token) and not revogado;
  if not found then raise exception 'sessao: aparelho sem acesso'; end if;
  if a.papel in ('dono', 'adm') then
    if not exists (select 1 from anirvana.acessos where pessoa = a.quem and ativo) then raise exception 'sessao: acesso desligado'; end if;
  elsif a.papel = 'instrutor' then
    select dados into cod from anirvana.itens where colecao = 'codigos' and id = a.quem and not apagado;
    select dados into eq from anirvana.itens where colecao = 'equipe' and id = a.quem and not apagado;
    if cod is null or eq is null or coalesce((eq->>'ativo')::boolean, true) = false
       or coalesce((cod->>'v')::int, 0) <> coalesce(a.v, 0) then
      raise exception 'sessao: PIN trocado ou instrutor fora da equipe';
    end if;
  end if;
  if a.visto_em < now() - interval '10 minutes' then
    update anirvana.aparelhos set visto_em = now() where token_hash = a.token_hash;
  end if;
  return a;
end $$;

-- ---------- quem vê o quê ----------
create or replace function anirvana.pode_ver(a anirvana.aparelhos, c text, i text, d jsonb) returns boolean
language sql stable as $$
  select case
    when a.papel in ('dono', 'adm') then true
    when a.papel = 'instrutor' then c = any (array['aulas','presencas','subs','equipe','turmasNovas','turmasFora','turmaInstr',
         'feriados','regras','atividades','eventos','terapias','config','codigos','alunos','consent','pagamentos','descontos',
         'repEquipe','pacotes','fechados','cats'])
    when a.papel = 'aluno' then
         c = any (array['aulas','subs','equipe','turmasNovas','turmasFora','turmaInstr','feriados','regras','atividades',
                        'eventos','terapias','config','pacotes'])
      or (c = 'alunos' and i = any (a.alunos))
      or (c in ('consent', 'pontosAcoes') and i = any (a.alunos))
      or (c in ('pagamentos', 'avisosPag', 'presencas', 'trocas') and coalesce(d->>'a', '') = any (a.alunos))
      or (c = 'formandos' and coalesce(d->>'aluno', '') = any (a.alunos))
    else false end
$$;

-- o que sai de cada linha para cada papel (instrutor não vê CPF, e-mail, endereço nem a chave Pix dos colegas)
create or replace function anirvana.filtrar(a anirvana.aparelhos, c text, i text, d jsonb) returns jsonb
language sql stable as $$
  select case
    when d is null or jsonb_typeof(d) <> 'object' or a.papel in ('dono', 'adm') then d
    when c = 'alunos' then (d - array['cpf','email','endereco','rg'])
         #- '{ficha,respostas,cpf}' #- '{ficha,respostas,email}' #- '{ficha,respostas,endereco}' #- '{ficha,respostas,rg}'
    when c = 'equipe' and i <> a.quem then d - 'pix'
    when c = 'codigos' and i <> a.quem then d - 'c'
    when c = 'config' and a.papel = 'instrutor' then d - 'drive'
    when c = 'config' and a.papel = 'aluno' then d - 'drive'
    else d end
$$;

-- ---------- quem grava o quê ----------
create or replace function anirvana.pode_gravar(a anirvana.aparelhos, c text, i text, d jsonb, x boolean) returns boolean
language sql stable as $$
  select c ~ '^[A-Za-z_][A-Za-z0-9_]{0,40}$' and length(i) between 1 and 200 and case
    when a.papel in ('dono', 'adm') then true
    when a.papel = 'instrutor' then c in ('aulas', 'presencas', 'subs')
      or (c = 'pagamentos' and not x and coalesce((d->>'avulsa')::boolean, false))
    when a.papel = 'aluno' then not x and (
         (c in ('avisosPag', 'trocas') and coalesce(d->>'a', '') = any (a.alunos))
      or (c in ('consent', 'pontosAcoes') and i = any (a.alunos)))
    else false end
$$;

-- ---------- entrar (uma vez por aparelho) ----------
-- p_papel: 'adm' (código de acesso), 'instrutor' (PIN de 6 números), 'aluno' (celular + data de nascimento)
create or replace function anirvana.entrar(p_papel text, p_codigo text, p_extra text default null, p_aparelho text default null)
returns jsonb language plpgsql security definer set search_path = anirvana, public as $$
declare tok text := anirvana.novo_token(); ac anirvana.acessos; r record; d text; ids text[]; nomes jsonb;
begin
  delete from anirvana.tentativas where em < now() - interval '2 days';
  if p_papel not in ('adm', 'instrutor', 'aluno') then return jsonb_build_object('erro', 'Entrada desconhecida.'); end if;
  if anirvana.freio(p_papel, 30) then
    return jsonb_build_object('erro', 'Muitas tentativas erradas. Espere 15 minutos e tente de novo.');
  end if;

  if p_papel = 'adm' then
    select * into ac from anirvana.acessos
     where codigo_hash = anirvana.h(upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g'))) and ativo;
    if not found then
      insert into anirvana.tentativas (tipo) values ('adm');
      return jsonb_build_object('erro', 'Código não confere. Confira as letras e os números.');
    end if;
    insert into anirvana.aparelhos (token_hash, papel, quem, nome, aparelho)
    values (anirvana.h(tok), ac.papel, ac.pessoa, ac.nome, left(p_aparelho, 120));
    return jsonb_build_object('token', tok, 'papel', ac.papel, 'quem', ac.pessoa, 'nome', ac.nome);

  elsif p_papel = 'instrutor' then
    d := regexp_replace(coalesce(p_codigo, ''), '\D', '', 'g');
    if length(d) <> 6 then return jsonb_build_object('erro', 'O PIN tem 6 números.'); end if;
    select c.id, coalesce((c.dados->>'v')::int, 0) as v, e.dados->>'nome' as nome into r
      from anirvana.itens c
      join anirvana.itens e on e.colecao = 'equipe' and e.id = c.id and not e.apagado
     where c.colecao = 'codigos' and not c.apagado and c.dados->>'c' = d
       and coalesce((e.dados->>'ativo')::boolean, true)
     limit 1;
    if not found then
      insert into anirvana.tentativas (tipo) values ('instrutor');
      return jsonb_build_object('erro', 'PIN não confere.');
    end if;
    insert into anirvana.aparelhos (token_hash, papel, quem, v, nome, aparelho)
    values (anirvana.h(tok), 'instrutor', r.id, r.v, r.nome, left(p_aparelho, 120));
    return jsonb_build_object('token', tok, 'papel', 'instrutor', 'quem', r.id, 'nome', r.nome, 'v', r.v);

  else
    d := anirvana.dig(p_codigo);
    if length(d) < 10 then return jsonb_build_object('erro', 'Digite o celular com DDD.'); end if;
    select array_agg(id order by id), jsonb_agg(jsonb_build_object('id', id, 'nome', dados->>'nome') order by id) into ids, nomes
      from anirvana.itens
     where colecao = 'alunos' and not apagado and coalesce(dados->>'status', 'ativo') <> 'inativo'
       and (anirvana.dig(dados->>'tel') = d or anirvana.dig(dados->>'respTel') = d)
       and coalesce(dados->>'nasc', '') = coalesce(p_extra, '-');
    if ids is null then
      insert into anirvana.tentativas (tipo) values ('aluno');
      return jsonb_build_object('erro', 'Não achamos esse celular com essa data de nascimento.');
    end if;
    insert into anirvana.aparelhos (token_hash, papel, quem, alunos, nome, aparelho)
    values (anirvana.h(tok), 'aluno', ids[1], ids, nomes->0->>'nome', left(p_aparelho, 120));
    return jsonb_build_object('token', tok, 'papel', 'aluno', 'quem', ids[1], 'alunos', nomes);
  end if;
end $$;

create or replace function anirvana.sair(p_token text) returns jsonb
language plpgsql security definer set search_path = anirvana, public as $$
begin
  update anirvana.aparelhos set revogado = true where token_hash = anirvana.h(p_token);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- puxar: o que mudou desde a última vez (em páginas) ----------
create or replace function anirvana.puxar(p_token text, p_desde timestamptz default null, p_cur_c text default null, p_cur_i text default null)
returns jsonb language plpgsql security definer set search_path = anirvana, public as $$
declare a anirvana.aparelhos := anirvana.sessao(p_token); lim int := 1500; linhas jsonb; n int;
begin
  with base as (
    select i.* from anirvana.itens i
     where (p_desde is null or (i.atualizado_em, i.colecao, i.id) > (p_desde, coalesce(p_cur_c, ''), coalesce(p_cur_i, '')))
       and anirvana.pode_ver(a, i.colecao, i.id, i.dados)
     order by i.atualizado_em, i.colecao, i.id
     limit lim)
  select coalesce(jsonb_agg(jsonb_build_object('c', colecao, 'i', id,
           'd', case when apagado then null else anirvana.filtrar(a, colecao, id, dados) end,
           'o', ordem, 'x', apagado, 't', atualizado_em) order by atualizado_em, colecao, id), '[]'::jsonb),
         count(*)
    into linhas, n from base;
  return jsonb_build_object('linhas', linhas, 'mais', n >= lim, 'papel', a.papel, 'quem', a.quem);
end $$;

-- ---------- enviar: as linhas que este aparelho mudou ----------
create or replace function anirvana.enviar(p_token text, p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = anirvana, public as $$
declare a anirvana.aparelhos := anirvana.sessao(p_token); it jsonb; ok int := 0; neg jsonb := '[]'::jsonb; x boolean;
begin
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then return jsonb_build_object('erro', 'lista vazia'); end if;
  if jsonb_array_length(p_itens) > 500 then return jsonb_build_object('erro', 'lote grande demais'); end if;
  for it in select * from jsonb_array_elements(p_itens) loop
    x := coalesce((it->>'x')::boolean, false);
    if not anirvana.pode_gravar(a, it->>'c', it->>'i', it->'d', x) then
      neg := neg || jsonb_build_array(jsonb_build_object('c', it->>'c', 'i', it->>'i'));
      continue;
    end if;
    insert into anirvana.itens as t (colecao, id, dados, ordem, apagado, atualizado_em, por)
    values (it->>'c', it->>'i', case when x then null else it->'d' end,
            coalesce((it->>'o')::bigint, anirvana.agora_us()), x, clock_timestamp(), a.quem)
    on conflict (colecao, id) do update
      set dados = case when excluded.apagado then t.dados else excluded.dados end,
          apagado = excluded.apagado, atualizado_em = clock_timestamp(), por = excluded.por;
    ok := ok + 1;
  end loop;
  if ok > 0 then perform anirvana.ping(); end if;
  return jsonb_build_object('ok', ok, 'negados', neg);
end $$;

-- ---------- inscrição pelo link (sem entrar) ----------
create or replace function anirvana.inscrever(p_dados jsonb)
returns jsonb language plpgsql security definer set search_path = anirvana, public as $$
declare v_id text := 'in' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
begin
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' or length(p_dados::text) > 40000
     or coalesce(btrim(p_dados->>'nome'), '') = '' then
    return jsonb_build_object('erro', 'Faltou preencher o nome.');
  end if;
  if anirvana.freio('inscricao', 60) then
    return jsonb_build_object('erro', 'Muitas inscrições agora. Tente de novo daqui a pouco ou fale com o Espaço.');
  end if;
  insert into anirvana.tentativas (tipo) values ('inscricao');
  insert into anirvana.itens (colecao, id, dados, ordem, por)
  values ('inscricoes', v_id, jsonb_build_object('id', v_id, 'd', to_char((now() at time zone 'America/Sao_Paulo')::date, 'YYYY-MM-DD'),
          'estado', 'nova', 'origem', 'app', 'dados', p_dados), anirvana.agora_us(), 'inscricao');
  perform anirvana.ping();
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

-- ---------- donos criam códigos de acesso para mais alguém da administração ----------
create or replace function anirvana.novo_acesso(p_token text, p_pessoa text, p_nome text, p_papel text default 'adm')
returns jsonb language plpgsql security definer set search_path = anirvana, public as $$
declare a anirvana.aparelhos := anirvana.sessao(p_token); alf text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; cod text := ''; k int;
begin
  if a.papel <> 'dono' then return jsonb_build_object('erro', 'Só os donos criam acessos.'); end if;
  if p_papel not in ('dono', 'adm') or coalesce(btrim(p_pessoa), '') = '' or coalesce(btrim(p_nome), '') = '' then
    return jsonb_build_object('erro', 'Faltou o nome.');
  end if;
  for k in 1..10 loop cod := cod || substr(alf, 1 + floor(random() * length(alf))::int, 1); end loop;
  insert into anirvana.acessos (pessoa, nome, papel, codigo_hash) values (p_pessoa, p_nome, p_papel, anirvana.h(cod))
  on conflict (pessoa) do update set nome = excluded.nome, papel = excluded.papel, codigo_hash = excluded.codigo_hash, ativo = true;
  update anirvana.aparelhos set revogado = true where quem = p_pessoa and papel in ('dono', 'adm');
  return jsonb_build_object('codigo', substr(cod, 1, 5) || '-' || substr(cod, 6, 5));
end $$;

-- ---------- quem pode chamar o quê ----------
revoke execute on all functions in schema anirvana from public, anon, authenticated;
grant execute on function anirvana.entrar(text, text, text, text) to anon, authenticated;
grant execute on function anirvana.sair(text) to anon, authenticated;
grant execute on function anirvana.puxar(text, timestamptz, text, text) to anon, authenticated;
grant execute on function anirvana.enviar(text, jsonb) to anon, authenticated;
grant execute on function anirvana.inscrever(jsonb) to anon, authenticated;
grant execute on function anirvana.novo_acesso(text, text, text, text) to anon, authenticated;

select 'sala anirvana pronta' as resultado, (select count(*) from anirvana.itens) as linhas;

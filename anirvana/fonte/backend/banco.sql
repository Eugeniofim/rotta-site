-- =====================================================================
-- ESPAÇO ANIRVANA — banco de dados (Supabase / Postgres 15+)
--
-- Regra de ouro (skill app-sempre-junto): um banco, muitas janelas,
-- cada registro é uma linha. O servidor carimba a hora, apagar é
-- marcar (apagado = true) e dinheiro nunca some: tudo fica na auditoria.
--
-- Rodar INTEIRO no SQL Editor do Supabase. Pode rodar de novo (idempotente).
-- Região do projeto: São Paulo (sa-east-1) — dados no Brasil.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0. utilidades
-- ---------------------------------------------------------------------
create or replace function public.carimbar() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();          -- o servidor carimba; relógio de celular não manda
  return new;
end $$;

create or replace function public.competencia(d date) returns text
language sql immutable as $$ select to_char(d, 'YYYY-MM') $$;

-- ---------------------------------------------------------------------
-- 1. cadastro: equipe, alunos, perfis de acesso
-- ---------------------------------------------------------------------
create table if not exists public.atividades (
  id            text primary key,                       -- yoga, particular, aquarela...
  nome          text not null,
  repasse       numeric(4,3) not null check (repasse between 0 and 1),   -- parte da equipe
  visibilidade  text not null check (visibilidade in ('todos','escolhido')),
  agendada      boolean not null default false,          -- massagem/terapias: hora marcada
  atualizado_em timestamptz not null default now()
);

create table if not exists public.equipe (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  nome_completo   text,
  atividades      text[] not null default '{}',
  pix_chave       text,                                   -- dado pessoal: só a administração vê
  asaas_wallet_id text,                                   -- para split automático (atividades de % fixo)
  bio             text,
  ativo           boolean not null default true,
  atualizado_em   timestamptz not null default now()
);

create table if not exists public.alunos (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null,
  telefone             text,
  email                text,
  nascimento           date,
  responsavel_nome     text,                              -- obrigatório para menor de 18 (LGPD art. 14)
  responsavel_telefone text,
  observacoes          text,                              -- NÃO usar para dados de saúde (ver consentimentos)
  desde                date not null default current_date,
  apagado              boolean not null default false,
  anonimizado_em       timestamptz,
  atualizado_em        timestamptz not null default now()
);

create table if not exists public.perfis (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  papel     text not null check (papel in ('admin','instrutor','aluno')),
  equipe_id uuid references public.equipe(id),
  aluno_id  uuid references public.alunos(id),
  criado_em timestamptz not null default now(),
  check ((papel = 'instrutor') = (equipe_id is not null)),
  check ((papel = 'aluno') = (aluno_id is not null))
);

-- quem sou eu (usadas nas regras de acesso; security definer para não depender de RLS de perfis)
create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.perfis where user_id = auth.uid() $$;
create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select papel = 'admin' from public.perfis where user_id = auth.uid()), false) $$;
create or replace function public.minha_equipe() returns uuid
language sql stable security definer set search_path = public as $$
  select equipe_id from public.perfis where user_id = auth.uid() $$;
create or replace function public.meu_aluno() returns uuid
language sql stable security definer set search_path = public as $$
  select aluno_id from public.perfis where user_id = auth.uid() $$;

-- menor de idade precisa de responsável
create or replace function public.exige_responsavel() returns trigger
language plpgsql as $$
begin
  if new.anonimizado_em is null and new.nascimento is not null
     and new.nascimento > current_date - interval '18 years'
     and coalesce(trim(new.responsavel_nome), '') = '' then
    raise exception 'Aluno menor de 18 anos: informe o responsável (LGPD art. 14).';
  end if;
  return new;
end $$;
drop trigger if exists alunos_responsavel on public.alunos;
create trigger alunos_responsavel before insert or update on public.alunos
  for each row execute function public.exige_responsavel();

-- ---------------------------------------------------------------------
-- 2. escola: planos, turmas, matrículas, aulas, presenças
-- ---------------------------------------------------------------------
create table if not exists public.planos (
  id            text primary key,                         -- yoga-1x, yoga-2x...
  atividade     text not null references public.atividades(id),
  nome          text not null,
  preco         numeric(10,2) not null check (preco > 0),
  aulas_semana  smallint check (aulas_semana between 0 and 7),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.turmas (
  id            text primary key,                         -- seg1830, qua1500...
  atividade     text not null references public.atividades(id),
  nome          text,
  dia           smallint not null check (dia between 0 and 6),
  hora          time not null,
  duracao_min   smallint not null default 75,
  instrutor_id  uuid not null references public.equipe(id),
  sala          text,
  capacidade    smallint check (capacidade > 0),
  ativa         boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.matriculas (
  id                  uuid primary key default gen_random_uuid(),
  aluno_id            uuid not null references public.alunos(id),
  atividade           text not null references public.atividades(id),
  plano_id            text references public.planos(id),
  valor               numeric(10,2) not null check (valor > 0),
  instrutor_id        uuid references public.equipe(id),  -- obrigatório quando a atividade é "escolhido"
  turmas              text[] not null default '{}',
  vencimento_dia      smallint not null check (vencimento_dia between 1 and 28),
  metodo              text not null check (metodo in ('pix','cartao','dinheiro')),
  estado              text not null default 'ativa' check (estado in ('ativa','pausada','cancelada')),
  pausa_ate           date,
  inicio              date not null default current_date,
  fim                 date,
  asaas_assinatura_id text,
  atualizado_em       timestamptz not null default now(),
  check (estado <> 'pausada' or pausa_ate is not null)
);
create index if not exists matriculas_aluno on public.matriculas (aluno_id);

create or replace function public.exige_instrutor_escolhido() returns trigger
language plpgsql as $$
begin
  if (select visibilidade from public.atividades where id = new.atividade) = 'escolhido'
     and new.instrutor_id is null then
    raise exception 'Esta atividade é com professor escolhido: informe quem dá a aula.';
  end if;
  return new;
end $$;
drop trigger if exists matriculas_instrutor on public.matriculas;
create trigger matriculas_instrutor before insert or update on public.matriculas
  for each row execute function public.exige_instrutor_escolhido();

create table if not exists public.aulas (
  id            uuid primary key default gen_random_uuid(),
  turma_id      text not null references public.turmas(id),
  data          date not null,
  instrutor_id  uuid not null references public.equipe(id),   -- quem DEU a aula (substituição conta para quem deu)
  estado        text not null default 'pendente' check (estado in ('pendente','feita','cancelada')),
  vazia         boolean not null default false,
  substituicao  boolean not null default false,
  atualizado_em timestamptz not null default now(),
  unique (turma_id, data)
);

create table if not exists public.presencas (
  id             uuid primary key default gen_random_uuid(),
  aula_id        uuid not null references public.aulas(id) on delete cascade,
  aluno_id       uuid references public.alunos(id),
  visitante_nome text,
  tipo_plano     text not null,                            -- 1x, 2x, 3x, 4x, avulsa, mensal
  registrado_por uuid default auth.uid(),
  criado_em      timestamptz not null default now(),
  check (aluno_id is not null or visitante_nome is not null),
  unique (aula_id, aluno_id)
);

create table if not exists public.confirmacoes (           -- o "Vou" do aluno
  turma_id  text not null references public.turmas(id),
  data      date not null,
  aluno_id  uuid not null references public.alunos(id),
  vai       boolean not null,
  criado_em timestamptz not null default now(),
  primary key (turma_id, data, aluno_id)
);

create table if not exists public.substituicoes (
  id             uuid primary key default gen_random_uuid(),
  turma_id       text not null references public.turmas(id),
  data           date not null,
  de_id          uuid not null references public.equipe(id),
  pedido_para_id uuid references public.equipe(id),         -- null = qualquer pessoa da atividade
  para_id        uuid references public.equipe(id),         -- quem aceitou
  motivo         text,
  estado         text not null default 'aberto' check (estado in ('aberto','aceito','cancelado')),
  recusas        uuid[] not null default '{}',
  atualizado_em  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. dinheiro: cobranças, repasses, lojinha, balanço
-- ---------------------------------------------------------------------
create table if not exists public.cobrancas (
  id            uuid primary key default gen_random_uuid(),
  matricula_id  uuid not null references public.matriculas(id),
  competencia   text not null check (competencia ~ '^\d{4}-\d{2}$'),
  valor         numeric(10,2) not null check (valor > 0),
  vencimento    date not null,
  estado        text not null default 'aberta' check (estado in ('aberta','paga','cancelada','estornada')),
  metodo        text check (metodo in ('pix','cartao','dinheiro')),
  pago_em       timestamptz,
  multa_pct     numeric(4,2) not null default 2 check (multa_pct between 0 and 2),       -- teto conservador
  juros_mes_pct numeric(4,2) not null default 1 check (juros_mes_pct between 0 and 1),
  gateway_id    text unique,                               -- id da cobrança no Asaas (nunca dados de cartão)
  atualizado_em timestamptz not null default now(),
  unique (matricula_id, competencia),                      -- o mesmo mês nunca é cobrado duas vezes
  check (estado <> 'paga' or pago_em is not null)
);

create table if not exists public.eventos_gateway (        -- idempotência do webhook
  id          text primary key,
  tipo        text not null,
  payload     jsonb not null,
  recebido_em timestamptz not null default now()
);

create table if not exists public.repasses_equipe (
  id            uuid primary key default gen_random_uuid(),
  equipe_id     uuid not null references public.equipe(id),
  competencia   text not null check (competencia ~ '^\d{4}-\d{2}$'),
  valor         numeric(12,2) not null,
  detalhe       jsonb not null default '[]',               -- itens: yoga, particular, descontos da lojinha...
  pago_em       timestamptz,
  comprovante   text,
  atualizado_em timestamptz not null default now(),
  unique (equipe_id, competencia)
);

create table if not exists public.fornecedores (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  modelo         text not null check (modelo in ('consignado','integral','proprio')),
  pct_fornecedor numeric(4,3) not null check (pct_fornecedor between 0 and 1),
  pix_chave      text,
  ativo          boolean not null default true,
  atualizado_em  timestamptz not null default now()
);

create table if not exists public.produtos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  preco         numeric(10,2) not null check (preco >= 0),
  fornecedor_id uuid not null references public.fornecedores(id),
  categoria     text,
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.vendas (
  id                 uuid primary key default gen_random_uuid(),
  data               date not null default current_date,
  forma              text not null check (forma in ('pix','debito','credito','credito2x','credito3x','dinheiro','fiado','descontado')),
  cliente_nome       text,
  desconto_equipe_id uuid references public.equipe(id),    -- "descontar do repasse" de quem é da equipe
  registrado_por     uuid default auth.uid(),
  atualizado_em      timestamptz not null default now(),
  check (forma not in ('fiado','descontado') or coalesce(trim(cliente_nome),'') <> '' or desconto_equipe_id is not null)
);

create table if not exists public.venda_itens (
  id               uuid primary key default gen_random_uuid(),
  venda_id         uuid not null references public.vendas(id) on delete cascade,
  produto_id       uuid references public.produtos(id),
  descricao        text not null,
  qtd              integer not null check (qtd > 0),
  preco_unit       numeric(10,2) not null check (preco_unit >= 0),
  fornecedor_id    uuid not null references public.fornecedores(id),
  pct_fornecedor   numeric(4,3) not null check (pct_fornecedor between 0 and 1),   -- congelado na hora da venda
  parte_fornecedor numeric(12,2) generated always as (round(qtd * preco_unit * pct_fornecedor, 2)) stored,
  parte_espaco     numeric(12,2) generated always as (round(qtd * preco_unit, 2) - round(qtd * preco_unit * pct_fornecedor, 2)) stored
);

-- o % do fornecedor vem do cadastro e fica congelado: mudar o % depois não muda venda antiga
create or replace function public.congelar_pct() returns trigger
language plpgsql as $$
begin
  if new.pct_fornecedor is null then
    select pct_fornecedor into new.pct_fornecedor from public.fornecedores where id = new.fornecedor_id;
  end if;
  return new;
end $$;
drop trigger if exists venda_itens_pct on public.venda_itens;
create trigger venda_itens_pct before insert on public.venda_itens
  for each row execute function public.congelar_pct();

create table if not exists public.repasses_fornecedor (
  id            uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id),
  valor         numeric(12,2) not null check (valor > 0),
  data          date not null default current_date,
  comprovante   text,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fiado (
  id            uuid primary key default gen_random_uuid(),
  venda_id      uuid references public.vendas(id),
  cliente_nome  text not null,
  aluno_id      uuid references public.alunos(id),
  descricao     text not null,
  valor         numeric(12,2) not null check (valor > 0),
  data          date not null default current_date,
  recebido_em   timestamptz,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.contas_fixas (
  id            text primary key,
  nome          text not null,
  categoria     text not null,
  valor         numeric(10,2) not null check (valor > 0),
  dia           smallint not null check (dia between 1 and 31),
  ativa         boolean not null default true,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.lancamentos (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('entrada','saida')),
  data          date not null,
  valor         numeric(12,2) not null check (valor > 0),
  descricao     text not null,
  categoria     text not null,
  conta_fixa_id text references public.contas_fixas(id),
  apagado       boolean not null default false,
  atualizado_em timestamptz not null default now()
);
create index if not exists lancamentos_data on public.lancamentos (data);

create table if not exists public.fechamentos (             -- mês fechado não muda mais
  competencia text primary key check (competencia ~ '^\d{4}-\d{2}$'),
  fechado_em  timestamptz not null default now(),
  fechado_por uuid default auth.uid(),
  resumo      jsonb not null default '{}'
);

-- formação de instrutores
create table if not exists public.formandos (
  id            uuid primary key default gen_random_uuid(),
  turma         text not null,                             -- "Turma 2026"
  nome          text not null,
  aluno_id      uuid references public.alunos(id),
  dias_presente smallint not null default 0 check (dias_presente >= 0),
  estagio_horas numeric(5,1) not null default 0 check (estagio_horas between 0 and 60),
  monografia    text not null default 'nao' check (monografia in ('nao','tema','escrevendo','entregue')),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. LGPD: consentimentos e auditoria
-- ---------------------------------------------------------------------
create table if not exists public.consentimentos (
  id          uuid primary key default gen_random_uuid(),
  aluno_id    uuid not null references public.alunos(id),
  tipo        text not null check (tipo in ('termos','privacidade','imagem','whatsapp','saude','responsavel_menor')),
  versao      text not null,                               -- versão do texto aceito
  aceito_em   timestamptz not null default now(),
  aceito_por  uuid default auth.uid(),
  revogado_em timestamptz
);
create unique index if not exists consentimento_vigente on public.consentimentos (aluno_id, tipo) where revogado_em is null;

create table if not exists public.auditoria (
  id       bigserial primary key,
  quando   timestamptz not null default now(),
  quem     uuid default auth.uid(),
  tabela   text not null,
  registro text,
  acao     text not null,
  antes    jsonb,
  depois   jsonb
);

create or replace function public.auditar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.auditoria (tabela, registro, acao, antes, depois)
  values (tg_table_name,
          coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id', ''),
          tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

-- trava de mês fechado (presenças, cobranças, balanço, lojinha)
create or replace function public.trava_mes_fechado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  dia date;
  dia_antes date;
begin
  -- cada tabela guarda a data de um jeito; olha a nova e a antiga (mudar de mês também conta)
  if tg_table_name = 'presencas' then
    if tg_op <> 'DELETE' then select data into dia from public.aulas where id = new.aula_id; end if;
    if tg_op <> 'INSERT' then select data into dia_antes from public.aulas where id = old.aula_id; end if;
  elsif tg_table_name = 'cobrancas' then
    if tg_op <> 'DELETE' then dia := to_date(new.competencia || '-01', 'YYYY-MM-DD'); end if;
    if tg_op <> 'INSERT' then dia_antes := to_date(old.competencia || '-01', 'YYYY-MM-DD'); end if;
  else
    if tg_op <> 'DELETE' then dia := new.data; end if;
    if tg_op <> 'INSERT' then dia_antes := old.data; end if;
  end if;
  if dia_antes is not null and exists (select 1 from public.fechamentos where competencia = public.competencia(dia_antes)) then
    raise exception 'O mês % está fechado. Reabra o fechamento para alterar.', public.competencia(dia_antes);
  end if;
  if dia is not null and exists (select 1 from public.fechamentos where competencia = public.competencia(dia)) then
    raise exception 'O mês % está fechado. Reabra o fechamento para alterar.', public.competencia(dia);
  end if;
  return coalesce(new, old);
end $$;

-- instrutor só faz chamada da aula dele e até 7 dias depois
create or replace function public.janela_chamada() returns trigger
language plpgsql security definer set search_path = public as $$
declare a record; v_aula uuid;
begin
  if public.eh_admin() then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then v_aula := old.aula_id; else v_aula := new.aula_id; end if;
  select * into a from public.aulas where id = v_aula;
  if a.instrutor_id is distinct from public.minha_equipe() then
    raise exception 'Só quem deu a aula faz a chamada.';
  end if;
  if a.data > current_date or a.data < current_date - 7 then
    raise exception 'A chamada pode ser feita no dia da aula e até 7 dias depois.';
  end if;
  return coalesce(new, old);
end $$;

-- ligar carimbo, auditoria e travas
do $$
declare t text;
begin
  foreach t in array array['atividades','equipe','alunos','planos','turmas','matriculas','aulas','substituicoes',
                           'cobrancas','repasses_equipe','fornecedores','produtos','vendas','repasses_fornecedor',
                           'fiado','contas_fixas','lancamentos','formandos'] loop
    execute format('drop trigger if exists %I_carimbo on public.%I', t, t);
    execute format('create trigger %I_carimbo before update on public.%I for each row execute function public.carimbar()', t, t);
  end loop;
  foreach t in array array['equipe','alunos','matriculas','aulas','presencas','cobrancas','repasses_equipe','fornecedores',
                           'vendas','venda_itens','repasses_fornecedor','fiado','lancamentos','fechamentos','consentimentos','perfis'] loop
    execute format('drop trigger if exists %I_auditoria on public.%I', t, t);
    execute format('create trigger %I_auditoria after insert or update or delete on public.%I for each row execute function public.auditar()', t, t);
  end loop;
  foreach t in array array['presencas','cobrancas','lancamentos','vendas'] loop
    execute format('drop trigger if exists %I_mes_fechado on public.%I', t, t);
    execute format('create trigger %I_mes_fechado before insert or update or delete on public.%I for each row execute function public.trava_mes_fechado()', t, t);
  end loop;
end $$;
drop trigger if exists presencas_janela on public.presencas;
create trigger presencas_janela before insert or update or delete on public.presencas
  for each row execute function public.janela_chamada();

-- ---------------------------------------------------------------------
-- 5. quem vê o quê (Row Level Security)
-- ---------------------------------------------------------------------
-- instrutor vê aluno de turma da atividade dele, ou particular que o escolheu
create or replace function public.aluno_visivel(p_aluno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.matriculas m
    join public.atividades a on a.id = m.atividade
    join public.equipe e on e.id = public.minha_equipe()
    where m.aluno_id = p_aluno and m.estado <> 'cancelada'
      and (m.instrutor_id = e.id or (m.instrutor_id is null and a.visibilidade = 'todos' and m.atividade = any(e.atividades))))
$$;
create or replace function public.minha_aula(p_aula uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.aulas where id = p_aula and instrutor_id = public.minha_equipe()) $$;

do $$
declare t text;
begin
  foreach t in array array['atividades','equipe','alunos','perfis','planos','turmas','matriculas','aulas','presencas',
                           'confirmacoes','substituicoes','cobrancas','eventos_gateway','repasses_equipe','fornecedores',
                           'produtos','vendas','venda_itens','repasses_fornecedor','fiado','contas_fixas','lancamentos',
                           'fechamentos','formandos','consentimentos','auditoria'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists admin_tudo on public.%I', t);
    if t not in ('auditoria','eventos_gateway') then
      execute format('create policy admin_tudo on public.%I for all to authenticated using (public.eh_admin()) with check (public.eh_admin())', t);
    end if;
  end loop;
end $$;

-- auditoria: a administração só lê; ninguém edita nem apaga
drop policy if exists auditoria_ler on public.auditoria;
create policy auditoria_ler on public.auditoria for select to authenticated using (public.eh_admin());

-- grade e planos: qualquer pessoa logada vê
drop policy if exists todos_leem on public.atividades;
create policy todos_leem on public.atividades for select to authenticated using (true);
drop policy if exists todos_leem on public.planos;
create policy todos_leem on public.planos for select to authenticated using (true);
drop policy if exists todos_leem on public.turmas;
create policy todos_leem on public.turmas for select to authenticated using (true);
drop policy if exists todos_leem on public.aulas;
create policy todos_leem on public.aulas for select to authenticated using (true);

-- perfil: cada um vê o seu
drop policy if exists meu_perfil on public.perfis;
create policy meu_perfil on public.perfis for select to authenticated using (user_id = auth.uid());

-- equipe: cada um vê a própria linha (com Pix); nomes da equipe saem pela view equipe_publica
drop policy if exists eu_mesmo on public.equipe;
create policy eu_mesmo on public.equipe for select to authenticated using (id = public.minha_equipe());

-- alunos: o aluno vê a si mesmo; instrutor só os que pode ver
drop policy if exists eu_aluno on public.alunos;
create policy eu_aluno on public.alunos for select to authenticated using (id = public.meu_aluno());
drop policy if exists instrutor_ve on public.alunos;
create policy instrutor_ve on public.alunos for select to authenticated
  using (public.meu_papel() = 'instrutor' and not apagado and public.aluno_visivel(id));

-- matrículas
drop policy if exists eu_aluno on public.matriculas;
create policy eu_aluno on public.matriculas for select to authenticated using (aluno_id = public.meu_aluno());
drop policy if exists instrutor_ve on public.matriculas;
create policy instrutor_ve on public.matriculas for select to authenticated
  using (public.meu_papel() = 'instrutor' and (instrutor_id = public.minha_equipe()
         or (instrutor_id is null and atividade = any(coalesce((select atividades from public.equipe where id = public.minha_equipe()), array[]::text[]))
             and (select visibilidade from public.atividades where id = atividade) = 'todos')));

-- aulas: instrutor abre e fecha a própria aula
drop policy if exists instrutor_faz on public.aulas;
create policy instrutor_faz on public.aulas for insert to authenticated with check (instrutor_id = public.minha_equipe());
drop policy if exists instrutor_atualiza on public.aulas;
create policy instrutor_atualiza on public.aulas for update to authenticated
  using (instrutor_id = public.minha_equipe()) with check (instrutor_id = public.minha_equipe());

-- presenças: instrutor da aula marca; aluno vê as suas
drop policy if exists instrutor_chamada on public.presencas;
create policy instrutor_chamada on public.presencas for all to authenticated
  using (public.minha_aula(aula_id)) with check (public.minha_aula(aula_id));
drop policy if exists eu_aluno on public.presencas;
create policy eu_aluno on public.presencas for select to authenticated using (aluno_id = public.meu_aluno());

-- "Vou": aluno marca o seu; instrutor vê os da aula dele
drop policy if exists eu_aluno on public.confirmacoes;
create policy eu_aluno on public.confirmacoes for all to authenticated
  using (aluno_id = public.meu_aluno()) with check (aluno_id = public.meu_aluno());
drop policy if exists instrutor_ve on public.confirmacoes;
create policy instrutor_ve on public.confirmacoes for select to authenticated
  using (exists (select 1 from public.turmas t where t.id = turma_id and t.instrutor_id = public.minha_equipe()));

-- trocas de aula
drop policy if exists equipe_ve on public.substituicoes;
create policy equipe_ve on public.substituicoes for select to authenticated
  using (public.meu_papel() = 'instrutor' and (de_id = public.minha_equipe() or para_id = public.minha_equipe()
         or (estado = 'aberto' and (pedido_para_id is null or pedido_para_id = public.minha_equipe())
             and (select atividade from public.turmas where id = turma_id) = any(coalesce((select atividades from public.equipe where id = public.minha_equipe()), array[]::text[])))));
drop policy if exists equipe_pede on public.substituicoes;
create policy equipe_pede on public.substituicoes for insert to authenticated with check (de_id = public.minha_equipe());

-- cobranças: o aluno vê as dele (o Asaas confirma o pagamento pelo webhook, não o aluno)
drop policy if exists eu_aluno on public.cobrancas;
create policy eu_aluno on public.cobrancas for select to authenticated
  using (exists (select 1 from public.matriculas m where m.id = matricula_id and m.aluno_id = public.meu_aluno()));

-- repasse: cada pessoa da equipe vê o seu
drop policy if exists eu_mesmo on public.repasses_equipe;
create policy eu_mesmo on public.repasses_equipe for select to authenticated using (equipe_id = public.minha_equipe());

-- formação: o formando vê a própria ficha
drop policy if exists eu_aluno on public.formandos;
create policy eu_aluno on public.formandos for select to authenticated using (aluno_id = public.meu_aluno());

-- consentimentos: o aluno dá e vê os dele
drop policy if exists eu_aluno on public.consentimentos;
create policy eu_aluno on public.consentimentos for select to authenticated using (aluno_id = public.meu_aluno());
drop policy if exists eu_aceito on public.consentimentos;
create policy eu_aceito on public.consentimentos for insert to authenticated with check (aluno_id = public.meu_aluno());

-- nomes da equipe sem Pix nem dados pessoais (para agenda e trocas)
create or replace view public.equipe_publica as
  select id, nome, atividades, bio from public.equipe where ativo;

-- ---------------------------------------------------------------------
-- 6. ações com regra (funções)
-- ---------------------------------------------------------------------
-- aceitar troca de aula: só quem pode, e só se ainda estiver aberta
create or replace function public.aceitar_troca(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s record; eu uuid := public.minha_equipe();
begin
  select * into s from public.substituicoes where id = p_id for update;
  if s is null or s.estado <> 'aberto' then raise exception 'Este pedido não está mais aberto.'; end if;
  if s.de_id = eu then raise exception 'Você não pode cobrir o seu próprio pedido.'; end if;
  if s.pedido_para_id is not null and s.pedido_para_id <> eu then raise exception 'O pedido foi para outra pessoa.'; end if;
  if not exists (select 1 from public.equipe e join public.turmas t on t.id = s.turma_id
                 where e.id = eu and t.atividade = any(e.atividades)) then
    raise exception 'Você não dá esta atividade.';
  end if;
  update public.substituicoes set estado = 'aceito', para_id = eu where id = p_id;
end $$;

create or replace function public.recusar_troca(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.substituicoes set recusas = array_append(recusas, public.minha_equipe())
  where id = p_id and estado = 'aberto' and not (public.minha_equipe() = any(recusas)) $$;

-- aluno pausa o próprio plano (até 60 dias) — sem cobrança no período
create or replace function public.pausar_plano(p_matricula uuid, p_dias int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_dias not between 1 and 60 then raise exception 'A pausa vai de 1 a 60 dias.'; end if;
  update public.matriculas set estado = 'pausada', pausa_ate = current_date + p_dias
  where id = p_matricula and aluno_id = public.meu_aluno() and estado = 'ativa';
  if not found then raise exception 'Plano não encontrado ou não está ativo.'; end if;
end $$;

-- cancelar pelo mesmo canal em que contratou (o app), sem multa nos 7 primeiros dias (CDC art. 49)
create or replace function public.cancelar_plano(p_matricula uuid) returns text
language plpgsql security definer set search_path = public as $$
declare m record;
begin
  select * into m from public.matriculas where id = p_matricula and aluno_id = public.meu_aluno() for update;
  if m is null then raise exception 'Plano não encontrado.'; end if;
  update public.matriculas set estado = 'cancelada', fim = current_date where id = p_matricula;
  update public.cobrancas set estado = 'cancelada' where matricula_id = p_matricula and estado = 'aberta' and vencimento > current_date;
  return case when current_date - m.inicio <= 7 then 'arrependimento' else 'cancelado' end;
end $$;

-- LGPD art. 18: o aluno pede a cópia dos próprios dados
create or replace function public.exportar_meus_dados() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'aluno',          (select to_jsonb(a) from public.alunos a where a.id = public.meu_aluno()),
    'matriculas',     (select coalesce(jsonb_agg(m), '[]') from public.matriculas m where m.aluno_id = public.meu_aluno()),
    'cobrancas',      (select coalesce(jsonb_agg(c), '[]') from public.cobrancas c join public.matriculas m on m.id = c.matricula_id where m.aluno_id = public.meu_aluno()),
    'presencas',      (select coalesce(jsonb_agg(jsonb_build_object('data', au.data, 'turma', au.turma_id)), '[]') from public.presencas p join public.aulas au on au.id = p.aula_id where p.aluno_id = public.meu_aluno()),
    'consentimentos', (select coalesce(jsonb_agg(c), '[]') from public.consentimentos c where c.aluno_id = public.meu_aluno()),
    'gerado_em',      now())
$$;

-- LGPD art. 16/18: exclusão. Apaga o que identifica a pessoa e mantém o financeiro
-- (obrigação legal/fiscal) ligado a um registro anônimo.
create or replace function public.anonimizar_aluno(p_aluno uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_admin() then raise exception 'Só a administração pode anonimizar.'; end if;
  update public.alunos set
    nome = 'Aluno removido ' || left(id::text, 8), telefone = null, email = null, nascimento = null,
    responsavel_nome = null, responsavel_telefone = null, observacoes = null,
    apagado = true, anonimizado_em = now()
  where id = p_aluno;
  delete from public.confirmacoes where aluno_id = p_aluno;
  update public.consentimentos set revogado_em = now() where aluno_id = p_aluno and revogado_em is null;
  update public.formandos set nome = 'Formando removido' where aluno_id = p_aluno;
end $$;

-- ---------------------------------------------------------------------
-- 7. permissões de tabela (o RLS acima decide as linhas)
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.auditoria from authenticated;
revoke all on public.eventos_gateway from authenticated;
grant select on public.equipe_publica to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke execute on function public.anonimizar_aluno(uuid) from public, anon;
grant execute on function public.aceitar_troca(uuid), public.recusar_troca(uuid), public.pausar_plano(uuid,int),
  public.cancelar_plano(uuid), public.exportar_meus_dados(), public.anonimizar_aluno(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 8. dados iniciais (atividades e planos das planilhas)
-- ---------------------------------------------------------------------
insert into public.atividades (id, nome, repasse, visibilidade, agendada) values
  ('yoga','Yoga & AcroYoga',.70,'todos',false), ('particular','Yoga particular',.70,'escolhido',false),
  ('gestantes','Yoga para gestantes',.70,'todos',false), ('meditacao','Meditação',.70,'todos',false),
  ('aquarela','Aquarela',.70,'todos',false), ('musicalizacao','Musicalização infantil',.70,'todos',false),
  ('violao','Violão',.70,'todos',false), ('ingles','Inglês',.65,'todos',false),
  ('massagem','Massagem terapêutica',.70,'escolhido',true), ('terapias','Terapias integrais',.70,'escolhido',true)
on conflict (id) do nothing;

insert into public.planos (id, atividade, nome, preco, aulas_semana) values
  ('yoga-1x','yoga','1x por semana',110,1), ('yoga-2x','yoga','2x por semana',160,2),
  ('yoga-3x','yoga','3x por semana',220,3), ('yoga-4x','yoga','4x por semana',290,4),
  ('yoga-avulsa','yoga','Aula avulsa',45,0)
on conflict (id) do nothing;

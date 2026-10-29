#!/usr/bin/env python3
"""Testa banco.sql num Postgres local, imitando o Supabase (auth.uid, papéis).
Uso: python3 testar-banco.py <pasta-do-socket> <porta>
Cada teste entra como uma pessoa (admin, Kamala, Bruno, aluna) e confere o que ela pode ver e fazer."""
import subprocess, sys, pathlib

SOCK, PORTA = sys.argv[1], sys.argv[2]
BANCO = pathlib.Path(__file__).resolve().parent.parent / 'banco.sql'
ok = falhas = 0

def psql(sql, db='anirvana'):
    r = subprocess.run(['psql', '-h', SOCK, '-p', PORTA, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-Atq', '-c', sql],
                       capture_output=True, text=True)
    return r.returncode == 0, (r.stdout.strip() if r.returncode == 0 else r.stderr.strip())

def como(uid, sql):
    """roda como usuário logado do Supabase (papel authenticated + sub do JWT)"""
    return psql(f"set local role authenticated; select set_config('request.jwt.claim.sub','{uid}', true); {sql}")

def confere(nome, cond, detalhe=''):
    global ok, falhas
    if cond: ok += 1; print('✓', nome)
    else: falhas += 1; print('✗', nome, '·', detalhe)

def valor(saida):
    return saida.split('\n')[-1] if saida else ''

# ---------- banco novo com o "esqueleto" do Supabase ----------
psql('drop database if exists anirvana', 'postgres'); psql('create database anirvana', 'postgres')
base = """
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
end $$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
"""
confere('esqueleto do Supabase', psql(base)[0])
r1 = subprocess.run(['psql', '-h', SOCK, '-p', PORTA, '-U', 'postgres', '-d', 'anirvana', '-v', 'ON_ERROR_STOP=1', '-q', '-f', str(BANCO)], capture_output=True, text=True)
confere('banco.sql roda inteiro', r1.returncode == 0, r1.stderr[-600:])
r2 = subprocess.run(['psql', '-h', SOCK, '-p', PORTA, '-U', 'postgres', '-d', 'anirvana', '-v', 'ON_ERROR_STOP=1', '-q', '-f', str(BANCO)], capture_output=True, text=True)
confere('banco.sql roda de novo sem erro (idempotente)', r2.returncode == 0, r2.stderr[-600:])

# ---------- gente e dados de teste ----------
U = {k: f'00000000-0000-0000-0000-00000000000{i}' for i, k in enumerate(['admin','kamala','bruno','luana','camila','sara'], 1)}
E = {'kamala':'10000000-0000-0000-0000-000000000001', 'bruno':'10000000-0000-0000-0000-000000000002', 'sara':'10000000-0000-0000-0000-000000000003', 'anajulia':'10000000-0000-0000-0000-000000000004'}
A = {'luana':'20000000-0000-0000-0000-000000000001', 'camila':'20000000-0000-0000-0000-000000000002', 'helena':'20000000-0000-0000-0000-000000000003', 'marta':'20000000-0000-0000-0000-000000000004'}
seed = f"""
insert into auth.users values {','.join(f"('{u}')" for u in U.values())};
insert into equipe (id, nome, atividades, pix_chave) values
 ('{E['kamala']}','Kamala','{{yoga,particular,gestantes,meditacao,terapias}}','pix-kamala'),
 ('{E['bruno']}','Bruno','{{aquarela}}','pix-bruno'),
 ('{E['sara']}','Sara','{{yoga}}','pix-sara'),
 ('{E['anajulia']}','Ana Julia','{{yoga,particular}}','pix-ana');
insert into alunos (id, nome) values ('{A['luana']}','Luana Ferraz'),('{A['camila']}','Camila Duarte'),('{A['helena']}','Helena Prado'),('{A['marta']}','Marta Siqueira');
insert into perfis (user_id, papel, equipe_id, aluno_id) values
 ('{U['admin']}','admin',null,null), ('{U['kamala']}','instrutor','{E['kamala']}',null),
 ('{U['bruno']}','instrutor','{E['bruno']}',null), ('{U['sara']}','instrutor','{E['sara']}',null),
 ('{U['luana']}','aluno',null,'{A['luana']}'), ('{U['camila']}','aluno',null,'{A['camila']}');
insert into turmas (id, atividade, dia, hora, instrutor_id) values
 ('seg1830','yoga',1,'18:30','{E['kamala']}'), ('qua1500','aquarela',3,'15:00','{E['bruno']}'), ('ter1900','yoga',2,'19:00','{E['sara']}');
insert into matriculas (aluno_id, atividade, plano_id, valor, turmas, vencimento_dia, metodo) values
 ('{A['luana']}','yoga','yoga-2x',160,'{{seg1830}}',3,'cartao'),
 ('{A['camila']}','yoga','yoga-2x',160,'{{seg1830}}',10,'pix'),
 ('{A['camila']}','aquarela',null,240,'{{qua1500}}',10,'pix'),
 ('{A['marta']}','aquarela',null,240,'{{qua1500}}',2,'pix');
insert into matriculas (aluno_id, atividade, valor, instrutor_id, vencimento_dia, metodo) values
 ('{A['helena']}','particular',245,'{E['anajulia']}',1,'pix');
insert into aulas (id, turma_id, data, instrutor_id, estado) values
 ('30000000-0000-0000-0000-000000000001','seg1830',current_date,'{E['kamala']}','feita'),
 ('30000000-0000-0000-0000-000000000002','seg1830',current_date - 10,'{E['kamala']}','feita');
insert into cobrancas (matricula_id, competencia, valor, vencimento)
 select id, to_char(current_date,'YYYY-MM'), valor, current_date from matriculas;
insert into lancamentos (tipo, data, valor, descricao, categoria) values ('saida', current_date, 298.40, 'Luz', 'Despesa Fixa');
insert into fornecedores (id, nome, modelo, pct_fornecedor) values ('40000000-0000-0000-0000-000000000001','Vale das Fadas','consignado',.8);
"""
s, o = psql(seed); confere('dados de teste', s, o[:300])

# ---------- quem vê o quê ----------
s, o = como(U['kamala'], 'select string_agg(nome, \', \' order by nome) from alunos')
confere('Kamala (yoga) vê só alunos de yoga: Camila e Luana', s and valor(o) == 'Camila Duarte, Luana Ferraz', o)
s, o = como(U['bruno'], 'select string_agg(nome, \', \' order by nome) from alunos')
confere('Bruno (aquarela) vê só Camila e Marta', s and valor(o) == 'Camila Duarte, Marta Siqueira', o)
s, o = como(U['kamala'], "select count(*) from alunos where nome = 'Helena Prado'")
confere('particular da Ana Julia não aparece para a Kamala', s and valor(o) == '0', o)
s, o = como(U['kamala'], "select string_agg(atividade, ',' order by atividade) from matriculas where aluno_id = '" + A['camila'] + "'")
confere('Kamala vê a matrícula de yoga da Camila, não a de aquarela', s and valor(o) == 'yoga', o)
s, o = como(U['luana'], 'select count(*) from alunos')
confere('aluna vê só a si mesma', s and valor(o) == '1', o)
s, o = como(U['luana'], 'select count(*) from cobrancas')
confere('aluna vê só as próprias cobranças', s and valor(o) == '1', o)
s, o = como(U['kamala'], 'select count(*) from cobrancas')
confere('instrutora não vê mensalidades de ninguém', s and valor(o) == '0', o)
s, o = como(U['kamala'], 'select count(*) from lancamentos')
confere('instrutora não vê o balanço', s and valor(o) == '0', o)
s, o = como(U['kamala'], "insert into lancamentos (tipo,data,valor,descricao,categoria) values ('entrada',current_date,10,'x','Extra')")
confere('instrutora não lança no balanço', not s, o)
s, o = como(U['kamala'], 'select string_agg(coalesce(pix_chave,\'-\'), \',\') from equipe')
confere('Pix da equipe: cada um vê só o seu', s and valor(o) == 'pix-kamala', o)
s, o = como(U['kamala'], 'select count(*) from equipe_publica')
confere('nomes da equipe aparecem sem Pix (equipe_publica)', s and valor(o) == '4', o)
s, o = como(U['admin'], 'select count(*) from alunos')
confere('administração vê todos os alunos', s and valor(o) == '4', o)
s, o = psql("set local role anon; select count(*) from alunos")
confere('sem login não vê nada', not s or valor(o) == '0', o)

# ---------- chamada ----------
s, o = como(U['kamala'], f"insert into presencas (aula_id, aluno_id, tipo_plano) values ('30000000-0000-0000-0000-000000000001','{A['luana']}','2x')")
confere('Kamala faz a chamada da aula dela', s, o)
s, o = como(U['bruno'], f"insert into presencas (aula_id, aluno_id, tipo_plano) values ('30000000-0000-0000-0000-000000000001','{A['camila']}','2x')")
confere('Bruno não mexe na chamada da Kamala', not s, o)
s, o = como(U['kamala'], f"insert into presencas (aula_id, aluno_id, tipo_plano) values ('30000000-0000-0000-0000-000000000002','{A['camila']}','2x')")
confere('chamada de 10 dias atrás é recusada', not s and '7 dias' in o, o)
s, o = como(U['luana'], 'select count(*) from presencas')
confere('aluna vê a própria presença', s and valor(o) == '1', o)

# ---------- dinheiro ----------
mat_luana = psql(f"select id from matriculas where aluno_id = '{A['luana']}'")[1]
s, o = psql(f"insert into cobrancas (matricula_id, competencia, valor, vencimento) values ('{mat_luana}', to_char(current_date,'YYYY-MM'), 160, current_date)")
confere('o mesmo mês nunca é cobrado duas vezes', not s and 'duplicate' in o, o)
s, o = psql(f"insert into cobrancas (matricula_id, competencia, valor, vencimento, multa_pct) values ('{mat_luana}', '2099-01', 160, '2099-01-03', 10)")
confere('multa acima de 2% é recusada', not s, o)
s, o = psql("insert into vendas (id, forma) values ('50000000-0000-0000-0000-000000000001','pix'); insert into venda_itens (venda_id, descricao, qtd, preco_unit, fornecedor_id) values ('50000000-0000-0000-0000-000000000001','Camisa botânica',1,188,'40000000-0000-0000-0000-000000000001'); select parte_fornecedor || '/' || parte_espaco from venda_itens")
confere('lojinha: 188 → 150,40 fornecedor / 37,60 Espaço (% congelado)', s and valor(o) == '150.40/37.60', o)
s, o = psql("insert into vendas (forma) values ('fiado')")
confere('fiado sem nome de quem levou é recusado', not s, o)
s, o = como(U['admin'], "insert into fechamentos (competencia) values (to_char(current_date,'YYYY-MM'))")
confere('administração fecha o mês', s, o)
s, o = como(U['admin'], "insert into lancamentos (tipo,data,valor,descricao,categoria) values ('saida',current_date,50,'x','Extra')")
confere('mês fechado não aceita lançamento novo', not s and 'fechado' in o, o)
s, o = como(U['admin'], "update lancamentos set data = date_trunc('month', current_date)::date - 40 where descricao = 'Luz'")
confere('não dá para tirar lançamento do mês fechado mudando a data', not s and 'fechado' in o, o)
s, o = como(U['kamala'], f"delete from presencas where aluno_id = '{A['luana']}'")
confere('chamada de mês fechado não pode ser apagada', not s and 'fechado' in o, o)
psql("delete from fechamentos")

# ---------- auditoria ----------
s, o = psql("select count(*) > 0 from auditoria where tabela = 'cobrancas'")
confere('tudo que mexe em dinheiro fica na auditoria', s and valor(o) == 't', o)
s, o = como(U['admin'], 'delete from auditoria')
confere('ninguém apaga a auditoria (nem a administração)', not s, o)
s, o = como(U['kamala'], 'select count(*) from auditoria')
confere('instrutora não lê a auditoria', s and valor(o) == '0', o)

# ---------- regras de cadastro ----------
s, o = psql("insert into alunos (nome, nascimento) values ('Alice Rezende', current_date - interval '5 years')")
confere('criança sem responsável é recusada (LGPD art. 14)', not s and 'respons' in o, o)
s, o = psql("insert into alunos (nome, nascimento, responsavel_nome) values ('Alice Rezende', current_date - interval '5 years', 'Mônica Rezende')")
confere('criança com responsável entra', s, o)
s, o = psql(f"insert into matriculas (aluno_id, atividade, valor, vencimento_dia, metodo) values ('{A['camila']}','particular',245,5,'pix')")
confere('particular sem professor escolhido é recusada', not s and 'escolhido' in o, o)

# ---------- trocas de aula ----------
s, o = como(U['sara'], f"insert into substituicoes (id, turma_id, data, de_id, pedido_para_id, motivo) values ('60000000-0000-0000-0000-000000000001','ter1900',current_date+5,'{E['sara']}','{E['anajulia']}','consulta')")
confere('Sara pede troca para a Ana Julia', s, o)
s, o = como(U['kamala'], 'select count(*) from substituicoes')
confere('pedido para outra pessoa não aparece para a Kamala', s and valor(o) == '0', o)
s, o = como(U['kamala'], "select aceitar_troca('60000000-0000-0000-0000-000000000001')")
confere('Kamala não consegue aceitar pedido que não é para ela', not s, o)
s, o = como(U['bruno'], f"insert into substituicoes (turma_id, data, de_id) values ('ter1900', current_date+5, '{E['sara']}')")
confere('ninguém pede troca em nome de outra pessoa', not s, o)

# ---------- LGPD: direitos do titular ----------
s, o = como(U['luana'], "select (exportar_meus_dados()->'aluno'->>'nome') || ' / ' || jsonb_array_length(exportar_meus_dados()->'presencas')")
confere('aluna baixa a cópia dos próprios dados', s and valor(o) == 'Luana Ferraz / 1', o)
s, o = como(U['kamala'], f"select anonimizar_aluno('{A['marta']}')")
confere('só a administração anonimiza', not s, o)
s, o = como(U['admin'], f"select anonimizar_aluno('{A['marta']}'); select nome from alunos where id = '{A['marta']}'")
confere('exclusão: nome some, financeiro fica', s and valor(o).startswith('Aluno removido'), o)
s, o = psql(f"select count(*) from matriculas where aluno_id = '{A['marta']}'")
confere('matrícula e cobranças da pessoa removida continuam (obrigação fiscal)', s and valor(o) == '1', o)
s, o = como(U['camila'], f"select pausar_plano((select id from matriculas where aluno_id = '{A['camila']}' and atividade = 'yoga'), 30)")
confere('aluna pausa o próprio plano', s, o)
s, o = como(U['camila'], f"select pausar_plano((select id from matriculas where aluno_id = '{A['luana']}'), 30)")
confere('aluna não pausa o plano de outra pessoa', not s, o)
s, o = como(U['luana'], f"select cancelar_plano((select id from matriculas where aluno_id = '{A['luana']}'))")
confere('cancelar pelo app nos 7 primeiros dias = arrependimento (CDC art. 49)', s and valor(o) == 'arrependimento', o)

print(f'\n{ok} ok · {falhas} falhas')
sys.exit(1 if falhas else 0)

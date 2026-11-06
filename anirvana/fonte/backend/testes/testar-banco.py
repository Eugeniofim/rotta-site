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
 ('{E['kamala']}','Kamala','{{yoga,particular,gestantes,meditacao}}','pix-kamala'),
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

# ---------- inscrição pelo link (sem login) ----------
def anon(sql):
    return psql(f"set local role anon; {sql}")
insc = """{"nome":"Rita Moura","nasc":"1988-02-03","tel":"(41) 99111-2222","cpf":"529.982.247-25","atv":"yoga","plano":"2x","turmas":"seg1830","motivo":"Ansiedade","praticou":"Nunca","pressao":"Alta","coluna":"Sim, lombar","dores":"Não","intestino":"Todos os dias","labirintite":"Não","saudeGeral":"Boa","maisInfo":"Hérnia lombar","emergNome":"Rui (marido)","emergTel":"41999990000","termos":true,"imagem":"sim","priv":true,"saudeOk":true,"indicou":"Luana","whats":true}"""
s, o = anon(f"select inscrever('{insc}'::jsonb)")
confere('sem login, a pessoa se inscreve pelo link', s, o)
id_insc = valor(o)
s, o = anon("""select inscrever('{"nome":"Pedro Alves","tel":"41996401187","atv":"violao","nasc":"2015-09-03","endereco":"Rua A, 1","saude":"Não","restricao":"Nenhuma","imagem":"nao","ciente":true,"priv":true}'::jsonb)""")
confere('criança sem responsável não se inscreve (formulário de criança)', not s and 'respNome' in o, o)
s, o = anon(f"select inscrever('{insc.replace('529.982.247-25', '123.456.789-00')}'::jsonb)")
confere('CPF inválido é recusado (formulário do yoga)', not s and 'CPF' in o, o)
s, o = anon(f"select inscrever('{insc.replace(',\"labirintite\":\"Não\"', '')}'::jsonb)")
confere('faltou pergunta obrigatória do formulário', not s and 'labirintite' in o, o)
crianca = """{"nome":"Lia Prates","nasc":"2018-03-02","atv":"aquarela","endereco":"Rua das Gaivotas, 40","saude":"Alergia a corante","restricao":"Vegetariano","respNome":"Joana Prates","respParentesco":"Mãe","tel":"(41) 99222-3333","imagem":"nao","ciente":true,"priv":true,"saudeOk":true}"""
s, o = anon(f"select inscrever('{crianca}'::jsonb)")
confere('criança com responsável se inscreve na aquarela', s, o)
s, o = anon(f"select inscrever('{insc.replace('Rita Moura', 'Ana Teste').replace('99111-2222', '99640-1100').replace('\"termos\":true', '\"termos\":false')}'::jsonb)")
confere('sem aceitar os termos de responsabilidade não se inscreve', not s and 'termos' in o, o)
s, o = anon('select count(*) from inscricoes')
confere('sem login não lê as inscrições de ninguém', not s or valor(o) == '0', o)
for _ in range(2): anon(f"select inscrever('{insc}'::jsonb)")
s, o = anon(f"select inscrever('{insc}'::jsonb)")
confere('o mesmo WhatsApp não manda 4 inscrições no dia', not s and 'Já recebemos' in o, o)
s, o = como(U['kamala'], f"select confirmar_inscricao('{id_insc}')")
confere('instrutora não confirma matrícula', not s, o)
s, o = como(U['admin'], f"select confirmar_inscricao('{id_insc}')")
confere('administração confirma: vira aluno com ficha e matrícula', s, o)
nova = valor(o)
s, o = psql(f"select (select formulario from fichas where aluno_id='{nova}') || '/' || (select count(*) from matriculas where aluno_id='{nova}' and plano_id='yoga-2x' and valor=160) || '/' || (select count(*) from consentimentos where aluno_id='{nova}') || '/' || (select respostas->>'pressao' from fichas_saude where aluno_id='{nova}') || '/' || (select cpf from alunos_privado where aluno_id='{nova}')")
confere('ficha do yoga, matrícula de 160, 5 consentimentos, saúde e CPF guardados', s and valor(o) == 'yoga/1/5/Alta/529.982.247-25', o)
s, o = como(U['kamala'], f"select count(*) from alunos_privado where aluno_id='{nova}'")
confere('professora não vê CPF nem endereço', s and valor(o) == '0', o)
s, o = psql(f"select count(*) from pontos_acoes where aluno_id='{A['luana']}' and tipo='indicar'")
confere('quem indicou ganha os pontos da indicação', s and valor(o) == '1', o)
s, o = como(U['kamala'], f"select respostas->>'maisInfo' from fichas_saude where aluno_id='{nova}'")
confere('instrutora de yoga vê a saúde autorizada', s and valor(o) == 'Hérnia lombar', o)
s, o = como(U['bruno'], f"select count(*) from fichas_saude where aluno_id='{nova}'")
confere('professor de outra atividade não vê a saúde', s and valor(o) == '0', o)
s, o = como(U['kamala'], f"select count(*) from fichas where aluno_id='{nova}'")
confere('instrutora vê a ficha do aluno novo', s and valor(o) == '1', o)
insc2 = insc.replace('Rita Moura', 'Joana Prates').replace('99111-2222', '99222-3333').replace('"saudeOk":true', '"saudeOk":false')
id2 = valor(anon(f"select inscrever('{insc2}'::jsonb)")[1])
nova2 = valor(como(U['admin'], f"select confirmar_inscricao('{id2}')")[1])
s, o = como(U['kamala'], f"select count(*) from fichas_saude where aluno_id='{nova2}'")
confere('sem autorização, a instrutora não vê a saúde', s and valor(o) == '0', o)
s, o = como(U['admin'], f"select count(*) from fichas_saude where aluno_id='{nova2}'")
confere('a administração vê a saúde mesmo sem autorização para a equipe', s and valor(o) == '1', o)
s, o = como(U['admin'], f"insert into fichas_saude (aluno_id, descricao, mostrar_para_instrutores) values ('{A['camila']}','Asma',true)")
confere('saúde não vai para a equipe sem o consentimento específico', not s and 'consentimento' in o, o)

# ---------- baixa de pagamento: só a administração ----------
cob = psql(f"select c.id from cobrancas c join matriculas m on m.id=c.matricula_id where m.aluno_id='{A['luana']}' limit 1")[1]
cob_camila = psql(f"select c.id from cobrancas c join matriculas m on m.id=c.matricula_id where m.aluno_id='{A['camila']}' limit 1")[1]
como(U['luana'], f"update cobrancas set estado='paga', pago_em=now() where id='{cob}'")
s, o = psql(f"select estado from cobrancas where id='{cob}'")
confere('aluna não consegue dar baixa na própria cobrança', s and valor(o) == 'aberta', o)
s, o = como(U['luana'], f"select avisar_que_paguei('{cob}','pix')")
confere('aluna avisa que pagou', s, o)
s, o = psql(f"select estado from cobrancas where id='{cob}'")
confere('o aviso não dá baixa sozinho', s and valor(o) == 'aberta', o)
s, o = como(U['luana'], f"select avisar_que_paguei('{cob_camila}','pix')")
confere('aluna não avisa pagamento de outra pessoa', not s, o)
aviso = psql(f"select id from avisos_pagamento where cobranca_id='{cob}'")[1]
s, o = como(U['luana'], f"select dar_baixa('{aviso}')")
confere('aluna não chama a baixa', not s and 'administração' in o, o)
s, o = como(U['kamala'], f"select dar_baixa('{aviso}')")
confere('instrutora não dá baixa', not s, o)
s, o = como(U['admin'], f"select dar_baixa('{aviso}'); select estado from cobrancas where id='{cob}'")
confere('administração confere e dá baixa', s and valor(o) == 'paga', o)
s, o = psql(f"select count(*) from auditoria where tabela='avisos_pagamento'")
confere('a baixa fica na auditoria', s and int(valor(o) or 0) >= 2, o)

# ---------- pontos ----------
s, o = como(U['luana'], "select ganhar_pontos('instalar'); select ganhar_pontos('instalar'); select count(*) from pontos_acoes where tipo='instalar'")
confere('instalar o app dá ponto uma vez só', s and valor(o) == '1', o)
s, o = como(U['luana'], "select ganhar_pontos('indicar')")
confere('aluna não se dá ponto de indicação', not s, o)
s, o = como(U['luana'], "select ganhos from saldo_pontos")
confere('saldo de pontos: presença 10 + pagamento em dia 20 + app 50 + duas indicações 200', s and valor(o) == '280', o)
s, o = como(U['luana'], "select trocar_pontos('avulsa')")
confere('não troca presente sem pontos suficientes', not s and 'Faltam' in o, o)
psql("insert into premios (id, nome, custo) values ('marcador','Marcador de página',250) on conflict do nothing")
s, o = como(U['luana'], "select trocar_pontos('marcador') is not null")
confere('troca presente com pontos', s and valor(o) == 't', o)

# ---------- eventos ----------
psql("insert into eventos_espaco (id, nome, data, hora, valor, vagas) values ('70000000-0000-0000-0000-000000000001','Yoga & Café',current_date+10,'08:00',60,1)")
s, o = como(U['luana'], f"insert into inscricoes_evento (evento_id, aluno_id) values ('70000000-0000-0000-0000-000000000001','{A['luana']}')")
confere('aluna se inscreve no evento', s, o)
s, o = como(U['camila'], f"insert into inscricoes_evento (evento_id, aluno_id) values ('70000000-0000-0000-0000-000000000001','{A['camila']}')")
confere('evento lotado não aceita mais ninguém', not s and 'lotado' in o, o)
s, o = como(U['luana'], f"update inscricoes_evento set pago_em=now() where aluno_id='{A['luana']}'")
confere('aluna não marca o evento como pago', not s and 'administração' in o, o)
s, o = como(U['luana'], f"update inscricoes_evento set avisou_pago_em=now() where aluno_id='{A['luana']}'")
confere('aluna avisa que pagou o evento', s, o)
s, o = como(U['admin'], f"update inscricoes_evento set pago_em=now(), confirmado_por=auth.uid() where aluno_id='{A['luana']}'")
confere('administração confirma o pagamento do evento', s, o)

# ---------- avisos automáticos e backup ----------
psql(f"insert into fila_avisos (regra, aluno_id, canal, mensagem) values ('saudade','{A['camila']}','whatsapp','oi')")
s, o = psql(f"select count(*) from fila_avisos where aluno_id='{A['camila']}'")
confere('WhatsApp não entra na fila de quem não aceitou (LGPD)', s and valor(o) == '0', o)
psql(f"insert into consentimentos (aluno_id, tipo, versao) values ('{A['camila']}','whatsapp','v1'); insert into fila_avisos (regra, aluno_id, canal, mensagem) values ('saudade','{A['camila']}','whatsapp','oi')")
s, o = psql(f"select count(*) from fila_avisos where aluno_id='{A['camila']}'")
confere('quem aceitou recebe o WhatsApp', s and valor(o) == '1', o)
s, o = como(U['kamala'], 'select count(*) from fila_avisos')
confere('instrutora não lê a fila de avisos', s and valor(o) == '0', o)
s, o = como(U['admin'], "insert into fechamentos (competencia) values ('2026-09'); select count(*) from fila_avisos where regra='backup' and chave='2026-09-fechamento'")
confere('fechar o mês pede o backup em Excel', s and valor(o) == '1', o)
psql("delete from fechamentos")
s, o = como(U['kamala'], 'select count(*) from configuracoes')
confere('só a administração vê as configurações', s and valor(o) == '0', o)
s, o = psql("select valor::text from configuracoes where chave='baixa_automatica_banco'")
confere('baixa automática pelo banco começa desligada', s and valor(o) == 'false', o)
s, o = como(U['luana'], 'select count(*) from backups')
confere('aluna não vê os backups', s and valor(o) == '0', o)

# ---------- código de acesso pessoal da equipe ----------
NOVO, OUTRO = '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008'
psql(f"insert into auth.users values ('{NOVO}'), ('{OUTRO}') on conflict do nothing")
s, o = como(U['kamala'], f"select gerar_codigo_equipe('{E['anajulia']}')")
confere('instrutora não gera código de ninguém', not s, o)
s, o = como(U['admin'], f"select gerar_codigo_equipe('{E['anajulia']}')")
cod = valor(o)
confere('administração gera um código de 6 números', s and len(cod) == 6 and cod.isdigit(), o)
s, o = psql(f"select hash <> '{cod}' and hash like '$2%' from codigos_equipe where equipe_id = '{E['anajulia']}'")
confere('o banco guarda só o hash do código', s and valor(o) == 't', o)
errado = '000001' if cod != '000001' else '000002'
s, o = como(NOVO, f"select entrar_com_codigo('{E['anajulia']}', '{errado}')")
confere('código errado não entra', s and valor(o) == 'f', o)
s, o = psql(f"select count(*) from perfis where user_id = '{NOVO}'")
confere('código errado não cria acesso', s and valor(o) == '0', o)
s, o = como(NOVO, f"select entrar_com_codigo('{E['anajulia']}', '{cod}')")
confere('código certo entra', s and valor(o) == 't', o)
s, o = como(NOVO, "select count(*) from alunos where nome = 'Helena Prado'")
confere('com o código, a Ana Julia vê a aluna particular dela', s and valor(o) == '1', o)
s, o = como(U['kamala'], 'select count(*) from codigos_equipe')
confere('ninguém da equipe lê os códigos', s and valor(o) == '0', o)
for _ in range(5): como(OUTRO, f"select entrar_com_codigo('{E['anajulia']}', '{errado}')")
s, o = como(OUTRO, f"select entrar_com_codigo('{E['anajulia']}', '{cod}')")
confere('5 erros seguidos bloqueiam até o código certo', not s and 'Muitas tentativas' in o, o)
s, o = como(U['admin'], f"select gerar_codigo_equipe('{E['anajulia']}')")
novo_cod = valor(o)
s, o = psql(f"select count(*) from perfis where user_id = '{NOVO}'")
confere('código novo derruba os aparelhos do código antigo', s and valor(o) == '0', o)
s, o = como(NOVO, f"select entrar_com_codigo('{E['anajulia']}', '{cod}')")
confere('o código antigo para de valer', s and valor(o) == 'f', o)
s, o = como(NOVO, f"select entrar_com_codigo('{E['anajulia']}', '{novo_cod}')")
confere('o código novo vale', s and valor(o) == 't', o)
s, o = psql("set local role anon; select entrar_com_codigo('" + E['anajulia'] + "', '123456')")
confere('sem login nem tenta o código', not s, o)

print(f'\n{ok} ok · {falhas} falhas')
sys.exit(1 if falhas else 0)

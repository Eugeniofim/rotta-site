# Backend do app do Espaço Anirvana

Um banco só (Supabase, região São Paulo), cada registro é uma linha, e cada pessoa
entra com o próprio login e enxerga só o que é dela. O pagamento fica com o Asaas:
o app nunca vê número de cartão.

```
celular/computador (app instalável, rottaguide.com/anirvana)
        │  login (e-mail + senha ou link mágico)
        ▼
Supabase (Postgres + regras de acesso por linha)  ◄── webhook ── Asaas (Pix, Pix Automático, cartão)
```

## Arquivos

| Arquivo | O que é |
|---|---|
| `banco.sql` | O banco inteiro: tabelas, regras de acesso, auditoria, trava de mês fechado, funções da LGPD. Pode rodar de novo sem estragar nada. |
| `supabase/functions/asaas-webhook/index.ts` | Recebe do Asaas o aviso de que o dinheiro caiu e põe o pagamento em "Para confirmar". Quem dá baixa é a administração. Aplica cada aviso uma vez só. |
| `supabase/functions/enviar-avisos/index.ts` | A cada 5 minutos: põe na fila os avisos do momento (aula, vencimento, atraso, saudade, véspera de evento) e manda por push, WhatsApp oficial e e-mail. |
| `supabase/functions/backup-mensal/index.ts` | Todo dia 15 às 3h (backup do mês anterior), e ao fechar um mês: gera o backup em Excel no formato das planilhas do Espaço, guarda e manda por e-mail. |
| `supabase/functions/_compartilhado/motor.js` | As mesmas regras do app (repasse, lojinha, balanço, pontos, backup), geradas pelo `build.py`. O servidor e o celular fazem a mesma conta. |
| `testes/testar-banco.py` | 134 testes que entram como administração, instrutora, aluna e sem login, e conferem o que cada uma pode ver e fazer. |

Para rodar os testes num Postgres local: `python3 testes/testar-banco.py <pasta-do-socket> <porta>`.

## Quem vê o quê (garantido pelo banco, não só pela tela)

| | Administração | Instrutor | Aluno |
|---|---|---|---|
| Alunos | todos | só os da atividade dele (turma) ou que o escolheram (particular) | só ele |
| Matrículas | todas | só as da atividade dele | só as dele |
| Chamada | tudo | só das aulas que ele deu, no dia e até 7 dias depois | vê as próprias presenças |
| Mensalidades e cobranças | tudo | nada | só as dele |
| Balanço, lojinha, fornecedores | tudo | nada | nada |
| Repasse | todos | só o dele | nada |
| Pix da equipe e dos fornecedores | tudo | só o próprio | nada |
| Auditoria | lê, não apaga | nada | nada |
| Ficha de inscrição | todas | dos alunos dela | a dele (completa e edita) |
| Saúde da ficha | todas | só se o aluno autorizou | a dele |
| Baixa de pagamento | dá baixa ou recusa | nada | só avisa "já paguei" |
| Inscrições novas | confirma | nada | sem login: só envia a dele |
| Eventos | cria e divulga, confirma pagamento | vê | se inscreve e avisa que pagou |
| Pontos | vê todos, entrega presentes | nada | vê os dele e troca |
| Fila de avisos e backups | tudo | nada | nada |
| Código de acesso da equipe | gera e troca (vê uma vez só) | digita o seu | nada |

## Regras que o banco impõe

- **Mês fechado não muda.** Depois de fechar o mês, chamada, cobrança, lançamento e venda daquele mês são recusados até alguém reabrir. O pagamento feito à equipe bate sempre com o registrado.
- **Tudo que mexe em dinheiro fica na auditoria**: quem, quando, antes e depois. Ninguém apaga a auditoria, nem a administração.
- **O mesmo mês nunca é cobrado duas vezes** (uma cobrança por matrícula por mês).
- **Lojinha:** o % do fornecedor fica congelado na hora da venda. Mudar o % depois não altera vendas antigas.
- **Particular, massagem e terapias** exigem o profissional escolhido.
- **Criança** só entra com nome do responsável.
- **Baixa de pagamento é da administração.** O aluno só avisa "já paguei". O Asaas também só avisa que o dinheiro caiu: o pagamento vai para "Para confirmar" e a Dessa ou o Vitor dão baixa com um toque. A baixa automática pelo banco existe, mas começa desligada (`configuracoes.baixa_automatica_banco`).
- **Inscrição pelo link (no lugar do Google Forms):** quem não tem login só consegue mandar a própria inscrição, bem preenchida, com termos aceitos e responsável quando é menor. No máximo 3 por WhatsApp por dia. Ao confirmar, o banco cria de uma vez o aluno, a ficha, os consentimentos e a matrícula, e dá os pontos de quem indicou.
- **Saúde fica separada** (`fichas_saude`) e só aparece para as instrutoras com o consentimento específico do aluno. Sem ele, o banco recusa até a administração de abrir para a equipe.
- **Pontos não se fabricam:** o aluno só ganha sozinho os de instalar o app e ligar os avisos. Os outros vêm da chamada, dos pagamentos em dia e das indicações. Duas trocas ao mesmo tempo não furam o saldo.
- **Evento lotado não aceita ninguém**, e só a administração marca o pagamento do evento.
- **WhatsApp e e-mail só para quem aceitou:** a própria fila descarta o aviso de quem não deu o sim.
- **Entrada sem nomes (v8):** a tela inicial não mostra ninguém.
  - **Aluno:** entra com o celular. O Supabase Auth manda o código (SMS ou WhatsApp) e, com o celular confirmado, `entrar_como_aluno()` acha a ficha pelo telefone do aluno ou do responsável. Celular de quem tem dois filhos: o app pergunta quem entra (`alunos_do_meu_celular()`). Sem senha para criar.
  - **Instrutor:** só o PIN de 6 números (`entrar_com_pin`). O PIN diz quem é, por isso o banco não deixa dois iguais. 5 erros por aparelho em 15 minutos bloqueiam; 30 erros no app todo também.
  - **Administração:** conta Google confirmada e na lista `configuracoes.admins_emails` (Andressa e Sara) → `entrar_como_admin()`. Depois, o PIN do painel (`definir_pin_admin`, `conferir_pin_admin`, guardado com bcrypt, ninguém lê) tranca a administração no aparelho.
- **Código de acesso pessoal de cada instrutor:** 6 números gerados pela administração; o banco guarda só o hash (bcrypt). A pessoa digita uma vez no celular dela e o aparelho fica ligado ao perfil. Cinco erros seguidos bloqueiam por 15 minutos. Gerar um código novo derruba na hora todos os aparelhos do código antigo.
- **Wellhub e GoGood** (planos `yoga-wellhub` R$ 25,50 e `yoga-gogood` R$ 27,00 por aula): o aluno não recebe cobrança do Espaço (o banco recusa); a plataforma paga por aula e isso entra no fechamento da yoga.
- **Yoga particular:** planos `part-1x` a `part-4x` (245, 385, 515, 650) e `part-avulsa` (80), presencial ou online (`matriculas.modalidade`). Quem dá a aula a administração escolhe ao confirmar a inscrição.
- **Cartão:** pelo link da maquininha do Espaço (sem valor); o aviso de pagamento guarda o acréscimo de R$ 12,00 (`configuracoes.taxa_cartao`).
- **Feriados** em `dias_sem_aula` (nacionais 2026–2027 já carregados): sem lembrete de aula e com aviso de feriado; a administração marca "tem aula" ou cria dias sem aula.
- **Formulários:** yoga (yoga, particular, gestantes, meditação), arte e música (aquarela e violão: começa pelo aluno; responsável só se for menor) e criança (musicalização).
- **Inglês** não passa pela escola nem pelas mensalidades: a administração lança à mão no balanço a parte do Espaço.
- **Lojinha:** fornecedores são cadastrados pela administração; o % fica congelado em cada venda, então mudar o % de um fornecedor vale só para as vendas novas.

## O que a lei pede e como o app atende

Confirmar com o contador e um advogado antes de lançar. Os pontos abaixo são o desenho técnico para atender a lei, não um parecer jurídico.

**LGPD (Lei 13.709/2018)**
- **Pequeno porte:** a Resolução CD/ANPD nº 2/2022 simplifica a vida de microempresa e MEI. O registro das operações pode ser simplificado, e não é obrigatório nomear encarregado, desde que exista um canal de contato com o titular (no app: espacoanirvana@gmail.com). Medidas mínimas de segurança continuam valendo ([ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022)).
- **Crianças (musicalização):** dados de menor só com o responsável (art. 14). O banco recusa menor sem responsável.
- **Saúde (gestantes, terapias):** é dado sensível (art. 11). Regra do app: não guardar ficha de saúde por enquanto. Se um dia precisar de anamnese, ela entra com consentimento específico (`consentimentos.tipo = 'saude'`) e acesso só de quem atende. Nada de saúde no WhatsApp.
- **Consentimento:** imagem em redes sociais e avisos por WhatsApp são escolhas do aluno, registradas com data e versão do texto, e podem ser retiradas.
- **Direitos do titular:** `exportar_meus_dados()` entrega a cópia. `anonimizar_aluno()` apaga o que identifica a pessoa e mantém pagamentos e presenças ligados a um registro anônimo, porque a lei fiscal exige guardar o financeiro.
- **Onde ficam os dados:** projeto Supabase na região São Paulo.

**Consumidor (CDC)**
- **Cancelar pelo mesmo canal:** o aluno contrata pelo app e cancela pelo app (`cancelar_plano`), sem precisar ligar.
- **Arrependimento em 7 dias** (art. 49) para contratação feita pelo app: o cancelamento nesse prazo é marcado como arrependimento, com devolução integral.
- **Atraso:** o banco limita multa a 2% e juros a 1% ao mês, o padrão mais conservador.
- **Pausa** de até 60 dias pelo próprio aluno, sem cobrança no período.

**Pagamentos**
- **Cartão:** digitado só na página segura do Asaas. O app guarda apenas o código da cobrança. Assim o Espaço fica fora do escopo pesado de segurança de cartão (PCI).
- **Pix Automático:** autorização única no banco do aluno, cobrança mensal sozinha, sem taxa de cartão ([Vedius](https://vedius.com.br/sistema-de-pilates-com-cobranca-recorrente-automatica/)).
- **Webhook:** só aceita o token do Asaas, e cada aviso é aplicado uma vez.

**MEI e repasses: conversar com o contador antes de ligar o Asaas**
- Hoje todo o dinheiro entra na conta do Espaço e depois sai para a equipe. Somando mensalidades brutas, lojinha e Airbnb, o faturamento anual pode passar do limite do MEI.
- O **split do Asaas** manda a parte de cada profissional direto para a conta dela no momento do pagamento ([Asaas](https://blog.asaas.com/split-de-pagamento-no-asaas/)). Isso funciona para atividades de % fixo: aquarela, inglês, massagem, terapias, particular.
- A yoga em turma não dá para dividir na hora, porque o repasse depende da chamada do mês inteiro. Ela segue com o fechamento mensal e uma transferência só.
- Na lojinha a lógica é a mesma: no consignado, a parte do fornecedor não é receita do Espaço. Como registrar isso é com o contador.

## Backup mensal em Excel (regra do app)

- **Quando:** todo dia 15 às 3h (horário de Brasília) sai o backup do mês anterior (pedido da Dessa: dá tempo de entrarem os pagamentos atrasados). Ao fechar um mês, sai outro. A administração também baixa quando quiser (Mensalidades → Regras).
- **Formato:** um `.xlsx` que abre no Excel, Google Planilhas e Numbers, no **mesmo desenho das planilhas do Espaço**:
  - *Controle financeiro:* uma aba por mês (Saídas à esquerda, Entradas à direita, TOTAL, saldo e totais por categoria com fórmula) e a aba ANO.
  - *Mensalidades:* uma aba por mês, com cada atividade, a parte da equipe e do Espaço e o fechamento da yoga (ALUNOS / INSTRUTORAS, A RECEBER, EXCEDENTE).
  - *Lojinha:* vendas por mês com fornecedor e partes, "A RECEBER!" no topo, saldo de cada fornecedor e produtos cadastrados.
  - *Cadastro:* alunos e fichas, pagamentos, presenças, equipe, eventos, pontos e inscrições.
  - Uma aba escondida com a cópia completa do app, para restaurar se precisar.
- **Onde fica (três cópias):** (1) pasta **Backups Anirvana** no Google Drive do Espaço, enviada sozinha pela função; (2) e-mail do Espaço, com o arquivo anexo; (3) bucket privado `backups` no Supabase (São Paulo), que só a administração lê. No app, "Salvar no Google Drive" faz o mesmo na hora (no celular abre o Compartilhar → Drive).
- **Ligar o Drive (jeito simples, v8):** a administração toca em **Conectar o Google Drive** (Mensalidades → Regras) e autoriza com a conta do Espaço. A função `google-drive` pede só a permissão `drive.file` (o app enxerga só os arquivos que ele cria), cria a pasta Backups Anirvana e guarda a permissão em `conexao_google`, que nenhum login lê. Para isso: no Google Cloud, criar um "ID do cliente OAuth" (aplicativo da Web) com o endereço de retorno `https://<projeto>.supabase.co/functions/v1/google-drive`; guardar `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `APP_URL`; publicar com `supabase functions deploy google-drive --no-verify-jwt`.
- **Ligar o Drive (jeito antigo, se preferir):** criar uma conta de serviço no Google Cloud, compartilhar a pasta Backups Anirvana com o e-mail dela (como Editor) e guardar `GOOGLE_SERVICE_ACCOUNT` e `DRIVE_PASTA_ID` em Edge Functions → Secrets.
- **Conferido:** o arquivo abre sem nenhum erro de fórmula e janeiro bate com a planilha original (Kamala R$ 1.346,63 · Ana Julia R$ 623,00 · Sara R$ 35,88).
- **Cuidado:** tem dados de saúde. Não mandar por WhatsApp.

## Avisos automáticos

| Canal | Como funciona | O que precisa |
|---|---|---|
| Push no celular | o app instalado pede permissão uma vez; o celular fica em `push_inscricoes` | chaves VAPID (gratuitas) |
| WhatsApp | API oficial da Meta (WhatsApp Cloud API). Mensagem que o Espaço inicia precisa de **modelo aprovado** uma vez pela Meta (`anirvana_lembrete`, `anirvana_vence`...) | número do Espaço verificado no Meta Business, token |
| E-mail | Resend, com link para parar de receber | conta Resend e domínio ou remetente verificado |

Os textos de cada aviso estão em `regras_aviso` e a administração liga e desliga cada um no app (Divulgar → Avisos automáticos). **Quando vai** fica em `regras_aviso.quando` (h = horas antes, d = dias, hora = que horas sai, entre 6h e 22h) e a administração edita no app. O aviso de feriado sai dois dias antes, às 9h.

## Ligar de verdade

1. Criar o projeto no Supabase na região São Paulo e rodar `banco.sql` no SQL Editor.
2. Logins: em Authentication ligar **Phone** (SMS ou WhatsApp pela Twilio) para os alunos e **Google** para a administração; pôr os e-mails Google da Andressa e da Sara em `configuracoes.admins_emails`; gerar o PIN de cada instrutor no app (Escola → Equipe). Não precisa preencher `perfis` à mão: as funções de entrar fazem isso.
3. Abrir conta Asaas, configurar o webhook apontando para a função `asaas-webhook`, com token.
4. Contador valida: MEI × split, nota fiscal (NFS-e), consignação.
5. Publicar os textos de Termos de uso e Política de privacidade e pedir o aceite no primeiro login.
6. Ligar o app ao banco (modelo das skills app-sempre-junto e pwa-atualiza: sombra, fila offline, carimbo do servidor).
7. Criar o bucket privado `backups`, ligar `pg_cron` e `pg_net`, e guardar `app.funcoes_url` e `app.cron_token` (backup do dia 15 e avisos a cada 5 minutos).
8. Avisos: gerar as chaves VAPID, aprovar os modelos de WhatsApp na Meta e criar a conta no Resend. Guardar tudo em Edge Functions → Secrets.

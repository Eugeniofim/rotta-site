# rottaguide.com/anirvana — protótipo do app do Espaço Anirvana

App de gestão do Espaço Anirvana (Pontal do Sul, PR) com três painéis:
Administração (Dessa e Vitor), Instrutores e Alunos.

- `index.html`, `sw.js`, `manifest.webmanifest`, ícones: o app publicado (GERADO — não editar à mão).
- `fonte/`: o código de verdade. Edite lá e gere de novo.
- `fonte/backend/`: banco (Supabase), webhook do Asaas e o que a lei pede. Ver `fonte/backend/LEIA-ME.md`.

## Gerar de novo
```
cd fonte
npm pack lucide-static@0.469.0 && tar xzf lucide-static-0.469.0.tgz   # ícones
python3 build.py package/icons
cp -r dist/anirvana/* ..        # copia o app gerado para rottaguide.com/anirvana
```
Antes de publicar: subir `CACHE = 'anirvana-vN'` no `build.py` (senão o celular não vê a versão nova).

## De onde vêm os dados
- Mensalidades jan–mar/2026 e o fechamento da yoga: planilha "Mensalidades Anirvana 2026" (bate centavo por centavo).
- Vendas mar–jul/2026 e fornecedores: planilha "LojinhaANIRVANA".
- Categorias do balanço: planilha "Controle financeiro 2026".
- Nomes de alunos, horários, lançamentos de ago–out: EXEMPLO.
- Curso de Instrutores, mentores, endereço, contato: site anirvana.com.br.

## O que mudou na v4 (pedidos da reunião)
- Entrada: **Alunos primeiro**, com "Quero me inscrever"; depois Instrutores e Administração.
- **Inscrição no lugar do Google Forms:** 4 passos (você, atividade, ficha, combinados). Vira uma ficha que a administração confirma e que as instrutoras veem. Saúde só aparece para a equipe com a autorização do aluno. Dá para importar o CSV do Google Forms.
- **Pontos** para incentivar instalar o app (instalar, ligar avisos, ficha, aula, pagamento em dia, indicação) e presentes para trocar.
- **Avisos automáticos** por push, WhatsApp e e-mail (lembrete de aula, vencimento, atraso, saudade, evento), com sino no topo.
- **Eventos:** aba Divulgar → criar evento, mandar para o público certo e baixar a arte do Instagram (story e post).
- **Baixa de pagamento só pela administração:** o aluno avisa "já paguei"; a Dessa ou o Vitor dão baixa.
- **Balanço por categoria:** um gráfico para mensalidades, lojinha, Airbnb, eventos, cantina, coworking, despesas fixas, social mídia, limpeza, manutenção, melhorias e extra.
- **Lojinha:** produtos zerados para cadastrar; cadastro de fornecedores na aba Fornecedores; mudar o % não mexe nas vendas antigas.
- **Backup mensal em Excel** (regra): todo dia 1º e ao fechar o mês, no formato das planilhas do Espaço.
- Painel do aluno sem a aba Formação; tocar na logo volta para a tela inicial.

## v5
- **Inglês** saiu da Escola e das Mensalidades: é lançado à mão no Balanço (categoria Inglês, parte do Espaço).
- **Código de acesso pessoal** para cada instrutor (6 números). A administração vê e gera um novo em Escola → Equipe; o código antigo para de valer na hora.

## v6
- **Inscrição igual aos Google Forms do Espaço:** formulário do Yoga (vale para yoga e acroyoga, gestantes, particular, meditação e movimento consciente) e formulário de criança (aquarela, musicalização e violão), com as mesmas perguntas. Importa o CSV de cada formulário.
- **Botão Inscrições** sempre visível no topo da administração, com "Nova inscrição" (balcão), link e importação.
- **Menu Atividades (cursos):** criar, editar e apagar atividades e horários.
- **Massagem terapêutica e terapias integrais** lançadas à mão no balanço, como o inglês. Marina e Aurelice fora da equipe.
- **Equipe:** cadastrar, editar e excluir instrutores (as turmas passam para quem assumir).
- **Divulgar:** escrever aviso para todos (ou um grupo), eventos com editar e excluir.
- **Lojinha:** "Outro item" no topo, resumo do dia e busca de produto. Cadastro de fornecedores.
- **Escola** sem a aba Formação.
- CPF e endereço ficam numa tabela que só a administração e o próprio aluno veem (banco: 103 testes).

## v7
- **Backup no Google Drive:** todo dia 1º o servidor sobe o Excel do mês na pasta "Backups Anirvana" do Drive do Espaço (conta de serviço do Google; ver `fonte/backend/LEIA-ME.md`). No app, Mensalidades → Regras → "Salvar no Google Drive" (no celular abre o Compartilhar).
- Backups ficam em três lugares: Drive do Espaço, e-mail do Espaço e o cofre do Supabase (só a administração abre).
- `como-usar.pdf`: tutorial com as telas e a revisão de todos os pedidos. `tutorial.mp4`: vídeo narrado (2 min 38 s).

## v8 (pedidos da Dessa, 16/11)
- **Entrada sem nomes:** aluno entra com o celular (código pelo WhatsApp, sem senha); instrutor só com o PIN; administração (Andressa e Sara) com Google + PIN do painel.
- **Inscrição:** sem nome de instrutores; Yoga e Movimento Consciente juntos (Movimento com a Sara Lénz, sextas 9h); yoga particular presencial e online com os valores 2026; aquarela e violão para todas as idades, sem horário, começando pelo aluno ("menor de idade" leva ao responsável); musicalização igual; termos iguais aos do Forms.
- **Aluno:** pontos desligados por enquanto; aba Terapias com o WhatsApp de quem atende; cartão pelo link com acréscimo de R$ 12,00; Pix copia e cola com o valor; comprovante pelo WhatsApp do Espaço.
- **Instrutores:** visitante com nome (avulsa, Wellhub ou GoGood); "aula vazia" à vista; feriado desmarca a aula sozinho; aquarela, musicalização e violão com só o ponto 1 em "como o valor é calculado".
- **Administração:** Wellhub R$ 25,50 e GoGood R$ 27,00 por aula; planos do particular; chave Pix e link do cartão em Regras; feriados em Escola → Horários; terapias em Cursos; avisos automáticos com "quando vai" editável; backup todo dia 15 do mês anterior e botão "Conectar o Google Drive".
- **Banco:** 134 testes (era 103). `como-usar.pdf` refeito para a v8. O `tutorial.mp4` ainda é o da v7 (entrada antiga).

## v9 (planilha de alunos ativos, 18/11)
- **Trazer a planilha para o app:** Inscrições → "Trazer do Google Forms" agora aceita a planilha do Excel (.xlsx) além do .csv. O app arruma sozinho o CPF que o Excel guardou sem o zero da frente, a data no formato do Excel, nome todo em maiúsculas e celular sem DDD (põe 41), e mostra um relatório: quantas entraram, quem já estava no app (mesmo CPF ou celular não entra duas vezes) e o que conferir (celular sem o 9, sem DDD, sem contato de emergência, CPF que não confere).
- Respostas de perguntas antigas do formulário ficam guardadas na ficha. Ao confirmar, a administração escolhe o plano (1x a 4x, Wellhub ou GoGood).
- Banco: `importar_inscricao` (só a administração; repetido não entra). 138 testes.
- **Dados reais não entram nesta demonstração pública.** `fonte/alunos-ficticios.xlsx` é uma planilha FALSA com os mesmos títulos e defeitos da real, para o teste (`fonte/teste-planilha-alunos.js`).

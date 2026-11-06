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

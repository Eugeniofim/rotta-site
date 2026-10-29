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
| `supabase/functions/asaas-webhook/index.ts` | Recebe a confirmação de pagamento do Asaas e dá baixa na cobrança. Aplica cada aviso uma vez só. |
| `testes/testar-banco.py` | 46 testes que entram como administração, instrutora e aluna e conferem o que cada uma pode ver e fazer. |

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

## Regras que o banco impõe

- **Mês fechado não muda.** Depois de fechar o mês, chamada, cobrança, lançamento e venda daquele mês são recusados até alguém reabrir. O pagamento feito à equipe bate sempre com o registrado.
- **Tudo que mexe em dinheiro fica na auditoria**: quem, quando, antes e depois. Ninguém apaga a auditoria, nem a administração.
- **O mesmo mês nunca é cobrado duas vezes** (uma cobrança por matrícula por mês).
- **Lojinha:** o % do fornecedor fica congelado na hora da venda. Mudar o % depois não altera vendas antigas.
- **Particular, massagem e terapias** exigem o profissional escolhido.
- **Criança** só entra com nome do responsável.

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

## Ligar de verdade

1. Criar o projeto no Supabase na região São Paulo e rodar `banco.sql` no SQL Editor.
2. Criar os logins (administração, equipe, alunos) e preencher `perfis`.
3. Abrir conta Asaas, configurar o webhook apontando para a função `asaas-webhook`, com token.
4. Contador valida: MEI × split, nota fiscal (NFS-e), consignação.
5. Publicar os textos de Termos de uso e Política de privacidade e pedir o aceite no primeiro login.
6. Ligar o app ao banco (modelo das skills app-sempre-junto e pwa-atualiza: sombra, fila offline, carimbo do servidor).

# rottaguide.com/anirvana — protótipo do app do Espaço Anirvana

App de gestão do Espaço Anirvana (Pontal do Sul, PR) com três painéis:
Administração (Dessa e Vitor), Instrutores e Alunos.

- `index.html`, `sw.js`, `manifest.webmanifest`, ícones: o app publicado (GERADO — não editar à mão).
- `fonte/`: o código de verdade. Edite lá e gere de novo.

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

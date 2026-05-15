# Bellatrix CRM & Orçamentos — base inicial de custos

Base organizada a partir da planilha do fornecedor `TABELA NOVA.xls`, com as regras informadas para orçamento de persianas.

## Arquivos

- `database-schema.sql`: estrutura inicial para PostgreSQL/Supabase.
- `seed-data.sql`: inserts iniciais de linhas, produtos, acessórios e reformas.
- `products.seed.json`: produtos principais com custo de fornecedor.
- `accessories.seed.json`: bandôs, caixas box e guias laterais.
- `reforms.seed.json`: banco de dados de reformas.
- `pricing-rules.json`: regras comerciais/cálculo em formato neutro.
- `pricing-rules.ts`: funções TypeScript para usar no app.
- `products.csv`, `accessories.csv`, `reforms.csv`: versão tabular para conferência.

## Resumo das regras implementadas

### Verticais
- Cálculo por m² do tecido.
- Custo mínimo por peça: **1,50 m²**.
- Sem tamanho máximo de lâmina no sistema, conforme orientação.
- Bandô opcional: **Bandô Alumínio Natural Revestido**.
- Bandô calculado por largura em metro linear.
- Bandô mínimo: **1,50 m**.
- Bandô máximo: **6,00 m**.

### Horizontais PH
- Cálculo por m².
- Largura máxima considerada: **3,00 m**.
- Lâminas: **16mm, 25mm e 50mm**.
- Custo mínimo por peça: **1,20 m²**.
- Custos de acionadores ignorados.

### Rolô
- Cálculo por m² do tecido.
- Largura máxima vem de cada tecido.
- Custo mínimo por peça: **1,20 m²**.
- Bandôs: branco, preto, caixa box branco e caixa box preto.
- Bandô/caixa box mínimo: **1,20 m linear**.
- Bandô/caixa box máximo: **6,00 m linear**.
- Guia lateral calculada por **2H + L**, sem mínimo informado.

### Romana
- Cálculo somente por m² do tecido.
- Largura máxima vem de cada tecido.
- Custo mínimo por peça: **1,20 m²**.
- Bandôs ignorados.

### Painel
- Cálculo por m².
- Largura máxima vem de cada tecido.
- Custo mínimo por peça: **1,20 m²**.
- Bandô calculado pela largura.
- Bandô mínimo: **1,20 m linear**.
- Bandô máximo: **6,00 m linear**.

## Importante

Os valores são **custos do fornecedor**, não preço final de venda. A margem de lucro, desconto, instalação e deslocamento devem entrar na camada de orçamento do app.

Produtos sem custo claro na planilha ficaram com `supplier_cost: null` para forçar revisão antes de uso comercial.

## Quantidade de registros

- Produtos principais: 138
- Acessórios: 7
- Reformas: 43

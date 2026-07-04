# Venda Roupas — Sistema de Gestão de Loja

Trabalho prático da disciplina **Programação Web 2**.
Sistema web completo para gestão de uma loja de roupas: cadastro de clientes e peças, abertura e finalização de vendas com controle de estoque e desconto progressivo, e relatórios gerenciais.

---

## Minimundo

Uma loja de roupas precisa gerenciar seu catálogo de peças, sua base de clientes e o processo de vendas. Cada **venda** é aberta para um cliente, recebe um ou mais itens (peças de roupa com quantidade), e pode ser finalizada. O sistema controla o estoque automaticamente e aplica descontos progressivos conforme o número de itens da venda. Relatórios permitem acompanhar vendas finalizadas, peças mais vendidas e estoque por categoria.

---

## Entidades e Relacionamentos

| Entidade            | Atributos principais                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Cliente**   | id, nome, cpf (único), telefone, email, dataNascimento                                                    |
| **PecaRoupa** | id, denominacao, categoria, tamanho, preco, quantidadeEstoque — chave única: (denominacao, tamanho)      |
| **Venda**     | id, dataVenda, formaPagamento (CARTAO_CREDITO\| PIX), status (ABERTA \| FINALIZADA), valorTotal, clienteId |
| **ItemVenda** | id, vendaId, pecaRoupaId, quantidade, ordem, percentualDesconto, valorItem                                 |

**Relacionamentos:**

```text
Cliente   1 ──< N  Venda
Venda     1 ──< N  ItemVenda  (cascade delete)
PecaRoupa 1 ──< N  ItemVenda
```

O script SQL de criação do banco está em [`prisma/migrations/20260627191345_init/migration.sql`](prisma/migrations/20260627191345_init/migration.sql).

A modelagem completa (DER, modelo lógico e físico) está em [`docs/MODELAGEM.md`](docs/MODELAGEM.md).

---

## Escopo: o que foi pedido × o que foi entregue

O minimundo atribuído foi o **#01 — Venda de Roupas**. Esta seção mapeia cada exigência do
minimundo e das instruções suplementares ao que foi implementado, e lista os recursos
adicionais que vão **além** do que foi solicitado.

### Requisitos do minimundo (todos atendidos)

| Requisito                                                                                                   | Atendido em                                                            |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 4 entidades: Cliente, Peça de Roupa, Item de Venda e Venda                                                 | `prisma/schema.prisma`                                               |
| Cadastro de peça (denominação, categoria, preço, tamanho, estoque) com categorias e tamanhos enumerados | `src/utils/enums.ts`, CRUD de peças                                 |
| Cadastro de cliente (nome, CPF, telefone, e-mail, data de nascimento)                                       | CRUD de clientes                                                       |
| Venda com data, forma de pagamento (cartão/PIX), cliente e status inicial "em aberto"                      | `vendaController`, `schema.prisma` (`status` default `ABERTA`) |
| Desconto automático 0 %/5 %/10 %/15 % conforme ordem do item                                               | `src/services/vendaService.ts` (`calcularPercentualPorOrdem`)      |
| Valor do item e valor total calculados automaticamente                                                      | `vendaService.ts` (`_recalcularVenda`)                             |
| Impedir peças com mesma denominação + tamanho                                                            | índice único composto em`PecaRoupa`                                |
| Impedir clientes com mesmo CPF                                                                              | índice único em`Cliente.cpf`                                       |
| Impedir estoque negativo ao incluir item                                                                    | checagem de estoque em`vendaService.adicionarItem`                   |
| Finalizar venda travando inclusão/exclusão de itens                                                       | `vendaService.finalizarVenda` + guardas por status                   |
| Listagem de peças por categoria escolhida                                                                  | Relatório "Estoque (Balanço)" com filtro opcional de categoria       |
| Listagem de vendas finalizadas (data, pagamento, nome e telefone do cliente, total, qtd. de peças)         | Relatório "Vendas Finalizadas"                                        |
| Listagem de peças por quantidade vendida decrescente + receita                                             | Relatório "Peças Mais Vendidas"                                      |
| CRUD obrigatório de vendas e itens                                                                         | `vendaController` / `vendaService`                                 |

### Requisitos das instruções suplementares (todos atendidos)

| Requisito                                                                    | Como foi atendido                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Aplicação servidora web em Node.js com CRUD                                | Express 5 + EJS, CRUD nas entidades                                                                       |
| ≥ 4 entidades relacionadas, sendo**uma relação muitos-para-muitos** | Venda ↔ Peça de Roupa (N:N) via entidade associativa**ItemVenda**                                 |
| CRUD em ≥ 3 entidades                                                       | Cliente, Peça e Venda (CRUD completo); ItemVenda (criação/remoção)                                   |
| ≥ 3 relatórios, sendo ≥ 2 com dados de 2+ entidades relacionadas          | 3 relatórios; "Vendas Finalizadas" e "Peças Mais Vendidas" cruzam Venda+Cliente+Item / Item+Venda+Peça |
| SGBD à escolha do grupo                                                     | SQLite (arquivo local, sem servidor)                                                                      |
| Script de criação do banco                                                 | `prisma/migrations/.../migration.sql`                                                                   |

### Extras entregues além do que foi pedido

Recursos que **não** eram exigidos pelo minimundo, incluídos para qualidade de uso:

| Extra                             | Descrição                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Paginação configurável         | 5/10/20/50/100 itens por página em todas as listagens e relatórios                                       |
| Filtros e busca                   | Busca por nome/CPF (clientes), filtro por denominação/categoria (peças), por status e período (vendas) |
| Validação algorítmica de CPF   | Dígitos verificadores + rejeição de sequências repetidas (minimundo só exige unicidade)               |
| Validação de telefone           | 11 dígitos e rejeição de repetições                                                                   |
| Validação de data de nascimento | Não pode ser futura; idade mínima de 12 anos                                                             |
| Máscaras de input                | CPF`000.000.000-00` e telefone `(00) 00000-0000`                                                       |
| Responsividade mobile             | Breakpoints 768 px e 900 px                                                                                |
| Mensagens de feedback             | Flash de sucesso/erro com auto-dispensa                                                                    |
| Linha de total nos relatórios    | Valor total e quantidade ao fim de cada relatório                                                         |
| Destaque de estoque zerado        | Sinalização visual na listagem de peças                                                                 |
| Restauração de estoque          | Estoque devolvido ao remover item ou excluir venda aberta                                                  |
| Seed de dados                     | 10 clientes, 26 peças, 18 vendas para demonstração                                                      |
| Confirmação de exclusão        | Diálogo de confirmação antes de qualquer exclusão                                                      |
| Exportação de relatórios       | Download dos três relatórios em PDF, XLS (.xlsx) e CSV, respeitando os filtros aplicados                 |
| Balanço de estoque                | Relatório de estoque exibe o valor total em estoque por peça; o filtro de categoria passou a ser opcional |
| Soft delete de clientes           | Inativação em vez de exclusão: cliente some das listagens mas preserva o histórico; toggle de inativos + reativação |
| Busca dinâmica                    | Listagens de clientes e peças filtram enquanto o usuário digita (sem recarregar a página)                |
| Devoluções e trocas (estorno)     | Cancelar/devolver venda estorna o estoque mantendo o registro; troca gera nova venda vinculada           |
| Histórico do cliente              | Tela com todas as compras do cliente e o total comprado                                                    |

---

## Stack

| Camada         | Tecnologia                                     |
| -------------- | ---------------------------------------------- |
| Runtime        | **Node.js** (v18+)                       |
| Linguagem      | **TypeScript**                           |
| Framework web  | **Express 5**                            |
| ORM            | **Prisma 6**                             |
| Banco de dados | **SQLite** (arquivo local, sem servidor) |
| Templates      | EJS + express-ejs-layouts                      |
| Execução TS  | tsx (sem compilação prévia em dev)          |
| Exportações  | exceljs (.xlsx) + pdfkit (PDF)                 |
| Utilitários   | method-override, dotenv                        |

---

## Instalação e execução

> **Pré-requisito:** Node.js 18 ou superior instalado. Nenhum banco de dados externo é necessário — o SQLite gera o arquivo automaticamente.

### 1. Clonar o repositório e instalar as dependências

```bash
cd e-comerce-pw2
npm install
```

### 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

O `.env` já vem com a URL padrão do SQLite (`DATABASE_URL="file:./dev.db"`, resolvida em `prisma/dev.db`); nenhuma edição é necessária.

### 3. Criar o banco de dados e popular dados de exemplo

```bash
npx prisma migrate dev   # cria o banco, aplica a migração e gera o Prisma Client
npm run seed             # popula 10 clientes, 26 peças e 18 vendas de exemplo
```

> O `prisma migrate dev` já executa o `prisma generate` internamente. Caso o Prisma Client fique desatualizado, rode `npx prisma generate`.

### 4. Executar a aplicação

A aplicação pode ser executada de duas formas: **desenvolvimento** (executa o TypeScript direto) ou **produção** (compila para JavaScript primeiro).

**Desenvolvimento (recomendado para rodar localmente):**

```bash
npm run dev
```

Usa o **tsx** (`tsx watch src/server.ts`), que **executa o TypeScript diretamente, sem gerar arquivos `.js`**, e reinicia o servidor a cada alteração no código.

**Produção (compilando para JavaScript):**

```bash
npm run build   # compila o TypeScript com o tsc → gera os arquivos .js em dist/
npm start       # executa o JavaScript compilado: node dist/src/server.js
```

O **`npm run build`** roda o `tsc`, que transpila todo o `src/` (e `prisma/`) para JavaScript na pasta `dist/`. O **`npm start`** então executa `node dist/src/server.js`, sem depender do tsx — é o modo usado em um servidor de produção.

> Execute sempre a partir da **raiz do projeto**: os caminhos de `views/` e `public/` são resolvidos em relação ao diretório atual.

Em ambos os casos, acesse **http://localhost:3000** no navegador.

### Scripts npm disponíveis

| Script              | Comando                     | Descrição                                                 |
| ------------------- | --------------------------- | ----------------------------------------------------------- |
| `npm run dev`     | `tsx watch src/server.ts` | Servidor em desenvolvimento (TypeScript direto, com reload) |
| `npm run build`   | `tsc`                     | Compila o TypeScript para JavaScript em`dist/`            |
| `npm start`       | `node dist/src/server.js` | Executa a versão compilada (requer`npm run build` antes) |
| `npm run seed`    | `tsx prisma/seed.ts`      | Popula o banco com dados de exemplo                         |
| `npm run migrate` | `npx prisma migrate dev`  | Cria/atualiza o banco e gera o Prisma Client                |
| `npm run studio`  | `npx prisma studio`       | Abre o Prisma Studio (interface visual do banco de dados)   |

---

## Funcionalidades implementadas

### Requisito 1 — CRUD de Clientes

- Listar clientes com **busca dinâmica** por nome/CPF (filtra enquanto digita) e paginação configurável (5/10/20/50/100 itens)
- Criar cliente com formulário validado
- Editar cliente preservando dados preenchidos em caso de erro
- **Inativar** cliente (soft delete): some das listagens, mas mantém o histórico; toggle "Mostrar inativos" e reativação
- **Histórico do cliente**: tela com todas as compras e o total comprado

### Requisito 2 — CRUD de Peças de Roupa

- Listar peças com filtros por denominação e categoria, paginação configurável
- Criar/editar peça com categorias e tamanhos enumerados
- Excluir peça (bloqueada se já integrar alguma venda)
- Destaque visual para estoque zerado

### Requisito 3 — Gestão de Vendas

- Abrir nova venda escolhendo cliente (apenas ativos), data e forma de pagamento
- Tela de detalhe com adição e remoção de itens em tempo real
- Visualizar valor total atualizado a cada alteração
- Finalizar venda (transição irreversível ABERTA → FINALIZADA)
- **Cancelar** venda aberta e **devolver** venda finalizada — ambos com **estorno** de estoque, mantendo o registro (status CANCELADA/DEVOLVIDA)
- **Troca**: devolve a venda finalizada e abre uma nova venda vinculada para as peças de troca
- Listar vendas com filtros por status e período (data início/fim)

### Requisito 4 — Controle de Estoque

- Estoque decrementado ao adicionar item à venda
- Estoque restaurado ao remover item de venda aberta
- Bloqueio de adição quando estoque insuficiente (com mensagem de quantidade disponível)

### Requisito 5 — Regras de Desconto Progressivo

- 1º item da venda: 0 % de desconto
- 2º item: 5 %
- 3º item: 10 %
- 4º item em diante: 15 %
- Recálculo automático após qualquer alteração de itens

### Requisito 6 — Validações de Dados

- CPF: algoritmo dos dois dígitos verificadores + rejeição de sequências repetidas
- Telefone: 11 dígitos + rejeição de repetições (ex.: 11111111111)
- Data de nascimento: não pode ser futura; cliente deve ter ao menos 12 anos
- Preço de peça maior que zero; estoque maior ou igual a zero
- Categoria e tamanho devem ser valores do enumerado permitido
- Campos obrigatórios validados no servidor (independente do atributo `required` HTML)
- Formulário preserva dados digitados em caso de erro de validação
- Campo com erro é destacado visualmente

### Requisito 7 — Relatórios Gerenciais

| Relatório           | Filtros                 | Paginação | Linha de total                    |
| -------------------- | ----------------------- | ----------- | --------------------------------- |
| Estoque (Balanço)   | Categoria (opcional)    | Sim         | Valor total em estoque + unidades |
| Vendas Finalizadas   | Data início / Data fim | Sim         | Valor total + qtd peças          |
| Peças Mais Vendidas | Data início / Data fim | Sim         | Receita + qtd vendida             |

Todos os relatórios podem ser **exportados em PDF, XLS (.xlsx) e CSV**, respeitando os filtros aplicados (exporta todos os registros do filtro, não apenas a página exibida).

### Outros recursos

- Mensagens de feedback (sucesso/erro) com auto-dispensa após 4 s
- Confirmação antes de excluir qualquer registro
- Máscaras de input para CPF (`000.000.000-00`) e telefone (`(00) 00000-0000`)
- Responsividade mobile (breakpoints 768 px e 900 px)
- Dropdown de tamanho de página em todas as listagens e relatórios
- Seed idempotente: 10 clientes, 26 peças, 18 vendas (12 finalizadas + 6 abertas)

---

## Demonstração das Regras de Negócio

### RN1 — Desconto progressivo por ordem de item

1. Abra `/vendas` → clique em uma venda **ABERTA** (ou crie uma nova)
2. Adicione três peças diferentes; observe na coluna **Desconto**: 0 %, 5 %, 10 %
3. Adicione um quarto item → recebe 15 %
4. Remova o 2º item: o sistema renumera a ordem e recalcula todos os descontos e o valor total

### RN2 — Controle de estoque

1. Acesse `/pecas` e anote o estoque atual de uma peça (ex.: "Cueca Box Dry M = 10")
2. Adicione essa peça a uma venda aberta com quantidade 3 → estoque cai para 7
3. Remova o item da venda → estoque volta para 10
4. Tente adicionar quantidade maior que o estoque disponível → mensagem de erro com a quantidade disponível

### RN3 — Restrição de itens em venda finalizada

1. Abra o detalhe de uma venda com status **FINALIZADA**
2. Observe que os botões "Adicionar item" e "Remover" não aparecem

### RN4 — Finalização de venda sem itens

1. Crie uma nova venda (sem adicionar itens)
2. Clique em "Finalizar" → erro: "Não é possível finalizar uma venda sem itens"

### RN5 — Integridade referencial

1. Tente excluir um **cliente** que possui vendas → mensagem de erro bloqueando a exclusão
2. Tente excluir uma **peça** que já consta em alguma venda → idem

### RN6 — Validação de CPF

1. Acesse `/clientes/novo`
2. Digite um CPF inválido (ex.: `000.000.000-00`) → erro "CPF inválido" com destaque no campo
3. Corrija para um CPF válido → formulário aceita e preserva os demais campos preenchidos

### RN7 — Relatório de Peças Mais Vendidas

1. Acesse Relatórios → Peças Mais Vendidas
2. Observe a ordenação por quantidade decrescente e a linha de total ao fim da tabela
3. Aplique filtro de período (ex.: jan–mar 2026) → lista refiltra e totais se atualizam

---

## Estrutura do Projeto

```text
e-comerce-pw2/
├── prisma/
│   ├── migrations/          # Script SQL de criação do banco (artefato de entrega)
│   ├── schema.prisma        # Definição do modelo de dados
│   └── seed.ts              # Dados de exemplo (10 clientes, 26 peças, 18 vendas)
├── public/
│   ├── css/                 # style.css + clientes.css + pecas.css + vendas.css
│   └── js/app.js            # Máscaras, confirmações, flash e dropdown
├── src/
│   ├── controllers/         # clienteController, pecaController, vendaController, relatorioController
│   ├── routes/              # clientes, pecas, vendas, relatorios
│   ├── services/            # vendaService (regras de negócio) + relatorioService
│   ├── utils/               # enums.ts + validators.ts
│   ├── prismaClient.ts
│   └── server.ts
├── views/
│   ├── clientes/            # index, form
│   ├── pecas/               # index, form
│   ├── vendas/              # index, novo, detalhe
│   ├── relatorios/          # estoque, vendas-finalizadas, pecas-mais-vendidas
│   ├── partials/            # paginacao
│   ├── layout.ejs
│   └── index.ejs
├── .env.example
├── package.json
└── tsconfig.json
```

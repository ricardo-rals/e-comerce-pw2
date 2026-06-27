# Venda Roupas

Sistema web de gestão de vendas de roupas, desenvolvido com Node.js, Express, TypeScript, Prisma e EJS.

## Tecnologias

- **Node.js** + **TypeScript**
- **Express 5** — framework web
- **EJS** + **express-ejs-layouts** — templates HTML com layout compartilhado
- **Prisma 7** — ORM com SQLite via adaptador `@prisma/adapter-libsql`
- **method-override** — suporte a PUT e DELETE em formulários HTML
- **dotenv** — variáveis de ambiente
- **tsx** — execução TypeScript em desenvolvimento

## Pré-requisitos

- Node.js 18+
- npm 9+

## Instalação

```bash
git clone <repo-url>
cd venda-roupas
npm install
cp .env.example .env
```

## Variáveis de ambiente

| Variável       | Descrição                  | Padrão           |
|----------------|----------------------------|------------------|
| `DATABASE_URL` | Caminho do banco de dados  | `file:./dev.db`  |

## Scripts

| Comando           | Descrição                           |
|-------------------|-------------------------------------|
| `npm run dev`     | Sobe o servidor em modo watch (tsx) |
| `npm run build`   | Compila TypeScript para `dist/`     |
| `npm start`       | Executa o build compilado           |
| `npm run migrate` | Executa as migrations do banco      |
| `npm run seed`    | Popula o banco com dados iniciais   |
| `npm run studio`  | Abre o Prisma Studio                |

## Banco de dados

O projeto usa **SQLite** gerenciado pelo **Prisma 6**. O schema define quatro entidades:

| Modelo | Descrição |
| --- | --- |
| `Cliente` | Dados pessoais do cliente (CPF único) |
| `PecaRoupa` | Catálogo de peças com estoque (`denominacao + tamanho` únicos) |
| `Venda` | Cabeçalho da venda vinculada a um cliente |
| `ItemVenda` | Linha de cada peça dentro de uma venda (cascade delete) |

Os campos de domínio enumerado (`categoria`, `tamanho`, `formaPagamento`, `status`) são `String` no banco — SQLite não suporta enum nativo — e validados na camada de aplicação via `src/utils/enums.ts`.

## Estrutura de pastas

```text
├── prisma/
│   ├── schema.prisma        # modelos do banco de dados
│   └── migrations/          # histórico de migrations SQL
├── src/
│   ├── server.ts            # ponto de entrada da aplicação
│   ├── prismaClient.ts      # instância única do PrismaClient
│   ├── routes/              # definição de rotas
│   ├── controllers/         # lógica de requisição/resposta
│   ├── services/            # regras de negócio
│   └── utils/
│       └── enums.ts         # constantes e tipos de domínio
├── views/
│   ├── layout.ejs           # layout base compartilhado
│   ├── index.ejs            # página inicial
│   ├── partials/            # fragmentos reutilizáveis
│   ├── clientes/
│   ├── pecas/
│   ├── vendas/
│   └── relatorios/
├── public/
│   ├── css/
│   └── js/
├── tsconfig.json
└── .env.example
```

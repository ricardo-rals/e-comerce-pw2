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

## Estrutura de pastas

```text
├── prisma/
│   └── schema.prisma        # modelos do banco de dados
├── src/
│   ├── server.ts            # ponto de entrada da aplicação
│   ├── prismaClient.ts      # instância única do PrismaClient
│   ├── routes/              # definição de rotas
│   ├── controllers/         # lógica de requisição/resposta
│   ├── services/            # regras de negócio
│   └── utils/               # funções utilitárias
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
├── prisma.config.ts         # configuração do Prisma 7 (adapter libsql)
├── tsconfig.json
└── .env.example
```

## Nota sobre o Prisma 7

O Prisma 7 removeu o campo `url` do `schema.prisma`. A URL de conexão é configurada em `prisma.config.ts` via `defineConfig`, e o `PrismaClient` recebe o adapter `PrismaLibSQL` diretamente no construtor.

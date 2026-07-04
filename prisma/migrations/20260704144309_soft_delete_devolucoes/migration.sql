-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_Cliente" ("atualizadoEm", "cpf", "criadoEm", "dataNascimento", "email", "id", "nome", "telefone") SELECT "atualizadoEm", "cpf", "criadoEm", "dataNascimento", "email", "id", "nome", "telefone" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_cpf_key" ON "Cliente"("cpf");
CREATE TABLE "new_Venda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataVenda" DATETIME NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "valorTotal" REAL NOT NULL DEFAULT 0,
    "clienteId" INTEGER NOT NULL,
    "vendaOrigemId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Venda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venda_vendaOrigemId_fkey" FOREIGN KEY ("vendaOrigemId") REFERENCES "Venda" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_Venda" ("atualizadoEm", "clienteId", "criadoEm", "dataVenda", "formaPagamento", "id", "status", "valorTotal") SELECT "atualizadoEm", "clienteId", "criadoEm", "dataVenda", "formaPagamento", "id", "status", "valorTotal" FROM "Venda";
DROP TABLE "Venda";
ALTER TABLE "new_Venda" RENAME TO "Venda";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

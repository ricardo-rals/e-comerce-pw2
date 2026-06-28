import { PrismaClient } from "@prisma/client";

import type { Categoria, Tamanho } from "../src/utils/enums.js";

const prisma = new PrismaClient();

interface PecaSeed {
  denominacao: string;
  categoria: Categoria;
  preco: number;
  tamanho: Tamanho;
  quantidadeEstoque: number;
}

interface ClienteSeed {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: Date;
}

const pecas: PecaSeed[] = [
  {
    denominacao: "Camisa Social Slim",
    categoria: "CAMISA",
    preco: 89.9,
    tamanho: "M",
    quantidadeEstoque: 15,
  },
  {
    denominacao: "Camisa Social Slim",
    categoria: "CAMISA",
    preco: 89.9,
    tamanho: "G",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Camiseta Básica Algodão",
    categoria: "CAMISETA",
    preco: 39.9,
    tamanho: "P",
    quantidadeEstoque: 30,
  },
  {
    denominacao: "Camiseta Básica Algodão",
    categoria: "CAMISETA",
    preco: 39.9,
    tamanho: "GG",
    quantidadeEstoque: 12,
  },
  {
    denominacao: "Calça Jeans Skinny",
    categoria: "CALCA",
    preco: 149.9,
    tamanho: "M",
    quantidadeEstoque: 8,
  },
  {
    denominacao: "Calça Jeans Skinny",
    categoria: "CALCA",
    preco: 149.9,
    tamanho: "G",
    quantidadeEstoque: 6,
  },
  {
    denominacao: "Short Moletom Comfort",
    categoria: "SHORT",
    preco: 69.9,
    tamanho: "M",
    quantidadeEstoque: 20,
  },
  {
    denominacao: "Short Moletom Comfort",
    categoria: "SHORT",
    preco: 69.9,
    tamanho: "GG",
    quantidadeEstoque: 5,
  },
  {
    denominacao: "Moletom Canguru",
    categoria: "MOLETOM",
    preco: 179.9,
    tamanho: "G",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Biquíni Estampado",
    categoria: "BIQUINI",
    preco: 119.9,
    tamanho: "P",
    quantidadeEstoque: 7,
  },
  {
    denominacao: "Cueca Box Dry",
    categoria: "CUECA",
    preco: 29.9,
    tamanho: "M",
    quantidadeEstoque: 25,
  },
  {
    denominacao: "Calcinha Renda Fina",
    categoria: "CALCINHA",
    preco: 24.9,
    tamanho: "PP",
    quantidadeEstoque: 18,
  },
];

const clientes: ClienteSeed[] = [
  {
    nome: "Ana Paula Ferreira",
    cpf: "123.456.789-09",
    telefone: "(11) 91234-5678",
    email: "ana.ferreira@email.com",
    dataNascimento: new Date("1990-03-15"),
  },
  {
    nome: "Carlos Eduardo Souza",
    cpf: "987.654.321-00",
    telefone: "(21) 99876-5432",
    email: "carlos.souza@email.com",
    dataNascimento: new Date("1985-07-22"),
  },
  {
    nome: "Mariana Costa Lima",
    cpf: "456.789.123-87",
    telefone: "(31) 98765-4321",
    email: "mariana.lima@email.com",
    dataNascimento: new Date("1998-11-08"),
  },
  {
    nome: "João Victor Almeida",
    cpf: "321.654.987-63",
    telefone: "(41) 97654-3210",
    email: "joao.almeida@email.com",
    dataNascimento: new Date("1993-05-30"),
  },
];

async function main(): Promise<void> {
  console.log("Populando peças de roupa...");

  for (const peca of pecas) {
    await prisma.pecaRoupa.upsert({
      where: {
        denominacao_tamanho: {
          denominacao: peca.denominacao,
          tamanho: peca.tamanho,
        },
      },
      update: {
        preco: peca.preco,
        quantidadeEstoque: peca.quantidadeEstoque,
      },
      create: peca,
    });
  }

  console.log(`  ${pecas.length} peças inseridas/atualizadas.`);

  console.log("Populando clientes...");

  for (const cliente of clientes) {
    await prisma.cliente.upsert({
      where: { cpf: cliente.cpf },
      update: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
      },
      create: cliente,
    });
  }

  console.log(`  ${clientes.length} clientes inseridos/atualizados.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);

    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

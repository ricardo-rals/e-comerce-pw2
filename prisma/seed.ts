import { PrismaClient } from "@prisma/client";

import type {
  Categoria,
  Tamanho,
  FormaPagamento,
  StatusVenda,
} from "../src/utils/enums.js";

const prisma = new PrismaClient();

function calcDesconto(ordem: number): number {
  if (ordem === 1) return 0;
  if (ordem === 2) return 5;
  if (ordem === 3) return 10;
  return 15;
}

function calcValorItem(
  preco: number,
  quantidade: number,
  percentualDesconto: number,
): number {
  return (
    Math.round(preco * quantidade * (1 - percentualDesconto / 100) * 100) / 100
  );
}

function pecaKey(denominacao: string, tamanho: string): string {
  return `${denominacao}|${tamanho}`;
}


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

interface ItemVendaSeed {
  pecaKey: string;
  quantidade: number;
}

interface VendaSeed {
  clienteCpf: string;
  dataVenda: Date;
  formaPagamento: FormaPagamento;
  status: StatusVenda;
  itens: ItemVendaSeed[];
}

// ── dados ─────────────────────────────────────────────────────────────────────
// quantidadeEstoque = estoque final desejado + total vendido no seed
// garante que após criar todas as vendas o saldo seja o valor "final desejado"

const pecas: PecaSeed[] = [

  {
    denominacao: "Camisa Social Slim",
    categoria: "CAMISA",
    preco: 89.9,
    tamanho: "P",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Camisa Social Slim",
    categoria: "CAMISA",
    preco: 89.9,
    tamanho: "M",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Camisa Social Slim",
    categoria: "CAMISA",
    preco: 89.9,
    tamanho: "G",
    quantidadeEstoque: 10,
  },
  // CAMISETA (P sold 3, M sold 5, G sold 0, GG sold 2)
  {
    denominacao: "Camiseta Básica Algodão",
    categoria: "CAMISETA",
    preco: 39.9,
    tamanho: "P",
    quantidadeEstoque: 15,
  },
  {
    denominacao: "Camiseta Básica Algodão",
    categoria: "CAMISETA",
    preco: 39.9,
    tamanho: "M",
    quantidadeEstoque: 20,
  },
  {
    denominacao: "Camiseta Básica Algodão",
    categoria: "CAMISETA",
    preco: 39.9,
    tamanho: "G",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Camiseta Básica Algodão",
    categoria: "CAMISETA",
    preco: 39.9,
    tamanho: "GG",
    quantidadeEstoque: 10,
  },
  // CALÇA (Skinny P sold 1, M sold 2, G sold 2 / Slim M sold 2)
  {
    denominacao: "Calça Jeans Skinny",
    categoria: "CALCA",
    preco: 149.9,
    tamanho: "P",
    quantidadeEstoque: 5,
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
    denominacao: "Calça Jeans Slim",
    categoria: "CALCA",
    preco: 159.9,
    tamanho: "M",
    quantidadeEstoque: 8,
  },
  // SHORT (P sold 2, M sold 3, GG sold 1)
  {
    denominacao: "Short Moletom Comfort",
    categoria: "SHORT",
    preco: 69.9,
    tamanho: "P",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Short Moletom Comfort",
    categoria: "SHORT",
    preco: 69.9,
    tamanho: "M",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Short Moletom Comfort",
    categoria: "SHORT",
    preco: 69.9,
    tamanho: "GG",
    quantidadeEstoque: 5,
  },
  // MOLETOM (P sold 1, M sold 1, G sold 2)
  {
    denominacao: "Moletom Canguru",
    categoria: "MOLETOM",
    preco: 179.9,
    tamanho: "P",
    quantidadeEstoque: 6,
  },
  {
    denominacao: "Moletom Canguru",
    categoria: "MOLETOM",
    preco: 179.9,
    tamanho: "M",
    quantidadeEstoque: 7,
  },
  {
    denominacao: "Moletom Canguru",
    categoria: "MOLETOM",
    preco: 179.9,
    tamanho: "G",
    quantidadeEstoque: 8,
  },
  // BIQUÍNI (P sold 3, M sold 2, G sold 1)
  {
    denominacao: "Biquíni Estampado",
    categoria: "BIQUINI",
    preco: 119.9,
    tamanho: "P",
    quantidadeEstoque: 8,
  },
  {
    denominacao: "Biquíni Estampado",
    categoria: "BIQUINI",
    preco: 119.9,
    tamanho: "M",
    quantidadeEstoque: 7,
  },
  {
    denominacao: "Biquíni Estampado",
    categoria: "BIQUINI",
    preco: 119.9,
    tamanho: "G",
    quantidadeEstoque: 5,
  },
  // CUECA (P sold 3, M sold 4, G sold 4)
  {
    denominacao: "Cueca Box Dry",
    categoria: "CUECA",
    preco: 29.9,
    tamanho: "P",
    quantidadeEstoque: 11,
  },
  {
    denominacao: "Cueca Box Dry",
    categoria: "CUECA",
    preco: 29.9,
    tamanho: "M",
    quantidadeEstoque: 14,
  },
  {
    denominacao: "Cueca Box Dry",
    categoria: "CUECA",
    preco: 29.9,
    tamanho: "G",
    quantidadeEstoque: 12,
  },
  // CALCINHA (PP sold 5, P sold 2, M sold 4)
  {
    denominacao: "Calcinha Renda Fina",
    categoria: "CALCINHA",
    preco: 24.9,
    tamanho: "PP",
    quantidadeEstoque: 13,
  },
  {
    denominacao: "Calcinha Renda Fina",
    categoria: "CALCINHA",
    preco: 24.9,
    tamanho: "P",
    quantidadeEstoque: 10,
  },
  {
    denominacao: "Calcinha Renda Fina",
    categoria: "CALCINHA",
    preco: 24.9,
    tamanho: "M",
    quantidadeEstoque: 14,
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
  {
    nome: "Fernanda Oliveira Santos",
    cpf: "071.234.587-61",
    telefone: "(51) 96543-2109",
    email: "fernanda.santos@email.com",
    dataNascimento: new Date("1995-08-14"),
  },
  {
    nome: "Ricardo Augusto Lima da Silva",
    cpf: "358.496.127-00",
    telefone: "(61) 95432-1098",
    email: "ricardo.rals.dev@email.com",
    dataNascimento: new Date("1988-12-03"),
  },
  {
    nome: "Patrícia Gonçalves Alves",
    cpf: "649.821.305-15",
    telefone: "(71) 94321-0987",
    email: "patricia.alves@email.com",
    dataNascimento: new Date("2000-04-20"),
  },
  {
    nome: "Lucas Henrique Pires",
    cpf: "219.047.836-78",
    telefone: "(81) 93210-9876",
    email: "lucas.pires@email.com",
    dataNascimento: new Date("1997-09-11"),
  },
  {
    nome: "Beatriz Ferreira Nascimento",
    cpf: "502.983.614-42",
    telefone: "(91) 92109-8765",
    email: "beatriz.nascimento@email.com",
    dataNascimento: new Date("2001-02-28"),
  },
  {
    nome: "Thiago Cardoso Rodrigues",
    cpf: "173.658.492-82",
    telefone: "(11) 91098-7654",
    email: "thiago.rodrigues@email.com",
    dataNascimento: new Date("1992-06-17"),
  },
];

const vendas: VendaSeed[] = [
  // ── FINALIZADAS ───────────────────────────────────────────────────────────
  // V1 – Ana Paula: camiseta + short + cueca (3 itens, desconto progressivo)
  {
    clienteCpf: "123.456.789-09",
    dataVenda: new Date("2026-01-10"),
    formaPagamento: "PIX",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Camiseta Básica Algodão", "P"), quantidade: 1 },
      { pecaKey: pecaKey("Short Moletom Comfort", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Cueca Box Dry", "M"), quantidade: 2 },
    ],
  },
  // V2 – Carlos Eduardo: camisa + calça
  {
    clienteCpf: "987.654.321-00",
    dataVenda: new Date("2026-01-18"),
    formaPagamento: "CARTAO_CREDITO",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Camisa Social Slim", "G"), quantidade: 1 },
      { pecaKey: pecaKey("Calça Jeans Skinny", "G"), quantidade: 1 },
    ],
  },
  // V3 – Mariana: biquíni + calcinha + short (3 itens femininos)
  {
    clienteCpf: "456.789.123-87",
    dataVenda: new Date("2026-02-05"),
    formaPagamento: "PIX",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Biquíni Estampado", "P"), quantidade: 2 },
      { pecaKey: pecaKey("Calcinha Renda Fina", "PP"), quantidade: 3 },
      { pecaKey: pecaKey("Short Moletom Comfort", "P"), quantidade: 1 },
    ],
  },
  // V4 – João Victor: calça + camisa
  {
    clienteCpf: "321.654.987-63",
    dataVenda: new Date("2026-02-14"),
    formaPagamento: "CARTAO_CREDITO",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Calça Jeans Skinny", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Camisa Social Slim", "M"), quantidade: 1 },
    ],
  },
  // V5 – Fernanda: moletom + camisetas
  {
    clienteCpf: "071.234.587-61",
    dataVenda: new Date("2026-02-21"),
    formaPagamento: "PIX",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Moletom Canguru", "G"), quantidade: 1 },
      { pecaKey: pecaKey("Camiseta Básica Algodão", "P"), quantidade: 2 },
    ],
  },
  // V6 – Ricardo: 2 camisas + calça slim + short (4 itens)
  {
    clienteCpf: "358.496.127-00",
    dataVenda: new Date("2026-03-03"),
    formaPagamento: "CARTAO_CREDITO",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Camisa Social Slim", "P"), quantidade: 2 },
      { pecaKey: pecaKey("Calça Jeans Slim", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Short Moletom Comfort", "M"), quantidade: 1 },
    ],
  },
  // V7 – Patrícia: biquíni + calcinha
  {
    clienteCpf: "649.821.305-15",
    dataVenda: new Date("2026-03-17"),
    formaPagamento: "PIX",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Biquíni Estampado", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Calcinha Renda Fina", "P"), quantidade: 2 },
    ],
  },
  // V8 – Lucas: moletom + calça + cuecas + camisetas (4 itens, desconto máximo no 4º)
  {
    clienteCpf: "219.047.836-78",
    dataVenda: new Date("2026-03-25"),
    formaPagamento: "CARTAO_CREDITO",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Moletom Canguru", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Calça Jeans Skinny", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Cueca Box Dry", "P"), quantidade: 3 },
      { pecaKey: pecaKey("Camiseta Básica Algodão", "M"), quantidade: 2 },
    ],
  },
  // V9 – Beatriz: biquíni + calcinha + short
  {
    clienteCpf: "502.983.614-42",
    dataVenda: new Date("2026-04-08"),
    formaPagamento: "PIX",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Biquíni Estampado", "G"), quantidade: 1 },
      { pecaKey: pecaKey("Calcinha Renda Fina", "M"), quantidade: 2 },
      { pecaKey: pecaKey("Short Moletom Comfort", "GG"), quantidade: 1 },
    ],
  },
  // V10 – Thiago: calça slim + camisa
  {
    clienteCpf: "173.658.492-82",
    dataVenda: new Date("2026-04-22"),
    formaPagamento: "CARTAO_CREDITO",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Calça Jeans Slim", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Camisa Social Slim", "G"), quantidade: 1 },
    ],
  },
  // V11 – Ana Paula: cuecas GG + camisetas (2ª compra)
  {
    clienteCpf: "123.456.789-09",
    dataVenda: new Date("2026-05-06"),
    formaPagamento: "PIX",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Cueca Box Dry", "G"), quantidade: 4 },
      { pecaKey: pecaKey("Camiseta Básica Algodão", "GG"), quantidade: 2 },
    ],
  },
  // V12 – Carlos Eduardo: moletom + calça + short (2ª compra)
  {
    clienteCpf: "987.654.321-00",
    dataVenda: new Date("2026-05-19"),
    formaPagamento: "CARTAO_CREDITO",
    status: "FINALIZADA",
    itens: [
      { pecaKey: pecaKey("Moletom Canguru", "P"), quantidade: 1 },
      { pecaKey: pecaKey("Calça Jeans Skinny", "P"), quantidade: 1 },
      { pecaKey: pecaKey("Short Moletom Comfort", "M"), quantidade: 1 },
    ],
  },
  // ── ABERTAS ───────────────────────────────────────────────────────────────
  // V13 – Mariana: camisa + calça
  {
    clienteCpf: "456.789.123-87",
    dataVenda: new Date("2026-06-02"),
    formaPagamento: "PIX",
    status: "ABERTA",
    itens: [
      { pecaKey: pecaKey("Camisa Social Slim", "M"), quantidade: 1 },
      { pecaKey: pecaKey("Calça Jeans Skinny", "G"), quantidade: 1 },
    ],
  },
  // V14 – Fernanda: biquíni (item único)
  {
    clienteCpf: "071.234.587-61",
    dataVenda: new Date("2026-06-10"),
    formaPagamento: "CARTAO_CREDITO",
    status: "ABERTA",
    itens: [{ pecaKey: pecaKey("Biquíni Estampado", "M"), quantidade: 1 }],
  },
  // V15 – Ricardo: moletom + cuecas
  {
    clienteCpf: "358.496.127-00",
    dataVenda: new Date("2026-06-15"),
    formaPagamento: "PIX",
    status: "ABERTA",
    itens: [
      { pecaKey: pecaKey("Moletom Canguru", "G"), quantidade: 1 },
      { pecaKey: pecaKey("Cueca Box Dry", "M"), quantidade: 2 },
    ],
  },
  // V16 – Patrícia: calcinha + biquíni
  {
    clienteCpf: "649.821.305-15",
    dataVenda: new Date("2026-06-18"),
    formaPagamento: "CARTAO_CREDITO",
    status: "ABERTA",
    itens: [
      { pecaKey: pecaKey("Calcinha Renda Fina", "PP"), quantidade: 2 },
      { pecaKey: pecaKey("Biquíni Estampado", "P"), quantidade: 1 },
    ],
  },
  // V17 – Lucas: camisetas (item único, quantidade 3)
  {
    clienteCpf: "219.047.836-78",
    dataVenda: new Date("2026-06-21"),
    formaPagamento: "PIX",
    status: "ABERTA",
    itens: [
      { pecaKey: pecaKey("Camiseta Básica Algodão", "M"), quantidade: 3 },
    ],
  },
  // V18 – Beatriz: short + calcinha
  {
    clienteCpf: "502.983.614-42",
    dataVenda: new Date("2026-06-25"),
    formaPagamento: "CARTAO_CREDITO",
    status: "ABERTA",
    itens: [
      { pecaKey: pecaKey("Short Moletom Comfort", "P"), quantidade: 1 },
      { pecaKey: pecaKey("Calcinha Renda Fina", "M"), quantidade: 2 },
    ],
  },
];

// ── main ──────────────────────────────────────────────────────────────────────

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

  console.log("Limpando vendas existentes...");

  await prisma.venda.deleteMany({});

  console.log("  Vendas e itens removidos.");

  // mapas para lookup por chave natural
  const pecasDb = await prisma.pecaRoupa.findMany();
  const pecasMap = new Map(
    pecasDb.map((p) => [pecaKey(p.denominacao, p.tamanho), p]),
  );

  const clientesDb = await prisma.cliente.findMany();
  const clientesMap = new Map(clientesDb.map((c) => [c.cpf, c]));

  console.log("Criando vendas...");

  for (const vendaSeed of vendas) {
    const cliente = clientesMap.get(vendaSeed.clienteCpf);

    if (!cliente) {
      throw new Error(`Cliente não encontrado: ${vendaSeed.clienteCpf}`);
    }

    const venda = await prisma.venda.create({
      data: {
        clienteId: cliente.id,
        dataVenda: vendaSeed.dataVenda,
        formaPagamento: vendaSeed.formaPagamento,
        status: "ABERTA",
        valorTotal: 0,
      },
    });

    let valorTotal = 0;

    for (let i = 0; i < vendaSeed.itens.length; i++) {
      const itemSeed = vendaSeed.itens[i];
      const peca = pecasMap.get(itemSeed.pecaKey);

      if (!peca) {
        throw new Error(`Peça não encontrada: ${itemSeed.pecaKey}`);
      }

      const ordem = i + 1;
      const percentualDesconto = calcDesconto(ordem);
      const valorItem = calcValorItem(
        peca.preco,
        itemSeed.quantidade,
        percentualDesconto,
      );

      await prisma.itemVenda.create({
        data: {
          vendaId: venda.id,
          pecaRoupaId: peca.id,
          quantidade: itemSeed.quantidade,
          ordem,
          percentualDesconto,
          valorItem,
        },
      });

      await prisma.pecaRoupa.update({
        where: { id: peca.id },
        data: { quantidadeEstoque: { decrement: itemSeed.quantidade } },
      });

      valorTotal += valorItem;
    }

    await prisma.venda.update({
      where: { id: venda.id },
      data: {
        valorTotal: Math.round(valorTotal * 100) / 100,
        ...(vendaSeed.status === "FINALIZADA" ? { status: "FINALIZADA" } : {}),
      },
    });
  }

  console.log(
    `  ${vendas.length} vendas criadas (${vendas.filter((v) => v.status === "FINALIZADA").length} finalizadas, ${vendas.filter((v) => v.status === "ABERTA").length} abertas).`,
  );

  console.log("\nSeed concluído.");
}

main()
  .catch((err: unknown) => {
    console.error(err);

    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

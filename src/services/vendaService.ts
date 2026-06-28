import { Venda, ItemVenda } from "@prisma/client";

import prisma from "../prismaClient.js";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface CriarVendaInput {
  clienteId: number;
  dataVenda: Date;
  formaPagamento: string;
}

export interface AdicionarItemInput {
  vendaId: number;
  pecaRoupaId: number;
  quantidade: number;
}

// ── utilidade ────────────────────────────────────────────────────────────────

export function calcularPercentualPorOrdem(ordem: number): number {
  if (ordem === 1) return 0;

  if (ordem === 2) return 5;

  if (ordem === 3) return 10;

  return 15;
}

// ── helper interno (reutilizado dentro de transações) ────────────────────────

async function _recalcularVenda(tx: TransactionClient, vendaId: number): Promise<void> {
  const itens = await tx.itemVenda.findMany({
    where: { vendaId },
    orderBy: { ordem: "asc" },
    include: { pecaRoupa: true },
  });

  let valorTotal = 0;

  for (const item of itens) {
    const percentualDesconto = calcularPercentualPorOrdem(item.ordem);

    const valorItem =
      Math.round(item.pecaRoupa.preco * item.quantidade * (1 - percentualDesconto / 100) * 100) / 100;

    await tx.itemVenda.update({
      where: { id: item.id },
      data: {
        percentualDesconto,
        valorItem,
      },
    });

    valorTotal += valorItem;
  }

  await tx.venda.update({
    where: { id: vendaId },
    data: { valorTotal: Math.round(valorTotal * 100) / 100 },
  });
}

// ── funções públicas ─────────────────────────────────────────────────────────

export async function criarVenda({
  clienteId,
  dataVenda,
  formaPagamento,
}: CriarVendaInput): Promise<Venda> {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });

  if (!cliente) throw new Error("Cliente não encontrado.");

  return prisma.venda.create({
    data: {
      clienteId,
      dataVenda,
      formaPagamento,
      status: "ABERTA",
      valorTotal: 0,
    },
  });
}

export async function adicionarItem({
  vendaId,
  pecaRoupaId,
  quantidade,
}: AdicionarItemInput): Promise<ItemVenda> {
  const venda = await prisma.venda.findUnique({ where: { id: vendaId } });

  if (!venda) throw new Error("Venda não encontrada.");

  if (venda.status !== "ABERTA")
    throw new Error("Não é possível adicionar itens a uma venda finalizada.");

  const peca = await prisma.pecaRoupa.findUnique({ where: { id: pecaRoupaId } });

  if (!peca) throw new Error("Peça de roupa não encontrada.");

  if (peca.quantidadeEstoque - quantidade < 0)
    throw new Error(`Estoque insuficiente. Disponível: ${peca.quantidadeEstoque} unidade(s).`);

  return prisma.$transaction(async (tx) => {
    await tx.pecaRoupa.update({
      where: { id: pecaRoupaId },
      data: { quantidadeEstoque: { decrement: quantidade } },
    });

    const totalItens = await tx.itemVenda.count({ where: { vendaId } });

    const item = await tx.itemVenda.create({
      data: {
        vendaId,
        pecaRoupaId,
        quantidade,
        ordem: totalItens + 1,
        percentualDesconto: 0,
        valorItem: 0,
      },
    });

    await _recalcularVenda(tx, vendaId);

    return tx.itemVenda.findUniqueOrThrow({ where: { id: item.id } });
  });
}

export async function removerItem(itemId: number): Promise<void> {
  const item = await prisma.itemVenda.findUnique({
    where: { id: itemId },
    include: { venda: true },
  });

  if (!item) throw new Error("Item não encontrado.");

  if (item.venda.status !== "ABERTA")
    throw new Error("Não é possível remover itens de uma venda finalizada.");

  await prisma.$transaction(async (tx) => {
    await tx.pecaRoupa.update({
      where: { id: item.pecaRoupaId },
      data: { quantidadeEstoque: { increment: item.quantidade } },
    });

    await tx.itemVenda.delete({ where: { id: itemId } });

    const restantes = await tx.itemVenda.findMany({
      where: { vendaId: item.vendaId },
      orderBy: { ordem: "asc" },
    });

    for (let i = 0; i < restantes.length; i++) {
      await tx.itemVenda.update({
        where: { id: restantes[i].id },
        data: { ordem: i + 1 },
      });
    }

    await _recalcularVenda(tx, item.vendaId);
  });
}

export async function recalcularVenda(vendaId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await _recalcularVenda(tx, vendaId);
  });
}

export async function finalizarVenda(vendaId: number): Promise<Venda> {
  const venda = await prisma.venda.findUnique({
    where: { id: vendaId },
    include: { itens: true },
  });

  if (!venda) throw new Error("Venda não encontrada.");

  if (venda.status === "FINALIZADA") throw new Error("A venda já está finalizada.");

  if (venda.itens.length === 0)
    throw new Error("Não é possível finalizar uma venda sem itens.");

  return prisma.venda.update({
    where: { id: vendaId },
    data: { status: "FINALIZADA" },
  });
}

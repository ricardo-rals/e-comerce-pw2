import prisma from "../prismaClient.js";

import {
  CATEGORIAS,
  FORMAS_PAGAMENTO,
  Categoria,
  FormaPagamento,
  StatusVenda,
} from "../utils/enums.js";

export interface PecaPorCategoriaRelatorioItem {
  denominacao: string;
  tamanho: string;
  preco: number;
  quantidadeEstoque: number;
}

export interface VendaFinalizadaRelatorioItem {
  dataVenda: Date;
  formaPagamentoRotulo: string;
  clienteNome: string;
  clienteTelefone: string;
  valorTotalCompra: number;
  quantidadeTotalPecas: number;
}

export interface PecaMaisVendidaRelatorioItem {
  denominacao: string;
  tamanho: string;
  quantidadeTotalVendida: number;
  receitaObtida: number;
}

const categoriaSet = new Set<string>(CATEGORIAS.map((categoria) => categoria.valor));

const formaPagamentoRotulos = Object.fromEntries(
  FORMAS_PAGAMENTO.map((forma) => [forma.valor, forma.rotulo])
) as Record<FormaPagamento, string>;

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;

  if (typeof value === "bigint") return Number(value);

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function isCategoriaValida(categoria: string): categoria is Categoria {
  return categoriaSet.has(categoria);
}

export async function obterPecasPorCategoria(
  categoria: Categoria
): Promise<PecaPorCategoriaRelatorioItem[]> {
  return prisma.pecaRoupa.findMany({
    where: { categoria },
    orderBy: [{ denominacao: "asc" }, { tamanho: "asc" }],
    select: {
      denominacao: true,
      tamanho: true,
      preco: true,
      quantidadeEstoque: true,
    },
  });
}

export async function obterVendasFinalizadas(): Promise<VendaFinalizadaRelatorioItem[]> {
  const statusFinalizada: StatusVenda = "FINALIZADA";

  const vendas = await prisma.venda.findMany({
    where: { status: statusFinalizada },
    include: {
      cliente: {
        select: {
          nome: true,
          telefone: true,
        },
      },
      itens: {
        select: {
          quantidade: true,
        },
      },
    },
    orderBy: { dataVenda: "desc" },
  });

  return vendas.map((venda) => {
    const quantidadeTotalPecas = venda.itens.reduce((soma, item) => soma + item.quantidade, 0);

    const formaPagamento = venda.formaPagamento as FormaPagamento;

    return {
      dataVenda: venda.dataVenda,
      formaPagamentoRotulo: formaPagamentoRotulos[formaPagamento] ?? venda.formaPagamento,
      clienteNome: venda.cliente.nome,
      clienteTelefone: venda.cliente.telefone,
      valorTotalCompra: venda.valorTotal,
      quantidadeTotalPecas,
    };
  });
}

export async function obterPecasMaisVendidas(): Promise<PecaMaisVendidaRelatorioItem[]> {
  const agrupado = await prisma.itemVenda.groupBy({
    by: ["pecaRoupaId"],
    where: {
      venda: {
        status: "FINALIZADA",
      },
    },
    _sum: {
      quantidade: true,
      valorItem: true,
    },
    orderBy: [
      {
        _sum: {
          quantidade: "desc",
        },
      },
      {
        _sum: {
          valorItem: "desc",
        },
      },
    ],
  });

  const pecas = await prisma.pecaRoupa.findMany({
    where: {
      id: {
        in: agrupado.map((g) => g.pecaRoupaId),
      },
    },
    select: {
      id: true,
      denominacao: true,
      tamanho: true,
    },
  });

  const mapaPecas = new Map(
    pecas.map((p) => [p.id, p])
  );

  return agrupado.map((g) => {
    const peca = mapaPecas.get(g.pecaRoupaId)!;

    return {
      denominacao: peca.denominacao,
      tamanho: peca.tamanho,
      quantidadeTotalVendida: g._sum.quantidade ?? 0,
      receitaObtida: Number(g._sum.valorItem ?? 0),
    };
  });
}
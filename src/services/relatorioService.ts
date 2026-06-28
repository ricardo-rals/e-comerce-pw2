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

export interface FiltroData {
  dataInicio?: Date;
  dataFim?: Date;
}

export interface PaginaResultado<T> {
  itens: T[];
  total: number;
}

const categoriaSet = new Set<string>(CATEGORIAS.map((c) => c.valor));

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

function buildDataVendaFilter(filtro: FiltroData) {
  if (!filtro.dataInicio && !filtro.dataFim) {
    return undefined;
  }

  return {
    ...(filtro.dataInicio ? { gte: filtro.dataInicio } : {}),
    ...(filtro.dataFim ? { lte: filtro.dataFim } : {}),
  };
}

export function isCategoriaValida(categoria: string): categoria is Categoria {
  return categoriaSet.has(categoria);
}

export async function obterPecasPorCategoria(
  categoria: Categoria,
  skip: number,
  take: number
): Promise<PaginaResultado<PecaPorCategoriaRelatorioItem>> {
  const where = { categoria };

  const [itens, total] = await Promise.all([
    prisma.pecaRoupa.findMany({
      where,
      orderBy: [{ denominacao: "asc" }, { tamanho: "asc" }],
      select: {
        denominacao: true,
        tamanho: true,
        preco: true,
        quantidadeEstoque: true,
      },
      skip,
      take,
    }),
    prisma.pecaRoupa.count({ where }),
  ]);

  return { itens, total };
}

export async function obterVendasFinalizadas(
  filtro: FiltroData,
  skip: number,
  take: number
): Promise<PaginaResultado<VendaFinalizadaRelatorioItem>> {
  const statusFinalizada: StatusVenda = "FINALIZADA";
  const dataVendaFilter = buildDataVendaFilter(filtro);

  const whereClause = {
    status: statusFinalizada,
    ...(dataVendaFilter ? { dataVenda: dataVendaFilter } : {}),
  };

  const [total, vendas] = await Promise.all([
    prisma.venda.count({ where: whereClause }),
    prisma.venda.findMany({
      where: whereClause,
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
      skip,
      take,
    }),
  ]);

  const itens = vendas.map((venda) => {
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

  return { itens, total };
}

export async function obterPecasMaisVendidas(
  filtro: FiltroData,
  skip: number,
  take: number
): Promise<PaginaResultado<PecaMaisVendidaRelatorioItem>> {
  const dataVendaFilter = buildDataVendaFilter(filtro);

  const vendaWhere = {
    status: "FINALIZADA",
    ...(dataVendaFilter ? { dataVenda: dataVendaFilter } : {}),
  };

  const agrupado = await prisma.itemVenda.groupBy({
    by: ["pecaRoupaId"],
    where: { venda: vendaWhere },
    _sum: {
      quantidade: true,
      valorItem: true,
    },
    orderBy: [
      { _sum: { quantidade: "desc" } },
      { _sum: { valorItem: "desc" } },
    ],
  });

  const total = agrupado.length;
  const paginado = agrupado.slice(skip, skip + take);

  const pecas = await prisma.pecaRoupa.findMany({
    where: {
      id: { in: paginado.map((g) => g.pecaRoupaId) },
    },
    select: {
      id: true,
      denominacao: true,
      tamanho: true,
    },
  });

  const mapaPecas = new Map(pecas.map((p) => [p.id, p]));

  const itens = paginado.map((g) => {
    const peca = mapaPecas.get(g.pecaRoupaId)!;

    return {
      denominacao: peca.denominacao,
      tamanho: peca.tamanho,
      quantidadeTotalVendida: g._sum.quantidade ?? 0,
      receitaObtida: toNumber(g._sum.valorItem),
    };
  });

  return { itens, total };
}

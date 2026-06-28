import { Request, Response } from "express";

import { CATEGORIAS } from "../utils/enums.js";

import {
  isCategoriaValida,
  obterPecasMaisVendidas,
  obterPecasPorCategoria,
  obterVendasFinalizadas,
} from "../services/relatorioService.js";

const PAGE_SIZE = 10;

function parsePagina(raw: unknown): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function parseDataInicio(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || raw === "") {
    return undefined;
  }

  const d = new Date(`${raw}T00:00:00`);

  return isNaN(d.getTime()) ? undefined : d;
}

function parseDataFim(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || raw === "") {
    return undefined;
  }

  const d = new Date(`${raw}T23:59:59`);

  return isNaN(d.getTime()) ? undefined : d;
}

function queryStr(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

export async function pecasPorCategoria(req: Request, res: Response): Promise<void> {
  const categoriaQuery = req.query["categoria"];
  const pagina = parsePagina(req.query["pagina"]);

  const categoriaSelecionada =
    typeof categoriaQuery === "string" && isCategoriaValida(categoriaQuery)
      ? categoriaQuery
      : null;

  let pecas: Awaited<ReturnType<typeof obterPecasPorCategoria>>["itens"] = [];
  let totalPaginas = 1;

  if (categoriaSelecionada) {
    const skip = (pagina - 1) * PAGE_SIZE;
    const resultado = await obterPecasPorCategoria(categoriaSelecionada, skip, PAGE_SIZE);
    pecas = resultado.itens;
    totalPaginas = Math.ceil(resultado.total / PAGE_SIZE) || 1;
  }

  res.render("relatorios/pecas-por-categoria", {
    title: "Relatório de Peças por Categoria",
    CATEGORIAS,
    categoriaSelecionada,
    pecas,
    pagina,
    totalPaginas,
  });
}

export async function vendasFinalizadas(req: Request, res: Response): Promise<void> {
  const pagina = parsePagina(req.query["pagina"]);
  const filtro = {
    dataInicio: queryStr(req.query["dataInicio"]),
    dataFim: queryStr(req.query["dataFim"]),
  };

  const skip = (pagina - 1) * PAGE_SIZE;
  const { itens: vendas, total } = await obterVendasFinalizadas(
    {
      dataInicio: parseDataInicio(filtro.dataInicio),
      dataFim: parseDataFim(filtro.dataFim),
    },
    skip,
    PAGE_SIZE
  );

  const totalPaginas = Math.ceil(total / PAGE_SIZE) || 1;

  res.render("relatorios/vendas-finalizadas", {
    title: "Relatório de Vendas Finalizadas",
    vendas,
    pagina,
    totalPaginas,
    filtro,
  });
}

export async function pecasMaisVendidas(req: Request, res: Response): Promise<void> {
  const pagina = parsePagina(req.query["pagina"]);
  const filtro = {
    dataInicio: queryStr(req.query["dataInicio"]),
    dataFim: queryStr(req.query["dataFim"]),
  };

  const skip = (pagina - 1) * PAGE_SIZE;
  const { itens: pecas, total } = await obterPecasMaisVendidas(
    {
      dataInicio: parseDataInicio(filtro.dataInicio),
      dataFim: parseDataFim(filtro.dataFim),
    },
    skip,
    PAGE_SIZE
  );

  const totalPaginas = Math.ceil(total / PAGE_SIZE) || 1;

  res.render("relatorios/pecas-mais-vendidas", {
    title: "Relatório de Peças Mais Vendidas",
    pecas,
    pagina,
    totalPaginas,
    filtro,
  });
}

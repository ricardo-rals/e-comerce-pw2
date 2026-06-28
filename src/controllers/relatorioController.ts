import { Request, Response } from "express";

import { CATEGORIAS } from "../utils/enums.js";

import {
  isCategoriaValida,
  obterPecasMaisVendidas,
  obterPecasPorCategoria,
  obterVendasFinalizadas,
} from "../services/relatorioService.js";

const TAMANHOS_PAGINA_VALIDOS = [5, 10, 20, 50, 100] as const;

function parsePorPagina(raw: unknown): number {
  const n = Number(raw);
  return (TAMANHOS_PAGINA_VALIDOS as readonly number[]).includes(n) ? n : 10;
}

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
  const porPagina = parsePorPagina(req.query["porPagina"]);

  const categoriaSelecionada =
    typeof categoriaQuery === "string" && isCategoriaValida(categoriaQuery)
      ? categoriaQuery
      : null;

  let pecas: Awaited<ReturnType<typeof obterPecasPorCategoria>>["itens"] = [];
  let totalRegistros = 0;
  let totalPaginas = 1;

  if (categoriaSelecionada) {
    const skip = (pagina - 1) * porPagina;
    const resultado = await obterPecasPorCategoria(categoriaSelecionada, skip, porPagina);
    pecas = resultado.itens;
    totalRegistros = resultado.total;
    totalPaginas = Math.ceil(totalRegistros / porPagina) || 1;
  }

  res.render("relatorios/pecas-por-categoria", {
    title: "Relatório de Peças por Categoria",
    CATEGORIAS,
    categoriaSelecionada,
    pecas,
    paginacao: {
      paginaAtual: pagina,
      totalPaginas,
      totalRegistros,
      porPagina,
    },
  });
}

export async function vendasFinalizadas(req: Request, res: Response): Promise<void> {
  const pagina = parsePagina(req.query["pagina"]);
  const porPagina = parsePorPagina(req.query["porPagina"]);
  const filtro = {
    dataInicio: queryStr(req.query["dataInicio"]),
    dataFim: queryStr(req.query["dataFim"]),
  };

  const skip = (pagina - 1) * porPagina;
  const { itens: vendas, total } = await obterVendasFinalizadas(
    {
      dataInicio: parseDataInicio(filtro.dataInicio),
      dataFim: parseDataFim(filtro.dataFim),
    },
    skip,
    porPagina
  );

  const totalPaginas = Math.ceil(total / porPagina) || 1;

  res.render("relatorios/vendas-finalizadas", {
    title: "Relatório de Vendas Finalizadas",
    vendas,
    paginacao: {
      paginaAtual: pagina,
      totalPaginas,
      totalRegistros: total,
      porPagina,
    },
    filtro,
  });
}

export async function pecasMaisVendidas(req: Request, res: Response): Promise<void> {
  const pagina = parsePagina(req.query["pagina"]);
  const porPagina = parsePorPagina(req.query["porPagina"]);
  const filtro = {
    dataInicio: queryStr(req.query["dataInicio"]),
    dataFim: queryStr(req.query["dataFim"]),
  };

  const skip = (pagina - 1) * porPagina;
  const { itens: pecas, total } = await obterPecasMaisVendidas(
    {
      dataInicio: parseDataInicio(filtro.dataInicio),
      dataFim: parseDataFim(filtro.dataFim),
    },
    skip,
    porPagina
  );

  const totalPaginas = Math.ceil(total / porPagina) || 1;

  res.render("relatorios/pecas-mais-vendidas", {
    title: "Relatório de Peças Mais Vendidas",
    pecas,
    paginacao: {
      paginaAtual: pagina,
      totalPaginas,
      totalRegistros: total,
      porPagina,
    },
    filtro,
  });
}

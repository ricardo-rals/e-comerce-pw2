import { Request, Response } from "express";

import { CATEGORIAS } from "../utils/enums.js";

import {
  isCategoriaValida,
  obterPecasMaisVendidas,
  obterPecasPorCategoria,
  obterVendasFinalizadas,
} from "../services/relatorioService.js";

export async function pecasPorCategoria(req: Request, res: Response): Promise<void> {
  const categoriaQuery = req.query["categoria"];

  const categoriaSelecionada =
    typeof categoriaQuery === "string" && isCategoriaValida(categoriaQuery)
      ? categoriaQuery
      : null;

  const pecas = categoriaSelecionada
    ? await obterPecasPorCategoria(categoriaSelecionada)
    : [];

  res.render("relatorios/pecas-por-categoria", {
    title: "Relatório de Peças por Categoria",
    CATEGORIAS,
    categoriaSelecionada,
    pecas,
  });
}

export async function vendasFinalizadas(_req: Request, res: Response): Promise<void> {
  const vendas = await obterVendasFinalizadas();

  res.render("relatorios/vendas-finalizadas", {
    title: "Relatório de Vendas Finalizadas",
    vendas,
  });
}

export async function pecasMaisVendidas(_req: Request, res: Response): Promise<void> {
  const pecas = await obterPecasMaisVendidas();

  res.render("relatorios/pecas-mais-vendidas", {
    title: "Relatório de Peças Mais Vendidas",
    pecas,
  });
}

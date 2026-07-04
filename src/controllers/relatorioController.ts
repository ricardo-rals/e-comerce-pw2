import { Request, Response } from "express";

import { CATEGORIAS } from "../utils/enums.js";

import {
  isCategoriaValida,
  obterEstoque,
  obterPecasMaisVendidas,
  obterVendasFinalizadas,
} from "../services/relatorioService.js";

import { exportarRelatorio, parseFormato, Relatorio } from "../utils/exportar.js";

const TAMANHOS_PAGINA_VALIDOS = [5, 10, 20, 50, 100] as const;

const CATEGORIA_ROTULO: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.valor, c.rotulo])
);

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

  const d = new Date(`${raw}T00:00:00Z`); // UTC: alinhado ao armazenamento/exibição

  return isNaN(d.getTime()) ? undefined : d;
}

function parseDataFim(raw: unknown): Date | undefined {
  if (typeof raw !== "string" || raw === "") {
    return undefined;
  }

  const d = new Date(`${raw}T23:59:59Z`); // UTC: alinhado ao armazenamento/exibição

  return isNaN(d.getTime()) ? undefined : d;
}

function queryStr(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

function parseCategoria(raw: unknown) {
  return typeof raw === "string" && isCategoriaValida(raw) ? raw : null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Estoque (Balanço) ────────────────────────────────────────────────────────
export async function estoque(req: Request, res: Response): Promise<void> {
  const categoriaSelecionada = parseCategoria(req.query["categoria"]);
  const pagina = parsePagina(req.query["pagina"]);
  const porPagina = parsePorPagina(req.query["porPagina"]);
  const skip = (pagina - 1) * porPagina;

  const { itens, total } = await obterEstoque(categoriaSelecionada, skip, porPagina);

  const pecas = itens.map((p) => ({
    ...p,
    categoriaRotulo: CATEGORIA_ROTULO[p.categoria] ?? p.categoria,
  }));

  const totalPaginas = Math.ceil(total / porPagina) || 1;

  res.render("relatorios/estoque", {
    title: "Relatório de Estoque",
    CATEGORIAS,
    categoriaSelecionada,
    pecas,
    paginacao: {
      paginaAtual: pagina,
      totalPaginas,
      totalRegistros: total,
      porPagina,
    },
  });
}

export async function estoqueExport(req: Request, res: Response): Promise<void> {
  const categoriaSelecionada = parseCategoria(req.query["categoria"]);

  const { itens } = await obterEstoque(categoriaSelecionada);

  const linhas = itens.map((p) => ({
    ...p,
    categoriaRotulo: CATEGORIA_ROTULO[p.categoria] ?? p.categoria,
    valorEstoque: round2(p.preco * p.quantidadeEstoque),
  }));

  const totalUnid = linhas.reduce((s, p) => s + p.quantidadeEstoque, 0);
  const totalValor = round2(linhas.reduce((s, p) => s + p.valorEstoque, 0));

  const rel: Relatorio<(typeof linhas)[number]> = {
    titulo: categoriaSelecionada
      ? `Relatório de Estoque — ${CATEGORIA_ROTULO[categoriaSelecionada]}`
      : "Relatório de Estoque",
    arquivo: "relatorio-estoque",
    colunas: [
      { header: "Denominação", valor: (p) => p.denominacao, tipo: "texto", peso: 3 },
      { header: "Categoria", valor: (p) => p.categoriaRotulo, tipo: "texto", peso: 2 },
      { header: "Tamanho", valor: (p) => p.tamanho, tipo: "texto", peso: 1 },
      { header: "Preço", valor: (p) => p.preco, tipo: "moeda", peso: 1.6 },
      { header: "Estoque", valor: (p) => p.quantidadeEstoque, tipo: "numero", peso: 1 },
      { header: "Valor em Estoque", valor: (p) => p.valorEstoque, tipo: "moeda", peso: 1.8 },
    ],
    linhas,
    totais: ["Total", null, null, null, totalUnid, totalValor],
  };

  await exportarRelatorio(res, parseFormato(req.query["formato"]), rel);
}

// ── Vendas finalizadas ───────────────────────────────────────────────────────
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

export async function vendasFinalizadasExport(req: Request, res: Response): Promise<void> {
  const filtro = {
    dataInicio: parseDataInicio(req.query["dataInicio"]),
    dataFim: parseDataFim(req.query["dataFim"]),
  };

  const { itens } = await obterVendasFinalizadas(filtro);

  const totalValor = round2(itens.reduce((s, v) => s + v.valorTotalCompra, 0));
  const totalPecas = itens.reduce((s, v) => s + v.quantidadeTotalPecas, 0);

  const rel: Relatorio<(typeof itens)[number]> = {
    titulo: "Relatório de Vendas Finalizadas",
    arquivo: "vendas-finalizadas",
    colunas: [
      { header: "Data da Venda", valor: (v) => v.dataVenda, tipo: "data", peso: 1.4 },
      { header: "Forma de Pagamento", valor: (v) => v.formaPagamentoRotulo, tipo: "texto", peso: 2 },
      { header: "Cliente", valor: (v) => v.clienteNome, tipo: "texto", peso: 3 },
      { header: "Telefone", valor: (v) => v.clienteTelefone, tipo: "texto", peso: 1.8 },
      { header: "Valor Total", valor: (v) => v.valorTotalCompra, tipo: "moeda", peso: 1.6 },
      { header: "Qtd. de Peças", valor: (v) => v.quantidadeTotalPecas, tipo: "numero", peso: 1.2 },
    ],
    linhas: itens,
    totais: ["Total", null, null, null, totalValor, totalPecas],
  };

  await exportarRelatorio(res, parseFormato(req.query["formato"]), rel);
}

// ── Peças mais vendidas ──────────────────────────────────────────────────────
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

export async function pecasMaisVendidasExport(req: Request, res: Response): Promise<void> {
  const filtro = {
    dataInicio: parseDataInicio(req.query["dataInicio"]),
    dataFim: parseDataFim(req.query["dataFim"]),
  };

  const { itens } = await obterPecasMaisVendidas(filtro);

  const totalQtd = itens.reduce((s, p) => s + p.quantidadeTotalVendida, 0);
  const totalReceita = round2(itens.reduce((s, p) => s + p.receitaObtida, 0));

  const rel: Relatorio<(typeof itens)[number]> = {
    titulo: "Relatório de Peças Mais Vendidas",
    arquivo: "pecas-mais-vendidas",
    colunas: [
      { header: "Denominação", valor: (p) => p.denominacao, tipo: "texto", peso: 3 },
      { header: "Tamanho", valor: (p) => p.tamanho, tipo: "texto", peso: 1 },
      { header: "Quantidade Total Vendida", valor: (p) => p.quantidadeTotalVendida, tipo: "numero", peso: 2 },
      { header: "Receita Obtida", valor: (p) => p.receitaObtida, tipo: "moeda", peso: 2 },
    ],
    linhas: itens,
    totais: ["Total", null, totalQtd, totalReceita],
  };

  await exportarRelatorio(res, parseFormato(req.query["formato"]), rel);
}

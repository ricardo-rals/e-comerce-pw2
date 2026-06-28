import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import prisma from "../prismaClient.js";

import { CATEGORIAS, TAMANHOS } from "../utils/enums.js";

const enumsView = { CATEGORIAS, TAMANHOS };

const TAMANHOS_PAGINA_VALIDOS = [5, 10, 20, 50, 100] as const;

function parsePorPagina(raw: unknown): number {
  const n = Number(raw);
  return (TAMANHOS_PAGINA_VALIDOS as readonly number[]).includes(n) ? n : 10;
}

export async function listar(req: Request, res: Response): Promise<void> {
  const busca = typeof req.query["busca"] === "string" ? req.query["busca"].trim() : "";
  const categoria = typeof req.query["categoria"] === "string" ? req.query["categoria"].trim() : "";
  const pagina = Math.max(1, Number(req.query["pagina"]) || 1);
  const porPagina = parsePorPagina(req.query["porPagina"]);

  const where: Prisma.PecaRoupaWhereInput = {};

  if (busca) {
    where.denominacao = { contains: busca };
  }

  if (categoria) {
    where.categoria = categoria;
  }

  const skip = (pagina - 1) * porPagina;

  const [pecas, totalRegistros] = await Promise.all([
    prisma.pecaRoupa.findMany({
      where,
      orderBy: [{ denominacao: "asc" }, { tamanho: "asc" }],
      skip,
      take: porPagina,
    }),
    prisma.pecaRoupa.count({ where }),
  ]);

  res.render("pecas/index", {
    title: "Peças de Roupa",
    pecas,
    pageCSS: "pecas.css",
    ...enumsView,
    filtro: {
      busca,
      categoria,
    },
    paginacao: {
      paginaAtual: pagina,
      totalPaginas: Math.ceil(totalRegistros / porPagina) || 1,
      totalRegistros,
      porPagina,
    },
  });
}

export async function novo(_req: Request, res: Response): Promise<void> {
  res.render("pecas/form", {
    title: "Nova Peça",
    peca: null,
    erro: null,
    ...enumsView,
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { denominacao, categoria, tamanho } = req.body as Record<string, string>;

  const preco = Number(req.body.preco);

  const quantidadeEstoque = Number(req.body.quantidadeEstoque);

  if (!Number.isInteger(quantidadeEstoque) || quantidadeEstoque < 0) {
    res.redirect("/pecas/novo?erro=" + encodeURIComponent("Quantidade em estoque deve ser zero ou maior."));
    return;
  }

  if (!(preco > 0)) {
    res.redirect("/pecas/novo?erro=" + encodeURIComponent("Preço deve ser maior que zero."));
    return;
  }

  if (!CATEGORIAS.map(c => c.valor as string).includes(categoria)) {
    res.redirect("/pecas/novo?erro=" + encodeURIComponent("Categoria inválida."));
    return;
  }

  if (!TAMANHOS.map(t => t.valor as string).includes(tamanho)) {
    res.redirect("/pecas/novo?erro=" + encodeURIComponent("Tamanho inválido."));
    return;
  }

  try {
    await prisma.pecaRoupa.create({
      data: {
        denominacao,
        categoria,
        tamanho,
        preco,
        quantidadeEstoque,
      },
    });

    res.redirect("/pecas?sucesso=" + encodeURIComponent("Peça cadastrada com sucesso."));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.render("pecas/form", {
        title: "Nova Peça",
        peca: {
          denominacao,
          categoria,
          tamanho,
          preco,
          quantidadeEstoque,
        },
        erro: "Já existe uma peça com esta denominação e tamanho.",
        ...enumsView,
      });

      return;
    }

    throw err;
  }
}

export async function editar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const peca = await prisma.pecaRoupa.findUnique({ where: { id } });

  if (!peca) {
    res.redirect("/pecas");
    return;
  }

  res.render("pecas/form", {
    title: "Editar Peça",
    peca,
    erro: null,
    ...enumsView,
  });
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const { denominacao, categoria, tamanho } = req.body as Record<string, string>;

  const preco = Number(req.body.preco);
  
  const quantidadeEstoque = Number(req.body.quantidadeEstoque);

  if (!Number.isInteger(quantidadeEstoque) || quantidadeEstoque < 0) {
    res.redirect(`/pecas/${id}/editar?erro=` + encodeURIComponent("Quantidade em estoque deve ser zero ou maior."));
    return;
  }

  if (!(preco > 0)) {
    res.redirect(`/pecas/${id}/editar?erro=` + encodeURIComponent("Preço deve ser maior que zero."));
    return;
  }

  if (!CATEGORIAS.map(c => c.valor as string).includes(categoria)) {
    res.redirect(`/pecas/${id}/editar?erro=` + encodeURIComponent("Categoria inválida."));
    return;
  }

  if (!TAMANHOS.map(t => t.valor as string).includes(tamanho)) {
    res.redirect(`/pecas/${id}/editar?erro=` + encodeURIComponent("Tamanho inválido."));
    return;
  }

  try {
    await prisma.pecaRoupa.update({
      where: { id },
      data: {
        denominacao,
        categoria,
        tamanho,
        preco,
        quantidadeEstoque,
      },
    });

    res.redirect("/pecas?sucesso=" + encodeURIComponent("Peça atualizada com sucesso."));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.render("pecas/form", {
        title: "Editar Peça",
        peca: {
          id,
          denominacao,
          categoria,
          tamanho,
          preco,
          quantidadeEstoque,
        },
        erro: "Já existe uma peça com esta denominação e tamanho.",
        ...enumsView,
      });

      return;
    }

    throw err;
  }
}

export async function remover(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const totalItens = await prisma.itemVenda.count({ where: { pecaRoupaId: id } });

  if (totalItens > 0) {
    res.redirect(
      "/pecas?erro=" + encodeURIComponent("Não é possível remover uma peça que já participa de uma venda.")
    );

    return;
  }

  await prisma.pecaRoupa.delete({ where: { id } });

  res.redirect("/pecas?sucesso=" + encodeURIComponent("Peça removida com sucesso."));
}

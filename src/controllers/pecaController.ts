import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import prisma from "../prismaClient.js";

import { CATEGORIAS, TAMANHOS } from "../utils/enums.js";

const enumsView = { CATEGORIAS, TAMANHOS };

export async function listar(req: Request, res: Response): Promise<void> {
  const pecas = await prisma.pecaRoupa.findMany({
    orderBy: [{ denominacao: "asc" }, { tamanho: "asc" }],
  });

  const erro = typeof req.query["erro"] === "string" ? req.query["erro"] : null;

  res.render("pecas/index", {
    title: "Peças de Roupa",
    pecas,
    erro,
    ...enumsView,
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

  const preco = parseFloat(req.body.preco as string);

  const quantidadeEstoque = parseInt(req.body.quantidadeEstoque as string, 10);

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

    res.redirect("/pecas");
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

  if (!peca) { res.redirect("/pecas"); return; }

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

  const preco = parseFloat(req.body.preco as string);

  const quantidadeEstoque = parseInt(req.body.quantidadeEstoque as string, 10);

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

    res.redirect("/pecas");
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

  res.redirect("/pecas");
}

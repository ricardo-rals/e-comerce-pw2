import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import prisma from "../prismaClient.js";

export async function listar(req: Request, res: Response): Promise<void> {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
  });

  const erro = typeof req.query.erro === "string" ? req.query.erro : null;

  res.render("clientes/index", {
    title: "Clientes",
    clientes,
    erro,
  });
}

export async function exibirFormularioNovo(_req: Request, res: Response): Promise<void> {
  res.render("clientes/form", {
    title: "Novo Cliente",
    cliente: null,
    erro: null,
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { nome, cpf, telefone, email, dataNascimento } = req.body as Record<string, string>;

  try {
    await prisma.cliente.create({
      data: {
        nome,
        cpf,
        telefone,
        email,
        dataNascimento: new Date(`${dataNascimento}T00:00:00`),
      },
    });

    res.redirect("/clientes");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.render("clientes/form", {
        title: "Novo Cliente",
        cliente: {
          nome,
          cpf,
          telefone,
          email,
          dataNascimento,
        },
        erro: "Já existe cliente com este CPF.",
      });

      return;
    }

    throw err;
  }
}

export async function exibirFormularioEditar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) { res.redirect("/clientes"); return; }

  res.render("clientes/form", {
    title: "Editar Cliente",
    cliente,
    erro: null,
  });
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const { nome, cpf, telefone, email, dataNascimento } = req.body as Record<string, string>;

  try {
    await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        cpf,
        telefone,
        email,
        dataNascimento: new Date(`${dataNascimento}T00:00:00`),
      },
    });

    res.redirect("/clientes");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.render("clientes/form", {
        title: "Editar Cliente",
        cliente: {
          id,
          nome,
          cpf,
          telefone,
          email,
          dataNascimento,
        },
        erro: "Já existe cliente com este CPF.",
      });

      return;
    }

    throw err;
  }
}

export async function remover(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const totalVendas = await prisma.venda.count({ where: { clienteId: id } });

  if (totalVendas > 0) {
    res.redirect(
      "/clientes?erro=" + encodeURIComponent("Não é possível remover um cliente com vendas associadas.")
    );

    return;
  }

  await prisma.cliente.delete({ where: { id } });

  res.redirect("/clientes");
}

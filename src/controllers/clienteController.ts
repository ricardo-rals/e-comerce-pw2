import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import prisma from "../prismaClient.js";

import { validarCPF, validarTelefone } from "../utils/validators.js";

export async function listar(req: Request, res: Response): Promise<void> {
  const busca = typeof req.query["busca"] === "string" ? req.query["busca"].trim() : "";

  const where = busca
    ? { 
      OR: [
        { nome: { contains: busca } }, 
        { cpf: { contains: busca } }
        ] 
      }
    : {};

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  res.render("clientes/index", {
    title: "Clientes",
    clientes,
    pageCSS: "clientes.css",
    filtro: { busca },
  });
}

export async function exibirFormularioNovo(_req: Request, res: Response): Promise<void> {
  res.render("clientes/form", {
    title: "Novo Cliente",
    cliente: null,
    erro: null,
    campoErro: null,
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { nome, cpf, telefone, email, dataNascimento } = req.body as Record<string, string>;
  const dadosForm = { nome, cpf, telefone, email, dataNascimento };

  const erroForm = (erro: string, campoErro: string) => {
    res.render("clientes/form", {
      title: "Novo Cliente",
      cliente: dadosForm,
      erro,
      campoErro,
    });
  };

  if (!validarCPF(cpf)) {
    erroForm("CPF inválido.", "cpf");
    return;
  }

  if (!validarTelefone(telefone)) {
    erroForm("Telefone inválido.", "telefone");
    return;
  }

  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (nascimento > hoje) {
    erroForm("A data de nascimento não pode ser futura.", "dataNascimento");
    return;
  }

  const limite12 = new Date(hoje);
  limite12.setFullYear(limite12.getFullYear() - 12);

  if (nascimento > limite12) {
    erroForm("O cliente deve ter ao menos 12 anos.", "dataNascimento");
    return;
  }

  try {
    await prisma.cliente.create({
      data: {
        nome,
        cpf,
        telefone,
        email,
        dataNascimento: nascimento,
      },
    });

    res.redirect("/clientes?sucesso=" + encodeURIComponent("Cliente cadastrado com sucesso."));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      erroForm("Já existe cliente com este CPF.", "cpf");
      return;
    }

    throw err;
  }
}

export async function exibirFormularioEditar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) {
    res.redirect("/clientes");
    return;
  }

  res.render("clientes/form", {
    title: "Editar Cliente",
    cliente,
    erro: null,
    campoErro: null,
  });
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  const { nome, cpf, telefone, email, dataNascimento } = req.body as Record<string, string>;
  const dadosForm = { id, nome, cpf, telefone, email, dataNascimento };

  const erroForm = (erro: string, campoErro: string) => {
    res.render("clientes/form", {
      title: "Editar Cliente",
      cliente: dadosForm,
      erro,
      campoErro,
    });
  };

  if (!validarCPF(cpf)) {
    erroForm("CPF inválido.", "cpf");
    return;
  }

  if (!validarTelefone(telefone)) {
    erroForm("Telefone inválido.", "telefone");
    return;
  }

  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (nascimento > hoje) {
    erroForm("A data de nascimento não pode ser futura.", "dataNascimento");
    return;
  }

  const limite12 = new Date(hoje);
  limite12.setFullYear(limite12.getFullYear() - 12);

  if (nascimento > limite12) {
    erroForm("O cliente deve ter ao menos 12 anos.", "dataNascimento");
    return;
  }

  try {
    await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        cpf,
        telefone,
        email,
        dataNascimento: nascimento,
      },
    });

    res.redirect("/clientes?sucesso=" + encodeURIComponent("Cliente atualizado com sucesso."));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      erroForm("Já existe cliente com este CPF.", "cpf");
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

  res.redirect("/clientes?sucesso=" + encodeURIComponent("Cliente removido com sucesso."));
}

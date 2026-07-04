import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import prisma from "../prismaClient.js";

import { validarCPF, validarTelefone } from "../utils/validators.js";

import { STATUS_VENDA, FORMAS_PAGAMENTO } from "../utils/enums.js";

const TAMANHOS_PAGINA_VALIDOS = [5, 10, 20, 50, 100] as const;

const statusRotulos = Object.fromEntries(STATUS_VENDA.map((s) => [s.valor, s.rotulo]));
const formaPagamentoRotulos = Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f.valor, f.rotulo]));

function parsePorPagina(raw: unknown): number {
  const n = Number(raw);
  return (TAMANHOS_PAGINA_VALIDOS as readonly number[]).includes(n) ? n : 10;
}

export async function listar(req: Request, res: Response): Promise<void> {
  const busca = typeof req.query["busca"] === "string" ? req.query["busca"].trim() : "";
  const inativos = req.query["inativos"] === "1";
  const pagina = Math.max(1, Number(req.query["pagina"]) || 1);
  const porPagina = parsePorPagina(req.query["porPagina"]);

  // ativos por padrão; inativos apenas quando o toggle está marcado
  const where: Prisma.ClienteWhereInput = { ativo: !inativos };

  if (busca) {
    where.OR = [
      { nome: { contains: busca } },
      { cpf: { contains: busca } },
    ];
  }

  const skip = (pagina - 1) * porPagina;

  const [clientes, totalRegistros] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { nome: "asc" },
      skip,
      take: porPagina,
    }),
    prisma.cliente.count({ where }),
  ]);

  const dados = {
    title: "Clientes",
    clientes,
    pageCSS: "clientes.css",
    filtro: { busca, inativos: inativos ? "1" : "" },
    paginacao: {
      paginaAtual: pagina,
      totalPaginas: Math.ceil(totalRegistros / porPagina) || 1,
      totalRegistros,
      porPagina,
    },
  };

  // busca dinâmica: renderiza só a tabela (sem layout)
  if (req.query["parcial"]) {
    res.render("clientes/_tabela", { ...dados, layout: false });
    return;
  }

  res.render("clientes/index", dados);
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

// Soft delete: inativa o cliente (some das listagens) preservando o histórico.
export async function remover(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  await prisma.cliente.update({ where: { id }, data: { ativo: false } });

  res.redirect(
    "/clientes?sucesso=" + encodeURIComponent("Cliente inativado. O histórico de compras foi preservado.")
  );
}

export async function reativar(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  await prisma.cliente.update({ where: { id }, data: { ativo: true } });

  res.redirect("/clientes?inativos=1&sucesso=" + encodeURIComponent("Cliente reativado."));
}

export async function historico(req: Request, res: Response): Promise<void> {
  const id = Number(req.params["id"]);

  if (!Number.isInteger(id) || id <= 0) {
    res.redirect("/clientes");
    return;
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });

  if (!cliente) {
    res.redirect("/clientes?erro=" + encodeURIComponent("Cliente não encontrado."));
    return;
  }

  const vendas = await prisma.venda.findMany({
    where: { clienteId: id },
    include: { _count: { select: { itens: true } } },
    orderBy: { dataVenda: "desc" },
  });

  const totalComprado = vendas
    .filter((v) => v.status === "FINALIZADA")
    .reduce((s, v) => s + v.valorTotal, 0);

  res.render("clientes/historico", {
    title: `Histórico — ${cliente.nome}`,
    cliente,
    vendas,
    totalComprado: Math.round(totalComprado * 100) / 100,
    statusRotulos,
    formaPagamentoRotulos,
    pageCSS: "clientes.css",
  });
}

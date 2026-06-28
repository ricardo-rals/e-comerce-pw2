import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import prisma from "../prismaClient.js";

import * as vendaService from "../services/vendaService.js";

import { FORMAS_PAGAMENTO, STATUS_VENDA, FormaPagamento, StatusVenda } from "../utils/enums.js";

type VendaComCliente = Prisma.VendaGetPayload<{ include: { cliente: true } }>;

type VendaDetalhada = Prisma.VendaGetPayload<{
  include: {
    cliente: true;
    itens: {
      include: { pecaRoupa: true };
    };
  };
}>;

const formaPagamentoRotulos = Object.fromEntries(
  FORMAS_PAGAMENTO.map((fp) => [fp.valor, fp.rotulo])
) as Record<FormaPagamento, string>;

function mensagemErroAmigavel(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }

  return fallback;
}

function dataHojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseId(value: string | string[] | undefined): number {
  if (Array.isArray(value)) {
    throw new Error("Identificador inválido.");
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Identificador inválido.");
  }

  return parsed;
}

export async function listar(req: Request, res: Response): Promise<void> {
  const status = typeof req.query["status"] === "string" ? req.query["status"].trim() : "";

  const statusValidos = STATUS_VENDA.map(s => s.valor as string);
  const where = (status && statusValidos.includes(status)) ? { status } : {};

  const vendas: VendaComCliente[] = await prisma.venda.findMany({
    where,
    include: { cliente: true },
    orderBy: { id: "desc" },
  });

  res.render("vendas/index", {
    title: "Vendas",
    vendas,
    formaPagamentoRotulos,
    STATUS_VENDA,
    pageCSS: "vendas.css",
    filtro: { status },
  });
}

export async function novo(_req: Request, res: Response): Promise<void> {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
  });

  res.render("vendas/novo", {
    title: "Nova Venda",
    clientes,
    FORMAS_PAGAMENTO,
    valoresPadrao: {
      dataVenda: dataHojeISO(),
      formaPagamento: FORMAS_PAGAMENTO[0]?.valor ?? "PIX",
      clienteId: "",
    },
    pageCSS: "vendas.css",
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const { clienteId, dataVenda, formaPagamento } = req.body as Record<string, string>;

  if (!clienteId || !dataVenda || !formaPagamento) {
    res.redirect("/vendas/novo?erro=" + encodeURIComponent("Preencha todos os campos da venda."));

    return;
  }

  try {
    const venda = await vendaService.criarVenda({
      clienteId: parseId(clienteId),
      dataVenda: new Date(`${dataVenda}T00:00:00`),
      formaPagamento,
    });

    res.redirect(
      `/vendas/${venda.id}?sucesso=` + encodeURIComponent("Venda aberta com sucesso. Adicione os itens.")
    );
  } catch (err) {
    const erro = mensagemErroAmigavel(err, "Não foi possível abrir a venda.");

    res.redirect("/vendas/novo?erro=" + encodeURIComponent(erro));
  }
}

export async function detalhe(req: Request, res: Response): Promise<void> {
  try {
    const id = parseId(req.params["id"]);

    const venda: VendaDetalhada | null = await prisma.venda.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: { pecaRoupa: true },
          orderBy: { ordem: "asc" },
        },
      },
    });

    if (!venda) {
      res.redirect("/vendas?erro=" + encodeURIComponent("Venda não encontrada."));

      return;
    }

    const pecas = await prisma.pecaRoupa.findMany({
      orderBy: [{ denominacao: "asc" }, { tamanho: "asc" }],
    });

    res.render("vendas/detalhe", {
      title: `Venda #${venda.id}`,
      venda,
      pecas,
      FORMAS_PAGAMENTO,
      formaPagamentoRotulos,
      isAberta: (venda.status as StatusVenda) === "ABERTA",
      pageCSS: "vendas.css",
    });
  } catch {
    res.redirect("/vendas?erro=" + encodeURIComponent("Venda inválida."));
  }
}

export async function adicionarItem(req: Request, res: Response): Promise<void> {
  const vendaIdRaw = req.params["id"];

  try {
    const vendaId = parseId(vendaIdRaw);

    const { pecaRoupaId, quantidade } = req.body as Record<string, string>;

    if (!pecaRoupaId || !quantidade) {
      throw new Error("Selecione a peça e a quantidade para adicionar item.");
    }

    await vendaService.adicionarItem({
      vendaId,
      pecaRoupaId: parseId(pecaRoupaId),
      quantidade: parseId(quantidade),
    });

    res.redirect(`/vendas/${vendaId}?sucesso=` + encodeURIComponent("Item adicionado com sucesso."));
  } catch (err) {
    const vendaId = Number(vendaIdRaw);

    const erro = mensagemErroAmigavel(err, "Não foi possível adicionar o item na venda.");

    res.redirect(`/vendas/${vendaId}?erro=` + encodeURIComponent(erro));
  }
}

export async function removerItem(req: Request, res: Response): Promise<void> {
  const vendaIdRaw = req.params["id"];

  try {
    const vendaId = parseId(vendaIdRaw);

    const itemId = parseId(req.params["itemId"]);

    await vendaService.removerItem(itemId);

    res.redirect(`/vendas/${vendaId}?sucesso=` + encodeURIComponent("Item removido com sucesso."));
  } catch (err) {
    const vendaId = Number(vendaIdRaw);

    const erro = mensagemErroAmigavel(err, "Não foi possível remover o item da venda.");

    res.redirect(`/vendas/${vendaId}?erro=` + encodeURIComponent(erro));
  }
}

export async function finalizar(req: Request, res: Response): Promise<void> {
  const vendaIdRaw = req.params["id"];

  try {
    const vendaId = parseId(vendaIdRaw);

    await vendaService.finalizarVenda(vendaId);

    res.redirect(`/vendas/${vendaId}?sucesso=` + encodeURIComponent("Venda finalizada com sucesso."));
  } catch (err) {
    const vendaId = Number(vendaIdRaw);

    const erro = mensagemErroAmigavel(err, "Não foi possível finalizar a venda.");

    res.redirect(`/vendas/${vendaId}?erro=` + encodeURIComponent(erro));
  }
}

export async function remover(req: Request, res: Response): Promise<void> {
  try {
    const vendaId = parseId(req.params["id"]);

    await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.findUnique({
        where: { id: vendaId },
        include: { itens: true },
      });

      if (!venda) {
        throw new Error("Venda não encontrada.");
      }

      if ((venda.status as StatusVenda) === "ABERTA") {
        for (const item of venda.itens) {
          await tx.pecaRoupa.update({
            where: { id: item.pecaRoupaId },
            data: { quantidadeEstoque: { increment: item.quantidade } },
          });
        }
      }

      await tx.venda.delete({ where: { id: vendaId } });
    });

    res.redirect("/vendas?sucesso=" + encodeURIComponent("Venda removida com sucesso."));
  } catch (err) {
    const erro = mensagemErroAmigavel(err, "Não foi possível remover a venda.");

    res.redirect("/vendas?erro=" + encodeURIComponent(erro));
  }
}

import { Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type Formato = "csv" | "xlsx" | "pdf";
export type TipoColuna = "texto" | "numero" | "moeda" | "data";

export interface Coluna<T> {
  header: string;
  valor: (linha: T) => string | number | Date;
  tipo?: TipoColuna; // default "texto"
  peso?: number;     // largura relativa no PDF
}

export interface Relatorio<T> {
  titulo: string;
  arquivo: string;                       // nome base do arquivo (sem extensão)
  colunas: Coluna<T>[];
  linhas: T[];
  totais?: (string | number | null)[];   // alinhado às colunas (null = célula vazia)
}

// ── formatação ───────────────────────────────────────────────────────────────
function formatarDataBR(d: Date): string {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarMoedaBR(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// valor textual (CSV/PDF). modo "csv" => moeda numérica com vírgula; "pdf" => "R$ x"
function fmtValor(valor: string | number | Date, tipo: TipoColuna, modo: "csv" | "pdf"): string {
  switch (tipo) {
    case "moeda":
      return modo === "csv"
        ? Number(valor).toFixed(2).replace(".", ",")
        : formatarMoedaBR(Number(valor));
    case "data":
      return formatarDataBR(valor as Date);
    case "numero":
      return String(valor);
    default:
      return String(valor ?? "");
  }
}

function fmtTotal(valor: string | number | null, tipo: TipoColuna, modo: "csv" | "pdf"): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor;
  return fmtValor(valor, tipo, modo);
}

// valor "cru" para XLSX (número quando possível, para permitir somas/formatação)
function valorBruto(valor: string | number | Date, tipo: TipoColuna): string | number {
  switch (tipo) {
    case "moeda":
    case "numero":
      return Number(valor);
    case "data":
      return formatarDataBR(valor as Date);
    default:
      return String(valor ?? "");
  }
}

function totalBruto(valor: string | number | null, tipo: TipoColuna): string | number {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor;
  return valorBruto(valor, tipo);
}

// ── CSV ──────────────────────────────────────────────────────────────────────
function csvEscape(s: string): string {
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function exportarCsv<T>(res: Response, rel: Relatorio<T>): void {
  const linhas: string[] = [];
  linhas.push(rel.colunas.map((c) => csvEscape(c.header)).join(";"));

  for (const linha of rel.linhas) {
    linhas.push(rel.colunas.map((c) => csvEscape(fmtValor(c.valor(linha), c.tipo ?? "texto", "csv"))).join(";"));
  }

  if (rel.totais) {
    linhas.push(rel.totais.map((v, i) => csvEscape(fmtTotal(v, rel.colunas[i]?.tipo ?? "texto", "csv"))).join(";"));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${rel.arquivo}.csv"`);
  res.send("﻿" + linhas.join("\r\n")); // BOM para acentos no Excel
}

// ── XLSX ─────────────────────────────────────────────────────────────────────
async function exportarXlsx<T>(res: Response, rel: Relatorio<T>): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Relatório");

  const header = ws.addRow(rel.colunas.map((c) => c.header));
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F4F8" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFBBBBBB" } } };
  });

  for (const linha of rel.linhas) {
    ws.addRow(rel.colunas.map((c) => valorBruto(c.valor(linha), c.tipo ?? "texto")));
  }

  if (rel.totais) {
    const tr = ws.addRow(rel.totais.map((v, i) => totalBruto(v, rel.colunas[i]?.tipo ?? "texto")));
    tr.font = { bold: true };
    tr.eachCell((cell) => {
      cell.border = { top: { style: "thin", color: { argb: "FF333333" } } };
    });
  }

  rel.colunas.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    if ((c.tipo ?? "texto") === "moeda") col.numFmt = '"R$" #,##0.00';
    let max = c.header.length;
    for (const linha of rel.linhas) {
      const s = fmtValor(c.valor(linha), c.tipo ?? "texto", "csv");
      if (s.length > max) max = s.length;
    }
    col.width = Math.min(45, Math.max(10, max + 2));
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${rel.arquivo}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

// ── PDF ──────────────────────────────────────────────────────────────────────
function exportarPdf<T>(res: Response, rel: Relatorio<T>): void {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${rel.arquivo}.pdf"`);
  doc.pipe(res);

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const usable = right - left;

  doc.font("Helvetica-Bold").fontSize(15).fillColor("#000").text(rel.titulo, left, doc.page.margins.top, { width: usable });
  doc.font("Helvetica").fontSize(8).fillColor("#666").text("Gerado em " + new Date().toLocaleString("pt-BR"), { width: usable });
  doc.fillColor("#000").moveDown(0.6);

  const pesos = rel.colunas.map((c) => c.peso ?? ((c.tipo ?? "texto") === "texto" ? 2 : 1.4));
  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  const larguras = pesos.map((p) => (p / somaPesos) * usable);
  const xs: number[] = [];
  let acc = left;
  for (const w of larguras) { xs.push(acc); acc += w; }

  const padCell = 4;
  const fontSize = 9;
  const rowH = 18;
  const alinhar = (tipo: TipoColuna) => (tipo === "moeda" || tipo === "numero" ? "right" : "left") as "right" | "left";

  function desenharCabecalho(y: number): number {
    doc.font("Helvetica-Bold").fontSize(fontSize).fillColor("#000");
    rel.colunas.forEach((c, i) => {
      doc.text(c.header, xs[i]! + padCell, y, { width: larguras[i]! - 2 * padCell, align: alinhar(c.tipo ?? "texto"), lineBreak: false, ellipsis: true });
    });
    const ly = y + rowH - 4;
    doc.moveTo(left, ly).lineTo(right, ly).lineWidth(1).strokeColor("#333333").stroke();
    return y + rowH;
  }

  let y = desenharCabecalho(doc.y);
  doc.font("Helvetica").fontSize(fontSize).fillColor("#000");
  const limiteInferior = doc.page.height - doc.page.margins.bottom - rowH;

  if (rel.linhas.length === 0) {
    doc.text("Nenhum registro encontrado.", left + padCell, y + 2);
  }

  for (const linha of rel.linhas) {
    if (y > limiteInferior) {
      doc.addPage();
      y = desenharCabecalho(doc.page.margins.top);
      doc.font("Helvetica").fontSize(fontSize).fillColor("#000");
    }
    rel.colunas.forEach((c, i) => {
      doc.text(fmtValor(c.valor(linha), c.tipo ?? "texto", "pdf"), xs[i]! + padCell, y + 2, { width: larguras[i]! - 2 * padCell, align: alinhar(c.tipo ?? "texto"), lineBreak: false, ellipsis: true });
    });
    doc.moveTo(left, y + rowH - 2).lineTo(right, y + rowH - 2).lineWidth(0.5).strokeColor("#E0E0E0").stroke();
    y += rowH;
  }

  if (rel.totais) {
    if (y > limiteInferior) {
      doc.addPage();
      y = desenharCabecalho(doc.page.margins.top);
    }
    doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor("#333333").stroke();
    doc.font("Helvetica-Bold").fontSize(fontSize).fillColor("#000");
    rel.totais.forEach((v, i) => {
      const c = rel.colunas[i];
      doc.text(fmtTotal(v, c?.tipo ?? "texto", "pdf"), xs[i]! + padCell, y + 3, { width: larguras[i]! - 2 * padCell, align: alinhar(c?.tipo ?? "texto"), lineBreak: false, ellipsis: true });
    });
  }

  doc.end();
}

// ── despacho ─────────────────────────────────────────────────────────────────
export function parseFormato(raw: unknown): Formato {
  return raw === "xlsx" || raw === "pdf" ? raw : "csv";
}

export async function exportarRelatorio<T>(res: Response, formato: Formato, rel: Relatorio<T>): Promise<void> {
  if (formato === "xlsx") return exportarXlsx(res, rel);
  if (formato === "pdf") return exportarPdf(res, rel);
  return exportarCsv(res, rel);
}

import "dotenv/config";

import express, { Request, Response, NextFunction } from "express";

import expressLayouts from "express-ejs-layouts";

import methodOverride from "method-override";

import path from "path";

import clientesRouter from "./routes/clientes.js";

import pecasRouter from "./routes/pecas.js";

const app = express();

const PORT = process.env.PORT ?? 3000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "..", "views"));

app.use(expressLayouts);

app.set("layout", "layout");

app.use(express.static(path.join(__dirname, "..", "public")));

app.use(express.urlencoded({ extended: true }));

app.use(
  methodOverride((req) => {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      const method = req.body._method as string;

      delete req.body._method;

      return method;
    }

    return "";
  })
);

// Middleware de flash e helpers de formatação disponíveis em todas as views
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals["currentPath"]   = req.path;

  res.locals["flashSucesso"]  = typeof req.query["sucesso"] === "string" ? req.query["sucesso"] : null;

  res.locals["flashErro"]     = typeof req.query["erro"] === "string" ? req.query["erro"] : null;

  res.locals["formatarMoeda"] = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  res.locals["formatarData"] = (data: Date) =>
    new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  next();
});

app.use("/clientes", clientesRouter);

app.use("/pecas", pecasRouter);

app.get("/", (_req: Request, res: Response) => {
  res.render("index", { title: "Início" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

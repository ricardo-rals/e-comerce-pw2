import "dotenv/config";
import express, { Request, Response } from "express";
import expressLayouts from "express-ejs-layouts";
import methodOverride from "method-override";
import path from "path";

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

app.get("/", (_req: Request, res: Response) => {
  res.render("index", { title: "Venda Roupas" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

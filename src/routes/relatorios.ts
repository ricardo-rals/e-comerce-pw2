import { Router } from "express";

import {
  estoque,
  estoqueExport,
  vendasFinalizadas,
  vendasFinalizadasExport,
  pecasMaisVendidas,
  pecasMaisVendidasExport,
} from "../controllers/relatorioController.js";

const router = Router();

router.get("/", (_req, res) => {
  res.redirect("/relatorios/estoque");
});

router.get("/estoque", estoque);
router.get("/estoque/export", estoqueExport);

router.get("/vendas-finalizadas", vendasFinalizadas);
router.get("/vendas-finalizadas/export", vendasFinalizadasExport);

router.get("/pecas-mais-vendidas", pecasMaisVendidas);
router.get("/pecas-mais-vendidas/export", pecasMaisVendidasExport);

export default router;

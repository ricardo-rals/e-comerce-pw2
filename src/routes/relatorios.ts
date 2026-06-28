import { Router } from "express";

import {
  pecasPorCategoria,
  vendasFinalizadas,
  pecasMaisVendidas,
} from "../controllers/relatorioController.js";

const router = Router();

router.get("/", (_req, res) => {
  res.redirect("/relatorios/pecas-por-categoria");
});

router.get("/pecas-por-categoria", pecasPorCategoria);
router.get("/vendas-finalizadas", vendasFinalizadas);
router.get("/pecas-mais-vendidas", pecasMaisVendidas);

export default router;

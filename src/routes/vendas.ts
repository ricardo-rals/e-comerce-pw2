import { Router } from "express";

import {
  listar,
  novo,
  criar,
  detalhe,
  adicionarItem,
  removerItem,
  finalizar,
  cancelar,
  troca,
} from "../controllers/vendaController.js";

const router = Router();

router.get("/", listar);
router.get("/novo", novo);
router.post("/", criar);
router.get("/:id", detalhe);
router.post("/:id/itens", adicionarItem);
router.delete("/:id/itens/:itemId", removerItem);
router.post("/:id/finalizar", finalizar);
router.post("/:id/troca", troca);
router.delete("/:id", cancelar);

export default router;

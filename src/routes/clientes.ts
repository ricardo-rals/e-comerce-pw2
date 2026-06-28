import { Router } from "express";
import {
  listar,
  exibirFormularioNovo,
  criar,
  exibirFormularioEditar,
  atualizar,
  remover,
} from "../controllers/clienteController.js";

const router = Router();

router.get("/",              listar);
router.get("/novo",          exibirFormularioNovo);
router.post("/",             criar);
router.get("/:id/editar",    exibirFormularioEditar);
router.put("/:id",           atualizar);
router.delete("/:id",        remover);

export default router;

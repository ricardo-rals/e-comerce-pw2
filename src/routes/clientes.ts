import { Router } from "express";
import {
  listar,
  exibirFormularioNovo,
  criar,
  exibirFormularioEditar,
  atualizar,
  remover,
  reativar,
  historico,
} from "../controllers/clienteController.js";

const router = Router();

router.get("/",              listar);
router.get("/novo",          exibirFormularioNovo);
router.post("/",             criar);
router.get("/:id/historico", historico);
router.get("/:id/editar",    exibirFormularioEditar);
router.put("/:id",           atualizar);
router.post("/:id/reativar", reativar);
router.delete("/:id",        remover);

export default router;

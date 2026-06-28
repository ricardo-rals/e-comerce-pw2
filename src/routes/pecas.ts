import { Router } from "express";
import { listar, novo, criar, editar, atualizar, remover } from "../controllers/pecaController.js";

const router = Router();

router.get("/",           listar);
router.get("/novo",       novo);
router.post("/",          criar);
router.get("/:id/editar", editar);
router.put("/:id",        atualizar);
router.delete("/:id",     remover);

export default router;

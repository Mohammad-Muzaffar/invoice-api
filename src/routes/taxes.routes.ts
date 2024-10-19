import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddTaxesController,
  DeleteTaxesController,
  GetAllTaxesController,
  UpdateTaxesController,
} from "../controllers/taxes.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddTaxesController);
router.route("/:id").put(AuthMiddleware, UpdateTaxesController);
router.route("/:id").delete(AuthMiddleware, DeleteTaxesController);
router.route("/").get(AuthMiddleware, GetAllTaxesController);

export default router;

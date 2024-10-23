import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddTaxesController,
  DeleteTaxesController,
  GetAllTaxesByIdController,
  GetAllTaxesController,
  GetSingleTaxController,
  UpdateTaxesController,
} from "../controllers/taxes.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddTaxesController);
router.route("/:id").put(AuthMiddleware, UpdateTaxesController);
router.route("/:id").delete(AuthMiddleware, DeleteTaxesController);
router.route("/:id").get(AuthMiddleware, GetSingleTaxController);
router.route("/").get(AuthMiddleware, GetAllTaxesController);
router.route("/fetch/id").get(AuthMiddleware, GetAllTaxesByIdController);

export default router;

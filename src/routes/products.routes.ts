import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddProductsController,
  DeleteProductsController,
  GetAllProductsController,
  GetSingleProductsController,
  UpdateProductsController,
} from "../controllers/products.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddProductsController);
router.route("/").get(AuthMiddleware, GetAllProductsController);
router.route("/:id").put(AuthMiddleware, UpdateProductsController);
router.route("/:id").delete(AuthMiddleware, DeleteProductsController);
router.route("/:id").get(AuthMiddleware, GetSingleProductsController);

export default router;

import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddProductsController,
  DeleteProductsController,
  GetAllProductsById,
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
router.route("/fetch/id").get(AuthMiddleware, GetAllProductsById);

export default router;

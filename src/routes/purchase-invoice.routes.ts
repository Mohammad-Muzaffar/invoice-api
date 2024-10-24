import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddPurchaseInvoicesController,
  DeletePurchaseInvoiceController,
  GetAllPurchaseInvoiceController,
  GetSinglePurchaseInvoiceController,
  UpdatePurchaseInvoiceController,
} from "../controllers/purchase-invoice.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddPurchaseInvoicesController);
router.route("/").get(AuthMiddleware, GetAllPurchaseInvoiceController);
router.route("/:id").put(AuthMiddleware, UpdatePurchaseInvoiceController);
router.route("/:id").delete(AuthMiddleware, DeletePurchaseInvoiceController);
router.route("/:id").get(AuthMiddleware, GetSinglePurchaseInvoiceController);

export default router;

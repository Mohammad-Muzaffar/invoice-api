import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddInvoicesController,
  DeleteInvoiceController,
  GetAllInvoiceController,
  GetSingleInvoiceController,
  UpdateInvoiceController,
} from "../controllers/invoices.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddInvoicesController);
router.route("/").get(AuthMiddleware, GetAllInvoiceController);
router.route("/:id").put(AuthMiddleware, UpdateInvoiceController);
router.route("/:id").delete(AuthMiddleware, DeleteInvoiceController);
router.route("/:id").get(AuthMiddleware, GetSingleInvoiceController);

export default router;

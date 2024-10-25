import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  GetExcelInvoicesController,
  GetExcelQuotesController,
} from "../controllers/excel.controllers";

const router = express.Router();

router.route("/invoices").get(AuthMiddleware, GetExcelInvoicesController);
router.route("/quotes").get(AuthMiddleware, GetExcelQuotesController);

export default router;

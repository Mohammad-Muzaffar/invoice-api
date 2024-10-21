import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AddInvoicesController } from "../controllers/invoices.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddInvoicesController);

export default router;

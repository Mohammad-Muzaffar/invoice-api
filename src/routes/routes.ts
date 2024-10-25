import express from "express";
import authRouter from "./auth.routes";
import usersRouter from "./users.routes";
import customersRouter from "./customers.routes";
import taxesRouter from "./taxes.routes";
import productsRouter from "./products.routes";
import invoiceRouter from "./invoices.routes";
import quoteRouter from "./quotes.routes";
import purchaseRouter from "./purchase-invoice.routes";
import exportRouter from "./exports.routes";

const router = express.Router();

// Routing:
router.use("/auth/", authRouter);
router.use("/users/", usersRouter);
router.use("/customers/", customersRouter);
router.use("/taxes/", taxesRouter);
router.use("/products/", productsRouter);
router.use("/invoices/", invoiceRouter);
router.use("/quotes/", quoteRouter);
router.use("/purchase-invoices/", purchaseRouter);
router.use("/exports/", exportRouter);

export default router;

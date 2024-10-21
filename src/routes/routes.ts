import express from "express";
import authRouter from "./auth/auth.routes";
import usersRouter from "./users.routes";
import customersRouter from "./customers.routes";
import taxesRouter from "./taxes.routes";
import productsRouter from "./products.routes";
import invoiceRouter from "./invoices.routes";

const router = express.Router();

// Routing:
router.use("/auth/", authRouter);
router.use("/users/", usersRouter);
router.use("/customers/", customersRouter);
router.use("/taxes/", taxesRouter);
router.use("/products/", productsRouter);
router.use("/invoices/", invoiceRouter);

export default router;

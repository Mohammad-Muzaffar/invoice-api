import express from "express";
import authRouter from "./auth/auth.routes";
import usersRouter from "./users.routes";
import customersRouter from "./customers.routes";

const router = express.Router();

// Routing:
router.use("/auth/", authRouter);
router.use("/users/", usersRouter);
router.use("/customers/", customersRouter);

export default router;

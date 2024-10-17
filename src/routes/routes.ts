import express from "express";
import authRouter from "./auth/auth.routes";
import usersRouter from "./users.routes";

const router = express.Router();

// Routing:
router.use("/auth/", authRouter);
router.use("/users/", usersRouter);

export default router;

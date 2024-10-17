import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UpdateUserController } from "../controllers/user.controllers";

const router = express.Router();

router.route("/").put(AuthMiddleware, UpdateUserController);

export default router;

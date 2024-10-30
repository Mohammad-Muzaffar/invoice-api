import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { DashboardController } from "../controllers/dashboard.controllers"

const router = express.Router();

router.route("/").get(AuthMiddleware, DashboardController);

export default router;

import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AddQuotesController } from "../controllers/quote.controller";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddQuotesController);
router.route("/").get(AuthMiddleware, );
router.route("/:id").put(AuthMiddleware, );
router.route("/:id").delete(AuthMiddleware, );
router.route("/:id").get(AuthMiddleware,);

export default router;
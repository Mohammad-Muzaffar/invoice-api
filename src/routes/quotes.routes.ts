import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddQuotesController,
  DeleteQuotesController,
  GetAllQuoteController,
  GetSingleQuoteController,
  UpdateQuotesController,
} from "../controllers/quotes.controller";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddQuotesController);
router.route("/").get(AuthMiddleware, GetAllQuoteController);
router.route("/:id").put(AuthMiddleware, UpdateQuotesController);
router.route("/:id").delete(AuthMiddleware, DeleteQuotesController);
router.route("/:id").get(AuthMiddleware, GetSingleQuoteController);

export default router;

import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  GetUserDetatilsController,
  UpdateUserController,
  UploadUserController,
} from "../controllers/user.controllers";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();

router.route("/").put(AuthMiddleware, UpdateUserController);
router.route("/").get(AuthMiddleware, GetUserDetatilsController);
router
  .route("/uploads")
  .post(upload.array("files", 5), AuthMiddleware, UploadUserController);

export default router;

import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  GetUserDetatilsController,
  UpdateUserController,
  UploadCompanyAuthorizedSignController,
  UploadCompanyLogoController,
  UploadCompanyStampController,
  UploadUserController,
} from "../controllers/user.controllers";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();

router.route("/").put(AuthMiddleware, UpdateUserController);
router.route("/").get(AuthMiddleware, GetUserDetatilsController);
router
  .route("/uploads")
  .post(upload.array("files", 5), AuthMiddleware, UploadUserController);
router
  .route("/uploads/company-logo")
  .post(upload.single("file"), AuthMiddleware, UploadCompanyLogoController);
router
  .route("/uploads/company-stamp")
  .post(upload.single("file"), AuthMiddleware, UploadCompanyStampController);
router
  .route("/uploads/company-signature")
  .post(
    upload.single("file"),
    AuthMiddleware,
    UploadCompanyAuthorizedSignController
  );

export default router;

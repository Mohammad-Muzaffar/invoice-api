import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddAddressController,
  DeleteAddressController,
  GetAddressController,
  UpdateAddressController,
} from "../controllers/address.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddAddressController);
router.route("/:id").put(AuthMiddleware, UpdateAddressController);
router.route("/:id").delete(AuthMiddleware, DeleteAddressController);
router.route("/:id").get(AuthMiddleware, GetAddressController);

export default router;

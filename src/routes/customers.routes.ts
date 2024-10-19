import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddCustomerController,
  DeleteCustomerController,
  GetAllCustomers,
  GetSingleCustomerController,
  UpdateCustomerController,
} from "../controllers/customers.controllers";

const router = express.Router();

router.route("/").post(AuthMiddleware, AddCustomerController);
router.route("/:id").put(AuthMiddleware, UpdateCustomerController);
router.route("/:id").delete(AuthMiddleware, DeleteCustomerController);
router.route("/:id").get(AuthMiddleware, GetSingleCustomerController);
router.route("/").get(AuthMiddleware, GetAllCustomers);

export default router;

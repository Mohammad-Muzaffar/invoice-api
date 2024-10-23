import express from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import {
  AddCustomerController,
  DeleteCustomerController,
  GetAllCustomers,
  GetAllCustomersByIDController,
  GetSingleCustomerController,
  UpdateCustomerController,
} from "../controllers/customers.controllers";
import addressRouter from "./address.routes";

const router = express.Router();

router.use("/address/", addressRouter);

router.route("/").post(AuthMiddleware, AddCustomerController);
router.route("/:id").put(AuthMiddleware, UpdateCustomerController);
router.route("/:id").delete(AuthMiddleware, DeleteCustomerController);
router.route("/:id").get(AuthMiddleware, GetSingleCustomerController);
router.route("/fetch/id").get(AuthMiddleware, GetAllCustomersByIDController);
router.route("/").get(AuthMiddleware, GetAllCustomers);

export default router;

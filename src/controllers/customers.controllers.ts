import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import {
  AddCustomerSchema,
  UpdateCustomerSchema,
} from "../config/customers.zod";
import { ApiError } from "../utils/apiError";

const AddCustomerController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = AddCustomerSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(403, "Zod validation failed.", [error]);
    }

    const customerExists = await prisma.customer.findFirst({
      where: {
        email: req.body.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
    if (customerExists) {
      throw new ApiError(400, "Customer already exists!", [
        "Customer already exists!",
      ]);
    }

    const customer = await prisma.customer.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        createdAt: new Date(),
        userId: req.body.userDetails.id,
      },
    });
    if (!customer) {
      throw new ApiError(500, "Something went wrong!", [
        "Something went wrong while creating customer!",
      ]);
    }

    res.status(200).json({
      status: "Success",
      id: customer.id,
      name: customer.name,
      createdAt: customer.createdAt,
    });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const UpdateCustomerController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = UpdateCustomerSchema.safeParse(req.body);
    const id = req.params.id;
    if (!success || !id) {
      throw new ApiError(403, "Something went wrong.", [
        error,
        "customer id was not provided.",
      ]);
    }

    const customerExists = await prisma.customer.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
    if (!customerExists) {
      throw new ApiError(400, "Customer does not exists!", [
        "Customer does not exists!",
      ]);
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerExists.id,
      },
      data: {
        name: req.body.name || customerExists.name,
        email: req.body.email || customerExists.email,
        phone: req.body.phone || customerExists.phone,
        updatedAt: new Date(),
      },
    });
    if (!customer) {
      throw new ApiError(500, "Something went wrong!", [
        "Something went wrong while updating customer!",
      ]);
    }

    res.status(200).json({
      status: "Success",
      message: "Customer details updated successfull.",
      id: customer.id,
      name: customer.name,
      updatedAt: customer.updatedAt,
    });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const DeleteCustomerController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const id = req.params.id;
    if (!id) {
      throw new ApiError(400, "", ["Customer's id not provided."]);
    }

    const customerExists = await prisma.customer.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
    if (!customerExists) {
      throw new ApiError(404, "Customer does not exists!", [
        "Customer does not exists!",
      ]);
    }

    const deletedCustomer = await prisma.customer.delete({
      where: {
        id: customerExists.id,
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (!deletedCustomer) {
      throw new ApiError(500, "Something went wrong!", [
        "Something went wrong while deleting customer!",
      ]);
    }

    res.status(204).json({
      status: "Success",
      message: `Customer: ${deletedCustomer.name} have been deleted.`,
      id: deletedCustomer.id,
    });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetSingleCustomerController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const id = req.params.id;
    if (!id) {
      throw new ApiError(400, "", ["Customer's id not provided."]);
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        invoices: true,
        quote: true,
        addresses: true,
      },
    });
    if (!customer) {
      throw new ApiError(404, "Customer does not exists!", [
        "Customer does not exists!",
      ]);
    }

    res.status(200).json({
      status: "Success",
      result: customer,
    });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
}; // Need to add pagination to invoices, addresses under customer.

// Need to add get all Customers with pagination.

export {
  AddCustomerController,
  UpdateCustomerController,
  DeleteCustomerController,
  GetSingleCustomerController,
};
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

    const customerExists = await prisma.clients.findFirst({
      where: {
        email: req.body.email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNo: true,
      },
    });
    if (customerExists) {
      throw new ApiError(400, "Customer already exists!", [
        "Customer already exists!",
      ]);
    }

    const customer = await prisma.clients.create({
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNo: req.body.phoneNo,
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
      name: customer.firstName + " " + customer.lastName,
      createdAt: customer.createdAt,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
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

    const customerExists = await prisma.clients.findFirst({
      where: {
        id: id,
      },
    });
    if (!customerExists) {
      throw new ApiError(400, "Customer does not exists!", [
        "Customer does not exists!",
      ]);
    }

    const customer = await prisma.clients.update({
      where: {
        id: customerExists.id,
      },
      data: {
        firstName: req.body.firstName || customerExists.firstName,
        lastName: req.body.lastName || customerExists.lastName,
        email: req.body.email || customerExists.email,
        phoneNo: req.body.phoneNo || customerExists.phoneNo,
        panNo: req.body.panNo || customerExists?.panNo,
        companyName: req.body.companyName || customerExists.companyName,
        clientGstinNumber:
          req.body.clientGstinNumber || customerExists.clientGstinNumber,
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
      name: customer.firstName + customer.lastName,
      updatedAt: customer.updatedAt,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
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

    const customerExists = await prisma.clients.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        phoneNo: true,
      },
    });
    if (!customerExists) {
      throw new ApiError(404, "Customer does not exists!", [
        "Customer does not exists!",
      ]);
    }

    const deletedCustomer = await prisma.clients.delete({
      where: {
        id: customerExists.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!deletedCustomer) {
      throw new ApiError(500, "Something went wrong!", [
        "Something went wrong while deleting customer!",
      ]);
    }

    res.status(204).json({
      status: "Success",
      message: `Customer: ${
        deletedCustomer.firstName + " " + deletedCustomer.lastName
      } have been deleted.`,
      id: deletedCustomer.id,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
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

    const customer = await prisma.clients.findFirst({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNo: true,
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
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetAllCustomers = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { page, limit } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = pageNumber === 1 ? 0 : (pageNumber - 1) * limitNumber;

    const totalEntries = await prisma.clients.count({
      where: {
        userId: req.body.userDetails.id,
      },
    });
    const totalPages = Math.ceil(totalEntries / limitNumber);

    const clients = await prisma.clients.findMany({
      where: {
        userId: req.body.userDetails.id,
      },
      skip: skip,
      take: limitNumber,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        panNo: true,
        phoneNo: true,
        companyName: true,
        invoices: {
          select: {
            id: true,
          },
        },
        quote: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!clients) {
      throw new ApiError(500, "", [
        "Something went wrong while fetching clients.",
      ]);
    }

    const result = clients.map((client) => ({
      ...client,
      invoices: client.invoices.length,
      quote: client.quote.length,
    }));

    res.status(200).json({
      status: "Success",
      result,
      page: pageNumber,
      limit: limitNumber,
      perPage: result.length,
      totalClients: totalEntries,
      totalPages: totalPages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export {
  AddCustomerController,
  UpdateCustomerController,
  DeleteCustomerController,
  GetSingleCustomerController,
  GetAllCustomers,
};

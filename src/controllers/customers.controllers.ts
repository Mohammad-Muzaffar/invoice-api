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
    // Validate incoming data
    const { success, error } = AddCustomerSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation failed.", [error]);
    }

    const {
      email,
      firstName,
      lastName,
      phoneNo,
      panNo,
      companyName,
      clientGstinNumber,
      addresses,
      userDetails,
    } = req.body;

    // Check if the client already exists
    const clientExists = await prisma.clients.findFirst({
      where: { email },
      select: { id: true, email: true },
    });

    if (clientExists) {
      throw new ApiError(400, "Customer already exists!", [
        `Customer with email ${clientExists.email} already exists!`,
      ]);
    }

    // Create a new client and associated addresses in a transaction
    const newClient = await prisma.$transaction(async (prisma) => {
      const createdClient = await prisma.clients.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNo,
          panNo: panNo || null,
          companyName: companyName || null,
          clientGstinNumber: clientGstinNumber || null,
          createdAt: new Date(),
          userId: userDetails.id,
        },
      });

      if (addresses && addresses.length > 0) {
        const addressData = addresses.map((item: any) => ({
          ...item,
          clientId: createdClient.id,
        }));

        await prisma.address.createMany({ data: addressData });
      }

      return createdClient;
    });

    res.status(201).json({
      status: "Success",
      id: newClient.id,
      clientName: `${newClient.firstName} ${newClient.lastName}`,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message || "Something went wrong.",
    });
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
        quotes: true,
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
        quotes: {
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
      quotes: client.quotes.length,
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

const GetAllCustomersByIDController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const clients = await prisma.clients.findMany({
      where: {
        userId: req.body.userDetails.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true
      },
    });
    if (!clients) {
      throw new ApiError(500, "Something went wrong!", [
        "Something went wrong while fetching clients.",
      ]);
    }

    const allClients = clients.map(client => ({
      ...client,
      clientName: `${client.firstName} ${client.lastName}`
    }));

    res.status(200).json({
      status: "Success",
      clients: allClients,
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
  GetAllCustomersByIDController,
};

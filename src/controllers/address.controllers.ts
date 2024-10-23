import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddAddressSchema, UpdateAddressSchema } from "../config/address.zod";

const AddAddressController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = AddAddressSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod Validation Error!", [error]);
    }

    const address = await prisma.address.create({
      data: {
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        postCode: req.body.postCode,
        clientId: req.body.clientId,
      },
    });
    if (!address) {
      throw new ApiError(500, "Something went wrong", [
        "Something went wrong while creating address.",
      ]);
    }

    res.status(200).json({
      status: "Success",
      message: "Address created successfully.",
      id: address.id,
      clientId: address.clientId,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const UpdateAddressController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = UpdateAddressSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod Validation Error!", [error]);
    }
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Id not found!", [
        "Address Id not provided for updation.",
      ]);
    }

    const address = await prisma.address.findFirst({
      where: {
        id: id,
      },
    });
    if (!address) {
      throw new ApiError(404, "Address Not Found!", [
        "Address Not Found for updation!",
      ]);
    }

    const updatedAddress = await prisma.address.update({
      where: {
        id: id,
      },
      data: {
        street: req.body.street || address.street,
        city: req.body.city || address.city,
        state: req.body.state || address.state,
        country: req.body.country || address.country,
        postCode: req.body.postCode || address.postCode,
      },
    });
    if (!updatedAddress) {
      throw new ApiError(500, "Something went wrong", [
        "Something went wrong while updating address.",
      ]);
    }
    res.status(200).json({
      status: "Success",
      message: "Address updated successfully.",
      id: updatedAddress.id,
      clientId: updatedAddress.clientId,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const DeleteAddressController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Product id not found", [
        "Product id not provided for deletion.",
      ]);
    }

    const addressExists = await prisma.address.findFirst({
      where: {
        id: id,
      },
    });
    if (!addressExists) {
      throw new ApiError(404, "Product Not Found!", [
        "Product not found or not authorized.",
      ]);
    }

    const deletedAddress = await prisma.address.delete({
      where: {
        id: id,
      },
      select: {
        id: true,
      },
    });
    if (!deletedAddress) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while delting the product",
      ]);
    }

    res.status(204).json({
      status: "Success",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetAddressController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { page, limit } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 5;
    const skip = pageNumber === 1 ? 0 : (pageNumber - 1) * limitNumber;

    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Id not found", [
        "Client's id not found in params.",
      ]);
    }

    const totalEntries = await prisma.address.count({
      where: {
        clientId: id,
      },
    });
    const totalPages = Math.ceil(totalEntries / limitNumber);

    const address = await prisma.address.findMany({
      where: {
        clientId: id,
      },
      skip: skip,
      take: limitNumber,
    });

    if (!address) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while fetching address.",
      ]);
    }

    res.status(200).json({
      status: "Success",
      result: address,
      page: pageNumber,
      limit: limitNumber,
      perPage: address.length,
      totalAddress: totalEntries,
      totalPages: totalPages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetAddressByIdController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const clientId = req.params.id;
    const address = await prisma.address.findMany({
      where: {
        clientId,
      },
      select: {
        id: true,
        street: true,
        city: true,
        postCode: true,
      },
    });

    if (!address) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while fetching address.",
      ]);
    }

    const allAddress = address.map((item) => ({
      id: item.id,
      address: `${item.street.split(",")[0]}, ${item.city}, ${item.postCode}`,
    }));

    res.status(200).json({
      status: "Success",
      result: allAddress,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export {
  AddAddressController,
  UpdateAddressController,
  DeleteAddressController,
  GetAddressController,
  GetAddressByIdController,
};

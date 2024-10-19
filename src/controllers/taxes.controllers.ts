import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddTaxesSchema, UpdateTaxesSchema } from "../config/taxes.zod";

const AddTaxesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = AddTaxesSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Bad Paylod Request", [error]);
    }

    const { cgst, sgst, igst, gst } = req.body;
    // gst validation.
    if (cgst) {
      const totalGst = cgst + sgst;
      if (gst !== totalGst) {
        throw new ApiError(400, "Gst does not match.", [
          "cgst and sgst addition does not match the gst provided.",
        ]);
      }
    }
    if (igst && igst !== gst) {
      throw new ApiError(400, "Gst does not match.", [
        "igst does not match with the gst provided.",
      ]);
    }

    const tax = await prisma.taxes.create({
      data: {
        name: req.body.name,
        userId: req.body.userDetails.id,
        gst: gst,
        cgst: cgst || 0,
        sgst: sgst || 0,
        igst: igst || 0,
        description: req.body.description || null,
        hsnSacCode: req.body.hsnSacCode || null,
      },
    });

    res.status(200).json({
      status: "Success",
      message: "Tax created successfully.",
      id: tax.id,
      tax: tax.gst + "%",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const UpdateTaxesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { id } = req.params;
    const { success, error } = UpdateTaxesSchema.safeParse(req.body);
    if (!success || !id) {
      throw new ApiError(400, "Zod validation failed or tax id not provided", [
        error,
        "Or tax id not provided",
      ]);
    }

    const taxExists = await prisma.taxes.findFirst({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
    });
    if (!taxExists) {
      throw new ApiError(404, "Tax Not Found!", [
        "Tax not found or not authorized.",
      ]);
    }

    const { cgst, sgst, igst, gst } = req.body;
    // gst validation.
    if (cgst) {
      const totalGst = cgst + sgst;
      if (gst && gst !== totalGst) {
        throw new ApiError(400, "Gst does not match.", [
          "cgst and sgst addition does not match the gst provided.",
        ]);
      }
      if (!gst && totalGst !== taxExists.gst) {
        throw new ApiError(400, "Gst does not match.", [
          "cgst and sgst addition does not match the gst value.",
        ]);
      }
    }
    if (igst && gst && igst !== gst) {
      throw new ApiError(400, "Gst does not match.", [
        "igst does not match with the gst provided.",
      ]);
    }
    if (igst && !gst && igst !== taxExists.gst) {
      throw new ApiError(400, "Gst does not match.", [
        "igst does not match with the gst value.",
      ]);
    }

    const updatedTax = await prisma.taxes.update({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
      data: {
        name: req.body.name || taxExists.name,
        description: req.body.description || taxExists.description,
        hsnSacCode: req.body.hsnSacCode || taxExists.hsnSacCode,
        gst: gst || taxExists.gst,
        cgst: cgst || taxExists.cgst,
        igst: igst || taxExists.igst,
        sgst: sgst || taxExists.sgst,
      },
      select: {
        id: true,
        name: true,
      },
    });

    res.status(200).json({
      status: "Success",
      message: "Tax updated successfully.",
      id: updatedTax.id,
      name: updatedTax.name,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const DeleteTaxesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "tax id not provided", [
        "Tax id not provided for deletion.",
      ]);
    }

    const taxExists = await prisma.taxes.findFirst({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
    });
    if (!taxExists) {
      throw new ApiError(404, "Tax Not Found!", [
        "Tax not found or not authorized.",
      ]);
    }

    const deletedTax = await prisma.taxes.delete({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
      select: {
        id: true,
      },
    });
    if (!deletedTax) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while delting the tax",
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

const GetAllTaxesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { page, limit } = req.params;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = pageNumber === 1 ? 0 : (pageNumber - 1) * limitNumber;

    const totalEntries = await prisma.taxes.count({
      where: {
        userId: req.body.userDetails.id,
      },
    });
    const totalPages = Math.ceil(totalEntries / limitNumber);

    const taxes = await prisma.taxes.findMany({
      where: {
        userId: req.body.userDetails.id,
      },
      skip: skip,
      take: limitNumber,
      select: {
        id: true,
        name: true,
        gst: true,
        igst: true,
        sgst: true,
        cgst: true,
        hsnSacCode: true,
        invoiceItems: {
          select: {
            id: true,
          },
        },
        quoteItems: {
          select: {
            id: true,
          },
        },
        products: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!taxes) {
      throw new ApiError(500, "", [
        "Something went wrong while fetching taxes.",
      ]);
    }

    const result = taxes.map((tax) => ({
      ...tax,
      invoiceItems: tax.invoiceItems.length,
      quoteItems: tax.quoteItems.length,
      products: tax.products.length,
    }));

    res.status(200).json({
      status: "Success",
      result,
      page: pageNumber,
      limit: limitNumber,
      totalTaxes: totalEntries,
      totalPages: totalPages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export {
  AddTaxesController,
  UpdateTaxesController,
  DeleteTaxesController,
  GetAllTaxesController,
};

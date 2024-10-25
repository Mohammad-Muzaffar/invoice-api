import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddProductSchema, UpdateProductsSchema } from "../config/products.zod";

const AddProductsController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    // safeparse, add product to db, response.
    const { success, error } = AddProductSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod Validation Error!", [error]);
    }
    const tax = await prisma.taxes.findUnique({
      where: {
        id: req.body.taxId,
      },
    });

    const gst = (tax?.gst && tax.gst / 100) || 0;
    const taxAmount = req.body.price * gst * 100;
    const subTotal = (req.body.price - taxAmount / 100) * 100;

    const product = await prisma.product.create({
      data: {
        productName: req.body.productName,
        productDescription: req.body.productDescription || null,
        hsnCode: req.body.hsnCode || null,
        price: req.body.price * 100, // decimal management
        taxAmount: taxAmount,
        subTotal: subTotal,
        taxId: req.body.taxId,
        userId: req.body.userDetails.id,
      },
    });
    if (!product) {
      throw new ApiError(500, "Something went wrong", [
        "Something went wrong while creating product.",
      ]);
    }

    res.status(200).json({
      status: "Success",
      message: "Product created successfully.",
      id: product.id,
      productName: product.productName,
      price: product.price / 100,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const UpdateProductsController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = UpdateProductsSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod Validation Error!", [error]);
    }
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Id not found!", [
        "Product Id not provided for updation.",
      ]);
    }

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
    });
    if (!product) {
      throw new ApiError(404, "Product Not found!", [
        "Product Not Found for updation!",
      ]);
    }

    const tax = await prisma.taxes.findUnique({
      where: {
        id: req.body.taxId || product.taxId,
      },
    });

    const gst = (tax?.gst && tax.gst / 100) || 0;
    const taxAmount = req.body.price * gst * 100;
    const subTotal = (req.body.price - taxAmount / 100) * 100;

    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
      data: {
        productName: req.body.productName || product.productName,
        productDescription:
          req.body.productDescription || product.productDescription,
        hsnCode: req.body.hsnCode || product.hsnCode,
        price: req.body.price * 100 || product.price, // decimal management
        subTotal: subTotal || product.subTotal,
        taxAmount: taxAmount || product.taxAmount,
        taxId: req.body.taxId || product.taxId,
      },
    });
    if (!updatedProduct) {
      throw new ApiError(500, "Something went wrong", [
        "Something went wrong while updating product.",
      ]);
    }
    res.status(200).json({
      status: "Success",
      message: "Product updated successfully.",
      id: updatedProduct.id,
      productName: updatedProduct.productName,
      price: updatedProduct.price / 100 + ".00",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const DeleteProductsController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Product id not found", [
        "Product id not provided for deletion.",
      ]);
    }

    const productExists = await prisma.product.findFirst({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
    });
    if (!productExists) {
      throw new ApiError(404, "Product Not Found!", [
        "Product not found or not authorized.",
      ]);
    }

    const deletedProduct = await prisma.product.delete({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
      select: {
        id: true,
      },
    });
    if (!deletedProduct) {
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

const GetAllProductsController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { page, limit } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = pageNumber === 1 ? 0 : (pageNumber - 1) * limitNumber;

    const totalEntries = await prisma.product.count({
      where: {
        userId: req.body.userDetails.id,
      },
    });
    const totalPages = Math.ceil(totalEntries / limitNumber);

    const products = await prisma.product.findMany({
      where: {
        userId: req.body.userDetails.id,
      },
      skip: skip,
      take: limitNumber,
    });

    if (!products) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while fetching products.",
      ]);
    }

    const allProducts = products.map((product) => ({
      ...product,
      price: product.price / 100,
    }));

    res.status(200).json({
      status: "Success",
      result: allProducts,
      page: pageNumber,
      limit: limitNumber,
      perPage: products.length,
      totalProducts: totalEntries,
      totalPages: totalPages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetSingleProductsController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(400, "Product id not found", [
        "Product id not provided.",
      ]);
    }

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        userId: req.body.userDetails.id,
      },
      select: {
        id: true,
        productName: true,
        productDescription: true,
        price: true,
        subTotal: true,
        taxAmount: true,
        hsnCode: true,
        tax: true,
      },
    });
    if (!product) {
      throw new ApiError(404, "Product does not exists!", [
        "Either product does not exists or something went wrong while fetching product details.",
      ]);
    }

    const updatedProduct = {
      ...product,
      price: product.price / 100,
    };

    res.status(200).json({
      status: "Success",
      product: updatedProduct,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetAllProductsById = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.body.userDetails.id,
      },
      select: {
        id: true,
        productName: true,
        price: true,
        taxAmount: true,
        subTotal: true,
        hsnCode: true,
        taxId: true,
      },
    });

    if (!products) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while fetching products.",
      ]);
    }

    const allProducts = products.map((product) => ({
      ...product,
      price: product.price / 100,
      taxAmount: product.taxAmount && product.taxAmount / 100,
      subTotal: product.subTotal && product.subTotal / 100,
    }));

    res.status(200).json({
      status: "Success",
      result: allProducts,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export {
  AddProductsController,
  UpdateProductsController,
  DeleteProductsController,
  GetAllProductsController,
  GetSingleProductsController,
  GetAllProductsById,
};

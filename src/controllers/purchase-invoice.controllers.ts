import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import {
  AddPurchaseInvoiceSchema,
  UpdatePurchaseInvoiceSchema,
} from "../config/purchase-invoice.zod";

const AddPurchaseInvoicesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    // Validate incoming data
    const { success, error } = AddPurchaseInvoiceSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, `Zod validation error: ${error}`, [error]);
    }

    const {
      invoiceNumber,
      invoiceDate,
      sellerName,
      sellerAddress,
      total,
      subTotal,
      discount = 0, // Optional discount, default to 0
      totalTax,
      notes,
      gst,
      cgst,
      sgst,
      igst,
      invoiceItems,
      userDetails,
    } = req.body;

    // Check if the invoice already exists
    const invoiceExists = await prisma.purchaseInvoice.findFirst({
      where: { invoiceNumber },
      select: { id: true, invoiceNumber: true },
    });

    if (invoiceExists) {
      throw new ApiError(403, "Invoice Already Exists", [
        `Invoice with number: ${invoiceExists.invoiceNumber} already exists.`,
      ]);
    }

    // **VALIDATIONS**: Ensure all the calculations are correct

    // 1. Check that subTotal is the sum of totalPrice for all invoice items
    const calculatedSubTotal = invoiceItems.reduce(
      (acc: number, item: any) => acc + (item.totalPrice - item.taxableAmount),
      0
    );
    if (calculatedSubTotal !== subTotal) {
      throw new ApiError(
        400,
        `SubTotal Mismatch: The provided subTotal (${subTotal}) does not match the calculated subTotal (${calculatedSubTotal}).`,
        [
          `The provided subTotal (${subTotal}) does not match the calculated subTotal (${calculatedSubTotal}).`,
        ]
      );
    }

    // 2. Check that totalTax is the sum of all taxableAmount in invoice items
    const calculatedTotalTax = invoiceItems.reduce(
      (acc: number, item: any) => acc + item.taxableAmount,
      0
    );
    if (calculatedTotalTax !== totalTax) {
      throw new ApiError(
        400,
        `TotalTax Mismatch: The provided totalTax (${totalTax}) does not match the calculated totalTax (${calculatedTotalTax}).`,
        [
          `The provided totalTax (${totalTax}) does not match the calculated totalTax (${calculatedTotalTax}).`,
        ]
      );
    }

    // 3. Check that total is subTotal + totalTax - discount
    const expectedTotal = subTotal + totalTax - discount;
    if (total !== expectedTotal) {
      throw new ApiError(
        400,
        `Total Mismatch: The provided total (${total}) does not match the calculated total (${expectedTotal}).`,
        [
          `The provided total (${total}) does not match the calculated total (${expectedTotal}).`,
        ]
      );
    }

    // Create the invoice and associated items in a transaction
    const generatedPurchaseInvoice = await prisma.$transaction(
      async (prisma) => {
        // Create the invoice
        const createdInvoice = await prisma.purchaseInvoice.create({
          data: {
            invoiceNumber,
            invoiceDate,
            sellerName,
            sellerAddress: sellerAddress || null,
            total: total * 100, // Storing in cents for precision
            subTotal: subTotal * 100,
            discount: discount * 100,
            totalTax: totalTax * 100,
            notes: notes || null,
            gst: gst || null,
            cgst: cgst || null,
            sgst: sgst || null,
            igst: igst || null,
            userId: userDetails.id,
          },
        });

        // Prepare invoice items data with proper checks
        const invoiceItemsData = invoiceItems.map((item: any) => {
          // Ensure each item's totalPrice is correct (price * quantity)
          const calculatedTotalPrice = item.price * item.quantity;
          if (calculatedTotalPrice !== item.totalPrice) {
            throw new ApiError(400, "TotalPrice Mismatch for Item", [
              `The totalPrice for product ${item.productName} does not match the calculated total.`,
            ]);
          }

          return {
            ...item,
            invoiceId: createdInvoice.id,
            price: item.price * 100, // Store price in cents for precision
            totalPrice: item.totalPrice * 100,
            subTotal: item.subTotal * 100,
            taxableAmount: item.taxableAmount * 100,
          };
        });
        // Create invoice items
        await prisma.purchaseInvoiceItems.createMany({
          data: invoiceItemsData,
        });

        return createdInvoice;
      }
    );

    res.status(200).json({
      status: "Success",
      invoiceId: generatedPurchaseInvoice.id,
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

const UpdatePurchaseInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    // Validate incoming data
    const { success, error } = UpdatePurchaseInvoiceSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, `Zod validation error: ${error}`, [error]);
    }

    const invoiceId = req.params.id;
    const existingInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      throw new ApiError(
        404,
        `Purchase Invoice not found: Purchase Invoice with id: ${invoiceId} does not exist.`,
        [`Invoice with id: ${invoiceId} does not exist.`]
      );
    }

    const {
      invoiceNumber,
      invoiceDate,
      sellerName,
      sellerAddress,
      total,
      subTotal,
      discount = 0, // Optional discount, default to 0
      totalTax,
      notes,
      gst,
      cgst,
      sgst,
      igst,
      invoiceItems,
      userDetails,
    } = req.body;

    // **VALIDATIONS**: Ensure all calculations are correct based on what was provided
    if (total || subTotal || totalTax) {
      // 1. Validate subTotal if it's provided
      if (subTotal && invoiceItems && invoiceItems.length > 0) {
        const calculatedSubTotal = invoiceItems.reduce(
          (acc: number, item: any) =>
            acc + (item.totalPrice - item.taxableAmount),
          0
        );
        if (calculatedSubTotal !== subTotal) {
          throw new ApiError(
            400,
            `SubTotal Mismatch: The provided subTotal (${subTotal}) does not match the calculated subTotal (${calculatedSubTotal}).`,
            [
              `The provided subTotal (${subTotal}) does not match the calculated subTotal (${calculatedSubTotal}).`,
            ]
          );
        }
      }

      // 2. Validate totalTax if it's provided
      if (totalTax && invoiceItems && invoiceItems.length > 0) {
        const calculatedTotalTax = invoiceItems.reduce(
          (acc: number, item: any) => acc + item.taxableAmount,
          0
        );
        if (calculatedTotalTax !== totalTax) {
          throw new ApiError(
            400,
            `TotalTax Mismatch: The provided totalTax (${totalTax}) does not match the calculated totalTax (${calculatedTotalTax}).`,
            [
              `The provided totalTax (${totalTax}) does not match the calculated totalTax (${calculatedTotalTax}).`,
            ]
          );
        }
      }

      // 3. Validate total if it's provided
      if (total) {
        const expectedTotal =
          (subTotal || existingInvoice.subTotal / 100) +
          (totalTax || existingInvoice.totalTax / 100) -
          discount;

        if (total !== expectedTotal) {
          throw new ApiError(
            400,
            `Total Mismatch: The provided total (${total}) does not match the calculated total (${expectedTotal}).`,
            [
              `The provided total (${total}) does not match the calculated total (${expectedTotal}).`,
            ]
          );
        }
      }
    }

    // Proceed to update the invoice and invoiceItems if everything is valid
    const updatedInvoice = await prisma.$transaction(async (prisma) => {
      // Update the invoice data
      const updatedData = {
        invoiceNumber: invoiceNumber || existingInvoice.invoiceNumber,
        invoiceDate: invoiceDate || existingInvoice.invoiceDate,
        sellerName: sellerName || existingInvoice.sellerName,
        sellerAddress: sellerAddress || existingInvoice.sellerAddress,
        total: total ? total * 100 : existingInvoice.total,
        subTotal: subTotal ? subTotal * 100 : existingInvoice.subTotal,
        discount:
          discount !== undefined ? discount * 100 : existingInvoice.discount,
        totalTax: totalTax ? totalTax * 100 : existingInvoice.totalTax,
        notes: notes || existingInvoice.notes,
        gst: gst || existingInvoice.gst,
        cgst: cgst || existingInvoice.cgst,
        sgst: sgst || existingInvoice.sgst,
        igst: igst || existingInvoice.igst,
      };

      const updatedInvoice = await prisma.purchaseInvoice.update({
        where: { id: invoiceId },
        data: updatedData,
      });

      // Handle invoice items if provided
      if (invoiceItems && invoiceItems.length > 0) {
        // Delete existing invoice items
        await prisma.purchaseInvoiceItems.deleteMany({
          where: { invoiceId },
        });

        const invoiceItemsData = invoiceItems.map((item: any) => {
          // Ensure each item's totalPrice is correct (price * quantity)
          const calculatedTotalPrice = item.price * item.quantity;
          if (calculatedTotalPrice !== item.totalPrice) {
            throw new ApiError(400, "TotalPrice Mismatch for Item", [
              `The totalPrice for product ${item.productName} does not match the calculated total.`,
            ]);
          }

          return {
            ...item,
            invoiceId,
            price: item.price * 100, // Store price in cents for precision
            totalPrice: item.totalPrice * 100,
            subTotal: item.subTotal * 100,
            taxableAmount: item.taxableAmount * 100,
          };
        });

        await prisma.purchaseInvoiceItems.createMany({
          data: invoiceItemsData,
        });
      }

      // Fetch updated items
      const updatedItems = await prisma.purchaseInvoiceItems.findMany({
        where: { invoiceId },
      });

      return { updatedInvoice, updatedItems };
    });

    res.status(200).json({
      status: "Success",
      updatedInvoice,
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

const DeletePurchaseInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const invoiceId = req.params.id;
    const existingInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      throw new ApiError(404, "Invoice not found", [
        `Invoice with id: ${invoiceId} does not exist.`,
      ]);
    }

    // Perform deletion in a transaction
    await prisma.$transaction(async (prisma) => {
      await prisma.purchaseInvoice.delete({
        where: { id: invoiceId },
      });
      await prisma.purchaseInvoiceItems.deleteMany({
        where: { invoiceId },
      });
    });

    res.status(204).send(); // No Content response
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message || "Something went wrong.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const GetAllPurchaseInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const {
      page = 1,
      limit = 10,
      startInvoiceDate,
      endInvoiceDate,
      total,
      sellerName,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const userId = req.body.userDetails.id;

    // Build filter object
    const filters: any = {};

    if (userId) filters.userId = userId as string;

    // Client name filter
    if (sellerName && typeof sellerName === "string") {
      filters.OR = [
        { sellerName: { contains: sellerName, mode: "insensitive" } },
        { sellerAddress: { contains: sellerName, mode: "insensitive" } },
        { invoiceNumber: { contains: sellerName, mode: "insensitive" } },
      ];
    }

    // Total filter
    if (total) {
      const totalPriceNumber = Number(total) * 100; // Assuming total is in dollars and needs conversion
      filters.OR = filters.OR || []; // Initialize OR if it doesn't exist
      filters.OR.push(
        { total: { equals: totalPriceNumber } },
        { subTotal: { equals: totalPriceNumber } },
        { totalTax: { equals: totalPriceNumber } },
        { discount: { equals: totalPriceNumber } }
      );
    }

    // Date range filters
    if (startInvoiceDate || endInvoiceDate) {
      filters.invoiceDate = {};
      if (typeof startInvoiceDate === "string") {
        filters.invoiceDate.gte = new Date(startInvoiceDate);
      }
      if (typeof endInvoiceDate === "string") {
        filters.invoiceDate.lte = new Date(endInvoiceDate);
      }
    }

    // Count total entries based on filters
    const totalEntries = await prisma.purchaseInvoice.count({
      where: filters,
    });

    const totalPages = Math.ceil(totalEntries / limitNumber);

    // Fetch invoices with applied filters
    const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      where: filters,
      skip,
      take: limitNumber,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        sellerName: true,
        sellerAddress: true,
        total: true,
        subTotal: true,
        discount: true,
        totalTax: true,
        notes: true,
        invoiceItems: {
          select: {
            id: true,
          },
        },
      },
    });

    // Map results to include item count
    const result = purchaseInvoices.map((invoice) => ({
      ...invoice,
      total: invoice.total / 100, // Convert back to dollars
      subTotal: invoice.subTotal / 100,
      discount: invoice.discount / 100,
      totalTax: invoice.totalTax / 100,
      invoiceItemsCount: invoice.invoiceItems.length,
    }));

    res.status(200).json({
      status: "Success",
      result,
      page: pageNumber,
      limit: limitNumber,
      perPage: purchaseInvoices.length,
      totalEntries,
      totalPages,
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

const GetSinglePurchaseInvoiceController = async (
  req: Request,
  res: Response
) => {
  const prisma = new PrismaClient();
  try {
    const invoiceId = req.params.id;

    // Fetch invoice and user concurrently
    const [purchaseInvoice] = await Promise.all([
      prisma.purchaseInvoice.findUnique({
        where: { id: invoiceId, userId: req.body.userDetails.id },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          sellerName: true,
          sellerAddress: true,
          total: true,
          subTotal: true,
          discount: true,
          totalTax: true,
          notes: true,
          invoiceItems: {
            select: {
              id: true,
              productName: true,
              productDescription: true,
              hsnCode: true,
              price: true,
              quantity: true,
              totalPrice: true,
              subTotal: true,
              taxableAmount: true,
            },
          },
        },
      }),
    ]);

    // Check if either invoice or user is not found
    if (!purchaseInvoice) {
      throw new ApiError(404, "Invoice not found or Not authorized.", [
        "Invoice not found or Not authorized.",
      ]);
    }

    // Transform the invoice data
    const updatedInvoice = {
      ...purchaseInvoice, // Spread existing purchaseInvoice properties
      total: purchaseInvoice.total / 100,
      subTotal: purchaseInvoice.subTotal / 100,
      discount: purchaseInvoice.discount / 100,
      totalTax: purchaseInvoice.totalTax / 100,
      invoiceItems: purchaseInvoice.invoiceItems.map((item: any) => ({
        ...item, // Spread existing item properties
        price: item.price / 100, // Divide price by 100
        totalPrice: item.totalPrice / 100, // Divide totalPrice by 100
        taxableAmount: item.taxableAmount / 100, // Divide taxableAmount by 100
        subTotal: item.subTotal / 100,
      })),
    };

    // Send response with transformed data
    res.status(200).json({
      status: "Success",
      result: { purchaseInvoice: updatedInvoice },
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

export {
  AddPurchaseInvoicesController,
  UpdatePurchaseInvoiceController,
  DeletePurchaseInvoiceController,
  GetAllPurchaseInvoiceController,
  GetSinglePurchaseInvoiceController,
};

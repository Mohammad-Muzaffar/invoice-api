import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddInvoiceSchema, UpdateInvoiceSchema } from "../config/invoice.zod";

const AddInvoicesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    // Validate incoming data
    const { success, error } = AddInvoiceSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation error!", [error]);
    }

    const {
      invoiceNumber,
      invoiceDate,
      invoiceDueDate,
      status,
      total,
      subTotal,
      discount = 0, // Optional discount, default to 0
      totalTax,
      notes,
      gst,
      cgst,
      sgst,
      igst,
      clientId,
      shippingAddressId,
      invoiceItems,
      userDetails,
    } = req.body;

    // Check if the invoice already exists
    const invoiceExists = await prisma.invoice.findFirst({
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
    const generatedInvoice = await prisma.$transaction(async (prisma) => {
      // Create the invoice
      const createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate,
          invoiceDueDate,
          status,
          total: total * 100, // Storing in cents for precision
          subTotal: subTotal * 100,
          discount: discount * 100,
          totalTax: totalTax * 100,
          notes: notes || null,
          gst: gst || null,
          cgst: cgst || null,
          sgst: sgst || null,
          igst: igst || null,
          clientId,
          shippingAddressId,
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
          taxableAmount: item.taxableAmount * 100,
        };
      });

      // Create invoice items
      await prisma.invoiceItems.createMany({ data: invoiceItemsData });

      return createdInvoice;
    });

    res.status(200).json({
      status: "Success",
      invoiceId: generatedInvoice.id,
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

const UpdateInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    // Validate incoming data
    const { success, error } = UpdateInvoiceSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation error!", [error]);
    }

    const invoiceId = req.params.id;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      throw new ApiError(
        404,
        `Invoice not found: Invoice with id: ${invoiceId} does not exist.`,
        [`Invoice with id: ${invoiceId} does not exist.`]
      );
    }

    const {
      invoiceNumber,
      invoiceDate,
      invoiceDueDate,
      status,
      total,
      subTotal,
      discount = 0, // Default discount to 0 if not provided
      totalTax,
      notes,
      gst,
      cgst,
      sgst,
      igst,
      shippingAddressId,
      invoiceItems,
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
        invoiceDueDate: invoiceDueDate || existingInvoice.invoiceDueDate,
        status: status || existingInvoice.status,
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
        shippingAddressId:
          shippingAddressId || existingInvoice.shippingAddressId,
      };

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: updatedData,
      });

      // Handle invoice items if provided
      if (invoiceItems && invoiceItems.length > 0) {
        // Delete existing invoice items
        await prisma.invoiceItems.deleteMany({
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
            taxableAmount: item.taxableAmount * 100,
          };
        });

        await prisma.invoiceItems.createMany({ data: invoiceItemsData });
      }

      // Fetch updated items
      const updatedItems = await prisma.invoiceItems.findMany({
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

const DeleteInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const invoiceId = req.params.id;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      throw new ApiError(404, "Invoice not found", [
        `Invoice with id: ${invoiceId} does not exist.`,
      ]);
    }

    // Perform deletion in a transaction
    await prisma.$transaction(async (prisma) => {
      await prisma.invoice.delete({
        where: { id: invoiceId },
      });
      await prisma.invoiceItems.deleteMany({
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

const GetAllInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const {
      page = 1,
      limit = 10,
      clientId,
      startInvoiceDate,
      endInvoiceDate,
      startDueDate,
      endDueDate,
      status,
      clientName, // New filter for client name
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const userId = req.body.userDetails.id;
    // Build filter object
    const filters: any = {};

    if (clientId) filters.clientId = clientId as string; // Ensure clientId is a string
    if (status) filters.status = status as string;
    if (userId) filters.userId = userId as string;
    // Client name filter
    if (clientName && typeof clientName === "string") {
      filters.client = {
        OR: [
          { firstName: { contains: clientName, mode: "insensitive" } },
          { lastName: { contains: clientName, mode: "insensitive" } },
          { companyName: { contains: clientName, mode: "insensitive" } },
        ],
      };
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

    if (startDueDate || endDueDate) {
      filters.invoiceDueDate = {};
      if (typeof startDueDate === "string") {
        filters.invoiceDueDate.gte = new Date(startDueDate);
      }
      if (typeof endDueDate === "string") {
        filters.invoiceDueDate.lte = new Date(endDueDate);
      }
    }

    // Count total entries based on filters
    const totalEntries = await prisma.invoice.count({
      where: filters,
    });

    const totalPages = Math.ceil(totalEntries / limitNumber);

    // Fetch invoices with applied filters
    const invoices = await prisma.invoice.findMany({
      where: filters,
      skip,
      take: limitNumber,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        invoiceDueDate: true,
        status: true,
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
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNo: true,
            companyName: true,
          },
        },
      },
    });

    // Map results to include item count
    const result = invoices.map((invoice) => ({
      ...invoice,
      total: invoice.total / 100,
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
      perPage: invoices.length,
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

const GetSingleInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const invoiceId = req.params.id;

    // Fetch invoice and user concurrently
    const [invoice] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id: invoiceId, userId: req.body.userDetails.id },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          invoiceDueDate: true,
          status: true,
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
              taxableAmount: true,
              tax: {
                select: {
                  id: true,
                  name: true,
                  hsnSacCode: true,
                  description: true,
                  gst: true,
                  cgst: true,
                  sgst: true,
                  igst: true,
                },
              },
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNo: true,
              panNo: true,
              companyName: true,
              clientGstinNumber: true,
            },
          },
          shippingAddress: true,
          user: {
            select:{
              id: true,
          userName: true,
          email: true,
          companyName: true,
          companyLogo: true,
          companyPhone: true,
          companyStamp: true,
          companyAuthorizedSign: true,
          street: true,
          city: true,
          state: true,
          country: true,
          postCode: true,
          panNumber: true,
          gstinNumber: true,
          msmeNumber: true,
          bankName: true,
          bankAccountNumber: true,
          bankBranchName: true,
          ifscCode: true,
            }
          },
          quote: true,
        },
      }),
      
    ]);

    // Check if either invoice or user is not found
    if (!invoice) {
      throw new ApiError(404, "Invoice not found or Not authorized.", [
        "Invoice not found or Not authorized.",
      ]);
    }

    // Transform the invoice data
    const updatedInvoice = {
      ...invoice, // Spread existing invoice properties
      total: invoice.total / 100,
      subTotal: invoice.subTotal / 100,
      discount: invoice.discount / 100,
      totalTax: invoice.totalTax / 100,
      invoiceItems: invoice.invoiceItems.map((item) => ({
        ...item, // Spread existing item properties
        price: item.price / 100, // Divide price by 100
        totalPrice: item.totalPrice / 100, // Divide totalPrice by 100
        taxableAmount: item.taxableAmount / 100, // Divide taxableAmount by 100
      })),
    };

    // Send response with transformed data
    res.status(200).json({
      status: "Success",
      result: { invoice: updatedInvoice },
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
  AddInvoicesController,
  UpdateInvoiceController,
  DeleteInvoiceController,
  GetAllInvoiceController,
  GetSingleInvoiceController,
};

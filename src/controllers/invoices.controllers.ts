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
      totalWithoutTax, 
      subTotal, 
      discount, 
      totalTax, 
      notes, 
      gst, 
      cgst, 
      sgst, 
      igst, 
      clientId,
      shippingAddressId,
      invoiceItems 
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

    // Create the invoice and associated items in a transaction
    const generatedInvoice = await prisma.$transaction(async (prisma) => {
      const createdInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate,
          invoiceDueDate,
          status,
          totalWithoutTax: totalWithoutTax * 100,
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
        },
      });

      // Prepare invoice items data
      const invoiceItemsData = invoiceItems.map((item: any) => ({
        ...item,
        invoiceId: createdInvoice.id,
        price: item.price * 100,
        totalPrice: item.totalPrice * 100,
        taxableAmount: item.taxableAmount * 100,
      }));

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
}

const UpdateInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const { success, error } = UpdateInvoiceSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation error!", [error]);
    }

    const invoiceId = req.params.id;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      throw new ApiError(404, "Invoice not found", [
        `Invoice with id: ${invoiceId} does not exist.`,
      ]);
    }

    const updatedInvoice = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.update({
        where: {
          id: invoiceId,
        },
        data: {
          invoiceNumber:
            req.body.invoiceNumber || existingInvoice.invoiceNumber,
          invoiceDate: req.body.invoiceDate || existingInvoice.invoiceDate,
          invoiceDueDate:
            req.body.invoiceDueDate || existingInvoice.invoiceDueDate,
          status: req.body.status || existingInvoice.status,
          totalWithoutTax:
            req.body.totalWithoutTax * 100 || existingInvoice.totalWithoutTax,
          subTotal: req.body.subTotal * 100 || existingInvoice.subTotal,
          discount: req.body.discount * 100 || existingInvoice.discount,
          totalTax: req.body.totalTax * 100 || existingInvoice.totalTax,
          notes: req.body.notes || existingInvoice.notes,
          gst: req.body.gst || existingInvoice.gst,
          cgst: req.body.cgst || existingInvoice.cgst,
          sgst: req.body.sgst || existingInvoice.sgst,
          igst: req.body.igst || existingInvoice.igst,
          shippingAddressId:
            req.body.shippingAddressId || existingInvoice.shippingAddressId,
        },
      });

      if (req.body.invoiceItems && req.body.invoiceItems.length > 0) {
        await prisma.invoiceItems.deleteMany({
          where: {
            invoiceId: invoiceId,
          },
        });

        const invoicesItemsArray: {
          productName: string;
          productDescription: string;
          hsnCode: string;
          price: number;
          quantity: number;
          totalPrice: number;
          taxableAmount: number;
          taxId: string;
          productId: string;
        }[] = req.body.invoiceItems;

        const invoiceItemsData = invoicesItemsArray.map((item) => ({
          ...item,
          invoiceId: invoiceId,
          price: item.price * 100,
          totalPrice: item.totalPrice * 100,
          taxableAmount: item.taxableAmount * 100,
        }));

        const createdInvoiceItems = await prisma.invoiceItems.createMany({
          data: invoiceItemsData,
        });
      }

      const invoiceItems = await prisma.invoiceItems.findMany({
        where: {
          invoiceId: invoiceId,
        },
      });

      return { invoice, invoiceItems };
    });

    res.status(200).json({
      status: "Success",
      updatedInvoice,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
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

    const deletedInvoice = await prisma.$transaction(async (prisma) => {
      const invoice = await prisma.invoice.delete({
        where: {
          id: invoiceId,
        },
      });
      await prisma.invoiceItems.deleteMany({
        where: {
          invoiceId: invoiceId,
        },
      });
    });

    res.status(204).json({
      status: "Success",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
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
      clientName // New filter for client name
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filters: any = {};
    
    if (clientId) filters.clientId = clientId as string; // Ensure clientId is a string
    if (status) filters.status = status as string;

    // Client name filter
    if (clientName && typeof clientName === 'string') {
      filters.client = {
        OR: [
          { firstName: { contains: clientName, mode: 'insensitive' } },
          { lastName: { contains: clientName, mode: 'insensitive' } },
          { companyName: { contains: clientName, mode: 'insensitive' } },
        ],
      };
    }

    // Date range filters
    if (startInvoiceDate || endInvoiceDate) {
      filters.invoiceDate = {};
      if (typeof startInvoiceDate === 'string') {
        filters.invoiceDate.gte = new Date(startInvoiceDate);
      }
      if (typeof endInvoiceDate === 'string') {
        filters.invoiceDate.lte = new Date(endInvoiceDate);
      }
    }

    if (startDueDate || endDueDate) {
      filters.invoiceDueDate = {};
      if (typeof startDueDate === 'string') {
        filters.invoiceDueDate.gte = new Date(startDueDate);
      }
      if (typeof endDueDate === 'string') {
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
        totalWithoutTax: true,
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
}

const GetSingleInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const invoiceId = req.params.id;

    // Fetch invoice and user concurrently
    const [invoice, user] = await Promise.all([
      prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          invoiceDueDate: true,
          status: true,
          totalWithoutTax: true,
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
          quote: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: req.body.userDetails.id },
        select: {
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
        },
      }),
    ]);

    // Check if either invoice or user is not found
    if (!invoice || !user) {
      throw new ApiError(404, "Invoice or User not found.", ["Invoice or User not found."]);
    }

    res.status(200).json({
      status: "Success",
      result: { invoice, user },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message || "Something went wrong.",
    });
  } finally {
    await prisma.$disconnect();
  }
}

export {
  AddInvoicesController,
  UpdateInvoiceController,
  DeleteInvoiceController,
  GetAllInvoiceController,
  GetSingleInvoiceController,
};

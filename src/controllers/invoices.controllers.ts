import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddInvoiceSchema, UpdateInvoiceSchema } from "../config/invoice.zod";

const AddInvoicesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = AddInvoiceSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation error!", [error]);
    }

    const invoiceExists = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: req.body.invoiceNumber,
      },
      select: {
        id: true,
        invoiceNumber: true,
      },
    });
    if (invoiceExists) {
      throw new ApiError(403, "Invoice Already Exists", [
        `Invoice with invoice number: ${invoiceExists.invoiceNumber} already exists.`,
      ]);
    }

    const invoice = await prisma.$transaction(async (prisma) => {
      try {
        const generatedInvoice = await prisma.invoice.create({
          data: {
            invoiceNumber: req.body.invoiceNumber,
            invoiceDate: req.body.invoiceDate,
            invoiceDueDate: req.body.invoiceDueDate,
            status: req.body.status,
            totalWithoutTax: req.body.totalWithoutTax * 100,
            subTotal: req.body.subTotal * 100,
            discount: req.body.discount * 100,
            totalTax: req.body.totalTax * 100,
            notes: req.body.notes || null,
            gst: req.body.gst || null,
            cgst: req.body.cgst || null,
            sgst: req.body.sgst || null,
            igst: req.body.igst || null,
            clientId: req.body.clientId,
            shippingAddressId: req.body.shippingAddressId,
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
          invoiceId: generatedInvoice.id,
          price: item.price * 100,
          totalPrice: item.totalPrice * 100,
          taxableAmount: item.taxableAmount * 100,
        }));

        const createdInvoiceItems = await prisma.invoiceItems.createMany({
          data: invoiceItemsData,
        });

        const invoiceItems = await prisma.invoiceItems.findMany({
          where: {
            invoiceId: generatedInvoice.id,
          },
        });
        return { generatedInvoice, invoiceItems, createdInvoiceItems };
      } catch (error: any) {
        res.status(500).json(error);
      }
    });

    res.status(200).json({
      status: "Success",
      invoiceId: invoice?.generatedInvoice.id,
      invoice,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

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
    const { page, limit } = req.query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = pageNumber === 1 ? 0 : (pageNumber - 1) * limitNumber;

    const totalEntries = await prisma.invoice.count(); // where by client if filters are added.

    const totalPages = Math.ceil(totalEntries / limitNumber);

    const invoices = await prisma.invoice.findMany({
      skip: skip,
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

    if (!invoices) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while fetching invoices.",
      ]);
    }

    const result = invoices.map((invoice) => ({
      ...invoice,
      invoiceItems: invoice.invoiceItems.length,
    }));

    res.status(200).json({
      status: "Success",
      result,
      page: pageNumber,
      limit: limitNumber,
      perPage: invoices.length,
      totalProducts: totalEntries,
      totalPages: totalPages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetSingleInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const invoiceId = req.params.id;
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
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
    });

    const user = await prisma.user.findUnique({
      where: {
        id: req.body.userDetails.id,
      },
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
    });
    if (!invoice || !user) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while fetching invoices.",
      ]);
    }
    const result = {
      invoice,
      user,
    };

    res.status(200).json({
      status: "Success",
      result,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
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

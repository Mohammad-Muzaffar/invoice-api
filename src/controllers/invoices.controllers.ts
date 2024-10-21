import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddInvoiceSchema } from "../config/invoice.zod";

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
            notes: req.body.notes,
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
                invoiceId: generatedInvoice.id
            }
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

export { AddInvoicesController };

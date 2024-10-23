import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddQuoteSchema, UpdateQuoteSchema } from "../config/quote.zod";

const AddQuotesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    // Validate incoming data
    const { success, error } = AddQuoteSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation error!", [error]);
    }

    const {
      quoteNumber,
      quoteDate,
      quoteDueDate,
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
      quoteItems,
    } = req.body;

    // Check if the invoice already exists
    const quoteExists = await prisma.quote.findFirst({
      where: { quoteNumber },
      select: { id: true, quoteNumber: true },
    });

    if (quoteExists) {
      throw new ApiError(403, "Invoice Already Exists", [
        `Invoice with number: ${quoteExists.quoteNumber} already exists.`,
      ]);
    }

    // Create the invoice and associated items in a transaction
    const generatedQuote = await prisma.$transaction(async (prisma) => {
      const createdQuote = await prisma.quote.create({
        data: {
          quoteNumber,
          quoteDate,
          quoteDueDate,
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
      const quoteItemsData = quoteItems.map((item: any) => ({
        ...item,
        quoteId: createdQuote.id,
        price: item.price * 100,
        totalPrice: item.totalPrice * 100,
        taxableAmount: item.taxableAmount * 100,
      }));

      // Create invoice items
      await prisma.quoteItems.createMany({ data: quoteItemsData });

      return createdQuote;
    });

    res.status(200).json({
      status: "Success",
      quoteId: generatedQuote.id,
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

export { AddQuotesController };

import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { AddQuoteSchema, UpdateQuoteSchema } from "../config/quotes.zod";

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

    // Check if the quote already exists
    const quoteExists = await prisma.quote.findFirst({
      where: { quoteNumber },
      select: { id: true, quoteNumber: true },
    });

    if (quoteExists) {
      throw new ApiError(403, "Quote Already Exists", [
        `Quote with number: ${quoteExists.quoteNumber} already exists.`,
      ]);
    }

    // Create the Quote and associated items in a transaction
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

      // Prepare quote items data
      const quoteItemsData = quoteItems.map((item: any) => ({
        ...item,
        quoteId: createdQuote.id,
        price: item.price * 100,
        totalPrice: item.totalPrice * 100,
        taxableAmount: item.taxableAmount * 100,
      }));

      // Create quote items
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

const UpdateQuotesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    // Validate incoming data
    const { success, error } = UpdateQuoteSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Zod validation error!", [error]);
    }

    const quoteId = req.params.id;
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!existingQuote) {
      throw new ApiError(404, "Quote not found", [
        `Quote with id: ${quoteId} does not exist.`,
      ]);
    }

    // Prepare data for update
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
      shippingAddressId,
      quoteItems,
    } = req.body;

    const updatedQuote = await prisma.$transaction(async (prisma) => {
      // Update the Quote
      const updatedData = {
        quoteNumber: quoteNumber || existingQuote.quoteNumber,
        quoteDate: quoteDate || existingQuote.quoteDate,
        quoteDueDate: quoteDueDate || existingQuote.quoteDueDate,
        status: status || existingQuote.status,
        totalWithoutTax: totalWithoutTax
          ? totalWithoutTax * 100
          : existingQuote.totalWithoutTax,
        subTotal: subTotal ? subTotal * 100 : existingQuote.subTotal,
        discount: discount ? discount * 100 : existingQuote.discount,
        totalTax: totalTax ? totalTax * 100 : existingQuote.totalTax,
        notes: notes || existingQuote.notes,
        gst: gst || existingQuote.gst,
        cgst: cgst || existingQuote.cgst,
        sgst: sgst || existingQuote.sgst,
        igst: igst || existingQuote.igst,
        shippingAddressId: shippingAddressId || existingQuote.shippingAddressId,
      };

      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: updatedData,
      });

      // Handle quote items
      if (quoteItems && quoteItems.length > 0) {
        await prisma.quoteItems.deleteMany({
          where: { quoteId },
        });

        const quoteItemsData = quoteItems.map((item: any) => ({
          ...item,
          quoteId,
          price: item.price * 100,
          totalPrice: item.totalPrice * 100,
          taxableAmount: item.taxableAmount * 100,
        }));

        await prisma.quoteItems.createMany({ data: quoteItemsData });
      }

      // Fetch updated items
      const updatedItems = await prisma.quoteItems.findMany({
        where: { quoteId },
      });

      return { updatedQuote, updatedItems };
    });

    res.status(200).json({
      status: "Success",
      updatedQuote,
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

const DeleteQuotesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const quoteId = req.params.id;
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!existingQuote) {
      throw new ApiError(404, "Quote not found", [
        `Quote with id: ${quoteId} does not exist.`,
      ]);
    }

    // Perform deletion in a transaction
    await prisma.$transaction(async (prisma) => {
      await prisma.quote.delete({
        where: { id: quoteId },
      });
      await prisma.quoteItems.deleteMany({
        where: { quoteId },
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

const GetAllQuoteController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const {
      page = 1,
      limit = 10,
      clientId,
      startDate,
      endDate,
      startDueDate,
      endDueDate,
      status,
      clientName, // New filter for client name
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filters: any = {};

    if (clientId) filters.clientId = clientId as string; // Ensure clientId is a string
    if (status) filters.status = status as string;

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
    if (startDate || endDate) {
      filters.quoteDate = {};
      if (typeof startDate === "string") {
        filters.quoteDate.gte = new Date(startDate);
      }
      if (typeof endDate === "string") {
        filters.quoteDate.lte = new Date(endDate);
      }
    }

    if (startDueDate || endDueDate) {
      filters.quoteDueDate = {};
      if (typeof startDueDate === "string") {
        filters.quoteDueDate.gte = new Date(startDueDate);
      }
      if (typeof endDueDate === "string") {
        filters.quoteDueDate.lte = new Date(endDueDate);
      }
    }

    // Count total entries based on filters
    const totalEntries = await prisma.quote.count({
      where: filters,
    });

    const totalPages = Math.ceil(totalEntries / limitNumber);

    // Fetch quotes with applied filters
    const quotes = await prisma.quote.findMany({
      where: filters,
      skip,
      take: limitNumber,
      select: {
        id: true,
        quoteNumber: true,
        quoteDate: true,
        quoteDueDate: true,
        status: true,
        totalWithoutTax: true,
        subTotal: true,
        discount: true,
        totalTax: true,
        notes: true,
        quoteItems: {
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
    const result = quotes.map((quote) => ({
      ...quote,
      totalWithoutTax: quote.totalWithoutTax / 100,
      subTotal: quote.subTotal / 100,
      discount: quote.discount / 100,
      totalTax: quote.totalTax / 100,
      quoteItemsCount: quote.quoteItems.length,
    }));

    res.status(200).json({
      status: "Success",
      result,
      page: pageNumber,
      limit: limitNumber,
      perPage: quotes.length,
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

const GetSingleQuoteController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const quoteId = req.params.id;

    // Fetch quote and user concurrently
    const [quote, user] = await Promise.all([
      prisma.quote.findUnique({
        where: { id: quoteId },
        select: {
          id: true,
          quoteNumber: true,
          quoteDate: true,
          quoteDueDate: true,
          status: true,
          totalWithoutTax: true,
          subTotal: true,
          discount: true,
          totalTax: true,
          notes: true,
          quoteItems: {
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

    // Check if either quote or user is not found
    if (!quote || !user) {
      throw new ApiError(404, "Quote or User not found.", [
        "Quote or User not found.",
      ]);
    }

    // Transform the quote data
    const updatedquote = {
      ...quote, // Spread existing quote properties
      totalWithoutTax: quote.totalWithoutTax / 100,
      subTotal: quote.subTotal / 100,
      discount: quote.discount / 100,
      totalTax: quote.totalTax / 100,
      quoteItems: quote.quoteItems.map((item) => ({
        ...item, // Spread existing item properties
        price: item.price / 100, // Divide price by 100
        totalPrice: item.totalPrice / 100, // Divide totalPrice by 100
        taxableAmount: item.taxableAmount / 100, // Divide taxableAmount by 100
      })),
    };

    // Send response with transformed data
    res.status(200).json({
      status: "Success",
      result: { quote: updatedquote, user },
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
  AddQuotesController,
  UpdateQuotesController,
  DeleteQuotesController,
  GetAllQuoteController,
  GetSingleQuoteController,
};

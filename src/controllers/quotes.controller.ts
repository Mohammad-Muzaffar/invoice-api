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
      total,
      subTotal,
      discount = 0, // Default discount to 0 if not provided
      totalTax,
      notes,
      gst,
      cgst,
      sgst,
      igst,
      clientId,
      shippingAddressId,
      quoteItems,
      userDetails,
    } = req.body;

    // Check if the quote already exists
    const quoteExists = await prisma.quote.findFirst({
      where: { quoteNumber },
      select: { id: true, quoteNumber: true },
    });

    if (quoteExists) {
      throw new ApiError(
        403,
        `Quote Already Exists: Quote with number: ${quoteExists.quoteNumber} already exists.`,
        [`Quote with number: ${quoteExists.quoteNumber} already exists.`]
      );
    }

    // **VALIDATIONS**: Ensure all calculations are correct
    if (!quoteItems || quoteItems.length === 0) {
      throw new ApiError(
        400,
        "No Items: At least one quote item must be provided.",
        ["At least one quote item must be provided."]
      );
    }

    // 1. Validate subTotal
    const calculatedSubTotal = quoteItems.reduce(
      (acc: number, item: any) => acc + (item.subTotal),
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

    // 2. Validate totalTax
    const calculatedTotalTax = quoteItems.reduce(
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

    // 3. Validate total
    const expectedTotal = subTotal + totalTax - discount;
    if (total !== expectedTotal) {
      throw new ApiError(
        400,
        `Total Mismatch: The provided total (${total}) does not match the expected total (${expectedTotal}).`,
        [
          `The provided total (${total}) does not match the expected total (${expectedTotal}).`,
        ]
      );
    }

    // Create the Quote and associated items in a transaction
    const generatedQuote = await prisma.$transaction(async (prisma) => {
      const createdQuote = await prisma.quote.create({
        data: {
          quoteNumber,
          quoteDate,
          quoteDueDate,
          status,
          total: total * 100,
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

      // Prepare quote items data
      const quoteItemsData = quoteItems.map((item: any) => {
        // Ensure each item's totalPrice is correct (price * quantity)
        const calculatedTotalPrice = item.price * item.quantity;
        if (calculatedTotalPrice !== item.totalPrice) {
          throw new ApiError(400, "TotalPrice Mismatch for Item", [
            `The totalPrice for product ${item.productName} does not match the calculated total.`,
          ]);
        }

        return {
          ...item,
          quoteId: createdQuote.id,
          price: item.price * 100, // Store price in cents for precision
          totalPrice: item.totalPrice * 100,
          subTotal: item.subTotal * 100,
          taxableAmount: item.taxableAmount * 100,
        };
      });

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
      throw new ApiError(
        404,
        `Quote not found: Quote with id: ${quoteId} does not exist.`,
        [`Quote with id: ${quoteId} does not exist.`]
      );
    }

    // Extract fields from the request body
    const {
      quoteNumber,
      quoteDate,
      quoteDueDate,
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
      quoteItems,
    } = req.body;

    // **VALIDATIONS**: Ensure all calculations are correct based on what was provided
    if (total || subTotal || totalTax) {
      // 1. Validate subTotal if it's provided
      if (subTotal && quoteItems && quoteItems.length > 0) {
        const calculatedSubTotal = quoteItems.reduce(
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
      if (totalTax && quoteItems && quoteItems.length > 0) {
        const calculatedTotalTax = quoteItems.reduce(
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
          (subTotal || existingQuote.subTotal / 100) +
          (totalTax || existingQuote.totalTax / 100) -
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

    // Proceed to update the quote and quoteItems if everything is valid
    const updatedQuote = await prisma.$transaction(async (prisma) => {
      // Update the quote data
      const updatedData = {
        quoteNumber: quoteNumber || existingQuote.quoteNumber,
        quoteDate: quoteDate || existingQuote.quoteDate,
        quoteDueDate: quoteDueDate || existingQuote.quoteDueDate,
        status: status || existingQuote.status,
        total: total ? total * 100 : existingQuote.total,
        subTotal: subTotal ? subTotal * 100 : existingQuote.subTotal,
        discount:
          discount !== undefined ? discount * 100 : existingQuote.discount,
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
        // Delete existing quote items
        await prisma.quoteItems.deleteMany({
          where: { quoteId },
        });

        const quoteItemsData = quoteItems.map((item: any) => {
          // Ensure each item's totalPrice is correct (price * quantity)
          const calculatedTotalPrice = item.price * item.quantity;
          if (calculatedTotalPrice !== item.totalPrice) {
            throw new ApiError(400, "TotalPrice Mismatch for Item", [
              `The totalPrice for product ${item.productName} does not match the calculated total.`,
            ]);
          }

          return {
            ...item,
            quoteId,
            price: item.price * 100, // Store price in cents for precision
            totalPrice: item.totalPrice * 100,
            subTotal: item.subTotal * 100,
            taxableAmount: item.taxableAmount * 100,
          };
        });

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
        total: true,
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
      total: quote.total / 100,
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
    const [quote] = await Promise.all([
      prisma.quote.findUnique({
        where: { id: quoteId, userId: req.body.userDetails.id },
        select: {
          id: true,
          shippingAddressId: true,
          quoteNumber: true,
          quoteDate: true,
          quoteDueDate: true,
          status: true,
          total: true,
          subTotal: true,
          discount: true,
          totalTax: true,
          notes: true,
          quoteItems: {
            select: {
              id: true,
              productId: true,
              productName: true,
              productDescription: true,
              hsnCode: true,
              price: true,
              quantity: true,
              totalPrice: true,
              subTotal: true,
              taxableAmount: true,
              taxId: true,
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
          },
        },
      }),
    ]);

    // Check if either quote or user is not found
    if (!quote) {
      throw new ApiError(404, "Quote not found or Not authorized.", [
        "Quote not found or Not authorized.",
      ]);
    }

    // Transform the quote data
    const updatedquote = {
      ...quote, // Spread existing quote properties
      total: quote.total / 100,
      subTotal: quote.subTotal / 100,
      discount: quote.discount / 100,
      totalTax: quote.totalTax / 100,
      quoteItems: quote.quoteItems.map((item: any) => ({
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
      result: { quote: updatedquote },
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

const QuoteToInvoiceController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const quoteId = req.params.id;

    // Fetch the quote details
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: {
        id: true,
        quoteNumber: true,
        quoteDate: true,
        quoteDueDate: true,
        status: true,
        total: true,
        subTotal: true,
        discount: true,
        totalTax: true,
        notes: true,
        clientId: true,
        shippingAddressId: true,
        userId: true,
        quoteItems: {
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
            productId: true,
            taxId: true, // Ensure this field exists in both models
          },
        },
      },
    });

    if (!quote) {
      throw new ApiError(404, `Quote with id: ${quoteId} Not Found!`);
    }

    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update the quote status
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          updatedAt: new Date(),
          status: "Converted_To_Invoice",
        },
      });

      // Create the invoice
      const generatedInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: quote.quoteNumber,
          invoiceDate: quote.quoteDate,
          invoiceDueDate: quote.quoteDueDate,
          clientId: quote.clientId,
          userId: quote.userId,
          shippingAddressId: quote.shippingAddressId,
          status: "Pending",
          total: quote.total,
          subTotal: quote.subTotal,
          discount: quote.discount,
          totalTax: quote.totalTax,
          notes: quote.notes,
          quoteId: quote.id, // Link back to the original quote
        },
      });

      // Prepare invoice items data
      const invoiceItemsData = quote.quoteItems.map((item) => ({
        productName: item.productName, // Ensure you map necessary fields
        productDescription: item.productDescription || null, // Handle optional fields
        hsnCode: item.hsnCode || null, // Handle optional fields
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        subTotal: item.subTotal,
        taxableAmount: item.taxableAmount,
        productId: item.productId,
        taxId: item.taxId, // Ensure taxId is defined in both models
        invoiceId: generatedInvoice.id, // Link to the created invoice
      }));

      // Create invoice items in bulk
      await prisma.invoiceItems.createMany({
        data: invoiceItemsData, // Ensure this matches your InvoiceItems model structure
      });

      return generatedInvoice; // Return the created invoice for further use if needed
    });

    res.status(201).json({
      status: "Success",
      message: "Quote converted to Invoice successfully.",
      invoiceId: result.id, // Return the created invoice details
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error.message);
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
  QuoteToInvoiceController,
};

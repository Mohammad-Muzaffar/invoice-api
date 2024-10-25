import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const GetExcelInvoicesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const {
      startDate,
      endDate,
      startDueDate,
      endDueDate,
      status,
      clientName,
      clientId,
    } = req.query;

    // Build the filters
    const filters: any = {
      isDeleted: false, // Assuming you want to exclude deleted invoices
    };

    if (startDate || endDate) {
      filters.invoiceDate = {};
      if (startDate) filters.invoiceDate.gte = new Date(startDate as string);
      if (endDate) filters.invoiceDate.lte = new Date(endDate as string);
    }

    if (startDueDate || endDueDate) {
      filters.invoiceDueDate = {};
      if (startDueDate)
        filters.invoiceDueDate.gte = new Date(startDueDate as string);
      if (endDueDate)
        filters.invoiceDueDate.lte = new Date(endDueDate as string);
    }

    if (status) {
      filters.status = status;
    }

    if (clientId) {
      filters.clientId = clientId;
    }

    // If clientName is provided, find client ID first
    let clientIdFromName;
    if (clientName) {
      const client = await prisma.clients.findFirst({
        where: {
          OR: [
            {
              firstName: {
                contains: clientName as string,
                mode: "insensitive",
              },
            },
            {
              lastName: { contains: clientName as string, mode: "insensitive" },
            },
            {
              companyName: {
                contains: clientName as string,
                mode: "insensitive",
              },
            },
          ],
        },
        select: { id: true },
      });
      clientIdFromName = client?.id;
    }

    if (clientIdFromName) {
      filters.clientId = clientIdFromName;
    }

    // Fetch invoices based on filters
    const invoices = await prisma.invoice.findMany({
      where: filters,
      include: {
        invoiceItems: true,
        client: true,
      },
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    // Define columns for the worksheet
    worksheet.columns = [
      { header: "Invoice Number", key: "invoiceNumber", width: 20 },
      { header: "Invoice Date", key: "invoiceDate", width: 15 },
      { header: "Due Date", key: "invoiceDueDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Subtotal", key: "subTotal", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Total Tax", key: "totalTax", width: 15 },
      { header: "Invoice Created At", key: "createdAt", width: 15 },
      { header: "Client Name", key: "clientName", width: 30 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 10 },
      { header: "Product Tax", key: "taxableAmount", width: 15 },
      { header: "Sub Total Price", key: "subTotalPrice", width: 15 },
      { header: "Total Price", key: "totalPrice", width: 15 },
    ];

    // Add rows to the worksheet
    invoices.forEach((invoice) => {
      invoice.invoiceItems.forEach((item) => {
        worksheet.addRow({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          invoiceDueDate: invoice.invoiceDueDate,
          status: invoice.status,
          subTotal: invoice.subTotal / 100,
          total: invoice.total / 100,
          discount: invoice.discount / 100,
          totalTax: invoice.totalTax / 100,
          createdAt: invoice.createdAt,
          clientName:
            `${invoice.client.firstName} ${invoice.client.lastName}` ||
            invoice.client.companyName ||
            "",
          productName: item.productName,
          quantity: item.quantity,
          price: item.price / 100,
          totalPrice: item.totalPrice / 100,
          taxableAmount: item.taxableAmount / 100,
          subTotalPrice: item.subTotal / 100,
        });
      });
    });

    // Set response headers for downloading an Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoices.xlsx"`
    );

    // Write the workbook to the response stream
    await workbook.xlsx.write(res);

    res.end(); // End the response
  } catch (error: any) {
    res.status(500).json({
      status: "Error",
      message: error.message || "Something went wrong.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const GetExcelQuotesController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const {
      startDate,
      endDate,
      startDueDate,
      endDueDate,
      status,
      clientName,
      clientId,
    } = req.query;

    // Build the filters
    const filters: any = {};

    if (startDate || endDate) {
      filters.quoteDate = {};
      if (startDate) filters.quoteDate.gte = new Date(startDate as string);
      if (endDate) filters.quoteDate.lte = new Date(endDate as string);
    }

    if (startDueDate || endDueDate) {
      filters.quoteDueDate = {};
      if (startDueDate)
        filters.quoteDueDate.gte = new Date(startDueDate as string);
      if (endDueDate) filters.quoteDueDate.lte = new Date(endDueDate as string);
    }

    if (status) {
      filters.status = status;
    }

    if (clientId) {
      filters.clientId = clientId;
    }

    // If clientName is provided, find client ID first
    let clientIdFromName;
    if (clientName) {
      const client = await prisma.clients.findFirst({
        where: {
          OR: [
            {
              firstName: {
                contains: clientName as string,
                mode: "insensitive",
              },
            },
            {
              lastName: { contains: clientName as string, mode: "insensitive" },
            },
            {
              companyName: {
                contains: clientName as string,
                mode: "insensitive",
              },
            },
          ],
        },
        select: { id: true },
      });
      clientIdFromName = client?.id;
    }

    if (clientIdFromName) {
      filters.clientId = clientIdFromName;
    }

    // Fetch invoices based on filters
    const quotes = await prisma.quote.findMany({
      where: filters,
      include: {
        quoteItems: true,
        client: true,
      },
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quotes");

    // Define columns for the worksheet
    worksheet.columns = [
      { header: "Quote Number", key: "quoteNumber", width: 20 },
      { header: "Quote Date", key: "quoteDate", width: 15 },
      { header: "Due Date", key: "invoiceDueDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Subtotal", key: "subTotal", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Total Tax", key: "totalTax", width: 15 },
      { header: "Quote Created At", key: "createdAt", width: 15 },
      { header: "Client Name", key: "clientName", width: 30 },
      { header: "Product Name", key: "productName", width: 30 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 10 },
      { header: "Product Tax", key: "taxableAmount", width: 15 },
      { header: "Sub Total Price", key: "subTotalPrice", width: 15 },
      { header: "Total Price", key: "totalPrice", width: 15 },
    ];

    // Add rows to the worksheet
    quotes.forEach((quote) => {
      quote.quoteItems.forEach((item) => {
        worksheet.addRow({
          quoteNumber: quote.quoteNumber,
          quoteDate: quote.quoteDate,
          quoteDueDate: quote.quoteDueDate,
          status: quote.status,
          subTotal: quote.subTotal / 100,
          total: quote.total / 100,
          discount: quote.discount / 100,
          totalTax: quote.totalTax / 100,
          createdAt: quote.createdAt,
          clientName:
            `${quote.client.firstName} ${quote.client.lastName}` ||
            quote.client.companyName ||
            "",
          productName: item.productName,
          quantity: item.quantity,
          price: item.price / 100,
          totalPrice: item.totalPrice / 100,
          taxableAmount: item.taxableAmount / 100,
          subTotalPrice: item.subTotal / 100,
        });
      });
    });

    // Set response headers for downloading an Excel file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="quotes.xlsx"`);

    // Write the workbook to the response stream
    await workbook.xlsx.write(res);

    res.end(); // End the response
  } catch (error: any) {
    res.status(500).json({
      status: "Error",
      message: error.message || "Something went wrong.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export { GetExcelInvoicesController, GetExcelQuotesController };

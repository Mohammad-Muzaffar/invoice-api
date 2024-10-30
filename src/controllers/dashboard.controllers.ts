import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";

const DashboardController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const data = await prisma.$transaction(async (prisma) => {
      const invoices = await prisma.invoice.count({
        where: { userId: req.body.userDetails.id },
      });
      const clients = await prisma.clients.count({
        where: { userId: req.body.userDetails.id },
      });
      const products = await prisma.product.count({
        where: { userId: req.body.userDetails.id },
      });
      const total = await prisma.invoice.findMany({
        where: { userId: req.body.userDetails.id },
        select: {
          id: true,
          total: true,
        },
      });
      const totalRevenue = (total.reduce((acc, item) => acc + item.total, 0)) / 100;

      return { invoices, clients, products, totalRevenue };
    });

    res.status(200).json({
      status: "Success",
      result: data,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export { DashboardController };

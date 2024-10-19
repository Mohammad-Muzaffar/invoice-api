import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { UserUpdateSchema } from "../config/user.zod";
import { ApiError } from "../utils/apiError";

const UpdateUserController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = UserUpdateSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, "Please Enter Valid Fields.", [error]);
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.body.userDetails.id,
      },
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: user?.id,
      },
      data: {
        companyName: req.body.companyName || user?.companyName,
        userName: req.body.userName || user?.userName,
        email: req.body.email || user?.email,
        companyPhone: req.body.companyPhone || user?.companyPhone,
        gstinNumber: req.body.gstinNumber || user?.gstinNumber,
        msmeNumber: req.body.msmeNumber || user?.msmeNumber,
        panNumber: req.body.panNumber || user?.panNumber,
        street: req.body.street || user?.street,
        city: req.body.city || user?.city,
        state: req.body.state || user?.state,
        country: req.body.country || user?.country,
        postCode: req.body.postCode || user?.postCode,
        bankName: req.body.bankName || user?.bankName,
        bankBranchName: req.body.bankBranchName || user?.bankBranchName,
        bankAccountNumber:
          req.body.bankAccountNumber || user?.bankAccountNumber,
        ifscCode: req.body.ifscCode || user?.ifscCode,
        updatedAt: new Date(),
      },
      select: {
        id: true,
      },
    });
    if (!updatedUser) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while updating user.",
      ]);
    }

    res.status(200).json({
      status: "Success",
      message: "User Details Updated Successfully!",
      id: updatedUser.id,
    });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export { UpdateUserController };

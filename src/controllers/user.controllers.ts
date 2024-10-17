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
        orgName: req.body.orgName || user?.orgName,
        username: req.body.username || user?.username,
        email: req.body.email || user?.email,
        gstNumber: req.body.gstNumber || user?.gstNumber,
        phone: req.body.phone || user?.phone,
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

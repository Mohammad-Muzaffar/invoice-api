import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { UserUpdateSchema } from "../config/user.zod";
import { ApiError } from "../utils/apiError";
import { uploadOnCloudinary } from "../utils/cloudinary";

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
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const GetUserDetatilsController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.body.userDetails.id,
      },
      select: {
        userName: true,
        email: true,
        companyName: true,
        companyLogo: true,
        companyPhone: true,
        companyAuthorizedSign: true,
        companyStamp: true,
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

    if (!user) {
      throw new ApiError(404, "User Not Found!");
    }

    res.status(200).json({
      status: "Success",
      message: "User Details Updated Successfully!",
      user,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const UploadUserController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const files = req.files as Express.Multer.File[];

    // Check for uploaded files
    if (!files || files.length === 0) {
      throw new ApiError(400, "No files uploaded!", ["No files found!"]);
    }

    // Get the file paths
    const localFilePaths = files.map((file) => file.path);

    // Ensure we have enough files before uploading
    const [companyLogo, companyStamp, companyAuthorizedSign] =
      await Promise.all(
        localFilePaths.map((path, index) =>
          index < 3 ? uploadOnCloudinary(path, res) : null
        )
      );

    // Update user with uploaded file URLs

    const updatedUser = await prisma.user.update({
      where: {
        id: req.body.userDetails.id,
      },
      data: {
        companyLogo: companyLogo?.toString() || null,
        companyStamp: companyStamp?.toString() || null,
        companyAuthorizedSign: companyAuthorizedSign?.toString() || null,
      },
    });

    if (!updatedUser) {
      throw new ApiError(500, "Something went wrong.", [
        "Something went wrong while uploading files.",
        "User does not exist.",
      ]);
    }

    res.status(200).json({
      status: "Success",
      id: updatedUser.id,
      companyLogo: updatedUser.companyLogo,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message || "An unexpected error occurred.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export {
  UpdateUserController,
  UploadUserController,
  GetUserDetatilsController,
};

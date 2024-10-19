import jwt, { JwtPayload } from "jsonwebtoken";
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  VerifyForgotPasswordSchema,
} from "../config/auth.zod";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens";
import { error } from "console";
import { REFRESH_TOKEN_SECRET } from "../config/config";
import { SendForgotPasswordMail } from "../utils/sendEmails";

const twoDays = 2 * 24 * 60 * 60 * 1000;
const fifteenDays = 15 * 24 * 60 * 60 * 1000;

const cookieOptionsTwoDays = {
  httpOnly: true,
  secure: true,
  maxAge: twoDays,
};

const cookieOptionsFifteenDays = {
  httpOnly: true,
  secure: true,
  maxAge: fifteenDays,
};

const RegisterController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const { success, error } = RegisterSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(
        403,
        "all the fields entered are not valid please check",
        [error]
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });
    if (user) {
      throw new ApiError(400, "User already exists please login.", [
        {
          message:
            "User already exists please login or try registering from different account.",
        },
      ]);
    }

    const hashPassword = await bcrypt.hash(req.body.password, 11);
    const newUser = await prisma.user.create({
      data: {
        userName: req.body.userName,
        email: req.body.email,
        password: hashPassword,
        companyPhone: req.body.companyPhone,
        createdAt: new Date(),
      },
    });
    if (!newUser) {
      throw new ApiError(400, "Something went wrong while registering.");
    }

    // Generate jwt refresh and access Token:

    const { accessToken, accessExpires } = generateAccessToken(newUser.id);
    const { refreshToken, refreshExpires } = generateRefreshToken(newUser.id);

    // Add Refresh token to db;

    await prisma.user.update({
      where: {
        id: newUser.id,
      },
      data: {
        updatedAt: new Date(),
        refreshToken: refreshToken,
        refreshTokenExpiresAt: refreshExpires,
      },
    });

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptionsTwoDays)
      .cookie("refreshToken", refreshToken, cookieOptionsFifteenDays)
      .json({
        status: "Success",
        accessToken,
        accessTokenExpiresAt: accessExpires,
        refreshToken,
        refreshTokenExpiresAt: refreshExpires,
      });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const LoginController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const { success, error } = LoginSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(
        403,
        "All the fields entered are not valid please check",
        [error]
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
    });
    if (!user) {
      throw new ApiError(404, "User does not exists please register.", [
        {
          message: "User does not exists please register.",
        },
      ]);
    }

    // Check password
    const matchPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!matchPassword) {
      throw new ApiError(401, "User credentials does not match", [
        {
          message: "User credentials does not match.",
        },
      ]);
    }

    // Generate jwt refresh and access Token:
    const { accessToken, accessExpires } = generateAccessToken(user.id);
    const { refreshToken, refreshExpires } = generateRefreshToken(user.id);

    // Add Refresh token to db;
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        updatedAt: new Date(),
        refreshToken: refreshToken,
        refreshTokenExpiresAt: refreshExpires,
      },
    });

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptionsTwoDays)
      .cookie("refreshToken", refreshToken, cookieOptionsFifteenDays)
      .json({
        status: "Success",
        accessToken,
        accessTokenExpiresAt: accessExpires,
        refreshToken,
        refreshTokenExpiresAt: refreshExpires,
      });
  } catch (error: any) {
    res.status(error.statusCode).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const LogoutController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: req.body.userDetails.id,
      },
      data: {
        updatedAt: new Date(),
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    });

    res
      .status(200)
      .clearCookie("accessToken", cookieOptionsTwoDays)
      .clearCookie("refreshToken", cookieOptionsFifteenDays)
      .json({
        message: "User Logged Out.",
      });
  } catch (error) {
    res.status(400).json({
      error: "Something happend while loging out.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const AuthCheckController = (req: Request, res: Response) => {
  res.status(200).json({
    status: "Authorized",
    isActive: true,
    message: "Token is valid",
  });
};

const RefreshController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();

  try {
    const incommingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incommingRefreshToken) {
      throw new ApiError(401, "Unauthorized Request", [
        {
          error: "Unauthorized",
        },
      ]);
    }

    const result = jwt.verify(
      incommingRefreshToken,
      REFRESH_TOKEN_SECRET
    ) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: {
        id: result.uset_id,
      },
      select: {
        id: true, // Include required fields explicitly
        userName: true,
        email: true,
        companyPhone: true,
        refreshToken: true,
        companyName: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "Invalid Token Credentials", [
        {
          error: "Invalid User Token Credentials",
        },
      ]);
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid Token", [
        {
          error: "Unauthorized request",
        },
      ]);
    }

    const { accessExpires, accessToken } = generateAccessToken(user.id);

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptionsTwoDays)
      .json({
        status: "Success",
        accessToken,
        ExpiresAt: accessExpires,
      });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const ChangePasswordController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = ChangePasswordSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(
        400,
        "Zod Validation Failed Please check the payload.",
        [error]
      );
    }

    const user = (await prisma.user.findFirst({
      where: {
        id: req.body.userDetails.id,
      },
      select: {
        password: true,
        email: true,
      },
    })) || { password: "" };

    const matchPassword = await bcrypt.compare(
      req.body.oldPassword,
      user.password
    );
    if (!matchPassword) {
      throw new ApiError(400, "User credentials(old password) does not match", [
        {
          message: "User credentials does not match.",
        },
      ]);
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 11);

    await prisma.user.update({
      where: {
        id: req.body.userDetails.id,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      status: "Success",
      message: "User Password Updated Successfully",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const ForgotPasswordController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = ForgotPasswordSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(403, "Payload does not contain an email field", [
        error,
      ]);
    }

    const user = await prisma.user.findFirst({
      where: {
        email: req.body.email,
      },
      select: {
        id: true,
        email: true,
        companyPhone: true,
      },
    });
    if (!user) {
      throw new ApiError(404, "User does not exists!", [
        "User does not exists!",
      ]);
    }

    const otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const hashedOtp = await bcrypt.hash(otp.toString(), 11);
    const GeneratedOtp = await prisma.otp.create({
      data: {
        createdAt: new Date(),
        userId: user.id,
        otp: hashedOtp,
      },
    });
    if (!GeneratedOtp) {
      throw new ApiError(500, "", [
        "Something went wrong while generating otp",
      ]);
    }

    // send mail here
    const emailsent = await SendForgotPasswordMail({ otp, to: user.email });
    if (!emailsent) {
      throw new ApiError(500, "Internal Server Error", [
        "Something went wrong while sending the email.",
      ]);
    }

    res.status(200).json({
      status: "Success",
      message: `Email with otp has been sent to ${user.email}.`,
      id: GeneratedOtp.id,
      user_id: user.id,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

const VerifyForgotPasswordController = async (req: Request, res: Response) => {
  const prisma = new PrismaClient();
  try {
    const { success, error } = VerifyForgotPasswordSchema.safeParse(req.body);
    const id = req.params.id;
    if (!success || !id) {
      throw new ApiError(403, "Something went wrong!", [
        error,
        "There is no id provided in params",
      ]);
    }

    const requestedOtp = await prisma.otp.findFirst({
      where: {
        id: id,
      },
    });
    if (!requestedOtp) {
      throw new ApiError(404, "Something went wrong!", [
        "Otp has expired or does not exists.",
      ]);
    }

    const matchedOtp = await bcrypt.compare(req.body.otp, requestedOtp.otp);
    if (!matchedOtp) {
      throw new ApiError(401, "Otp did not match", [
        "Otp entered is not valid. please enter a valid otp",
      ]);
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 11);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          email: req.body.email,
        },
        data: {
          password: hashedPassword,
        },
      }),
      prisma.otp.delete({
        where: {
          id: requestedOtp.id,
        },
      }),
    ]);

    res.status(200).json({
      status: "Success",
      message: "User password changed successfully.",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json(error);
  } finally {
    await prisma.$disconnect();
  }
};

export {
  RegisterController,
  LoginController,
  LogoutController,
  AuthCheckController,
  RefreshController,
  ChangePasswordController,
  ForgotPasswordController,
  VerifyForgotPasswordController,
};

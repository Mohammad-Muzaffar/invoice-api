import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { PrismaClient } from "@prisma/client";
import { ACCESS_TOKEN_SECRET } from "../config/config";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";

const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const prisma = new PrismaClient();

  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized", [
        {
          error: "Unauthorized user or token has expired.",
        },
      ]);
    }

    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: {
        id: decodedToken?.user_id,
      },
      select: {
        id: true, // Include required fields explicitly
        orgName: true,
        username: true,
        email: true,
        phone: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid Access Token", [
        {
          error: "Invalid Access Token or Token has Expired",
        },
      ]);
    }

    req.body.userDetails = user;
    next();
  } catch (error: any) {
    if (error instanceof PrismaClientValidationError) {
      res
        .status(500)
        .json({ error: "Prisma validation error", details: error.message });
    } else {
      res.status(401).json(error);
    }
  } finally {
    await prisma.$disconnect();
  }
};

export { AuthMiddleware };

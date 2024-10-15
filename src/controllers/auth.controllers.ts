import jwt, { JwtPayload }  from 'jsonwebtoken';
import {LoginSchema, RegisterSchema} from '../config/auth.zod';
import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens';
import { error } from 'console';
import { REFRESH_TOKEN_SECRET } from '../config/config';

const cookieOptions = {
    httpOnly: true,
    secure: true
}

const RegisterController = async (req: Request, res: Response) => {
    const prisma = new PrismaClient();

    try {
            const {success, error} = RegisterSchema.safeParse(req.body);
            if(!success){
                throw new ApiError(403, "all the fields entered are not valid please check", [error]);
            }

            const user = await prisma.user.findFirst({
                where: {
                    email: req.body.email
                }
            });
            if(user){
               throw new ApiError(400, "User already exists please login.", [{
                    message: "User already exists please login or try registering from different account."
               }]); 
            }

           const hashPassword =  await bcrypt.hash(req.body.password, 11);
           const newUser = await prisma.user.create({
                data: {
                    orgName: req.body.orgName,
                    username: req.body.username,
                    email: req.body.email,
                    password: hashPassword,
                    gstNumber: req.body.gstNumber,
                    phone: req.body.phone,
                    createdAt: new Date(),
                }
           });
           if(!newUser){
                throw new ApiError(400, "Something went wrong while registering."); 
           }

           // Generate jwt refresh and access Token:

           const {accessToken, accessExpires} = generateAccessToken(newUser.id);
           const {refreshToken, refreshExpires} = generateRefreshToken(newUser.id);

           // Add Refresh token to db;

           await prisma.user.update({
                where: {
                    id: newUser.id
                },
                data: {
                    updatedAt: new Date(),
                    refreshToken: refreshToken,
                    refreshTokenExpiresAt: refreshExpires
                }
           });

           res.status(200)
              .cookie('accessToken', accessToken, cookieOptions)
              .cookie('refreshToken', refreshToken, cookieOptions)
              .json({
                status: "Success",
                accessToken,
                accessTokenExpiresAt: accessExpires,
                refreshToken,
                refreshTokenExpiresAt: refreshExpires
              });

    } catch (error: any) {
        res.status(error.statusCode)
        .json(error)
    } finally {
        await prisma.$disconnect();
    }
}

const LoginController = async (req: Request, res: Response) => {
    const prisma = new PrismaClient();

    try {
            const {success, error} = LoginSchema.safeParse(req.body);
            if(!success){
                throw new ApiError(
                    403,
                    "All the fields entered are not valid please check",
                    [error]
                );
            }

            const user = await prisma.user.findFirst({
                where: {
                    email: req.body.email
                }
            });
            if(!user){
               throw new ApiError(
                    404,
                    "User does not exists please register.", 
                    [{
                        message: "User does not exists please register."
                   }]
                ); 
            }

            // Check password 
            const matchPassword =  await bcrypt.compare(req.body.password, user.password);
            if(!matchPassword){
                throw new ApiError(
                    401,
                    "User credentials does not match",
                    [{
                        message: "User credentials does not match."
                    }]
                );
            }

           // Generate jwt refresh and access Token:
           const {accessToken, accessExpires} = generateAccessToken(user.id);
           const {refreshToken, refreshExpires} = generateRefreshToken(user.id);

           // Add Refresh token to db;
           await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    updatedAt: new Date(),
                    refreshToken: refreshToken,
                    refreshTokenExpiresAt: refreshExpires
                }
           });

           res.status(200)
              .cookie('accessToken', accessToken, cookieOptions)
              .cookie('refreshToken', refreshToken, cookieOptions)
              .json({
                status: "Success",
                accessToken,
                accessTokenExpiresAt: accessExpires,
                refreshToken,
                refreshTokenExpiresAt: refreshExpires
              });

    } catch (error: any) {
        res.status(error.statusCode)
        .json(error)
    } finally {
        await prisma.$disconnect();
    }
}

const LogoutController = async (req: Request, res: Response) => {
    const prisma = new PrismaClient();
    try {
        const updatedUser = await prisma.user.update({
            where: {
                id: req.body.userDetails.id
            },
            data: {
                updatedAt: new Date(),
                refreshToken: null,
                refreshTokenExpiresAt: null
            }
        });

        res.status(200)
           .clearCookie("accessToken", cookieOptions)
           .clearCookie("refreshToken", cookieOptions)
           .json({
                message: "User Logged Out."
           }); 

    } catch (error) {
        res.status(400).json({
            error: "Something happend while loging out."
        })
    } finally {
        await prisma.$disconnect();
    }
}

const AuthCheckController = (req: Request, res: Response) => {
    res.status(200)
       .json({
            status: "Authorized",
            isActive: true,
            message: "Token is valid"
       }) 
}

const RefreshController = async (req: Request, res: Response) => {
 
    const prisma = new PrismaClient();

    try {
        const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incommingRefreshToken){
            throw new ApiError(
                401,
                "Unauthorized Request",
                [{
                    error: "Unauthorized"
                }]
            )
        }

        const result = jwt.verify(incommingRefreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;

        const user = await prisma.user.findFirst({
            where: {
                id: result.uset_id
            },
            select: {
                id: true,        // Include required fields explicitly
                orgName: true,
                username: true,
                email: true,
                phone: true,
                refreshToken: true
            }
        });

        if(!user){
            throw new ApiError(
                404,
                "Invalid Token Credentials",
                [{
                    error: "Invalid User Token Credentials"
                }]
            )
        }

        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(
                401,
                "Invalid Token",
                [{
                    error: "Unauthorized request"
                }]
            )
        }

        const {accessExpires, accessToken} = generateAccessToken(user.id);

        res.status(200)
           .cookie('accessToken', accessToken, cookieOptions) 
           .json({
                status: "Success",
                accessToken,
                ExpiresAt: accessExpires
           });

    } catch (error: any) {
        res.status(error.statusCode || 500)
            .json(error)
    } finally {
        await prisma.$disconnect();
    }
}

// Need to add Forget Password, Change Password.

export {
    RegisterController,
    LoginController,
    LogoutController,
    AuthCheckController,
    RefreshController
}
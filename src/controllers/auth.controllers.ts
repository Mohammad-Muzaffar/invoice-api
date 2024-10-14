import {LoginSchema, RegisterSchema} from '../config/auth.zod';
import { Request, Response } from 'express';
import { ApiError } from '../utils/apiError';

const RegisterController = async (req: Request, res: Response) => {
    try {
            const {success, error} = RegisterSchema.safeParse(req.body);
            if(!success){
                throw new ApiError(400, "All the fields entered are not valid please check", [error]);
            }
            res.status(200).send("hi")
    } catch (error) {
        res.status(500).send("Error")
        throw new ApiError(500, "Something went wrong while regestration.");
    }
}


export {
    RegisterController
}
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../config/config';

export const generateAccessToken = (id: string) => {
    const today = new Date();
    const accessExpires = new Date(today.setDate(today.getDate() + 2));

    const accessToken = jwt.sign(
        {user_id: id , expiresAt: accessExpires}, 
        ACCESS_TOKEN_SECRET, 
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    );

    return {
        accessToken,
        accessExpires
    }
} 

export const generateRefreshToken = (id: string) => {
    const today = new Date();
    const refreshExpires = new Date(today.setDate(today.getDate() + 15));

    const refreshToken = jwt.sign(
        {uset_id: id, expireAt: refreshExpires},
        REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}  
    );

    return {
        refreshToken,
        refreshExpires
    }
} 
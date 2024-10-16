import dotenv from 'dotenv';

dotenv.config({ path: '/home/am-pc-02/invoice-api/.env'});

export const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || "";
export const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || "";


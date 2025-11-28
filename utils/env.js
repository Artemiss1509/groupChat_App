import { config } from "dotenv";


config({path: `.env.${process.env.NODE_ENV || 'dev'}.local`});

export const {JWT_SECRET, JWT_EXPIRY} = process.env;
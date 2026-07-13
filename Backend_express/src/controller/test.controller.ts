


import { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import JSONBig from "json-bigint";  
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { verifyRefreshToken } from '../utils/jwt';
import dotenv from 'dotenv';


const prisma = new PrismaClient();

dotenv.config();

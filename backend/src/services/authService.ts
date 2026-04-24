import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient.js';
import { env } from '../utils/env.js';
import { RegisterInput, LoginInput } from '../schemas/authSchema.js';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors.js';

const JWT_SECRET: jwt.Secret = env.JWT_SECRET;
const JWT_EXPIRE = env.JWT_EXPIRE;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: TokenPayload): string => {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRE as unknown as jwt.SignOptions['expiresIn']
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

const generateReferralCode = async (): Promise<string> => {
  for (let i = 0; i < 5; i += 1) {
    const code = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const existing = await prisma.user.findFirst({
      where: { referralCode: code }
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error('No se pudo generar el código de referido');
};

export const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new ValidationError('El email ya está registrado');
  }

  const hashedPassword = await hashPassword(data.password);
  const referralCode = await generateReferralCode();

  const inviter = data.referralCode
    ? await prisma.user.findFirst({ where: { referralCode: data.referralCode } })
    : null;

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      referralCode,
      referredById: inviter?.id ?? null
    }
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referralCode: user.referralCode,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      discordDiscriminator: user.discordDiscriminator
    },
    token
  };
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const isPasswordValid = await comparePasswords(data.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referralCode: user.referralCode,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      discordDiscriminator: user.discordDiscriminator
    },
    token
  };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    points: user.points,
    referralCode: user.referralCode,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordDiscriminator: user.discordDiscriminator
  };
};

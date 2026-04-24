import prisma from '../utils/prismaClient.js';
import { Prisma } from '@prisma/client';

export interface EstimatedTokens {
  userId: string;
  userPoints: number;
  totalCommunityPoints: number;
  totalAirdropPool: number;
  estimatedTokens: string;
}

export const calculateEstimatedTokens = async (userId: string): Promise<EstimatedTokens> => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const airdropConfig = await prisma.airdropConfig.findFirst();

  if (!airdropConfig) {
    throw new Error('Airdrop configuration not found');
  }

  const totalCommunityPoints = airdropConfig.totalCommunityPoints;
  const totalAirdropPool = airdropConfig.totalAirdropPool;
  const userPoints = user.points;

  if (totalCommunityPoints === 0) {
    return {
      userId,
      userPoints,
      totalCommunityPoints,
      totalAirdropPool: Number(totalAirdropPool),
      estimatedTokens: '0'
    };
  }

  const ratio = new Prisma.Decimal(userPoints).dividedBy(new Prisma.Decimal(totalCommunityPoints));
  const estimatedTokens = totalAirdropPool.times(ratio);

  return {
    userId,
    userPoints,
    totalCommunityPoints,
    totalAirdropPool: Number(totalAirdropPool),
    estimatedTokens: estimatedTokens.toString()
  };
};

export const getAllUsersEstimatedTokens = async (): Promise<EstimatedTokens[]> => {
  const users = await prisma.user.findMany();

  return Promise.all(users.map((user) => calculateEstimatedTokens(user.id)));
};

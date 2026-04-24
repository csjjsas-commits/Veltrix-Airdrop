import prisma from '../utils/prismaClient.js';

export const getHealthStatus = async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: 'ok',
    database: 'connected'
  };
};

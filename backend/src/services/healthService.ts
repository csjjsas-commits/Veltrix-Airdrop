import prisma from '../utils/prismaClient';

export const getHealthStatus = async () => {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: 'ok',
    database: 'connected'
  };
};

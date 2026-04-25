import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

export const createAdminUser = async (prisma: PrismaClient) => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.ADMIN_NAME) {
    throw new Error(
      'Faltan variables de entorno obligatorias: ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NAME.'
    );
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL }
  });

  if (existingAdmin) {
    console.log(`Usuario administrador ya existe: ${env.ADMIN_EMAIL}. No se duplicará.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log(`Administrador creado correctamente: ${env.ADMIN_EMAIL}`);
};

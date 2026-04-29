import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { env } from '../src/utils/env.js';

dotenv.config({ path: '.env' });

async function createAdminUser(prisma: PrismaClient) {
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
}

async function main() {
  const prisma = new PrismaClient();

  try {
    await createAdminUser(prisma);
    console.log('Admin user created/updated successfully');
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
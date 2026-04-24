import bcrypt from 'bcrypt';
import prisma from './prismaClient.js';
import { env } from './env.js';

const run = async () => {
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

run()
  .catch((error) => {
    console.error('Error creando el administrador inicial:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

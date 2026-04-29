import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env' });

async function seedAccountConnectionTasks(prisma: PrismaClient) {
  console.log('🌱 Creando tareas de conexión de cuentas...');

  const tasks = [
    {
      title: 'Conectar cuenta de Twitter',
      description: 'Conecta tu cuenta de Twitter para participar en tareas sociales y ganar puntos adicionales.',
      points: 50,
      taskType: 'ACCOUNT_CONNECTION',
      verificationType: 'TWITTER_CONNECT',
      platform: 'twitter',
      requiresProof: false,
      active: true,
      isRequired: false,
      verificationData: {
        action: 'connect'
      }
    },
    {
      title: 'Conectar cuenta de YouTube',
      description: 'Conecta tu canal de YouTube para participar en tareas de contenido y ganar puntos adicionales.',
      points: 75,
      taskType: 'ACCOUNT_CONNECTION',
      verificationType: 'YOUTUBE_CONNECT',
      platform: 'youtube',
      requiresProof: false,
      active: true,
      isRequired: false,
      verificationData: {
        action: 'connect'
      }
    }
  ];

  for (const taskData of tasks) {
    const existingTask = await prisma.task.findFirst({
      where: {
        title: taskData.title,
        verificationType: taskData.verificationType
      }
    });

    if (existingTask) {
      console.log(`✅ Tarea ya existe: ${taskData.title}`);
      continue;
    }

    await prisma.task.create({
      data: {
        ...taskData,
        verificationData: JSON.stringify(taskData.verificationData)
      }
    });

    console.log(`✅ Tarea creada: ${taskData.title}`);
  }

  console.log('🎉 Tareas de conexión de cuentas creadas exitosamente!');
}

async function main() {
  const prisma = new PrismaClient();

  try {
    await seedAccountConnectionTasks(prisma);
  } catch (error) {
    console.error('❌ Error creando tareas:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env' });

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Creating a required task...');
    
    const requiredTask = await prisma.task.create({
      data: {
        title: 'Verificación de Identidad - REQUERIDO',
        description: 'Esta es una tarea obligatoria. Debes completarla para desbloquear el resto de las tareas.',
        points: 50,
        taskType: 'AUTO_COMPLETE',
        verificationMethod: 'SYSTEM_AUTOMATIC',
        active: true,
        isRequired: true,
        requiresProof: false,
      },
    });

    console.log('✅ Required task created successfully:', requiredTask.id);
    console.log('Title:', requiredTask.title);
    console.log('isRequired:', requiredTask.isRequired);
  } catch (error) {
    console.error('Failed to create required task:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

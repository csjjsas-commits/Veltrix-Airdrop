import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';

export const seedDemoDatabase = async (prisma: PrismaClient) => {
  // This function is for development/demo purposes only
  // It should never be called in production

  const users = [
  {
    email: 'admin@airdrop.local',
    name: 'Admin AirDrop',
    password: 'admin123',
    role: 'ADMIN' as const,
    points: 1500,
    referralCode: 'REFADMIN'
  },
  {
    email: 'demo1@airdrop.local',
    name: 'Demo User 1',
    password: 'demo123',
    role: 'USER' as const,
    points: 680,
    referralCode: 'REFDEMO1'
  },
  {
    email: 'demo2@airdrop.local',
    name: 'Demo User 2',
    password: 'demo123',
    role: 'USER' as const,
    points: 940,
    referralCode: 'REFDEMO2'
  },
  {
    email: 'demo3@airdrop.local',
    name: 'Demo User 3',
    password: 'demo123',
    role: 'USER' as const,
    points: 420,
    referralCode: 'REFDEMO3'
  },
  {
    email: 'demo4@airdrop.local',
    name: 'Demo User 4',
    password: 'demo123',
    role: 'USER' as const,
    points: 820,
    referralCode: 'REFDEMO4'
  },
  {
    email: 'demo5@airdrop.local',
    name: 'Demo User 5',
    password: 'demo123',
    role: 'USER' as const,
    points: 560,
    referralCode: 'REFDEMO5'
  }
];

const tasks = [
  {
    title: 'Crear perfil de usuario',
    description: 'Completa tu perfil con nombre, foto y biografía.',
    points: 120,
    deadlineOffsetDays: 14
  },
  {
    title: 'Seguir en Twitter',
    description: 'Sigue nuestra cuenta oficial en Twitter para mantenerte actualizado.',
    points: 150,
    deadlineOffsetDays: 30,
    verificationType: 'TWITTER_FOLLOW',
    verificationData: null
  },
  {
    title: 'Dar like al tweet',
    description: 'Da like a nuestro tweet de lanzamiento.',
    points: 100,
    deadlineOffsetDays: 30,
    verificationType: 'TWITTER_LIKE',
    verificationData: null
  },
  {
    title: 'Unirse al Discord',
    description: 'Únete a nuestro servidor de Discord oficial.',
    points: 200,
    deadlineOffsetDays: 30,
    verificationType: 'DISCORD_JOIN',
    verificationData: null
  },
  {
    title: 'Conectar Wallet',
    description: 'Conecta tu wallet de Ethereum para futuras recompensas.',
    points: 300,
    deadlineOffsetDays: 30,
    verificationType: 'WALLET_CONNECT',
    verificationData: null
  },
  {
    title: 'Unirse al canal de Telegram',
    description: 'Únete a nuestro canal oficial de Telegram.',
    points: 120,
    deadlineOffsetDays: 30,
    verificationType: 'TELEGRAM_JOIN_CHANNEL',
    verificationData: null
  },
  {
    title: 'Verificar NFT',
    description: 'Verifica que tienes un NFT de nuestra colección.',
    points: 500,
    deadlineOffsetDays: 30,
    verificationType: 'WALLET_NFT_OWNERSHIP',
    verificationData: null
  },
  {
    title: 'Compartir la app en redes',
    description: 'Publica un post sobre AirDrop y envía la URL.',
    points: 180,
    deadlineOffsetDays: 7
  },
  {
    title: 'Invitar a 3 amigos',
    description: 'Invita a tres amigos para que se registren.',
    points: 220,
    deadlineOffsetDays: 30
  },
  {
    title: 'Completar tutorial',
    description: 'Sigue el tutorial de bienvenida paso a paso.',
    points: 90,
    deadlineOffsetDays: 10
  },
  {
    title: 'Reportar un bug',
    description: 'Envía un informe con un error encontrado.',
    points: 200,
    deadlineOffsetDays: 21
  },
  {
    title: 'Participar en encuesta',
    description: 'Responde la encuesta de experiencia del usuario.',
    points: 70,
    deadlineOffsetDays: 7
  },
  {
    title: 'Configurar autenticación',
    description: 'Activa la verificación en dos pasos.',
    points: 150,
    deadlineOffsetDays: 14
  },
  {
    title: 'Escribir reseña',
    description: 'Deja una reseña en el portal de la comunidad.',
    points: 130,
    deadlineOffsetDays: 30
  },
  {
    title: 'Proponer una mejora',
    description: 'Envía una idea para mejorar AirDrop.',
    points: 160,
    deadlineOffsetDays: 21
  },
  {
    title: 'Ver el roadmap',
    description: 'Revisa el roadmap y comenta una prioridad.',
    points: 80,
    deadlineOffsetDays: 14
  },
  {
    title: 'Completar un desafío',
    description: 'Resuelve un desafío técnico de ejemplo.',
    points: 250,
    deadlineOffsetDays: 30
  },
  {
    title: 'Subir avatar',
    description: 'Carga un avatar para tu cuenta.',
    points: 60,
    deadlineOffsetDays: 7
  }
];

const userTasksData = [
  { userEmail: 'demo1@airdrop.local', taskTitle: 'Crear perfil de usuario', status: 'COMPLETED', pointsAwarded: 120 },
  { userEmail: 'demo1@airdrop.local', taskTitle: 'Compartir la app en redes', status: 'COMPLETED', pointsAwarded: 180 },
  { userEmail: 'demo2@airdrop.local', taskTitle: 'Invitar a 3 amigos', status: 'COMPLETED', pointsAwarded: 220 },
  { userEmail: 'demo2@airdrop.local', taskTitle: 'Completar tutorial', status: 'COMPLETED', pointsAwarded: 90 },
  { userEmail: 'demo3@airdrop.local', taskTitle: 'Reportar un bug', status: 'COMPLETED', pointsAwarded: 200 },
  { userEmail: 'demo3@airdrop.local', taskTitle: 'Participar en encuesta', status: 'COMPLETED', pointsAwarded: 70 },
  { userEmail: 'demo4@airdrop.local', taskTitle: 'Configurar autenticación', status: 'COMPLETED', pointsAwarded: 150 },
  { userEmail: 'demo4@airdrop.local', taskTitle: 'Escribir reseña', status: 'COMPLETED', pointsAwarded: 130 },
  { userEmail: 'demo5@airdrop.local', taskTitle: 'Proponer una mejora', status: 'COMPLETED', pointsAwarded: 160 },
  { userEmail: 'demo5@airdrop.local', taskTitle: 'Ver el roadmap', status: 'COMPLETED', pointsAwarded: 80 },
  { userEmail: 'admin@airdrop.local', taskTitle: 'Completar un desafío', status: 'COMPLETED', pointsAwarded: 250 },
  { userEmail: 'admin@airdrop.local', taskTitle: 'Subir avatar', status: 'COMPLETED', pointsAwarded: 60 }
];

const settings = {
  maintenanceMode: false,
  maxTasksPerUser: 20,
  tokenSymbol: 'VELX',
  defaultTaskDuration: 7
};

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

  await prisma.userTask.deleteMany();
  await prisma.user.deleteMany();
  await prisma.task.deleteMany();
  await prisma.airdropConfig.deleteMany();
  await prisma.systemSettings.deleteMany();

  const createdUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role,
          points: user.points,
          referralCode: user.referralCode
        }
      });
    })
  );

  const createdTasks = await Promise.all(
    tasks.map((task) =>
      prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          points: task.points,
          deadline: task.deadlineOffsetDays ? addDays(task.deadlineOffsetDays) : undefined,
          verificationType: (task.verificationType as any) || null,
          verificationData: task.verificationData || undefined
        }
      })
    )
  );

  const userMap = createdUsers.reduce<Record<string, { id: string }>>((acc, user) => {
    acc[user.email] = { id: user.id };
    return acc;
  }, {});

  const taskMap = createdTasks.reduce<Record<string, { id: string }>>((acc, task) => {
    acc[task.title] = { id: task.id };
    return acc;
  }, {});

  await Promise.all(
    userTasksData.map((item) =>
      prisma.userTask.create({
        data: {
          user: { connect: { id: userMap[item.userEmail].id } },
          task: { connect: { id: taskMap[item.taskTitle].id } },
          status: item.status,
          pointsAwarded: item.pointsAwarded,
          completedAt: new Date()
        }
      })
    )
  );

  const totalCommunityPoints = createdUsers.reduce((sum, user) => sum + user.points, 0);

  await prisma.airdropConfig.create({
    data: {
      totalAirdropPool: new Prisma.Decimal('10000000'),
      totalCommunityPoints,
      startDate: new Date(),
      endDate: addDays(90),
      isActive: true
    }
  });

  await prisma.systemSettings.create({
    data: {
      maintenanceMode: settings.maintenanceMode,
      maxTasksPerUser: settings.maxTasksPerUser,
      tokenSymbol: settings.tokenSymbol,
      defaultTaskDuration: settings.defaultTaskDuration
    }
  });

  console.log('Seed completed.');
};

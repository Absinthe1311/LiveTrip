import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAdminUser() {
  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { username: '666' },
        { email: '666' },
      ],
    },
  });

  console.log('管理员用户:', admin);
  await prisma.$disconnect();
}

getAdminUser();

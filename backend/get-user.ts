import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUser() {
  const user = await prisma.user.findFirst();
  console.log('用户ID:', user?.id);
  await prisma.$disconnect();
}

getUser();

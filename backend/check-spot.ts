import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const spot = await prisma.spot.findFirst({
    where: { name: '上海世博会博物馆' },
  });

  console.log('景点:', spot);

  if (spot) {
    const image = await prisma.spotImage.findFirst({
      where: { spotId: spot.id },
    });
    console.log('图片:', image);
  }

  await prisma.$disconnect();
}

check();

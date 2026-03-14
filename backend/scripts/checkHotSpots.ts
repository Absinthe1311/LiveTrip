import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hotSpots = await prisma.spot.count({ where: { isHot: true } });
  console.log('热门景点数量:', hotSpots);
  
  const allSpots = await prisma.spot.count();
  console.log('总景点数量:', allSpots);
  
  await prisma.$disconnect();
}

main();

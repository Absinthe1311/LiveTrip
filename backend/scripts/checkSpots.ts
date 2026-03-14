import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cities = await prisma.spot.groupBy({
    by: ['city'],
    _count: { id: true }
  });
  
  console.log('数据库中的城市分布:');
  cities.forEach(c => console.log(`${c.city}: ${c._count.id}个景点`));
  
  const total = await prisma.spot.count();
  console.log(`总计: ${total}个景点`);
  
  await prisma.$disconnect();
}

main();

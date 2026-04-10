import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const spots = await prisma.spot.findMany({
    where: {
      name: {
        in: [
          '故宫博物院',
          '外滩',
          '鼓浪屿',
          '成都大熊猫繁育研究基地',
          '广州塔',
          '世界之窗',
          '武侯祠',
          '南普陀寺',
        ],
      },
    },
    select: {
      name: true,
      description: true,
    },
  });

  for (const spot of spots) {
    console.log(`\n${spot.name} (${spot.description?.length || 0}字):`);
    console.log(spot.description);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

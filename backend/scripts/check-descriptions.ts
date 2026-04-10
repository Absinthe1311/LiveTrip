import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const spots = await prisma.spot.findMany({
    where: {
      name: {
        in: ['故宫博物院', '外滩', '鼓浪屿', '成都大熊猫繁育研究基地', '巧克巧蔻·巧克力博物馆(北京馆)']
      }
    },
    select: {
      name: true,
      description: true,
    }
  });

  console.log(JSON.stringify(spots, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

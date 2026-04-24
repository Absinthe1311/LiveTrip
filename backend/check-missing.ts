import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const cities = ['上海', '北京', '厦门', '成都', '杭州', '西安'];

  for (const city of cities) {
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
        image: null,
      },
    });
    console.log(`${city}: ${spots.length}个缺失图片`);
    spots.forEach(s => console.log(`  - ${s.name} (${s.id})`));
  }

  await prisma.$disconnect();
}

check();

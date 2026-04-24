import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentSpots() {
  const cities = ['上海', '北京', '厦门', '成都', '杭州', '西安'];

  console.log('当前数据库景点数量:');
  console.log('─'.repeat(50));

  for (const city of cities) {
    const total = await prisma.spot.count({ where: { city } });
    const withImage = await prisma.spot.count({
      where: {
        city,
        image: { isNot: null },
      },
    });
    console.log(`${city}: 总数 ${total}, 有图片 ${withImage}`);
  }

  await prisma.$disconnect();
}

checkCurrentSpots();

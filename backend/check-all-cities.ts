import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllCities() {
  console.log('所有城市景点统计...\n');
  console.log('─'.repeat(70));

  const cities = ['北京', '上海', '成都', '杭州', '厦门', '西安', '武汉', '三亚', '丽江'];

  console.log('城市\t\t总数\t热门\t非热门\t有图片\t状态');
  console.log('─'.repeat(70));

  for (const city of cities) {
    const total = await prisma.spot.count({
      where: { city },
    });

    const hot = await prisma.spot.count({
      where: { city, isHot: true },
    });

    const notHot = await prisma.spot.count({
      where: { city, isHot: false },
    });

    const withImage = await prisma.spot.count({
      where: {
        city,
        image: { isNot: null },
      },
    });

    const status = hot === total ? '✅' : '⚠️';
    console.log(`${city}\t\t${total}\t${hot}\t${notHot}\t${withImage}\t${status}`);
  }

  console.log('─'.repeat(70));
  console.log('\n说明:');
  console.log('- 总数: 该城市的所有景点数量');
  console.log('- 热门: isHot=true的景点数量');
  console.log('- 非热门: isHot=false的景点数量');
  console.log('- 有图片: 有图片的景点数量');
  console.log('- 状态: ✅表示全部标记为热门，⚠️表示有景点未标记为热门');

  await prisma.$disconnect();
}

checkAllCities();

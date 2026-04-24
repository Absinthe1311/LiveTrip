import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const HOT_CITIES = ['北京', '上海', '厦门', '成都', '杭州', '西安'];

(async () => {
  try {
    console.log('=== 验证各城市景点数量 ===\n');

    for (const city of HOT_CITIES) {
      // 统计所有景点
      const allCount = await prisma.spot.count({
        where: { city }
      });

      // 统计热门景点
      const hotCount = await prisma.spot.count({
        where: { city, isHot: true }
      });

      // 统计有图片的景点
      const withImageCount = await prisma.spot.count({
        where: {
          city,
          image: { isNot: null }
        }
      });

      console.log(`${city}:`);
      console.log(`  总景点数: ${allCount}`);
      console.log(`  热门景点数: ${hotCount}`);
      console.log(`  有图片景点数: ${withImageCount}`);
      console.log('');
    }

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

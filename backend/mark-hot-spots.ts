// AI辅助生成：GLM-5, 2026-04-23 23:10
// 描述：为每个城市标记9个热门景点

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markHotSpots() {
  console.log('开始标记热门景点...\n');

  try {
    // 需要处理的6个城市
    const cities = ['北京', '上海', '成都', '杭州', '厦门', '西安'];

    // 1. 先将所有景点标记为非热门
    console.log('1. 清除所有热门标记...');
    const clearResult = await prisma.spot.updateMany({
      where: {},
      data: { isHot: false },
    });
    console.log(`✅ 已清除 ${clearResult.count} 个景点的热门标记\n`);

    // 2. 为每个城市标记9个热门景点
    for (const city of cities) {
      console.log(`2. 处理城市: ${city}`);

      // 获取该城市有图片的景点，按评分排序
      const spots = await prisma.spot.findMany({
        where: {
          city: city,
          image: { isNot: null },
        },
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 9,
      });

      if (spots.length === 0) {
        console.log(`⚠️  ${city} 没有有图片的景点，跳过\n`);
        continue;
      }

      // 标记为热门
      const spotIds = spots.map(s => s.id);
      const updateResult = await prisma.spot.updateMany({
        where: {
          id: { in: spotIds },
        },
        data: { isHot: true },
      });

      console.log(`✅ 已为 ${city} 标记 ${updateResult.count} 个热门景点:`);
      spots.forEach((spot, index) => {
        console.log(`   ${index + 1}. ${spot.name} (评分: ${spot.rating || '无'})`);
      });
      console.log();
    }

    // 3. 统计结果
    console.log('3. 统计结果:');
    console.log('─'.repeat(50));

    for (const city of cities) {
      const total = await prisma.spot.count({
        where: { city },
      });

      const hot = await prisma.spot.count({
        where: { city, isHot: true },
      });

      const withImage = await prisma.spot.count({
        where: {
          city,
          image: { isNot: null },
        },
      });

      console.log(`${city}: 总数 ${total}, 热门 ${hot}, 有图片 ${withImage}`);
    }

    console.log('\n✅ 热门景点标记完成！');

  } catch (error) {
    console.error('❌ 标记失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markHotSpots();

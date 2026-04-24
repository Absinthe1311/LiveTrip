import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 检查备选景点数据 ===\n');

    // 1. 检查SpotAlternative表
    const alternativesCount = await prisma.spotAlternative.count();
    console.log(`📊 备选关系总数: ${alternativesCount}`);

    // 2. 查看一些备选关系示例
    const sampleAlternatives = await prisma.spotAlternative.findMany({
      take: 5,
    });

    console.log('\n=== 备选关系示例 ===');
    for (const alt of sampleAlternatives) {
      const originalSpot = await prisma.spot.findUnique({
        where: { id: alt.originalSpotId },
        select: { id: true, name: true, city: true }
      });
      const alternativeSpot = await prisma.spot.findUnique({
        where: { id: alt.alternativeSpotId },
        select: { id: true, name: true, city: true, image: true }
      });

      if (originalSpot && alternativeSpot) {
        console.log(`\n原景点: ${originalSpot.name} (${originalSpot.city})`);
        console.log(`备选景点: ${alternativeSpot.name} (${alternativeSpot.city})`);
        console.log(`备选景点图片: ${alternativeSpot.image ? '✅有图' : '❌无图'}`);
        if (alternativeSpot.image) {
          console.log(`图片URL: ${alternativeSpot.image.url.substring(0, 60)}...`);
        }
      }
    }

    // 3. 检查哪些景点没有备选景点
    const allSpots = await prisma.spot.findMany({
      select: { id: true, name: true, city: true }
    });

    const spotsWithoutAlternatives = [];
    for (const spot of allSpots) {
      const count = await prisma.spotAlternative.count({
        where: { originalSpotId: spot.id }
      });
      if (count === 0) {
        spotsWithoutAlternatives.push(spot);
      }
    }

    console.log(`\n\n=== 没有备选景点的景点 ===`);
    console.log(`总数: ${spotsWithoutAlternatives.length}`);
    console.log('\n前20个示例:');
    spotsWithoutAlternatives.slice(0, 20).forEach((spot, idx) => {
      console.log(`${idx + 1}. ${spot.name} (${spot.city}) - ID: ${spot.id}`);
    });

    // 4. 按城市统计没有备选景点的数量
    const cityStats: Record<string, number> = {};
    spotsWithoutAlternatives.forEach(spot => {
      cityStats[spot.city] = (cityStats[spot.city] || 0) + 1;
    });

    console.log('\n按城市统计:');
    Object.entries(cityStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([city, count]) => {
        console.log(`  ${city}: ${count}个景点无备选`);
      });

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

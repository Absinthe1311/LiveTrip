import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 检查特定景点状态 ===\n');

    // 1. 查询openTime为null的景点
    const nullOpenTimeSpots = await prisma.spot.findMany({
      where: { openTime: null },
      select: {
        id: true,
        name: true,
        city: true,
        openTime: true,
        image: {
          select: {
            url: true,
            status: true
          }
        }
      }
    });

    console.log(`⚠️  openTime为null的景点 (${nullOpenTimeSpots.length}个):`);
    nullOpenTimeSpots.forEach((spot, idx) => {
      const hasImage = spot.image ? '✅有图' : '❌无图';
      console.log(`${idx + 1}. ${spot.name} (${spot.city}) - ${hasImage} - ID: ${spot.id}`);
    });

    // 2. 查询没有图片的景点（按城市分组）
    const noImageSpots = await prisma.spot.findMany({
      where: {
        image: null
      },
      select: {
        id: true,
        name: true,
        city: true,
        openTime: true
      }
    });

    console.log(`\n\n❌ 没有图片的景点总数: ${noImageSpots.length}`);

    // 按城市分组统计
    const cityStats: Record<string, number> = {};
    noImageSpots.forEach(spot => {
      cityStats[spot.city] = (cityStats[spot.city] || 0) + 1;
    });

    console.log('\n按城市统计:');
    Object.entries(cityStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([city, count]) => {
        console.log(`  ${city}: ${count}个景点无图片`);
      });

    // 3. 显示前20个无图片景点
    console.log('\n无图片景点示例（前20个）:');
    noImageSpots.slice(0, 20).forEach((spot, idx) => {
      console.log(`${idx + 1}. ${spot.name} (${spot.city}), openTime: ${spot.openTime || 'null'}`);
    });

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 数据库景点图片检查 ===\n');

    // 1. 查询景点总数
    const spotCount = await prisma.spot.count();
    console.log(`📍 景点总数: ${spotCount}`);

    // 2. 查询图片总数
    const imageCount = await prisma.spotImage.count();
    console.log(`🖼️  图片总数: ${imageCount}`);

    // 3. 查询有图片的景点
    const spotsWithImages = await prisma.spot.findMany({
      where: {
        image: {
          isNot: null
        }
      },
      include: {
        image: true
      },
      take: 10
    });
    console.log(`\n✅ 有图片的景点数量: ${spotsWithImages.length}`);

    // 4. 显示景点图片详情
    console.log('\n=== 景点图片详情示例 ===');
    for (const spot of spotsWithImages.slice(0, 5)) {
      console.log(`\n景点: ${spot.name} (城市: ${spot.city})`);
      console.log(`  - openTime: ${spot.openTime || '❌ null'}`);
      if (spot.image) {
        console.log(`  - 图片URL: ${spot.image.url?.substring(0, 60)}...`);
        console.log(`  - 主图: ${spot.image.isPrimary ? '✅' : '❌'}, 状态: ${spot.image.status}, 来源: ${spot.image.source}`);
      }
    }

    // 5. 查询没有图片的景点
    const spotsWithoutImages = await prisma.spot.findMany({
      where: {
        image: null
      },
      take: 10
    });
    console.log(`\n\n❌ 无图片的景点数量示例: ${spotsWithoutImages.length}`);
    spotsWithoutImages.forEach(s => {
      console.log(`  - ${s.name} (${s.city}), openTime: ${s.openTime || 'null'}`);
    });

    // 6. 检查图片状态分布
    const statusStats = await prisma.spotImage.groupBy({
      by: ['status'],
      _count: true
    });
    console.log('\n\n=== 图片状态统计 ===');
    statusStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count} 张`);
    });

    // 7. 检查主图数量
    const primaryCount = await prisma.spotImage.count({
      where: { isPrimary: true }
    });
    console.log(`\n主图数量: ${primaryCount}`);

    // 8. 检查openTime为null的景点数量
    const nullOpenTimeCount = await prisma.spot.count({
      where: { openTime: null }
    });
    console.log(`\n⚠️  openTime为null的景点数量: ${nullOpenTimeCount}`);

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

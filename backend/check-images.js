const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 数据库图片情况检查 ===\n');

    // 1. 查询景点总数
    const spotCount = await prisma.spot.count();
    console.log(`📍 景点总数: ${spotCount}`);

    // 2. 查询图片总数
    const imageCount = await prisma.spotImage.count();
    console.log(`🖼️  图片总数: ${imageCount}`);

    // 3. 查询有图片的景点
    const spotsWithImages = await prisma.spot.findMany({
      where: {
        images: {
          some: {}
        }
      },
      include: {
        images: {
          where: {
            status: 'approved'
          }
        }
      },
      take: 10
    });
    console.log(`\n✅ 有图片的景点数量: ${spotsWithImages.length}`);

    // 4. 显示景点图片详情
    console.log('\n=== 景点图片详情示例 ===');
    for (const spot of spotsWithImages.slice(0, 5)) {
      console.log(`\n景点: ${spot.name} (城市: ${spot.city})`);
      console.log(`  - Spot.coverImage字段: ${spot.coverImage || '❌ 无'}`);
      console.log(`  - SpotImage记录数: ${spot.images.length}`);

      if (spot.images.length > 0) {
        spot.images.forEach((img, idx) => {
          console.log(`  [${idx + 1}] URL: ${img.url?.substring(0, 60)}...`);
          console.log(`      主图: ${img.isPrimary ? '✅' : '❌'}, 状态: ${img.status}, 来源: ${img.source}`);
        });
      }
    }

    // 5. 查询没有图片的景点
    const spotsWithoutImages = await prisma.spot.findMany({
      where: {
        images: {
          none: {}
        }
      },
      take: 5
    });
    console.log(`\n\n❌ 无图片的景点数量示例: ${spotsWithoutImages.length}`);
    spotsWithoutImages.forEach(s => {
      console.log(`  - ${s.name} (${s.city})`);
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

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

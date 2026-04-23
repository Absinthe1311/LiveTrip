const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 数据库精简脚本
 * 目标：
 * 1. 每个Spot只保留一张图片
 * 2. 删除Spot.coverImage字段
 * 3. 简化SpotImage表结构
 */

(async () => {
  try {
    console.log('=== 开始数据库精简操作 ===\n');

    // 步骤1: 处理有多张图片的景点（只保留第一张）
    console.log('步骤1: 处理有多张图片的景点...');

    const spotsWithMultipleImages = await prisma.$queryRaw`
      SELECT s.id, s.name, s.city, COUNT(si.id) as imageCount
      FROM Spot s
      LEFT JOIN SpotImage si ON s.id = si.spotId
      GROUP BY s.id
      HAVING imageCount > 1
    `;

    console.log(`找到 ${spotsWithMultipleImages.length} 个有多张图片的景点`);

    for (const spot of spotsWithMultipleImages) {
      // 获取该景点的所有图片
      const images = await prisma.spotImage.findMany({
        where: { spotId: spot.id },
        orderBy: [
          { isPrimary: 'desc' },  // 优先保留主图
          { priority: 'desc' },   // 其次按优先级
          { createdAt: 'asc' }    // 最后按创建时间
        ]
      });

      // 保留第一张，删除其他
      const keepImage = images[0];
      const deleteImages = images.slice(1);

      console.log(`  ${spot.name} (${spot.city}): 保留 ${keepImage.id}, 删除 ${deleteImages.length} 张`);

      // 删除多余的图片
      await prisma.spotImage.deleteMany({
        where: {
          id: { in: deleteImages.map(img => img.id) }
        }
      });
    }

    // 步骤2: 清空Spot.coverImage字段
    console.log('\n步骤2: 清空Spot.coverImage字段...');

    const updateResult = await prisma.spot.updateMany({
      where: {
        coverImage: { not: null }
      },
      data: {
        coverImage: null
      }
    });

    console.log(`已清空 ${updateResult.count} 个Spot的coverImage字段`);

    // 步骤3: 统一SpotImage字段值
    console.log('\n步骤3: 统一SpotImage字段值...');

    // 所有图片都设为approved
    await prisma.spotImage.updateMany({
      data: {
        status: 'approved',
        isPrimary: true,
        priority: 10
      }
    });

    console.log('已统一所有SpotImage的字段值');

    // 步骤4: 验证结果
    console.log('\n步骤4: 验证结果...');

    const finalSpotCount = await prisma.spot.count();
    const finalImageCount = await prisma.spotImage.count();
    const spotsWithImages = await prisma.spot.count({
      where: { images: { some: {} } }
    });
    const spotsWithoutImages = await prisma.spot.count({
      where: { images: { none: {} } }
    });

    console.log('\n=== 最终统计 ===');
    console.log(`景点总数: ${finalSpotCount}`);
    console.log(`图片总数: ${finalImageCount}`);
    console.log(`有图片的景点: ${spotsWithImages}`);
    console.log(`无图片的景点: ${spotsWithoutImages}`);
    console.log(`图片/景点比例: ${(finalImageCount / spotsWithImages * 100).toFixed(2)}%`);

    console.log('\n✅ 数据库精简完成！');
    console.log('\n下一步：修改Prisma Schema，删除不需要的字段');

  } catch (error) {
    console.error('❌ 精简操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

/**
 * 复制景点图片脚本
 * 
 * 目的：将"北京市"景点的图片复制到同名的"北京"景点
 * 
 * 不删除任何数据，只复制图片
 */

import { getPrismaClient } from './src/lib/prisma';

const prisma = getPrismaClient();

async function copySpotImages() {
  console.log('📸 开始复制景点图片...\n');

  try {
    // 1. 查询"北京市"的景点（有图片）
    const beijingShiSpots = await prisma.spot.findMany({
      where: { city: '北京市' },
      include: {
        images: {
          where: { status: 'approved' },
        },
      },
    });

    console.log(`📊 找到 ${beijingShiSpots.length} 个"北京市"景点`);

    // 2. 查询"北京"的景点（可能没有图片）
    const beijingSpots = await prisma.spot.findMany({
      where: { city: '北京' },
      include: {
        images: {
          where: { status: 'approved' },
        },
      },
    });

    console.log(`📊 找到 ${beijingSpots.length} 个"北京"景点\n`);

    // 3. 复制图片
    let copiedCount = 0;
    let skippedCount = 0;

    for (const beijingShiSpot of beijingShiSpots) {
      // 查找同名的"北京"景点
      const matchingBeijingSpot = beijingSpots.find(
        (spot) => spot.name === beijingShiSpot.name
      );

      if (!matchingBeijingSpot) {
        console.log(`   ⚠️  未找到同名景点: ${beijingShiSpot.name}`);
        continue;
      }

      // 检查"北京"景点是否已有图片
      if (matchingBeijingSpot.images.length > 0 || matchingBeijingSpot.coverImage) {
        console.log(`   ⏭️  跳过已有图片: ${matchingBeijingSpot.name}`);
        skippedCount++;
        continue;
      }

      // 复制 coverImage
      if (beijingShiSpot.coverImage) {
        await prisma.spot.update({
          where: { id: matchingBeijingSpot.id },
          data: { coverImage: beijingShiSpot.coverImage },
        });
        console.log(`   ✅ 复制 coverImage: ${matchingBeijingSpot.name}`);
      }

      // 复制 images
      if (beijingShiSpot.images.length > 0) {
        for (const image of beijingShiSpot.images) {
          await prisma.spotImage.create({
            data: {
              spotId: matchingBeijingSpot.id,
              url: image.url,
              source: image.source,
              status: image.status,
              priority: image.priority,
              isPrimary: image.isPrimary,
              fileHash: image.fileHash,
              uploadedBy: image.uploadedBy,
            },
          });
        }
        console.log(`   ✅ 复制 ${beijingShiSpot.images.length} 张图片: ${matchingBeijingSpot.name}`);
      }

      copiedCount++;
    }

    console.log(`\n📊 复制完成：`);
    console.log(`   ✅ 成功复制: ${copiedCount} 个景点`);
    console.log(`   ⏭️  跳过已有: ${skippedCount} 个景点\n`);

    // 4. 验证结果
    const beijingSpotsWithImages = await prisma.spot.count({
      where: {
        city: '北京',
        OR: [
          { coverImage: { not: null } },
          { images: { some: { status: 'approved' } } },
        ],
      },
    });

    console.log(`📊 验证结果：`);
    console.log(`   "北京"景点有图片数量: ${beijingSpotsWithImages}\n`);

    console.log('✅ 脚本执行完成！');
  } catch (error) {
    console.error('❌ 复制失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行复制
copySpotImages();

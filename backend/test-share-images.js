// 测试脚本：检查分享行程的图片数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testShareData() {
  try {
    // 1. 查找有分享token的行程
    const sharedTrip = await prisma.trip.findFirst({
      where: {
        isPublic: true,
        shareToken: { not: null }
      },
      include: {
        days: {
          include: {
            itineraryItems: true
          }
        }
      }
    });

    if (!sharedTrip) {
      console.log('❌ 没有找到分享的行程');
      return;
    }

    console.log('✅ 找到分享行程:', sharedTrip.title);
    console.log('分享Token:', sharedTrip.shareToken);

    // 2. 检查行程中的景点
    console.log('\n📋 行程中的景点:');
    for (const day of sharedTrip.days) {
      console.log(`\n第${day.dayNumber}天:`);
      for (const item of day.itineraryItems) {
        console.log(`  - ${item.name}`);
        console.log(`    spotId: ${item.spotId || '无'}`);

        // 3. 如果有spotId，检查景点图片
        if (item.spotId) {
          const spot = await prisma.spot.findUnique({
            where: { id: item.spotId },
            include: {
              images: {
                where: { status: 'approved' },
                take: 1,
                orderBy: { priority: 'desc' }
              }
            }
          });

          if (spot) {
            console.log(`    景点封面图: ${spot.coverImage || '无'}`);
            console.log(`    景点图片数量: ${spot.images.length}`);
            if (spot.images.length > 0) {
              console.log(`    图片URL: ${spot.images[0].url}`);
            }
          } else {
            console.log(`    ⚠️ 景点不存在 (spotId: ${item.spotId})`);
          }
        }
      }
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShareData();

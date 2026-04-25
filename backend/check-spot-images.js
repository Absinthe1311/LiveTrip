const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpotImages() {
  try {
    // 查询前10个景点
    const spots = await prisma.spot.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        image: true,
        city: true,
      },
    });

    console.log('📊 景点图片检查：\n');
    
    for (const spot of spots) {
      console.log(`景点: ${spot.name}`);
      console.log(`  城市: ${spot.city}`);
      console.log(`  图片对象:`, spot.image);
      if (spot.image && spot.image.url) {
        console.log(`  图片URL: ${spot.image.url}`);
      }
      console.log('');
    }

    // 统计有图片的景点数量
    const withImage = await prisma.spot.count({
      where: {
        image: { not: null },
      },
    });

    const total = await prisma.spot.count();

    console.log(`\n统计：`);
    console.log(`  总景点数: ${total}`);
    console.log(`  有图片的景点: ${withImage}`);
    console.log(`  无图片的景点: ${total - withImage}`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpotImages();

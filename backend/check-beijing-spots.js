const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBeijingSpots() {
  try {
    // 查询北京的景点
    const spots = await prisma.spot.findMany({
      where: {
        city: '北京',
      },
      include: {
        image: true,
      },
      take: 20,
    });

    console.log('📊 北京景点图片检查：\n');
    console.log(`总景点数: ${spots.length}\n`);
    
    let withImage = 0;
    let withoutImage = 0;
    
    for (const spot of spots) {
      if (spot.image) {
        withImage++;
        console.log(`✅ ${spot.name}: 有图片`);
        console.log(`   图片URL: ${spot.image.url.substring(0, 60)}...`);
      } else {
        withoutImage++;
        console.log(`❌ ${spot.name}: 无图片`);
      }
    }

    console.log(`\n统计：`);
    console.log(`  有图片: ${withImage}`);
    console.log(`  无图片: ${withoutImage}`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBeijingSpots();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 查询数据库 ===');

    // 查询Spot表
    const spots = await prisma.spot.findMany();
    console.log('\nSpot表记录数:', spots.length);
    
    if (spots.length > 0) {
      console.log('所有景点:');
      spots.forEach(spot => {
        console.log(`  - ${spot.name} | 城市: ${spot.city} | ID: ${spot.id} | amapId: ${spot.amapId}`);
      });
    }

    // 查询SpotIoTData表
    const iotData = await prisma.spotIoTData.findMany();
    console.log('\nSpotIoTData表记录数:', iotData.length);

    // 按城市统计
    const cityStats = await prisma.spot.groupBy({
      by: ['city'],
      _count: { city: true }
    });
    console.log('\n按城市统计:');
    cityStats.forEach(stat => {
      console.log(`  - ${stat.city}: ${stat._count.city} 个景点`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();

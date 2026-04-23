// AI辅助生成：GLM-5, 2026-04-23 16:20
// 描述：数据库分析脚本 - 分析需要清理的数据

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDatabase() {
  console.log('=== 数据库分析报告 ===\n');

  try {
    // 1. 分析无效city字段
    console.log('1. 无效city字段分析:');
    const invalidCities = ['111111', '？？', '测试图片上传功能'];
    for (const invalidCity of invalidCities) {
      const count = await prisma.spot.count({
        where: { city: invalidCity }
      });
      console.log(`   - city="${invalidCity}": ${count}条`);
    }

    // 2. 分析avgRating和reviewCount使用情况
    console.log('\n2. avgRating和reviewCount字段分析:');
    const avgRatingCount = await prisma.spot.count({
      where: { avgRating: { not: null } }
    });
    const reviewCountSum = await prisma.spot.aggregate({
      _sum: { reviewCount: true }
    });
    console.log(`   - 有avgRating值的景点: ${avgRatingCount}条`);
    console.log(`   - reviewCount总和: ${reviewCountSum._sum.reviewCount || 0}`);

    // 3. 分析openTime为null的情况
    console.log('\n3. openTime字段分析:');
    const nullOpenTimeCount = await prisma.spot.count({
      where: { openTime: null }
    });
    const totalSpots = await prisma.spot.count();
    console.log(`   - openTime为null: ${nullOpenTimeCount}条`);
    console.log(`   - 总景点数: ${totalSpots}`);

    // 4. 分析ticketPrice为null的情况
    console.log('\n4. ticketPrice字段分析:');
    const nullTicketPriceCount = await prisma.spot.count({
      where: { ticketPrice: null }
    });
    console.log(`   - ticketPrice为null: ${nullTicketPriceCount}条`);

    // 5. 分析rating为null的情况
    console.log('\n5. rating字段分析:');
    const nullRatingCount = await prisma.spot.count({
      where: { rating: null }
    });
    console.log(`   - rating为null: ${nullRatingCount}条`);

    // 6. 显示一些示例数据
    console.log('\n6. 示例数据:');
    const sampleSpots = await prisma.spot.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        openTime: true,
        ticketPrice: true,
        rating: true,
        avgRating: true,
        reviewCount: true
      }
    });
    console.log('   前5条景点数据:');
    sampleSpots.forEach((spot, index) => {
      console.log(`   ${index + 1}. ${spot.name}`);
      console.log(`      - city: ${spot.city}`);
      console.log(`      - openTime: ${spot.openTime || 'NULL'}`);
      console.log(`      - ticketPrice: ${spot.ticketPrice ?? 'NULL'}`);
      console.log(`      - rating: ${spot.rating ?? 'NULL'}`);
      console.log(`      - avgRating: ${spot.avgRating ?? 'NULL'}`);
      console.log(`      - reviewCount: ${spot.reviewCount}`);
    });

    console.log('\n=== 分析完成 ===');

  } catch (error) {
    console.error('分析过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

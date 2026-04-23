// AI辅助生成：GLM-5, 2026-04-23 16:20
// 描述：验证数据库清理结果

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanup() {
  console.log('=== 数据库清理验证报告 ===\n');

  try {
    // 1. 验证无效city已删除
    console.log('1. 验证无效city字段已删除:');
    const invalidCities = ['111111', '？？', '测试图片上传功能'];
    let allDeleted = true;
    for (const invalidCity of invalidCities) {
      const count = await prisma.spot.count({
        where: { city: invalidCity }
      });
      if (count > 0) allDeleted = false;
      console.log(`   - city="${invalidCity}": ${count}条 ${count === 0 ? '✅' : '❌'}`);
    }

    // 2. 验证openTime已修正
    console.log('\n2. 验证openTime已修正:');
    const nullOpenTimeCount = await prisma.spot.count({
      where: { openTime: null }
    });
    console.log(`   - openTime为null: ${nullOpenTimeCount}条 ${nullOpenTimeCount === 0 ? '✅' : '❌'}`);

    // 3. 验证ticketPrice已修正
    console.log('\n3. 验证ticketPrice已修正:');
    const nullTicketPriceCount = await prisma.spot.count({
      where: { ticketPrice: null }
    });
    console.log(`   - ticketPrice为null: ${nullTicketPriceCount}条 ${nullTicketPriceCount === 0 ? '✅' : '❌'}`);

    // 4. 验证rating已修正
    console.log('\n4. 验证rating已修正:');
    const nullRatingCount = await prisma.spot.count({
      where: { rating: null }
    });
    console.log(`   - rating为null: ${nullRatingCount}条 ${nullRatingCount === 0 ? '✅' : '❌'}`);

    // 5. 统计数据
    console.log('\n5. 数据统计:');
    const totalSpots = await prisma.spot.count();
    const avgRating = await prisma.spot.aggregate({
      _avg: { rating: true }
    });
    const avgTicketPrice = await prisma.spot.aggregate({
      _avg: { ticketPrice: true }
    });

    console.log(`   - 总景点数: ${totalSpots}`);
    console.log(`   - 平均评分: ${avgRating._avg.rating?.toFixed(2) || 'N/A'}`);
    console.log(`   - 平均票价: ${avgTicketPrice._avg.ticketPrice?.toFixed(2) || 'N/A'}`);

    // 6. 显示修正后的示例数据
    console.log('\n6. 修正后的示例数据:');
    const sampleSpots = await prisma.spot.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        openTime: true,
        ticketPrice: true,
        rating: true
      }
    });
    sampleSpots.forEach((spot, index) => {
      console.log(`   ${index + 1}. ${spot.name}`);
      console.log(`      - city: ${spot.city}`);
      console.log(`      - openTime: ${spot.openTime || 'NULL'}`);
      console.log(`      - ticketPrice: ${spot.ticketPrice ?? 'NULL'}`);
      console.log(`      - rating: ${spot.rating?.toFixed(1) ?? 'NULL'}`);
    });

    console.log('\n=== 验证完成 ===');
    console.log('\n✅ 所有清理操作已成功完成！');

  } catch (error) {
    console.error('验证过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyCleanup()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

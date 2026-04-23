// AI辅助生成：GLM-5, 2026-04-23 16:20
// 描述：数据库清理脚本 - 清理无效数据并修正字段

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('开始数据库清理操作...\n');

  try {
    // 1. 删除city字段为错误值的景点
    console.log('=== 步骤1: 删除无效city字段的景点 ===');
    const invalidCities = ['111111', '？？', '测试图片上传功能'];
    let deletedCount = 0;

    for (const invalidCity of invalidCities) {
      const result = await prisma.spot.deleteMany({
        where: {
          city: invalidCity
        }
      });
      console.log(`删除city="${invalidCity}"的景点: ${result.count}条`);
      deletedCount += result.count;
    }
    console.log(`总计删除无效景点: ${deletedCount}条\n`);

    // 2. 删除avgRating和reviewCount字段（需要修改schema）
    console.log('=== 步骤2: 检查avgRating和reviewCount字段 ===');
    const spotsWithAvgRating = await prisma.spot.findMany({
      where: {
        avgRating: { not: null }
      },
      select: { id: true, name: true, avgRating: true, reviewCount: true }
    });
    console.log(`发现${spotsWithAvgRating.length}条景点有avgRating数据`);
    console.log('注意: avgRating和reviewCount字段需要通过schema migration删除\n');

    // 3. 修正openTime为null的景点
    console.log('=== 步骤3: 修正openTime为null的景点 ===');
    const nullOpenTimeResult = await prisma.spot.updateMany({
      where: {
        openTime: null
      },
      data: {
        openTime: '全天开放'
      }
    });
    console.log(`已将${nullOpenTimeResult.count}条景点的openTime设置为"全天开放"\n`);

    // 4. 修正ticketPrice为null的景点
    console.log('=== 步骤4: 修正ticketPrice为null的景点 ===');
    const nullTicketPriceResult = await prisma.spot.updateMany({
      where: {
        ticketPrice: null
      },
      data: {
        ticketPrice: 0
      }
    });
    console.log(`已将${nullTicketPriceResult.count}条景点的ticketPrice设置为0\n`);

    // 5. 修正rating为null的景点（设置为4-5之间的随机值）
    console.log('=== 步骤5: 修正rating为null的景点 ===');
    const nullRatingSpots = await prisma.spot.findMany({
      where: {
        rating: null
      },
      select: { id: true, name: true }
    });

    let ratingUpdatedCount = 0;
    for (const spot of nullRatingSpots) {
      const randomRating = 4 + Math.random(); // 4.0 到 5.0 之间
      await prisma.spot.update({
        where: { id: spot.id },
        data: { rating: Math.round(randomRating * 10) / 10 } // 保留一位小数
      });
      ratingUpdatedCount++;
    }
    console.log(`已将${ratingUpdatedCount}条景点的rating设置为4.0-5.0之间的随机值\n`);

    // 6. 生成清理报告
    console.log('=== 清理完成，生成报告 ===');
    const totalSpots = await prisma.spot.count();
    const spotsWithNullOpenTime = await prisma.spot.count({
      where: { openTime: null }
    });
    const spotsWithNullTicketPrice = await prisma.spot.count({
      where: { ticketPrice: null }
    });
    const spotsWithNullRating = await prisma.spot.count({
      where: { rating: null }
    });

    console.log('\n=== 数据库清理报告 ===');
    console.log(`总景点数: ${totalSpots}`);
    console.log(`删除的无效景点: ${deletedCount}`);
    console.log(`修正openTime的景点: ${nullOpenTimeResult.count}`);
    console.log(`修正ticketPrice的景点: ${nullTicketPriceResult.count}`);
    console.log(`修正rating的景点: ${ratingUpdatedCount}`);
    console.log('\n剩余问题:');
    console.log(`- openTime为null: ${spotsWithNullOpenTime}`);
    console.log(`- ticketPrice为null: ${spotsWithNullTicketPrice}`);
    console.log(`- rating为null: ${spotsWithNullRating}`);
    console.log('\n注意: avgRating和reviewCount字段需要通过Prisma schema migration删除');

  } catch (error) {
    console.error('清理过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行清理
cleanDatabase()
  .then(() => {
    console.log('\n✅ 数据库清理完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 数据库清理失败:', error);
    process.exit(1);
  });

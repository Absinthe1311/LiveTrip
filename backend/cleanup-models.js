const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 数据库清理和精简脚本
 * 执行用户要求的数据库修改操作
 */

(async () => {
  try {
    console.log('\n========================================');
    console.log('    数据库清理和精简操作');
    console.log('========================================\n');

    // ========== 步骤1: 清空Restaurant和Hotel数据 ==========
    console.log('📝 步骤1: 清空Restaurant和Hotel数据\n');

    const restaurantCount = await prisma.restaurant.count();
    const hotelCount = await prisma.hotel.count();

    console.log(`  Restaurant记录数: ${restaurantCount}`);
    console.log(`  Hotel记录数: ${hotelCount}`);

    if (restaurantCount > 0) {
      await prisma.restaurant.deleteMany({});
      console.log('  ✅ 已清空Restaurant表');
    }

    if (hotelCount > 0) {
      await prisma.hotel.deleteMany({});
      console.log('  ✅ 已清空Hotel表');
    }

    // ========== 步骤2: 检查需要删除的表的数据量 ==========
    console.log('\n📝 步骤2: 检查待删除表的数据量\n');

    const tablesToCheck = [
      'BlogCommentLike',
      'EnvironmentSensorLog',
      'Review',
      'ReviewImage',
      'ReviewLike',
      'UserPreferences'
    ];

    for (const table of tablesToCheck) {
      try {
        const count = await prisma[table].count();
        console.log(`  ${table}: ${count} 条记录`);
      } catch (e) {
        console.log(`  ${table}: 表不存在或查询失败`);
      }
    }

    // ========== 步骤3: 删除关联数据 ==========
    console.log('\n📝 步骤3: 删除关联数据\n');

    // 删除ReviewImage（依赖Review）
    try {
      const reviewImageCount = await prisma.reviewImage.count();
      if (reviewImageCount > 0) {
        await prisma.reviewImage.deleteMany({});
        console.log(`  ✅ 已删除 ${reviewImageCount} 条ReviewImage记录`);
      }
    } catch (e) {
      console.log('  ⚠️  ReviewImage表不存在');
    }

    // 删除ReviewLike（依赖Review）
    try {
      const reviewLikeCount = await prisma.reviewLike.count();
      if (reviewLikeCount > 0) {
        await prisma.reviewLike.deleteMany({});
        console.log(`  ✅ 已删除 ${reviewLikeCount} 条ReviewLike记录`);
      }
    } catch (e) {
      console.log('  ⚠️  ReviewLike表不存在');
    }

    // 删除Review
    try {
      const reviewCount = await prisma.review.count();
      if (reviewCount > 0) {
        await prisma.review.deleteMany({});
        console.log(`  ✅ 已删除 ${reviewCount} 条Review记录`);
      }
    } catch (e) {
      console.log('  ⚠️  Review表不存在');
    }

    // 删除BlogCommentLike
    try {
      const blogCommentLikeCount = await prisma.blogCommentLike.count();
      if (blogCommentLikeCount > 0) {
        await prisma.blogCommentLike.deleteMany({});
        console.log(`  ✅ 已删除 ${blogCommentLikeCount} 条BlogCommentLike记录`);
      }
    } catch (e) {
      console.log('  ⚠️  BlogCommentLike表不存在');
    }

    // 删除EnvironmentSensorLog
    try {
      const sensorLogCount = await prisma.environmentSensorLog.count();
      if (sensorLogCount > 0) {
        await prisma.environmentSensorLog.deleteMany({});
        console.log(`  ✅ 已删除 ${sensorLogCount} 条EnvironmentSensorLog记录`);
      }
    } catch (e) {
      console.log('  ⚠️  EnvironmentSensorLog表不存在');
    }

    // 删除UserPreferences
    try {
      const userPrefCount = await prisma.userPreferences.count();
      if (userPrefCount > 0) {
        await prisma.userPreferences.deleteMany({});
        console.log(`  ✅ 已删除 ${userPrefCount} 条UserPreferences记录`);
      }
    } catch (e) {
      console.log('  ⚠️  UserPreferences表不存在');
    }

    // ========== 步骤4: 验证结果 ==========
    console.log('\n📝 步骤4: 验证清理结果\n');

    const finalStats = {
      Restaurant: await prisma.restaurant.count(),
      Hotel: await prisma.hotel.count(),
      BlogCommentLike: await prisma.blogCommentLike.count(),
      EnvironmentSensorLog: await prisma.environmentSensorLog.count(),
      Review: await prisma.review.count(),
      ReviewImage: await prisma.reviewImage.count(),
      ReviewLike: await prisma.reviewLike.count(),
      UserPreferences: await prisma.userPreferences.count(),
    };

    console.table(finalStats);

    console.log('\n✅ 数据清理完成！');
    console.log('\n下一步：修改Prisma Schema，删除不需要的Model定义');

  } catch (error) {
    console.error('\n❌ 操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

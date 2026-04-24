import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 修复openTime为null的景点 ===\n');

    // 1. 查询openTime为null的景点数量
    const nullCount = await prisma.spot.count({
      where: { openTime: null }
    });
    console.log(`📊 openTime为null的景点数量: ${nullCount}`);

    if (nullCount === 0) {
      console.log('✅ 没有需要修复的数据');
      return;
    }

    // 2. 执行批量更新
    console.log('\n🔄 开始更新...');
    const result = await prisma.spot.updateMany({
      where: { openTime: null },
      data: { openTime: '全天开放' }
    });

    console.log(`✅ 成功更新 ${result.count} 条记录`);

    // 3. 验证结果
    const remainingNull = await prisma.spot.count({
      where: { openTime: null }
    });
    console.log(`\n📊 验证结果: 剩余openTime为null的景点: ${remainingNull}`);

    if (remainingNull === 0) {
      console.log('🎉 所有openTime已修复完成！');
    } else {
      console.log('⚠️  仍有部分记录未修复，请检查');
    }

  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

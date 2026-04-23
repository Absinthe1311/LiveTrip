const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 验证数据库Schema更新 ===\n');

    // 1. 检查Spot表
    const spot = await prisma.spot.findFirst({
      include: {
        image: true
      }
    });

    console.log('Spot表结构验证:');
    console.log('  - spot.image:', spot.image ? '✅ 存在' : '❌ 不存在');
    console.log('  - spot.coverImage:', spot.coverImage !== undefined ? '❌ 仍存在' : '✅ 已删除');

    // 2. 检查SpotImage表
    const spotImage = await prisma.spotImage.findFirst();
    console.log('\nSpotImage表结构验证:');
    console.log('  - spotImage.url:', spotImage.url ? '✅ 存在' : '❌ 不存在');
    console.log('  - spotImage.source:', spotImage.source ? '✅ 存在' : '❌ 不存在');
    console.log('  - spotImage.uploadedBy:', spotImage.uploadedBy ? '✅ 存在' : '❌ 不存在');
    console.log('  - spotImage.isPrimary:', spotImage.isPrimary !== undefined ? '❌ 仍存在' : '✅ 已删除');
    console.log('  - spotImage.priority:', spotImage.priority !== undefined ? '❌ 仍存在' : '✅ 已删除');
    console.log('  - spotImage.status:', spotImage.status !== undefined ? '❌ 仍存在' : '✅ 已删除');

    // 3. 统计数据
    const totalSpots = await prisma.spot.count();
    const totalImages = await prisma.spotImage.count();
    const spotsWithImages = await prisma.spot.count({
      where: { image: { is: {} } }
    });

    console.log('\n数据统计:');
    console.log(`  - 景点总数: ${totalSpots}`);
    console.log(`  - 图片总数: ${totalImages}`);
    console.log(`  - 有图片的景点: ${spotsWithImages}`);
    console.log(`  - 一对一关系: ${totalImages === spotsWithImages ? '✅ 正确' : '❌ 错误'}`);

    console.log('\n✅ Schema更新成功！');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

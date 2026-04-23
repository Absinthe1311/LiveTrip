const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 数据库结构分析 ===\n');

    // 1. 检查Spot表的coverImage使用情况
    const spotsWithCoverImage = await prisma.spot.count({
      where: { coverImage: { not: null } }
    });
    console.log(`Spot.coverImage有值的记录: ${spotsWithCoverImage}`);

    // 2. 检查SpotImage表的使用情况
    const totalSpotImages = await prisma.spotImage.count();
    console.log(`SpotImage总记录数: ${totalSpotImages}`);

    // 3. 检查一个景点有多张图片的情况
    const spotsWithMultipleImages = await prisma.$queryRaw`
      SELECT s.name, s.city, COUNT(si.id) as imageCount
      FROM Spot s
      LEFT JOIN SpotImage si ON s.id = si.spotId
      GROUP BY s.id
      HAVING imageCount > 1
      LIMIT 10
    `;
    console.log(`\n有多张图片的景点数量: ${spotsWithMultipleImages.length}`);
    spotsWithMultipleImages.forEach(s => {
      console.log(`  - ${s.name} (${s.city}): ${s.imageCount}张图片`);
    });

    // 4. 检查isPrimary字段的使用情况
    const primaryImages = await prisma.spotImage.count({
      where: { isPrimary: true }
    });
    console.log(`\nisPrimary=true的图片数: ${primaryImages}`);

    // 5. 检查status字段的分布
    const statusDistribution = await prisma.spotImage.groupBy({
      by: ['status'],
      _count: true
    });
    console.log('\nstatus字段分布:');
    statusDistribution.forEach(s => {
      console.log(`  ${s.status}: ${s._count}`);
    });

    // 6. 检查priority字段的使用情况
    const priorityDistribution = await prisma.spotImage.groupBy({
      by: ['priority'],
      _count: true
    });
    console.log('\npriority字段分布:');
    priorityDistribution.forEach(p => {
      console.log(`  ${p.priority}: ${p._count}`);
    });

    // 7. 检查source字段的使用情况
    const sourceDistribution = await prisma.spotImage.groupBy({
      by: ['source'],
      _count: true
    });
    console.log('\nsource字段分布:');
    sourceDistribution.forEach(s => {
      console.log(`  ${s.source}: ${s._count}`);
    });

    console.log('\n=== 精简建议 ===');
    console.log('1. 删除Spot.coverImage字段（已废弃）');
    console.log('2. 删除SpotImage.isPrimary字段（每个景点只有一张图片）');
    console.log('3. 删除SpotImage.priority字段（不需要优先级）');
    console.log('4. 删除SpotImage.status字段（都是approved）');
    console.log('5. 保留SpotImage.url字段（Cloudinary URL）');
    console.log('6. 保留SpotImage.source字段（记录图片来源）');

  } catch (error) {
    console.error('分析出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

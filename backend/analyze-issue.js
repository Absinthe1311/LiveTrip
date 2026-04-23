const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 问题分析 ===\n');

    // 1. 检查Spot表的coverImage字段情况
    const spotsWithCoverImage = await prisma.spot.count({
      where: {
        coverImage: { not: null }
      }
    });
    console.log(`✅ Spot.coverImage有值的景点: ${spotsWithCoverImage}`);

    // 2. 检查SpotImage表的情况
    const spotsWithSpotImage = await prisma.spot.count({
      where: {
        images: { some: {} }
      }
    });
    console.log(`✅ 有SpotImage记录的景点: ${spotsWithSpotImage}`);

    // 3. 找出有coverImage但没有SpotImage的景点
    const inconsistentSpots = await prisma.spot.findMany({
      where: {
        coverImage: { not: null },
        images: { none: {} }
      },
      take: 10
    });
    console.log(`\n⚠️  有coverImage但无SpotImage的景点: ${inconsistentSpots.length}`);
    inconsistentSpots.forEach(s => {
      console.log(`  - ${s.name} (${s.city})`);
      console.log(`    coverImage: ${s.coverImage}`);
    });

    // 4. 找出有SpotImage但coverImage为空的景点
    const reverseInconsistent = await prisma.spot.findMany({
      where: {
        coverImage: null,
        images: { some: {} }
      },
      take: 5,
      include: {
        images: {
          where: { isPrimary: true }
        }
      }
    });
    console.log(`\n⚠️  有SpotImage但coverImage为空的景点: ${reverseInconsistent.length}`);
    reverseInconsistent.forEach(s => {
      console.log(`  - ${s.name} (${s.city})`);
      if (s.images.length > 0) {
        console.log(`    主图URL: ${s.images[0].url?.substring(0, 60)}...`);
      }
    });

    // 5. 检查重复景点名称
    const duplicateNames = await prisma.$queryRaw`
      SELECT name, city, COUNT(*) as count
      FROM Spot
      GROUP BY name, city
      HAVING count > 1
      LIMIT 10
    `;
    console.log(`\n⚠️  重复的景点名称 (同名同城市): ${duplicateNames.length}`);
    duplicateNames.forEach(d => {
      console.log(`  - ${d.name} (${d.city}): ${d.count}条记录`);
    });

    // 6. 总结
    console.log('\n=== 问题总结 ===');
    console.log('1. Spot表有coverImage字段（本地路径），但前端使用SpotImage表的URL');
    console.log('2. 部分景点有coverImage但没有SpotImage记录 → 图片无法显示');
    console.log('3. 存在重复的景点记录（同名同城市）→ 查询可能返回错误记录');

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

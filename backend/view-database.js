const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('\n========================================');
    console.log('    LiveTrip 数据库信息查看工具');
    console.log('========================================\n');

    // 1. 数据库概览
    console.log('📊 【数据库概览】\n');
    const tables = {
      'User': await prisma.user.count(),
      'Spot': await prisma.spot.count(),
      'SpotImage': await prisma.spotImage.count(),
      'Trip': await prisma.trip.count(),
      'BlogPost': await prisma.blogPost.count(),
      'Favorite': await prisma.favorite.count(),
      'Hotel': await prisma.hotel.count(),
      'Restaurant': await prisma.restaurant.count(),
    };

    console.table(tables);

    // 2. 景点图片统计
    console.log('\n📍 【景点图片统计】\n');
    const spotsWithImage = await prisma.spot.count({
      where: { image: { is: {} } }
    });
    const spotsWithoutImage = await prisma.spot.count({
      where: { image: null }
    });

    console.log(`总景点数: ${tables.Spot}`);
    console.log(`✅ 有图片: ${spotsWithImage} (${(spotsWithImage/tables.Spot*100).toFixed(1)}%)`);
    console.log(`❌ 无图片: ${spotsWithoutImage} (${(spotsWithoutImage/tables.Spot*100).toFixed(1)}%)`);

    // 3. 按城市统计景点
    console.log('\n🏙️  【按城市统计景点】\n');
    const spotsByCity = await prisma.spot.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    console.table(
      spotsByCity.map(item => ({
        城市: item.city,
        景点数: item._count.id
      }))
    );

    // 4. 图片来源统计
    console.log('\n🖼️  【图片来源统计】\n');
    const imageSources = await prisma.spotImage.groupBy({
      by: ['source'],
      _count: { id: true }
    });

    console.table(
      imageSources.map(item => ({
        来源: item.source,
        数量: item._count.id
      }))
    );

    // 5. 最近添加的景点（带图片）
    console.log('\n🆕 【最近添加的景点（前10个）】\n');
    const recentSpots = await prisma.spot.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        image: {
          select: { url: true, source: true }
        }
      }
    });

    console.table(
      recentSpots.map(spot => ({
        名称: spot.name.substring(0, 15),
        城市: spot.city,
        有图片: spot.image ? '✅' : '❌',
        创建时间: spot.createdAt.toLocaleDateString()
      }))
    );

    // 6. 示例图片URL
    console.log('\n🔗 【示例图片URL（前5个）】\n');
    const sampleImages = await prisma.spotImage.findMany({
      take: 5,
      include: {
        spot: {
          select: { name: true, city: true }
        }
      }
    });

    sampleImages.forEach((img, idx) => {
      console.log(`[${idx + 1}] ${img.spot.name} (${img.spot.city})`);
      console.log(`    URL: ${img.url.substring(0, 80)}...`);
      console.log(`    来源: ${img.source}\n`);
    });

    // 7. 用户统计
    console.log('👥 【用户统计】\n');
    const userRoles = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    console.table(
      userRoles.map(item => ({
        角色: item.role,
        数量: item._count.id
      }))
    );

    console.log('\n========================================');
    console.log('    查看完成！');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStats() {
  try {
    // 总景点数
    const totalSpots = await prisma.spot.count();
    console.log('📊 数据库景点统计');
    console.log('='.repeat(50));
    console.log(`总景点数: ${totalSpots}`);

    // 有图片的景点数
    const spotsWithImages = await prisma.spotImage.count({
      where: { status: 'approved' },
      distinct: ['spotId']
    });
    console.log(`有图片的景点数: ${spotsWithImages}`);

    // 无图片的景点数
    const spotsWithoutImages = totalSpots - spotsWithImages;
    console.log(`无图片的景点数: ${spotsWithoutImages}`);

    // 总图片数
    const totalImages = await prisma.spotImage.count({
      where: { status: 'approved' }
    });
    console.log(`总图片数: ${totalImages}`);

    // 按城市统计
    console.log('\n📍 按城市统计');
    console.log('='.repeat(50));
    const cities: any[] = await prisma.$queryRaw`
      SELECT city, COUNT(*) as count
      FROM Spot
      GROUP BY city
      ORDER BY count DESC
    `;

    cities.forEach((city: any) => {
      console.log(`${city.city}: ${city.count}个景点`);
    });

    // 图片来源统计
    console.log('\n🖼️  图片来源统计');
    console.log('='.repeat(50));
    const sources: any[] = await prisma.$queryRaw`
      SELECT source, COUNT(*) as count
      FROM SpotImage
      WHERE status = 'approved'
      GROUP BY source
    `;

    sources.forEach((source: any) => {
      console.log(`${source.source}: ${source.count}张图片`);
    });

    // 无图片的景点列表
    console.log('\n⚠️  无图片的景点列表');
    console.log('='.repeat(50));
    const spotsWithoutImageList = await prisma.spot.findMany({
      where: {
        id: {
          notIn: (await prisma.spotImage.findMany({
            where: { status: 'approved' },
            select: { spotId: true }
          })).map(img => img.spotId)
        }
      },
      select: {
        name: true,
        city: true,
        rating: true
      },
      orderBy: [
        { city: 'asc' },
        { rating: 'desc' }
      ]
    });

    spotsWithoutImageList.forEach((spot: any) => {
      console.log(`${spot.city} - ${spot.name} (评分: ${spot.rating || '无'})`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStats();

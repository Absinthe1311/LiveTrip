// 检查热门景点数据
import { getPrismaClient } from '../src/lib/prisma';

const prisma = getPrismaClient();

async function main() {
  // 查询所有热门景点
  const spots = await prisma.spot.findMany({
    where: {
      isHot: true,
    },
    select: {
      id: true,
      city: true,
      name: true,
      isHot: true,
      coverImage: true,
      images: {
        select: {
          id: true,
          url: true,
          status: true,
        },
      },
    },
    orderBy: {
      city: 'asc',
    },
  });

  console.log(`\n总共有 ${spots.length} 个热门景点\n`);

  // 按城市分组统计
  const cityGroups: Record<string, any[]> = {};
  spots.forEach((spot) => {
    if (!cityGroups[spot.city]) {
      cityGroups[spot.city] = [];
    }
    cityGroups[spot.city].push({
      name: spot.name,
      hasCoverImage: !!spot.coverImage,
      hasImages: spot.images.length > 0,
      imageCount: spot.images.length,
    });
  });

  // 输出统计信息
  Object.entries(cityGroups).forEach(([city, citySpots]) => {
    const withImages = citySpots.filter(
      (s) => s.hasCoverImage || s.hasImages
    ).length;
    const withoutImages = citySpots.length - withImages;
    console.log(`${city}: ${citySpots.length} 个景点`);
    console.log(`  - 有图片: ${withImages}`);
    console.log(`  - 无图片: ${withoutImages}`);
    if (withoutImages > 0) {
      const noImageSpots = citySpots.filter(
        (s) => !s.hasCoverImage && !s.hasImages
      );
      console.log(`  - 无图片景点: ${noImageSpots.map((s) => s.name).join(', ')}`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

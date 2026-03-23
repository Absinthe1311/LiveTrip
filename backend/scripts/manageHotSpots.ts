// 管理热门景点脚本 - 查看和更新热门景点
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function manageHotSpots() {
  try {
    console.log('🔍 查看当前热门景点...\n');

    // 查看当前所有热门景点
    const currentHotSpots = await prisma.spot.findMany({
      where: { isHot: true },
      select: {
        id: true,
        name: true,
        city: true,
        category: true,
        rating: true,
      },
      orderBy: { city: 'asc' },
    });

    console.log(`当前共有 ${currentHotSpots.length} 个热门景点:\n`);

    // 按城市分组统计
    const cityGroups: Record<string, typeof currentHotSpots> = {};
    currentHotSpots.forEach(spot => {
      if (!cityGroups[spot.city]) {
        cityGroups[spot.city] = [];
      }
      cityGroups[spot.city].push(spot);
    });

    // 显示每个城市的热门景点数量
    Object.entries(cityGroups).forEach(([city, spots]) => {
      console.log(`📍 ${city}: ${spots.length} 个景点`);
      spots.forEach(spot => {
        console.log(`   - ${spot.name} (${spot.category || '未知'}) - 评分: ${spot.rating}`);
      });
      console.log('');
    });

    // 查看所有城市及其景点总数
    console.log('\n📊 所有城市景点统计:\n');
    const allCities = await prisma.spot.groupBy({
      by: ['city'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    allCities.forEach(({ city, _count }) => {
      console.log(`${city}: ${_count.id} 个景点`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 查询失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行脚本
manageHotSpots();

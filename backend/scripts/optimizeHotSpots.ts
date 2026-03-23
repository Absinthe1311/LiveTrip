// 优化热门景点脚本 - 确保每个主要城市有足够的均衡热门景点
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 目标城市和每个城市的目标热门景点数量
const TARGET_CITIES = [
  { name: '上海市', targetCount: 8 },
  { name: '成都市', targetCount: 8 },
  { name: '杭州市', targetCount: 8 },
  { name: '厦门市', targetCount: 8 },
  { name: '西安市', targetCount: 8 },
  { name: '北京市', targetCount: 8 }, // 统一使用"北京市"
  { name: '武汉市', targetCount: 6 }, // 新增武汉
  { name: '三亚市', targetCount: 6 },  // 新增三亚
];

async function optimizeHotSpots() {
  try {
    console.log('🎯 开始优化热门景点...\n');

    // 1. 首先清理重复的城市名 - 将"北京"改为"北京市"
    console.log('📝 步骤1: 统一城市名称...\n');
    const beijingSpots = await prisma.spot.findMany({
      where: { city: '北京' },
    });

    if (beijingSpots.length > 0) {
      await prisma.spot.updateMany({
        where: { city: '北京' },
        data: { city: '北京市' },
      });
      console.log(`✅ 已将 ${beijingSpots.length} 个"北京"的景点改为"北京市"\n`);
    }

    // 2. 处理每个目标城市
    for (const targetCity of TARGET_CITIES) {
      console.log(`\n📍 处理城市: ${targetCity.name}`);

      // 查找该城市所有景点
      const allSpots = await prisma.spot.findMany({
        where: {
          OR: [
            { city: targetCity.name },
            { city: targetCity.name.replace('市', '') }, // 尝试不带"市"后缀
          ],
        },
        orderBy: { rating: 'desc' },
      });

      console.log(`   找到 ${allSpots.length} 个景点`);

      if (allSpots.length === 0) {
        console.log(`   ⚠️  ${targetCity.name} 没有景点,跳过`);
        continue;
      }

      // 查找当前热门景点
      const currentHotSpots = await prisma.spot.findMany({
        where: {
          OR: [
            { city: targetCity.name, isHot: true },
            { city: targetCity.name.replace('市', ''), isHot: true },
          ],
        },
      });

      console.log(`   当前热门景点: ${currentHotSpots.length} 个`);

      // 计算需要添加或移除的数量
      const diff = targetCity.targetCount - currentHotSpots.length;

      if (diff > 0) {
        console.log(`   ➕ 需要添加 ${diff} 个热门景点`);

        // 找出评分最高的非热门景点
        const nonHotSpots = allSpots.filter(spot => !spot.isHot);
        const spotsToAdd = nonHotSpots.slice(0, diff);

        // 标记为热门
        for (const spot of spotsToAdd) {
          await prisma.spot.update({
            where: { id: spot.id },
            data: { isHot: true },
          });
          console.log(`   ✅ 设为热门: ${spot.name} (评分: ${spot.rating})`);
        }
      } else if (diff < 0) {
        console.log(`   ➖ 需要移除 ${Math.abs(diff)} 个热门景点`);

        // 找出评分最低的热门景点
        const hotSpotsToRemove = currentHotSpots
          .sort((a, b) => (a.rating || 0) - (b.rating || 0))
          .slice(0, Math.abs(diff));

        // 取消热门标记
        for (const spot of hotSpotsToRemove) {
          await prisma.spot.update({
            where: { id: spot.id },
            data: { isHot: false },
          });
          console.log(`   ❌ 取消热门: ${spot.name} (评分: ${spot.rating})`);
        }
      } else {
        console.log(`   ✅ 热门景点数量已达标`);
      }
    }

    // 3. 显示最终结果
    console.log('\n\n📊 最终热门景点分布:\n');
    const finalHotSpots = await prisma.spot.findMany({
      where: { isHot: true },
      select: {
        id: true,
        name: true,
        city: true,
        rating: true,
      },
      orderBy: { city: 'asc' },
    });

    const finalCityGroups: Record<string, typeof finalHotSpots> = {};
    finalHotSpots.forEach(spot => {
      if (!finalCityGroups[spot.city]) {
        finalCityGroups[spot.city] = [];
      }
      finalCityGroups[spot.city].push(spot);
    });

    // 统计所有有热门景点的城市
    const citiesWithHotSpots = Object.keys(finalCityGroups)
      .map(city => ({
        city,
        count: finalCityGroups[city].length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // 只显示前8个城市

    citiesWithHotSpots.forEach(({ city, count }) => {
      console.log(`📍 ${city}: ${count} 个景点`);
      finalCityGroups[city].slice(0, 5).forEach(spot => {
        console.log(`   - ${spot.name} (评分: ${spot.rating})`);
      });
      console.log('');
    });

    console.log(`✅ 热门景点优化完成! 共 ${finalHotSpots.length} 个热门景点`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 优化失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行脚本
optimizeHotSpots();

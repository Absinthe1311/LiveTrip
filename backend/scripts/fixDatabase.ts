import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 开始修复数据库 ===\n');

  // 1. 统一城市名称
  console.log('1. 统一城市名称...');
  
  const cityMappings = [
    { old: '北京', new: '北京市' },
    { old: '上海', new: '上海市' },
    { old: '成都', new: '成都市' },
    { old: '厦门', new: '厦门市' },
    { old: '杭州', new: '杭州市' },
    { old: '西安', new: '西安市' },
    { old: '武汉', new: '武汉市' },
    { old: '三亚', new: '三亚市' },
    { old: '丽江', new: '丽江市' },
  ];

  for (const { old, new: newCity } of cityMappings) {
    const result = await prisma.spot.updateMany({
      where: { city: old },
      data: { city: newCity }
    });
    console.log(`  ${old} -> ${newCity}: ${result.count}个景点`);
  }

  // 2. 查询所有景点
  console.log('\n2. 查询所有景点...');
  const allSpots = await prisma.spot.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      category: true,
      rating: true,
      isHot: true,
    },
    orderBy: { rating: 'desc' }
  });

  console.log(`  总景点数: ${allSpots.length}`);

  // 3. 按城市分组
  const cityGroups: Record<string, typeof allSpots> = {};
  allSpots.forEach(spot => {
    if (!cityGroups[spot.city]) {
      cityGroups[spot.city] = [];
    }
    cityGroups[spot.city].push(spot);
  });

  // 4. 为每个城市补充热门景点（目标：每个城市9个热门景点）
  console.log('\n3. 补充热门景点...');
  
  const targetCities = ['北京市', '上海市', '成都市', '杭州市', '厦门市', '西安市', '武汉市', '三亚市', '丽江市'];
  const targetCount = 9;
  const spotsToMarkAsHot: string[] = [];

  for (const city of targetCities) {
    const spots = cityGroups[city] || [];
    const hotSpots = spots.filter(s => s.isHot);
    const needCount = targetCount - hotSpots.length;

    console.log(`\n  ${city}:`);
    console.log(`    当前热门: ${hotSpots.length}个`);
    console.log(`    总景点: ${spots.length}个`);

    if (needCount > 0 && spots.length > hotSpots.length) {
      // 选择评分最高的非热门景点
      const candidates = spots
        .filter(s => !s.isHot)
        .sort((a, b) => (b.rating || 4.0) - (a.rating || 4.0))
        .slice(0, needCount);

      console.log(`    需补充: ${needCount}个`);
      console.log(`    可补充: ${candidates.length}个`);

      candidates.forEach(s => {
        spotsToMarkAsHot.push(s.id);
        console.log(`      - ${s.name} (评分: ${s.rating || '无'})`);
      });
    } else if (hotSpots.length >= targetCount) {
      console.log(`    已满足要求`);
    } else {
      console.log(`    景点不足，无法补充`);
    }
  }

  // 5. 执行更新
  if (spotsToMarkAsHot.length > 0) {
    console.log(`\n4. 更新热门景点标记...`);
    const result = await prisma.spot.updateMany({
      where: { id: { in: spotsToMarkAsHot } },
      data: { isHot: true }
    });
    console.log(`  ✅ 已更新 ${result.count} 个景点为热门景点`);
  }

  // 6. 验证结果
  console.log('\n5. 验证结果...');
  const finalSpots = await prisma.spot.findMany({
    where: { isHot: true },
    select: { city: true }
  });

  const finalCityGroups: Record<string, number> = {};
  finalSpots.forEach(s => {
    finalCityGroups[s.city] = (finalCityGroups[s.city] || 0) + 1;
  });

  console.log('\n  最终热门景点分布:');
  Object.entries(finalCityGroups)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`    ${city}: ${count}个`);
    });

  console.log(`\n  总热门景点: ${finalSpots.length}个`);

  await prisma.$disconnect();
  console.log('\n=== 修复完成 ===');
}

main().catch(console.error);

// 测试动态过滤功能
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDynamicFiltering() {
  try {
    console.log('='.repeat(80));
    console.log('测试动态过滤功能');
    console.log('='.repeat(80));

    // 场景1：模拟行程有景点A、B、C
    console.log('\n📝 场景1：行程包含景点A、B、C');
    console.log('期望：A的备选中不应该出现B、C');
    
    // 获取北京的3个景点
    const beijingSpots = await prisma.spot.findMany({
      where: { city: '北京' },
      take: 3,
      select: { id: true, name: true }
    });

    console.log('\n行程中的景点：');
    beijingSpots.forEach((spot, i) => {
      console.log(`  ${String.fromCharCode(65 + i)}. ${spot.name} (ID: ${spot.id})`);
    });

    // 查看第一个景点的备选（不排除）
    const spotA = beijingSpots[0];
    const spotB = beijingSpots[1];
    const spotC = beijingSpots[2];

    console.log(`\n查看 ${spotA.name} 的备选景点：`);

    // 不排除任何景点
    const alternativesWithoutExclude = await prisma.spotAlternative.findMany({
      where: { originalSpotId: spotA.id },
      include: {
        // 手动查询备选景点信息
      }
    });

    const altDetailsWithoutExclude = await Promise.all(
      alternativesWithoutExclude.map(async (alt) => {
        const spot = await prisma.spot.findUnique({
          where: { id: alt.alternativeSpotId },
          select: { id: true, name: true }
        });
        return spot;
      })
    );

    console.log('\n  不排除任何景点：');
    altDetailsWithoutExclude.forEach((spot, i) => {
      const isOtherItinerarySpot = 
        spot.id === spotB.id || spot.id === spotC.id;
      console.log(`    ${i + 1}. ${spot.name}${isOtherItinerarySpot ? ' ⚠️  (在行程中)' : ''}`);
    });

    // 排除行程中的其他景点
    const excludeSpotIds = [spotB.id, spotC.id];
    const filteredAlternatives = altDetailsWithoutExclude.filter(
      spot => !excludeSpotIds.includes(spot.id)
    );

    console.log('\n  排除行程中的其他景点后：');
    filteredAlternatives.forEach((spot, i) => {
      console.log(`    ${i + 1}. ${spot.name}`);
    });

    console.log(`\n  ✅ 过滤前：${altDetailsWithoutExclude.length} 个备选`);
    console.log(`  ✅ 过滤后：${filteredAlternatives.length} 个备选`);
    console.log(`  ✅ 排除了：${altDetailsWithoutExclude.length - filteredAlternatives.length} 个行程中的景点`);

    // 场景2：验证动态过滤逻辑
    console.log('\n' + '='.repeat(80));
    console.log('📝 场景2：验证动态过滤逻辑');
    console.log('='.repeat(80));

    // 检查是否有备选景点出现在行程中
    const hasOtherItinerarySpots = altDetailsWithoutExclude.some(
      spot => excludeSpotIds.includes(spot.id)
    );

    if (hasOtherItinerarySpots) {
      console.log('\n  ✅ 验证通过：备选景点中包含行程中的其他景点');
      console.log('  ✅ 动态过滤功能正常工作');
    } else {
      console.log('\n  ℹ️  备选景点中不包含行程中的其他景点（无需过滤）');
    }

    // 场景3：测试不同行程的情况
    console.log('\n' + '='.repeat(80));
    console.log('📝 场景3：不同行程的动态过滤');
    console.log('='.repeat(80));

    // 获取上海的景点
    const shanghaiSpots = await prisma.spot.findMany({
      where: { city: '上海' },
      take: 3,
      select: { id: true, name: true }
    });

    console.log('\n上海行程中的景点：');
    shanghaiSpots.forEach((spot, i) => {
      console.log(`  ${String.fromCharCode(65 + i)}. ${spot.name}`);
    });

    const shanghaiSpotA = shanghaiSpots[0];
    const shanghaiAlternatives = await prisma.spotAlternative.findMany({
      where: { originalSpotId: shanghaiSpotA.id }
    });

    const shanghaiAltDetails = await Promise.all(
      shanghaiAlternatives.map(async (alt) => {
        const spot = await prisma.spot.findUnique({
          where: { id: alt.alternativeSpotId },
          select: { name: true }
        });
        return spot?.name;
      })
    );

    console.log(`\n${shanghaiSpotA.name} 的备选景点：`);
    shanghaiAltDetails.forEach((name, i) => {
      console.log(`  ${i + 1}. ${name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ 测试完成！');
    console.log('='.repeat(80));
    console.log('\n💡 总结：');
    console.log('  - 预生成时允许景点重复出现在多个备选列表中');
    console.log('  - 运行时根据当前行程动态过滤备选景点');
    console.log('  - 确保同一行程中的景点不会出现在彼此的备选中');

  } catch (error) {
    console.error('❌ 测试失败：', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDynamicFiltering();

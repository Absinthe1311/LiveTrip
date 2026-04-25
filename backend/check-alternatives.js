// 检查备选景点数据
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAlternatives() {
  try {
    // 1. 检查SpotAlternative表
    const alternativesCount = await prisma.spotAlternative.count();
    console.log('='.repeat(60));
    console.log('备选景点数据检查');
    console.log('='.repeat(60));
    console.log(`\n📊 SpotAlternative表总记录数: ${alternativesCount}`);

    if (alternativesCount > 0) {
      // 查看前10条记录
      const samples = await prisma.spotAlternative.findMany({
        take: 10,
        include: {
          // 注意：SpotAlternative没有直接关联Spot表，需要手动查询
        }
      });

      console.log('\n📝 前10条记录:');
      for (const alt of samples) {
        const originalSpot = await prisma.spot.findUnique({
          where: { id: alt.originalSpotId },
          select: { name: true, city: true }
        });
        const alternativeSpot = await prisma.spot.findUnique({
          where: { id: alt.alternativeSpotId },
          select: { name: true, city: true }
        });

        console.log(`  原景点: ${originalSpot?.name || '未知'} (${originalSpot?.city || '未知'})`);
        console.log(`  备选: ${alternativeSpot?.name || '未知'} (${alternativeSpot?.city || '未知'})`);
        console.log(`  优先级: ${alt.priority}`);
        console.log('  ---');
      }
    } else {
      console.log('\n⚠️  SpotAlternative表为空，没有预存的备选景点数据');
      console.log('这意味着备选景点是实时生成的，不是提前编码的');
    }

    // 2. 检查Spot表
    const spotsCount = await prisma.spot.count();
    console.log(`\n📊 Spot表总记录数: ${spotsCount}`);

    // 按城市统计
    const spotsByCity = await prisma.spot.groupBy({
      by: ['city'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    console.log('\n📊 各城市景点数量（前10）:');
    spotsByCity.forEach(item => {
      console.log(`  ${item.city}: ${item._count.id} 个景点`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('结论');
    console.log('='.repeat(60));
    if (alternativesCount === 0) {
      console.log('✅ 备选景点是【实时生成】的，不是提前编码');
      console.log('   生成时机：用户点击"查看备选景点"时');
      console.log('   生成逻辑：从同城市景点中选择评分高、健康度好的景点');
    } else {
      console.log('✅ 备选景点有【预存数据】');
      console.log(`   预存记录数: ${alternativesCount}`);
      console.log('   但也可能实时生成新的备选关系');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlternatives();

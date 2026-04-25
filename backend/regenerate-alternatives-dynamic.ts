// 批量重新生成所有景点的备选关系（动态过滤版）
// 核心思想：
// 1. 预生成时不限制重复使用（允许景点出现在多个备选列表中）
// 2. 运行时动态过滤：根据当前行程排除其他景点
// 3. 每个景点生成1-3个备选

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Spot {
  id: string;
  name: string;
  city: string;
  category: string | null;
  rating: number | null;
  location: string;
}

async function regenerateAlternativesDynamic() {
  try {
    console.log('='.repeat(80));
    console.log('批量重新生成备选关系（动态过滤版）');
    console.log('='.repeat(80));
    console.log('核心思想：');
    console.log('  1. 预生成时不限制重复使用');
    console.log('  2. 运行时动态过滤：根据当前行程排除其他景点');
    console.log('  3. 每个景点生成1-3个备选');
    console.log('='.repeat(80));

    // 步骤1：清空现有的备选关系
    console.log('\n📝 步骤1：清空现有的备选关系...');
    const deleteResult = await prisma.spotAlternative.deleteMany({});
    console.log(`✅ 已删除 ${deleteResult.count} 条备选关系记录`);

    // 步骤2：获取所有景点
    console.log('\n📝 步骤2：获取所有景点...');
    const allSpots = await prisma.spot.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        category: true,
        rating: true,
        location: true,
      },
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' },
      ],
    });
    console.log(`✅ 找到 ${allSpots.length} 个景点`);

    // 按城市分组
    const spotsByCity = new Map<string, Spot[]>();
    for (const spot of allSpots) {
      const citySpots = spotsByCity.get(spot.city) || [];
      citySpots.push(spot);
      spotsByCity.set(spot.city, citySpots);
    }

    console.log(`\n📊 各城市景点数量：`);
    for (const [city, spots] of spotsByCity.entries()) {
      console.log(`  ${city}: ${spots.length} 个景点`);
    }

    // 步骤3：为每个景点生成备选关系
    console.log('\n📝 步骤3：为每个景点生成备选关系...');
    console.log('策略：每个景点生成1-3个备选，不限制重复使用\n');

    let totalGenerated = 0;
    let successCount = 0;
    let failCount = 0;

    // 按城市处理
    for (const [city, citySpots] of spotsByCity.entries()) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏙️  处理城市：${city} (${citySpots.length} 个景点)`);
      console.log('='.repeat(80));

      // 为该城市的每个景点生成备选
      for (let i = 0; i < citySpots.length; i++) {
        const spot = citySpots[i];
        console.log(`\n[${i + 1}/${citySpots.length}] 处理景点：${spot.name} (评分: ${spot.rating || '无'})`);

        try {
          // 获取候选景点（同城市其他景点）
          const candidates = citySpots.filter(s => s.id !== spot.id);

          if (candidates.length === 0) {
            console.log(`  ⚠️  没有候选景点，跳过`);
            failCount++;
            continue;
          }

          // 按评分排序候选景点
          const sortedCandidates = candidates.sort((a, b) => {
            const ratingA = a.rating || 0;
            const ratingB = b.rating || 0;
            return ratingB - ratingA;
          });

          // 确定备选数量：最多3个，最少1个
          const targetCount = Math.min(3, Math.max(1, candidates.length));

          // 选择备选景点（不限制重复使用）
          const alternatives: { id: string; priority: number }[] = [];

          for (const candidate of sortedCandidates) {
            if (alternatives.length >= targetCount) break;

            alternatives.push({
              id: candidate.id,
              priority: alternatives.length + 1,
            });
          }

          // 保存备选关系
          if (alternatives.length > 0) {
            for (const alt of alternatives) {
              await prisma.spotAlternative.create({
                data: {
                  originalSpotId: spot.id,
                  alternativeSpotId: alt.id,
                  city: city,
                  priority: alt.priority,
                },
              });
            }

            const altNames = await Promise.all(
              alternatives.map(async (alt) => {
                const s = await prisma.spot.findUnique({
                  where: { id: alt.id },
                  select: { name: true },
                });
                return s?.name;
              })
            );

            console.log(`  ✅ 生成 ${alternatives.length} 个备选: ${altNames.join(', ')}`);
            totalGenerated += alternatives.length;
            successCount++;
          } else {
            console.log(`  ⚠️  无法生成备选景点`);
            failCount++;
          }

          // 进度显示
          if ((i + 1) % 10 === 0) {
            console.log(`\n  📊 进度：${i + 1}/${citySpots.length} (${((i + 1) / citySpots.length * 100).toFixed(1)}%)`);
          }

        } catch (error: any) {
          console.error(`  ❌ 处理失败：${error.message}`);
          failCount++;
        }
      }

      // 显示该城市的统计信息
      console.log(`\n📊 ${city} 统计：`);
      console.log(`  景点总数：${citySpots.length}`);
      console.log(`  有备选的景点：${successCount} 个`);
      console.log(`  无备选的景点：${failCount} 个`);
    }

    // 步骤4：验证结果
    console.log('\n' + '='.repeat(80));
    console.log('📝 步骤4：验证结果...');
    console.log('='.repeat(80));

    const finalCount = await prisma.spotAlternative.count();
    const spotsWithAlternatives = await prisma.spotAlternative.groupBy({
      by: ['originalSpotId'],
      _count: { id: true },
    });

    const spotsWithoutAlternatives = allSpots.length - spotsWithAlternatives.length;

    console.log(`\n✅ 最终统计：`);
    console.log(`  总景点数：${allSpots.length}`);
    console.log(`  成功生成：${successCount} 个景点`);
    console.log(`  失败数量：${failCount} 个景点`);
    console.log(`  备选关系总数：${finalCount} 条`);
    console.log(`  平均每个景点：${(finalCount / successCount).toFixed(1)} 个备选`);
    console.log(`  无备选景点数：${spotsWithoutAlternatives} 个`);

    // 显示备选数量分布
    const distribution = new Map<number, number>();
    for (const item of spotsWithAlternatives) {
      const count = item._count.id;
      distribution.set(count, (distribution.get(count) || 0) + 1);
    }

    console.log(`\n📊 备选数量分布：`);
    const sortedDist = Array.from(distribution.entries()).sort((a, b) => a[0] - b[0]);
    for (const [count, spotCount] of sortedDist) {
      console.log(`  ${count} 个备选：${spotCount} 个景点`);
    }

    // 验证：检查重复使用情况
    console.log(`\n📊 验证：检查重复使用情况...`);
    const alternativeUsage = await prisma.spotAlternative.groupBy({
      by: ['alternativeSpotId'],
      _count: { id: true },
    });

    const usageDistribution = new Map<number, number>();
    for (const item of alternativeUsage) {
      const count = item._count.id;
      usageDistribution.set(count, (usageDistribution.get(count) || 0) + 1);
    }

    console.log(`\n📊 被用作备选次数分布：`);
    const sortedUsageDist = Array.from(usageDistribution.entries()).sort((a, b) => a[0] - b[0]);
    for (const [count, spotCount] of sortedUsageDist) {
      console.log(`  ${count} 次：${spotCount} 个景点`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 批量重新生成完成！');
    console.log('='.repeat(80));
    console.log('\n💡 说明：');
    console.log('  - 预生成时允许景点重复出现在多个备选列表中');
    console.log('  - 运行时会根据当前行程动态过滤备选景点');
    console.log('  - 例如：行程有A、B、C，查看A的备选时会排除B、C');

  } catch (error: any) {
    console.error('❌ 批量重新生成失败：', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
regenerateAlternativesDynamic()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败：', error);
    process.exit(1);
  });

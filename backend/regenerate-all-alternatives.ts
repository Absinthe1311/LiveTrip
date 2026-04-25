// 批量重新生成所有景点的备选关系
// 运行方式：npx ts-node regenerate-all-alternatives.ts

import { PrismaClient } from '@prisma/client';
import { spotService } from './src/services/spotService';

const prisma = new PrismaClient();

interface Spot {
  id: string;
  name: string;
  city: string;
  category: string | null;
  rating: number | null;
}

async function regenerateAllAlternatives() {
  try {
    console.log('='.repeat(80));
    console.log('批量重新生成所有景点的备选关系');
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
      },
      orderBy: {
        rating: 'desc',
      },
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
    console.log('策略：每个景点生成5-8个备选，避免重复使用\n');

    let totalGenerated = 0;
    let successCount = 0;
    let failCount = 0;

    // 按城市处理
    for (const [city, citySpots] of spotsByCity.entries()) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🏙️  处理城市：${city} (${citySpots.length} 个景点)`);
      console.log('='.repeat(80));

      // 记录每个景点被用作备选的次数
      const usedAsAlternative = new Map<string, number>();

      // 为该城市的每个景点生成备选
      for (let i = 0; i < citySpots.length; i++) {
        const spot = citySpots[i];
        console.log(`\n[${i + 1}/${citySpots.length}] 处理景点：${spot.name} (ID: ${spot.id})`);

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

          // 选择备选景点（优先选择未被使用过的，或使用次数少的）
          const alternatives: { id: string; priority: number }[] = [];
          const targetCount = Math.min(8, Math.max(5, Math.floor(candidates.length * 0.4)));

          for (const candidate of sortedCandidates) {
            if (alternatives.length >= targetCount) break;

            // 检查该候选景点被用作备选的次数
            const usedCount = usedAsAlternative.get(candidate.id) || 0;

            // 如果被使用次数少于3次，优先选择
            if (usedCount < 3) {
              alternatives.push({
                id: candidate.id,
                priority: alternatives.length + 1,
              });
              usedAsAlternative.set(candidate.id, usedCount + 1);
            }
          }

          // 如果备选数量不足，放宽条件（选择使用次数3-5次的）
          if (alternatives.length < 5) {
            for (const candidate of sortedCandidates) {
              if (alternatives.length >= targetCount) break;
              if (alternatives.some(a => a.id === candidate.id)) continue;

              const usedCount = usedAsAlternative.get(candidate.id) || 0;
              if (usedCount < 5) {
                alternatives.push({
                  id: candidate.id,
                  priority: alternatives.length + 1,
                });
                usedAsAlternative.set(candidate.id, usedCount + 1);
              }
            }
          }

          // 如果还是不足，使用所有可用候选
          if (alternatives.length < 3) {
            for (const candidate of sortedCandidates) {
              if (alternatives.length >= Math.min(5, candidates.length)) break;
              if (alternatives.some(a => a.id === candidate.id)) continue;

              alternatives.push({
                id: candidate.id,
                priority: alternatives.length + 1,
              });
              usedAsAlternative.set(candidate.id, (usedAsAlternative.get(candidate.id) || 0) + 1);
            }
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

            console.log(`  ✅ 生成 ${alternatives.length} 个备选景点`);
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
      console.log(`  备选关系：${totalGenerated} 条`);
      console.log(`  平均每个景点：${(totalGenerated / citySpots.length).toFixed(1)} 个备选`);
    }

    // 步骤4：验证结果
    console.log('\n' + '='.repeat(80));
    console.log('📝 步骤4：验证结果...');
    console.log('='.repeat(80));

    const finalCount = await prisma.spotAlternative.count();
    const spotsWithAlternatives = await prisma.spotAlternative.groupBy({
      by: ['originalSpotId'],
      _count: {
        id: true,
      },
    });

    const spotsWithoutAlternatives = allSpots.length - spotsWithAlternatives.length;

    console.log(`\n✅ 最终统计：`);
    console.log(`  总景点数：${allSpots.length}`);
    console.log(`  成功生成：${successCount} 个景点`);
    `  失败数量：${failCount} 个景点`;
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

    // 显示被用作备选次数最多的景点
    console.log(`\n📊 被用作备选次数最多的景点（前10）：`);
    const mostUsedAlternatives = await prisma.spotAlternative.groupBy({
      by: ['alternativeSpotId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    for (const item of mostUsedAlternatives) {
      const spot = await prisma.spot.findUnique({
        where: { id: item.alternativeSpotId },
        select: { name: true, city: true },
      });
      console.log(`  ${spot?.name} (${spot?.city}): 被用作备选 ${item._count.id} 次`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ 批量重新生成完成！');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ 批量重新生成失败：', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
regenerateAllAlternatives()
  .then(() => {
    console.log('\n✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败：', error);
    process.exit(1);
  });

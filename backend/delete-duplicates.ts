// AI辅助生成：GLM-5, 2026-04-23 18:35
// 描述：删除重复景点

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDuplicateSpots() {
  console.log('开始删除重复景点...\n');

  try {
    // 获取所有景点及其图片
    const spots = await prisma.spot.findMany({
      include: {
        image: true,
      },
      orderBy: {
        city: 'asc',
      },
    });

    // 按城市和名称分组
    const cityMap = new Map<string, Map<string, typeof spots>>();

    for (const spot of spots) {
      if (!cityMap.has(spot.city)) {
        cityMap.set(spot.city, new Map());
      }

      const citySpots = cityMap.get(spot.city)!;
      if (!citySpots.has(spot.name)) {
        citySpots.set(spot.name, []);
      }
      citySpots.get(spot.name)!.push(spot);
    }

    let totalDeleted = 0;
    const deletionLog: string[] = [];

    // 处理每个城市的重复景点
    for (const [city, citySpots] of cityMap) {
      for (const [name, duplicateSpots] of citySpots) {
        if (duplicateSpots.length > 1) {
          console.log(`\n处理重复景点: ${city} - ${name} (${duplicateSpots.length}个)`);

          // 分类：有图片的和无图片的
          const withImage = duplicateSpots.filter(s => s.image && s.image.url);
          const withoutImage = duplicateSpots.filter(s => !s.image || !s.image.url);

          console.log(`  有图片: ${withImage.length}个`);
          console.log(`  无图片: ${withoutImage.length}个`);

          let toDelete: typeof duplicateSpots = [];

          if (withImage.length > 0) {
            // 如果有图片的景点存在
            // 保留第一个有图片的，删除其他所有（包括有图片和无图片的）
            const toKeep = withImage[0];
            toDelete = duplicateSpots.filter(s => s.id !== toKeep.id);
            console.log(`  ✅ 保留: ${toKeep.id} (有图片)`);
          } else {
            // 如果都没有图片，保留第一个，删除其他
            const toKeep = duplicateSpots[0];
            toDelete = duplicateSpots.filter(s => s.id !== toKeep.id);
            console.log(`  ✅ 保留: ${toKeep.id} (无图片，但保留第一个)`);
          }

          // 执行删除
          for (const spot of toDelete) {
            try {
              // 先删除关联的图片
              if (spot.image) {
                await prisma.spotImage.delete({
                  where: { id: spot.image.id },
                });
              }

              // 删除景点
              await prisma.spot.delete({
                where: { id: spot.id },
              });

              totalDeleted++;
              const reason = spot.image ? '有图片但重复' : '无图片';
              deletionLog.push(`${city} - ${name}: 删除 ${spot.id} (${reason})`);
              console.log(`  ❌ 删除: ${spot.id} (${reason})`);
            } catch (error) {
              console.error(`  ⚠️  删除失败 ${spot.id}:`, error);
            }
          }
        }
      }
    }

    console.log(`\n\n=== 删除完成 ===`);
    console.log(`总计删除: ${totalDeleted}个重复景点`);

    // 保存删除日志
    const fs = require('fs');
    const logContent = `# 删除重复景点日志\n\n` +
      `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n` +
      `**删除总数**: ${totalDeleted}个\n\n` +
      `---\n\n` +
      deletionLog.map(log => `- ${log}`).join('\n');

    fs.writeFileSync('删除重复景点日志.md', logContent, 'utf8');
    console.log('\n✅ 删除日志已保存到 删除重复景点日志.md');

    return totalDeleted;

  } catch (error) {
    console.error('❌ 删除失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteDuplicateSpots();

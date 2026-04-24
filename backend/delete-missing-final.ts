// AI辅助生成：GLM-5, 2026-04-23 20:30
// 描述：删除所有无图片的景点（保留武汉、三亚、丽江）

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMissingImageSpots() {
  console.log('删除无图片景点...\n');

  try {
    // 需要处理的城市
    const citiesToProcess = ['上海', '北京', '厦门', '成都', '杭州', '西安'];
    const citiesToKeep = ['武汉', '三亚', '丽江'];

    let totalDeleted = 0;
    const deletionLog: string[] = [];

    for (const city of citiesToProcess) {
      console.log(`\n处理城市: ${city}`);

      const spots = await prisma.spot.findMany({
        where: {
          city: city,
          image: null,
        },
      });

      console.log(`找到 ${spots.length} 个无图片景点`);

      for (const spot of spots) {
        try {
          await prisma.spot.delete({
            where: { id: spot.id },
          });
          totalDeleted++;
          deletionLog.push(`✅ ${city} - ${spot.name}`);
          console.log(`✅ 删除: ${spot.name}`);
        } catch (error: any) {
          deletionLog.push(`❌ ${city} - ${spot.name}: ${error.message}`);
          console.log(`❌ 删除失败: ${spot.name} - ${error.message}`);
        }
      }
    }

    console.log(`\n\n=== 删除完成 ===`);
    console.log(`总计删除: ${totalDeleted}个景点`);

    // 保存日志
    const fs = require('fs');
    const logContent = `# 删除无图片景点日志\n\n` +
      `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n` +
      `**删除总数**: ${totalDeleted}个\n\n` +
      `**保留城市**: ${citiesToKeep.join('、')}\n\n` +
      `---\n\n` +
      deletionLog.map(log => `- ${log}`).join('\n');

    fs.writeFileSync('删除无图片景点日志.md', logContent, 'utf8');
    console.log('\n✅ 日志已保存到 删除无图片景点日志.md');

  } catch (error) {
    console.error('❌ 删除失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMissingImageSpots();

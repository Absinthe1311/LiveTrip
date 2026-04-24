// AI辅助生成：GLM-5, 2026-04-23 17:20
// 描述：分析景点数据 - 找出缺失图片和重复景点

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SpotAnalysis {
  city: string;
  totalSpots: number;
  spotsWithImage: number;
  spotsWithoutImage: number;
  missingImageSpots: Array<{ id: string; name: string; category?: string }>;
  duplicateSpots: Array<{ name: string; count: number; spots: Array<{ id: string; category?: string }> }>;
}

async function analyzeSpots() {
  console.log('开始分析景点数据...\n');

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

    // 按城市分组
    const cityMap = new Map<string, SpotAnalysis>();

    for (const spot of spots) {
      if (!cityMap.has(spot.city)) {
        cityMap.set(spot.city, {
          city: spot.city,
          totalSpots: 0,
          spotsWithImage: 0,
          spotsWithoutImage: 0,
          missingImageSpots: [],
          duplicateSpots: [],
        });
      }

      const cityData = cityMap.get(spot.city)!;
      cityData.totalSpots++;

      if (spot.image && spot.image.url) {
        cityData.spotsWithImage++;
      } else {
        cityData.spotsWithoutImage++;
        cityData.missingImageSpots.push({
          id: spot.id,
          name: spot.name,
          category: spot.category || undefined,
        });
      }
    }

    // 查找重复景点（按名称）
    for (const [city, data] of cityMap) {
      const citySpots = spots.filter(s => s.city === city);
      const nameCount = new Map<string, Array<{ id: string; category?: string }>>();

      for (const spot of citySpots) {
        if (!nameCount.has(spot.name)) {
          nameCount.set(spot.name, []);
        }
        nameCount.get(spot.name)!.push({
          id: spot.id,
          category: spot.category || undefined,
        });
      }

      // 找出重复的
      for (const [name, spotList] of nameCount) {
        if (spotList.length > 1) {
          data.duplicateSpots.push({
            name,
            count: spotList.length,
            spots: spotList,
          });
        }
      }

      // 按重复次数排序
      data.duplicateSpots.sort((a, b) => b.count - a.count);
    }

    // 生成Markdown报告
    let markdown = '# 景点数据分析报告\n\n';
    markdown += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `**总景点数**: ${spots.length}\n\n`;
    markdown += `**城市数量**: ${cityMap.size}\n\n`;
    markdown += '---\n\n';

    // 按城市输出
    for (const [city, data] of cityMap) {
      markdown += `# ${city}\n\n`;
      markdown += `**统计信息**:\n`;
      markdown += `- 总景点数: ${data.totalSpots}\n`;
      markdown += `- 有图片: ${data.spotsWithImage}\n`;
      markdown += `- 缺失图片: ${data.spotsWithoutImage}\n\n`;

      // 重复景点
      if (data.duplicateSpots.length > 0) {
        markdown += `## 重复景点 (${data.duplicateSpots.length}组)\n\n`;
        for (const dup of data.duplicateSpots) {
          markdown += `### ${dup.name} (${dup.count}个重复)\n`;
          for (const spot of dup.spots) {
            markdown += `- ID: ${spot.id}`;
            if (spot.category) {
              markdown += ` | 分类: ${spot.category}`;
            }
            markdown += '\n';
          }
          markdown += '\n';
        }
      } else {
        markdown += `## 重复景点\n\n`;
        markdown += `✅ 无重复景点\n\n`;
      }

      // 缺失图片景点
      if (data.missingImageSpots.length > 0) {
        markdown += `## 缺失图片景点 (${data.missingImageSpots.length}个)\n\n`;
        markdown += `| 序号 | 景点名称 | 分类 | ID |\n`;
        markdown += `|------|---------|------|----|\n`;
        for (let i = 0; i < data.missingImageSpots.length; i++) {
          const spot = data.missingImageSpots[i];
          markdown += `| ${i + 1} | ${spot.name} | ${spot.category || '-'} | ${spot.id} |\n`;
        }
        markdown += '\n';
      } else {
        markdown += `## 缺失图片景点\n\n`;
        markdown += `✅ 所有景点都有图片\n\n`;
      }

      markdown += '---\n\n';
    }

    // 汇总统计
    markdown += '# 汇总统计\n\n';
    
    let totalMissing = 0;
    let totalDuplicates = 0;
    const citiesWithIssues: string[] = [];

    for (const [city, data] of cityMap) {
      totalMissing += data.spotsWithoutImage;
      totalDuplicates += data.duplicateSpots.length;
      if (data.spotsWithoutImage > 0 || data.duplicateSpots.length > 0) {
        citiesWithIssues.push(city);
      }
    }

    markdown += `**总缺失图片景点**: ${totalMissing}个\n\n`;
    markdown += `**总重复景点组数**: ${totalDuplicates}组\n\n`;
    markdown += `**有问题的城市**: ${citiesWithIssues.length}个\n\n`;

    if (citiesWithIssues.length > 0) {
      markdown += `**问题城市列表**: ${citiesWithIssues.join('、')}\n\n`;
    }

    // 输出到控制台
    console.log(markdown);

    // 保存到文件
    const fs = require('fs');
    fs.writeFileSync('景点.md', markdown, 'utf8');
    console.log('\n✅ 报告已保存到 景点.md');

  } catch (error) {
    console.error('❌ 分析失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeSpots();

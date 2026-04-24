// AI辅助生成：GLM-5, 2026-04-23 19:58
// 描述：创建图片上传文件夹结构

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createUploadFolders() {
  console.log('创建图片上传文件夹结构...\n');

  try {
    // 获取所有缺失图片的景点
    const spotsWithoutImage = await prisma.spot.findMany({
      where: {
        image: null,
      },
      orderBy: [
        { city: 'asc' },
        { name: 'asc' },
      ],
    });

    console.log(`找到 ${spotsWithoutImage.length} 个缺失图片的景点\n`);

    // 创建根文件夹
    const rootFolder = path.join(process.cwd(), '待上传景点图片');
    if (!fs.existsSync(rootFolder)) {
      fs.mkdirSync(rootFolder, { recursive: true });
      console.log(`✅ 创建根文件夹: ${rootFolder}\n`);
    }

    // 按城市分组
    const cityMap = new Map<string, typeof spotsWithoutImage>();

    for (const spot of spotsWithoutImage) {
      if (!cityMap.has(spot.city)) {
        cityMap.set(spot.city, []);
      }
      cityMap.get(spot.city)!.push(spot);
    }

    // 创建文件夹结构
    let totalFolders = 0;
    const folderStructure: string[] = [];

    for (const [city, spots] of cityMap) {
      // 创建城市文件夹
      const cityFolder = path.join(rootFolder, city);
      if (!fs.existsSync(cityFolder)) {
        fs.mkdirSync(cityFolder, { recursive: true });
      }

      folderStructure.push(`\n## ${city} (${spots.length}个景点)`);
      console.log(`\n📁 ${city} (${spots.length}个景点)`);

      // 为每个景点创建文件夹
      for (const spot of spots) {
        // 清理景点名称（移除特殊字符）
        const cleanName = spot.name
          .replace(/[<>:"/\\|?*]/g, '_')  // 替换非法字符
          .replace(/\s+/g, '_')            // 空格替换为下划线
          .substring(0, 50);               // 限制长度

        const spotFolder = path.join(cityFolder, cleanName);
        if (!fs.existsSync(spotFolder)) {
          fs.mkdirSync(spotFolder, { recursive: true });
          totalFolders++;
        }

        // 创建说明文件
        const readmePath = path.join(spotFolder, 'README.txt');
        const readmeContent = `景点名称: ${spot.name}
景点ID: ${spot.id}
城市: ${spot.city}
分类: ${spot.category || '未分类'}
地址: ${spot.address || '未知'}
坐标: ${spot.location}

请将此景点的图片文件放入此文件夹中。
支持的图片格式: jpg, jpeg, png, webp
建议图片尺寸: 1920x1080 或更高
建议文件大小: < 5MB

上传完成后，请运行图片上传脚本。`;

        fs.writeFileSync(readmePath, readmeContent, 'utf8');

        folderStructure.push(`  - ${spot.name} (ID: ${spot.id})`);
        console.log(`  ✅ ${spot.name}`);
      }
    }

    // 创建总览文件
    const overviewPath = path.join(rootFolder, '景点列表.md');
    let overviewContent = `# 待上传景点图片列表\n\n`;
    overviewContent += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    overviewContent += `**总景点数**: ${spotsWithoutImage.length}个\n\n`;
    overviewContent += `**城市数量**: ${cityMap.size}个\n\n`;
    overviewContent += `---\n\n`;
    overviewContent += `## 文件夹结构\n\n`;
    overviewContent += `\`\`\`\n`;
    overviewContent += `待上传景点图片/\n`;

    for (const [city, spots] of cityMap) {
      overviewContent += `├── ${city}/ (${spots.length}个)\n`;
      for (let i = 0; i < Math.min(spots.length, 5); i++) {
        const spot = spots[i];
        const cleanName = spot.name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').substring(0, 50);
        overviewContent += `│   ├── ${cleanName}/\n`;
      }
      if (spots.length > 5) {
        overviewContent += `│   └── ... (还有${spots.length - 5}个)\n`;
      }
    }

    overviewContent += `\`\`\`\n\n`;
    overviewContent += `---\n\n`;
    overviewContent += `## 详细列表\n\n`;
    overviewContent += folderStructure.join('\n');
    overviewContent += `\n\n---\n\n`;
    overviewContent += `## 上传说明\n\n`;
    overviewContent += `1. 为每个景点准备图片文件（jpg, jpeg, png, webp格式）\n`;
    overviewContent += `2. 将图片文件放入对应的景点文件夹中\n`;
    overviewContent += `3. 建议图片尺寸: 1920x1080 或更高\n`;
    overviewContent += `4. 建议文件大小: < 5MB\n`;
    overviewContent += `5. 上传完成后，运行图片上传脚本\n`;

    fs.writeFileSync(overviewPath, overviewContent, 'utf8');

    console.log(`\n\n=== 创建完成 ===`);
    console.log(`总计创建: ${totalFolders}个景点文件夹`);
    console.log(`根文件夹: ${rootFolder}`);
    console.log(`\n✅ 请查看 "待上传景点图片" 文件夹`);

  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUploadFolders();

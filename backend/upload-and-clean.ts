// AI辅助生成：GLM-5, 2026-04-23 20:20
// 描述：上传景点图片到Cloudinary并删除无图片景点

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbfuvkopc',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
  city: string;
  spotName: string;
  spotId: string;
  uploaded: boolean;
  imageUrl?: string;
  error?: string;
}

async function uploadAndCleanSpots() {
  console.log('开始处理景点图片上传和清理...\n');

  const uploadResults: UploadResult[] = [];
  const toDelete: Array<{ id: string; name: string; city: string }> = [];

  try {
    // 需要处理的城市（排除武汉、三亚、丽江）
    const citiesToProcess = ['上海', '北京', '厦门', '成都', '杭州', '西安'];

    const uploadFolder = path.join(process.cwd(), '..', '待上传景点图片');

    // 处理每个城市
    for (const city of citiesToProcess) {
      console.log(`\n处理城市: ${city}`);
      console.log('─'.repeat(50));

      const cityFolder = path.join(uploadFolder, city);
      if (!fs.existsSync(cityFolder)) {
        console.log(`⚠️  文件夹不存在，跳过`);
        continue;
      }

      // 遍历每个景点文件夹
      const spotFolders = fs.readdirSync(cityFolder);
      let uploadedCount = 0;
      let noImageCount = 0;

      for (const spotFolderName of spotFolders) {
        const spotFolderPath = path.join(cityFolder, spotFolderName);
        if (!fs.statSync(spotFolderPath).isDirectory()) continue;

        // 查找图片文件
        const files = fs.readdirSync(spotFolderPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        // 从README.txt中提取景点信息
        const readmePath = path.join(spotFolderPath, 'README.txt');
        if (!fs.existsSync(readmePath)) {
          console.log(`⚠️  ${spotFolderName}: 缺少README.txt`);
          continue;
        }

        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const idMatch = readmeContent.match(/景点ID: (.+)/);
        const nameMatch = readmeContent.match(/景点名称: (.+)/);

        if (!idMatch || !nameMatch) {
          console.log(`⚠️  ${spotFolderName}: README格式错误`);
          continue;
        }

        const spotId = idMatch[1].trim();
        const spotName = nameMatch[1].trim();

        if (imageFiles.length === 0) {
          // 没有图片，标记为待删除
          toDelete.push({
            id: spotId,
            name: spotName,
            city: city,
          });
          noImageCount++;
          continue;
        }

        // 有图片，验证景点是否存在
        const spot = await prisma.spot.findUnique({
          where: { id: spotId },
          include: { image: true },
        });

        if (!spot) {
          console.log(`⚠️  ${spotName}: 景点不存在 (ID: ${spotId})`);
          continue;
        }

        // 如果景点已有图片，跳过
        if (spot.image) {
          console.log(`⚠️  ${spotName}: 已有图片，跳过`);
          continue;
        }

        // 上传第一张图片到Cloudinary
        const imagePath = path.join(spotFolderPath, imageFiles[0]);

        try {
          console.log(`📤 上传: ${spotName}...`);

          // 上传到Cloudinary
          const uploadResult = await cloudinary.uploader.upload(imagePath, {
            folder: 'spot-images',
            resource_type: 'image',
          });

          // 创建SpotImage记录
          const spotImage = await prisma.spotImage.create({
            data: {
              spotId: spotId,
              url: uploadResult.secure_url,
              source: 'admin',
              status: 'approved',
              isPrimary: true,
              priority: 0,
              uploadedBy: 'admin-upload-script',
            },
          });

          uploadResults.push({
            city: city,
            spotName: spotName,
            spotId: spotId,
            uploaded: true,
            imageUrl: uploadResult.secure_url,
          });

          uploadedCount++;
          console.log(`✅ ${spotName}: ${uploadResult.secure_url}`);
        } catch (error: any) {
          uploadResults.push({
            city: city,
            spotName: spotName,
            spotId: spotId,
            uploaded: false,
            error: error.message,
          });
          console.log(`❌ ${spotName}: ${error.message}`);
        }
      }

      console.log(`\n统计: 上传 ${uploadedCount}个, 无图片 ${noImageCount}个`);
    }

    // 删除无图片的景点
    console.log('\n\n删除无图片景点...');
    console.log('─'.repeat(50));

    let deletedCount = 0;
    for (const spot of toDelete) {
      try {
        await prisma.spot.delete({
          where: { id: spot.id },
        });
        deletedCount++;
        console.log(`✅ 删除: ${spot.city} - ${spot.name}`);
      } catch (error: any) {
        console.log(`❌ 删除失败: ${spot.city} - ${spot.name} (${error.message})`);
      }
    }

    console.log(`\n总计删除: ${deletedCount}个景点`);

    // 生成报告
    const reportPath = path.join(process.cwd(), '..', '图片上传报告.md');
    let report = `# 景点图片上传报告\n\n`;
    report += `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `**上传成功**: ${uploadResults.filter(r => r.uploaded).length}个\n\n`;
    report += `**删除景点**: ${deletedCount}个\n\n`;
    report += `---\n\n`;

    // 按城市分组
    const cityGroups = new Map<string, typeof uploadResults>();
    for (const result of uploadResults) {
      if (!cityGroups.has(result.city)) {
        cityGroups.set(result.city, []);
      }
      cityGroups.get(result.city)!.push(result);
    }

    for (const [city, results] of cityGroups) {
      report += `## ${city}\n\n`;
      report += `| 景点名称 | 状态 | 图片URL |\n`;
      report += `|---------|------|--------|\n`;

      for (const result of results) {
        const status = result.uploaded ? '✅ 已上传' : '❌ 失败';
        const url = result.uploaded ? result.imageUrl : result.error || '未知错误';
        report += `| ${result.spotName} | ${status} | ${url} |\n`;
      }
      report += '\n';
    }

    report += `---\n\n`;
    report += `## 删除的景点 (${deletedCount}个)\n\n`;
    for (const spot of toDelete) {
      report += `- ${spot.city} - ${spot.name} (ID: ${spot.id})\n`;
    }

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\n✅ 报告已保存到 图片上传报告.md`);

  } catch (error) {
    console.error('❌ 处理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadAndCleanSpots();

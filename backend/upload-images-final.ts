// AI辅助生成：GLM-5, 2026-04-24 00:20
// 描述：为已存在的景点上传图片

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

async function uploadImagesToExistingSpots() {
  console.log('为已存在的景点上传图片...\n');

  const results = {
    uploaded: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const citiesToProcess = ['上海', '北京', '厦门', '成都', '杭州', '西安'];
    const uploadFolder = path.join(process.cwd(), '..', '待上传景点图片');

    for (const city of citiesToProcess) {
      console.log(`\n处理城市: ${city}`);
      console.log('─'.repeat(50));

      const cityFolder = path.join(uploadFolder, city);
      if (!fs.existsSync(cityFolder)) continue;

      const spotFolders = fs.readdirSync(cityFolder);

      for (const spotFolderName of spotFolders) {
        const spotFolderPath = path.join(cityFolder, spotFolderName);
        if (!fs.statSync(spotFolderPath).isDirectory()) continue;

        // 读取README获取景点信息
        const readmePath = path.join(spotFolderPath, 'README.txt');
        if (!fs.existsSync(readmePath)) continue;

        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const nameMatch = readmeContent.match(/景点名称: (.+)/);

        if (!nameMatch) continue;

        const spotName = nameMatch[1].trim();

        // 查找景点
        const spot = await prisma.spot.findFirst({
          where: { name: spotName, city },
          include: { image: true },
        });

        if (!spot) {
          console.log(`⚠️  ${spotName}: 景点不存在`);
          continue;
        }

        // 检查是否已有图片
        if (spot.image) {
          console.log(`⚠️  ${spotName}: 已有图片，跳过`);
          results.skipped++;
          continue;
        }

        // 查找图片文件
        const files = fs.readdirSync(spotFolderPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        if (imageFiles.length === 0) {
          console.log(`⚠️  ${spotName}: 无图片文件`);
          continue;
        }

        // 上传图片
        const imagePath = path.join(spotFolderPath, imageFiles[0]);
        console.log(`📤 上传: ${spotName}...`);

        try {
          const uploadResult = await cloudinary.uploader.upload(imagePath, {
            folder: 'spot-images',
            resource_type: 'image',
          });

          // 创建SpotImage记录
          await prisma.spotImage.create({
            data: {
              spotId: spot.id,
              url: uploadResult.secure_url,
              source: 'admin',
              status: 'approved',
              isPrimary: true,
              priority: 0,
              uploadedBy: 'cmn5witjz0000nu1smeqfd8lm', // 管理员用户ID
            },
          });

          results.uploaded++;
          console.log(`✅ 上传成功: ${spotName}`);
          console.log(`   URL: ${uploadResult.secure_url}`);
        } catch (error: any) {
          results.failed++;
          console.log(`❌ 上传失败: ${spotName} - ${error.message}`);
        }
      }
    }

    // 生成报告
    console.log('\n\n=== 处理完成 ===');
    console.log(`上传成功: ${results.uploaded}个`);
    console.log(`跳过: ${results.skipped}个`);
    console.log(`失败: ${results.failed}个`);

    const reportPath = path.join(process.cwd(), '..', '图片上传最终报告.md');
    let report = `# 图片上传最终报告\n\n`;
    report += `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `**上传成功**: ${results.uploaded}个\n\n`;
    report += `**跳过**: ${results.skipped}个\n\n`;
    report += `**失败**: ${results.failed}个\n\n`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log('\n✅ 报告已保存');

  } catch (error) {
    console.error('❌ 处理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadImagesToExistingSpots();

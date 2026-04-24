// AI辅助生成：GLM-5, 2026-04-23 23:30
// 描述：重新创建被删除的景点并上传图片

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { amapService } from './src/services/amapService';

const prisma = new PrismaClient();

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbfuvkopc',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function recreateAndUpload() {
  console.log('开始重新创建景点并上传图片...\n');

  const results = {
    created: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const citiesToProcess = ['上海', '北京', '厦门', '成都', '杭州', '西安'];
    const uploadFolder = path.join(process.cwd(), '..', '待上传景点图片');
    const amap = amapService();

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
        const categoryMatch = readmeContent.match(/分类: (.+)/);
        const addressMatch = readmeContent.match(/地址: (.+)/);
        const locationMatch = readmeContent.match(/坐标: (.+)/);

        if (!nameMatch) continue;

        const spotName = nameMatch[1].trim();
        const category = categoryMatch ? categoryMatch[1].trim() : '景点';
        const address = addressMatch ? addressMatch[1].trim() : '';
        const location = locationMatch ? locationMatch[1].trim() : '';

        // 检查景点是否已存在
        const existingSpot = await prisma.spot.findFirst({
          where: { name: spotName, city },
        });

        if (existingSpot) {
          console.log(`⚠️  ${spotName}: 已存在，跳过创建`);
          results.skipped++;
          continue;
        }

        // 查找图片文件
        const files = fs.readdirSync(spotFolderPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        if (imageFiles.length === 0) {
          console.log(`⚠️  ${spotName}: 无图片，跳过`);
          continue;
        }

        // 创建景点
        console.log(`📝 创建景点: ${spotName}`);
        try {
          const spot = await prisma.spot.create({
            data: {
              amapId: `recreated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: spotName,
              city: city,
              location: location || '0,0',
              address: address || '',
              category: category,
              rating: 4.5,
              description: `${spotName}是一处值得探访的${category}，位于${city}。`,
              isOutdoor: true,
              isHot: false,
              source: 'admin-recreate',
            },
          });

          results.created++;
          console.log(`✅ 已创建: ${spotName} (ID: ${spot.id})`);

          // 上传图片
          const imagePath = path.join(spotFolderPath, imageFiles[0]);
          console.log(`📤 上传图片...`);

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
          console.log(`✅ 图片已上传: ${uploadResult.secure_url}`);
        } catch (error: any) {
          results.failed++;
          console.log(`❌ 失败: ${spotName} - ${error.message}`);
        }
      }
    }

    // 生成报告
    console.log('\n\n=== 处理完成 ===');
    console.log(`创建景点: ${results.created}个`);
    console.log(`上传图片: ${results.uploaded}个`);
    console.log(`跳过: ${results.skipped}个`);
    console.log(`失败: ${results.failed}个`);

    const reportPath = path.join(process.cwd(), '..', '景点重建和图片上传报告.md');
    let report = `# 景点重建和图片上传报告\n\n`;
    report += `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `**创建景点**: ${results.created}个\n\n`;
    report += `**上传图片**: ${results.uploaded}个\n\n`;
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

recreateAndUpload();

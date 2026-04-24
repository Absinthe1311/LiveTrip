// AI辅助生成：GLM-5, 2026-04-23 23:20
// 描述：为文件夹中有图片的景点上传图片，删除无图片的景点

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

async function uploadImagesFromFolders() {
  console.log('开始处理文件夹中的图片...\n');

  const uploadResults: Array<{ city: string; spot: string; status: string }> = [];
  const deleteResults: Array<{ city: string; spot: string; reason: string }> = [];

  try {
    const citiesToProcess = ['上海', '北京', '厦门', '成都', '杭州', '西安'];
    const uploadFolder = path.join(process.cwd(), '..', '待上传景点图片');

    for (const city of citiesToProcess) {
      console.log(`\n处理城市: ${city}`);
      console.log('─'.repeat(50));

      const cityFolder = path.join(uploadFolder, city);
      if (!fs.existsSync(cityFolder)) {
        console.log(`⚠️  文件夹不存在，跳过`);
        continue;
      }

      const spotFolders = fs.readdirSync(cityFolder);

      for (const spotFolderName of spotFolders) {
        const spotFolderPath = path.join(cityFolder, spotFolderName);
        if (!fs.statSync(spotFolderPath).isDirectory()) continue;

        // 读取README获取景点信息
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

        // 检查景点是否存在
        const spot = await prisma.spot.findUnique({
          where: { id: spotId },
          include: { image: true },
        });

        if (!spot) {
          console.log(`⚠️  ${spotName}: 景点不存在 (ID: ${spotId})`);
          continue;
        }

        // 查找图片文件
        const files = fs.readdirSync(spotFolderPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        if (imageFiles.length === 0) {
          // 没有图片，删除景点
          console.log(`🗑️  删除无图片景点: ${spotName}`);
          try {
            await prisma.spot.delete({ where: { id: spotId } });
            deleteResults.push({ city, spot: spotName, reason: '无图片' });
            console.log(`✅ 已删除: ${spotName}`);
          } catch (error: any) {
            console.log(`❌ 删除失败: ${spotName} - ${error.message}`);
          }
        } else {
          // 有图片，上传到Cloudinary
          if (spot.image) {
            console.log(`⚠️  ${spotName}: 已有图片，跳过上传`);
            uploadResults.push({ city, spot: spotName, status: '已有图片' });
            continue;
          }

          const imagePath = path.join(spotFolderPath, imageFiles[0]);
          console.log(`📤 上传: ${spotName}...`);

          try {
            // 上传到Cloudinary
            const uploadResult = await cloudinary.uploader.upload(imagePath, {
              folder: 'spot-images',
              resource_type: 'image',
            });

            // 创建SpotImage记录
            await prisma.spotImage.create({
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

            uploadResults.push({ city, spot: spotName, status: '上传成功' });
            console.log(`✅ 上传成功: ${spotName}`);
            console.log(`   URL: ${uploadResult.secure_url}`);
          } catch (error: any) {
            uploadResults.push({ city, spot: spotName, status: `失败: ${error.message}` });
            console.log(`❌ 上传失败: ${spotName} - ${error.message}`);
          }
        }
      }
    }

    // 生成报告
    console.log('\n\n=== 处理完成 ===');
    console.log(`上传成功: ${uploadResults.filter(r => r.status === '上传成功').length}个`);
    console.log(`删除景点: ${deleteResults.length}个`);

    const reportPath = path.join(process.cwd(), '..', '图片上传修复报告.md');
    let report = `# 图片上传修复报告\n\n`;
    report += `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `**上传成功**: ${uploadResults.filter(r => r.status === '上传成功').length}个\n\n`;
    report += `**删除景点**: ${deleteResults.length}个\n\n`;
    report += `---\n\n`;

    report += `## 上传结果\n\n`;
    for (const result of uploadResults) {
      report += `- ${result.city} - ${result.spot}: ${result.status}\n`;
    }

    report += `\n## 删除结果\n\n`;
    for (const result of deleteResults) {
      report += `- ${result.city} - ${result.spot}: ${result.reason}\n`;
    }

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log('\n✅ 报告已保存到 图片上传修复报告.md');

  } catch (error) {
    console.error('❌ 处理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadImagesFromFolders();

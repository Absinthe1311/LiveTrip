/**
 * 批量上传景点图片到 Cloudinary 并更新数据库
 *
 * 功能：
 * 1. 遍历 image_processed 文件夹的所有景点图片
 * 2. 将图片上传到 Cloudinary
 * 3. 更新数据库对应景点的封面图字段
 * 4. 输出每条记录的处理结果
 */
import * as fs from 'fs';
import * as path from 'path';
import { getPrismaClient } from '../src/lib/prisma';
import { cloudinaryService } from '../src/services/cloudinaryService';
import { initCloudinary } from '../src/config/cloudinary';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 初始化 Cloudinary
initCloudinary();

const prisma = getPrismaClient();

// 统计信息
interface UploadStats {
  total: number;
  success: number;
  failed: number;
  notFound: number;
  skipped: number;
  errors: Array<{ spotName: string; city: string; error: string }>;
}

const stats: UploadStats = {
  total: 0,
  success: 0,
  failed: 0,
  notFound: 0,
  skipped: 0,
  errors: []
};

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始批量上传景点图片...\n');

  try {
    // 1. 遍历所有城市文件夹
    const imageProcessedPath = path.join(process.cwd(), '../image_processed');
    
    if (!fs.existsSync(imageProcessedPath)) {
      console.error('❌ image_processed 文件夹不存在:', imageProcessedPath);
      return;
    }

    const cityFolders = fs.readdirSync(imageProcessedPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log(`📁 找到 ${cityFolders.length} 个城市文件夹\n`);

    // 2. 遍历每个城市的景点
    for (const city of cityFolders) {
      console.log(`\n📍 处理城市: ${city}`);
      console.log('='.repeat(50));

      const cityPath = path.join(imageProcessedPath, city);
      const spotFolders = fs.readdirSync(cityPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      console.log(`   找到 ${spotFolders.length} 个景点文件夹`);

      // 3. 处理每个景点
      for (const spotName of spotFolders) {
        stats.total++;
        await processSpotImage(city, spotName, cityPath);
      }
    }

    // 4. 输出统计信息
    printStats();

  } catch (error) {
    console.error('❌ 批量上传失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 处理单个景点的图片
 */
async function processSpotImage(city: string, spotName: string, cityPath: string) {
  try {
    const spotPath = path.join(cityPath, spotName);
    const imageFiles = fs.readdirSync(spotPath);

    // 查找图片文件
    const imageFile = imageFiles.find(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    if (!imageFile) {
      console.log(`   ⚠️  ${spotName} - 未找到图片文件`);
      stats.skipped++;
      return;
    }

    // 规范化城市名称（处理"上海市" -> "上海"的情况）
    const normalizedCity = city.replace(/市$/, '');

    // 检查数据库中是否存在该景点（尝试两种城市名称）
    let spot = await prisma.spot.findFirst({
      where: {
        name: spotName,
        city: city,
      },
    });

    // 如果没找到，尝试使用去除"市"字的城市名称
    if (!spot && city !== normalizedCity) {
      spot = await prisma.spot.findFirst({
        where: {
          name: spotName,
          city: normalizedCity,
        },
      });
    }

    if (!spot) {
      console.log(`   ❌ ${spotName} - 数据库中未找到对应景点`);
      stats.notFound++;
      stats.errors.push({
        spotName,
        city,
        error: '数据库中未找到对应景点'
      });
      return;
    }

    // 检查是否已有封面图（admin approved）
    const existingImage = await prisma.spotImage.findFirst({
      where: {
        spotId: spot.id,
        source: 'admin',
        status: 'approved',
      },
    });

    if (existingImage) {
      console.log(`   ⏭️  ${spotName} - 已有管理员图片，跳过`);
      stats.skipped++;
      return;
    }

    // 读取图片文件
    const imagePath = path.join(spotPath, imageFile);
    const imageBuffer = fs.readFileSync(imagePath);

    console.log(`   📤 ${spotName} - 开始上传...`);

    // 上传到 Cloudinary
    const uploadResult = await cloudinaryService.uploadImage(
      imageBuffer,
      'spot-images',
      { width: 1200, quality: 85 }
    );

    // 删除旧的图片记录（如果有）
    await prisma.spotImage.deleteMany({
      where: {
        spotId: spot.id,
        source: 'admin',
      },
    });

    // 查找管理员用户ID
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'admin',
      },
    });

    if (!adminUser) {
      console.log(`   ❌ ${spotName} - 未找到管理员用户`);
      stats.failed++;
      stats.errors.push({
        spotName,
        city,
        error: '未找到管理员用户'
      });
      return;
    }

    // 创建新的图片记录
    await prisma.spotImage.create({
      data: {
        spotId: spot.id,
        url: uploadResult.cloudinaryUrl,
        source: 'admin',
        status: 'approved',
        priority: 10,
        isPrimary: true,
        uploadedBy: adminUser.id,
        fileHash: '',
        viewCount: 0,
        likeCount: 0,
        reportCount: 0,
      },
    });

    console.log(`   ✅ ${spotName} - 上传成功`);
    stats.success++;

  } catch (error: any) {
    console.error(`   ❌ ${spotName} - 上传失败:`, error.message);
    stats.failed++;
    stats.errors.push({
      spotName,
      city,
      error: error.message
    });
  }
}

/**
 * 打印统计信息
 */
function printStats() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 上传统计');
  console.log('='.repeat(50));
  console.log(`   总计: ${stats.total}`);
  console.log(`   ✅ 成功: ${stats.success}`);
  console.log(`   ❌ 失败: ${stats.failed}`);
  console.log(`   ⚠️  未找到: ${stats.notFound}`);
  console.log(`   ⏭️  跳过: ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ 错误详情:');
    stats.errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ${err.spotName} (${err.city}): ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 批量上传完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { main };

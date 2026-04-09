// 批量上传景点图片 - 从 image_processed 文件夹
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getPrismaClient } from '../src/lib/prisma';
import { cloudinaryService } from '../src/services/cloudinaryService';
import { amapService } from '../src/services/amapService';
import { generateFileHash } from '../src/utils/hashGenerator';
import { initCloudinary } from '../src/config/cloudinary';

// 加载环境变量
dotenv.config();

// 初始化Cloudinary
initCloudinary();

const prisma = getPrismaClient();
const amap = amapService();

// 图片文件夹路径
const IMAGE_ROOT = path.join(__dirname, '../../image_processed');

// 管理员用户ID（需要先查询）
const ADMIN_USERNAME = '666';
const ADMIN_PASSWORD = '666666';

// 城市名称映射（处理"厦门"和"厦门市"的问题）
const CITY_NAME_MAP: Record<string, string> = {
  '北京市': '北京',
  '上海市': '上海',
  '厦门市': '厦门',
  '成都市': '成都',
  '杭州市': '杭州',
  '西安市': '西安',
  '三亚市': '三亚',
  '丽江市': '丽江',
  '武汉市': '武汉',
};

// 高德API并发控制
const AMAP_CONCURRENCY_LIMIT = 3;
let amapCurrentCalls = 0;

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带并发控制的高德API调用
 */
async function callAmapWithConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  while (amapCurrentCalls >= AMAP_CONCURRENCY_LIMIT) {
    await delay(100);
  }
  amapCurrentCalls++;
  try {
    return await fn();
  } finally {
    amapCurrentCalls--;
  }
}

/**
 * 模糊匹配景点名称
 */
function fuzzyMatchSpotName(imageName: string, spotName: string): boolean {
  // 移除常见后缀
  const cleanImageName = imageName
    .replace(/\.jpg$/i, '')
    .replace(/\.png$/i, '')
    .replace(/\.jpeg$/i, '')
    .replace(/_/g, '')
    .replace(/\s/g, '');

  const cleanSpotName = spotName
    .replace(/_/g, '')
    .replace(/\s/g, '');

  // 完全匹配
  if (cleanImageName === cleanSpotName) {
    return true;
  }

  // 包含匹配
  if (cleanImageName.includes(cleanSpotName) || cleanSpotName.includes(cleanImageName)) {
    return true;
  }

  // 移除城市后缀后匹配（如"故宫博物院_北京" -> "故宫博物院"）
  const imageWithoutCity = cleanImageName.replace(/北京|上海|厦门|成都|杭州|西安|三亚|丽江|武汉/g, '');
  if (imageWithoutCity === cleanSpotName || cleanSpotName.includes(imageWithoutCity)) {
    return true;
  }

  return false;
}

/**
 * 获取或创建景点
 */
async function getOrCreateSpot(
  spotName: string,
  city: string,
  imageName: string
): Promise<string | null> {
  try {
    // 1. 先在数据库中查找
    const normalizedCity = CITY_NAME_MAP[city] || city.replace(/市$/, '');

    // 尝试精确匹配
    let spot = await prisma.spot.findFirst({
      where: {
        name: spotName,
        city: normalizedCity,
      },
    });

    // 尝试模糊匹配
    if (!spot) {
      const allCitySpots = await prisma.spot.findMany({
        where: { city: normalizedCity },
      });

      for (const s of allCitySpots) {
        if (fuzzyMatchSpotName(imageName, s.name)) {
          spot = s;
          break;
        }
      }
    }

    // 2. 如果找到，返回ID
    if (spot) {
      console.log(`  ✅ 找到景点: ${spot.name} (ID: ${spot.id})`);
      return spot.id;
    }

    // 3. 如果没找到，从高德API获取
    console.log(`  ⚠️  数据库中未找到景点: ${spotName}，尝试从高德API获取...`);

    const attractions = await callAmapWithConcurrency(() =>
      amap.getAttractions(normalizedCity, spotName, '110000|140000', 5)
    );

    if (attractions && attractions.length > 0) {
      // 找到最匹配的景点
      const matchedAttraction = attractions.find((a) =>
        fuzzyMatchSpotName(imageName, a.name)
      ) || attractions[0];

      // 创建景点记录
      const newSpot = await prisma.spot.create({
        data: {
          amapId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: matchedAttraction.name,
          location: matchedAttraction.location,
          address: matchedAttraction.address || '',
          city: normalizedCity,
          category: matchedAttraction.type || '景点',
          rating: matchedAttraction.rating || 4.5,
          isHot: true,
          source: 'amap',
        },
      });

      console.log(`  ✅ 从高德API创建景点: ${newSpot.name} (ID: ${newSpot.id})`);
      return newSpot.id;
    }

    console.log(`  ❌ 高德API也未找到景点: ${spotName}`);
    return null;
  } catch (error) {
    console.error(`  ❌ 获取/创建景点失败: ${spotName}`, error);
    return null;
  }
}

/**
 * 上传单个图片
 */
async function uploadImage(
  spotId: string,
  imagePath: string,
  userId: string
): Promise<boolean> {
  try {
    // 读取图片文件
    const fileBuffer = fs.readFileSync(imagePath);
    const fileHash = generateFileHash(fileBuffer);

    // 检查是否已上传
    const existingImage = await prisma.spotImage.findFirst({
      where: {
        spotId,
        fileHash,
      },
    });

    if (existingImage) {
      console.log(`    ⏭️  图片已存在，跳过: ${path.basename(imagePath)}`);
      return true;
    }

    // 上传到Cloudinary
    const cloudinaryResult = await cloudinaryService.uploadImage(
      fileBuffer,
      'spot-images'
    );

    // 创建数据库记录
    await prisma.spotImage.create({
      data: {
        spotId,
        url: cloudinaryResult.cloudinaryUrl,
        source: 'admin',
        status: 'approved',
        priority: 10,
        isPrimary: false,
        fileHash,
        uploadedBy: userId,
      },
    });

    console.log(`    ✅ 上传成功: ${path.basename(imagePath)}`);
    return true;
  } catch (error) {
    console.error(`    ❌ 上传失败: ${path.basename(imagePath)}`, error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始批量上传景点图片...\n');

  // 1. 获取管理员用户ID
  const adminUser = await prisma.user.findFirst({
    where: {
      username: ADMIN_USERNAME,
    },
  });

  if (!adminUser) {
    console.error('❌ 未找到管理员用户，请先创建用户名为 666 的管理员账号');
    process.exit(1);
  }

  console.log(`✅ 找到管理员用户: ${adminUser.username} (ID: ${adminUser.id})\n`);

  // 2. 遍历城市文件夹
  const cities = fs.readdirSync(IMAGE_ROOT).filter((name) => {
    const stat = fs.statSync(path.join(IMAGE_ROOT, name));
    return stat.isDirectory();
  });

  console.log(`📁 找到 ${cities.length} 个城市文件夹:\n`);
  cities.forEach((city) => console.log(`  - ${city}`));
  console.log('');

  // 3. 处理每个城市
  const stats = {
    totalSpots: 0,
    successSpots: 0,
    failedSpots: 0,
    totalImages: 0,
    successImages: 0,
    failedImages: 0,
  };

  for (const city of cities) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏙️  处理城市: ${city}`);
    console.log('='.repeat(60));

    const cityPath = path.join(IMAGE_ROOT, city);
    const spotFolders = fs.readdirSync(cityPath).filter((name) => {
      const stat = fs.statSync(path.join(cityPath, name));
      return stat.isDirectory();
    });

    console.log(`📂 找到 ${spotFolders.length} 个景点文件夹\n`);

    for (const spotFolder of spotFolders) {
      stats.totalSpots++;
      console.log(`\n📍 处理景点: ${spotFolder}`);

      const spotPath = path.join(cityPath, spotFolder);
      const imageFiles = fs.readdirSync(spotPath).filter((name) => {
        return /\.(jpg|jpeg|png)$/i.test(name);
      });

      if (imageFiles.length === 0) {
        console.log(`  ⚠️  没有找到图片文件，跳过`);
        stats.failedSpots++;
        continue;
      }

      // 获取或创建景点
      const spotId = await getOrCreateSpot(spotFolder, city, spotFolder);

      if (!spotId) {
        console.log(`  ❌ 无法获取景点ID，跳过`);
        stats.failedSpots++;
        continue;
      }

      // 上传图片
      let spotSuccess = true;
      for (const imageFile of imageFiles) {
        stats.totalImages++;
        const imagePath = path.join(spotPath, imageFile);
        const success = await uploadImage(spotId, imagePath, adminUser.id);

        if (success) {
          stats.successImages++;
        } else {
          stats.failedImages++;
          spotSuccess = false;
        }
      }

      if (spotSuccess) {
        stats.successSpots++;
      } else {
        stats.failedSpots++;
      }

      // 延迟一下，避免API限流
      await delay(200);
    }
  }

  // 4. 输出统计信息
  console.log('\n' + '='.repeat(60));
  console.log('📊 上传完成统计');
  console.log('='.repeat(60));
  console.log(`景点统计:`);
  console.log(`  - 总数: ${stats.totalSpots}`);
  console.log(`  - 成功: ${stats.successSpots}`);
  console.log(`  - 失败: ${stats.failedSpots}`);
  console.log(`图片统计:`);
  console.log(`  - 总数: ${stats.totalImages}`);
  console.log(`  - 成功: ${stats.successImages}`);
  console.log(`  - 失败: ${stats.failedImages}`);
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});

// 数据恢复备份脚本 - 保存最新恢复的完整数据
// 这个脚本用于备份当前恢复后的完整数据库
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function createDataRecoveryBackup() {
  try {
    console.log('🔧 开始创建数据恢复备份...\n');

    const backupDir = join(process.cwd(), '..', 'data-backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupInfo = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      description: '完整数据恢复备份 - 包含所有景点、用户、行程和图片数据',
      statistics: {} as any
    };

    // 收集数据库统计信息
    console.log('📊 收集数据库统计信息...');

    const spotCount = await prisma.spot.count();
    const userCount = await prisma.user.count();
    const tripCount = await prisma.trip.count();
    const favoriteCount = await prisma.favorite.count();
    const imageCount = await prisma.spotImage.count();

    // 按城市统计景点
    const cityStats = await prisma.spot.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // 热门景点统计
    const hotSpotCount = await prisma.spot.count({
      where: { isHot: true }
    });

    backupInfo.statistics = {
      spots: spotCount,
      users: userCount,
      trips: tripCount,
      favorites: favoriteCount,
      images: imageCount,
      hotSpots: hotSpotCount,
      cities: cityStats.map(stat => ({
        city: stat.city,
        count: stat._count.id
      }))
    };

    console.log('📍 数据库统计:');
    console.log(`   - 景点总数: ${spotCount}`);
    console.log(`   - 热门景点: ${hotSpotCount}`);
    console.log(`   - 用户总数: ${userCount}`);
    console.log(`   - 行程总数: ${tripCount}`);
    console.log(`   - 收藏总数: ${favoriteCount}`);
    console.log(`   - 图片总数: ${imageCount}`);

    console.log('\n🏙️  城市分布:');
    backupInfo.statistics.cities.forEach((city: any) => {
      console.log(`   - ${city.city}: ${city.count} 个景点`);
    });

    // 保存备份信息
    const backupInfoPath = join(backupDir, `backup-info-${timestamp}.json`);
    writeFileSync(backupInfoPath, JSON.stringify(backupInfo, null, 2), 'utf-8');
    console.log(`\n✅ 备份信息已保存到: ${backupInfoPath}`);

    // 复制数据库文件
    const dbSourcePath = join(process.cwd(), '..', 'prisma', 'dev.db');
    const dbBackupPath = join(backupDir, `dev.db-${timestamp}.db`);

    const fs = require('fs');
    fs.copyFileSync(dbSourcePath, dbBackupPath);
    console.log(`✅ 数据库文件已备份到: ${dbBackupPath}`);

    console.log('\n🎉 数据恢复备份创建完成！');
    console.log(`\n📁 备份文件位置: ${backupDir}`);
    console.log(`\n📝 如需恢复数据，请执行以下步骤:`);
    console.log(`   1. 停止后端服务`);
    console.log(`   2. 将备份的数据库文件复制到 backend/prisma/dev.db`);
    console.log(`   3. 运行 npm run prisma:migrate 确保数据库结构同步`);
    console.log(`   4. 重启后端服务`);

  } catch (error) {
    console.error('❌ 创建备份时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDataRecoveryBackup();

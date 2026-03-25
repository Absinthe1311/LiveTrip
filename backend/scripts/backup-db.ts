/**
 * 数据库备份脚本
 * 将当前数据库导出为JSON格式，便于版本控制和恢复
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('🔄 开始备份数据库...');

  try {
    // 备份所有表的数据
    const backup: any = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tables: {}
    };

    // 获取所有模型名称
    const models = [
      'User',
      'UserPreferences',
      'Trip',
      'Day',
      'ItineraryItem',
      'Budget',
      'PackingItem',
      'Spot',
      'SpotIoTData',
      'SpotImage',
      'Review',
      'ReviewImage',
      'ReviewLike',
      'SpotAlternative',
      'Favorite',
      'DestinationCache',
      'LocationCache',
      'AmapPOICache',
      'BlogPost',
      'BlogComment',
      'BlogCommentLike',
      'BlogLike',
      'Hotel',
      'Restaurant'
    ];

    // 备份每个表的数据
    for (const model of models) {
      console.log(`📦 备份表: ${model}`);
      // @ts-ignore
      const data = await prisma[model].findMany();
      backup.tables[model] = data;
      console.log(`✅ ${model}: ${data.length} 条记录`);
    }

    // 创建备份目录
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 生成备份文件名
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `backup_${dateStr}_${timeStr}.json`;
    const filepath = path.join(backupDir, filename);

    // 写入备份文件
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

    console.log(`✅ 备份完成: ${filepath}`);
    console.log(`📊 备份统计:`);

    // 显示统计信息
    let totalRecords = 0;
    for (const model of models) {
      const count = backup.tables[model].length;
      totalRecords += count;
      if (count > 0) {
        console.log(`   ${model}: ${count} 条`);
      }
    }
    console.log(`   总计: ${totalRecords} 条记录`);

    // 保留最近7天的备份
    cleanupOldBackups(backupDir);

    return filepath;
  } catch (error) {
    console.error('❌ 备份失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 清理旧备份文件，保留最近7天
 */
function cleanupOldBackups(backupDir: string) {
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      if (file.startsWith('backup_') && file.endsWith('.json')) {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > sevenDaysMs) {
          fs.unlinkSync(filepath);
          console.log(`🗑️  删除旧备份: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('⚠️  清理旧备份失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  backupDatabase()
    .then(() => {
      console.log('🎉 备份操作完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 备份操作失败:', error);
      process.exit(1);
    });
}

export { backupDatabase };

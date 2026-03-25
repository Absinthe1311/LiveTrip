/**
 * 数据库恢复脚本
 * 从JSON备份文件恢复数据库
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restoreDatabase(backupFile: string, tables?: string[]) {
  console.log('🔄 开始恢复数据库...');

  try {
    // 读取备份文件
    const filepath = path.resolve(backupFile);
    if (!fs.existsSync(filepath)) {
      throw new Error(`备份文件不存在: ${filepath}`);
    }

    console.log(`📂 读取备份文件: ${filepath}`);
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log(`📋 备份信息:`);
    console.log(`   版本: ${backupData.version}`);
    console.log(`   时间: ${backupData.timestamp}`);

    // 恢复数据
    const tablesToRestore = tables || Object.keys(backupData.tables);
    let totalRestored = 0;

    for (const tableName of tablesToRestore) {
      if (!backupData.tables[tableName]) {
        console.log(`⚠️  表 ${tableName} 不在备份中，跳过`);
        continue;
      }

      const records = backupData.tables[tableName];
      if (records.length === 0) {
        console.log(`⚠️  表 ${tableName} 没有数据，跳过`);
        continue;
      }

      console.log(`📥 恢复表: ${tableName} (${records.length} 条记录)`);

      try {
        // 清空表（如果需要）
        if (tables) {
          // @ts-ignore
          await prisma[tableName].deleteMany({});
        }

        // 插入数据
        // @ts-ignore
        await prisma[tableName].createMany({
          data: records,
          skipDuplicates: true
        });

        totalRestored += records.length;
        console.log(`✅ ${tableName}: 恢复 ${records.length} 条记录`);
      } catch (error: any) {
        console.error(`❌ 恢复表 ${tableName} 失败:`, error.message);
        // 继续恢复其他表
      }
    }

    console.log(`✅ 恢复完成: 共恢复 ${totalRestored} 条记录`);
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 列出所有可用的备份文件
 */
function listBackups() {
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    console.log('⚠️  备份目录不存在');
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
    .sort()
    .reverse();

  console.log('📋 可用的备份文件:');
  files.forEach((file, index) => {
    const filepath = path.join(backupDir, file);
    const stats = fs.statSync(filepath);
    const size = (stats.size / 1024).toFixed(2);
    const mtime = stats.mtime.toLocaleString('zh-CN');
    console.log(`   ${index + 1}. ${file} (${size} KB, ${mtime})`);
  });

  return files;
}

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('用法:');
    console.log('  列出备份: npm run restore:db -- --list');
    console.log('  恢复备份: npm run restore:db -- <备份文件路径> [表名1,表名2,...]');
    console.log('');
    console.log('示例:');
    console.log('  npm run restore:db -- --list');
    console.log('  npm run restore:db -- backups/backup_2026-03-25_18-30-00.json');
    console.log('  npm run restore:db -- backups/backup_2026-03-25_18-30-00.json User,Trip');
    process.exit(0);
  }

  if (args[0] === '--list') {
    listBackups();
    process.exit(0);
  }

  const backupFile = args[0];
  const tables = args[1] ? args[1].split(',') : undefined;

  restoreDatabase(backupFile, tables)
    .then(() => {
      console.log('🎉 恢复操作完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 恢复操作失败:', error);
      process.exit(1);
    });
}

export { restoreDatabase, listBackups };

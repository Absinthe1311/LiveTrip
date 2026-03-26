// 手动添加天气相关字段到 SpotIoTData 表
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWeatherFields() {
  try {
    console.log('🔄 开始添加天气字段...');

    // 使用 Prisma 的 $executeRawUnsafe 执行 SQL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SpotIoTData" ADD COLUMN "weatherDescription" TEXT DEFAULT ''
    `);
    console.log('✅ 添加 weatherDescription 字段成功');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  weatherDescription 字段已存在，跳过');
    } else {
      console.error('❌ 添加 weatherDescription 字段失败:', error.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SpotIoTData" ADD COLUMN "weatherIcon" TEXT DEFAULT ''
    `);
    console.log('✅ 添加 weatherIcon 字段成功');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  weatherIcon 字段已存在，跳过');
    } else {
      console.error('❌ 添加 weatherIcon 字段失败:', error.message);
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SpotIoTData" ADD COLUMN "weatherUpdatedAt" DATETIME
    `);
    console.log('✅ 添加 weatherUpdatedAt 字段成功');
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️  weatherUpdatedAt 字段已存在，跳过');
    } else {
      console.error('❌ 添加 weatherUpdatedAt 字段失败:', error.message);
    }
  }

  console.log('🎉 天气字段添加完成！');
}

addWeatherFields()
  .then(() => {
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error);
    prisma.$disconnect();
    process.exit(1);
  });

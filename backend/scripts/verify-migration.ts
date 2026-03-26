// 验证数据库迁移是否成功
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('🔍 验证数据库迁移...');

    // 检查 SpotIoTData 表的结构
    const tableInfo = await prisma.$queryRaw`
      PRAGMA table_info(SpotIoTData)
    `;

    console.log('\n📋 SpotIoTData 表结构:');
    console.table(tableInfo);

    // 检查新字段是否存在
    const newFields = ['weatherDescription', 'weatherIcon', 'weatherUpdatedAt'];
    const existingFields = (tableInfo as any[]).map((row: any) => row.name);

    console.log('\n✅ 新字段检查:');
    newFields.forEach(field => {
      const exists = existingFields.includes(field);
      console.log(`   ${field}: ${exists ? '✓ 存在' : '✗ 不存在'}`);
    });

    // 尝试查询一条数据（如果有）
    const sampleData = await prisma.spotIoTData.findFirst();
    if (sampleData) {
      console.log('\n📊 示例数据:');
      console.log(JSON.stringify(sampleData, null, 2));
    } else {
      console.log('\n⚠️  表中暂无数据');
    }

    console.log('\n🎉 迁移验证完成！');
  } catch (error: any) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();

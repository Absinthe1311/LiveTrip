import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('清理DestinationCache缓存');
  console.log('========================================\n');

  try {
    // 查看当前缓存数量
    const beforeCount = await prisma.destinationCache.count();
    console.log(`当前缓存数量: ${beforeCount} 条\n`);

    // 清理所有缓存
    const result = await prisma.destinationCache.deleteMany({});

    console.log(`✅ 成功删除 ${result.count} 条缓存记录\n`);

    // 查看Spot表数据（不会被删除）
    const spotCount = await prisma.spot.count();
    const spotWithDesc = await prisma.spot.count({
      where: {
        NOT: [
          { description: null },
          { description: '' }
        ]
      }
    });

    console.log('========================================');
    console.log('Spot表数据统计（未被删除）');
    console.log('========================================');
    console.log(`总景点数: ${spotCount}`);
    console.log(`有description的景点数: ${spotWithDesc}`);
    console.log(`无description的景点数: ${spotCount - spotWithDesc}\n`);

    console.log('========================================');
    console.log('清理完成');
    console.log('========================================');
    console.log('下次访问目的地详情页时，将从数据库获取最新数据');
    console.log('数据库中的景点数据和description不会被删除\n');

  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

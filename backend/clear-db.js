const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 清空数据库 ===');

    await prisma.spotIoTData.deleteMany({});
    console.log('✅ 清空 SpotIoTData 表');

    await prisma.spot.deleteMany({});
    console.log('✅ 清空 Spot 表');

    console.log('\n数据库已清空');
    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();

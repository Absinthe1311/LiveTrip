const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 清空备选关系表 ===');

    await prisma.spotAlternative.deleteMany({});
    console.log('✅ 清空 SpotAlternative 表');

    console.log('\n备选关系表已清空');
    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();

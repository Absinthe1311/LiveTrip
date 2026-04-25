const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAlternatives() {
  try {
    const result = await prisma.spotAlternative.deleteMany({});
    console.log(`✅ 已删除 ${result.count} 条备选关系记录`);
    console.log('💡 新方案不需要预存备选关系，运行时动态生成');
  } catch (error) {
    console.error('❌ 删除失败：', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAlternatives();

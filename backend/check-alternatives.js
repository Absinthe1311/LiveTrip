const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 查询备选关系 ===');

    const alternatives = await prisma.spotAlternative.findMany();
    console.log('\n备选关系记录数:', alternatives.length);
    
    if (alternatives.length > 0) {
      console.log('\n备选关系列表:');
      alternatives.forEach(alt => {
        console.log(`  - ${alt.originalSpotId} -> ${alt.alternativeSpotId} (优先级: ${alt.priority})`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();

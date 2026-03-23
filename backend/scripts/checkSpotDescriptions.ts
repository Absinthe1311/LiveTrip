import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.spot.count();
  const withDesc = await prisma.spot.count({
    where: {
      NOT: [
        { description: null },
        { description: '' }
      ]
    }
  });
  const withoutDesc = total - withDesc;

  console.log('========================================');
  console.log('景点简介统计');
  console.log('========================================');
  console.log(`总景点数: ${total}`);
  console.log(`有简介的景点数: ${withDesc}`);
  console.log(`无简介的景点数: ${withoutDesc}`);
  console.log('========================================\n');

  // 显示几个示例
  const samples = await prisma.spot.findMany({
    where: {
      NOT: [
        { description: null },
        { description: '' }
      ]
    },
    take: 5,
  });

  console.log('示例简介:');
  samples.forEach((spot, i) => {
    console.log(`\n${i + 1}. ${spot.name}`);
    console.log(`   ${spot.description}`);
  });

  await prisma.$disconnect();
}

main();

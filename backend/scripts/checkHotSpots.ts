import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('检查数据库中的热门景点数据');
  console.log('========================================\n');

  // 查询热门景点
  const spots = await prisma.spot.findMany({
    where: {
      isHot: true
    },
    take: 10,
    select: {
      name: true,
      category: true,
      description: true,
      city: true,
      amapId: true
    }
  });

  console.log(`找到 ${spots.length} 个热门景点\n`);

  spots.forEach((spot, index) => {
    console.log(`--- 景点 ${index + 1} ---`);
    console.log(`名称: ${spot.name}`);
    console.log(`城市: ${spot.city}`);
    console.log(`分类: ${spot.category || '无'}`);
    console.log(`描述: ${spot.description || '无'}`);
    console.log(`amapId: ${spot.amapId}\n`);
  });

  // 统计信息
  const totalHotSpots = await prisma.spot.count({
    where: { isHot: true }
  });

  const hotSpotsWithDesc = await prisma.spot.count({
    where: {
      isHot: true,
      NOT: [
        { description: null },
        { description: '' }
      ]
    }
  });

  console.log('========================================');
  console.log('统计信息');
  console.log('========================================');
  console.log(`热门景点总数: ${totalHotSpots}`);
  console.log(`有description的热门景点: ${hotSpotsWithDesc}`);
  console.log(`无description的热门景点: ${totalHotSpots - hotSpotsWithDesc}\n`);

  await prisma.$disconnect();
}

main();

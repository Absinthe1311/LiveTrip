import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('检查数据库中所有景点的description情况');
  console.log('========================================\n');

  // 统计所有景点
  const totalSpots = await prisma.spot.count();
  console.log(`总景点数: ${totalSpots}\n`);

  // 统计有description的景点
  const spotsWithDesc = await prisma.spot.count({
    where: {
      NOT: [
        { description: null },
        { description: '' }
      ]
    }
  });
  console.log(`有description的景点数: ${spotsWithDesc}`);

  // 统计无description的景点
  const spotsWithoutDesc = totalSpots - spotsWithDesc;
  console.log(`无description的景点数: ${spotsWithoutDesc}\n`);

  // 按城市统计
  const cities = await prisma.spot.groupBy({
    by: ['city'],
    _count: {
      id: true
    }
  });

  console.log('========================================');
  console.log('按城市统计');
  console.log('========================================');

  for (const city of cities) {
    const withDesc = await prisma.spot.count({
      where: {
        city: city.city,
        NOT: [
          { description: null },
          { description: '' }
        ]
      }
    });
    const withoutDesc = city._count.id - withDesc;
    console.log(`${city.city}: 总数=${city._count.id}, 有desc=${withDesc}, 无desc=${withoutDesc}`);
  }

  // 查看无description的景点示例
  if (spotsWithoutDesc > 0) {
    console.log('\n========================================');
    console.log('无description的景点示例（前10个）');
    console.log('========================================');

    const sampleSpots = await prisma.spot.findMany({
      where: {
        OR: [
          { description: null },
          { description: '' }
        ]
      },
      take: 10,
      select: {
        name: true,
        city: true,
        category: true,
        description: true
      }
    });

    sampleSpots.forEach((spot, index) => {
      console.log(`${index + 1}. ${spot.name} (${spot.city}) - 分类: ${spot.category || '无'}`);
    });
  }

  await prisma.$disconnect();
}

main();

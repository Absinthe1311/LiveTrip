import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBeijingSpots() {
  console.log('检查北京景点数据...\n');

  // 总数统计
  const total = await prisma.spot.count({
    where: { city: '北京' },
  });

  const hot = await prisma.spot.count({
    where: { city: '北京', isHot: true },
  });

  const withImage = await prisma.spot.count({
    where: {
      city: '北京',
      image: { isNot: null },
    },
  });

  const withoutImage = await prisma.spot.count({
    where: {
      city: '北京',
      image: null,
    },
  });

  console.log('北京景点统计:');
  console.log('─'.repeat(50));
  console.log(`总数: ${total}个`);
  console.log(`热门景点: ${hot}个`);
  console.log(`有图片: ${withImage}个`);
  console.log(`无图片: ${withoutImage}个`);
  console.log();

  // 获取所有北京景点
  const allSpots = await prisma.spot.findMany({
    where: { city: '北京' },
    include: { image: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n所有北京景点列表:');
  console.log('─'.repeat(50));

  allSpots.forEach((spot, index) => {
    const hotTag = spot.isHot ? '🔥' : '  ';
    const imageTag = spot.image ? '📷' : '❌';
    console.log(`${index + 1}. ${hotTag} ${imageTag} ${spot.name} (${spot.category || '未分类'})`);
  });

  await prisma.$disconnect();
}

checkBeijingSpots();

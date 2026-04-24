import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkChengduSpots() {
  console.log('检查成都景点数据...\n');

  // 总数统计
  const total = await prisma.spot.count({
    where: { city: '成都' },
  });

  const hot = await prisma.spot.count({
    where: { city: '成都', isHot: true },
  });

  const notHot = await prisma.spot.count({
    where: { city: '成都', isHot: false },
  });

  const withImage = await prisma.spot.count({
    where: {
      city: '成都',
      image: { isNot: null },
    },
  });

  console.log('成都景点统计:');
  console.log('─'.repeat(50));
  console.log(`总数: ${total}个`);
  console.log(`热门景点(isHot=true): ${hot}个`);
  console.log(`非热门景点(isHot=false): ${notHot}个`);
  console.log(`有图片: ${withImage}个`);
  console.log();

  // 获取热门景点
  const hotSpots = await prisma.spot.findMany({
    where: { city: '成都', isHot: true },
    include: { image: true },
    orderBy: { rating: 'desc' },
    take: 10,
  });

  console.log('\n热门景点前10个:');
  console.log('─'.repeat(50));
  hotSpots.forEach((spot, index) => {
    const imageTag = spot.image ? '📷' : '❌';
    console.log(`${index + 1}. ${imageTag} ${spot.name} (${spot.category || '未分类'})`);
  });

  // 获取非热门景点
  const notHotSpots = await prisma.spot.findMany({
    where: { city: '成都', isHot: false },
    include: { image: true },
    orderBy: { rating: 'desc' },
    take: 10,
  });

  console.log('\n非热门景点前10个:');
  console.log('─'.repeat(50));
  notHotSpots.forEach((spot, index) => {
    const imageTag = spot.image ? '📷' : '❌';
    console.log(`${index + 1}. ${imageTag} ${spot.name} (${spot.category || '未分类'})`);
  });

  await prisma.$disconnect();
}

checkChengduSpots();

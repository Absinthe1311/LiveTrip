import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDisplay() {
  console.log('测试展示效果...\n');

  // 测试北京
  console.log('北京:');
  console.log('─'.repeat(50));

  // 首页展示（9个热门）
  const hotSpots = await prisma.spot.findMany({
    where: {
      city: '北京',
      isHot: true,
    },
    orderBy: { rating: 'desc' },
    take: 9,
  });

  console.log(`首页展示（热门景点）: ${hotSpots.length}个`);
  hotSpots.forEach((spot, i) => {
    console.log(`  ${i + 1}. ${spot.name} (评分: ${spot.rating})`);
  });

  // 详情页展示（所有有图片的）
  const allSpots = await prisma.spot.findMany({
    where: {
      city: '北京',
      image: { isNot: null },
    },
    orderBy: { rating: 'desc' },
  });

  console.log(`\n详情页展示（所有景点）: ${allSpots.length}个`);
  console.log(`包括: ${hotSpots.length}个热门 + ${allSpots.length - hotSpots.length}个普通`);

  // 成都
  console.log('\n\n成都:');
  console.log('─'.repeat(50));

  const chengduHot = await prisma.spot.findMany({
    where: {
      city: '成都',
      isHot: true,
    },
    orderBy: { rating: 'desc' },
    take: 9,
  });

  console.log(`首页展示（热门景点）: ${chengduHot.length}个`);
  chengduHot.forEach((spot, i) => {
    console.log(`  ${i + 1}. ${spot.name} (评分: ${spot.rating})`);
  });

  const chengduAll = await prisma.spot.findMany({
    where: {
      city: '成都',
      image: { isNot: null },
    },
    orderBy: { rating: 'desc' },
  });

  console.log(`\n详情页展示（所有景点）: ${chengduAll.length}个`);
  console.log(`包括: ${chengduHot.length}个热门 + ${chengduAll.length - chengduHot.length}个普通`);

  await prisma.$disconnect();
}

testDisplay();

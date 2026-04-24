import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateHotSpots() {
  console.log('更新热门景点...\n');

  // 上海：替换热门景点
  console.log('上海热门景点更新:');
  console.log('─'.repeat(50));

  // 将上海人民广场换成豫园
  await prisma.spot.updateMany({
    where: { name: '上海人民广场', city: '上海' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '上海豫园', city: '上海' },
    data: { isHot: true },
  });
  console.log('✅ 上海人民广场 → 上海豫园');

  // 将乍浦路桥换成静安寺
  await prisma.spot.updateMany({
    where: { name: '乍浦路桥', city: '上海' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '静安寺', city: '上海' },
    data: { isHot: true },
  });
  console.log('✅ 乍浦路桥 → 静安寺');

  // 将上海文化广场换成上海城隍庙
  await prisma.spot.updateMany({
    where: { name: '上海文化广场', city: '上海' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '上海城隍庙', city: '上海' },
    data: { isHot: true },
  });
  console.log('✅ 上海文化广场 → 上海城隍庙');

  // 厦门：替换热门景点
  console.log('\n厦门热门景点更新:');
  console.log('─'.repeat(50));

  // 将侨批文化广场换成万石山国家重点风景名胜区
  await prisma.spot.updateMany({
    where: { name: '侨批文化广场', city: '厦门' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '万石山国家重点风景名胜区', city: '厦门' },
    data: { isHot: true },
  });
  console.log('✅ 侨批文化广场 → 万石山国家重点风景名胜区');

  // 将鼓浪屿管风琴艺术中心换成厦门海上明珠塔
  await prisma.spot.updateMany({
    where: { name: '鼓浪屿管风琴艺术中心', city: '厦门' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '厦门海上明珠塔', city: '厦门' },
    data: { isHot: true },
  });
  console.log('✅ 鼓浪屿管风琴艺术中心 → 厦门海上明珠塔');

  // 将钢琴码头换成厦门世茂双子塔
  await prisma.spot.updateMany({
    where: { name: '钢琴码头', city: '厦门' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '厦门世茂双子塔', city: '厦门' },
    data: { isHot: true },
  });
  console.log('✅ 钢琴码头 → 厦门世茂双子塔');

  // 将钟鼓索道换成白城沙滩
  await prisma.spot.updateMany({
    where: { name: '钟鼓索道', city: '厦门' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '白城沙滩', city: '厦门' },
    data: { isHot: true },
  });
  console.log('✅ 钟鼓索道 → 白城沙滩');

  // 成都：替换热门景点
  console.log('\n成都热门景点更新:');
  console.log('─'.repeat(50));

  // 将武侯祠锦里古街-阿斗井换成生机之塔
  await prisma.spot.updateMany({
    where: { name: '武侯祠锦里古街-阿斗井', city: '成都' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '生机之塔', city: '成都' },
    data: { isHot: true },
  });
  console.log('✅ 武侯祠锦里古街-阿斗井 → 生机之塔');

  // 杭州：替换热门景点
  console.log('\n杭州热门景点更新:');
  console.log('─'.repeat(50));

  // 将雷峰塔景区换成钱江世纪公园
  await prisma.spot.updateMany({
    where: { name: '雷峰塔景区', city: '杭州' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '钱江世纪公园', city: '杭州' },
    data: { isHot: true },
  });
  console.log('✅ 雷峰塔景区 → 钱江世纪公园');

  // 西安：替换热门景点
  console.log('\n西安热门景点更新:');
  console.log('─'.repeat(50));

  // 将高家大院换成大慈恩寺
  await prisma.spot.updateMany({
    where: { name: '高家大院', city: '西安' },
    data: { isHot: false },
  });
  await prisma.spot.updateMany({
    where: { name: '大慈恩寺', city: '西安' },
    data: { isHot: true },
  });
  console.log('✅ 高家大院 → 大慈恩寺');

  // 验证更新结果
  console.log('\n\n验证热门景点:');
  console.log('─'.repeat(50));

  const cities = ['上海', '厦门', '成都', '杭州', '西安'];

  for (const city of cities) {
    const hotSpots = await prisma.spot.findMany({
      where: { city, isHot: true },
      orderBy: { rating: 'desc' },
      take: 9,
    });

    console.log(`\n${city}热门景点 (${hotSpots.length}个):`);
    hotSpots.forEach((spot, i) => {
      console.log(`  ${i + 1}. ${spot.name}`);
    });
  }

  await prisma.$disconnect();
}

updateHotSpots();

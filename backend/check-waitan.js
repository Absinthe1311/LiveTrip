const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // 查询外滩景点
    const spot = await prisma.spot.findFirst({
      where: { name: '外滩' },
      include: { images: true }
    });

    console.log('=== 外滩景点查询结果 ===');
    console.log('景点信息:', {
      id: spot?.id,
      name: spot?.name,
      city: spot?.city,
      coverImage: spot?.coverImage,
      imageCount: spot?.images.length
    });

    // 查询所有名称包含"外滩"的景点
    const waitanSpots = await prisma.spot.findMany({
      where: {
        name: { contains: '外滩' }
      },
      include: { images: true }
    });

    console.log('\n=== 所有包含"外滩"的景点 ===');
    waitanSpots.forEach(s => {
      console.log(`- ${s.name} (城市: ${s.city}, 图片数: ${s.images.length})`);
    });

  } catch (error) {
    console.error('查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

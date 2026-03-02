const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // 创建上海外滩
    const waitan = await prisma.spot.create({
      data: {
        amapId: 'waitan_shanghai',
        name: '上海外滩',
        location: '121.4944,31.2399',
        address: '上海市黄浦区中山东一路',
        city: '上海',
        category: '风景名胜',
        ticketPrice: 0,
        openTime: '全天开放',
        rating: 4.7,
        description: '上海标志性景点，欣赏黄浦江两岸风光',
        isOutdoor: true,
        source: 'user'
      }
    });
    
    console.log('创建上海外滩成功:', waitan.id);
    
    // 生成IoT数据
    const iotData = await prisma.spotIoTData.create({
      data: {
        spotId: waitan.id,
        crowdLevel: 85,
        temperature: 22.3,
        rainProbability: 45,
        isOpen: true
      }
    });
    
    console.log('生成IoT数据成功:', iotData.id);
    
    // 添加到收藏
    const favorite = await prisma.favorite.create({
      data: {
        spotId: waitan.id,
        userId: 'default-user',
        notes: '上海外滩'
      }
    });
    
    console.log('添加到收藏成功:', favorite.id);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();

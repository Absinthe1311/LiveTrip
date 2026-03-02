const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // 创建故宫博物馆
    const gugong = await prisma.spot.create({
      data: {
        amapId: 'gugong_beijing',
        name: '故宫博物院',
        location: '116.397428,39.918115',
        address: '北京市东城区景山前街4号',
        city: '北京',
        category: '风景名胜',
        ticketPrice: 60,
        openTime: '08:30-17:00',
        rating: 4.8,
        description: '中国明清两代的皇家宫殿，世界文化遗产',
        isOutdoor: false,
        source: 'user'
      }
    });
    
    console.log('创建故宫博物馆成功:', gugong.id);
    
    // 生成IoT数据
    const iotData = await prisma.spotIoTData.create({
      data: {
        spotId: gugong.id,
        crowdLevel: 75,
        temperature: 18.5,
        rainProbability: 25,
        isOpen: true
      }
    });
    
    console.log('生成IoT数据成功:', iotData.id);
    
    // 添加到收藏
    const favorite = await prisma.favorite.create({
      data: {
        spotId: gugong.id,
        userId: 'default-user',
        notes: '故宫博物馆'
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    // 查询有酒店的行程
    const trips = await prisma.trip.findMany({
      where: {
        hotelName: { not: null }
      },
      take: 1,
      include: {
        days: {
          where: {
            restaurantName: { not: null }
          },
          take: 1
        }
      }
    });

    if (trips.length > 0) {
      const trip = trips[0];
      console.log('=== 行程信息 ===');
      console.log('ID:', trip.id);
      console.log('标题:', trip.title);
      console.log('酒店名称:', trip.hotelName);
      console.log('酒店地址:', trip.hotelAddress);
      console.log('酒店位置:', trip.hotelLocation);
      console.log('');

      if (trip.days.length > 0) {
        const day = trip.days[0];
        console.log('=== 第' + day.dayNumber + '天餐厅信息 ===');
        console.log('餐厅名称:', day.restaurantName);
        console.log('餐厅地址:', day.restaurantAddress);
        console.log('餐厅位置:', day.restaurantLocation);
      }
    } else {
      console.log('没有找到包含酒店的行程');
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();

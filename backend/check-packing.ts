import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPackingItems() {
  try {
    // 获取最新的行程
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        packingItems: true
      }
    });

    console.log('=== 最近的行程 ===');
    for (const trip of trips) {
      console.log(`\n行程ID: ${trip.id}`);
      console.log(`目的地: ${trip.destination}`);
      console.log(`创建时间: ${trip.createdAt}`);
      console.log(`打包物品数量: ${trip.packingItems.length}`);
      if (trip.packingItems.length > 0) {
        console.log('打包物品:');
        trip.packingItems.forEach(item => {
          console.log(`  - ${item.itemName} (${item.category}) - ${item.isPacked ? '已打包' : '未打包'}`);
        });
      }
    }

    // 检查所有打包物品
    const allItems = await prisma.packingItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log('\n=== 所有打包物品（最近20个）===');
    console.log(`总数: ${allItems.length}`);
    allItems.forEach(item => {
      console.log(`  - ${item.itemName} (${item.category}) - 行程ID: ${item.tripId} - ${item.isPacked ? '已打包' : '未打包'}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackingItems();

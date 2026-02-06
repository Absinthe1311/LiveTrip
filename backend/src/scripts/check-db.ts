// 检查数据库中的数据
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('📊 检查数据库中的数据...\n');

    // 检查 User 表
    const userCount = await prisma.user.count();
    console.log(`👤 User 表记录数: ${userCount}`);
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });
      console.log('用户列表:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email || '无邮箱'})`);
      });
    }

    // 检查 Trip 表
    const tripCount = await prisma.trip.count();
    console.log(`\n🗺️  Trip 表记录数: ${tripCount}`);

    // 检查 Attraction 表
    const attractionCount = await prisma.attraction.count();
    console.log(`\n🏛️  Attraction 表记录数: ${attractionCount}`);

    // 检查 AmapPOICache 表
    const cacheCount = await prisma.amapPOICache.count();
    console.log(`\n💾 AmapPOICache 表记录数: ${cacheCount}`);

    if (cacheCount > 0) {
      // 按城市分组统计
      const byCity = await prisma.amapPOICache.groupBy({
        by: ['city'],
        _count: {
          city: true,
        },
        orderBy: {
          _count: {
            city: 'desc',
          },
        },
      });

      console.log('\n按城市统计缓存数据:');
      byCity.forEach(group => {
        console.log(`  ${group.city}: ${group._count.city} 条记录`);
      });

      // 查看最近的缓存
      const recentCache = await prisma.amapPOICache.findMany({
        orderBy: {
          cacheTime: 'desc',
        },
        take: 5,
        select: {
          name: true,
          city: true,
          type: true,
          cacheTime: true,
          expireTime: true,
          hitCount: true,
        },
      });

      console.log('\n最近5条缓存记录:');
      recentCache.forEach(cache => {
        console.log(`  - ${cache.name} (${cache.city})`);
        console.log(`    类型: ${cache.type}`);
        console.log(`    缓存时间: ${cache.cacheTime.toLocaleString('zh-CN')}`);
        console.log(`    过期时间: ${cache.expireTime.toLocaleString('zh-CN')}`);
        console.log(`    命中次数: ${cache.hitCount}`);
      });
    }

    // 检查 Restaurant 表
    const restaurantCount = await prisma.restaurant.count();
    console.log(`\n🍽️  Restaurant 表记录数: ${restaurantCount}`);

    console.log('\n✅ 数据库检查完成');
  } catch (error) {
    console.error('❌ 检查数据库失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

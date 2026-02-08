const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== 查询地点缓存 ===');

    const caches = await prisma.locationCache.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    console.log('\n缓存记录数:', caches.length);

    if (caches.length > 0) {
      console.log('\n最近的缓存记录:');
      caches.forEach(cache => {
        console.log(`  - 关键词: "${cache.keywords}"`);
        console.log(`    名称: "${cache.name}"`);
        console.log(`    城市: "${cache.city}"`);
        console.log(`    搜索次数: ${cache.searchCount}`);
        console.log(`    过期时间: ${cache.expireTime}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
})();

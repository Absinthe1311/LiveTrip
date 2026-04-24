const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const spot1 = await prisma.spot.findUnique({
    where: { id: 'cmoc5sn530013nusg1kt9b2q8' },
    include: { image: true }
  });
  
  console.log('厦门上李水库公园:');
  console.log('  图片:', spot1 && spot1.image && spot1.image.url ? '有图片' : '无图片');
  console.log('  openTime:', spot1 ? spot1.openTime : 'null');
  
  const nullCount = await prisma.spot.count({ where: { openTime: null } });
  console.log('\nopenTime为null的景点数:', nullCount);
  
  await prisma[" \]();
})();
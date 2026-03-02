const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // 删除北京路步行街的收藏
    const deleted = await prisma.favorite.deleteMany({
      where: {
        spotId: 'cmlcvp5v80000nuggu1a5e3ij'
      }
    });
    
    console.log('删除北京路步行街收藏成功:', deleted.count);
    
    // 查看剩余收藏
    const favorites = await prisma.favorite.findMany({
      include: {
        spot: true
      }
    });
    
    console.log('剩余收藏:');
    favorites.forEach(fav => {
      console.log(`- ${fav.spot.name} (${fav.spot.city})`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();

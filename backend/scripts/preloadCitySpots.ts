// 预热热门城市景点数据脚本
// 从高德API获取热门城市的景点数据并存储到数据库
import { PrismaClient } from '@prisma/client';
import { amapService } from '../src/services/amapService';

const prisma = new PrismaClient();

// 热门城市列表
const hotCities = [
  { name: '北京市', limit: 30 },
  { name: '上海市', limit: 30 },
  { name: '成都市', limit: 30 },
  { name: '杭州市', limit: 30 },
  { name: '厦门市', limit: 30 },
  { name: '西安市', limit: 30 },
];

async function preloadCitySpots() {
  try {
    console.log('🚀 开始预热热门城市景点数据...\n');
    
    const amapServiceInstance = amapService();
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    for (const city of hotCities) {
      console.log(`\n📍 处理城市: ${city.name}`);
      console.log('─'.repeat(50));
      
      // 检查数据库中是否已有足够的景点
      const existingCount = await prisma.spot.count({
        where: { city: city.name },
      });
      
      if (existingCount >= city.limit) {
        console.log(`✅ 已有 ${existingCount} 个景点，跳过`);
        totalSkipped += existingCount;
        continue;
      }
      
      console.log(`📡 调用高德API获取 ${city.name} 的景点...`);
      
      try {
        // 调用高德API获取景点
        const attractions = await amapServiceInstance.getAttractions(
          city.name,
          '景点',
          undefined,
          city.limit
        );
        
        console.log(`✅ 获取到 ${attractions.length} 个景点`);
        
        let created = 0;
        let updated = 0;
        
        // 保存到数据库
        for (const attraction of attractions) {
          // 检查是否已存在（根据名称和城市）
          const existing = await prisma.spot.findFirst({
            where: {
              name: attraction.name,
              city: city.name,
            },
          });
          
          if (existing) {
            // 更新现有景点
            await prisma.spot.update({
              where: { id: existing.id },
              data: {
                rating: attraction.rating || existing.rating,
                address: (attraction.address && typeof attraction.address === 'string') 
                  ? attraction.address : existing.address,
                category: attraction.type || existing.category,
              },
            });
            updated++;
          } else {
            // 创建新景点
            const [lng, lat] = attraction.location.split(',').map(Number);
            
            await prisma.spot.create({
              data: {
                amapId: attraction.name + '_' + Date.now(),
                name: attraction.name,
                city: city.name,
                location: attraction.location,
                address: (attraction.address && typeof attraction.address === 'string') 
                  ? attraction.address : `${city.name}${attraction.name}`,
                category: attraction.type || '景点',
                ticketPrice: attraction.cost ? parseFloat(attraction.cost) : null,
                rating: attraction.rating || null,
                description: null,
                isOutdoor: false,
                isHot: false,
                source: 'amap',
              },
            });
            created++;
          }
        }
        
        console.log(`   创建: ${created} 个, 更新: ${updated} 个`);
        totalCreated += created;
        totalUpdated += updated;
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`❌ 获取 ${city.name} 景点失败:`, error.message);
      }
    }
    
    // 统计结果
    console.log('\n' + '='.repeat(50));
    console.log('📊 预热完成！');
    console.log(`   创建: ${totalCreated} 个景点`);
    console.log(`   更新: ${totalUpdated} 个景点`);
    console.log(`   跳过: ${totalSkipped} 个景点`);
    
    // 显示各城市景点数量
    const cityStats = await prisma.spot.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    
    console.log('\n📍 各城市景点数量:');
    cityStats.forEach(stat => {
      console.log(`   ${stat.city}: ${stat._count.id} 个`);
    });
    
    const totalSpots = await prisma.spot.count();
    console.log(`\n🎯 数据库总景点数: ${totalSpots} 个`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 预热失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行脚本
preloadCitySpots();

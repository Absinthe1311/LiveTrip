// 预热热门景点数据脚本
// 将前端硬编码的热门景点数据存入数据库，标记为isHot
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 热门景点数据（从前端destinationsData.ts提取）
const hotSpotsData = [
  // 北京
  { name: '故宫博物院', city: '北京市', rating: 4.9, ticketPrice: 60, category: '历史文化', description: '明清两代皇宫，世界文化遗产', openTime: '08:30-17:00' },
  { name: '天安门广场', city: '北京市', rating: 4.8, ticketPrice: 0, category: '历史文化', description: '世界最大的城市广场', openTime: '全天开放' },
  { name: '国家博物馆', city: '北京市', rating: 4.7, ticketPrice: 0, category: '博物馆', description: '收藏中华文明历史文物', openTime: '09:00-17:00' },
  { name: '颐和园', city: '北京市', rating: 4.8, ticketPrice: 30, category: '自然风光', description: '皇家园林，世界文化遗产', openTime: '06:30-18:00' },
  { name: '天坛公园', city: '北京市', rating: 4.7, ticketPrice: 15, category: '历史文化', description: '明清两代皇帝祭天的场所', openTime: '06:00-22:00' },
  { name: '圆明园', city: '北京市', rating: 4.6, ticketPrice: 25, category: '历史文化', description: '万园之园，历史遗迹', openTime: '07:00-19:30' },
  { name: '北海公园', city: '北京市', rating: 4.5, ticketPrice: 10, category: '自然风光', description: '中国现存最古老的皇家园林', openTime: '06:00-22:00' },
  { name: '景山公园', city: '北京市', rating: 4.4, ticketPrice: 2, category: '自然风光', description: '俯瞰故宫全景的最佳地点', openTime: '06:00-21:00' },
  
  // 上海
  { name: '外滩', city: '上海市', rating: 4.9, ticketPrice: 0, category: '都市风光', description: '万国建筑博览群，上海标志性景点', openTime: '全天开放' },
  { name: '东方明珠', city: '上海市', rating: 4.7, ticketPrice: 220, category: '现代建筑', description: '上海地标建筑，登塔俯瞰全城', openTime: '09:00-21:30' },
  { name: '豫园', city: '上海市', rating: 4.6, ticketPrice: 40, category: '历史文化', description: '明代古典园林，江南园林代表', openTime: '08:30-17:30' },
  { name: '南京路步行街', city: '上海市', rating: 4.5, ticketPrice: 0, category: '购物娱乐', description: '中华商业第一街', openTime: '全天开放' },
  { name: '上海迪士尼乐园', city: '上海市', rating: 4.8, ticketPrice: 499, category: '主题乐园', description: '中国大陆首座迪士尼主题乐园', openTime: '08:30-22:00' },
  { name: '上海博物馆', city: '上海市', rating: 4.6, ticketPrice: 0, category: '博物馆', description: '中国古代艺术博物馆', openTime: '09:00-17:00' },
  { name: '田子坊', city: '上海市', rating: 4.4, ticketPrice: 0, category: '文艺街区', description: '文艺创意园区', openTime: '全天开放' },
  { name: '新天地', city: '上海市', rating: 4.5, ticketPrice: 0, category: '购物娱乐', description: '时尚购物餐饮区', openTime: '10:00-22:00' },
  
  // 成都
  { name: '成都大熊猫繁育研究基地', city: '成都市', rating: 4.9, ticketPrice: 58, category: '自然风光', description: '观赏可爱的大熊猫', openTime: '07:30-18:00' },
  { name: '宽窄巷子', city: '成都市', rating: 4.7, ticketPrice: 0, category: '历史文化', description: '成都历史文化街区', openTime: '全天开放' },
  { name: '锦里古街', city: '成都市', rating: 4.6, ticketPrice: 0, category: '历史文化', description: '西蜀历史上最古老的街道', openTime: '全天开放' },
  { name: '武侯祠', city: '成都市', rating: 4.7, ticketPrice: 50, category: '历史文化', description: '纪念诸葛亮的祠庙', openTime: '09:00-18:00' },
  { name: '杜甫草堂', city: '成都市', rating: 4.6, ticketPrice: 50, category: '历史文化', description: '唐代诗人杜甫的故居', openTime: '08:00-18:30' },
  { name: '春熙路', city: '成都市', rating: 4.5, ticketPrice: 0, category: '购物娱乐', description: '成都最繁华的商业街', openTime: '全天开放' },
  { name: '青城山', city: '成都市', rating: 4.7, ticketPrice: 80, category: '自然风光', description: '道教名山，青城天下幽', openTime: '08:00-17:00' },
  { name: '都江堰', city: '成都市', rating: 4.8, ticketPrice: 80, category: '历史文化', description: '世界文化遗产，古代水利工程', openTime: '08:00-18:00' },
  
  // 杭州
  { name: '西湖', city: '杭州市', rating: 4.9, ticketPrice: 0, category: '自然风光', description: '世界文化遗产，人间天堂', openTime: '全天开放' },
  { name: '雷峰塔', city: '杭州市', rating: 4.6, ticketPrice: 40, category: '历史文化', description: '西湖十景之一，雷峰夕照', openTime: '08:00-20:00' },
  { name: '灵隐寺', city: '杭州市', rating: 4.7, ticketPrice: 75, category: '历史文化', description: '江南著名古刹', openTime: '07:00-18:15' },
  { name: '断桥', city: '杭州市', rating: 4.8, ticketPrice: 0, category: '自然风光', description: '西湖十景之一，断桥残雪', openTime: '全天开放' },
  { name: '三潭印月', city: '杭州市', rating: 4.7, ticketPrice: 55, category: '自然风光', description: '西湖十景之一，湖中三岛', openTime: '08:00-17:00' },
  { name: '宋城', city: '杭州市', rating: 4.5, ticketPrice: 310, category: '主题乐园', description: '大型主题公园，宋城千古情', openTime: '10:00-22:00' },
  { name: '河坊街', city: '杭州市', rating: 4.4, ticketPrice: 0, category: '历史文化', description: '历史文化街区', openTime: '全天开放' },
  { name: '西溪国家湿地公园', city: '杭州市', rating: 4.6, ticketPrice: 80, category: '自然风光', description: '城市湿地公园', openTime: '07:30-18:30' },
  
  // 厦门
  { name: '鼓浪屿', city: '厦门市', rating: 4.9, ticketPrice: 35, category: '历史文化', description: '世界文化遗产，海上花园', openTime: '全天开放' },
  { name: '南普陀寺', city: '厦门市', rating: 4.7, ticketPrice: 0, category: '历史文化', description: '千年古刹，闽南佛教圣地', openTime: '08:00-17:30' },
  { name: '曾厝垵', city: '厦门市', rating: 4.5, ticketPrice: 0, category: '文艺街区', description: '文艺小渔村', openTime: '全天开放' },
  { name: '环岛路', city: '厦门市', rating: 4.6, ticketPrice: 0, category: '自然风光', description: '最美海岸线', openTime: '全天开放' },
  { name: '厦门大学', city: '厦门市', rating: 4.7, ticketPrice: 0, category: '历史文化', description: '中国最美大学', openTime: '08:00-18:00' },
  { name: '日光岩', city: '厦门市', rating: 4.6, ticketPrice: 60, category: '自然风光', description: '鼓浪屿最高点', openTime: '07:00-20:00' },
  { name: '菽庄花园', city: '厦门市', rating: 4.5, ticketPrice: 30, category: '历史文化', description: '海上花园', openTime: '07:30-18:00' },
  { name: '中山路步行街', city: '厦门市', rating: 4.4, ticketPrice: 0, category: '购物娱乐', description: '厦门商业街', openTime: '全天开放' },
  
  // 西安
  { name: '秦始皇兵马俑', city: '西安市', rating: 4.9, ticketPrice: 120, category: '历史文化', description: '世界第八大奇迹', openTime: '08:30-18:00' },
  { name: '大雁塔', city: '西安市', rating: 4.7, ticketPrice: 40, category: '历史文化', description: '唐代古塔，丝绸之路象征', openTime: '08:00-21:30' },
  { name: '回民街', city: '西安市', rating: 4.6, ticketPrice: 0, category: '美食街区', description: '美食天堂', openTime: '全天开放' },
  { name: '西安城墙', city: '西安市', rating: 4.7, ticketPrice: 54, category: '历史文化', description: '中国现存最完整的古城墙', openTime: '08:00-22:00' },
  { name: '华清宫', city: '西安市', rating: 4.6, ticketPrice: 120, category: '历史文化', description: '唐代皇家温泉宫殿', openTime: '08:00-18:00' },
  { name: '陕西历史博物馆', city: '西安市', rating: 4.8, ticketPrice: 0, category: '博物馆', description: '中国第一座大型现代化博物馆', openTime: '08:30-18:00' },
  { name: '大唐芙蓉园', city: '西安市', rating: 4.5, ticketPrice: 120, category: '历史文化', description: '中国第一个全方位展示盛唐风貌', openTime: '09:00-22:00' },
  { name: '钟鼓楼', city: '西安市', rating: 4.6, ticketPrice: 50, category: '历史文化', description: '西安地标建筑', openTime: '08:30-21:00' },
];

// 城市中心坐标（用于生成景点坐标）
const cityCenters: Record<string, { lng: number; lat: number }> = {
  '北京市': { lng: 116.4074, lat: 39.9042 },
  '上海市': { lng: 121.4737, lat: 31.2304 },
  '成都市': { lng: 104.0665, lat: 30.5723 },
  '杭州市': { lng: 120.1551, lat: 30.2741 },
  '厦门市': { lng: 118.0894, lat: 24.4798 },
  '西安市': { lng: 108.9402, lat: 34.3416 },
};

// 生成随机偏移坐标
function generateRandomLocation(center: { lng: number; lat: number }, radiusKm: number = 10): string {
  const radiusDeg = radiusKm / 111; // 大约1度 = 111km
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radiusDeg;
  
  const lng = center.lng + randomRadius * Math.cos(randomAngle);
  const lat = center.lat + randomRadius * Math.sin(randomAngle);
  
  return `${lng.toFixed(6)},${lat.toFixed(6)}`;
}

async function seedHotSpots() {
  try {
    console.log('🔥 开始预热热门景点数据...\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const spotData of hotSpotsData) {
      const center = cityCenters[spotData.city];
      if (!center) {
        console.log(`⚠️  跳过 ${spotData.name} - 未找到城市中心坐标`);
        skipped++;
        continue;
      }
      
      // 检查是否已存在
      const existing = await prisma.spot.findFirst({
        where: {
          name: spotData.name,
          city: spotData.city,
        },
      });
      
      if (existing) {
        // 更新为热门景点
        await prisma.spot.update({
          where: { id: existing.id },
          data: {
            isHot: true,
            rating: spotData.rating,
            ticketPrice: spotData.ticketPrice,
            category: spotData.category,
            description: spotData.description,
            openTime: spotData.openTime,
          },
        });
        console.log(`✅ 更新: ${spotData.name} (${spotData.city})`);
        updated++;
      } else {
        // 创建新景点
        const location = generateRandomLocation(center);
        const [lng, lat] = location.split(',').map(Number);
        
        await prisma.spot.create({
          data: {
            amapId: `hot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: spotData.name,
            city: spotData.city,
            location: location,
            address: `${spotData.city}${spotData.name}`,
            category: spotData.category,
            ticketPrice: spotData.ticketPrice,
            openTime: spotData.openTime,
            rating: spotData.rating,
            description: spotData.description,
            isOutdoor: spotData.category === '自然风光',
            isHot: true,
            source: 'manual',
          },
        });
        console.log(`✅ 创建: ${spotData.name} (${spotData.city})`);
        created++;
      }
    }
    
    // 统计结果
    console.log('\n📊 预热完成！');
    console.log(`   创建: ${created} 个景点`);
    console.log(`   更新: ${updated} 个景点`);
    console.log(`   跳过: ${skipped} 个景点`);
    
    // 显示各城市热门景点数量
    const cityStats = await prisma.spot.groupBy({
      by: ['city'],
      where: { isHot: true },
      _count: { id: true },
    });
    
    console.log('\n📍 各城市热门景点数量:');
    cityStats.forEach(stat => {
      console.log(`   ${stat.city}: ${stat._count.id} 个`);
    });
    
    const totalHotSpots = await prisma.spot.count({ where: { isHot: true } });
    console.log(`\n🎯 总计热门景点: ${totalHotSpots} 个`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 预热失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行脚本
seedHotSpots();

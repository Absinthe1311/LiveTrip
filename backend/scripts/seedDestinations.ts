// 恢复热门目的地数据脚本
import { getPrismaClient } from '../src/lib/prisma';

const prisma = getPrismaClient();

// 热门目的地数据（从前端destinationsData.ts提取）
const destinationsData = [
  {
    city: '北京',
    icon: '🏛️',
    days: 3,
    budget: 2000,
    bestSeason: '春秋',
    rating: 4.8,
    description: '探索千年古都，感受历史文化的魅力。故宫、长城、天坛，每一个景点都承载着厚重的历史。',
    tags: ['历史文化', '古都风情', '世界遗产'],
    attractions: ['故宫博物院', '天安门广场', '国家博物馆', '颐和园', '天坛公园', '圆明园'],
  },
  {
    city: '上海',
    icon: '🌆',
    days: 3,
    budget: 2500,
    bestSeason: '春秋',
    rating: 4.7,
    description: '体验现代都市的繁华与活力，感受中西文化的交融。外滩、东方明珠、迪士尼，每一处都让人流连忘返。',
    tags: ['现代都市', '购物天堂', '迪士尼'],
    attractions: ['外滩', '东方明珠', '豫园', '南京路步行街', '上海迪士尼乐园'],
  },
  {
    city: '成都',
    icon: '🐼',
    days: 4,
    budget: 1800,
    bestSeason: '春秋',
    rating: 4.8,
    description: '感受天府之国的悠闲与美食，体验慢生活的惬意。大熊猫基地、宽窄巷子、锦里，每一处都充满川西风情。',
    tags: ['熊猫基地', '美食天堂', '慢生活'],
    attractions: ['成都大熊猫繁育研究基地', '宽窄巷子', '锦里古街', '武侯祠', '杜甫草堂', '都江堰'],
  },
  {
    city: '杭州',
    icon: '🌸',
    days: 3,
    budget: 1500,
    bestSeason: '春秋',
    rating: 4.9,
    description: '人间天堂，山水画卷。西湖、雷峰塔、灵隐寺，每一处都如诗如画，让人沉醉其中。',
    tags: ['西湖美景', '江南水乡', '古典园林'],
    attractions: ['西湖', '雷峰塔', '灵隐寺', '断桥', '三潭印月', '宋城'],
  },
  {
    city: '厦门',
    icon: '🏖️',
    days: 3,
    budget: 1600,
    bestSeason: '春秋',
    rating: 4.7,
    description: '海上花园，文艺小城。鼓浪屿、南普陀寺、环岛路，每一处都充满文艺气息。',
    tags: ['海岛风情', '文艺街区', '海滨风光'],
    attractions: ['鼓浪屿', '南普陀寺', '曾厝垵', '环岛路', '厦门大学'],
  },
  {
    city: '西安',
    icon: '🏰',
    days: 4,
    budget: 2000,
    bestSeason: '春秋',
    rating: 4.8,
    description: '十三朝古都，丝路起点。兵马俑、大雁塔、回民街，每一处都承载着厚重的历史。',
    tags: ['历史文化', '丝路起点', '美食天堂'],
    attractions: ['秦始皇兵马俑', '大雁塔', '回民街', '西安城墙', '华清宫', '陕西历史博物馆'],
  },
];

async function seedDestinations() {
  try {
    console.log('🌍 开始恢复热门目的地数据...\n');

    let created = 0;
    let updated = 0;

    for (const dest of destinationsData) {
      // 检查是否已存在
      const existing = await prisma.destinationCache.findFirst({
        where: { city: dest.city },
      });

      // 准备数据
      const destinationData = {
        city: dest.city,
        attractions: JSON.stringify({
          icon: dest.icon,
          days: dest.days,
          budget: dest.budget,
          bestSeason: dest.bestSeason,
          rating: dest.rating,
          description: dest.description,
          tags: dest.tags,
          attractions: dest.attractions,
        }),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      };

      if (existing) {
        // 更新现有目的地
        await prisma.destinationCache.update({
          where: { id: existing.id },
          data: destinationData,
        });
        console.log(`✅ 更新: ${dest.city}`);
        updated++;
      } else {
        // 创建新目的地
        await prisma.destinationCache.create({
          data: destinationData,
        });
        console.log(`✅ 创建: ${dest.city}`);
        created++;
      }
    }

    console.log('\n📊 恢复完成！');
    console.log(`   创建: ${created} 个目的地`);
    console.log(`   更新: ${updated} 个目的地`);

    const total = await prisma.destinationCache.count();
    console.log(`\n🎯 总计热门目的地: ${total} 个`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行脚本
seedDestinations();

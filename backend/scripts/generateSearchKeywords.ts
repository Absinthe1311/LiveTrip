import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSearchKeywords() {
  try {
    console.log('🔍 正在生成景点图片检索关键字...\n');
    
    // 获取所有景点，按城市分组
    const spots = await prisma.spot.findMany({
      orderBy: [
        { city: 'asc' },
        { name: 'asc' },
      ],
    });
    
    // 按城市分组
    const cityGroups: Record<string, typeof spots> = {};
    
    for (const spot of spots) {
      if (!cityGroups[spot.city]) {
        cityGroups[spot.city] = [];
      }
      cityGroups[spot.city].push(spot);
    }
    
    // 生成Markdown内容
    let markdown = `# LiveTrip 景点图片检索关键字

> 生成时间: ${new Date().toLocaleString('zh-CN')}
> 景点总数: ${spots.length} 个
> 城市数量: ${Object.keys(cityGroups).length} 个

---

## 使用说明

1. 使用下方的英文关键字在图片网站搜索高质量图片
2. 推荐图片网站：
   - Unsplash: https://unsplash.com
   - Pexels: https://pexels.com
   - Pixabay: https://pixabay.com
3. 建议图片尺寸：至少 1920x1080，横版优先
4. 下载后通过管理员后台上传到对应景点

---

`;

    // 遍历每个城市
    for (const [city, citySpots] of Object.entries(cityGroups)) {
      markdown += `## ${city}\n\n`;
      markdown += `| 序号 | 景点名称 | 英文名称 | 检索关键字 | 是否热门 |\n`;
      markdown += `|------|---------|---------|-----------|----------|\n`;
      
      citySpots.forEach((spot, index) => {
        const englishName = getEnglishName(spot.name, city);
        const searchKeyword = getSearchKeyword(spot.name, city);
        const isHot = spot.isHot ? '🔥 是' : '否';
        
        markdown += `| ${index + 1} | ${spot.name} | ${englishName} | \`${searchKeyword}\` | ${isHot} |\n`;
      });
      
      markdown += `\n`;
    }
    
    // 添加热门景点快速检索
    markdown += `---\n\n`;
    markdown += `## 热门景点快速检索\n\n`;
    markdown += `以下是标记为热门的景点，建议优先添加图片：\n\n`;
    
    const hotSpots = spots.filter(s => s.isHot);
    markdown += `| 序号 | 景点名称 | 城市 | 检索关键字 |\n`;
    markdown += `|------|---------|------|-----------|\n`;
    
    hotSpots.forEach((spot, index) => {
      const searchKeyword = getSearchKeyword(spot.name, spot.city);
      markdown += `| ${index + 1} | ${spot.name} | ${spot.city} | \`${searchKeyword}\` |\n`;
    });
    
    // 添加批量检索关键字
    markdown += `\n---\n\n`;
    markdown += `## 批量检索关键字\n\n`;
    markdown += `可以按城市批量搜索图片：\n\n`;
    
    const cityKeywords: Record<string, string> = {
      '北京市': 'Beijing China landmarks',
      '上海市': 'Shanghai China skyline',
      '成都市': 'Chengdu China attractions',
      '杭州市': 'Hangzhou China West Lake',
      '厦门市': 'Xiamen China Gulangyu',
      '西安市': 'Xi\'an China Terracotta',
    };
    
    for (const [city, keyword] of Object.entries(cityKeywords)) {
      markdown += `- **${city}**: \`${keyword}\`\n`;
    }
    
    // 输出到文件
    const fs = await import('fs');
    const path = await import('path');
    const outputPath = path.join(process.cwd(), '..', '景点图片检索关键字.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`✅ 已生成文件: ${outputPath}`);
    console.log(`📊 景点总数: ${spots.length}`);
    console.log(`🔥 热门景点: ${hotSpots.length}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 生成失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 获取英文名称
function getEnglishName(name: string, city: string): string {
  const translations: Record<string, string> = {
    // 北京
    '故宫博物院': 'Forbidden City',
    '天安门广场': 'Tiananmen Square',
    '国家博物馆': 'National Museum of China',
    '颐和园': 'Summer Palace',
    '天坛公园': 'Temple of Heaven',
    '圆明园': 'Old Summer Palace',
    '北海公园': 'Beihai Park',
    '景山公园': 'Jingshan Park',
    '八达岭长城': 'Badaling Great Wall',
    '慕田峪长城': 'Mutianyu Great Wall',
    '鸟巢': 'Bird\'s Nest',
    '水立方': 'Water Cube',
    
    // 上海
    '外滩': 'The Bund',
    '东方明珠': 'Oriental Pearl Tower',
    '豫园': 'Yu Garden',
    '南京路步行街': 'Nanjing Road',
    '上海迪士尼乐园': 'Shanghai Disney Resort',
    '上海博物馆': 'Shanghai Museum',
    '田子坊': 'Tianzifang',
    '新天地': 'Xintiandi',
    '上海中心大厦': 'Shanghai Tower',
    '金茂大厦': 'Jin Mao Tower',
    
    // 成都
    '成都大熊猫繁育研究基地': 'Chengdu Panda Base',
    '宽窄巷子': 'Kuanzhai Alley',
    '锦里古街': 'Jinli Ancient Street',
    '武侯祠': 'Wuhou Shrine',
    '杜甫草堂': 'Du Fu Thatched Cottage',
    '春熙路': 'Chunxi Road',
    '青城山': 'Qingcheng Mountain',
    '都江堰': 'Dujiangyan Irrigation System',
    
    // 杭州
    '西湖': 'West Lake',
    '雷峰塔': 'Leifeng Pagoda',
    '灵隐寺': 'Lingyin Temple',
    '断桥': 'Broken Bridge',
    '三潭印月': 'Three Pools Mirroring the Moon',
    '宋城': 'Songcheng',
    '河坊街': 'Hefang Street',
    '西溪国家湿地公园': 'Xixi National Wetland Park',
    
    // 厦门
    '鼓浪屿': 'Gulangyu Island',
    '南普陀寺': 'Nanputuo Temple',
    '曾厝垵': 'Zengcuoan',
    '环岛路': 'Huandao Road',
    '厦门大学': 'Xiamen University',
    '日光岩': 'Sunlight Rock',
    '菽庄花园': 'Shuzhuang Garden',
    '中山路步行街': 'Zhongshan Road',
    
    // 西安
    '秦始皇兵马俑': 'Terracotta Army',
    '大雁塔': 'Big Wild Goose Pagoda',
    '回民街': 'Muslim Quarter',
    '西安城墙': 'Xi\'an City Wall',
    '华清宫': 'Huaqing Palace',
    '陕西历史博物馆': 'Shaanxi History Museum',
    '大唐芙蓉园': 'Tang Paradise',
    '钟鼓楼': 'Bell and Drum Tower',
  };
  
  return translations[name] || name;
}

// 获取检索关键字
function getSearchKeyword(name: string, city: string): string {
  const englishName = getEnglishName(name, city);
  const cityName = city.replace('市', '');
  
  // 特殊处理
  const specialKeywords: Record<string, string> = {
    '故宫博物院': 'Forbidden City Beijing China palace',
    '天安门广场': 'Tiananmen Square Beijing China',
    '八达岭长城': 'Great Wall of China Badaling',
    '秦始皇兵马俑': 'Terracotta Army Warriors Xi\'an China',
    '西湖': 'West Lake Hangzhou China scenic',
    '外滩': 'Shanghai Bund skyline night',
    '成都大熊猫繁育研究基地': 'Giant Panda Chengdu China cute',
    '鼓浪屿': 'Gulangyu Island Xiamen China beach',
  };
  
  if (specialKeywords[name]) {
    return specialKeywords[name];
  }
  
  return `${englishName} ${cityName} China`;
}

// 执行脚本
generateSearchKeywords();

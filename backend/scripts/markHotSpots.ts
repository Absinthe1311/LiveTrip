// 标记热门景点脚本
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 热门景点配置（城市 -> 景点名称列表）
const hotSpotsConfig: Record<string, string[]> = {
  '北京': [
    '故宫博物院',
    '天安门广场',
    '国家博物馆',
    '颐和园',
    '天坛公园',
    '圆明园',
    '北海公园',
    '景山公园',
    '八达岭长城',
    '慕田峪长城',
  ],
  '上海': [
    '东方明珠',
    '外滩',
    '豫园',
    '城隍庙',
    '上海博物馆',
    '南京路步行街',
    '田子坊',
    '新天地',
    '朱家角古镇',
    '上海迪士尼乐园',
  ],
  '成都': [
    '宽窄巷子',
    '锦里古街',
    '武侯祠',
    '杜甫草堂',
    '大熊猫繁育研究基地',
    '春熙路',
    '太古里',
    '青城山',
    '都江堰',
    '人民公园',
  ],
};

async function markHotSpots() {
  console.log('🔥 开始标记热门景点...\n');

  let totalMarked = 0;

  for (const [city, spotNames] of Object.entries(hotSpotsConfig)) {
    console.log(`📍 处理城市: ${city}`);
    
    for (const spotName of spotNames) {
      try {
        // 查找景点
        const spot = await prisma.spot.findFirst({
          where: {
            name: {
              contains: spotName,
            },
            city: city,
          },
        });

        if (spot) {
          // 标记为热门
          await prisma.spot.update({
            where: { id: spot.id },
            data: { isHot: true },
          });
          console.log(`  ✅ ${spot.name} -> 已标记为热门`);
          totalMarked++;
        } else {
          console.log(`  ⚠️  ${spotName} -> 未找到`);
        }
      } catch (error) {
        console.error(`  ❌ ${spotName} -> 标记失败:`, error);
      }
    }
    
    console.log('');
  }

  console.log(`\n✅ 完成！共标记 ${totalMarked} 个热门景点`);
  
  await prisma.$disconnect();
}

// 执行脚本
markHotSpots().catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});

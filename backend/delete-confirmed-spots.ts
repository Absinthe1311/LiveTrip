// AI辅助生成：GLM-5, 2026-04-23 19:55
// 描述：删除确认的重复景点和所有无图片的重复景点

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteConfirmedSpots() {
  console.log('开始删除确认的重复景点...\n');

  try {
    // 用户确认需要删除的景点
    const confirmedDeletes = [
      // 上海
      { name: '北外滩滨江绿地小巨蛋', city: '上海' },
      { name: '东方明珠旅游码头', city: '上海' },
      { name: '豫园-九曲桥', city: '上海' },
      { name: '外滩观光隧道', city: '上海' },
      { name: '上海博物馆_人民广场馆', city: '上海' },
      { name: '世纪广场_南京路步行街', city: '上海' },
      { name: '中国共产党第一次全国代表大会会址纪念馆', city: '上海' },
      { name: '白云观_上海', city: '上海' },
      { name: '人民公园_上海', city: '上海' },
      
      // 北京
      { name: '中山公园_北京', city: '北京' },
      { name: '白云观_北京', city: '北京' },
      { name: '巧克巧蔻_巧克力博物馆_北京馆', city: '北京' },
      { name: '鼓楼_北京', city: '北京' },
      
      // 成都
      { name: '铁像寺水街', city: '成都' },
      { name: '桂溪生态公园西区', city: '成都' },
      { name: '桂溪生态公园东区', city: '成都' },
      { name: '东湖公园_成都', city: '成都' },
      
      // 厦门
      { name: '仙岳公园', city: '厦门' },
      { name: '厦门市鼓浪屿风景名胜区-皓月园', city: '厦门' },
      { name: '厦门白鹭洲公园西公园', city: '厦门' },
      { name: '狐尾山公园-观景台', city: '厦门' },
      { name: '中山公园_厦门', city: '厦门' },
      
      // 杭州
      { name: '城市阳台江堤步道', city: '杭州' },
      { name: '杭州西湖风景名胜区-太子湾公园', city: '杭州' },
      { name: '杭州钱塘江夜游_滨江码头', city: '杭州' },
      
      // 西安
      { name: '红旗铁路公园', city: '西安' },
      { name: '驼铃传奇_秀', city: '西安' },
    ];

    let totalDeleted = 0;
    const deletionLog: string[] = [];

    // 删除用户确认的景点
    for (const spot of confirmedDeletes) {
      const result = await prisma.spot.deleteMany({
        where: {
          name: spot.name,
          city: spot.city,
        },
      });

      if (result.count > 0) {
        totalDeleted += result.count;
        deletionLog.push(`✅ ${spot.city} - ${spot.name}: 删除 ${result.count} 个`);
        console.log(`✅ 删除: ${spot.city} - ${spot.name} (${result.count}个)`);
      } else {
        deletionLog.push(`⚠️  ${spot.city} - ${spot.name}: 未找到`);
        console.log(`⚠️  未找到: ${spot.city} - ${spot.name}`);
      }
    }

    // 处理毛主席纪念堂的特殊情况
    console.log('\n处理毛主席纪念堂...');
    const memorialHall = await prisma.spot.findFirst({
      where: {
        name: { contains: '毛主席纪念堂' },
        city: '北京',
      },
    });

    if (memorialHall) {
      await prisma.spot.update({
        where: { id: memorialHall.id },
        data: { name: '毛主席纪念堂' },
      });
      deletionLog.push(`✅ 北京 - 毛主席纪念堂: 已更新名称`);
      console.log(`✅ 已更新: 毛主席纪念堂 (去除"暂停开放")`);
    }

    // 删除所有无图片的重复景点
    console.log('\n删除所有无图片的重复景点...');
    const allSpots = await prisma.spot.findMany({
      include: { image: true },
    });

    const cityMap = new Map<string, Map<string, typeof allSpots>>();

    for (const spot of allSpots) {
      if (!cityMap.has(spot.city)) {
        cityMap.set(spot.city, new Map());
      }
      const citySpots = cityMap.get(spot.city)!;
      if (!citySpots.has(spot.name)) {
        citySpots.set(spot.name, []);
      }
      citySpots.get(spot.name)!.push(spot);
    }

    for (const [city, citySpots] of cityMap) {
      for (const [name, duplicates] of citySpots) {
        if (duplicates.length > 1) {
          // 找出无图片的
          const withoutImage = duplicates.filter(s => !s.image);
          
          // 如果有图片的景点存在，删除所有无图片的
          if (withoutImage.length > 0 && duplicates.length > withoutImage.length) {
            for (const spot of withoutImage) {
              await prisma.spot.delete({ where: { id: spot.id } });
              totalDeleted++;
              deletionLog.push(`✅ ${city} - ${name}: 删除无图片重复 ${spot.id}`);
              console.log(`✅ 删除无图片重复: ${city} - ${name} (${spot.id})`);
            }
          }
        }
      }
    }

    console.log(`\n=== 删除完成 ===`);
    console.log(`总计删除: ${totalDeleted}个景点`);

    // 保存日志
    const fs = require('fs');
    const logContent = `# 删除确认景点日志\n\n` +
      `**执行时间**: ${new Date().toLocaleString('zh-CN')}\n\n` +
      `**删除总数**: ${totalDeleted}个\n\n` +
      `---\n\n` +
      deletionLog.map(log => `- ${log}`).join('\n');

    fs.writeFileSync('删除确认景点日志.md', logContent, 'utf8');
    console.log('\n✅ 日志已保存到 删除确认景点日志.md');

  } catch (error) {
    console.error('❌ 删除失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteConfirmedSpots();

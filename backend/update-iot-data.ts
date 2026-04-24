// 手动更新所有景点IoT数据的脚本
import { PrismaClient } from '@prisma/client';
import { getBatchWeatherData } from './src/services/weatherService';
import { getBatchCrowdData, updateSpotIoTData } from './src/services/crowdSimulator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 开始手动更新所有景点IoT数据...\n');

  try {
    // 1. 获取所有景点
    const spots = await prisma.spot.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        category: true
      }
    });

    if (spots.length === 0) {
      console.log('⚠️  数据库中没有景点数据');
      return;
    }

    console.log(`📍 找到 ${spots.length} 个景点\n`);

    const spotIds = spots.map(s => s.id);

    // 2. 获取天气数据（会应用微气候调整）
    console.log('🌤️  获取天气数据（含微气候调整）...');
    const weatherMap = await getBatchWeatherData(spotIds);
    console.log(`✅ 成功获取 ${weatherMap.size} 个景点的天气数据\n`);

    // 3. 获取人流数据
    console.log('👥 获取人流数据...');
    const crowdMap = await getBatchCrowdData(spotIds);
    console.log(`✅ 成功获取 ${crowdMap.size} 个景点的人流数据\n`);

    // 4. 更新数据库
    console.log('💾 更新数据库...');
    let updateCount = 0;

    for (const spot of spots) {
      const weather = weatherMap.get(spot.id);
      const crowd = crowdMap.get(spot.id);

      if (weather && crowd) {
        await updateSpotIoTData(spot.id, crowd, {
          temperature: weather.temperature,
          rainProbability: weather.rainProbability,
          weatherDescription: weather.description,
          weatherIcon: weather.icon,
          weatherUpdatedAt: weather.updatedAt
        });

        updateCount++;

        // 打印更新详情
        console.log(`✓ ${spot.name} (${spot.city})`);
        console.log(`  温度: ${weather.temperature}°C`);
        console.log(`  湿度: ${weather.humidity}%`);
        console.log(`  拥挤度: ${crowd.crowdLevel}%`);
        console.log(`  降雨概率: ${weather.rainProbability}%`);
        console.log('');
      }
    }

    console.log(`\n✅ 更新完成！成功更新 ${updateCount}/${spots.length} 个景点`);

    // 5. 验证微气候差异
    console.log('\n📊 验证微气候差异...\n');

    // 按城市分组
    const citySpots = new Map<string, typeof spots>();
    for (const spot of spots) {
      if (!citySpots.has(spot.city)) {
        citySpots.set(spot.city, []);
      }
      citySpots.get(spot.city)!.push(spot);
    }

    // 对每个城市，检查景点温度差异
    for (const [city, citySpotList] of citySpots) {
      if (citySpotList.length < 2) continue;

      console.log(`城市: ${city}`);

      const temperatures: Array<{ name: string; temp: number; category: string | null }> = [];

      for (const spot of citySpotList) {
        const iotData = await prisma.spotIoTData.findUnique({
          where: { spotId: spot.id }
        });

        if (iotData) {
          temperatures.push({
            name: spot.name,
            temp: iotData.temperature,
            category: spot.category
          });
        }
      }

      // 按温度排序
      temperatures.sort((a, b) => a.temp - b.temp);

      for (const item of temperatures) {
        console.log(`  ${item.name}: ${item.temp}°C (${item.category || '未知'})`);
      }

      // 计算温差
      if (temperatures.length >= 2) {
        const diff = temperatures[temperatures.length - 1].temp - temperatures[0].temp;
        console.log(`  温差: ${diff.toFixed(1)}°C`);
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

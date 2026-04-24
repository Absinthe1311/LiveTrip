// 强制更新所有景点IoT数据（清除缓存）
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import {
  identifyMicroclimateType,
  applyMicroclimateAdjustment,
  MicroclimateType
} from './src/services/microclimateService';

const prisma = new PrismaClient();

const apiKey = process.env.OPENWEATHERMAP_API_KEY;
const apiUrl = process.env.OPENWEATHERMAP_API_URL;

async function getWeatherFromAPI(lat: number, lon: number) {
  const url = `${apiUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
  const response = await axios.get(url);
  return {
    temperature: Math.round(response.data.main.temp * 10) / 10,
    humidity: response.data.main.humidity,
    description: response.data.weather[0].description,
    icon: response.data.weather[0].icon
  };
}

async function getRainProbability(lat: number, lon: number) {
  const url = `${apiUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;
  const response = await axios.get(url);
  const now = Date.now() / 1000;
  const future24Hours = now + 24 * 60 * 60;
  const futureForecasts = response.data.list.filter(
    (item: any) => item.dt >= now && item.dt <= future24Hours
  );
  if (futureForecasts.length === 0) return 0;
  const avgRainProbability = futureForecasts.reduce((sum: number, item: any) => sum + item.pop, 0) / futureForecasts.length;
  return Math.round(avgRainProbability * 100);
}

async function main() {
  console.log('🔄 强制更新所有景点IoT数据（清除缓存）\n');
  console.log('=' .repeat(60));

  try {
    // 1. 获取所有景点
    const allSpots = await prisma.spot.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        category: true,
        description: true,
        location: true
      }
    });

    // 过滤出有坐标的景点
    const spots = allSpots.filter(spot => spot.location !== null);

    console.log(`\n📍 找到 ${spots.length} 个有坐标的景点\n`);

    if (spots.length === 0) {
      console.log('⚠️  没有找到有坐标的景点');
      return;
    }

    // 2. 按城市分组，获取基础天气数据
    console.log('🌤️  获取各城市基础天气数据...\n');

    const cityWeatherMap = new Map<string, {
      temperature: number;
      humidity: number;
      description: string;
      icon: string;
      rainProbability: number;
    }>();

    const cities = [...new Set(spots.map(s => s.city))];

    for (const city of cities) {
      // 找到该城市的第一个景点作为代表
      const citySpot = spots.find(s => s.city === city);
      if (!citySpot || !citySpot.location) continue;

      const [lon, lat] = citySpot.location.split(',').map(Number);

      try {
        console.log(`  ${city}: 正在获取天气数据...`);

        const weather = await getWeatherFromAPI(lat, lon);
        const rainProbability = await getRainProbability(lat, lon);

        cityWeatherMap.set(city, {
          ...weather,
          rainProbability
        });

        console.log(`    ✅ 温度: ${weather.temperature}°C, 湿度: ${weather.humidity}%, 天气: ${weather.description}`);
      } catch (error: any) {
        console.log(`    ❌ 失败: ${error.message}`);
      }
    }

    // 3. 为每个景点应用微气候调整并更新
    console.log('\n\n💾 更新景点IoT数据（应用微气候调整）...\n');

    let updateCount = 0;
    const updateResults: Array<{
      city: string;
      name: string;
      category: string | null;
      microclimateType: string;
      baseTemp: number;
      adjustedTemp: number;
      baseHumidity: number;
      adjustedHumidity: number;
    }> = [];

    for (const spot of spots) {
      const baseWeather = cityWeatherMap.get(spot.city);
      if (!baseWeather) continue;

      // 识别微气候类型
      const microclimateType = identifyMicroclimateType(
        spot.name,
        spot.description,
        spot.category
      );

      // 应用微气候调整
      const adjusted = applyMicroclimateAdjustment(
        {
          temperature: baseWeather.temperature,
          humidity: baseWeather.humidity,
          rainProbability: baseWeather.rainProbability,
          description: baseWeather.description,
          icon: baseWeather.icon
        },
        microclimateType
      );

      // 生成拥挤度数据
      const hour = new Date().getHours();
      const baseCrowd = 30 + Math.random() * 40;  // 30-70基础拥挤度
      const crowdLevel = Math.round(Math.min(100, Math.max(0, baseCrowd)));
      const isOpen = hour >= 6 && hour < 22;

      // 更新数据库
      await prisma.spotIoTData.upsert({
        where: { spotId: spot.id },
        update: {
          crowdLevel,
          temperature: adjusted.temperature,
          rainProbability: adjusted.rainProbability,
          isOpen,
          weatherDescription: adjusted.description,
          weatherIcon: baseWeather.icon,
          weatherUpdatedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          spotId: spot.id,
          crowdLevel,
          temperature: adjusted.temperature,
          rainProbability: adjusted.rainProbability,
          isOpen,
          weatherDescription: adjusted.description,
          weatherIcon: baseWeather.icon,
          weatherUpdatedAt: new Date()
        }
      });

      updateCount++;

      // 记录结果
      updateResults.push({
        city: spot.city,
        name: spot.name,
        category: spot.category,
        microclimateType,
        baseTemp: baseWeather.temperature,
        adjustedTemp: adjusted.temperature,
        baseHumidity: baseWeather.humidity,
        adjustedHumidity: adjusted.humidity
      });
    }

    console.log(`✅ 成功更新 ${updateCount} 个景点\n`);

    // 4. 展示微气候差异
    console.log('='.repeat(60));
    console.log('\n📊 微气候差异展示\n');

    // 按城市分组展示
    const cityGroups = new Map<string, typeof updateResults>();
    for (const result of updateResults) {
      if (!cityGroups.has(result.city)) {
        cityGroups.set(result.city, []);
      }
      cityGroups.get(result.city)!.push(result);
    }

    // 展示前3个城市
    let cityCount = 0;
    for (const [city, results] of cityGroups) {
      if (cityCount >= 3) break;
      cityCount++;

      console.log(`\n城市: ${city}`);
      console.log('-'.repeat(60));

      // 按温度排序
      results.sort((a, b) => a.adjustedTemp - b.adjustedTemp);

      for (const r of results.slice(0, 10)) {  // 只展示前10个
        const tempDiff = r.adjustedTemp - r.baseTemp;
        const humidityDiff = r.adjustedHumidity - r.baseHumidity;

        console.log(`\n  ${r.name}`);
        console.log(`    类型: ${r.microclimateType} (${r.category || '未知'})`);
        console.log(`    温度: ${r.baseTemp}°C → ${r.adjustedTemp}°C (${tempDiff >= 0 ? '+' : ''}${tempDiff.toFixed(1)}°C)`);
        console.log(`    湿度: ${r.baseHumidity}% → ${r.adjustedHumidity}% (${humidityDiff >= 0 ? '+' : ''}${humidityDiff.toFixed(0)}%)`);
      }

      // 计算温差范围
      if (results.length >= 2) {
        const minTemp = results[0].adjustedTemp;
        const maxTemp = results[results.length - 1].adjustedTemp;
        console.log(`\n  📊 温度范围: ${minTemp}°C ~ ${maxTemp}°C (差异 ${(maxTemp - minTemp).toFixed(1)}°C)`);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ 更新完成！');

  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

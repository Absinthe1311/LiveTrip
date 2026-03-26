// 测试天气服务
import { getSpotWeatherData } from '../src/services/weatherService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWeatherService() {
  try {
    console.log('🧪 开始测试天气服务...');

    // 获取第一个景点
    const spot = await prisma.spot.findFirst({
      select: {
        id: true,
        name: true,
        location: true,
      },
    });

    if (!spot) {
      console.error('❌ 数据库中没有景点数据');
      return;
    }

    console.log(`📍 测试景点: ${spot.name} (${spot.id})`);
    console.log(`   坐标: ${spot.location}`);

    // 获取天气数据
    const weatherData = await getSpotWeatherData(spot.id);

    console.log('✅ 天气数据获取成功:');
    console.log(`   温度: ${weatherData.temperature}°C`);
    console.log(`   湿度: ${weatherData.humidity}%`);
    console.log(`   降雨概率: ${weatherData.rainProbability}%`);
    console.log(`   天气描述: ${weatherData.description}`);
    console.log(`   天气图标: ${weatherData.icon}`);
    console.log(`   更新时间: ${weatherData.updatedAt}`);

    // 检查数据库中的数据
    const iotData = await prisma.spotIoTData.findUnique({
      where: { spotId: spot.id },
    });

    if (iotData) {
      console.log('✅ 数据库中的 IoT 数据:');
      console.log(`   温度: ${iotData.temperature}`);
      console.log(`   降雨概率: ${iotData.rainProbability}`);
      console.log(`   天气描述: ${iotData.weatherDescription}`);
      console.log(`   天气图标: ${iotData.weatherIcon}`);
      console.log(`   天气更新时间: ${iotData.weatherUpdatedAt}`);
    } else {
      console.log('⚠️  数据库中没有 IoT 数据');
    }

    console.log('🎉 测试完成！');
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWeatherService();

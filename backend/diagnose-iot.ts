// 诊断IoT数据问题的脚本
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 IoT数据问题诊断\n');
  console.log('=' .repeat(60));

  // 1. 检查环境变量
  console.log('\n1️⃣  检查环境变量');
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const apiUrl = process.env.OPENWEATHERMAP_API_URL;
  console.log(`   API Key: ${apiKey ? '已配置 ✅' : '未配置 ❌'}`);
  console.log(`   API URL: ${apiUrl || '未配置'}`);

  // 2. 检查景点坐标
  console.log('\n2️⃣  检查景点坐标信息');
  const spots = await prisma.spot.findMany({
    where: { city: '北京' },
    select: { id: true, name: true, location: true, city: true },
    take: 5
  });

  console.log(`   北京景点数量: ${spots.length}`);

  for (const spot of spots) {
    console.log(`\n   景点: ${spot.name}`);
    console.log(`   坐标: ${spot.location || '无坐标 ❌'}`);

    if (spot.location) {
      const [lon, lat] = spot.location.split(',').map(Number);
      console.log(`   经度: ${lon}, 纬度: ${lat}`);
    }
  }

  // 3. 测试天气API
  console.log('\n\n3️⃣  测试OpenWeatherMap API');

  if (apiKey && spots.length > 0 && spots[0].location) {
    const [lon, lat] = spots[0].location.split(',').map(Number);
    const url = `${apiUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`;

    try {
      console.log(`   请求URL: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`);
      const response = await axios.get(url);
      const data = response.data;

      console.log(`   ✅ API调用成功`);
      console.log(`   温度: ${data.main.temp}°C`);
      console.log(`   湿度: ${data.main.humidity}%`);
      console.log(`   天气: ${data.weather[0].description}`);
    } catch (error: any) {
      console.log(`   ❌ API调用失败`);
      console.log(`   错误: ${error.response?.data?.message || error.message}`);
    }
  } else {
    console.log('   ⚠️  跳过API测试（缺少API Key或景点坐标）');
  }

  // 4. 检查IoT数据
  console.log('\n\n4️⃣  检查现有IoT数据');
  const iotData = await prisma.spotIoTData.findMany({
    where: {
      spot: { city: '北京' }
    },
    include: { spot: true },
    take: 5
  });

  console.log(`   北京景点IoT数据数量: ${iotData.length}`);

  for (const data of iotData) {
    console.log(`\n   景点: ${data.spot.name}`);
    console.log(`   温度: ${data.temperature}°C`);
    console.log(`   湿度: N/A`);
    console.log(`   拥挤度: ${data.crowdLevel}%`);
    console.log(`   更新时间: ${data.updatedAt.toLocaleString()}`);
  }

  // 5. 检查微气候服务
  console.log('\n\n5️⃣  测试微气候识别');
  const { identifyMicroclimateType, getMicroclimateAdjustment, MicroclimateType } = await import('./src/services/microclimateService');

  const testSpots = [
    { name: '香山公园', category: '公园' },
    { name: '故宫博物院', category: '博物馆' },
    { name: '颐和园', category: null },
    { name: '北海公园', category: '公园' }
  ];

  for (const spot of testSpots) {
    const type = identifyMicroclimateType(spot.name, null, spot.category);
    const adjustment = getMicroclimateAdjustment(type);
    console.log(`\n   ${spot.name} (${spot.category || '未知'}):`);
    console.log(`   微气候类型: ${type}`);
    console.log(`   温度调整: ${adjustment.temperatureOffset}°C`);
    console.log(`   湿度乘数: ${adjustment.humidityMultiplier}`);
    console.log(`   说明: ${adjustment.description}`);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('诊断完成');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

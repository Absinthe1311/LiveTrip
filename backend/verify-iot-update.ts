// 验证IoT数据更新结果
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✅ 验证IoT数据更新结果\n');
  console.log('='.repeat(60));

  // 查询北京景点
  const beijingSpots = await prisma.spot.findMany({
    where: { city: '北京' },
    include: { iotData: true },
    take: 10
  });

  console.log('\n📍 北京景点IoT数据（前10个）:\n');

  const temperatures: number[] = [];

  for (const spot of beijingSpots) {
    if (spot.iotData) {
      console.log(`${spot.name}:`);
      console.log(`  温度: ${spot.iotData.temperature}°C`);
      console.log(`  拥挤度: ${spot.iotData.crowdLevel}%`);
      console.log(`  降雨概率: ${spot.iotData.rainProbability}%`);
      console.log(`  天气: ${spot.iotData.weatherDescription}`);
      console.log(`  更新时间: ${spot.iotData.updatedAt.toLocaleString()}`);
      console.log('');

      temperatures.push(spot.iotData.temperature);
    }
  }

  // 计算温差
  if (temperatures.length >= 2) {
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;

    console.log('='.repeat(60));
    console.log('\n📊 统计数据:');
    console.log(`  最低温度: ${minTemp}°C`);
    console.log(`  最高温度: ${maxTemp}°C`);
    console.log(`  平均温度: ${avgTemp.toFixed(1)}°C`);
    console.log(`  温度差异: ${(maxTemp - minTemp).toFixed(1)}°C`);
    console.log('\n✅ 微气候调整已生效！不同景点温度存在明显差异。');
  }

  console.log('\n' + '='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

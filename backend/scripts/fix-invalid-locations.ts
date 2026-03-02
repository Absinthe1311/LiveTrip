// 查询和修复无效坐标的景点
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 查询无效坐标的景点...');

    // 查询所有坐标无效的景点
    const invalidSpots = await prisma.spot.findMany({
      where: {
        OR: [
          { location: '0,0' },
          { location: '' },
          { location: { startsWith: '0,0,0' } },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        location: true,
        address: true,
        source: true,
        createdAt: true,
      },
    });

    console.log(`✅ 找到 ${invalidSpots.length} 个无效坐标的景点`);

    if (invalidSpots.length === 0) {
      console.log('✅ 没有找到无效坐标的景点');
      return;
    }

    // 显示无效景点列表
    console.log('\n📋 无效坐标的景点列表:');
    console.log('─'.repeat(80));
    invalidSpots.forEach((spot, index) => {
      console.log(`${index + 1}. ${spot.name} (${spot.city})`);
      console.log(`   ID: ${spot.id}`);
      console.log(`   当前坐标: ${spot.location || 'null'}`);
      console.log(`   地址: ${spot.address || 'null'}`);
      console.log(`   来源: ${spot.source}`);
      console.log(`   创建时间: ${spot.createdAt.toISOString()}`);
      console.log('');
    });

    console.log('─'.repeat(80));

    // 动态导入amapService
    console.log('🔄 开始修复无效坐标...');
    const { getAmapService } = await import('../src/services/amapService');
    const amapService = getAmapService();

    let fixedCount = 0;
    let failedCount = 0;

    for (const spot of invalidSpots) {
      try {
        console.log(`\n🔧 正在修复: ${spot.name} (${spot.city})`);

        // 从高德地图API获取正确的坐标
        const searchResults = await amapService.getAttractions(
          spot.city,
          spot.name,
          '',
          1
        );

        if (searchResults && searchResults.length > 0) {
          const validSpot = searchResults[0];

          if (validSpot.location && validSpot.location !== '0,0') {
            // 更新数据库中的坐标
            await prisma.spot.update({
              where: { id: spot.id },
              data: {
                location: validSpot.location,
                address: validSpot.address || spot.address,
              },
            });

            console.log(`✅ 坐标已更新: ${spot.location} -> ${validSpot.location}`);
            fixedCount++;
          } else {
            console.warn(`⚠️  高德地图API返回的坐标也无效: ${validSpot.location}`);
            failedCount++;
          }
        } else {
          console.warn(`⚠️  高德地图API未找到该景点`);
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ 修复失败: ${spot.name}`, error);
        failedCount++;
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('✅ 修复完成');
    console.log(`   修复成功: ${fixedCount} 个`);
    console.log(`   修复失败: ${failedCount} 个`);
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('❌ 查询和修复失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

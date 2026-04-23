// AI辅助生成：GLM-5, 2026-04-23 17:15
// 描述：测试数据库查询

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('测试查询Spot表...');
    
    const spots = await prisma.spot.findMany({
      where: {
        city: '北京',
        isHot: true,
      },
      include: {
        image: {
          where: {
            status: 'approved',
          },
        },
        iotData: true,
      },
      take: 3,
    });

    console.log(`✅ 查询成功，找到 ${spots.length} 个景点`);
    console.log('示例数据:', JSON.stringify(spots[0], null, 2));
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();

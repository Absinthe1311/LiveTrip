// 热门景点控制器
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取热门景点
 * GET /api/hot-spots?city=北京
 */
export const getHotSpots = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    console.log(`🔥 获取热门景点，城市: ${city || '全部'}`);

    const where: any = {
      isHot: true,
    };

    if (city && typeof city === 'string') {
      where.city = city;
    }

    const hotSpots = await prisma.spot.findMany({
      where,
      include: {
        images: {
          where: {
            status: 'approved',
          },
          take: 1,
          orderBy: {
            priority: 'desc',
          },
        },
        iotData: true,
      },
      orderBy: {
        rating: 'desc',
      },
      take: 20,
    });

    // 转换为前端需要的格式
    const result = hotSpots.map(spot => ({
      id: spot.id,
      name: spot.name,
      image: spot.images.length > 0 ? spot.images[0].url : '',
      rating: spot.rating || 4.5,
      description: spot.description || '',
      openTime: spot.openTime || '全天开放',
      ticketPrice: spot.ticketPrice || 0,
      category: spot.category || '景点',
      city: spot.city,
      location: spot.location,
      address: spot.address,
    }));

    console.log(`✅ 找到 ${result.length} 个热门景点`);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ 获取热门景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取热门景点失败',
    });
  }
};

/**
 * 获取热门城市列表
 * GET /api/hot-cities
 */
export const getHotCities = async (req: Request, res: Response) => {
  try {
    console.log('🔥 获取热门城市列表');

    // 统计每个城市的热门景点数量
    const hotSpots = await prisma.spot.findMany({
      where: {
        isHot: true,
      },
      select: {
        city: true,
      },
    });

    // 统计城市
    const cityCount: Record<string, number> = {};
    hotSpots.forEach(spot => {
      cityCount[spot.city] = (cityCount[spot.city] || 0) + 1;
    });

    // 转换为数组并排序
    const cities = Object.entries(cityCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log(`✅ 找到 ${cities.length} 个热门城市`);

    res.json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    console.error('❌ 获取热门城市失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取热门城市失败',
    });
  }
};

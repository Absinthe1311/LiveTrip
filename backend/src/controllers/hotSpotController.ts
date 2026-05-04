// 热门景点控制器
import { Request, Response } from 'express';
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

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
        image: {
          where: {
            status: 'approved',
          },
        },
        iotData: true,
      },
      // 按城市排序，确保每个城市都能获取到景点
      orderBy: {
        city: 'asc',
      },
      // 不限制数量，返回所有热门景点
    });

    // 转换为前端需要的格式
    const result = hotSpots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      // 使用image表中的图片
      image: spot.image ? spot.image.url : '',
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
    hotSpots.forEach((spot) => {
      cityCount[spot.city] = (cityCount[spot.city] || 0) + 1;
    });

    // 转换为数组并排序
    const cities = Object.entries(cityCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // 只返回前8个城市

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

/**
 * 获取热门城市列表（包含景点信息和评分）
 * GET /api/hot-spots/cities
 */
export const getHotCitiesWithSpots = async (req: Request, res: Response) => {
  try {
    console.log('🔥 获取热门城市列表（包含景点）');

    // 获取所有热门景点
    const hotSpots = await prisma.spot.findMany({
      where: {
        isHot: true,
      },
      include: {
        iotData: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // 按城市分组
    const cityGroups: Record<string, typeof hotSpots> = {};
    hotSpots.forEach((spot) => {
      if (!cityGroups[spot.city]) {
        cityGroups[spot.city] = [];
      }
      cityGroups[spot.city].push(spot);
    });

    // 计算每个城市的平均评分和景点数量
    const cityData = Object.entries(cityGroups).map(([city, spots]) => {
      const totalRating = spots.reduce((sum, spot) => sum + (spot.rating || 4.5), 0);
      const avgRating = totalRating / spots.length;

      return {
        city,
        count: spots.length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        spots: spots.map((spot) => ({
          id: spot.id,
          name: spot.name,
          city: spot.city,
          rating: spot.rating || 4.5,
          description: spot.description || '',
          category: spot.category || '景点',
          ticketPrice: spot.ticketPrice || 0,
          isHot: spot.isHot,
        })),
      };
    });

    // 按景点数量排序
    cityData.sort((a, b) => b.count - a.count);

    // 只返回前8个城市
    const topCities = cityData.slice(0, 8);

    console.log(`✅ 找到 ${topCities.length} 个热门城市`);

    res.json({
      success: true,
      data: topCities,
    });
  } catch (error: any) {
    console.error('❌ 获取热门城市失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取热门城市失败',
    });
  }
};

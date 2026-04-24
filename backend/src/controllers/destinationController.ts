// 热门目的地控制器 - 优化版本
import { Request, Response } from 'express';
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

// 硬编码的6个热门城市
// 更新时间: 2026-04-23 17:10 - 触发重启
const HOT_CITIES = [
  { name: '北京', coverImage: '/images/cities/beijing.jpg', description: '千年古都，现代都市' },
  { name: '上海', coverImage: '/images/cities/shanghai.jpg', description: '东方明珠，魔都风情' },
  { name: '厦门', coverImage: '/images/cities/xiamen.jpg', description: '海上花园，文艺小资' },
  { name: '成都', coverImage: '/images/cities/chengdu.jpg', description: '天府之国，休闲之都' },
  { name: '杭州', coverImage: '/images/cities/hangzhou.jpg', description: '人间天堂，西湖美景' },
  { name: '西安', coverImage: '/images/cities/xian.jpg', description: '十三朝古都，历史名城' },
];

/**
 * 获取热门城市列表
 * GET /api/destinations/cities
 */
export const getHotCities = async (req: Request, res: Response) => {
  try {
    console.log('🏙️ 获取热门城市列表');

    const citiesData = [];

    for (const city of HOT_CITIES) {
      // 查询该城市的所有景点数量
      const spotCount = await prisma.spot.count({
        where: {
          city: city.name,
        },
      });

      // 查询该城市的所有景点平均评分
      const spots = await prisma.spot.findMany({
        where: {
          city: city.name,
        },
        select: {
          rating: true,
        },
      });

      const avgRating = spots.length > 0
        ? spots.reduce((sum, s) => sum + (s.rating || 4.5), 0) / spots.length
        : 4.5;

      // 获取该城市的景点分类
      const allSpotsForCategory = await prisma.spot.findMany({
        where: {
          city: city.name,
        },
        select: {
          category: true,
        },
      });

      const categories = [...new Set(allSpotsForCategory.map(s => s.category).filter(Boolean))].slice(0, 3) as string[];

      citiesData.push({
        name: city.name,
        coverImage: city.coverImage,
        description: city.description,
        spotCount,
        avgRating: parseFloat(avgRating.toFixed(1)),
        categories,
      });
    }

    console.log(`✅ 返回 ${citiesData.length} 个热门城市`);

    res.json({
      success: true,
      data: citiesData,
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
 * 获取指定城市的热门景点（用于首页展示，限制9个）
 * GET /api/destinations/cities/:city/spots?limit=9
 */
export const getCitySpots = async (req: Request, res: Response) => {
  try {
    const city = req.params.city as string;
    const limit = parseInt(req.query.limit as string) || 9;

    console.log(`📍 获取城市 ${city} 的热门景点，限制 ${limit} 个`);

    // 查询热门景点
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
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
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // 转换为前端需要的格式
    const result = spots.map((spot: any) => ({
      id: spot.id,
      name: spot.name,
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
    console.error('❌ 获取城市景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取城市景点失败',
    });
  }
};

/**
 * 获取指定城市的所有热门景点（用于城市详情页）
 * GET /api/destinations/cities/:city/all
 */
export const getCityAllSpots = async (req: Request, res: Response) => {
  try {
    const city = req.params.city as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;

    console.log(`📍 获取城市 ${city} 的所有景点，页码 ${page}，每页 ${pageSize} 个`);

    // 查询总数（所有有图片的景点）
    const total = await prisma.spot.count({
      where: {
        city: city,
        image: { isNot: null },
      },
    });

    // 查询景点（所有有图片的景点，不区分isHot）
    const spots = await prisma.spot.findMany({
      where: {
        city: city,
        image: { isNot: null },
      },
      include: {
        image: {
          where: {
            status: 'approved',
          },
        },
        iotData: true,
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 转换为前端需要的格式
    const result = spots.map((spot: any) => ({
      id: spot.id,
      name: spot.name,
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

    console.log(`✅ 找到 ${result.length} 个景点，总共 ${total} 个`);

    res.json({
      success: true,
      data: {
        spots: result,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('❌ 获取城市所有景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取城市所有景点失败',
    });
  }
};

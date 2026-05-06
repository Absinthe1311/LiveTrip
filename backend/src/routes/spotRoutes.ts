// 景点相关路由
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { spotService } from '../services/spotService';
import { alternativeRecommender } from '../services/alternativeRecommender';

const router = Router();
const prisma = new PrismaClient();

/**
 * 获取城市景点
 * GET /api/spots/city/:city
 */
router.get('/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;


    const spots = await spotService.citySpots(city, limit);

    res.json({
      success: true,
      data: spots,
      count: spots.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取城市景点失败',
    });
  }
});

/**
 * 获取备选景点
 * GET /api/spots/alternatives/:spotId
 */
router.get('/alternatives/:spotId', async (req, res) => {
  try {
    const { spotId } = req.params;
    const { city, excludeSpotIds } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: '缺少城市参数',
      });
    }

    // 解析excludeSpotIds参数
    const excludeIds = excludeSpotIds
      ? typeof excludeSpotIds === 'string'
        ? JSON.parse(excludeSpotIds)
        : excludeSpotIds
      : [];


    // 判断spotId是景点名称还是景点ID
    let actualSpotId = spotId;

    // 如果spotId看起来像景点名称（不是cuid格式），则通过名称查找景点ID
    if (!spotId.startsWith('cml')) {
      const spot = await prisma.spot.findFirst({
        where: {
          name: spotId,
          city: city as string,
        },
      });

      if (spot) {
        actualSpotId = spot.id;
      } else {
        return res.status(404).json({
          success: false,
          error: `未找到景点: ${spotId}`,
        });
      }
    }

    // 将excludeSpotIds中的景点名称转换为景点ID
    let actualExcludeIds: string[] = [];
    if (excludeIds.length > 0) {
      const excludeSpots = await prisma.spot.findMany({
        where: {
          name: {
            in: excludeIds,
          },
          city: city as string,
        },
        select: {
          id: true,
          name: true,
        },
      });

      actualExcludeIds = excludeSpots.map((s) => s.id);
    }

    const alternatives = await alternativeRecommender.getRecommendations(
      actualSpotId,
      city as string,
      actualExcludeIds
    );

    res.json({
      success: true,
      data: alternatives,
      count: alternatives.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取备选景点失败',
    });
  }
});

/**
 * 获取景点详情
 * GET /api/spots/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;


    const spot = await spotService.getSpotById(id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        error: '景点不存在',
      });
    }

    res.json({
      success: true,
      data: spot,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取景点详情失败',
    });
  }
});

/**
 * 获取景点IoT数据
 * GET /api/spots/:id/iot
 */
router.get('/:id/iot', async (req, res) => {
  try {
    const { id } = req.params;


    const iotData = await spotService.spotIoT(id);

    if (!iotData) {
      return res.status(404).json({
        success: false,
        error: 'IoT数据不存在',
      });
    }

    res.json({
      success: true,
      data: iotData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '获取景点IoT数据失败',
    });
  }
});

/**
 * 为景点生成IoT数据
 * POST /api/spots/:id/iot/generate
 */
router.post('/:id/iot/generate', async (req, res) => {
  try {
    const { id } = req.params;


    const iotData = await spotService.genIot(id);

    if (!iotData) {
      return res.status(404).json({
        success: false,
        error: '生成IoT数据失败',
      });
    }

    res.json({
      success: true,
      data: iotData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '生成景点IoT数据失败',
    });
  }
});

/**
 * 批量获取IoT数据
 * POST /api/spots/iot/batch
 */
router.post('/iot/batch', async (req, res) => {
  try {
    const { spotIds } = req.body;

    if (!Array.isArray(spotIds)) {
      return res.status(400).json({
        success: false,
        error: 'spotIds 必须是数组',
      });
    }


    const iotDataMap = await spotService.batchIot(spotIds);

    // 转换为数组
    const iotDataList = Array.from(iotDataMap.entries()).map(([id, data]) => ({
      spotId: id,
      id: data.id,
      crowdLevel: data.crowdLevel,
      temperature: data.temperature,
      rainProbability: data.rainProbability,
      isOpen: data.isOpen,
      generatedAt: data.generatedAt,
      updatedAt: data.updatedAt,
    }));

    res.json({
      success: true,
      data: iotDataList,
      count: iotDataList.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '批量获取IoT数据失败',
    });
  }
});

/**
 * 更新备选关系（替换景点时调用）
 * POST /api/spots/alternatives/update
 */
router.post('/alternatives/update', async (req, res) => {
  try {
    const { oldSpotId, newSpotId, city } = req.body;

    if (!oldSpotId || !newSpotId || !city) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: oldSpotId, newSpotId, city',
      });
    }


    await spotService.updateAlternativeRelations(oldSpotId, newSpotId, city);

    res.json({
      success: true,
      message: '备选关系更新成功',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '更新备选关系失败',
    });
  }
});

/**
 * 搜索景点（通过名称和城市）
 * POST /api/spots/search
 */
router.post('/search', async (req, res) => {
  try {
    const { name, city } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: name, city',
      });
    }


    const spot = await prisma.spot.findFirst({
      where: {
        name: name,
        city: city,
      },
    });

    if (!spot) {
      return res.status(404).json({
        success: false,
        error: '未找到景点',
      });
    }

    res.json({
      success: true,
      data: spot,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '搜索景点失败',
    });
  }
});

export default router;

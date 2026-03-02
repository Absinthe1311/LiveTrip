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

    console.log(`🔍 接收到获取 ${city} 景点的请求，限制数量: ${limit}`);

    const spots = await spotService.getCitySpots(city, limit);

    res.json({
      success: true,
      data: spots,
      count: spots.length,
    });
  } catch (error: any) {
    console.error('❌ 获取城市景点失败:', error);
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
      ? (typeof excludeSpotIds === 'string' ? JSON.parse(excludeSpotIds) : excludeSpotIds)
      : [];

    console.log(`🔍 接收获取备选景点请求: ${spotId}, 城市: ${city}`);
    console.log(`   排除的景点(名称): ${excludeIds.length} 个`);

    // 判断spotId是景点名称还是景点ID
    let actualSpotId = spotId;
    
    // 如果spotId看起来像景点名称（不是cuid格式），则通过名称查找景点ID
    if (!spotId.startsWith('cml')) {
      console.log(`🔍 spotId是景点名称，正在查找对应的景点ID...`);
      const spot = await prisma.spot.findFirst({
        where: {
          name: spotId,
          city: city as string,
        },
      });
      
      if (spot) {
        actualSpotId = spot.id;
        console.log(`✅ 找到景点ID: ${actualSpotId}`);
      } else {
        console.warn(`⚠️  未找到景点: ${spotId}`);
        return res.status(404).json({
          success: false,
          error: `未找到景点: ${spotId}`,
        });
      }
    }

    // 将excludeSpotIds中的景点名称转换为景点ID
    let actualExcludeIds: string[] = [];
    if (excludeIds.length > 0) {
      console.log(`🔍 正在将排除的景点名称转换为ID...`);
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
      
      actualExcludeIds = excludeSpots.map(s => s.id);
      console.log(`✅ 转换后的排除景点ID: ${actualExcludeIds.length} 个`);
    }

    const alternatives = await alternativeRecommender.getRecommendations(actualSpotId, city as string, actualExcludeIds);

    res.json({
      success: true,
      data: alternatives,
      count: alternatives.length,
    });
  } catch (error: any) {
    console.error('❌ 获取备选景点失败:', error);
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

    console.log(`🔍 接收获取景点详情请求: ${id}`);

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
    console.error('❌ 获取景点详情失败:', error);
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

    console.log(`🔍 接收获取景点IoT数据请求: ${id}`);

    const iotData = await spotService.getSpotIoTData(id);

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
    console.error('❌ 获取景点IoT数据失败:', error);
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

    console.log(`🔄 接收生成景点IoT数据请求: ${id}`);

    const iotData = await spotService.generateIoTDataForSpot(id);

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
    console.error('❌ 生成景点IoT数据失败:', error);
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

    console.log(`🔍 接收批量获取IoT数据请求: ${spotIds.length} 个景点`);

    const iotDataMap = await spotService.getBatchIoTData(spotIds);

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
    console.error('❌ 批量获取IoT数据失败:', error);
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

    console.log(`🔄 接收更新备选关系请求: ${oldSpotId} -> ${newSpotId}`);

    await spotService.updateAlternativeRelations(oldSpotId, newSpotId, city);

    res.json({
      success: true,
      message: '备选关系更新成功',
    });
  } catch (error: any) {
    console.error('❌ 更新备选关系失败:', error);
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

    console.log(`🔍 接收搜索景点请求: ${name}, 城市: ${city}`);

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
    console.error('❌ 搜索景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '搜索景点失败',
    });
  }
});

export default router;

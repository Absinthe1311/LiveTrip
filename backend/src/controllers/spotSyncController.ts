// 景点同步控制器 - 处理从前端同步景点数据到数据库
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { spotService } from '../services/spotService';

const prisma = new PrismaClient();

/**
 * 同步景点到数据库
 * POST /api/spots/sync
 */
export const syncSpot = async (req: Request, res: Response) => {
  try {
    const { name, city, category, ticketPrice, openTime, rating, description, isOutdoor, location } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: name, city',
      });
    }

    console.log(`🔄 同步景点到数据库: ${name}, ${city}`);

    // 检查景点是否已存在
    const existingSpot = await prisma.spot.findFirst({
      where: {
        name,
        city,
      },
    });

    if (existingSpot) {
      console.log(`✅ 景点已存在: ${existingSpot.id}`);

      // 检查IoT数据是否存在，不存在则生成
      const existingIoTData = await prisma.spotIoTData.findUnique({
        where: { spotId: existingSpot.id },
      });

      if (!existingIoTData) {
        console.log(`🔄 为已存在的景点生成IoT数据: ${existingSpot.name}`);
        try {
          const iotData = await spotService.generateIoTDataForSpot(existingSpot.id);
          if (iotData) {
            console.log(`✅ IoT数据生成成功: ${existingSpot.name}`);
          }
        } catch (error) {
          console.error(`❌ IoT数据生成失败: ${existingSpot.name}`, error);
        }
      }

      return res.json({
        success: true,
        data: existingSpot,
        message: '景点已存在',
      });
    }

    // 创建新景点
    const spot = await prisma.spot.create({
      data: {
        amapId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        location: location || '0,0',
        address: null,
        city,
        category: category || null,
        ticketPrice: ticketPrice || 0,
        openTime: openTime || null,
        rating: rating || null,
        description: description || null,
        isOutdoor: isOutdoor ?? true,
        source: 'frontend',
      },
    });

    console.log(`✅ 景点创建成功: ${spot.id}`);

    // 自动生成IoT数据
    try {
      console.log(`🔄 为新景点生成IoT数据: ${spot.name}`);
      const iotData = await spotService.generateIoTDataForSpot(spot.id);
      if (iotData) {
        console.log(`✅ IoT数据生成成功: ${spot.name}`);
      }
    } catch (error) {
      console.error(`❌ IoT数据生成失败: ${spot.name}`, error);
    }

    return res.json({
      success: true,
      data: spot,
      message: '景点同步成功',
    });
  } catch (error: any) {
    console.error('❌ 同步景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '同步景点失败',
    });
  }
};

/**
 * 批量同步景点
 * POST /api/spots/sync/batch
 */
export const syncSpotsBatch = async (req: Request, res: Response) => {
  try {
    const { spots } = req.body;

    if (!Array.isArray(spots) || spots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'spots 必须是非空数组',
      });
    }

    console.log(`🔄 批量同步 ${spots.length} 个景点`);

    const results = [];

    for (const spotData of spots) {
      try {
        // 检查景点是否已存在
        const existingSpot = await prisma.spot.findFirst({
          where: {
            name: spotData.name,
            city: spotData.city,
          },
        });

        if (existingSpot) {
          results.push({
            success: true,
            spot: existingSpot,
            message: '景点已存在',
          });
        } else {
          // 创建新景点
          const spot = await prisma.spot.create({
            data: {
              amapId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: spotData.name,
              location: spotData.location || '0,0',
              address: spotData.address || null,
              city: spotData.city,
              category: spotData.category || null,
              ticketPrice: spotData.ticketPrice || 0,
              openTime: spotData.openTime || null,
              rating: spotData.rating || null,
              description: spotData.description || null,
              isOutdoor: spotData.isOutdoor ?? true,
              source: 'frontend',
            },
          });

          results.push({
            success: true,
            spot,
            message: '景点创建成功',
          });
        }
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message || String(error),
          spotData,
        });
      }
    }

    return res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('❌ 批量同步景点失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '批量同步景点失败',
    });
  }
};

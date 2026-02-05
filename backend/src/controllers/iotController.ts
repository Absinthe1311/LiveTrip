// IoT数据控制器 - 处理IoT实时数据相关请求
import { Request, Response } from 'express';
import { iotDataGenerator } from '../iot/iotDataGenerator';

/**
 * 获取所有景点的 IoT 实时数据
 * GET /api/iot/data
 */
export const getIoTData = async (req: Request, res: Response) => {
  try {
    console.log('📡 获取 IoT 实时数据...');

    // 从 IoT 数据生成器获取数据
    const data = iotDataGenerator.getIoTData();

    console.log(`✅ IoT 数据获取成功，时间戳: ${data.timestamp}`);
    console.log(`   景点数量: ${data.spots.length}`);

    // 返回数据
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('❌ 获取 IoT 数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取 IoT 数据失败',
    });
  }
};

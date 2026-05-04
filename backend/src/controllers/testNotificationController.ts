/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：控制器重构
 */

// 测试通知控制器 - 用于测试IoT通知功能
import { Request, Response } from 'express';
import { notificationService, NotificationChannel } from '../services/notificationService';
import { SensorType, SensorLevel } from '../services/environmentSensorService';

/**
 * 发送测试通知
 * POST /api/notifications/test
 */
export const sendTestNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    const { type = 'rain' } = req.body;

    // 创建示例通知
    let title = '';
    let content = '';
    let sensorType = SensorType.RAIN;
    let level = SensorLevel.WARNING;

    switch (type) {
      case 'rain':
        title = '⚡ 警告：故宫 降雨提醒';
        content = '🌧️ 故宫可能下雨(65%)\n📍 景点类型：户外景点\n💡 建议：准备雨具，注意防滑';
        sensorType = SensorType.RAIN;
        level = SensorLevel.WARNING;
        break;
      case 'rain-danger':
        title = '⚠️ 紧急：长城 降雨提醒';
        content =
          '⚠️ 长城降雨概率极高(85%)\n📍 景点类型：户外景点\n💡 建议：调整行程或携带雨具\n⏰ 最佳游览时间：雨后';
        sensorType = SensorType.RAIN;
        level = SensorLevel.DANGER;
        break;
      case 'crowd':
        title = '⚡ 警告：天安门广场 人流提醒';
        content =
          '👥 天安门广场人流较多(72%)\n📍 当前状态：人流适中\n💡 建议：可能需要排队，建议错峰游览\n⏰ 最佳游览时间：早8:00-9:00';
        sensorType = SensorType.CROWD;
        level = SensorLevel.WARNING;
        break;
      case 'crowd-danger':
        title = '⚠️ 紧急：颐和园 人流提醒';
        content =
          '👥 颐和园极度拥挤(92%)\n📍 当前状态：极度拥挤\n💡 建议：避开或选择其他时间\n⏰ 推荐替代景点：圆明园、北海公园';
        sensorType = SensorType.CROWD;
        level = SensorLevel.DANGER;
        break;
      case 'temperature':
        title = '⚡ 警告：三亚 温度提醒';
        content =
          '🌡️ 三亚温度较高(36°C)\n📍 天气状况：晴朗\n💡 建议：做好防晒，多补充水分\n⏰ 最佳游览时间：早6:00-9:00，晚17:00-19:00';
        sensorType = SensorType.TEMPERATURE;
        level = SensorLevel.WARNING;
        break;
      case 'close':
        title = '⚠️ 紧急：圆明园 关闭提醒';
        content =
          '🚫 圆明园已关闭\n📍 关闭原因：维护中\n💡 建议：调整行程，选择其他景点\n⏰ 预计开放时间：明日9:00';
        sensorType = SensorType.CLOSE;
        level = SensorLevel.DANGER;
        break;
      default:
        title = 'ℹ️ 提示：环境感知通知';
        content = '这是一条测试通知\n包含多行内容\n用于测试换行显示效果';
        level = SensorLevel.INFO;
    }

    // 发送通知
    await notificationService.notify(
      userId,
      {
        type: sensorType,
        spotId: 'test-spot-id',
        spotName: '测试景点',
        level,
        message: content,
        data: {
          test: true,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP]
    );

    res.json({
      success: true,
      message: '测试通知已发送',
      data: {
        title,
        content,
        level,
        type: sensorType,
      },
    });
  } catch (error: any) {
    console.error('发送测试通知失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '发送测试通知失败',
    });
  }
};

/**
 * 批量发送测试通知
 * POST /api/notifications/test-batch
 */
export const sendBatchTestNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未授权',
      });
    }

    // 创建多个示例通知
    const testResults = [
      {
        type: SensorType.RAIN,
        spotId: 'spot-1',
        spotName: '故宫',
        level: SensorLevel.WARNING,
        message: '🌧️ 故宫可能下雨(65%)，建议准备雨具',
        data: { rainProbability: 65 },
        timestamp: new Date(),
      },
      {
        type: SensorType.CROWD,
        spotId: 'spot-2',
        spotName: '天安门广场',
        level: SensorLevel.DANGER,
        message: '👥 天安门广场极度拥挤(92%)，建议避开或选择其他时间',
        data: { crowdLevel: 92 },
        timestamp: new Date(),
      },
      {
        type: SensorType.TEMPERATURE,
        spotId: 'spot-3',
        spotName: '三亚',
        level: SensorLevel.WARNING,
        message: '🌡️ 三亚温度较高(36°C)，建议做好防晒',
        data: { temperature: 36 },
        timestamp: new Date(),
      },
    ];

    // 批量发送通知
    await notificationService.notifyBatch(userId, testResults, [
      NotificationChannel.WEBSOCKET,
      NotificationChannel.IN_APP,
    ]);

    res.json({
      success: true,
      message: '批量测试通知已发送',
      data: {
        count: testResults.length,
        notifications: testResults.map((r) => ({
          spotName: r.spotName,
          level: r.level,
          message: r.message,
        })),
      },
    });
  } catch (error: any) {
    console.error('发送批量测试通知失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '发送批量测试通知失败',
    });
  }
};

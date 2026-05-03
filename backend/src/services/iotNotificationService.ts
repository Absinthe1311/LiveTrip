// IoT通知增强服务 - 多维度通知触发机制
import { PrismaClient } from '@prisma/client';
import { NotificationChannel } from './notificationService';
import { sendToUser } from '../socket/socketService';

const prisma = new PrismaClient();

// 通知触发类型
export enum NotificationTriggerType {
  CRITICAL_STATUS = 'critical_status', // 临界状态（原有）
  STATUS_CHANGE = 'status_change', // 状态变化
  TREND_WARNING = 'trend_warning', // 趋势预警
  FAVORITE_SPOT = 'favorite_spot', // 收藏景点变化
  RECOMMENDED_SPOT = 'recommended_spot', // 推荐景点新问题
  WEATHER_CHANGE = 'weather_change', // 天气显著变化
}

// 通知级别
export enum NotificationLevel {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
}

// IoT状态变化接口
export interface IoTStatusChange {
  spotId: string;
  spotName: string;
  changeType: NotificationTriggerType;
  level: NotificationLevel;
  oldValue: any;
  newValue: any;
  delta?: number;
  reason: string;
  suggestion: string;
  timestamp: Date;
}

// IoT状态历史记录（用于趋势分析）
const iotStatusHistory = new Map<
  string,
  Array<{
    timestamp: Date;
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  }>
>();

// 配置参数
const CONFIG = {
  // 状态变化阈值
  CROWD_LEVEL_CHANGE_THRESHOLD: 20, // 拥挤度变化阈值
  TEMPERATURE_CHANGE_THRESHOLD: 5, // 温度变化阈值
  RAIN_PROB_CHANGE_THRESHOLD: 30, // 降雨概率变化阈值

  // 趋势监控参数
  TREND_MONITOR_WINDOW: 3, // 趋势监控窗口（次数）
  TREND_INCREASE_THRESHOLD: 0.7, // 上升趋势阈值（70%的记录在上升）

  // 通知去重
  NOTIFICATION_DEDUP_WINDOW: 10 * 60 * 1000, // 去重时间窗口（10分钟）

  // 历史记录保留
  HISTORY_MAX_SIZE: 10, // 每个景点最多保留10条历史记录
  HISTORY_EXPIRE_TIME: 30 * 60 * 1000, // 历史记录过期时间（30分钟）
};

/**
 * 记录IoT状态历史
 */
export function recordIoTStatus(
  spotId: string,
  status: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  }
): void {
  const now = new Date();

  if (!iotStatusHistory.has(spotId)) {
    iotStatusHistory.set(spotId, []);
  }

  const history = iotStatusHistory.get(spotId)!;

  // 添加新记录
  history.push({
    timestamp: now,
    ...status,
  });

  // 清理过期记录
  const validHistory = history.filter(
    (record) => now.getTime() - record.timestamp.getTime() < CONFIG.HISTORY_EXPIRE_TIME
  );

  // 限制历史记录数量
  if (validHistory.length > CONFIG.HISTORY_MAX_SIZE) {
    validHistory.splice(0, validHistory.length - CONFIG.HISTORY_MAX_SIZE);
  }

  iotStatusHistory.set(spotId, validHistory);
}

/**
 * 获取IoT状态历史
 */
export function getIoTStatusHistory(spotId: string): Array<{
  timestamp: Date;
  crowdLevel: number;
  temperature: number;
  rainProbability: number;
  isOpen: boolean;
}> {
  return iotStatusHistory.get(spotId) || [];
}

/**
 * 检测状态变化
 */
export async function detectStatusChanges(
  spotId: string,
  spotName: string,
  currentStatus: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  },
  previousStatus?: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  }
): Promise<IoTStatusChange[]> {
  const changes: IoTStatusChange[] = [];
  const now = new Date();

  if (!previousStatus) {
    // 没有历史数据，无法检测变化
    return changes;
  }

  // 1. 检测拥挤度变化
  const crowdDelta = currentStatus.crowdLevel - previousStatus.crowdLevel;
  if (Math.abs(crowdDelta) >= CONFIG.CROWD_LEVEL_CHANGE_THRESHOLD) {
    const isIncrease = crowdDelta > 0;
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.STATUS_CHANGE,
      level: isIncrease ? NotificationLevel.WARNING : NotificationLevel.INFO,
      oldValue: previousStatus.crowdLevel,
      newValue: currentStatus.crowdLevel,
      delta: crowdDelta,
      reason: `拥挤度${isIncrease ? '上升' : '下降'}了${Math.abs(crowdDelta)}%`,
      suggestion: isIncrease ? '建议提前到达或选择其他时间段' : '当前人流较少，适合游览',
      timestamp: now,
    });
  }

  // 2. 检测温度变化
  const tempDelta = currentStatus.temperature - previousStatus.temperature;
  if (Math.abs(tempDelta) >= CONFIG.TEMPERATURE_CHANGE_THRESHOLD) {
    const isIncrease = tempDelta > 0;
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.WEATHER_CHANGE,
      level: NotificationLevel.INFO,
      oldValue: previousStatus.temperature,
      newValue: currentStatus.temperature,
      delta: tempDelta,
      reason: `温度${isIncrease ? '升高' : '降低'}了${Math.abs(tempDelta).toFixed(1)}°C`,
      suggestion: isIncrease ? '注意防晒和补水' : '注意保暖',
      timestamp: now,
    });
  }

  // 3. 检测降雨概率变化
  const rainDelta = currentStatus.rainProbability - previousStatus.rainProbability;
  if (rainDelta >= CONFIG.RAIN_PROB_CHANGE_THRESHOLD) {
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.WEATHER_CHANGE,
      level:
        currentStatus.rainProbability > 60 ? NotificationLevel.WARNING : NotificationLevel.INFO,
      oldValue: previousStatus.rainProbability,
      newValue: currentStatus.rainProbability,
      delta: rainDelta,
      reason: `降雨概率上升了${rainDelta}%，当前${currentStatus.rainProbability}%`,
      suggestion: '建议携带雨具或调整行程',
      timestamp: now,
    });
  }

  // 4. 检测开放状态变化
  if (currentStatus.isOpen !== previousStatus.isOpen) {
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.CRITICAL_STATUS,
      level: NotificationLevel.DANGER,
      oldValue: previousStatus.isOpen ? '开放' : '关闭',
      newValue: currentStatus.isOpen ? '开放' : '关闭',
      reason: currentStatus.isOpen ? '景点已重新开放' : '景点已关闭',
      suggestion: currentStatus.isOpen ? '可以正常游览' : '建议调整行程或联系景区确认',
      timestamp: now,
    });
  }

  return changes;
}

/**
 * 检测趋势预警
 */
export function detectTrendWarning(spotId: string, spotName: string): IoTStatusChange | null {
  const history = getIoTStatusHistory(spotId);

  if (history.length < CONFIG.TREND_MONITOR_WINDOW) {
    // 历史数据不足，无法判断趋势
    return null;
  }

  // 获取最近N条记录
  const recentHistory = history.slice(-CONFIG.TREND_MONITOR_WINDOW);

  // 检测拥挤度上升趋势
  let increaseCount = 0;
  for (let i = 1; i < recentHistory.length; i++) {
    if (recentHistory[i].crowdLevel > recentHistory[i - 1].crowdLevel) {
      increaseCount++;
    }
  }

  const increaseRatio = increaseCount / (recentHistory.length - 1);

  if (increaseRatio >= CONFIG.TREND_INCREASE_THRESHOLD) {
    const latestStatus = recentHistory[recentHistory.length - 1];
    const earliestStatus = recentHistory[0];
    const totalIncrease = latestStatus.crowdLevel - earliestStatus.crowdLevel;

    return {
      spotId,
      spotName,
      changeType: NotificationTriggerType.TREND_WARNING,
      level: NotificationLevel.WARNING,
      oldValue: earliestStatus.crowdLevel,
      newValue: latestStatus.crowdLevel,
      delta: totalIncrease,
      reason: `拥挤度持续上升（${earliestStatus.crowdLevel}% → ${latestStatus.crowdLevel}%）`,
      suggestion: '建议尽快前往或选择其他景点',
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * 检测临界状态（原有逻辑增强）
 */
export function detectCriticalStatus(
  spotId: string,
  spotName: string,
  status: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  },
  thresholds?: {
    crowdLevel?: number;
    rainProbability?: number;
  }
): IoTStatusChange[] {
  const changes: IoTStatusChange[] = [];
  const now = new Date();

  const crowdThreshold = thresholds?.crowdLevel || 85;
  const rainThreshold = thresholds?.rainProbability || 70;

  // 检测极度拥挤
  if (status.crowdLevel >= crowdThreshold) {
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.CRITICAL_STATUS,
      level: NotificationLevel.DANGER,
      oldValue: null,
      newValue: status.crowdLevel,
      reason: `景点极度拥挤（${status.crowdLevel}%）`,
      suggestion: '建议选择其他景点或错峰游览',
      timestamp: now,
    });
  }

  // 检测高降雨概率
  if (status.rainProbability >= rainThreshold) {
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.CRITICAL_STATUS,
      level: NotificationLevel.WARNING,
      oldValue: null,
      newValue: status.rainProbability,
      reason: `降雨概率较高（${status.rainProbability}%）`,
      suggestion: '建议携带雨具或选择室内景点',
      timestamp: now,
    });
  }

  // 检测景点关闭
  if (!status.isOpen) {
    changes.push({
      spotId,
      spotName,
      changeType: NotificationTriggerType.CRITICAL_STATUS,
      level: NotificationLevel.DANGER,
      oldValue: '开放',
      newValue: '关闭',
      reason: '景点当前已关闭',
      suggestion: '建议调整行程或联系景区确认开放时间',
      timestamp: now,
    });
  }

  return changes;
}

/**
 * 生成丰富的通知内容
 */
export function generateNotificationContent(change: IoTStatusChange): {
  title: string;
  content: string;
  data: any;
} {
  const emoji = {
    [NotificationLevel.INFO]: 'ℹ️',
    [NotificationLevel.WARNING]: '⚠️',
    [NotificationLevel.DANGER]: '🚨',
  };

  const typeLabel = {
    [NotificationTriggerType.CRITICAL_STATUS]: '状态告警',
    [NotificationTriggerType.STATUS_CHANGE]: '状态变化',
    [NotificationTriggerType.TREND_WARNING]: '趋势预警',
    [NotificationTriggerType.FAVORITE_SPOT]: '收藏景点',
    [NotificationTriggerType.RECOMMENDED_SPOT]: '推荐景点',
    [NotificationTriggerType.WEATHER_CHANGE]: '天气变化',
  };

  const title = `${emoji[change.level]} ${change.spotName} - ${typeLabel[change.changeType]}`;

  let content = `📊 ${change.reason}\n\n`;
  content += `💡 建议：${change.suggestion}\n\n`;

  // 添加变化详情
  if (change.oldValue !== null && change.newValue !== null) {
    if (typeof change.oldValue === 'number' && typeof change.newValue === 'number') {
      content += `📈 变化：${change.oldValue} → ${change.newValue}`;
      if (change.delta) {
        content += ` (${change.delta > 0 ? '+' : ''}${change.delta})`;
      }
      content += '\n';
    } else {
      content += `📈 状态：${change.oldValue} → ${change.newValue}\n`;
    }
  }

  content += `⏰ 时间：${change.timestamp.toLocaleTimeString('zh-CN')}`;

  return {
    title,
    content,
    data: {
      spotId: change.spotId,
      spotName: change.spotName,
      changeType: change.changeType,
      level: change.level,
      oldValue: change.oldValue,
      newValue: change.newValue,
      delta: change.delta,
      timestamp: change.timestamp.toISOString(),
    },
  };
}

/**
 * 通知去重检查
 */
const recentNotifications = new Map<string, Date>();

export function shouldSendNotification(change: IoTStatusChange): boolean {
  const key = `${change.spotId}-${change.changeType}`;
  const now = new Date();

  if (recentNotifications.has(key)) {
    const lastSent = recentNotifications.get(key)!;
    if (now.getTime() - lastSent.getTime() < CONFIG.NOTIFICATION_DEDUP_WINDOW) {
      return false; // 在去重窗口内，不发送
    }
  }

  recentNotifications.set(key, now);
  return true;
}

/**
 * 发送IoT通知（主入口）
 */
export async function sendIoTNotifications(
  userId: string,
  changes: IoTStatusChange[]
): Promise<void> {
  for (const change of changes) {
    // 去重检查
    if (!shouldSendNotification(change)) {
      continue;
    }

    // 生成通知内容
    const { title, content, data } = generateNotificationContent(change);

    // 发送通知
    try {
      // 1. 创建站内通知
      await prisma.notification.create({
        data: {
          userId,
          type: 'iot_alert',
          title,
          content,
          isRead: false,
          data: JSON.stringify(data),
        },
      });

      // 2. WebSocket实时推送
      sendToUser(userId, 'sensor:alert', {
        title,
        content,
        level: change.level,
        ...data,
        timestamp: new Date(),
      });

      console.log(`✅ 已发送IoT通知: ${title}`);
    } catch (error) {
      console.error(`❌ 发送IoT通知失败:`, error);
    }
  }
}

/**
 * 批量检测并发送IoT通知
 */
export async function batchDetectAndNotify(
  spotStatusList: Array<{
    spotId: string;
    spotName: string;
    status: {
      crowdLevel: number;
      temperature: number;
      rainProbability: number;
      isOpen: boolean;
    };
    userId?: string; // 可选：指定用户
  }>
): Promise<void> {
  for (const item of spotStatusList) {
    // 记录历史状态
    recordIoTStatus(item.spotId, item.status);

    // 获取历史状态
    const history = getIoTStatusHistory(item.spotId);
    const previousStatus = history.length > 1 ? history[history.length - 2] : undefined;

    // 检测各种变化
    const allChanges: IoTStatusChange[] = [];

    // 1. 状态变化检测
    const statusChanges = await detectStatusChanges(
      item.spotId,
      item.spotName,
      item.status,
      previousStatus
    );
    allChanges.push(...statusChanges);

    // 2. 趋势预警检测
    const trendWarning = detectTrendWarning(item.spotId, item.spotName);
    if (trendWarning) {
      allChanges.push(trendWarning);
    }

    // 3. 临界状态检测
    const criticalStatus = detectCriticalStatus(item.spotId, item.spotName, item.status);
    allChanges.push(...criticalStatus);

    // 发送通知
    if (allChanges.length > 0 && item.userId) {
      await sendIoTNotifications(item.userId, allChanges);
    }
  }
}

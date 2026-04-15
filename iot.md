# LiveTrip IoT 环境感知功能分析文档

## 文档说明

本文档详细分析 LiveTrip 项目当前的 IoT 实现情况，并规划后续环境感知功能的实现方案。

**最后更新时间**：2026-04-15

---

## 一、当前 IoT 数据实现分析

### 1.1 IoT 数据来源

当前项目的 IoT 数据主要来自两个服务：

#### 1.1.1 天气数据服务 (weatherService.ts)

**数据来源**：OpenWeatherMap API（真实数据）

**获取方式**：
```typescript
// 通过景点坐标获取实时天气
async function getOpenWeatherData(lat: number, lon: number)
```

**数据内容**：
- **温度 (temperature)**：实时温度（摄氏度）
- **湿度 (humidity)**：空气湿度百分比
- **天气描述 (weatherDescription)**：如"晴"、"多云"、"小雨"等
- **天气图标 (weatherIcon)**：OpenWeatherMap 图标代码
- **降雨概率 (rainProbability)**：未来24小时平均降雨概率（0-100%）

**缓存机制**：
- 缓存时长：**1小时**（`WEATHER_CACHE_DURATION = 60 * 60 * 1000`）
- 缓存位置：数据库 `SpotIoTData` 表
- 缓存字段：`weatherUpdatedAt`（天气数据更新时间）

**更新时机**：
1. 当用户请求 IoT 数据时（通过 `iotController.ts`）
2. 缓存超过1小时后，自动调用 OpenWeatherMap API 更新
3. 可通过 `clearWeatherCache(spotId)` 强制清除缓存

---

#### 1.1.2 人流数据服务 (crowdSimulator.ts)

**数据来源**：**模拟数据**（非真实数据）

**计算模型**：
```
人流值 = 时段系数 × 100 × 热度系数 + 随机波动(±5%)
```

**计算因素**：

| 因素　　　　 | 说明　　　　　　　　　　　 | 影响范围　|
| --------------| ----------------------------| -----------|
| **时段系数** | 根据当前时间和是否周末计算 | 0% - 78%　|
| **热度系数** | 基于景点收藏数量计算　　　 | 1.0 - 1.5 |
| **随机波动** | 模拟真实波动　　　　　　　 | ±5%　　　 |

**时段系数详细规则**：

**工作日**：
- 9:00-11:00、14:00-16:00：40%（中等人流）
- 11:00-14:00：60%（高峰）
- 6:00-22:00（其他时段）：20%（低峰）
- 22:00-6:00：0%（闭馆）

**周末及节假日**（上浮30%）：
- 9:00-18:00：52%（中等人流）
- 11:00-14:00：78%（高峰）
- 6:00-22:00（其他时段）：26%（低峰）

**热度系数计算**：
```typescript
// 基于景点收藏数量
const favoriteCount = await prisma.favorite.count({ where: { spotId } });
const coefficient = 1.0 + (favoriteCount / 50) * 0.5;
// 范围：1.0（无收藏）- 1.5（50个收藏）
```

**开放状态判断**：
- 开放时间：6:00-22:00
- 95%概率开放（模拟临时关闭情况）

---

### 1.2 IoT 数据获取时机

#### 1.2.1 景点创建时自动生成

**触发位置**：`spotService.ts` 的 `getCitySpots()` 方法

**流程**：
```
用户请求城市景点
    ↓
检查数据库缓存
    ↓
（如无缓存）调用高德API获取景点
    ↓
保存景点到数据库
    ↓
【自动生成IoT数据】← generateIoTDataForSpots()
    ↓
返回景点列表
```

**生成方式**：`generateDynamicIoTData()` 方法
- 基于景点类型、时间、季节动态计算
- 不依赖预定义列表

---

#### 1.2.2 用户请求时实时获取

**触发位置**：`iotController.ts`

**API接口**：
- `GET /api/iot/data` - 获取所有景点IoT数据
- `GET /api/iot/spot/:id` - 获取指定景点IoT数据

**流程**：
```
用户请求IoT数据
    ↓
从数据库获取所有景点
    ↓
并行获取天气数据（getBatchWeatherData）
    ↓
并行获取人流数据（getBatchCrowdData）
    ↓
更新数据库中的IoT数据
    ↓
返回实时数据
```

---

#### 1.2.3 行程规划时检查

**触发位置**：`traditionalRecommender.ts` 的 `recommendItinerary()` 方法

**流程**：
```
步骤1: 获取IoT数据
    ↓
步骤2: 计算景点综合评分（包含IoT评分）
    ↓
步骤3-6: 聚类、选择、构建行程
    ↓
步骤8: IoT实时检查（iotCheckService.checkItinerary）
    ↓
（如有问题景点）尝试替换
    ↓
返回最终行程
```

---

### 1.3 IoT 数据更新机制

| 数据类型 | 更新时机 | 缓存时长 | 更新方式 |
|---------|---------|---------|---------|
| **天气数据** | 用户请求时检查缓存 | 1小时 | 自动调用OpenWeatherMap API |
| **人流数据** | 每次请求时重新计算 | 无缓存 | 实时模拟计算 |
| **开放状态** | 每次请求时重新计算 | 无缓存 | 实时模拟计算 |

**当前问题**：
1. **人流数据是模拟的**，不是真实数据
2. **没有定时更新机制**，只在用户请求时更新
3. **没有主动推送机制**，用户无法实时感知变化

---

## 二、当前 IoT 数据使用场景

### 2.1 后端使用场景

#### 2.1.1 行程规划时的 IoT 检查

**服务**：`iotCheckService.ts`

**功能**：
1. **检查行程中的景点**（`checkItinerary()`）
   - 检查景点是否关闭
   - 检查拥挤度是否超标
   - 检查降雨概率是否影响户外景点

2. **替换问题景点**（`replaceExcludedSpots()`）
   - 用备选景点替换被排除的景点

3. **根据天气调整顺序**（`adjustForWeather()`）
   - 如果上午降雨概率高，优先安排室内景点

**排除阈值**：

| 群体类型 | 拥挤度阈值 | 降雨概率阈值 |
|---------|-----------|-------------|
| 普通用户 | 90% | 80% |
| 家庭（有儿童） | 70% | 60% |
| 家庭（有老人） | 70% | 70% |

---

#### 2.1.2 景点评分时的 IoT 因素

**服务**：`scoringEngine.ts`

**IoT 评分计算**：
```typescript
// IoT评分（0-25分）
const iotScore = this.calculateIoTScore(spot, iotData);

// 计算方式
if (iotData.crowdLevel > 80) score -= 10;  // 极度拥挤扣分
if (iotData.crowdLevel > 60) score -= 5;   // 人流较多扣分
if (iotData.rainProbability > 70) score -= 8;  // 高降雨概率扣分
if (!iotData.isOpen) score = 0;  // 关闭直接0分
```

---

### 2.2 前端使用场景

#### 2.2.1 景点卡片展示 IoT 数据

**组件**：`AttractionCard.tsx`、`IoTDataCard.tsx`

**展示内容**：
- 拥挤度指示器（颜色编码：红/橙/黄/绿）
- 天气状态图标和描述
- 降雨概率进度条
- 温度显示

**颜色编码规则**：

**拥挤度**：
- > 90%：红色（极度拥挤）
- > 60%：橙色（人流较多）
- > 40%：黄色（人流适中）
- ≤ 40%：绿色（人流较少）

**降雨概率**：
- > 80%：红色（暴雨）
- > 50%：橙色（中雨）
- > 20%：黄色（小雨）
- ≤ 20%：绿色（晴）

---

#### 2.2.2 备选景点推荐

**服务**：`alternativeRecommender.ts`

**IoT 过滤逻辑**：
```typescript
// 过滤不适合的备选景点
if (iotData.rainProbability > 80) return false;  // 暴雨排除
if (iotData.crowdLevel > 90) return false;  // 极度拥挤排除
if (!iotData.isOpen) return false;  // 关闭排除
```

**IoT 评分调整**：
```typescript
// 根据IoT数据调整备选景点评分
if (iotData.rainProbability > 80) score -= 40;
else if (iotData.rainProbability > 50) score -= 20;
else if (iotData.rainProbability > 20) score -= 10;

if (iotData.crowdLevel > 90) score -= 30;
else if (iotData.crowdLevel > 60) score -= 15;
else if (iotData.crowdLevel > 40) score -= 5;
```

---

### 2.3 当前使用场景总结

| 场景 | 使用方式 | 是否有感知提醒 |
|------|---------|---------------|
| 行程规划 | IoT检查、景点替换 | ❌ 无 |
| 景点评分 | IoT因素扣分 | ❌ 无 |
| 景点卡片展示 | 数据可视化 | ❌ 无 |
| 备选景点推荐 | IoT过滤 | ❌ 无 |

**核心问题**：当前只有**数据展示**和**规划时检查**，没有**实时感知**和**主动提醒**功能！

---

## 三、环境感知功能实现方案

### 3.1 功能需求分析

根据你的需求"什么地方可能会下雨，我需要有一个感知机制来提醒用户"，我们需要实现：

1. **实时监控**：定时检测IoT数据变化
2. **智能判断**：根据阈值判断是否需要提醒
3. **主动推送**：向用户发送提醒通知
4. **个性化配置**：用户可设置提醒偏好

---

### 3.2 技术方案设计

#### 3.2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    环境感知系统架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  定时任务     │    │  感知引擎     │    │  推送服务     │  │
│  │  Scheduler   │───→│  Sensor Engine│───→│  Push Service│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │         │
│         ↓                    ↓                    ↓         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  IoT数据源   │    │  规则引擎     │    │  通知渠道     │  │
│  │  (Weather+   │    │  Rule Engine │    │  (WebSocket+ │  │
│  │   Crowd)     │    │              │    │   Email)     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

#### 3.2.2 核心服务设计

##### A. 环境感知服务 (environmentSensorService.ts)

```typescript
class EnvironmentSensorService {
  /**
   * 感知类型
   */
  enum SensorType {
    RAIN = 'rain',           // 降雨感知
    CROWD = 'crowd',         // 人流感知
    TEMPERATURE = 'temp',    // 温度感知
    CLOSE = 'close',         // 关闭感知
  }

  /**
   * 感知结果
   */
  interface SensorResult {
    type: SensorType;
    spotId: string;
    spotName: string;
    level: 'info' | 'warning' | 'danger';
    message: string;
    data: any;
    timestamp: Date;
  }

  /**
   * 执行环境感知
   */
  async sense(spotIds: string[]): Promise<SensorResult[]>

  /**
   * 降雨感知
   */
  private async senseRain(spotId: string): Promise<SensorResult | null>

  /**
   * 人流感知
   */
  private async senseCrowd(spotId: string): Promise<SensorResult | null>

  /**
   * 温度感知
   */
  private async senseTemperature(spotId: string): Promise<SensorResult | null>

  /**
   * 关闭感知
   */
  private async senseClose(spotId: string): Promise<SensorResult | null>
}
```

---

##### B. 感知规则引擎 (sensorRuleEngine.ts)

```typescript
class SensorRuleEngine {
  /**
   * 规则配置
   */
  interface RuleConfig {
    // 降雨规则
    rain: {
      warning: number;   // 警告阈值（默认50%）
      danger: number;    // 危险阈值（默认80%）
      outdoorOnly: boolean;  // 仅对户外景点（默认true）
    };
    // 人流规则
    crowd: {
      warning: number;   // 警告阈值（默认60%）
      danger: number;    // 危险阈值（默认90%）
    };
    // 温度规则
    temperature: {
      lowWarning: number;   // 低温警告（默认5°C）
      highWarning: number;  // 高温警告（默认35°C）
      lowDanger: number;    // 低温危险（默认0°C）
      highDanger: number;   // 高温危险（默认40°C）
    };
  }

  /**
   * 评估感知结果
   */
  evaluate(sensorResult: SensorResult, config: RuleConfig): {
    shouldNotify: boolean;
    level: 'info' | 'warning' | 'danger';
    message: string;
  }
}
```

---

##### C. 定时任务调度器 (sensorScheduler.ts)

```typescript
class SensorScheduler {
  /**
   * 启动定时感知任务
   */
  start(): void {
    // 每30分钟执行一次全局感知
    cron.schedule('*/30 * * * *', async () => {
      await this.runGlobalSensing();
    });

    // 每10分钟执行一次用户行程感知
    cron.schedule('*/10 * * * *', async () => {
      await this.runUserTripSensing();
    });
  }

  /**
   * 全局感知（所有热门景点）
   */
  private async runGlobalSensing(): Promise<void>

  /**
   * 用户行程感知（用户即将访问的景点）
   */
  private async runUserTripSensing(): Promise<void>
}
```

---

##### D. 推送通知服务 (notificationService.ts)

```typescript
class NotificationService {
  /**
   * 通知渠道
   */
  enum NotificationChannel {
    WEBSOCKET = 'websocket',  // 实时推送
    EMAIL = 'email',          // 邮件通知
    IN_APP = 'in_app',        // 站内通知
  }

  /**
   * 发送通知
   */
  async notify(
    userId: string,
    sensorResult: SensorResult,
    channels: NotificationChannel[]
  ): Promise<void>

  /**
   * WebSocket 实时推送
   */
  private async pushViaWebSocket(userId: string, data: any): Promise<void>

  /**
   * 邮件通知
   */
  private async sendEmail(userId: string, data: any): Promise<void>

  /**
   * 站内通知
   */
  private async createInAppNotification(userId: string, data: any): Promise<void>
}
```

---

#### 3.2.3 数据库设计

##### 新增表：环境感知记录表

```prisma
model EnvironmentSensorLog {
  id          String   @id @default(cuid())
  spotId      String
  spot        Spot     @relation(fields: [spotId], references: [id])
  
  // 感知类型
  type        String   // rain, crowd, temperature, close
  
  // 感知级别
  level       String   // info, warning, danger
  
  // 感知数据
  data        Json     // 原始IoT数据
  
  // 感知消息
  message     String
  
  // 是否已通知用户
  notified    Boolean  @default(false)
  
  // 通知时间
  notifiedAt  DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([spotId, type, createdAt])
}
```

##### 新增表：用户通知偏好表

```prisma
model UserNotificationPreference {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  
  // 是否启用降雨提醒
  rainAlert       Boolean @default(true)
  
  // 是否启用人流提醒
  crowdAlert      Boolean @default(true)
  
  // 是否启用温度提醒
  temperatureAlert Boolean @default(true)
  
  // 是否启用关闭提醒
  closeAlert      Boolean @default(true)
  
  // 通知渠道
  channels        Json    @default("[\"websocket\", \"in_app\"]")
  
  // 自定义阈值
  customThresholds Json?  // 用户自定义阈值
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

##### 新增表：站内通知表

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  // 通知类型
  type      String   // sensor, system, etc.
  
  // 通知标题
  title     String
  
  // 通知内容
  content   String
  
  // 关联数据
  data      Json?
  
  // 是否已读
  isRead    Boolean  @default(false)
  
  // 阅读时间
  readAt    DateTime?
  
  createdAt DateTime @default(now())
  
  @@index([userId, isRead, createdAt])
}
```

---

### 3.3 具体实现示例

#### 3.3.1 降雨感知实现

```typescript
/**
 * 降雨感知
 * 检测景点降雨概率，判断是否需要提醒用户
 */
private async senseRain(spotId: string): Promise<SensorResult | null> {
  // 1. 获取景点信息
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    include: { iotData: true },
  });

  if (!spot || !spot.iotData) return null;

  // 2. 检查是否为户外景点
  const isOutdoor = this.isOutdoorAttraction(spot);
  if (!isOutdoor) return null;  // 室内景点不感知降雨

  // 3. 获取降雨概率
  const rainProbability = spot.iotData.rainProbability;

  // 4. 判断感知级别
  let level: 'info' | 'warning' | 'danger' = 'info';
  let message = '';

  if (rainProbability >= 80) {
    level = 'danger';
    message = `⚠️ ${spot.name}降雨概率极高(${rainProbability}%)，建议调整行程或携带雨具`;
  } else if (rainProbability >= 50) {
    level = 'warning';
    message = `🌧️ ${spot.name}可能下雨(${rainProbability}%)，建议准备雨具`;
  } else if (rainProbability >= 30) {
    level = 'info';
    message = `🌦️ ${spot.name}有小雨可能(${rainProbability}%)`;
  } else {
    return null;  // 无需提醒
  }

  return {
    type: SensorType.RAIN,
    spotId,
    spotName: spot.name,
    level,
    message,
    data: {
      rainProbability,
      weatherDescription: spot.iotData.weatherDescription,
      isOutdoor,
    },
    timestamp: new Date(),
  };
}
```

---

#### 3.3.2 人流感知实现

```typescript
/**
 * 人流感知
 * 检测景点拥挤度，判断是否需要提醒用户
 */
private async senseCrowd(spotId: string): Promise<SensorResult | null> {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    include: { iotData: true },
  });

  if (!spot || !spot.iotData) return null;

  const crowdLevel = spot.iotData.crowdLevel;
  const isOpen = spot.iotData.isOpen;

  // 景点关闭
  if (!isOpen) {
    return {
      type: SensorType.CLOSE,
      spotId,
      spotName: spot.name,
      level: 'danger',
      message: `🚫 ${spot.name}已关闭，请调整行程`,
      data: { isOpen: false },
      timestamp: new Date(),
    };
  }

  // 拥挤度判断
  let level: 'info' | 'warning' | 'danger' = 'info';
  let message = '';

  if (crowdLevel >= 90) {
    level = 'danger';
    message = `👥 ${spot.name}极度拥挤(${crowdLevel}%)，建议避开或选择其他时间`;
  } else if (crowdLevel >= 60) {
    level = 'warning';
    message = `👥 ${spot.name}人流较多(${crowdLevel}%)，可能需要排队`;
  } else {
    return null;  // 无需提醒
  }

  return {
    type: SensorType.CROWD,
    spotId,
    spotName: spot.name,
    level,
    message,
    data: { crowdLevel, isOpen },
    timestamp: new Date(),
  };
}
```

---

#### 3.3.3 用户行程感知

```typescript
/**
 * 用户行程感知
 * 检测用户即将访问的景点，提前提醒
 */
private async runUserTripSensing(): Promise<void> {
  console.log('\n🔍 开始用户行程环境感知...');

  // 1. 获取即将开始的行程（未来24小时内）
  const upcomingTrips = await prisma.trip.findMany({
    where: {
      status: 'planning',
      startDate: {
        lte: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 未来24小时
        gte: new Date(),
      },
    },
    include: {
      user: {
        include: { notificationPreference: true },
      },
      days: {
        include: {
          itineraryItems: {
            include: { spot: { include: { iotData: true } } },
          },
        },
      },
    },
  });

  // 2. 对每个行程进行感知
  for (const trip of upcomingTrips) {
    const spotIds = trip.days
      .flatMap(day => day.itineraryItems)
      .map(item => item.spotId)
      .filter(Boolean) as string[];

    // 3. 执行感知
    const sensorResults = await environmentSensorService.sense(spotIds);

    // 4. 过滤需要通知的结果
    const dangerousResults = sensorResults.filter(r => r.level !== 'info');

    // 5. 发送通知
    if (dangerousResults.length > 0) {
      await notificationService.notify(
        trip.userId,
        {
          type: 'trip_sensor',
          tripId: trip.id,
          tripTitle: trip.title,
          alerts: dangerousResults,
        },
        trip.user.notificationPreference?.channels || ['websocket', 'in_app']
      );
    }
  }

  console.log('✅ 用户行程环境感知完成');
}
```

---

### 3.4 前端集成方案

#### 3.4.1 实时通知组件

```tsx
// components/EnvironmentSensorNotification.tsx
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export function EnvironmentSensorNotification() {
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    // 监听环境感知通知
    socket.on('sensor:alert', (data) => {
      setNotifications(prev => [...prev, data]);
      
      // 显示Toast通知
      toast.warning(data.message, {
        duration: 10000,
        action: {
          label: '查看详情',
          onClick: () => navigateToSpot(data.spotId),
        },
      });
    });

    return () => {
      socket.off('sensor:alert');
    };
  }, [socket]);

  return (
    <div className="sensor-notifications">
      {notifications.map(n => (
        <SensorAlertCard key={n.id} notification={n} />
      ))}
    </div>
  );
}
```

---

#### 3.4.2 行程详情页集成

```tsx
// 在行程详情页显示环境感知状态
function TripDetailPage({ tripId }) {
  const [sensorStatus, setSensorStatus] = useState(null);

  useEffect(() => {
    // 获取行程的环境感知状态
    fetchSensorStatus(tripId).then(setSensorStatus);
  }, [tripId]);

  return (
    <div>
      {/* 环境感知状态卡片 */}
      {sensorStatus && (
        <SensorStatusCard status={sensorStatus} />
      )}

      {/* 行程内容 */}
      <ItineraryList trip={trip} />
    </div>
  );
}
```

---

### 3.5 API 接口设计

#### 新增接口

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/sensor/run` | POST | 手动触发环境感知 |
| `/api/sensor/status/:tripId` | GET | 获取行程感知状态 |
| `/api/sensor/logs/:spotId` | GET | 获取景点感知历史 |
| `/api/notifications` | GET | 获取用户通知列表 |
| `/api/notifications/:id/read` | PUT | 标记通知已读 |
| `/api/notifications/preferences` | GET | 获取通知偏好 |
| `/api/notifications/preferences` | PUT | 更新通知偏好 |

---

## 四、实现优先级建议

### 4.1 第一阶段（核心功能）

1. **实现环境感知服务**
   - 降雨感知
   - 人流感知
   - 关闭感知

2. **实现定时任务调度器**
   - 每30分钟全局感知
   - 每10分钟用户行程感知

3. **实现站内通知**
   - 创建通知表
   - 通知列表API
   - 前端通知组件

### 4.2 第二阶段（增强功能）

1. **WebSocket 实时推送**
   - 集成现有Socket.io
   - 实时推送感知结果

2. **用户偏好配置**
   - 通知偏好表
   - 自定义阈值
   - 前端设置页面

3. **感知历史记录**
   - 感知日志表
   - 历史查询API
   - 数据可视化

### 4.3 第三阶段（高级功能）

1. **邮件通知**
   - 集成邮件服务
   - 重要提醒邮件

2. **智能建议**
   - 基于感知结果提供替代方案
   - 自动调整行程建议

3. **机器学习预测**
   - 基于历史数据预测人流
   - 天气趋势预测

---

## 五、总结

### 5.1 当前状态

| 方面 | 现状 | 说明 |
|------|------|------|
| **数据来源** | 天气真实，人流模拟 | 天气使用OpenWeatherMap API，人流基于时段模拟 |
| **更新机制** | 定时更新（15分钟） | ✅ 已实现定时任务自动更新IoT数据 |
| **使用场景** | 规划时检查、展示、实时感知 | ✅ 已实现环境感知和主动推送 |
| **通知机制** | WebSocket + 站内通知 | ✅ 已实现实时推送和通知存储 |

### 5.2 已实现功能

1. **✅ 定时更新机制**：每15分钟自动更新IoT数据
2. **✅ 环境感知服务**：实时监控降雨、人流、温度、关闭状态
3. **✅ 主动推送机制**：感知到异常情况时主动推送通知
4. **✅ WebSocket实时推送**：用户在线时立即收到通知
5. **✅ 站内通知系统**：离线时通知保存在数据库，上线后可查看
6. **✅ 首页消息图标**：显示未读数量，点击查看详情

### 5.3 技术实现

- **环境感知服务**：`environmentSensorService.ts`
- **推送通知服务**：`notificationService.ts`
- **定时任务调度器**：`sensorScheduler.ts`
- **前端通知组件**：`NotificationBell.tsx`
- **WebSocket集成**：利用现有Socket.io基础设施

---

**文档维护者**：LiveTrip 开发团队  
**最后更新**：2026-04-15

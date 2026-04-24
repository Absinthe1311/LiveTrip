// IoT通知演示数据生成器
import { PrismaClient } from '@prisma/client';
import { sendToUser } from './src/socket/socketService';

const prisma = new PrismaClient();

// 演示通知类型
enum DemoNotificationType {
  CROWD_INCREASE = '拥挤度上升',
  WEATHER_CHANGE = '天气变化',
  SPOT_CLOSED = '景点关闭',
  TREND_WARNING = '趋势预警',
  FAVORITE_ALERT = '收藏提醒'
}

// 演示通知模板
const DEMO_NOTIFICATIONS = [
  {
    type: DemoNotificationType.CROWD_INCREASE,
    title: '⚠️ 故宫博物院 - 拥挤度上升',
    content: `📊 拥挤度上升了28%

💡 建议：建议提前到达或选择其他时间段

📈 变化：45% → 73% (+28)
⏰ 时间：${new Date().toLocaleTimeString('zh-CN')}`,
    level: 'warning',
    spotName: '故宫博物院',
    spotId: 'demo-1'
  },
  {
    type: DemoNotificationType.WEATHER_CHANGE,
    title: '🌧️ 颐和园 - 天气变化',
    content: `📊 降雨概率上升了35%，当前65%

💡 建议：建议携带雨具或调整行程

📈 变化：30% → 65% (+35)
⏰ 时间：${new Date(Date.now() - 5 * 60000).toLocaleTimeString('zh-CN')}`,
    level: 'warning',
    spotName: '颐和园',
    spotId: 'demo-2'
  },
  {
    type: DemoNotificationType.TREND_WARNING,
    title: '📈 天坛公园 - 趋势预警',
    content: `📊 拥挤度持续上升（40% → 68%）

💡 建议：建议尽快前往或选择其他景点

📈 趋势：连续3次检测显示上升
⏰ 时间：${new Date(Date.now() - 10 * 60000).toLocaleTimeString('zh-CN')}`,
    level: 'warning',
    spotName: '天坛公园',
    spotId: 'demo-3'
  },
  {
    type: DemoNotificationType.SPOT_CLOSED,
    title: '🚨 中国科技馆 - 景点关闭',
    content: `📊 景点当前已关闭

💡 建议：建议调整行程或联系景区确认开放时间

📈 状态：开放 → 关闭
⏰ 时间：${new Date(Date.now() - 15 * 60000).toLocaleTimeString('zh-CN')}`,
    level: 'danger',
    spotName: '中国科技馆',
    spotId: 'demo-4'
  },
  {
    type: DemoNotificationType.FAVORITE_ALERT,
    title: '❤️ 长城（收藏）- 状态变化',
    content: `📊 您收藏的景点拥挤度上升了22%

💡 建议：当前较为拥挤，建议错峰游览

📈 变化：50% → 72% (+22)
⏰ 时间：${new Date(Date.now() - 20 * 60000).toLocaleTimeString('zh-CN')}`,
    level: 'info',
    spotName: '长城',
    spotId: 'demo-5'
  }
];

/**
 * 生成演示通知到数据库
 */
async function generateDemoNotifications(userId: string) {
  console.log('🎭 开始生成IoT演示通知...\n');

  try {
    // 清除旧的演示通知
    await prisma.notification.deleteMany({
      where: {
        userId,
        type: 'iot_alert'
      }
    });

    console.log('✅ 已清除旧的IoT通知\n');

    // 创建新的演示通知
    for (const demo of DEMO_NOTIFICATIONS) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'iot_alert',
          title: demo.title,
          content: demo.content,
          isRead: false,
          data: JSON.stringify({
            spotId: demo.spotId,
            spotName: demo.spotName,
            level: demo.level,
            demo: true
          })
        }
      });

      console.log(`✓ 已创建: ${demo.title}`);
    }

    console.log(`\n✅ 成功生成 ${DEMO_NOTIFICATIONS.length} 条演示通知`);

    // 实时推送到前端
    console.log('\n📡 推送通知到前端...');
    sendToUser(userId, 'demo:notifications', {
      message: 'IoT演示通知已生成',
      count: DEMO_NOTIFICATIONS.length
    });

    return DEMO_NOTIFICATIONS.length;
  } catch (error) {
    console.error('❌ 生成演示通知失败:', error);
    return 0;
  }
}

/**
 * 获取或创建演示用户
 */
async function getOrCreateDemoUser() {
  // 尝试获取第一个用户
  const user = await prisma.user.findFirst();

  if (user) {
    return user.id;
  }

  // 如果没有用户，创建一个演示用户
  const demoUser = await prisma.user.create({
    data: {
      username: 'demo_user',
      email: 'demo@example.com',
      passwordHash: 'demo_hash',
      nickname: '演示用户'
    }
  });

  return demoUser.id;
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(60));
  console.log('  IoT通知演示数据生成器');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 获取用户ID
    const userId = await getOrCreateDemoUser();
    console.log(`👤 用户ID: ${userId}\n`);

    // 生成演示通知
    const count = await generateDemoNotifications(userId);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 完成！共生成 ${count} 条演示通知`);
    console.log('='.repeat(60));

    console.log('\n📋 演示通知列表:');
    DEMO_NOTIFICATIONS.forEach((demo, index) => {
      console.log(`\n${index + 1}. ${demo.title}`);
      console.log(`   类型: ${demo.type}`);
      console.log(`   级别: ${demo.level}`);
    });

    console.log('\n\n💡 提示:');
    console.log('   1. 刷新前端页面查看通知');
    console.log('   2. 点击通知铃铛查看详情');
    console.log('   3. 通知包含丰富的IoT状态信息');

  } catch (error) {
    console.error('❌ 执行失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 导出函数供其他模块使用
export { generateDemoNotifications, DEMO_NOTIFICATIONS };

// 直接运行时执行主函数
if (require.main === module) {
  main();
}

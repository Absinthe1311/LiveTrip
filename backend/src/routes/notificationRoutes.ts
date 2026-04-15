// 通知路由
import { Router } from 'express';
import { authenticateToken } from '../controllers/authController';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  triggerSensor,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController';
import {
  sendTestNotification,
  sendBatchTestNotifications,
} from '../controllers/testNotificationController';

const router = Router();

// 所有通知路由都需要认证
router.use(authenticateToken);

// 获取通知列表
router.get('/', getNotifications);

// 清空所有通知
router.delete('/clear-all', clearAllNotifications);

// 标记所有通知为已读
router.put('/read-all', markAllNotificationsAsRead);

// 标记单个通知为已读
router.put('/:id/read', markNotificationAsRead);

// 删除单个通知
router.delete('/:id', deleteNotification);

// 手动触发环境感知
router.post('/sensor/run', triggerSensor);

// 测试通知接口
router.post('/test', sendTestNotification);
router.post('/test-batch', sendBatchTestNotifications);

export default router;

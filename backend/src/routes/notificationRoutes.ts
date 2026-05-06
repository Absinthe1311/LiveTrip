// 通知路由
import { Router } from 'express';
import { authToken } from '../controllers/authController';
import {
  fetNotifs,
  readAllNotifs,
  markAllNotificationsAsRead,
  fireSensor,
  delNotif,
  flushNotifs,
} from '../controllers/notificationController';

const router = Router();

// 所有通知路由都需要认证
router.use(authToken);

// 获取通知列表
router.get('/', fetNotifs);

// 清空所有通知
router.delete('/clear-all', flushNotifs);

// 标记所有通知为已读
router.put('/read-all', markAllNotificationsAsRead);

// 标记单个通知为已读
router.put('/:id/read', readAllNotifs);

// 删除单个通知
router.delete('/:id', delNotif);

// 手动触发环境感知
router.post('/sensor/run', fireSensor);

export default router;

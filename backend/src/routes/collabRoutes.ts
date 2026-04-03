// 协同规划路由 - 定义协同规划相关的API端点
import { Router } from 'express';
import { authenticateToken } from '../controllers/authController';
import {
  createRoom,
  joinRoom,
  getRoomInfo,
  getSpotStats,
  lockRoom,
  upsertDraft,
  submitDraft,
  getUserDrafts,
  getAllDrafts,
  sendMessage,
  getMessages,
} from '../controllers/collabController';

const router = Router();

// ==================== 协同房间相关路由 ====================

// POST /api/collab/rooms - 创建协同房间
router.post('/rooms', authenticateToken, createRoom);

// POST /api/collab/rooms/join - 通过邀请token加入房间
router.post('/rooms/join', authenticateToken, joinRoom);

// GET /api/collab/rooms/:roomId - 获取房间信息
router.get('/rooms/:roomId', authenticateToken, getRoomInfo);

// GET /api/collab/rooms/:roomId/stats - 获取景点统计（仅Host）
router.get('/rooms/:roomId/stats', authenticateToken, getSpotStats);

// POST /api/collab/rooms/:roomId/lock - 锁定房间（仅Host）
router.post('/rooms/:roomId/lock', authenticateToken, lockRoom);

// GET /api/collab/rooms/:roomId/drafts - 获取用户的草案列表
router.get('/rooms/:roomId/drafts', authenticateToken, getUserDrafts);

// GET /api/collab/rooms/:roomId/drafts/all - 获取所有成员的草案
router.get('/rooms/:roomId/drafts/all', authenticateToken, getAllDrafts);

// ==================== 草案相关路由 ====================

// POST /api/collab/drafts - 创建或更新草案
router.post('/drafts', authenticateToken, upsertDraft);

// POST /api/collab/drafts/:draftId/submit - 提交草案
router.post('/drafts/:draftId/submit', authenticateToken, submitDraft);

// ==================== 消息相关路由 ====================

// POST /api/collab/messages - 发送消息
router.post('/messages', authenticateToken, sendMessage);

// GET /api/collab/messages/:roomId - 获取房间消息列表
router.get('/messages/:roomId', authenticateToken, getMessages);

export default router;

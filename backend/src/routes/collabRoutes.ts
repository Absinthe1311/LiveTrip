// 协同规划路由 - 定义协同规划相关的API端点
import { Router } from 'express';
import { authToken } from '../controllers/authController';
import {
  createRoom,
  joinRoom,
  getRoomInfo,
  spotStats,
  closeRoom,
  saveDraft,
  sendDraft,
  myDrfts,
  allDrafts,
  msgSend,
  msgs,
  commitTrip,
} from '../controllers/collabController';

const router = Router();

// ==================== 协同房间相关路由 ====================

// POST /api/collab/rooms - 创建协同房间
router.post('/rooms', authToken, createRoom);

// POST /api/collab/rooms/join - 通过邀请token加入房间
router.post('/rooms/join', authToken, joinRoom);

// GET /api/collab/rooms/:roomId - 获取房间信息
router.get('/rooms/:roomId', authToken, getRoomInfo);

// GET /api/collab/rooms/:roomId/stats - 获取景点统计（仅Host）
router.get('/rooms/:roomId/stats', authToken, spotStats);

// POST /api/collab/rooms/:roomId/lock - 锁定房间（仅Host）
router.post('/rooms/:roomId/lock', authToken, closeRoom);

// GET /api/collab/rooms/:roomId/drafts - 获取用户的草案列表
router.get('/rooms/:roomId/drafts', authToken, myDrfts);

// GET /api/collab/rooms/:roomId/drafts/all - 获取所有成员的草案
router.get('/rooms/:roomId/drafts/all', authToken, allDrafts);

// ==================== 草案相关路由 ====================

// POST /api/collab/drafts - 创建或更新草案
router.post('/drafts', authToken, saveDraft);

// POST /api/collab/drafts/:draftId/submit - 提交草案
router.post('/drafts/:draftId/submit', authToken, sendDraft);

// ==================== 消息相关路由 ====================

// POST /api/collab/messages - 发送消息
router.post('/messages', authToken, msgSend);

// GET /api/collab/messages/:roomId - 获取房间消息列表
router.get('/messages/:roomId', authToken, msgs);

// ==================== 最终行程相关路由 ====================

// POST /api/collab/finalize - 保存最终协同行程
router.post('/finalize', authToken, commitTrip);

export default router;

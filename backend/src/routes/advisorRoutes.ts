// 旅行顾问路由
import { Router } from 'express';
import {
  chatAdvisor,
  userSessions,
  fetchMsgs,
  delSession,
} from '../controllers/advisorController';

const router = Router();

/**
 * @route   POST /api/advisor/chat
 * @desc    与AI顾问聊天
 * @access  Public
 */
router.post('/chat', chatAdvisor);

/**
 * @route   GET /api/advisor/sessions
 * @desc    获取用户会话列表
 * @access  Public (userId from header)
 */
router.get('/sessions', userSessions);

/**
 * @route   GET /api/advisor/sessions/:sessionId/messages
 * @desc    获取会话的消息历史
 * @access  Public
 */
router.get('/sessions/:sessionId/messages', fetchMsgs);

/**
 * @route   DELETE /api/advisor/sessions/:sessionId
 * @desc    删除会话
 * @access  Public
 */
router.delete('/sessions/:sessionId', delSession);

export default router;

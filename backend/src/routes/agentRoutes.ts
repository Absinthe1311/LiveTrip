// Agent 路由
import { Router } from 'express';
import { chatWithAgent } from '../controllers/agentController';

const router = Router();

/**
 * @route   POST /api/agent/chat
 * @desc    与 Agent 对话（支持 Function Calling）
 * @access  Public
 */
router.post('/chat', chatWithAgent);

export default router;

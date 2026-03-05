// 旅行顾问路由
import { Router } from 'express';
import { chatWithAdvisor } from '../controllers/advisorController';

const router = Router();

/**
 * @route   POST /api/advisor/chat
 * @desc    与AI顾问聊天
 * @access  Public
 */
router.post('/chat', chatWithAdvisor);

export default router;

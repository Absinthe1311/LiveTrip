/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：路由重构
 */

// Agent 路由
import { Router } from 'express';
import { chatWithAgent } from '../controllers/agentController';
import { chatWithAgentSSE } from '../controllers/agentSSEController';
import { agentService } from '../services/agentService';

const router = Router();

/**
 * @route   POST /api/agent/chat
 * @desc    与 Agent 对话（支持 Function Calling）
 * @access  Public
 */
router.post('/chat', chatWithAgent);

/**
 * @route   POST /api/agent/chat/stream
 * @desc    与 Agent 对话（SSE 流式响应，实时推送步骤）
 * @access  Public
 */
router.post('/chat/stream', chatWithAgentSSE);

/**
 * @route   POST /api/agent/confirm-trip
 * @desc    确认保存行程
 * @access  Public
 */
router.post('/confirm-trip', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = (req as any).user?.id || (req.headers['x-user-id'] as string);

    const result = await agentService.confirmTrip(sessionId, userId);

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '确认失败',
    });
  }
});

/**
 * @route   POST /api/agent/cancel-draft
 * @desc    取消草稿
 * @access  Public
 */
router.post('/cancel-draft', async (req, res) => {
  try {
    const { sessionId } = req.body;

    const result = await agentService.cancelDraft(sessionId);

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '取消失败',
    });
  }
});

/**
 * @route   POST /api/agent/confirm-blog
 * @desc    确认发布博客
 * @access  Public
 */
router.post('/confirm-blog', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = (req as any).user?.id || (req.headers['x-user-id'] as string);

    const result = await agentService.confirmBlogPublish(sessionId, userId);

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || '发布失败',
    });
  }
});

export default router;

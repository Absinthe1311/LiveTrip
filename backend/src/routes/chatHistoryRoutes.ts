// 对话历史路由
import { Router, Request, Response } from 'express';
import { chatHistoryService } from '../services/chatHistoryService';

const router = Router();

/**
 * 获取用户的对话历史列表
 * GET /api/chat/sessions
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const mode = req.query.mode as 'advisor' | 'agent' | undefined;

    const sessions = await chatHistoryService.userSessions(userId, mode);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error('获取对话历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取对话历史失败',
    });
  }
});

/**
 * 获取会话详情（包含消息）
 * GET /api/chat/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

    const session = await chatHistoryService.getSessionWithMessages(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: '会话不存在',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('获取会话详情失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取会话详情失败',
    });
  }
});

/**
 * 创建新会话
 * POST /api/chat/sessions
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { mode } = req.body;

    if (!mode || !['advisor', 'agent'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: '无效的模式',
      });
    }

    const session = await chatHistoryService.createSession({
      userId,
      mode,
    });

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('创建会话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '创建会话失败',
    });
  }
});

/**
 * 删除会话
 * DELETE /api/chat/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;

    await chatHistoryService.delSession(sessionId);

    res.json({
      success: true,
      message: '会话已删除',
    });
  } catch (error: any) {
    console.error('删除会话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '删除会话失败',
    });
  }
});

export default router;

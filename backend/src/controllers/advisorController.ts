import { Request, Response } from 'express';
import { advisorService } from '../services/advisorService';
import { chatHistoryService } from '../services/chatHistoryService';



export const getSessionMessages = async (req: Request, res: Response) => {
  try {
    const { sessionId: sid } = req.params;
    const sessionId = Array.isArray(sid) ? sid[0] : sid;

    let limit = 10;
    if (req.query.limit !== undefined) {
      const lim = req.query.limit;
      limit = parseInt(String(Array.isArray(lim) ? lim[0] : lim));
    }

    const messages = await chatHistoryService.getMessages({ sessionId, limit });
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || '获取消息历史失败' });
  }
};
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || undefined;
    const modeQuery = req.query.mode;
    const mode = modeQuery
      ? (Array.isArray(modeQuery) ? modeQuery[0] : modeQuery) as 'advisor' | 'agent' | undefined
      : undefined;

    const sessions = await chatHistoryService.getUserSessions(userId, mode);
    res.json({ success: true, data: sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || '获取会话列表失败' });
  }
};



export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { sessionId: sid } = req.params;
    const sessionId = Array.isArray(sid) ? sid[0] : sid;
    const uidHeader = req.headers['x-user-id'];
    const userId = Array.isArray(uidHeader) ? uidHeader[0] : uidHeader;

    if (userId) {
      const { getPrismaClient } = await import('../lib/prisma');
      const prisma = getPrismaClient();

      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true, mode: true }
      });
      if (!session) {
        return res.status(404).json({ success: false, error: '会话不存在' });
      }

      if (session.userId && session.userId !== userId) {
        return res.status(403).json({ success: false, error: '无权删除此会话' });
      }
    }

    await chatHistoryService.deleteSession(sessionId);

    res.json({ success: true, message: '会话已删除' });
  } catch (err: any) {
    console.error('[删除会话] 失败:', err.message);
    res.status(500).json({ success: false, error: err.message || '删除会话失败' });
  }
};


export const chatWithAdvisor = async (req: Request, res: Response) => {
  try {
    const { question, planContext } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: '缺少必填字段：question（字符串）' });
    }

    const userId = req.headers['x-user-id'] as string || undefined;
    const response = await advisorService.answerQuestion({
      question: question.trim(),
      planContext
    }, userId);

    res.json({ success: true, data: response });
  } catch (err: any) {
    console.error('AI顾问服务异常:', err.message);
    res.status(500).json({ success: false, error: err.message || 'AI顾问服务暂时不可用' });
  }
};
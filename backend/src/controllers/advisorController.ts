// 旅行顾问控制器 - 处理AI顾问相关请求
import { Request, Response } from 'express';
import { advisorService } from '../services/advisorService';
import { chatHistoryService } from '../services/chatHistoryService';

/**
 * AI顾问聊天
 * POST /api/advisor/chat
 */
export const chatWithAdvisor = async (req: Request, res: Response) => {
  try {
    const { question, planContext } = req.body;

    // 验证必填字段
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：question（字符串）',
      });
    }

    // 调用AI顾问服务
    const userId = req.headers['x-user-id'] as string || undefined;
    const response = await advisorService.answerQuestion({
      question: question.trim(),
      planContext,
    }, userId);

    console.log('✅ AI顾问回答完成');

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ AI顾问请求失败:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'AI顾问服务暂时不可用',
    });
  }
};

/**
 * 获取用户会话列表
 * GET /api/advisor/sessions
 */
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string || undefined;
    const modeQuery = req.query.mode;
    const mode = modeQuery ? (Array.isArray(modeQuery) ? modeQuery[0] : modeQuery) as 'advisor' | 'agent' | undefined : undefined;

    const sessions = await chatHistoryService.getUserSessions(userId, mode);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error('❌ 获取会话列表失败:', error);

    res.status(500).json({
      success: false,
      error: error.message || '获取会话列表失败',
    });
  }
};

/**
 * 获取会话的消息历史
 * GET /api/advisor/sessions/:sessionId/messages
 */
export const getSessionMessages = async (req: Request, res: Response) => {
  try {
    const { sessionId: sessionIdParam } = req.params;
    const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
    
    // 处理 limit 参数
    let limit: number = 10;
    if (req.query.limit !== undefined) {
      const limitValue = req.query.limit;
      if (Array.isArray(limitValue)) {
        limit = parseInt(String(limitValue[0] || '10'));
      } else {
        limit = parseInt(String(limitValue));
      }
    }

    const messages = await chatHistoryService.getMessages({
      sessionId,
      limit,
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error('❌ 获取消息历史失败:', error);

    res.status(500).json({
      success: false,
      error: error.message || '获取消息历史失败',
    });
  }
};

/**
 * 删除会话
 * DELETE /api/advisor/sessions/:sessionId
 */
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { sessionId: sessionIdParam } = req.params;
    const sessionId = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;
    const userIdHeader = req.headers['x-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    console.log('\n🗑️  [删除会话] 开始删除:', sessionId);
    console.log('   userId:', userId || '未提供');

    // ✅ 问题8: 修复会话所有权验证逻辑
    if (userId) {
      // 直接查询会话,而不是获取或创建
      const { getPrismaClient } = await import('../lib/prisma');
      const prisma = getPrismaClient();
      
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true, mode: true }
      });
      
      if (!session) {
        console.error('   ❌ 会话不存在');
        return res.status(404).json({
          success: false,
          error: '会话不存在',
        });
      }
      
      console.log('   会话信息:', { id: session.id, userId: session.userId, mode: session.mode });
      
      // 验证会话所有权
      if (session.userId && session.userId !== userId) {
        console.error('   ❌ 无权删除: 会话属于其他用户');
        return res.status(403).json({
          success: false,
          error: '无权删除此会话',
        });
      }
      
      console.log('   ✅ 权限验证通过');
    }

    await chatHistoryService.deleteSession(sessionId);
    console.log('   ✅ 会话已删除');

    res.json({
      success: true,
      message: '会话已删除',
    });
  } catch (error: any) {
    console.error('❌ 删除会话失败:', error);

    res.status(500).json({
      success: false,
      error: error.message || '删除会话失败',
    });
  }
};

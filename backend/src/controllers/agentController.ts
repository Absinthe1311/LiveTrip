// Agent 控制器 - 处理 Agent 相关请求
import { Request, Response } from 'express';
import { agentService } from '../services/agentService';

/**
 * Agent 对话
 * POST /api/agent/chat
 */
export const chatWithAgent = async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    // 验证必填字段
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：question（字符串）',
      });
    }

    // ✅ P1优化: 强制登录验证
    const userId = req.headers['x-user-id'] as string;

    console.log('\n🔍 [用户认证] 开始验证用户...');

    if (!userId) {
      console.warn('   ⚠️  未提供 userId，拒绝访问');
      return res.status(401).json({
        success: false,
        error: '请先登录以使用 AI 助手',
        needLogin: true,
        loginUrl: '/auth',
      });
    }

    // 验证用户是否存在
    const { getPrismaClient } = await import('../lib/prisma');
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true }
    });

    if (!user) {
      console.warn(`   ⚠️  用户不存在: ${userId}`);
      return res.status(401).json({
        success: false,
        error: '用户信息无效，请重新登录',
        needLogin: true,
        loginUrl: '/auth',
      });
    }

    console.log(`   ✅ 用户验证成功: ${user.username} (${user.email || '无邮箱'})`);

    // 调用 Agent 服务
    const response = await agentService.processRequest({
      question: question.trim(),
      userId: userId,
    });

    console.log('✅ Agent 回答完成');

    // 检查工具调用结果中是否有预览数据
    const toolResult = response.toolCalls?.[0]?.result;
    const resBody: any = {
      success: true,
      data: response,
    };

    // 如果工具返回了预览数据，添加到顶层
    if (toolResult?.needsConfirmation) {
      resBody.needsConfirmation = true;
      resBody.previewData = toolResult.previewData;
      resBody.sessionId = toolResult.sessionId;
    }

    // 如果工具需要更多信息
    if (toolResult?.needsMoreInfo) {
      resBody.needsMoreInfo = true;
      resBody.error = toolResult.error;
    }

    res.json(resBody);
  } catch (error: any) {
    console.error('❌ Agent 请求失败:', error);

    res.status(500).json({
      success: false,
      error: 'AI 服务暂时不可用，请稍后重试',
    });
  }
};

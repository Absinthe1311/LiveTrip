import { Request, Response } from 'express';
import { agentService } from '../services/agentService';

export const chatWithAgent = async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: '缺少必填字段：question（字符串）' });
    }

    const userId = req.headers['x-user-id'] as string;
    console.log('\n🔍 [用户认证] 开始验证用户...');

    if (!userId) {
      console.warn('   ⚠️  未提供 userId，拒绝访问');
      return res.status(401).json({
        success: false,
        error: '请先登录以使用 AI 助手',
        needLogin: true,
        loginUrl: '/auth'
      });
    }

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
        loginUrl: '/auth'
      });
    }

    console.log(`   ✅ 用户验证成功: ${user.username} (${user.email || '无邮箱'})`);

    const response = await agentService.processRequest({
      question: question.trim(),
      userId
    });

    console.log('✅ Agent 回答完成');

    const confirmTool = response.toolCalls?.find((tc: any) => tc.result?.needsConfirmation);
    const moreInfoTool = response.toolCalls?.find((tc: any) => tc.result?.needsMoreInfo);
    const resBody: any = { success: true, data: response };

    if (confirmTool?.result?.needsConfirmation) {
      resBody.needsConfirmation = true;
      resBody.previewData = confirmTool.result.previewData;
      resBody.sessionId = confirmTool.result.sessionId;
    }

    if (moreInfoTool?.result?.needsMoreInfo) {
      resBody.needsMoreInfo = true;
      resBody.error = moreInfoTool.result.error;
    }

    res.json(resBody);
  } catch (err: any) {
    console.error('❌ Agent 请求失败:', err);
    res.status(500).json({ success: false, error: 'AI 服务暂时不可用，请稍后重试' });
  }
};

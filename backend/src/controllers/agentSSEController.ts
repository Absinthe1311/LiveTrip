import { Request, Response } from 'express';
import { agentService } from '../services/agentService';

export const chatWithAgentSSE = async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ success: false, error: '缺少必填字段：question（字符串）' });
  }

  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ success: false, error: '请先登录以使用 AI 助手', needLogin: true });
  }

  const { getPrismaClient } = await import('../lib/prisma');
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true }
  });
  if (!user) {
    return res.status(401).json({ success: false, error: '用户信息无效，请重新登录', needLogin: true });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendStep = (step: string) => {
    res.write(`data: ${JSON.stringify({ type: 'step', message: step })}\n\n`);
  };

  try {
    const response = await agentService.processRequest(
      { question: question.trim(), userId },
      sendStep
    );

    const confirmTool = response.toolCalls?.find((tc: any) => tc.result?.needsConfirmation);
    const moreInfoTool = response.toolCalls?.find((tc: any) => tc.result?.needsMoreInfo);
    const resultData: any = {
      type: 'result',
      success: true,
      data: response
    };

    if (confirmTool?.result?.needsConfirmation) {
      resultData.needsConfirmation = true;
      resultData.previewData = confirmTool.result.previewData;
      resultData.sessionId = confirmTool.result.sessionId;
    }

    if (moreInfoTool?.result?.needsMoreInfo) {
      resultData.needsMoreInfo = true;
      resultData.error = moreInfoTool.result.error;
    }

    res.write(`data: ${JSON.stringify(resultData)}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI 服务暂时不可用，请稍后重试' })}\n\n`);
    res.end();
  }
};

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

    // 从 header 获取 userId
    const userId = req.headers['x-user-id'] as string || undefined;
    
    // ✅ 问题1: 增强用户认证验证和日志
    console.log('\n🔍 [用户认证] 开始验证用户...');
    let validatedUserId = userId;
    
    if (userId) {
      console.log(`   ✅ 接收到 userId: ${userId}`);
      // 验证用户是否存在
      const { getPrismaClient } = await import('../lib/prisma');
      const prisma = getPrismaClient();
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true }
      });
      
      if (!user) {
        console.warn(`   ⚠️  用户不存在: ${userId}, 将使用默认用户`);
        validatedUserId = undefined; // 使用默认用户
      } else {
        console.log(`   ✅ 用户验证成功: ${user.username} (${user.email || '无邮箱'})`);
      }
    } else {
      console.warn('   ⚠️  未提供 userId，将使用默认用户');
    }

    // 调用 Agent 服务
    const response = await agentService.processRequest({
      question: question.trim(),
      userId: validatedUserId,
    });

    console.log('✅ Agent 回答完成');

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('❌ Agent 请求失败:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Agent 服务暂时不可用',
    });
  }
};

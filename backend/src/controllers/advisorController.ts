// 旅行顾问控制器 - 处理AI顾问相关请求
import { Request, Response } from 'express';
import { advisorService } from '../services/advisorService';

/**
 * AI顾问聊天
 * POST /api/advisor/chat
 */
export const chatWithAdvisor = async (req: Request, res: Response) => {
  try {
    console.log('💬 收到AI顾问请求');
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    const { question, planContext } = req.body;

    // 验证必填字段
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：question（字符串）',
      });
    }

    // 调用AI顾问服务
    const response = await advisorService.answerQuestion({
      question: question.trim(),
      planContext,
    });

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

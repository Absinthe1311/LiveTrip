// 测试路由 - 用于调试
import { Router } from 'express';
import { ZhipuAI } from 'zhipuai';

const router = Router();

/**
 * 测试智谱 AI 连接
 * GET /api/test/zhipuai
 */
router.get('/zhipuai', async (req, res) => {
  try {
    const zhipuAI = new ZhipuAI({
      apiKey: process.env.ZHIPUAI_API_KEY || '',
    });

    console.log('🧪 测试智谱 AI 连接...');
    console.log('   API Key:', process.env.ZHIPUAI_API_KEY ? '已配置' : '未配置');

    const result = await zhipuAI.chat.completions.create({
      model: 'glm-4',
      messages: [
        {
          role: 'user',
          content: '你好',
        },
      ],
    });

    console.log('✅ 智谱 AI 连接成功');
    console.log('   响应:', JSON.stringify(result, null, 2));

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ 智谱 AI 连接失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '连接失败',
      details: error.stack,
    });
  }
});

export default router;

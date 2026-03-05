// 测试智谱AI API
const { ZhipuAI } = require('zhipuai');
require('dotenv').config();

const apiKey = process.env.ZHIPUAI_API_KEY;

console.log('========================================');
console.log('智谱AI（ChatGLM）API 测试');
console.log('========================================');
console.log('');

if (!apiKey) {
  console.error('❌ 错误：未找到 ZHIPUAI_API_KEY 环境变量');
  process.exit(1);
}

console.log('✅ API Key 已配置');
console.log('   API Key:', apiKey);
console.log('');

async function testZhipuAI() {
  try {
    console.log('📡 正在初始化智谱AI客户端...');
    const client = new ZhipuAI({ apiKey });
    console.log('✅ 初始化成功');
    console.log('');

    // 测试1：简单对话
    console.log('📝 测试1：简单对话');
    console.log('   问题：你好，请用一句话介绍你自己');

    const result1 = await client.chat.completions.create({
      model: 'glm-4',
      messages: [
        {
          role: 'user',
          content: '你好，请用一句话介绍你自己',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer1 = result1.choices[0]?.message?.content || '无回答';

    console.log('');
    console.log('✅ 测试1成功！');
    console.log('   AI 回答:', answer1);
    console.log('');

    // 测试2：旅行相关问题
    console.log('📝 测试2：旅行相关问题');
    console.log('   问题：北京有哪些必去的景点？请列出3个具体的景点名称，每个景点用一句话描述。');

    const result2 = await client.chat.completions.create({
      model: 'glm-4',
      messages: [
        {
          role: 'user',
          content: '北京有哪些必去的景点？请列出3个具体的景点名称，每个景点用一句话描述。',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer2 = result2.choices[0]?.message?.content || '无回答';

    console.log('');
    console.log('✅ 测试2成功！');
    console.log('   AI 回答:');
    console.log('---');
    console.log(answer2);
    console.log('---');
    console.log('');

    // 测试3：带上下文的推荐
    console.log('📝 测试3：带上下文的推荐');
    console.log('   用户信息：');
    console.log('     目的地：北京');
    console.log('     预算：5000元');
    console.log('     天数：3天');
    console.log('     偏好：历史文化');
    console.log('   问题：这个预算够吗？');

    const result3 = await client.chat.completions.create({
      model: 'glm-4',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的旅行规划顾问，帮助用户解答旅行规划问题。',
        },
        {
          role: 'user',
          content: '目的地：北京\n预算：5000元\n天数：3天\n偏好：历史文化\n\n问题：这个预算够吗？',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer3 = result3.choices[0]?.message?.content || '无回答';

    console.log('');
    console.log('✅ 测试3成功！');
    console.log('   AI 回答:');
    console.log('---');
    console.log(answer3);
    console.log('---');
    console.log('');

    console.log('========================================');
    console.log('🎉 所有测试通过！');
    console.log('========================================');
    console.log('');
    console.log('结论：智谱AI API 可正常使用');
    console.log('');
    console.log('下一步：');
    console.log('1. 可以继续使用智谱AI进行AI推荐和顾问服务');
    console.log('2. 建议优化提示词以获得更具体的景点推荐');

  } catch (error) {
    console.error('');
    console.error('❌ 测试失败！');
    console.error('   错误信息:', error.message);
    console.error('');

    if (error.message.includes('401')) {
      console.error('可能的原因：');
      console.error('1. API Key 无效或已过期');
      console.error('2. API Key 格式不正确');
      console.error('3. 账户余额不足');
    } else if (error.message.includes('fetch failed')) {
      console.error('可能的原因：');
      console.error('1. 网络连接问题');
      console.error('2. 智谱AI服务器暂时不可用');
    }

    console.error('');
    console.error('详细错误：');
    console.error(error);
    process.exit(1);
  }
}

testZhipuAI();

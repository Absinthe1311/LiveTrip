import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// 智谱AI API配置
const ZHIPU_API_KEY = process.env.ZHIPUAI_API_KEY || '';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 生成景点描述的函数
async function generateDescription(spotName: string, category?: string, city?: string): Promise<string> {
  const prompt = `请为以下景点生成一段100-150字的详细描述，要求：
1. 突出景点的特色和亮点
2. 内容准确、真实
3. 语言生动、有吸引力
4. 字数控制在100-150字之间

景点名称：${spotName}
景点类别：${category || '景点'}
所在城市：${city || '未知'}

请直接输出描述内容，不要包含其他说明文字。`;

  try {
    const response = await axios.post(
      ZHIPU_API_URL,
      {
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const description = response.data.choices[0].message.content.trim();
    return description;
  } catch (error: any) {
    console.error(`生成描述失败 (${spotName}):`, error.message);
    return `${spotName}是${city || ''}著名的${category || '景点'}，具有独特的文化价值和游览体验，值得游客前来探访。`;
  }
}

async function main() {
  // 获取所有景点
  const spots = await prisma.spot.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      city: true,
      description: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`找到 ${spots.length} 个景点`);

  let updated = 0;
  let failed = 0;

  for (const spot of spots) {
    // 检查是否需要更新（描述为空或太短）
    if (!spot.description || spot.description.length < 80) {
      console.log(`\n正在生成: ${spot.name} (${spot.city})`);

      // 生成新描述
      const newDescription = await generateDescription(spot.name, spot.category || undefined, spot.city || undefined);

      // 检查生成的描述长度
      if (newDescription && newDescription.length >= 80 && newDescription.length <= 200) {
        await prisma.spot.update({
          where: { id: spot.id },
          data: { description: newDescription },
        });
        updated++;
        console.log(`✓ 成功 (${newDescription.length}字): ${newDescription.substring(0, 50)}...`);
      } else {
        failed++;
        console.log(`✗ 失败: 生成的描述长度不符合要求 (${newDescription.length}字)`);
      }

      // 添加延迟，避免API调用过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n完成! 成功更新 ${updated} 个景点描述，失败 ${failed} 个`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

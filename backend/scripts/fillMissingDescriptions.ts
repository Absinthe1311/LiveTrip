import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 智谱AI API配置
const ZHIPUAI_API_KEY = process.env.ZHIPUAI_API_KEY || '1e3b171d241b486397806444a2ed4361.rKh5UpsHOkqKDH4N';
const ZHIPUAI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * 使用智谱AI生成景点简介
 */
async function generateDescription(name: string, category: string, city: string): Promise<string> {
  try {
    const prompt = `请为以下景点生成一句简洁的中文简介（20-40字），突出其特色和历史价值：

景点名称：${name}
景点类型：${category || '景点'}
所在城市：${city}

要求：
1. 简洁明了，20-40字
2. 突出景点特色
3. 如果是历史景点，提及历史价值
4. 如果是自然景点，提及自然特色
5. 只输出简介内容，不要其他解释

简介：`;

    const response = await fetch(ZHIPUAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPUAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json() as any;
    let description = data.choices[0].message.content.trim();

    // 限制长度
    if (description.length > 60) {
      description = description.substring(0, 60);
    }

    return description;
  } catch (error) {
    console.error(`生成简介失败: ${error}`);
    return category || '热门景点';
  }
}

async function main() {
  console.log('========================================');
  console.log('为缺少description的景点生成简介');
  console.log('========================================\n');

  // 查找没有description的景点
  const spotsWithoutDesc = await prisma.spot.findMany({
    where: {
      OR: [
        { description: null },
        { description: '' }
      ]
    }
  });

  console.log(`找到 ${spotsWithoutDesc.length} 个需要生成简介的景点\n`);

  if (spotsWithoutDesc.length === 0) {
    console.log('✅ 所有景点都已有简介，无需生成');
    await prisma.$disconnect();
    return;
  }

  // 为每个景点生成简介
  for (const spot of spotsWithoutDesc) {
    console.log(`正在为 "${spot.name}" 生成简介...`);

    const description = await generateDescription(
      spot.name,
      spot.category || '',
      spot.city
    );

    // 更新数据库
    await prisma.spot.update({
      where: { id: spot.id },
      data: { description }
    });

    console.log(`✅ 已生成: ${spot.name} -> ${description}\n`);

    // 延迟一下，避免API调用过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 验证结果
  const totalSpots = await prisma.spot.count();
  const spotsWithDesc = await prisma.spot.count({
    where: {
      NOT: [
        { description: null },
        { description: '' }
      ]
    }
  });

  console.log('========================================');
  console.log('生成完成');
  console.log('========================================');
  console.log(`总景点数: ${totalSpots}`);
  console.log(`有description的景点数: ${spotsWithDesc}`);
  console.log(`无description的景点数: ${totalSpots - spotsWithDesc}\n`);

  await prisma.$disconnect();
}

main();

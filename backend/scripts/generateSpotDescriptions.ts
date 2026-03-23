/**
 * 批量生成景点简介脚本
 * 使用智谱AI为所有description为空的景点生成中文简介
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

class SpotDescriptionGenerator {
  private apiKey: string;
  private apiUrl: string = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  private model: string = 'glm-4';

  constructor() {
    this.apiKey = process.env.ZHIPUAI_API_KEY || '';
    if (!this.apiKey) {
      console.error('❌ 未配置 ZHIPUAI_API_KEY 环境变量');
      process.exit(1);
    }
    console.log('✅ 智谱AI客户端初始化成功');
  }

  /**
   * 生成景点简介
   */
  async generateDescription(spotName: string, city: string, category?: string): Promise<string> {
    const prompt = `请为以下景点生成一段60字以内的中文简介，要求：
1. 内容完整，是完整的句子
2. 语气自然友好
3. 介绍该景点的核心特色与游览价值
4. 不要使用"该景点"等生硬的表述
5. 直接输出简介内容，不要加引号或其他格式

景点名称：${spotName}
所在城市：${city}
${category ? `景点类型：${category}` : ''}

简介：`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      let description = response.data.choices[0]?.message?.content || '';

      // 清理描述文本
      description = description.trim();

      // 移除可能的引号
      if (description.startsWith('"') && description.endsWith('"')) {
        description = description.slice(1, -1);
      }
      if (description.startsWith("'") && description.endsWith("'")) {
        description = description.slice(1, -1);
      }

      // 确保不超过60字
      if (description.length > 60) {
        description = description.substring(0, 57) + '...';
      }

      return description;
    } catch (error: any) {
      console.error(`生成简介失败 (${spotName}):`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 批量处理所有景点
   */
  async processAllSpots() {
    console.log('\n========================================');
    console.log('开始批量生成景点简介');
    console.log('========================================\n');

    // 查询所有description为空的景点
    const spotsWithoutDescription = await prisma.spot.findMany({
      where: {
        OR: [
          { description: null },
          { description: '' },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 找到 ${spotsWithoutDescription.length} 个需要生成简介的景点\n`);

    if (spotsWithoutDescription.length === 0) {
      console.log('✅ 所有景点都已有简介，无需处理');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < spotsWithoutDescription.length; i++) {
      const spot = spotsWithoutDescription[i];
      console.log(`\n[${i + 1}/${spotsWithoutDescription.length}] 处理景点: ${spot.name}`);
      console.log(`   城市: ${spot.city}`);
      console.log(`   类型: ${spot.category || '未分类'}`);

      try {
        // 生成简介
        console.log('   🤖 正在生成简介...');
        const description = await this.generateDescription(
          spot.name,
          spot.city,
          spot.category || undefined
        );

        console.log(`   ✅ 生成成功: ${description}`);

        // 更新数据库
        await prisma.spot.update({
          where: { id: spot.id },
          data: { description },
        });

        console.log('   💾 已保存到数据库');
        successCount++;

        // 添加延迟，避免API调用过快
        if (i < spotsWithoutDescription.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`   ❌ 处理失败`);
        failCount++;
      }
    }

    console.log('\n========================================');
    console.log('处理完成');
    console.log('========================================');
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`❌ 失败: ${failCount} 个`);
    console.log(`📊 总计: ${spotsWithoutDescription.length} 个\n`);
  }

  /**
   * 关闭数据库连接
   */
  async disconnect() {
    await prisma.$disconnect();
  }
}

// 主函数
async function main() {
  const generator = new SpotDescriptionGenerator();

  try {
    await generator.processAllSpots();
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  } finally {
    await generator.disconnect();
  }
}

// 执行脚本
main();

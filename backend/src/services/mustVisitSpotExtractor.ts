/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：服务层重构
 */

// 必选景点提取服务 - 从用户输入中识别并匹配具体景点
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

export interface MustVisitSpot {
  id: string;
  name: string;
  location: string;
  address: string | null;
  city: string;
  category: string | null;
  ticketPrice: number | null;
  rating: number | null;
  description: string | null;
}

export interface ExtractionResult {
  mustVisitSpots: MustVisitSpot[];
  unmatchedSpots: string[];
  confidence: number;
}

class MustVisitSpotExtractor {
  /**
   * 从用户输入中提取必选景点
   * @param userInput 用户输入文本
   * @param city 目标城市（可选，用于缩小搜索范围）
   * @returns 提取结果
   */
  async extractMustVisitSpots(userInput: string, city?: string): Promise<ExtractionResult> {
    console.log(`🔍 开始从用户输入中提取必选景点...`);
    console.log(`   用户输入: ${userInput}`);
    console.log(`   目标城市: ${city || '未指定'}`);

    // 步骤1：从用户输入中识别可能的景点名称
    const potentialSpotNames = this.identifyPotentialSpotNames(userInput);
    console.log(
      `   识别到 ${potentialSpotNames.length} 个潜在景点: ${potentialSpotNames.join(', ')}`
    );

    if (potentialSpotNames.length === 0) {
      return {
        mustVisitSpots: [],
        unmatchedSpots: [],
        confidence: 0,
      };
    }

    // 步骤2：从数据库中匹配景点
    const matchedSpots: MustVisitSpot[] = [];
    const unmatchedNames: string[] = [];

    for (const spotName of potentialSpotNames) {
      const matches = await this.matchSpotInDatabase(spotName, city);

      if (matches.length > 0) {
        // 选择最匹配的景点（评分最高）
        const bestMatch = matches.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
        matchedSpots.push(bestMatch);
        console.log(`   ✅ 匹配成功: "${spotName}" → "${bestMatch.name}"`);
      } else {
        unmatchedNames.push(spotName);
        console.log(`   ❌ 未匹配: "${spotName}"`);
      }
    }

    // 步骤3：计算置信度
    const confidence = matchedSpots.length / potentialSpotNames.length;

    console.log(
      `✅ 提取完成: 匹配 ${matchedSpots.length}/${potentialSpotNames.length} 个景点，置信度: ${(confidence * 100).toFixed(1)}%`
    );

    return {
      mustVisitSpots: matchedSpots,
      unmatchedSpots: unmatchedNames,
      confidence,
    };
  }

  /**
   * 从用户输入中识别可能的景点名称
   */
  private identifyPotentialSpotNames(userInput: string): string[] {
    const potentialNames: string[] = [];

    // 先尝试常见景点关键词（最准确）
    const commonKeywords = [
      '外滩',
      '东方明珠',
      '故宫',
      '长城',
      '天坛',
      '颐和园',
      '豫园',
      '城隍庙',
      '西湖',
      '雷峰塔',
      '灵隐寺',
      '兵马俑',
      '大雁塔',
      '华清池',
      '鼓浪屿',
      '中山路',
      '张家界',
      '天门山',
      '凤凰古城',
      '漓江',
      '象鼻山',
      '黄山',
      '九华山',
      '天柱山',
      '宏村',
      '西递',
      '黄鹤楼', // 添加黄鹤楼
    ];

    // 优先匹配常见景点关键词
    for (const keyword of commonKeywords) {
      if (userInput.includes(keyword) && !potentialNames.includes(keyword)) {
        potentialNames.push(keyword);
      }
    }

    // 如果没有匹配到常见景点，再使用正则表达式
    if (potentialNames.length === 0) {
      const patterns = [
        // "一定要去X"模式 - 匹配以景点后缀结尾的词
        /一定要去\s*([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,
        /必须去\s*([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,

        // "想要去X"模式
        /想要去\s*([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,

        // "想看X"模式
        /想看\s*([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,
        /想参观\s*([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,

        // 直接提到的景点名称（限制长度2-10个字符）
        /要去\s*([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,

        // 常见景点后缀（限制长度2-10个字符）
        /([^\s，。！？,\.!?]{2,10}(?:塔|寺|庙|宫|园|馆|广场|街|城|山|湖|海|岛|桥|楼|阁))/g,
      ];

      // 应用所有模式
      for (const pattern of patterns) {
        const matches = userInput.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            // 提取景点名称（去除前缀）
            const spotName = match
              .replace(/^(一定要去\s*|必须去\s*|想要去\s*|想看\s*|想参观\s*|要去\s*)/, '')
              .trim();
            if (spotName.length > 0 && !potentialNames.includes(spotName)) {
              potentialNames.push(spotName);
            }
          });
        }
      }
    }

    return potentialNames;
  }

  /**
   * ✅ 问题2: 多层级模糊匹配景点
   */
  private async matchSpotInDatabase(spotName: string, city?: string): Promise<MustVisitSpot[]> {
    try {
      console.log(`\n🔍 [景点匹配] 开始匹配: "${spotName}"`);

      // 第一层: 精确匹配
      let spots = await this.matchExact(spotName, city);
      if (spots.length > 0) {
        console.log(`   ✅ 第一层(精确匹配)找到: ${spots.map((s) => s.name).join(', ')}`);
        return spots;
      }

      // 第二层: 包含匹配
      spots = await this.matchContains(spotName, city);
      if (spots.length > 0) {
        console.log(`   ✅ 第二层(包含匹配)找到: ${spots.map((s) => s.name).join(', ')}`);
        return spots;
      }

      // 第三层: 关键词匹配(去除后缀)
      spots = await this.matchKeyword(spotName, city);
      if (spots.length > 0) {
        console.log(`   ✅ 第三层(关键词匹配)找到: ${spots.map((s) => s.name).join(', ')}`);
        return spots;
      }

      // 第四层: 高德API搜索
      console.log(`   📡 数据库中未找到,尝试高德API...`);
      const amapSpots = await this.searchFromAmap(spotName, city);
      if (amapSpots.length > 0) {
        console.log(`   ✅ 第四层(高德API)找到: ${amapSpots.map((s) => s.name).join(', ')}`);
        return amapSpots;
      }

      console.log(`   ❌ 所有层级均未找到匹配`);
      return [];
    } catch (error) {
      console.error(`❌ 景点匹配失败: ${error}`);
      return [];
    }
  }

  /**
   * 第一层: 精确匹配
   */
  private async matchExact(spotName: string, city?: string): Promise<MustVisitSpot[]> {
    const where: any = { name: { equals: spotName } };
    if (city) where.city = city;

    return await prisma.spot.findMany({
      where,
      take: 1,
      select: this.getSpotSelect(),
    });
  }

  /**
   * 第二层: 包含匹配
   */
  private async matchContains(spotName: string, city?: string): Promise<MustVisitSpot[]> {
    const where: any = {
      OR: [
        { name: { contains: spotName } },
        // 反向包含: 数据库名称包含用户输入
        // 例如: 用户输入"黄鹤楼",匹配"黄鹤楼公园"
      ],
    };
    if (city) where.city = city;

    const spots = await prisma.spot.findMany({
      where,
      take: 5,
      select: this.getSpotSelect(),
    });

    // 按匹配度排序(越接近越好)
    return spots.sort((a, b) => {
      const aScore = this.calculateSimilarity(spotName, a.name);
      const bScore = this.calculateSimilarity(spotName, b.name);
      return bScore - aScore;
    });
  }

  /**
   * 第三层: 关键词匹配(去除常见后缀)
   */
  private async matchKeyword(spotName: string, city?: string): Promise<MustVisitSpot[]> {
    // 去除常见后缀
    const suffixes = ['公园', '景区', '景点', '风景区', '名胜区', '旅游区', '度假区'];
    let keyword = spotName;

    for (const suffix of suffixes) {
      if (spotName.endsWith(suffix)) {
        keyword = spotName.slice(0, -suffix.length);
        break;
      }
    }

    if (keyword === spotName) return []; // 没有可去除的后缀

    const where: any = {
      OR: [{ name: { contains: keyword } }, { name: { startsWith: keyword } }],
    };
    if (city) where.city = city;

    return await prisma.spot.findMany({
      where,
      take: 3,
      select: this.getSpotSelect(),
    });
  }

  /**
   * 第四层: 高德API搜索
   */
  private async searchFromAmap(spotName: string, city?: string): Promise<MustVisitSpot[]> {
    const maxRetries = 2;
    let retryCount = 0;
    let amapAttractions: any[] = [];
    const searchCity = city || '全国';

    while (retryCount < maxRetries) {
      try {
        const { amapService } = await import('./amapService');
        const amapServiceInstance = amapService();

        amapAttractions = await amapServiceInstance.getAttractions(
          searchCity,
          spotName,
          undefined,
          5
        );

        break;
      } catch (amapError: any) {
        retryCount++;
        console.error(`❌ 高德API失败 (重试 ${retryCount}/${maxRetries}):`, amapError.message);

        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (amapAttractions.length === 0) return [];

    // 保存第一个匹配的景点到数据库
    const attraction = amapAttractions[0];
    let ticketPrice: number | null = null;
    if (attraction.cost) {
      const match = attraction.cost.match(/(\d+)/);
      if (match) ticketPrice = parseFloat(match[1]);
    }

    const amapId = attraction.name + attraction.location;

    const savedSpot = await prisma.spot.upsert({
      where: { amapId },
      update: {
        name: attraction.name,
        location: attraction.location,
        address: attraction.address,
        city: searchCity,
        category: attraction.type,
        ticketPrice: ticketPrice,
        rating: attraction.rating,
        updatedAt: new Date(),
      },
      create: {
        amapId: amapId,
        name: attraction.name,
        location: attraction.location,
        address: attraction.address,
        city: searchCity,
        category: attraction.type,
        ticketPrice: ticketPrice,
        rating: attraction.rating,
        description: attraction.type,
        isOutdoor: true,
        source: 'amap',
      },
    });

    console.log(`✅ 景点已保存: ${savedSpot.name} (ID: ${savedSpot.id})`);

    // 生成IoT数据
    try {
      const { spotService } = await import('./spotService');
      await spotService.getCitySpots(searchCity, 1);
    } catch (iotError) {
      console.warn(`⚠️  生成IoT数据失败:`, iotError);
    }

    return [
      {
        id: savedSpot.id,
        name: savedSpot.name,
        location: savedSpot.location,
        address: savedSpot.address,
        city: savedSpot.city,
        category: savedSpot.category,
        ticketPrice: savedSpot.ticketPrice,
        rating: savedSpot.rating,
        description: savedSpot.description,
      },
    ];
  }

  /**
   * 计算字符串相似度(0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);

    if (maxLen === 0) return 1;

    // 计算编辑距离
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const editDistance = matrix[len1][len2];
    return 1 - editDistance / maxLen;
  }

  /**
   * 获取景点查询的select字段
   */
  private getSpotSelect() {
    return {
      id: true,
      name: true,
      location: true,
      address: true,
      city: true,
      category: true,
      ticketPrice: true,
      rating: true,
      description: true,
    };
  }
}

// 导出单例
export const mustVisitSpotExtractor = new MustVisitSpotExtractor();

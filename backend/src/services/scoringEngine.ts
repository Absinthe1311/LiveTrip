// 多因素评分引擎 - 替代智谱AI，实现智能景点推荐
import { CategoryTag, GroupType, SpotScore, makePlanRequest } from '../types';
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

// 景点类别映射配置
const CATEGORY_MAPPING: Record<string, CategoryTag[]> = {
  博物馆: ['history', 'art'],
  古迹: ['history'],
  文化: ['history', 'art'],
  公园: ['nature', 'city'],
  风景区: ['nature'],
  广场: ['city'],
  寺庙: ['religious'],
  教堂: ['religious'],
  古镇: ['history', 'city'],
  商业街: ['shopping', 'food', 'city'],
  主题乐园: ['theme_park'],
  动物园: ['theme_park', 'nature'],
  水族馆: ['theme_park', 'nature'],
  美术馆: ['art', 'history'],
  海滩: ['beach'],
  海岛: ['beach', 'nature'],
  山: ['nature', 'adventure'],
  湖: ['nature'],
  餐厅: ['food'],
  美食街: ['food', 'shopping'],
  购物中心: ['shopping'],
  建筑: ['city', 'art'],
  街区: ['city', 'shopping'],
};

// 人群适配评分规则
const CROWD_ADAPTER_RULES: Record<string, { add: CategoryTag[]; subtract: CategoryTag[] }> = {
  solo: {
    add: ['nature', 'beach', 'art', 'city'],
    subtract: ['theme_park'],
  },
  couple: {
    add: ['nature', 'beach', 'art', 'city', 'food'],
    subtract: ['theme_park'],
  },
  family_with_children: {
    add: ['theme_park', 'nature', 'beach'],
    subtract: ['religious', 'history', 'adventure'],
  },
  family_with_elderly: {
    add: ['nature', 'city', 'art'],
    subtract: ['adventure', 'theme_park'],
  },
  friends: {
    add: ['city', 'food', 'adventure', 'theme_park'],
    subtract: [],
  },
};

class ScoringEngine {
  /**
   * 为所有景点计算综合评分
   */
  async scoreAllSpots(
    spots: any[],
    request: makePlanRequest,
    iotDataMap: Map<string, any>
  ): Promise<SpotScore[]> {
    console.log('\n📊 开始为景点计算综合评分...');
    console.log(`   景点数量: ${spots.length}`);
    console.log(`   用户偏好: ${request.preferences?.categories?.join(', ') || '无'}`);
    console.log(`   群体类型: ${request.groupType || '未指定'}`);

    const scoredSpots: SpotScore[] = [];

    for (const spot of spots) {
      const score = await this.calculateSpotScore(spot, request, iotDataMap);
      scoredSpots.push(score);
    }

    // 按总分降序排序
    scoredSpots.sort((a, b) => b.totalScore - a.totalScore);

    console.log(`✅ 评分完成，最高分: ${scoredSpots[0]?.totalScore.toFixed(2) || 0}`);

    return scoredSpots;
  }

  /**
   * 计算单个景点的综合评分
   */
  private async calculateSpotScore(
    spot: any,
    request: makePlanRequest,
    iotDataMap: Map<string, any>
  ): Promise<SpotScore> {
    // 1. 获取景点的类别标签
    const categories = this.inferSpotCategories(spot);

    // 2. 计算偏好匹配分（35%）
    const preferenceScore = this.calculatePreferenceScore(
      categories,
      request.preferences?.categories || []
    );

    // 3. 计算质量评分分（25%）
    const qualityScore = await this.calculateQualityScore(spot);

    // 4. 计算 IoT 实时分（25%）
    const iotScore = this.calculateIoTScore(spot, iotDataMap.get(spot.id));

    // 5. 计算人群适配分（15%）
    const crowdScore = this.calculateCrowdScore(
      categories,
      request.groupType || 'solo',
      request.hasChildren || false,
      request.hasElderly || false
    );

    // 6. 计算总分
    const totalScore =
      preferenceScore * 0.35 + qualityScore * 0.25 + iotScore * 0.25 + crowdScore * 0.15;

    return {
      spotId: spot.id,
      spot,
      totalScore: Math.round(totalScore * 100) / 100,
      preferenceScore: Math.round(preferenceScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
      iotScore: Math.round(iotScore * 100) / 100,
      crowdScore: Math.round(crowdScore * 100) / 100,
      categories,
      iotData: iotDataMap.get(spot.id), // 添加IoT数据
    };
  }

  /**
   * 推断景点的类别标签
   */
  private inferSpotCategories(spot: any): CategoryTag[] {
    const categories: CategoryTag[] = [];
    const category = spot.category || spot.type || '';

    // 根据类别名称映射
    for (const [key, tags] of Object.entries(CATEGORY_MAPPING)) {
      if (category.includes(key)) {
        categories.push(...tags);
      }
    }

    // 如果没有匹配到，使用默认标签
    if (categories.length === 0) {
      if (category.includes('公园') || category.includes('景区')) {
        categories.push('nature');
      } else if (category.includes('博物馆') || category.includes('纪念馆')) {
        categories.push('history');
      } else {
        categories.push('city');
      }
    }

    // 去重
    return Array.from(new Set(categories));
  }

  /**
   * 计算偏好匹配分（使用 Jaccard 相似度）
   */
  private calculatePreferenceScore(
    spotCategories: CategoryTag[],
    userCategories: CategoryTag[]
  ): number {
    if (userCategories.length === 0) {
      return 50; // 用户没有偏好，给中等分
    }

    // Jaccard 相似度 = |A ∩ B| / |A ∪ B|
    const intersection = spotCategories.filter((cat) => userCategories.includes(cat));
    const union = Array.from(new Set([...spotCategories, ...userCategories]));

    const jaccard = intersection.length / union.length;

    // 转换为 0-100 分
    return jaccard * 100;
  }

  /**
   * 计算质量评分分
   */
  private async calculateQualityScore(spot: any): Promise<number> {
    let score = 0;

    // 1. 高德评分（80%）
    if (spot.rating) {
      score += (spot.rating / 5) * 80;
    } else {
      score += 60; // 默认中等评分
    }

    // 2. 收藏数量（20%）- 暂时使用默认值，后续可以从数据库获取
    const favoriteCount = await this.getSpotFavoriteCount(spot.id);
    if (favoriteCount > 0) {
      // 归一化：假设最高收藏数为 100
      const normalizedCount = Math.min(favoriteCount / 100, 1);
      score += normalizedCount * 20;
    }

    return Math.min(score, 100);
  }

  /**
   * 获取景点收藏数量
   */
  private async getSpotFavoriteCount(spotId: string): Promise<number> {
    try {
      const count = await prisma.favorite.count({
        where: { spotId },
      });
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 计算 IoT 实时分
   */
  private calculateIoTScore(spot: any, iotData: any): number {
    if (!iotData) {
      return 50; // 没有 IoT 数据，给中等分
    }

    let score = 100;

    // 1. 拥挤度惩罚
    const crowdLevel = iotData.crowdLevel || 50;
    if (crowdLevel > 85) {
      score -= 40;
    } else if (crowdLevel > 70) {
      score -= 20;
    } else if (crowdLevel > 60) {
      score -= 10;
    }

    // 2. 天气惩罚（仅针对户外景点）
    if (spot.isOutdoor !== false) {
      const rainProbability = iotData.rainProbability || 0;
      if (rainProbability > 70) {
        score -= 30;
      } else if (rainProbability > 50) {
        score -= 15;
      } else if (rainProbability > 30) {
        score -= 5;
      }
    }

    // 3. 开放状态
    if (iotData.isOpen === false) {
      score = 0; // 直接排除
    } else {
      score += 10; // 确认开放，加分
    }

    return Math.max(0, score);
  }

  /**
   * 计算人群适配分
   */
  private calculateCrowdScore(
    categories: CategoryTag[],
    groupType: GroupType,
    hasChildren: boolean,
    hasElderly: boolean
  ): number {
    let score = 50; // 基础分

    // 确定使用哪个规则
    let ruleKey: string = groupType;
    if (groupType === 'family' && hasChildren) {
      ruleKey = 'family_with_children';
    } else if (groupType === 'family' && hasElderly) {
      ruleKey = 'family_with_elderly';
    }

    const rule = CROWD_ADAPTER_RULES[ruleKey] || CROWD_ADAPTER_RULES.solo;

    // 加分
    for (const category of categories) {
      if (rule.add.includes(category)) {
        score += 10;
      }
    }

    // 减分
    for (const category of categories) {
      if (rule.subtract.includes(category)) {
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }
}

// 导出单例
export const scoringEngine = new ScoringEngine();

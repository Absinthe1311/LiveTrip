// 传统推荐服务 - 使用多因素评分引擎（用于普通表单创建行程）
import { scoringEngine } from './scoringEngine';
import { clusteringService } from './clusteringService';
import { diversityService } from './diversityService';
import { iotCheckService } from './iotCheckService';
import { budgetOptimizer } from './budgetOptimizer';
import { errorHandler, FallbackStrategy } from './errorHandler';
import { RecommendedAttraction, DailyItinerary, FullItinerary, CategoryTag } from '../types';
import { spotService } from './spotService';

class TraditionalRecommender {
  /**
   * 推荐行程（多因素评分引擎）
   */
  async recommendItinerary(request: any): Promise<FullItinerary> {
    console.log('\n🤖 开始使用传统推荐算法推荐行程...');
    console.log(`   目的地: ${request.destination}`);
    console.log(`   天数: ${request.days}`);
    console.log(`   预算: ${request.budget}元`);
    console.log(`   人数: ${request.groupSize || 1}人`);
    console.log(`   群体类型: ${request.groupType || 'solo'}`);
    console.log(`   偏好: ${request.preferences?.categories?.join(', ') || '无'}`);
    console.log(`   候选景点数: ${request.attractions.length}`);

    try {
      // 步骤1：获取 IoT 数据
      console.log('\n步骤1: 获取 IoT 数据...');
      const spotIds = request.attractions.map((a: any) => a.id || a.spotId);
      const iotDataMap = await this.getIoTDataMap(spotIds);
      console.log(`✅ 获取到 ${iotDataMap.size} 个景点的 IoT 数据`);

      // 步骤2：为所有景点计算综合评分
      console.log('\n步骤2: 计算景点综合评分...');
      const scoredSpots = await scoringEngine.scoreAllSpots(
        request.attractions,
        request,
        iotDataMap
      );

      // 步骤3：K-means 地理聚类
      console.log('\n步骤3: K-means 地理聚类...');
      const clusters = await clusteringService.kMeansClustering(scoredSpots, request.days);

      // 步骤4：在每个聚类内选择景点，应用多样性约束
      console.log('\n步骤4: 选择景点并应用多样性约束...');
      const itineraryItems = this.selectSpotsFromClusters(
        clusters,
        request.preferences?.pace || 'moderate'
      );

      // 步骤5：构建行程
      console.log('\n步骤5: 构建行程...');
      const itinerary = this.buildItinerary(itineraryItems, request.startDate, request.days);

      // 步骤6：计算总费用和预算分配
      console.log('\n步骤6: 动态计算费用和预算分配...');
      const budgetResult = await budgetOptimizer.calculateBudget({
        itinerary,
        totalBudget: request.budget || 5000,
        days: request.days,
        groupSize: request.groupSize || 1,
        groupType: request.groupType || 'solo',
        destination: request.destination,
        startDate: request.startDate,
        endDate: request.endDate,
      });

      const { total_cost, budget_breakdown, budget_utilization, recommendations } = budgetResult;

      // 步骤7：生成备选景点池
      console.log('\n步骤7: 生成备选景点池...');
      const alternativePools = this.generateAlternativePools(scoredSpots, itineraryItems);

      // 步骤8：IoT 实时检查和景点替换
      console.log('\n步骤8: IoT 实时检查和景点替换...');
      const { checkedItinerary, excludedSpots, warnings } = await iotCheckService.checkItinerary(
        itinerary,
        request.groupType || 'solo',
        request.hasChildren || false,
        request.hasElderly || false
      );

      // 如果有被排除的景点，尝试用备选景点替换
      let finalItinerary = checkedItinerary;
      if (excludedSpots.length > 0 && alternativePools) {
        console.log(`   发现 ${excludedSpots.length} 个问题景点，尝试替换...`);
        finalItinerary = await iotCheckService.replaceExcludedSpots(
          checkedItinerary,
          excludedSpots,
          alternativePools
        );
      }

      // 重新计算费用（替换后可能有变化）
      const finalBudgetResult = await budgetOptimizer.calculateBudget({
        itinerary: finalItinerary,
        totalBudget: request.budget || 5000,
        days: request.days,
        groupSize: request.groupSize || 1,
        groupType: request.groupType || 'solo',
        destination: request.destination,
        startDate: request.startDate,
        endDate: request.endDate,
      });

      const { total_cost: finalTotalCost, budget_breakdown: finalBudgetBreakdown } =
        finalBudgetResult;

      console.log('\n✅ 行程推荐完成！');
      console.log(`   总费用: ${finalTotalCost} 元`);
      console.log(`   预算分配:`, finalBudgetBreakdown);
      console.log(`   IoT 检查: 排除 ${excludedSpots.length} 个，警告 ${warnings.length} 个`);

      const result = {
        itinerary: finalItinerary,
        total_cost: finalTotalCost,
        budget_breakdown: finalBudgetBreakdown,
        alternativePools, // 已经是普通对象
        excludedSpots, // 新增：被排除的景点信息
        warnings, // 新增：警告信息
        budget_utilization: finalBudgetResult.budget_utilization, // 新增：预算利用率
        recommendations: finalBudgetResult.recommendations, // 新增：预算优化建议
      };

      // 验证结果
      const validation = errorHandler.validateItinerary(result);
      if (!validation.valid) {
        console.error('⚠️  行程验证失败:', validation.errors);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('\n❌ 行程推荐过程中发生错误:', errorMessage);

      // 尝试回退策略
      const fallbackStrategy: FallbackStrategy = {
        name: '简化行程回退',
        description: '生成简化版行程作为回退方案',
        execute: async () => {
          console.log('\n🔄 执行回退方案：生成简化行程...');

          // 生成最简单的行程
          const days = request.days || 3;
          const simpleItinerary: DailyItinerary[] = [];

          for (let i = 1; i <= days; i++) {
            // 每天只选前2个景点
            const dayAttractions = request.attractions.slice(0, 2).map((attr: any) => ({
              id: attr.id || attr.spotId,
              spotId: attr.id || attr.spotId,
              name: attr.name,
              time: '09:00-12:00',
              location: attr.location,
              estimated_cost: attr.ticketPrice || 0,
              description: attr.description || attr.category || '景点',
              type: attr.category,
              address: attr.address,
            }));

            simpleItinerary.push({
              day: i,
              date: new Date(request.startDate).toISOString().split('T')[0],
              attractions: dayAttractions,
              daily_cost: dayAttractions.reduce(
                (sum: number, attr: any) => sum + attr.estimated_cost,
                0
              ),
            });
          }

          // 简单计算费用
          const tickets = simpleItinerary.reduce((sum, day) => {
            return sum + day.attractions.reduce((daySum, attr) => daySum + attr.estimated_cost, 0);
          }, 0);

          const accommodation = days * Math.ceil((request.groupSize || 1) / 2) * 200;
          const dining = days * (request.groupSize || 1) * 100;
          const total_cost = tickets + accommodation + dining;

          return {
            itinerary: simpleItinerary,
            total_cost,
            budget_breakdown: {
              transportation: 0,
              accommodation,
              dining,
              tickets,
            },
            warnings: [
              { attraction: {} as RecommendedAttraction, reason: '使用回退方案，功能受限' },
            ],
          };
        },
      };

      const fallbackResult = await errorHandler.handleError(error, '行程推荐', fallbackStrategy);

      if (fallbackResult.success) {
        console.log('✅ 回退方案执行成功');
        return fallbackResult.result;
      } else {
        // 回退方案也失败了，抛出错误
        throw new Error(`行程推荐失败: ${errorMessage}`);
      }
    }
  }

  /**
   * 从每个聚类中选择景点
   */
  private selectSpotsFromClusters(clusters: any[], pace: string): any[] {
    const selectedSpots: any[] = [];

    // 根据节奏确定每天景点数量
    const spotsPerDay = this.getSpotsPerDay(pace);

    for (const cluster of clusters) {
      // 按评分降序排序
      const sortedSpots = [...cluster.spots].sort((a, b) => b.totalScore - a.totalScore);

      // 应用多样性约束
      const selected = diversityService.applyDiversityConstraints(sortedSpots, spotsPerDay);

      selectedSpots.push(...selected);
    }

    return selectedSpots;
  }

  /**
   * 根据节奏确定每天景点数量
   */
  private getSpotsPerDay(pace: string): number {
    switch (pace) {
      case 'slow':
        return 2;
      case 'moderate':
        return 3;
      case 'fast':
        return 4;
      default:
        return 3;
    }
  }

  /**
   * 构建行程
   */
  private buildItinerary(spots: any[], startDate: string, days: number): DailyItinerary[] {
    const itinerary: DailyItinerary[] = [];
    const spotsPerDay = Math.ceil(spots.length / days);

    for (let day = 0; day < days; day++) {
      const daySpots = spots.slice(day * spotsPerDay, (day + 1) * spotsPerDay);

      if (daySpots.length === 0) {
        continue;
      }

      // 分配时间段
      const attractions = this.assignTimeSlots(daySpots);

      // 计算当天费用
      const daily_cost = daySpots.reduce((sum, spot) => sum + (spot.spot.ticketPrice || 0), 0);

      itinerary.push({
        day: day + 1,
        date: this.addDays(startDate, day),
        attractions,
        daily_cost,
      });
    }

    return itinerary;
  }

  /**
   * 分配时间段
   */
  private assignTimeSlots(spots: any[]): RecommendedAttraction[] {
    const attractions: RecommendedAttraction[] = [];
    let currentTime = 9 * 60; // 从 9:00 开始（分钟数）

    for (const spotScore of spots) {
      const spot = spotScore.spot;
      const duration = 120; // 默认每个景点游览 2 小时
      const endTime = currentTime + duration;

      // 获取图片URL（spot.image是SpotImage对象，需要取url字段）
      const imageUrl = spot.image?.url || spot.image || null;

      attractions.push({
        id: spot.id,
        spotId: spot.id,
        name: spot.name,
        time: `${this.minutesToTime(currentTime)}-${this.minutesToTime(endTime)}`,
        location: spot.location,
        estimated_cost: spot.ticketPrice || 0,
        description: spot.description || spot.category || '热门景点',
        type: spot.category,
        address: spot.address,
        image: imageUrl, // 使用正确的图片URL
        iotData: spotScore.iotData, // 添加IoT数据
        rating: spot.rating, // 添加评分
        category: spot.category, // 添加分类
      });

      currentTime = endTime + 60; // 每个景点之间间隔 1 小时
    }

    return attractions;
  }

  /**
   * 生成备选景点池（新方案：未选中景点自动成为备选）
   * 核心思想：
   * 1. 所有景点已评分排序
   * 2. 选中的景点作为行程展示
   * 3. 未选中的景点按评分分配给选中的景点作为备选
   * 4. 确保备选景点唯一性（每个未选中景点只对应一个选中景点）
   * 5. 每个景点最多2个备选
   */
  public generateAlternativePools(scoredSpots: any[], selectedSpots: any[]): Record<string, any[]> {
    console.log('\n🔄 生成备选景点池（新方案）...');
    console.log(`   总景点数: ${scoredSpots.length}`);
    console.log(`   选中景点数: ${selectedSpots.length}`);

    const alternativePools: Record<string, any[]> = {};
    const MAX_ALTERNATIVES = 2; // 每个景点最多2个备选

    // 初始化每个选中景点的备选池
    for (const selectedSpot of selectedSpots) {
      alternativePools[selectedSpot.spotId] = [];
    }

    // 找出未选中的景点
    const selectedSpotIds = new Set(selectedSpots.map((s) => s.spotId));
    const unselectedSpots = scoredSpots.filter((spot) => !selectedSpotIds.has(spot.spotId));

    console.log(`   未选中景点数: ${unselectedSpots.length}`);

    // 按评分降序排序未选中景点
    const sortedUnselectedSpots = unselectedSpots.sort((a, b) => b.totalScore - a.totalScore);

    // 将未选中景点分配给选中景点作为备选
    // 策略：轮询分配，每个景点最多MAX_ALTERNATIVES个备选
    let selectedIndex = 0;
    for (const unselectedSpot of sortedUnselectedSpots) {
      // 找到对应的选中景点（轮询）
      const selectedSpot = selectedSpots[selectedIndex % selectedSpots.length];
      const spotId = selectedSpot.spotId;

      // 检查该选中景点是否已达到最大备选数量
      if (alternativePools[spotId].length >= MAX_ALTERNATIVES) {
        // 跳过已满的景点，找下一个未满的
        let found = false;
        for (let i = 0; i < selectedSpots.length; i++) {
          const nextIndex = (selectedIndex + i) % selectedSpots.length;
          const nextSpotId = selectedSpots[nextIndex].spotId;
          if (alternativePools[nextSpotId].length < MAX_ALTERNATIVES) {
            // 构造完整的备选景点信息
            const alternativeData = this.buildAlternativeData(unselectedSpot);
            alternativePools[nextSpotId].push(alternativeData);
            found = true;
            selectedIndex = nextIndex + 1;
            break;
          }
        }
        if (!found) {
          // 所有选中景点都已满，停止分配
          break;
        }
      } else {
        // 构造完整的备选景点信息
        const alternativeData = this.buildAlternativeData(unselectedSpot);
        alternativePools[spotId].push(alternativeData);
        selectedIndex++;
      }
    }

    // 打印分配结果
    console.log('\n📊 备选景点分配结果：');
    for (const selectedSpot of selectedSpots) {
      const alternatives = alternativePools[selectedSpot.spotId];
      console.log(`   ${selectedSpot.spot.name}: ${alternatives.length} 个备选`);
    }

    // 验证：确保没有重复
    const allAlternativeIds = new Set<string>();
    let hasDuplicate = false;
    for (const alternatives of Object.values(alternativePools)) {
      for (const alt of alternatives) {
        if (allAlternativeIds.has(alt.spotId)) {
          hasDuplicate = true;
          console.error(`   ❌ 发现重复：${alt.name}`);
        }
        allAlternativeIds.add(alt.spotId);
      }
    }

    if (!hasDuplicate) {
      console.log('   ✅ 验证通过：没有重复的备选景点');
    }

    return alternativePools;
  }

  /**
   * 构造备选景点数据（确保包含完整信息）
   */
  private buildAlternativeData(scoredSpot: any): any {
    const spot = scoredSpot.spot;
    // 获取图片URL（spot.image是SpotImage对象，需要取url字段）
    const imageUrl = spot.image?.url || spot.image || null;

    // 调试日志
    if (spot.image) {
      console.log(`   📸 ${spot.name} 图片数据:`, {
        hasImage: !!spot.image,
        imageType: typeof spot.image,
        hasUrl: !!spot.image?.url,
        imageUrl: imageUrl ? imageUrl.substring(0, 60) + '...' : null,
      });
    }

    return {
      spotId: spot.id,
      id: spot.id,
      name: spot.name,
      location: spot.location,
      address: spot.address || '',
      estimated_cost: spot.ticketPrice || 0,
      description: spot.description || spot.category || '热门景点',
      type: spot.category,
      category: spot.category,
      rating: spot.rating,
      ticketPrice: spot.ticketPrice,
      image: imageUrl, // 使用正确的图片URL
      totalScore: scoredSpot.totalScore,
      iotData: scoredSpot.iotData,
    };
  }

  /**
   * 获取 IoT 数据映射
   */
  private async getIoTDataMap(spotIds: string[]): Promise<Map<string, any>> {
    try {
      const iotDataList = await spotService.getBatchIoTData(spotIds);
      return iotDataList;
    } catch (error) {
      console.error('❌ 获取 IoT 数据失败:', error);
      return new Map();
    }
  }

  /**
   * 将分钟数转换为时间字符串
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * 日期加天数
   */
  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

// 导出工厂函数
export const getTraditionalRecommender = (): TraditionalRecommender => {
  return new TraditionalRecommender();
};

// 向后兼容的单例导出（延迟初始化）
let traditionalRecommenderInstance: TraditionalRecommender | null = null;
export const traditionalRecommender = (): TraditionalRecommender => {
  if (!traditionalRecommenderInstance) {
    traditionalRecommenderInstance = new TraditionalRecommender();
  }
  return traditionalRecommenderInstance;
};

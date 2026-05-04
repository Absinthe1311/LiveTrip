// 多样性约束服务 - 防止行程同质化
import { SpotScore, CategoryTag } from '../types';

class DiversityService {
  /**
   * 应用多样性约束，从候选景点中选择景点
   */
  diversify(scoredSpots: SpotScore[], maxSpots: number): SpotScore[] {
    console.log(`\n🎨 应用多样性约束，候选景点: ${scoredSpots.length}，最大选择: ${maxSpots}`);

    if (scoredSpots.length <= maxSpots) {
      console.log('✅ 候选景点数量不超过最大值，全部保留');
      return scoredSpots;
    }

    const selectedSpots: SpotScore[] = [];

    // 贪心选择：从高分到低分，每次选择前检查约束
    for (const spot of scoredSpots) {
      if (selectedSpots.length >= maxSpots) {
        break;
      }

      // 检查是否可以添加该景点
      if (this.spotOK(spot, selectedSpots, maxSpots)) {
        selectedSpots.push(spot);
        console.log(`   ✓ 添加景点: ${spot.spot.name} (评分: ${spot.totalScore.toFixed(2)})`);
      } else {
        console.log(`   ✗ 跳过景点: ${spot.spot.name} (违反多样性约束)`);
      }
    }

    console.log(`✅ 多样性约束应用完成，选择了 ${selectedSpots.length} 个景点`);

    // 如果选择的景点太少，放宽约束
    if (selectedSpots.length < 2) {
      console.log('⚠️  选择的景点太少，放宽约束');
      return scoredSpots.slice(0, maxSpots);
    }

    return selectedSpots;
  }

  /**
   * 检查是否可以添加该景点
   */
  private spotOK(spot: SpotScore, selectedSpots: SpotScore[], maxSpots: number): boolean {
    // 规则1：每天相同 CategoryTag 的景点不超过 2 个
    for (const category of spot.categories) {
      const count = selectedSpots.filter((s) => s.categories.includes(category)).length;
      if (count >= 2) {
        return false;
      }
    }

    // 规则2：整个行程中同一 CategoryTag 的占比不超过 50%
    const totalSelected = selectedSpots.length;
    if (totalSelected > 0) {
      for (const category of spot.categories) {
        const count = selectedSpots.filter((s) => s.categories.includes(category)).length;
        const ratio = (count + 1) / (totalSelected + 1);
        if (ratio > 0.5) {
          return false;
        }
      }
    }

    // 规则3：每天必须包含至少 2 种不同 CategoryTag
    if (selectedSpots.length >= maxSpots - 1) {
      const allCategories = new Set<CategoryTag>();
      for (const s of [...selectedSpots, spot]) {
        s.categories.forEach((cat) => allCategories.add(cat));
      }

      if (allCategories.size < 2) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查整个行程的多样性
   */
  chkDiv(allSpots: SpotScore[]): {
    passed: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 检查每个 CategoryTag 的占比
    const categoryCounts = new Map<CategoryTag, number>();
    for (const spot of allSpots) {
      for (const category of spot.categories) {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      }
    }

    for (const [category, count] of categoryCounts) {
      const ratio = count / allSpots.length;
      if (ratio > 0.5) {
        issues.push(`${category} 占比过高: ${(ratio * 100).toFixed(1)}%`);
      }
    }

    // 检查类别多样性
    const totalCategories = new Set<CategoryTag>();
    for (const spot of allSpots) {
      spot.categories.forEach((cat) => totalCategories.add(cat));
    }

    if (totalCategories.size < 2) {
      issues.push(`类别多样性不足，仅有 ${totalCategories.size} 种类别`);
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}

// 导出单例
export const diversityService = new DiversityService();

// 改进的预算分布组件 - 参考homepage预算表格设计
import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface ImprovedBudgetBarProps {
  categories: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  totalBudget: number;
  usedBudget: number;
}

export default function ImprovedBudgetBar({
  categories,
  totalBudget,
  usedBudget
}: ImprovedBudgetBarProps) {
  // 调试信息
  console.log('📊 预算数据:', { categories, totalBudget, usedBudget });

  // 计算每个分类的百分比（基于已用预算）
  const getPercentage = (amount: number) => {
    if (usedBudget === 0) return 0;
    return (amount / usedBudget) * 100;
  };

  // 计算总使用率
  const usageRate = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;
  const remaining = totalBudget - usedBudget;

  // 预算状态
  const getBudgetStatus = () => {
    if (usageRate > 100) return { color: 'text-red-400', text: '超支', icon: TrendingDown };
    if (usageRate > 95) return { color: 'text-yellow-400', text: '紧张', icon: TrendingUp };
    return { color: 'text-green-400', text: '充足', icon: Wallet };
  };

  const status = getBudgetStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-5 border border-white/30 shadow-lg">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-white">预算分布</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
        </div>
      </div>

      {/* 总预算进度条 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">已用预算</span>
          <span className="text-xs text-white/60">¥{usedBudget} / ¥{totalBudget}</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-white/20">
          <div 
            className={`h-full transition-all duration-300 ${
              usageRate > 100 ? 'bg-red-500' : usageRate > 95 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usageRate, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-white/40">使用率 {usageRate.toFixed(1)}%</span>
          <span className={`text-xs ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {remaining >= 0 ? `剩余 ¥${remaining}` : `超支 ¥${Math.abs(remaining)}`}
          </span>
        </div>
      </div>

      {/* 分类详情 - 每个类别一条有颜色的线 */}
      <div className="space-y-3">
        {categories.map((category, index) => {
          const percentage = getPercentage(category.amount);

          // 显示所有类别，即使金额为0
          return (
            <div key={index} className="space-y-1.5">
              {/* 分类名称和金额 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 分类颜色标识 */}
                  <div className={`w-2.5 h-2.5 rounded-full ${category.color} flex-shrink-0`} />
                  <span className="text-sm text-white font-medium">{category.name}</span>
                </div>

                {/* 分类金额和占比 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">¥{category.amount}</span>
                  <span className="text-xs text-white/60 w-12 text-right">{percentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* 分类进度条 - 按实际金额比例缩放 */}
              <div className="h-1.5 rounded-full overflow-hidden bg-white/20">
                <div
                  className={`${category.color} transition-all duration-300 rounded-full`}
                  style={{ width: `${percentage}%` }}
                  title={`${category.name}: ¥${category.amount} (${percentage.toFixed(1)}%)`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 总预算对比条 - 显示实际使用情况 */}
      <div className="mt-5 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/60">预算使用情况</span>
          <span className="text-xs text-white/60">{usageRate.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-white/20 flex">
          {/* 已使用部分 */}
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${Math.min(usageRate, 100)}%` }}
          />
          {/* 剩余部分 */}
          <div
            className="bg-gradient-to-r from-gray-400 to-gray-500 transition-all duration-300"
            style={{ width: `${Math.max(0, 100 - usageRate)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

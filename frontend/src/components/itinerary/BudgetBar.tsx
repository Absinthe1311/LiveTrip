// 改进的预算分布组件 - 堆叠进度条设计
import React from 'react';

interface BudgetBarProps {
  categories: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  totalBudget: number;
  usedBudget: number;
}

export default function BudgetBar({
  categories,
  totalBudget,
  usedBudget
}: BudgetBarProps) {
  // 计算每个分类的百分比
  const getPercentage = (amount: number) => {
    if (totalBudget === 0) return 0;
    return (amount / totalBudget) * 100;
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">预算分布</span>
        <span className="text-xs text-white/50">
          已用 ¥{usedBudget} / 总预算 ¥{totalBudget}
        </span>
      </div>

      {/* 堆叠进度条 */}
      <div className="h-3 rounded-full overflow-hidden bg-white/20 flex mb-3">
        {categories.map((category, index) => {
          const percentage = getPercentage(category.amount);
          if (percentage === 0) return null;
          
          return (
            <div
              key={index}
              className={`${category.color} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
              title={`${category.name}: ¥${category.amount}`}
            />
          );
        })}
      </div>

      {/* 分类标签 */}
      <div className="flex items-center justify-between gap-2">
        {categories.map((category, index) => (
          <div key={index} className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className={`w-2 h-2 rounded-full ${category.color}`} />
              <span className="text-xs text-white/60">{category.name}</span>
            </div>
            <div className="text-sm font-semibold text-white">¥{category.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

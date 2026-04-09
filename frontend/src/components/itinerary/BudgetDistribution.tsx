// 费用分布组件 - 用于右侧侧栏
import React from 'react';
import { Car, Building2, UtensilsCrossed, Ticket, ShoppingBag, MoreHorizontal } from 'lucide-react';

interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
}

interface BudgetDistributionProps {
  items: BudgetItem[];
  totalBudget: number;
  usedBudget: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  '交通': Car,
  '住宿': Building2,
  '餐饮': UtensilsCrossed,
  '门票': Ticket,
  '购物': ShoppingBag,
  '其他': MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  '交通': 'bg-blue-500',
  '住宿': 'bg-purple-500',
  '餐饮': 'bg-green-500',
  '门票': 'bg-amber-500',
  '购物': 'bg-pink-500',
  '其他': 'bg-gray-500',
};

export default function BudgetDistribution({
  items,
  totalBudget,
  usedBudget
}: BudgetDistributionProps) {
  const remainingBudget = totalBudget - usedBudget;
  const usedPercentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4">费用分布</h3>

      {/* 总预算进度条 */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">已使用</span>
          <span className="text-white font-semibold">¥{usedBudget.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-white/40">¥0</span>
          <span className="text-white/60">预算 ¥{totalBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* 分类明细 */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = categoryIcons[item.category] || MoreHorizontal;
          const colorClass = categoryColors[item.category] || 'bg-gray-500';

          return (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${colorClass} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white truncate">{item.category}</span>
                  <span className="text-sm text-white font-semibold">¥{item.amount.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-white/60 w-12 text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* 剩余预算 */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60">剩余预算</span>
          <span className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ¥{remainingBudget.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

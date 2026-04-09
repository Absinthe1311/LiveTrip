// 当日费用分布组件 - 右栏下半部分
import React from 'react';
import { Car, Building2, UtensilsCrossed, Ticket } from 'lucide-react';

interface ExpenseItem {
  category: string;
  amount: number;
  percentage: number;
}

interface DailyExpenseDistributionProps {
  items: ExpenseItem[];
  totalBudget: number;
  usedBudget: number;
}

const categoryIcons: Record<string, React.ElementType> = {
  '交通': Car,
  '住宿': Building2,
  '餐饮': UtensilsCrossed,
  '门票': Ticket,
};

const categoryColors: Record<string, string> = {
  '交通': 'bg-amber-500',
  '住宿': 'bg-blue-500',
  '餐饮': 'bg-green-500',
  '门票': 'bg-purple-500',
};

export default function DailyExpenseDistribution({
  items,
  totalBudget,
  usedBudget
}: DailyExpenseDistributionProps) {
  const remainingBudget = totalBudget - usedBudget;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">费用分布</h3>
        <span className="text-sm font-bold text-amber-400">¥{usedBudget.toLocaleString()}</span>
      </div>

      {/* 分隔线 */}
      <div className="border-t border-white/10 my-3" />

      {/* 费用项列表 */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const Icon = categoryIcons[item.category] || Car;
          const colorClass = categoryColors[item.category] || 'bg-amber-500';

          return (
            <div key={index}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-sm text-white/80 flex-1">{item.category}</span>
                <span className="text-sm font-semibold text-white">¥{item.amount.toLocaleString()}</span>
                <span className="text-xs text-white/40 ml-1">{item.percentage.toFixed(0)}%</span>
              </div>
              {/* 进度条 */}
              <div className="h-1 bg-white/10 rounded overflow-hidden ml-6">
                <div
                  className={`h-full ${colorClass} rounded transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 剩余预算 */}
      <div className="border-t border-white/10 mt-3 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">剩余预算</span>
          <span className={`text-base font-bold ${remainingBudget >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            ¥{remainingBudget.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

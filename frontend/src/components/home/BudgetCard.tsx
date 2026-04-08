// Budget 预算卡片组件 - 玻璃拟态风格
import React from 'react';
import GlassCard from './GlassCard';
import { Car, Building2, Utensils, ShoppingBag } from 'lucide-react';

interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface BudgetCardProps {
  title?: string;
  budgetItems?: BudgetItem[];
  totalBudget?: number;
  className?: string;
}

export default function BudgetCard({
  title = 'Overall Budget',
  budgetItems = [
    { category: 'Transportation', amount: 40, percentage: 40, color: 'bg-red-500' },
    { category: 'Hotels', amount: 37, percentage: 37, color: 'bg-yellow-500' },
    { category: 'Food & Drinks', amount: 31, percentage: 31, color: 'bg-blue-500' },
    { category: 'Shopping', amount: 24, percentage: 24, color: 'bg-green-500' },
  ],
  totalBudget = 132,
  className = ''
}: BudgetCardProps) {
  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Transportation':
        return <Car className="h-4 w-4" />;
      case 'Hotels':
        return <Building2 className="h-4 w-4" />;
      case 'Food & Drinks':
        return <Utensils className="h-4 w-4" />;
      case 'Shopping':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <GlassCard className={`p-5 ${className}`}>
      {/* 标题 */}
      <h3 className="text-lg font-bold text-white mb-3">
        {title}
      </h3>

      {/* 预算列表 */}
      <div className="space-y-2">
        {budgetItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* 图标 */}
            <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${item.color}/20`}>
              <span className={item.color.replace('bg-', 'text-')}>
                {getCategoryIcon(item.category)}
              </span>
            </div>

            {/* 分类和金额 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/80">
                  {item.category}
                </span>
                <span className="text-xs font-semibold text-white">
                  ${item.amount}M
                </span>
              </div>

              {/* 进度条 */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 总预算 */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">
            Total Budget
          </span>
          <span className="text-base font-bold text-white">
            ${totalBudget}M
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

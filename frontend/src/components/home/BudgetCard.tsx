// Budget 预算卡片组件 - 玻璃拟态风格
import React from 'react';
import GlassCard from './GlassCard';
import { Car, Building2, Utensils, ShoppingBag, Ticket } from 'lucide-react';

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
  title = '行程预算',
  budgetItems,
  totalBudget = 0,
  className = ''
}: BudgetCardProps) {
  // 如果没有传入预算数据，显示空状态
  const hasBudget = totalBudget > 0;

  // 默认预算项（当没有数据时显示）
  const defaultBudgetItems: BudgetItem[] = [
    { category: '交通', amount: 0, percentage: 0, color: 'bg-red-500' },
    { category: '住宿', amount: 0, percentage: 0, color: 'bg-yellow-500' },
    { category: '餐饮', amount: 0, percentage: 0, color: 'bg-blue-500' },
    { category: '门票', amount: 0, percentage: 0, color: 'bg-green-500' },
  ];

  const displayItems = budgetItems || defaultBudgetItems;

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '交通':
      case 'Transportation':
        return <Car className="h-4 w-4" />;
      case '住宿':
      case 'Hotels':
        return <Building2 className="h-4 w-4" />;
      case '餐饮':
      case 'Food & Drinks':
      case 'Food':
        return <Utensils className="h-4 w-4" />;
      case '门票':
      case 'Tickets':
        return <Ticket className="h-4 w-4" />;
      case '购物':
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
        {displayItems.map((item, index) => (
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
                  ¥{item.amount.toFixed(0)}
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
            总预算
          </span>
          <span className="text-base font-bold text-white">
            ¥{totalBudget.toFixed(0)}
          </span>
        </div>
      </div>

      {/* 空状态提示 */}
      {!hasBudget && (
        <div className="mt-2 text-center">
          <p className="text-xs text-white/40">
            暂无预算数据
          </p>
        </div>
      )}
    </GlassCard>
  );
}

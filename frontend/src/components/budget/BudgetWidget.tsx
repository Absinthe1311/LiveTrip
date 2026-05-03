// AI辅助生成：GLM-5, 2026-04-24 21:31
// 描述：统一的预算管理组件，用于Today和MyTrips页面，显示预算状态并提供记账和调整预算功能

import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Settings } from 'lucide-react';
import { getBudgetStatus } from '../../api/client';

interface BudgetWidgetProps {
  tripId: string;
  totalBudget: number;
  budget?: {
    transportation: number;
    accommodation: number;
    food: number;
    tickets: number;
    shopping: number;
    other: number;
  } | null;
  onRecordExpense?: () => void;
  onAdjustBudget?: () => void;
  compact?: boolean; // 紧凑模式（用于MyTrips页面）
}

export default function BudgetWidget({
  tripId,
  totalBudget,
  budget,
  onRecordExpense,
  onAdjustBudget,
  compact = false,
}: BudgetWidgetProps) {
  const [usageRate, setUsageRate] = useState(0);

  useEffect(() => {
    // 计算使用率
    if (budget) {
      const spent =
        budget.transportation +
        budget.accommodation +
        budget.food +
        budget.tickets +
        budget.shopping +
        budget.other;
      const rate = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
      setUsageRate(rate);
    } else {
      setUsageRate(0);
    }
  }, [budget, totalBudget]);

  // 计算已花费和剩余
  const spent = budget
    ? budget.transportation +
      budget.accommodation +
      budget.food +
      budget.tickets +
      budget.shopping +
      budget.other
    : 0;
  const remaining = totalBudget - spent;

  // 获取预算状态
  const getBudgetStatus = () => {
    if (usageRate > 100) return { color: 'text-red-400', bgColor: 'bg-red-500', text: '超支' };
    if (usageRate > 95) return { color: 'text-orange-400', bgColor: 'bg-orange-500', text: '紧张' };
    if (usageRate > 80) return { color: 'text-yellow-400', bgColor: 'bg-yellow-500', text: '适中' };
    return { color: 'text-green-400', bgColor: 'bg-green-500', text: '充足' };
  };

  const status = getBudgetStatus();

  if (compact) {
    // 紧凑模式（用于MyTrips页面）
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-3 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-white/80">预算</span>
          </div>
          <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-white/60">总预算</span>
            <span className="text-white font-medium">¥{totalBudget.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/60">已花费</span>
            <span className="text-amber-400 font-medium">¥{spent.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/60">剩余</span>
            <span className={`${remaining >= 0 ? 'text-green-400' : 'text-red-400'} font-medium`}>
              ¥{remaining.toFixed(0)}
            </span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${status.bgColor} transition-all duration-300`}
            style={{ width: `${Math.min(usageRate, 100)}%` }}
          />
        </div>

        {/* 操作按钮 */}
        {onRecordExpense && onAdjustBudget && (
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={onRecordExpense}
              className="flex-1 text-xs py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition"
            >
              记账
            </button>
            <button
              onClick={onAdjustBudget}
              className="flex-1 text-xs py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition"
            >
              调整
            </button>
          </div>
        )}
      </div>
    );
  }

  // 完整模式（用于Today页面）
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-semibold text-white">预算管理</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">总预算</span>
          <span className="text-sm font-semibold text-white">¥{totalBudget.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">已花费</span>
          <span className="text-sm font-semibold text-amber-400">¥{spent.toFixed(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">剩余预算</span>
          <span
            className={`text-sm font-semibold ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            ¥{remaining.toFixed(0)}
          </span>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full ${status.bgColor} transition-all duration-300`}
            style={{ width: `${Math.min(usageRate, 100)}%` }}
          />
        </div>

        {/* 使用率 */}
        <div className="text-xs text-white/40 text-center">使用率 {usageRate.toFixed(1)}%</div>
      </div>

      {/* 操作按钮 */}
      {onRecordExpense && onAdjustBudget && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onRecordExpense}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            记账
          </button>
          <button
            onClick={onAdjustBudget}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition text-sm font-medium"
          >
            <Settings className="h-4 w-4" />
            调整
          </button>
        </div>
      )}
    </div>
  );
}

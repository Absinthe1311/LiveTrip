// 日程导航面板组件 - 左栏
import React from 'react';
import { Wallet } from 'lucide-react';

interface DayNavItem {
  dayNumber: number;
  date: string;
  attractionCount: number;
}

interface DayNavigationPanelProps {
  days: DayNavItem[];
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
  totalBudget: number;
  usedBudget: number;
}

export default function DayNavigationPanel({
  days,
  selectedDayIndex,
  onDaySelect,
  totalBudget,
  usedBudget
}: DayNavigationPanelProps) {
  const usedPercentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

  return (
    <div className="w-48 flex-shrink-0">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sticky top-4">
        {/* 标题 */}
        <h3 className="text-xs text-white/60 mb-3 font-medium">行程概览</h3>

        {/* 日期导航列表 */}
        <div className="space-y-2 mb-4">
          {days.map((day, index) => (
            <button
              key={day.dayNumber}
              onClick={() => onDaySelect(index)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                selectedDayIndex === index
                  ? 'bg-amber-500/10 border-l-2 border-amber-400'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">第{day.dayNumber}天</span>
              </div>
              <div className="text-xs text-white/50">{day.date}</div>
              <div className="text-xs text-white/50 mt-1">{day.attractionCount}个景点</div>
            </button>
          ))}
        </div>

        {/* 预算进度摘要 */}
        <div className="pt-3 border-t border-white/10">
          <div className="text-xs text-white/60 mb-2">总预算</div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-sm text-white font-semibold">¥{usedBudget.toLocaleString()}</span>
            <span className="text-xs text-white/40">/ ¥{totalBudget.toLocaleString()}</span>
          </div>
          {/* 进度条 */}
          <div className="h-1 bg-white/20 rounded overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded transition-all duration-500"
              style={{ width: `${Math.min(usedPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

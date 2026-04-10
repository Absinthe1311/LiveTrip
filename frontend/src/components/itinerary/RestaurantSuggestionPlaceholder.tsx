// 餐厅建议占位符组件 - 显示在景点之间
import React from 'react';
import { UtensilsCrossed, Plus } from 'lucide-react';

interface RestaurantSuggestionPlaceholderProps {
  time: string;
  onClick?: () => void;
}

export default function RestaurantSuggestionPlaceholder({
  time,
  onClick
}: RestaurantSuggestionPlaceholderProps) {
  return (
    <div className="relative py-4">
      {/* 虚线连接 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-green-400/30" />
      
      {/* 餐厅建议卡片 */}
      <button
        onClick={onClick}
        className="relative w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-md border-2 border-dashed border-amber-400/40 rounded-xl p-4 hover:border-amber-400/60 hover:bg-amber-500/15 transition-all duration-300 group"
      >
        <div className="flex items-center justify-center gap-3">
          <UtensilsCrossed className="w-5 h-5 text-amber-400" />
          <div className="text-center">
            <div className="text-sm font-semibold text-white/80 group-hover:text-white">
              午餐建议
            </div>
            <div className="text-xs text-white/50 mt-0.5">
              {time} · 点击查看周边餐厅
            </div>
          </div>
          <Plus className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
    </div>
  );
}

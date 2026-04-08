// Total Travel 卡片组件 - 单独显示旅行统计
import React from 'react';
import GlassCard from './GlassCard';
import { Globe, MapPin, ArrowRight } from 'lucide-react';

interface TotalTravelCardProps {
  totalCountries?: number;
  totalCities?: number;
  onTravelClick?: () => void;
  className?: string;
}

export default function TotalTravelCard({
  totalCountries = 9,
  totalCities = 28,
  onTravelClick,
  className = ''
}: TotalTravelCardProps) {
  return (
    <GlassCard className={`p-5 ${className}`} onClick={onTravelClick}>
      {/* 标题 */}
      <h3 className="text-sm font-bold text-white mb-4">
        Total Travel
      </h3>

      {/* 统计数据 */}
      <div className="space-y-3">
        {/* 国家数 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-white/70">
              国家
            </span>
          </div>
          <span className="text-lg font-bold text-white">
            {totalCountries}
          </span>
        </div>

        {/* 城市数 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-400" />
            <span className="text-xs text-white/70">
              城市
            </span>
          </div>
          <span className="text-lg font-bold text-white">
            {totalCities}
          </span>
        </div>
      </div>

      {/* 查看全部按钮 */}
      <button className="mt-4 flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors group">
        <span>查看全部</span>
        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
      </button>
    </GlassCard>
  );
}

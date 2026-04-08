// Flight + Total Travel 组合组件 - 上下堆叠，高度与 Budget 卡片一致
import React from 'react';
import GlassCard from './GlassCard';
import { Plane, Globe, MapPin, ArrowRight } from 'lucide-react';

interface FlightAndTravelProps {
  nextFlightDestination?: string;
  nextFlightCountdown?: string;
  nextFlightDate?: string;
  totalCountries?: number;
  totalCities?: number;
  onFlightClick?: () => void;
  onTravelClick?: () => void;
  className?: string;
}

export default function FlightAndTravel({
  nextFlightDestination = 'New York',
  nextFlightCountdown = '1D 2hr 56m',
  nextFlightDate = '20 Aug 2024',
  totalCountries = 9,
  totalCities = 28,
  onFlightClick,
  onTravelClick,
  className = ''
}: FlightAndTravelProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Next Flight 卡片 */}
      <GlassCard
        className="flex-1 p-5"
        onClick={onFlightClick}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-white/70">
              Next Flight
            </span>
          </div>
          <span className="text-xs text-white/60">
            {nextFlightDate}
          </span>
        </div>

        {/* 目的地和倒计时 */}
        <div className="mb-2">
          <h3 className="text-lg font-bold text-white mb-1">
            {nextFlightDestination}
          </h3>
          <span className="text-2xl font-bold text-red-400">
            {nextFlightCountdown}
          </span>
        </div>

        {/* 查看详情按钮 */}
        <button className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors group">
          <span>查看详情</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </GlassCard>

      {/* Total Travel 卡片 */}
      <GlassCard
        className="flex-1 p-5"
        onClick={onTravelClick}
      >
        {/* 标题 */}
        <h3 className="text-sm font-bold text-white mb-3">
          Total Travel
        </h3>

        {/* 统计数据 */}
        <div className="space-y-2">
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
        <button className="mt-3 flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors group">
          <span>查看全部</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </GlassCard>
    </div>
  );
}

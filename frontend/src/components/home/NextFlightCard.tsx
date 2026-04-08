// Next Flight 倒计时卡片组件 - 玻璃拟态风格
import React from 'react';
import GlassCard from './GlassCard';
import { Plane, ArrowRight } from 'lucide-react';

interface NextFlightCardProps {
  destination?: string;
  countdown?: string;
  date?: string;
  time?: string;
  onClick?: () => void;
  className?: string;
}

export default function NextFlightCard({
  destination = 'New York',
  countdown = '1D 2hr 56m',
  date = '20 Aug 2024',
  time = '14:30',
  onClick,
  className = ''
}: NextFlightCardProps) {
  return (
    <GlassCard
      className={`p-6 ${className}`}
      onClick={onClick}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-red-400" />
          <span className="text-sm font-medium text-white/80">
            Next Flight
          </span>
        </div>
        <span className="text-xs text-white/60">
          {date}
        </span>
      </div>

      {/* 目的地 */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-white mb-1">
          {destination}
        </h3>
        <p className="text-sm text-white/60">
          {time}
        </p>
      </div>

      {/* 倒计时 */}
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-red-400">
          {countdown}
        </span>
      </div>

      {/* 查看详情按钮 */}
      <button className="mt-4 flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors group">
        <span>查看详情</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </GlassCard>
  );
}

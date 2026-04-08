// 统计指标组件 - 玻璃拟态风格的统计数据展示
import React from 'react';
import GlassCard from './GlassCard';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatIndicatorProps {
  label: string;
  value: number;
  change?: string;
  trend?: 'up' | 'down' | null;
  className?: string;
}

export default function StatIndicator({
  label,
  value,
  change,
  trend,
  className = ''
}: StatIndicatorProps) {
  return (
    <GlassCard className={`p-6 ${className}`}>
      <p className="text-sm text-white/80 font-medium mb-2">{label}</p>
      <p className="text-4xl font-bold text-white mb-3">{value}</p>
      {change && trend && (
        <p className="text-sm flex items-center gap-1.5">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span className={trend === 'up' ? 'text-green-400' : 'text-red-400'}>
            {change}
          </span>
        </p>
      )}
    </GlassCard>
  );
}

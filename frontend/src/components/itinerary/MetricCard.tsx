// Metric摘要卡片组件 - 用于顶部信息展示
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  iconColor?: string;
}

export default function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor = 'text-amber-400'
}: MetricCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/60 mb-1">{label}</p>
          <p className="text-xl font-bold text-white truncate">{value}</p>
          {subValue && (
            <p className="text-sm text-white/60 mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

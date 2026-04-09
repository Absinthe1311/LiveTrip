// 行程时间线组件 - 用于展示每日行程
import React from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';

interface AttractionItem {
  name: string;
  time: string;
  description?: string;
  category?: string;
  location?: string;
  estimated_cost?: number;
}

interface TimelineDayProps {
  dayNumber: number;
  date: string;
  attractions: AttractionItem[];
  onAttractionClick?: (index: number) => void;
}

export default function TimelineDay({
  dayNumber,
  date,
  attractions,
  onAttractionClick
}: TimelineDayProps) {
  return (
    <div className="relative">
      {/* 时间线竖线 */}
      <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-amber-400/50 to-amber-400/10" />

      {/* Day标题节点 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
          <span className="text-white font-bold text-sm">{dayNumber}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-amber-400">Day {dayNumber}</h3>
          <p className="text-sm text-white/60">{date}</p>
        </div>
      </div>

      {/* 景点列表 */}
      <div className="space-y-4 ml-14">
        {attractions.map((attraction, index) => (
          <div key={index} className="relative">
            {/* 连接线节点 */}
            <div className="absolute -left-[56px] top-6 w-3 h-3 rounded-full bg-amber-400/30 border-2 border-amber-400" />

            {/* 景点卡片 */}
            <div
              onClick={() => onAttractionClick?.(index)}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 景点名称 */}
                  <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {attraction.name}
                  </h4>

                  {/* 时间 */}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-white/60">{attraction.time}</span>
                  </div>

                  {/* 描述 */}
                  {attraction.description && (
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {attraction.description}
                    </p>
                  )}

                  {/* 标签组 */}
                  <div className="flex flex-wrap gap-2">
                    {attraction.category && (
                      <span className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/80">
                        {attraction.category}
                      </span>
                    )}
                    {attraction.estimated_cost && attraction.estimated_cost > 0 && (
                      <span className="bg-amber-500/20 rounded-full px-3 py-1 text-xs text-amber-400">
                        ¥{attraction.estimated_cost}
                      </span>
                    )}
                  </div>
                </div>

                {/* 查看详情按钮 */}
                <button className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

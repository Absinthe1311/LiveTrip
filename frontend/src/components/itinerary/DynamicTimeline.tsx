// 动态对齐时间轴组件 - 使用ResizeObserver实现高度动态匹配
import React, { useEffect, useRef, useState } from 'react';

interface DynamicTimelineProps {
  itemCount: number;
  currentIndex?: number;
  cardHeights?: number[];
  timeSlots?: string[];
}

export default function DynamicTimeline({
  itemCount,
  currentIndex = 0,
  cardHeights = [],
  timeSlots = []
}: DynamicTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [segmentHeights, setSegmentHeights] = useState<number[]>([]);

  useEffect(() => {
    // 根据右侧卡片高度计算时间轴段落高度
    if (cardHeights.length > 0) {
      setSegmentHeights(cardHeights);
    } else {
      // 默认高度
      setSegmentHeights(Array(itemCount).fill(200));
    }
  }, [cardHeights, itemCount]);

  return (
    <div ref={containerRef} className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
      {/* 标题 */}
      <div className="text-center mb-4">
        <div className="text-sm font-semibold text-white/60 mb-1">时间轴</div>
        <div className="text-xs text-white/40">{itemCount}个活动</div>
      </div>

      {/* 时间段列表 */}
      <div className="space-y-0">
        {Array.from({ length: itemCount }, (_, index) => {
          const isActive = index === currentIndex;
          const segmentHeight = segmentHeights[index] || 200;
          const time = timeSlots[index] || `${9 + index * 2}:00-${11 + index * 2}:00`;
          const [startTime, endTime] = time.split('-');
          
          return (
            <div key={index} className="flex items-start gap-3">
              {/* 左侧：时间节点和连接线 */}
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: '60px' }}>
                {/* 时间节点 */}
                <div 
                  className={`rounded-full z-10 transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? 'w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-400/40 shadow-lg shadow-green-500/50'
                      : 'w-3 h-3 bg-gradient-to-br from-green-400 to-green-600'
                  }`}
                />
                
                {/* 连接线 - 动态高度 */}
                {index < itemCount - 1 && (
                  <div 
                    className="w-0.5 bg-gradient-to-b from-green-400/60 to-green-600/60 flex-shrink-0"
                    style={{ height: `${segmentHeight - 20}px`, marginTop: '8px', marginBottom: '8px' }}
                  />
                )}
              </div>

              {/* 右侧：时间框 */}
              <div 
                className={`bg-white/60 backdrop-blur-xl rounded-xl p-3 border transition-all duration-300 cursor-pointer flex-shrink-0 ${
                  isActive 
                    ? 'border-green-400/50 shadow-lg scale-105' 
                    : 'border-white/30 hover:border-white/50'
                }`}
                style={{ width: 'calc(100% - 70px)' }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="text-sm font-bold text-white">
                    {startTime}
                  </div>
                  <div className="w-0.5 h-2 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                  <div className="text-sm font-bold text-white">
                    {endTime}
                  </div>
                </div>
                
                {/* 活动序号 */}
                <div className="mt-2 text-center">
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-green-400' : 'text-white/50'
                  }`}>
                    活动 {index + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

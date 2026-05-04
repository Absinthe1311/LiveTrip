// 改进的动态时间轴组件 - 时间段横向显示，与景点卡片对齐
import React, { useEffect, useRef, useState } from 'react';

interface ImprovedTimelineProps {
  timeSlots: string[];
  currentIndex?: number;
  cardHeights?: number[];
}

export default function ImprovedTimeline({
  timeSlots,
  currentIndex = 0,
  cardHeights = [],
}: ImprovedTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算每个时间节点应该延伸的高度
  // 连接线应该从当前时间节点延伸到下一个时间节点的位置
  const calculateSegmentHeight = (index: number) => {
    if (index >= timeSlots.length - 1) return 0; // 最后一个节点没有连接线

    // 连接线高度 = 卡片高度 + 卡片间距（space-y-6 = 24px）
    const cardHeight = cardHeights[index] || 200;
    const cardSpacing = 24; // space-y-6 = 1.5rem = 24px

    return cardHeight + cardSpacing;
  };

  return (
    <div ref={containerRef} className="flex flex-col">
      {/* 时间段列表 */}
      {timeSlots.map((time, index) => {
        const isActive = index === currentIndex;
        const isLast = index === timeSlots.length - 1;
        const segmentHeight = calculateSegmentHeight(index);

        return (
          <div key={index} className="flex items-start gap-4">
            {/* 左侧：时间节点和连接线 */}
            <div className="flex flex-col items-center flex-shrink-0 w-24">
              {/* 时间节点 - 垂直居中对齐 */}
              <div
                className={`rounded-full z-10 transition-all duration-300 flex-shrink-0 ${
                  isActive
                    ? 'w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-400/40 shadow-lg shadow-green-500/50'
                    : 'w-4 h-4 bg-gradient-to-br from-green-400 to-green-600'
                }`}
              />

              {/* 连接线 - 延伸到下一个时间节点 */}
              {!isLast && (
                <div
                  className="w-0.5 bg-gradient-to-b from-green-400/60 to-green-600/60 flex-shrink-0"
                  style={{
                    height: `${segmentHeight}px`,
                    marginTop: '12px',
                    marginBottom: '12px',
                  }}
                />
              )}
            </div>

            {/* 右侧：横向时间框 */}
            <div
              className={`bg-white/60 backdrop-blur-xl rounded-xl px-5 py-2.5 border transition-all duration-300 cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'border-green-400/50 shadow-lg scale-105'
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              <div className="text-base font-bold text-white whitespace-nowrap">{time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

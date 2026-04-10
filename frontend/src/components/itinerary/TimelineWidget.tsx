// 整体时间轴组件 - 显示一天的所有时间段
import React from 'react';

interface TimelineWidgetProps {
  timeSlots: string[];
  onTimeChange?: (index: number, newTime: string) => void;
  currentIndex?: number;
}

export default function TimelineWidget({
  timeSlots,
  onTimeChange,
  currentIndex = -1
}: TimelineWidgetProps) {
  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
      {/* 标题 */}
      <div className="text-center mb-4">
        <div className="text-sm font-semibold text-white/60 mb-1">时间轴</div>
        <div className="text-xs text-white/40">{timeSlots.length}个活动</div>
      </div>

      {/* 时间段列表 */}
      <div className="space-y-6">
        {timeSlots.map((time, index) => {
          const [startTime, endTime] = time.split('-');
          const isActive = index === currentIndex;
          
          return (
            <div 
              key={index}
              className={`flex flex-col items-center transition-all duration-300 ${
                isActive ? 'scale-110' : ''
              }`}
            >
              {/* 时间节点 */}
              <div 
                className={`rounded-full z-10 transition-all duration-300 ${
                  isActive
                    ? 'w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 ring-4 ring-green-400/40 shadow-lg shadow-green-500/50'
                    : 'w-2 h-2 bg-gradient-to-br from-green-400 to-green-600'
                }`}
              />
              
              {/* 时间框 */}
              <div 
                className={`mt-2 bg-white/60 backdrop-blur-xl rounded-xl p-3 border transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'border-green-400/50 shadow-lg scale-105' 
                    : 'border-white/30 hover:border-white/50'
                }`}
                title="点击编辑时间"
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

              {/* 连接线 */}
              {index < timeSlots.length - 1 && (
                <div className="w-0.5 h-4 bg-gradient-to-b from-green-400/40 to-green-600/40 mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

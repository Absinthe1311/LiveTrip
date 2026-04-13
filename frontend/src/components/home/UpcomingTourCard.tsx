// Upcoming Tour 组件 - 玻璃拟态风格
import React from 'react';
import GlassCard from './GlassCard';
import { Sun, Cloud, CloudRain } from 'lucide-react';

interface Tour {
  id: string;
  city: string;
  country: string;
  flag: string;
  date: string;
  temperature: number;
  condition: string;
  coverImage?: string; // 城市图片
  onClick?: () => void;
}

interface UpcomingTourCardProps {
  tours?: Tour[];
  title?: string;
  className?: string;
}

export default function UpcomingTourCard({
  tours = [],
  title = '即将出行',
  className = ''
}: UpcomingTourCardProps) {
  // 获取天气图标
  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes('rain') || condition.includes('雨')) {
      return <CloudRain className="h-5 w-5 text-blue-400" />;
    } else if (condition.toLowerCase().includes('cloud') || condition.includes('云')) {
      return <Cloud className="h-5 w-5 text-gray-400" />;
    } else {
      return <Sun className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <GlassCard className={`p-6 flex-1 ${className}`}>
      {/* 标题 */}
      <h3 className="text-lg font-bold text-white mb-4">
        {title}
      </h3>

      {/* 行程列表 */}
      <div className="space-y-3 flex-1">
        {tours.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40">暂无即将出行的行程</p>
          </div>
        ) : (
          tours.map((tour) => (
            <div
              key={tour.id}
              onClick={tour.onClick}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
            >
              {/* 左侧：城市图片（圆形） */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 flex-shrink-0">
                {tour.coverImage ? (
                  <img
                    src={tour.coverImage}
                    alt={tour.city}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg font-semibold">
                    {tour.city[0]}
                  </div>
                )}
              </div>

              {/* 中间：城市名称和日期 */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-white group-hover:text-white/90 transition-colors truncate">
                  {tour.city}
                </h4>
                <p className="text-sm text-white/60 truncate">
                  {tour.date}
                </p>
              </div>

              {/* 右侧：天气图标 */}
              <div className="flex-shrink-0">
                {getWeatherIcon(tour.condition)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 查看全部按钮 */}
      {tours.length > 0 && (
        <button className="mt-4 w-full text-sm text-white/80 hover:text-white transition-colors">
          查看全部行程
        </button>
      )}
    </GlassCard>
  );
}

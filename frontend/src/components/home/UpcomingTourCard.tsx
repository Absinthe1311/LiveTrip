// Upcoming Tour 组件 - 玻璃拟态风格
import React from 'react';
import GlassCard from './GlassCard';
import { Cloud, Calendar } from 'lucide-react';

interface Tour {
  id: string;
  city: string;
  country: string;
  flag: string;
  date: string;
  temperature: number;
  condition: string;
  onClick?: () => void;
}

interface UpcomingTourCardProps {
  tours?: Tour[];
  title?: string;
  className?: string;
}

export default function UpcomingTourCard({
  tours = [
    {
      id: '1',
      city: 'New Delhi',
      country: 'India',
      flag: '🇮🇳',
      date: '20 Aug 2024',
      temperature: 29,
      condition: 'Cloudy',
    },
    {
      id: '2',
      city: 'New York',
      country: 'USA',
      flag: '🇺🇸',
      date: '1 Sep 2024',
      temperature: 29,
      condition: 'Cloudy',
    },
  ],
  title = '即将出行',
  className = ''
}: UpcomingTourCardProps) {
  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* 标题 */}
      <h3 className="text-lg font-bold text-white mb-4">
        {title}
      </h3>

      {/* 行程列表 */}
      <div className="space-y-3">
        {tours.map((tour) => (
          <div
            key={tour.id}
            onClick={tour.onClick}
            className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
          >
            {/* 城市和国家 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">
                {tour.flag}
              </span>
              <div>
                <h4 className="text-base font-semibold text-white group-hover:text-white/90 transition-colors">
                  {tour.city}
                </h4>
                <p className="text-sm text-white/60">
                  {tour.country}
                </p>
              </div>
            </div>

            {/* 日期和天气 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar className="h-4 w-4" />
                <span>{tour.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  {tour.temperature}°C
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 查看全部按钮 */}
      <button className="mt-4 w-full text-sm text-white/80 hover:text-white transition-colors">
        查看全部行程
      </button>
    </GlassCard>
  );
}

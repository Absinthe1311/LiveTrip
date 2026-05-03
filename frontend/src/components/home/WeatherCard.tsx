// Weather 天气卡片组件 - 玻璃拟态风格
import React, { useState } from 'react';
import GlassCard from './GlassCard';
import {
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  Sun,
  Cloud,
  CloudRain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface WeatherCardProps {
  city?: string;
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  className?: string;
  onCityChange?: (city: string) => void;
  destinationCities?: string[]; // 用户的目的地城市列表
}

export default function WeatherCard({
  city = '北京',
  temperature = 24,
  condition = '晴',
  humidity = 78,
  windSpeed = 12,
  pressure = 1013,
  className = '',
  onCityChange,
  destinationCities = [],
}: WeatherCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 获取天气图标
  const getWeatherIcon = () => {
    if (condition.toLowerCase().includes('rain') || condition.includes('雨')) {
      return <CloudRain className="h-12 w-12 text-blue-400" />;
    } else if (condition.toLowerCase().includes('cloud') || condition.includes('云')) {
      return <Cloud className="h-12 w-12 text-gray-400" />;
    } else {
      return <Sun className="h-12 w-12 text-yellow-400" />;
    }
  };

  // 切换到上一个城市
  const handlePrevCity = () => {
    if (destinationCities.length > 1 && onCityChange) {
      const newIndex = currentIndex === 0 ? destinationCities.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
      onCityChange(destinationCities[newIndex]);
    }
  };

  // 切换到下一个城市
  const handleNextCity = () => {
    if (destinationCities.length > 1 && onCityChange) {
      const newIndex = currentIndex === destinationCities.length - 1 ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
      onCityChange(destinationCities[newIndex]);
    }
  };

  // 初始化当前城市索引
  React.useEffect(() => {
    if (destinationCities.length > 0 && city) {
      const index = destinationCities.indexOf(city);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [city, destinationCities]);

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* 标题和图标 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {/* 左切换按钮 */}
            {destinationCities.length > 1 && (
              <button
                onClick={handlePrevCity}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-white/60" />
              </button>
            )}

            <h3 className="text-lg font-bold text-white">{city}</h3>

            {/* 右切换按钮 */}
            {destinationCities.length > 1 && (
              <button
                onClick={handleNextCity}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-white/60" />
              </button>
            )}
          </div>
          <p className="text-sm text-white/60">
            Weather{' '}
            {destinationCities.length > 1 && `(${currentIndex + 1}/${destinationCities.length})`}
          </p>
        </div>
        {getWeatherIcon()}
      </div>

      {/* 温度和天气状况 */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">{temperature}°C</span>
        </div>
        <p className="text-sm text-white/60 mt-1">{condition}</p>
      </div>

      {/* 天气详情 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 湿度 */}
        <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg">
          <Droplets className="h-5 w-5 text-blue-400 mb-1" />
          <span className="text-lg font-semibold text-white">{humidity}%</span>
          <span className="text-xs text-white/60">湿度</span>
        </div>

        {/* 风速 */}
        <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg">
          <Wind className="h-5 w-5 text-green-400 mb-1" />
          <span className="text-lg font-semibold text-white">{windSpeed}</span>
          <span className="text-xs text-white/60">km/h</span>
        </div>

        {/* 气压 */}
        <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg">
          <Gauge className="h-5 w-5 text-purple-400 mb-1" />
          <span className="text-lg font-semibold text-white">{pressure}</span>
          <span className="text-xs text-white/60">hPa</span>
        </div>
      </div>
    </GlassCard>
  );
}

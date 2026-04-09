// IoT 数据卡片组件 - 显示实时天气和人流量信息
import React from 'react';
import { Thermometer, Droplets, Users, Clock, Cloud, Sun, CloudRain, Snowflake, Wind } from 'lucide-react';

interface IoTDataCardProps {
  temperature: number;
  humidity?: number;
  crowdLevel: number;
  rainProbability: number;
  weatherDescription?: string;
  weatherIcon?: string;
  isOpen: boolean;
  waitTime?: number;
  compact?: boolean;
}

export default function IoTDataCard({
  temperature,
  humidity,
  crowdLevel,
  rainProbability,
  weatherDescription,
  weatherIcon,
  isOpen,
  waitTime,
  compact = false,
}: IoTDataCardProps) {
  // 获取天气图标
  const getWeatherIcon = () => {
    if (weatherDescription) {
      if (weatherDescription.includes('雨')) return <CloudRain className="h-4 w-4" />;
      if (weatherDescription.includes('云') || weatherDescription.includes('阴')) return <Cloud className="h-4 w-4" />;
      if (weatherDescription.includes('雪')) return <Snowflake className="h-4 w-4" />;
    }
    return <Sun className="h-4 w-4" />;
  };

  // 获取拥挤度状态
  const getCrowdStatus = () => {
    if (crowdLevel > 80) return { label: '极度拥挤', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' };
    if (crowdLevel > 60) return { label: '人流较多', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' };
    if (crowdLevel > 40) return { label: '人流适中', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    return { label: '人流较少', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
  };

  // 获取天气状态
  const getWeatherStatus = () => {
    if (rainProbability > 80) return { label: '暴雨', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' };
    if (rainProbability > 50) return { label: '中雨', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' };
    if (rainProbability > 20) return { label: '小雨', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
    return { label: '晴朗', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' };
  };

  const crowdStatus = getCrowdStatus();
  const weatherStatus = getWeatherStatus();

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
        {/* 天气信息 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            {getWeatherIcon()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{temperature}°C</span>
            {humidity && <span className="text-xs text-gray-600">💧{humidity}%</span>}
          </div>
        </div>

        {/* 拥挤度 */}
        <div className="flex items-center gap-2">
          <Users className={`h-4 w-4 ${crowdStatus.textColor}`} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${crowdStatus.bgColor} ${crowdStatus.textColor}`}>
            {crowdLevel}%
          </span>
        </div>

        {/* 开放状态 */}
        {!isOpen && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            已关闭
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50 rounded-lg border border-blue-200 p-4 shadow-sm">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Wind className="h-4 w-4 text-blue-600" />
          实时环境数据
        </h4>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          实时更新
        </span>
      </div>

      {/* 天气信息 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-medium">天气状况</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${weatherStatus.bgColor} ${weatherStatus.textColor}`}>
            {weatherStatus.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* 温度 */}
          <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
              <Thermometer className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">{temperature}°C</span>
              <p className="text-xs text-gray-600">温度</p>
            </div>
          </div>

          {/* 湿度 */}
          {humidity && (
            <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">{humidity}%</span>
                <p className="text-xs text-gray-600">湿度</p>
              </div>
            </div>
          )}
        </div>

        {/* 天气描述 */}
        {weatherDescription && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-700 bg-white/50 rounded-lg p-2">
            {getWeatherIcon()}
            <span>{weatherDescription}</span>
          </div>
        )}

        {/* 降雨概率 */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>降雨概率</span>
            <span className="font-semibold">{rainProbability}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${rainProbability > 80 ? 'bg-red-500' : rainProbability > 50 ? 'bg-orange-500' : rainProbability > 20 ? 'bg-yellow-500' : 'bg-green-500'} transition-all duration-300`}
              style={{ width: `${rainProbability}%` }}
            />
          </div>
        </div>
      </div>

      {/* 人流信息 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-medium">人流状态</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${crowdStatus.bgColor} ${crowdStatus.textColor}`}>
            {crowdStatus.label}
          </span>
        </div>

        {/* 拥挤度进度条 */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>拥挤度</span>
            </div>
            <span className="font-semibold">{crowdLevel}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${crowdStatus.color} transition-all duration-300`}
              style={{ width: `${crowdLevel}%` }}
            />
          </div>
        </div>

        {/* 等待时间 */}
        {waitTime && waitTime > 0 && (
          <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">
              预计等待时间：<span className="font-semibold text-purple-700">{waitTime} 分钟</span>
            </span>
          </div>
        )}

        {/* 开放状态 */}
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`text-xs font-medium ${isOpen ? 'text-green-700' : 'text-red-700'}`}>
            {isOpen ? '正常开放' : '已关闭'}
          </span>
        </div>
      </div>
    </div>
  );
}

// 详细备选景点组件 - 展示更详细的备选景点信息，样式与TwoStageAttractionCard一致
import React, { useState, useEffect } from 'react';
import { 
  Star, X, MapPin, Wallet, Clock, Image as ImageIcon,
  Users, Cloud, CloudRain, Sun, Thermometer, Droplets
} from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface DetailedAlternativeAttractionsProps {
  alternatives: any[];
  onClose: () => void;
  onReplace: (attraction: any) => void;
  city?: string;
  dayIndex?: number;
  attractionIndex?: number;
}

// 根据天气图标获取天气组件
const getWeatherIcon = (icon?: string) => {
  if (!icon) return Cloud;
  if (icon.includes('rain') || icon.includes('shower')) return CloudRain;
  if (icon.includes('sun') || icon.includes('clear')) return Sun;
  return Cloud;
};

export default function DetailedAlternativeAttractions({
  alternatives,
  onClose,
  onReplace,
  city,
  dayIndex,
  attractionIndex
}: DetailedAlternativeAttractionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // 加载备选景点图片
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      for (const alt of alternatives) {
        try {
          const response = await getSpotCoverImage(alt.name, city);
          if (response.success && response.data?.imageUrl) {
            urls[alt.id] = response.data.imageUrl;
          }
        } catch (error) {
          console.error(`加载备选景点图片失败 (${alt.name}):`, error);
        }
      }
      setImageUrls(urls);
    };

    if (alternatives.length > 0) {
      loadImages();
    }
  }, [alternatives, city]);

  // 获取拥挤度颜色
  const getCrowdColor = (level: number) => {
    if (level <= 30) return 'text-green-400';
    if (level <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 获取拥挤度文字
  const getCrowdText = (level: number) => {
    if (level <= 30) return '较少';
    if (level <= 60) return '适中';
    return '拥挤';
  };

  const handleReplace = async (attraction: any) => {
    setLoadingId(attraction.id);
    try {
      console.log('🔄 开始替换景点:', attraction.name);
      // 传递完整参数，包括dayIndex和attractionIndex
      onReplace({
        dayIndex,
        attractionIndex,
        originalItem: null, // 这个会在父组件中处理
        newItem: attraction,
        skipConfirm: false
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 border-l-2 border-amber-400/40 ml-6 mt-3 transition-all duration-300">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">备选景点</span>
          <span className="text-xs text-white/40">({alternatives.length}个)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* 备选卡片网格 - 2列布局 */}
      <div className="grid grid-cols-2 gap-4">
        {alternatives.map((attraction) => {
          const iotData = attraction.iotData;
          const WeatherIcon = getWeatherIcon(iotData?.weatherIcon);

          return (
            <div
              key={attraction.id}
              className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden hover:bg-white/70 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {/* 景点信息 */}
              <div className="p-4">
                <div className="flex gap-4">
                  {/* 左侧：精美小图 */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-green-500/20 to-green-600/20 shadow-md">
                    {imageUrls[attraction.id] ? (
                      <img
                        src={imageUrls[attraction.id]}
                        alt={attraction.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* 右侧：核心信息 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="text-lg font-bold text-white drop-shadow-md truncate">
                        {attraction.name}
                      </h5>
                      <div className="flex items-center gap-1.5 text-sm text-white/80 flex-shrink-0">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="font-semibold">
                          {attraction.time || '待定'}
                        </span>
                      </div>
                    </div>

                    {/* 一句话简介 */}
                    <p className="text-sm text-white/70 line-clamp-2 mb-3 drop-shadow-sm">
                      {attraction.description || `${attraction.name}是一处值得探访的景点，为您提供独特的游览体验。`}
                    </p>

                    {/* 标签行 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {attraction.type && (
                        <span className="bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full text-xs font-medium">
                          {attraction.type}
                        </span>
                      )}
                      {attraction.estimated_cost && attraction.estimated_cost > 0 ? (
                        <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Wallet className="w-3 h-3" />
                          ¥{attraction.estimated_cost}
                        </span>
                      ) : (
                        <span className="bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full text-xs font-medium">
                          免费
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* IoT数据直接显示 */}
                {iotData && (
                  <div className="mt-3 bg-white/30 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3">
                      {/* 拥挤度 */}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-xs text-white/50">拥挤</div>
                          <div className={`text-sm font-semibold ${getCrowdColor(iotData.crowdLevel)}`}>
                            {getCrowdText(iotData.crowdLevel)}
                          </div>
                        </div>
                      </div>
                      
                      {/* 天气 */}
                      <div className="flex items-center gap-2">
                        <WeatherIcon className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-xs text-white/50">天气</div>
                          <div className="text-sm font-semibold text-white">
                            {iotData.weatherDescription || '晴'}
                          </div>
                        </div>
                      </div>
                      
                      {/* 温度 */}
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-xs text-white/50">温度</div>
                          <div className="text-sm font-semibold text-white">
                            {iotData.temperature}°C
                          </div>
                        </div>
                      </div>
                      
                      {/* 降雨概率 */}
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-xs text-white/50">降雨</div>
                          <div className="text-sm font-semibold text-white">
                            {iotData.rainProbability}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 替换按钮 */}
                <button
                  onClick={() => handleReplace(attraction)}
                  disabled={loadingId === attraction.id}
                  className="w-full mt-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm px-4 py-2.5 rounded-lg text-center hover:shadow-lg transition-all duration-300 disabled:opacity-50 font-medium"
                >
                  {loadingId === attraction.id ? '替换中...' : '替换此景点'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {alternatives.length === 0 && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-white/40">暂无备选景点</p>
        </div>
      )}
    </div>
  );
}

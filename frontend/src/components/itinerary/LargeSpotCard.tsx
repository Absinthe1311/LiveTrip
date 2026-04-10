// 大型景点卡片组件 - 参考热门目的地设计，直接显示IoT数据
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, ChevronDown, ChevronUp, Star, Users, 
  Cloud, CloudRain, Sun, Thermometer, Droplets, Image as ImageIcon,
  Wallet, Heart
} from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface LargeSpotCardProps {
  item: any;
  index: number;
  city?: string;
  onShowAlternatives: () => void;
  showAlternatives: boolean;
  iotData?: any;
  isHovered?: boolean;
}

// 根据天气图标获取天气组件
const getWeatherIcon = (icon?: string) => {
  if (!icon) return Cloud;
  if (icon.includes('rain') || icon.includes('shower')) return CloudRain;
  if (icon.includes('sun') || icon.includes('clear')) return Sun;
  return Cloud;
};

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

export default function LargeSpotCard({
  item,
  index,
  city,
  onShowAlternatives,
  showAlternatives,
  iotData,
  isHovered = false
}: LargeSpotCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!item.name) return;
      setImageLoading(true);
      try {
        const response = await getSpotCoverImage(item.name, city);
        if (response.success && response.data?.imageUrl) {
          setImageUrl(response.data.imageUrl);
        }
      } catch (error) {
        console.error(`加载景点图片失败 (${item.name}):`, error);
      } finally {
        setImageLoading(false);
      }
    };
    loadImage();
  }, [item.name, city]);

  const WeatherIcon = getWeatherIcon(iotData?.weatherIcon);

  return (
    <div 
      className={`bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl ${
        isHovered ? 'ring-2 ring-green-400/50 scale-[1.02]' : ''
      }`}
    >
      {/* 景点图片 - 参考热门目的地 */}
      <div className="relative h-48 bg-gradient-to-br from-green-500/20 to-green-600/20">
        {imageLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400" />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-12 h-12 text-white/20" />
          </div>
        )}
        
        {/* 图片底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* 序号标签 */}
        <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {index + 1}
        </div>
        
        {/* 时间标签 */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
          <Clock className="w-4 h-4 text-green-400" />
          <span className="font-semibold">{item.time}</span>
        </div>

        {/* 收藏按钮 */}
        <button
          className="absolute top-3 right-20 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-red-500/80 transition-colors group"
          title="收藏"
        >
          <Heart className="w-4 h-4 text-white/80 group-hover:text-white" />
        </button>
      </div>

      {/* 景点信息 */}
      <div className="p-4 space-y-3">
        {/* 标题 */}
        <h3 className="text-xl font-bold text-white truncate">
          {item.name}
        </h3>

        {/* 分类标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          {(item as any).category && (
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
              {(item as any).category}
            </span>
          )}
          {item.estimated_cost && item.estimated_cost > 0 ? (
            <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              ¥{item.estimated_cost}
            </span>
          ) : (
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
              免费
            </span>
          )}
        </div>

        {/* IoT数据直接显示 */}
        {iotData && (
          <div className="bg-white/30 rounded-xl p-3">
            <div className="grid grid-cols-4 gap-2">
              {/* 拥挤度 */}
              <div className="text-center">
                <Users className="w-4 h-4 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">拥挤</div>
                <div className={`text-sm font-semibold ${getCrowdColor(iotData.crowdLevel)}`}>
                  {getCrowdText(iotData.crowdLevel)}
                </div>
              </div>
              
              {/* 天气 */}
              <div className="text-center">
                <WeatherIcon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">天气</div>
                <div className="text-sm font-semibold text-white">
                  {iotData.weatherDescription || '晴'}
                </div>
              </div>
              
              {/* 温度 */}
              <div className="text-center">
                <Thermometer className="w-4 h-4 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">温度</div>
                <div className="text-sm font-semibold text-white">
                  {iotData.temperature}°C
                </div>
              </div>
              
              {/* 降雨概率 */}
              <div className="text-center">
                <Droplets className="w-4 h-4 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">降雨</div>
                <div className="text-sm font-semibold text-white">
                  {iotData.rainProbability}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 描述 */}
        {item.description && (
          <p className="text-sm text-white/70 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* 备选景点按钮 */}
        <button
          onClick={onShowAlternatives}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-white text-sm font-medium transition-all duration-300 border border-green-400/30"
        >
          <span>查看备选景点</span>
          {showAlternatives ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

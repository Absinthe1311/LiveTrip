// 改进的景点卡片组件 - 更大尺寸，更高对比度，Read more展开
import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  Droplets,
  Image as ImageIcon,
  Wallet,
  Heart,
} from 'lucide-react';

interface ImprovedSpotCardProps {
  item: any;
  index: number;
  city?: string;
  imageUrl?: string; // 从父组件传入的图片URL
  onShowAlternatives?: () => void;
  showAlternatives?: boolean;
  iotData?: any;
  isHovered?: boolean;
  onHeightChange?: (index: number, height: number) => void;
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

export default function ImprovedSpotCard({
  item,
  index,
  city,
  imageUrl: propImageUrl, // 从父组件传入的图片URL
  onShowAlternatives,
  showAlternatives = false,
  iotData,
  isHovered = false,
  onHeightChange,
}: ImprovedSpotCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(propImageUrl || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 如果父组件传入了图片URL，直接使用；否则使用备用方案
  useEffect(() => {
    if (propImageUrl !== undefined) {
      setImageUrl(propImageUrl);
      setImageLoading(false);
    }
  }, [propImageUrl]);

  // 监听卡片高度变化
  useEffect(() => {
    if (!cardRef.current || !onHeightChange) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        onHeightChange(index, height);
      }
    });

    resizeObserver.observe(cardRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [index, onHeightChange]);

  const WeatherIcon = getWeatherIcon(iotData?.weatherIcon);

  return (
    <div
      ref={cardRef}
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-xl hover:scale-105 ${
        isHovered ? 'bg-gradient-to-r from-[#CDEDDE]/30 to-[#CDEDDE]/20 border-[#CDEDDE]/50' : ''
      }`}
    >
      {/* 景点图片 - 更大尺寸 */}
      <div className="relative h-56 bg-gradient-to-br from-[#145F39]/20 to-[#005746]/20">
        {imageLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-400" />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-16 h-16 text-white/20" />
          </div>
        )}

        {/* 图片底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {/* 序号标签 */}
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-gradient-to-r from-[#145F39] to-[#005746] flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {index + 1}
        </div>

        {/* 收藏按钮 */}
        <button
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-red-500/80 transition-colors group"
          title="收藏"
        >
          <Heart className="w-5 h-5 text-white/80 group-hover:text-white" />
        </button>
      </div>

      {/* 景点信息 - 更大内边距 */}
      <div className="p-6 space-y-4">
        {/* 标题 */}
        <h3 className="text-2xl font-bold text-white truncate">{item.name}</h3>

        {/* 分类标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          {(item as any).category && (
            <span className="bg-[#CDEDDE]/20 text-[#CDEDDE] px-4 py-1.5 rounded-full text-sm font-medium border border-[#CDEDDE]/30">
              {(item as any).category}
            </span>
          )}
          {item.estimated_cost && item.estimated_cost > 0 ? (
            <span className="bg-[#FFD9A3]/20 text-[#FFD9A3] px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 border border-[#FFD9A3]/30">
              <Wallet className="w-4 h-4" />¥{item.estimated_cost}
            </span>
          ) : (
            <span className="bg-[#CDEDDE]/20 text-[#CDEDDE] px-4 py-1.5 rounded-full text-sm font-medium border border-[#CDEDDE]/30">
              免费
            </span>
          )}
        </div>

        {/* IoT数据直接显示 */}
        {iotData && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="grid grid-cols-4 gap-3">
              {/* 拥挤度 */}
              <div className="text-center">
                <Users className="w-5 h-5 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">拥挤</div>
                <div className={`text-sm font-semibold ${getCrowdColor(iotData.crowdLevel)}`}>
                  {getCrowdText(iotData.crowdLevel)}
                </div>
              </div>

              {/* 天气 */}
              <div className="text-center">
                <WeatherIcon className="w-5 h-5 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">天气</div>
                <div className="text-sm font-semibold text-white">
                  {iotData.weatherDescription || '晴'}
                </div>
              </div>

              {/* 温度 */}
              <div className="text-center">
                <Thermometer className="w-5 h-5 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">温度</div>
                <div className="text-sm font-semibold text-white">{iotData.temperature}°C</div>
              </div>

              {/* 降雨概率 */}
              <div className="text-center">
                <Droplets className="w-5 h-5 text-white/60 mx-auto mb-1" />
                <div className="text-xs text-white/50">降雨</div>
                <div className="text-sm font-semibold text-white">{iotData.rainProbability}%</div>
              </div>
            </div>
          </div>
        )}

        {/* 描述 - 默认显示2-3行 */}
        {item.description && (
          <div>
            <p
              className={`text-base text-white/70 leading-relaxed ${
                !expanded ? 'line-clamp-3' : ''
              }`}
            >
              {item.description}
            </p>

            {/* Read more 按钮 */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[#CDEDDE] hover:text-[#CDEDDE]/80 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              {expanded ? (
                <>
                  <span>收起</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Read more</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* 备选景点按钮 */}
        {onShowAlternatives && (
          <button
            onClick={onShowAlternatives}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#145F39]/20 to-[#005746]/20 hover:from-[#145F39]/30 hover:to-[#005746]/30 text-white text-base font-medium transition-all duration-300 border border-[#145F39]/30"
          >
            <span>查看备选景点</span>
            {showAlternatives ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

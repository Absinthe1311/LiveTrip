// 两段式景点卡片组件 - IoT数据直接显示，支持餐厅选择
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, ChevronDown, ChevronUp, Star, Users, 
  Cloud, CloudRain, Sun, Thermometer, Droplets, Image as ImageIcon,
  Wallet, AlertCircle, UtensilsCrossed, Plus, Check
} from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface TwoStageAttractionCardProps {
  item: any;
  index: number;
  city?: string;
  onShowAlternatives: () => void;
  showAlternatives: boolean;
  iotData?: any;
  onTimeEdit?: (newTime: string) => void;
  isHovered?: boolean;
  showRestaurantOption?: boolean;
  selectedRestaurant?: any;
  onRestaurantSelect?: (restaurant: any) => void;
}

// 根据天气图标获取天气组件
const getWeatherIcon = (icon?: string) => {
  if (!icon) return Cloud;
  if (icon.includes('rain') || icon.includes('shower')) return CloudRain;
  if (icon.includes('sun') || icon.includes('clear')) return Sun;
  return Cloud;
};

export default function TwoStageAttractionCard({
  item,
  index,
  city,
  onShowAlternatives,
  showAlternatives,
  iotData,
  onTimeEdit,
  isHovered = false,
  showRestaurantOption = false,
  selectedRestaurant,
  onRestaurantSelect
}: TwoStageAttractionCardProps) {
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

  const WeatherIcon = getWeatherIcon(iotData?.weatherIcon);

  return (
    <div 
      className={`bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl ${
        isHovered ? 'ring-2 ring-green-400/50 scale-[1.02]' : ''
      }`}
    >
      {/* 景点信息 */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* 左侧：精美小图 */}
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-green-500/20 to-green-600/20 shadow-md">
            {imageLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
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
              <h3 className="text-lg font-bold text-white drop-shadow-md truncate">
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-white/80 flex-shrink-0">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="font-semibold">{item.time}</span>
              </div>
            </div>

            {/* 一句话简介 */}
            <p className="text-sm text-white/70 line-clamp-2 mb-3 drop-shadow-sm">
              {item.description || `${item.name}是一处值得探访的景点，为您提供独特的游览体验。`}
            </p>

            {/* 标签行 */}
            <div className="flex items-center gap-2 flex-wrap">
              {(item as any).category && (
                <span className="bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  {(item as any).category}
                </span>
              )}
              {item.estimated_cost && item.estimated_cost > 0 ? (
                <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  ¥{item.estimated_cost}
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

        {/* 餐厅选择（仅在11:00-13:00显示） */}
        {showRestaurantOption && (
          <div className="mt-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-400/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">午餐推荐</span>
              </div>
              {selectedRestaurant && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="w-3 h-3" />
                  <span>已选择</span>
                </div>
              )}
            </div>
            
            {/* 餐厅选项 */}
            <div className="flex gap-2 overflow-x-auto">
              {['老北京炸酱面', '川味观', '绿茶餐厅'].map((restaurant, idx) => (
                <button
                  key={idx}
                  onClick={() => onRestaurantSelect?.({ name: restaurant, type: '中式' })}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedRestaurant?.name === restaurant
                      ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                      : 'bg-white/20 text-white/70 hover:bg-white/30 border border-white/20'
                  }`}
                >
                  {restaurant}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 展开/收起按钮 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white/80 text-sm font-medium transition-all duration-300"
        >
          <span>{expanded ? '收起详情' : '查看详情'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 展开态：详细信息 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/20">
          {/* 完整描述 */}
          {item.description && (
            <div className="bg-white/20 rounded-xl p-3 mt-3">
              <div className="text-xs text-white/60 mb-1 font-medium">详细描述</div>
              <p className="text-sm text-white/80 leading-relaxed">
                {item.description}
              </p>
            </div>
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
      )}
    </div>
  );
}

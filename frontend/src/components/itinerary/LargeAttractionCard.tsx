// 大型景点卡片组件 - 用于行程展示，参考热门景点卡片设计
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, ChevronDown, ChevronUp, Star, Users, 
  Cloud, CloudRain, Sun, Thermometer, Droplets, Image as ImageIcon,
  Wallet, AlertCircle
} from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface LargeAttractionCardProps {
  item: any;
  index: number;
  city?: string;
  onShowAlternatives: () => void;
  showAlternatives: boolean;
  iotData?: any;
  onTimeEdit?: (newTime: string) => void;
}

// 根据天气图标获取天气组件
const getWeatherIcon = (icon?: string) => {
  if (!icon) return Cloud;
  if (icon.includes('rain') || icon.includes('shower')) return CloudRain;
  if (icon.includes('sun') || icon.includes('clear')) return Sun;
  return Cloud;
};

export default function LargeAttractionCard({
  item,
  index,
  city,
  onShowAlternatives,
  showAlternatives,
  iotData,
  onTimeEdit
}: LargeAttractionCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [timeEditing, setTimeEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(item.time);

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

  // 处理时间编辑
  const handleTimeSubmit = () => {
    if (onTimeEdit && currentTime !== item.time) {
      onTimeEdit(currentTime);
    }
    setTimeEditing(false);
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

  const WeatherIcon = getWeatherIcon(iotData?.weatherIcon);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg">
      {/* 景点图片区域 */}
      <div className="relative h-48 bg-gradient-to-br from-amber-500/20 to-amber-600/20">
        {imageLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
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
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {index + 1}
        </div>
        
        {/* 时间标签 - 可编辑 */}
        <div className="absolute top-3 right-3">
          {timeEditing ? (
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <input
                type="text"
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
                className="w-32 bg-transparent text-white text-sm outline-none border-b border-white/30"
                placeholder="09:00-11:00"
                autoFocus
              />
              <button
                onClick={handleTimeSubmit}
                className="text-amber-400 hover:text-amber-300"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTimeEditing(true)}
              className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm hover:bg-black/80 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{item.time}</span>
            </button>
          )}
        </div>
      </div>

      {/* 景点信息区域 */}
      <div className="p-5 space-y-3">
        {/* 标题和分类 */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {(item as any).category && (
              <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-medium">
                {(item as any).category}
              </span>
            )}
            {item.estimated_cost && item.estimated_cost > 0 ? (
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                ¥{item.estimated_cost}
              </span>
            ) : (
              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                免费
              </span>
            )}
          </div>
        </div>

        {/* 描述 */}
        {item.description && (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {/* IoT数据展示 */}
        {iotData && (
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>实时数据</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* 拥挤度 */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/60" />
                <div className="flex-1">
                  <div className="text-xs text-white/60">拥挤度</div>
                  <div className={`text-sm font-medium ${getCrowdColor(iotData.crowdLevel)}`}>
                    {getCrowdText(iotData.crowdLevel)} ({iotData.crowdLevel}%)
                  </div>
                </div>
              </div>
              
              {/* 天气 */}
              <div className="flex items-center gap-2">
                <WeatherIcon className="w-4 h-4 text-white/60" />
                <div className="flex-1">
                  <div className="text-xs text-white/60">天气</div>
                  <div className="text-sm font-medium text-white">
                    {iotData.weatherDescription || '晴'}
                  </div>
                </div>
              </div>
              
              {/* 温度 */}
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-white/60" />
                <div className="flex-1">
                  <div className="text-xs text-white/60">温度</div>
                  <div className="text-sm font-medium text-white">
                    {iotData.temperature}°C
                  </div>
                </div>
              </div>
              
              {/* 降雨概率 */}
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-white/60" />
                <div className="flex-1">
                  <div className="text-xs text-white/60">降雨概率</div>
                  <div className="text-sm font-medium text-white">
                    {iotData.rainProbability}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 备选景点按钮 */}
        <button
          onClick={onShowAlternatives}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-300"
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

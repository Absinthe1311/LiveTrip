// 紧凑版备选景点卡片 - 与ImprovedSpotCard样式一致但尺寸更小
import React, { useState } from 'react';
import { Star, MapPin, Wallet, Image as ImageIcon } from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface CompactAlternativeSpotCardProps {
  item: any;
  city?: string;
  onReplace: () => void;
  isSelected?: boolean;
}

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

export default function CompactAlternativeSpotCard({
  item,
  city,
  onReplace,
  isSelected = false
}: CompactAlternativeSpotCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // 加载景点图片
  React.useEffect(() => {
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

  return (
    <div
      className={`bg-white/10 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-[#008F8D]/50 border-[#008F8D]/50'
          : 'border-white/20'
      }`}
    >
      {/* 景点图片 - 缩小尺寸 */}
      <div className="relative h-32 bg-gradient-to-br from-[#008F8D]/20 to-[#008F8D]/30">
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
            <ImageIcon className="w-8 h-8 text-white/20" />
          </div>
        )}
        
        {/* 图片底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
        
        {/* 序号标签 - 缩小 */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-to-r from-[#008F8D] to-[#008F8D]/80 flex items-center justify-center text-white font-bold text-xs shadow-lg">
          {item.index || '备选'}
        </div>
      </div>

      {/* 景点信息 - 缩小内边距 */}
      <div className="p-3 space-y-2">
        {/* 标题 - 缩小字体 */}
        <h3 className="text-sm font-bold text-white truncate">
          {item.name}
        </h3>

        {/* 位置信息 */}
        {item.address && (
          <div className="flex items-center gap-1 text-xs text-white/60">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{item.address}</span>
          </div>
        )}

        {/* 分类标签 - 缩小 */}
        <div className="flex items-center gap-1 flex-wrap">
          {item.category && (
            <span className="bg-[#008F8D]/20 text-[#008F8D] px-2 py-0.5 rounded-full text-xs font-medium border border-[#008F8D]/30">
              {item.category}
            </span>
          )}
          {item.estimated_cost && item.estimated_cost > 0 ? (
            <span className="bg-[#FFD9A3]/20 text-[#FFD9A3] px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-0.5 border border-[#FFD9A3]/30">
              <Wallet className="w-3 h-3" />
              ¥{item.estimated_cost}
            </span>
          ) : (
            <span className="bg-[#008F8D]/20 text-[#008F8D] px-2 py-0.5 rounded-full text-xs font-medium border border-[#008F8D]/30">
              免费
            </span>
          )}
        </div>

        {/* 评分 - 缩小 */}
        {item.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#FFD9A3] fill-[#FFD9A3]" />
            <span className="text-xs font-semibold text-white">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* IoT数据 - 缩小版本 */}
        {item.iotData && (
          <div className="bg-white/5 rounded-lg p-2 border border-white/10">
            <div className="grid grid-cols-2 gap-2">
              {/* 拥挤度 */}
              <div className="text-center">
                <div className="text-xs text-white/50">拥挤</div>
                <div className={`text-xs font-semibold ${getCrowdColor(item.iotData.crowdLevel)}`}>
                  {getCrowdText(item.iotData.crowdLevel)}
                </div>
              </div>

              {/* 温度 */}
              <div className="text-center">
                <div className="text-xs text-white/50">温度</div>
                <div className="text-xs font-semibold text-white">
                  {item.iotData.temperature}°C
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 替换按钮 - 缩小 */}
        <button
          onClick={onReplace}
          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-gradient-to-r from-[#008F8D] to-[#008F8D]/80 text-white text-xs font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <span>{isSelected ? '✓ 已选择' : '选择此景点'}</span>
        </button>
      </div>
    </div>
  );
}

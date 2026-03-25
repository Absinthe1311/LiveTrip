// 景点卡片组件 - 支持显示图片和来源标注
import { useState, useEffect } from 'react';
import { Star, MapPin, Heart, Image as ImageIcon } from 'lucide-react';
import { getSpotCoverImage } from '../api/client';

interface SpotCardProps {
  id: string;
  name: string;
  city: string;
  rating?: number;
  description?: string;
  category?: string;
  ticketPrice?: number;
  isFavorite?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: () => void;
}

export default function SpotCard({
  id,
  name,
  city,
  rating = 4.5,
  description,
  category,
  ticketPrice,
  isFavorite = false,
  onClick,
  onFavoriteToggle,
}: SpotCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageSource, setImageSource] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    loadSpotImage();
  }, [name, city]);

  const loadSpotImage = async () => {
    try {
      setImageLoading(true);
      const response = await getSpotCoverImage(name, city);
      if (response.success && response.data) {
        setImageUrl(response.data.imageUrl || '');
        setImageSource(response.data.source || '');
      }
    } catch (error) {
      console.error('加载景点图片失败:', error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
    >
      {/* 图片区域 */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-livetrip-primary"></div>
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => {
                setImageUrl('');
                setImageLoading(false);
              }}
            />
            {/* 图片来源标注 */}
            {imageSource === 'unsplash' && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                Unsplash
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 标题和评分 */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1">{name}</h3>
          {rating > 0 && (
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* 位置 */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{city}</span>
        </div>

        {/* 描述 */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
        )}

        {/* 分类和价格 */}
        <div className="flex items-center justify-between">
          {category && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {category}
            </span>
          )}
          {ticketPrice !== undefined && ticketPrice > 0 && (
            <span className="text-sm font-medium text-livetrip-primary">
              ¥{ticketPrice}
            </span>
          )}
        </div>

        {/* 收藏按钮 */}
        {onFavoriteToggle && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            } backdrop-blur-sm`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}

// 景点卡片组件 - 带展开描述功能
import { useState, useEffect } from 'react';
import { Heart, Star, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import GlassCard from '../home/GlassCard';
import { addFavorite, removeFavorite, chkFav } from '../../api/client';
import { message } from 'antd';

interface SpotCardProps {
  spot: {
    id: string;
    name: string;
    image: string;
    rating: number;
    description?: string;
    openTime?: string;
    ticketPrice?: number;
    category?: string;
    city?: string;
    location?: string;
    address?: string;
  };
  onClick?: () => void;
  getTagColor: (category: string) => string;
  generateDescription: (name: string, category?: string, city?: string) => string;
  isFavorited?: boolean; // 外部传入的收藏状态
}

export function SpotCard({
  spot,
  getTagColor,
  generateDescription,
  isFavorited,
}: Omit<SpotCardProps, 'onClick'>) {
  const [isLiked, setIsLiked] = useState(isFavorited || false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // 检查是否已收藏（仅当没有外部传入状态时才检查）
  useEffect(() => {
    if (isFavorited !== undefined) {
      // 如果外部传入了收藏状态，直接使用
      setIsLiked(isFavorited);
      return;
    }

    const chkFavStatus = async () => {
      try {
        const response = await chkFav(spot.id);
        if (response.success && response.data) {
          setIsLiked(response.data.isFavorite);
        }
      } catch (error) {
        // 静默失败，不影响用户体验
        console.warn('检查收藏状态失败:', error);
      }
    };

    if (spot.id) {
      chkFavStatus();
    }
  }, [spot.id, isFavorited]);

  // 处理收藏/取消收藏
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isLiked) {
        // 取消收藏
        await removeFavorite(spot.id);
        setIsLiked(false);
        message.success('已取消收藏');
      } else {
        // 添加收藏
        await addFavorite(spot.id, spot.description);
        setIsLiked(true);
        message.success('收藏成功');
      }
      // 触发收藏更新事件
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error: any) {
      console.error('收藏操作失败:', error);
      message.error(error.message || '操作失败');
    }
  };

  const fullDescription =
    spot.description || generateDescription(spot.name, spot.category, spot.city);
  const shortDescription =
    fullDescription.length > 100 ? fullDescription.substring(0, 100) + '...' : fullDescription;
  const shouldShowReadMore = fullDescription.length > 100;

  return (
    <GlassCard className="p-0 overflow-hidden" hover={false}>
      {/* 景点图片 */}
      <div className="relative h-40 bg-gradient-to-br from-amber-500/20 to-amber-600/20">
        {spot.image ? (
          <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-10 h-10 text-white/20" />
          </div>
        )}

        {/* 收藏按钮 */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-red-500/80 transition-colors group"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-white/80 group-hover:text-white'
            }`}
          />
        </button>

        {/* 图片底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* 景点信息 */}
      <div className="p-3 space-y-2">
        {/* 标题 */}
        <h3 className="text-sm font-bold text-white truncate">{spot.name}</h3>

        {/* 分类标签 - 多色系，去重 */}
        {spot.category && (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(
              new Set(
                spot.category
                  .split(';')
                  .map((c) => c.trim())
                  .filter((c) => c)
              )
            )
              .slice(0, 2)
              .map((cat, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(cat)}`}
                >
                  {cat}
                </span>
              ))}
          </div>
        )}

        {/* 描述文字 - 可展开 */}
        <div className="text-xs text-white/70 leading-relaxed">
          <p>{showFullDescription ? fullDescription : shortDescription}</p>
          {shouldShowReadMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDescription(!showFullDescription);
              }}
              className="text-amber-400 hover:text-amber-300 text-xs mt-1 inline-flex items-center gap-1 transition-colors"
            >
              {showFullDescription ? (
                <>
                  <span>Show Less</span>
                  <ChevronLeft className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>Read More</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* 信息行：评分、价格、开放时间 */}
        <div className="flex items-center gap-2 text-xs pt-2 border-t border-white/10">
          {/* 评分 */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">{spot.rating}</span>
          </div>

          <span className="text-white/30">•</span>

          {/* 价格 */}
          {spot.ticketPrice && spot.ticketPrice > 0 ? (
            <span className="text-amber-400 font-medium">¥{spot.ticketPrice}</span>
          ) : (
            <span className="text-green-400 font-medium">免费</span>
          )}

          {spot.openTime && (
            <>
              <span className="text-white/30">•</span>
              <span className="text-white/60 truncate max-w-[80px]">{spot.openTime}</span>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

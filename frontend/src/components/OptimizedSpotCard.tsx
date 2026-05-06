// 优化后的景点卡片示例 - 巧克力博物馆
import { useState } from 'react';
import { Heart, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import GlassCard from './home/GlassCard';

interface SpotCardProps {
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
}

export default function OptimizedSpotCard({ 
  id,
  name,
  image,
  rating,
  description,
  openTime,
  ticketPrice,
  category,
  city,
  address
}: SpotCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // 根据分类生成标签颜色
  const getTagColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('博物馆') || categoryLower.includes('museum')) {
      return 'bg-purple-500/20 text-purple-300';
    }
    if (categoryLower.includes('公园') || categoryLower.includes('park')) {
      return 'bg-green-500/20 text-green-300';
    }
    if (categoryLower.includes('风景名胜') || categoryLower.includes('scenic')) {
      return 'bg-blue-500/20 text-blue-300';
    }
    if (categoryLower.includes('寺庙') || categoryLower.includes('temple')) {
      return 'bg-orange-500/20 text-orange-300';
    }
    if (categoryLower.includes('广场') || categoryLower.includes('plaza')) {
      return 'bg-cyan-500/20 text-cyan-300';
    }
    // 默认颜色
    return 'bg-amber-500/20 text-amber-300';
  };

  // 生成描述文字（如果没有描述）
  const generateDescription = () => {
    if (description) return description;
    
    // 根据景点名称和分类生成简单描述
    const descriptions: Record<string, string> = {
      '巧克巧蔻·巧克力博物馆(北京馆)': 
        '探索巧克力的奇妙世界，了解巧克力制作工艺与文化历史。这里展示了来自世界各地的珍贵巧克力藏品，是巧克力爱好者的天堂。您可以参与互动体验，亲手制作属于自己的巧克力作品，感受甜蜜与创意的完美结合。',
    };
    
    return descriptions[name] || `${name}是一处值得探访的${category || '景点'}，位于${city || '北京'}，为游客提供独特的游览体验。`;
  };

  const fullDescription = generateDescription();
  const shortDescription = fullDescription.length > 80 
    ? fullDescription.substring(0, 80) + '...' 
    : fullDescription;
  const shouldShowReadMore = fullDescription.length > 80;

  return (
    <GlassCard className="p-0 overflow-hidden hover:scale-[1.02] transition-transform">
      {/* 景点图片 */}
      <div className="relative h-48 bg-gradient-to-br from-amber-500/20 to-amber-600/20">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-white/20 text-6xl">🖼️</span>
          </div>
        )}
        
        {/* 收藏按钮 */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-red-500/80 transition-colors group"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isLiked 
                ? 'text-red-500 fill-red-500' 
                : 'text-white/80 group-hover:text-white'
            }`} 
          />
        </button>

        {/* 图片底部渐变遮罩 */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* 景点信息 */}
      <div className="p-5 space-y-3">
        {/* 标题 */}
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
          {address && (
            <p className="text-xs text-white/50 flex items-center gap-1">
              <span>📍</span>
              <span className="truncate">{address}</span>
            </p>
          )}
        </div>

        {/* 分类标签 - 多色系 */}
        {category && (
          <div className="flex flex-wrap gap-2">
            {category.split(';').slice(0, 3).map((cat, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium ${getTagColor(cat)}`}
              >
                {cat.trim()}
              </span>
            ))}
          </div>
        )}

        {/* 描述文字 - 可展开 */}
        <div className="text-sm text-white/70 leading-relaxed">
          <p>{showFullDescription ? fullDescription : shortDescription}</p>
          {shouldShowReadMore && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
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
        <div className="flex items-center gap-3 text-sm pt-2 border-t border-white/10">
          {/* 评分 */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">{rating}</span>
          </div>

          <span className="text-white/30">•</span>

          {/* 价格 */}
          {ticketPrice && ticketPrice > 0 ? (
            <span className="text-amber-400 font-medium">¥{ticketPrice}</span>
          ) : (
            <span className="text-green-400 font-medium">免费</span>
          )}

          {openTime && (
            <>
              <span className="text-white/30">•</span>
              <span className="text-white/60 truncate max-w-[120px]">{openTime}</span>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

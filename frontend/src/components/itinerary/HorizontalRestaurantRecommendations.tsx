// 横向滑动餐厅推荐组件
import React, { useState, useEffect } from 'react';
import { Star, MapPin, Wallet, Plus, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Restaurant } from '../../api/recommendationApi';

interface HorizontalRestaurantRecommendationsProps {
  location: string;
  city?: string;
  onAddToItinerary?: (restaurant: Restaurant) => void;
  visible?: boolean;
}

export default function HorizontalRestaurantRecommendations({
  location,
  city,
  onAddToItinerary,
  visible = true
}: HorizontalRestaurantRecommendationsProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && location) {
      loadRestaurants();
    }
  }, [visible, location]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      // 暂时使用模拟数据
      setRestaurants([
        {
          name: '老北京炸酱面',
          type: '中式快餐',
          rating: 4.5,
          address: '距离500m',
          location: location,
          tel: '010-12345678',
          distance: 500
        },
        {
          name: '川味观',
          type: '川菜',
          rating: 4.7,
          address: '距离800m',
          location: location,
          tel: '010-87654321',
          distance: 800
        },
        {
          name: '绿茶餐厅',
          type: '创意菜',
          rating: 4.6,
          address: '距离1.2km',
          location: location,
          tel: '010-11112222',
          distance: 1200
        }
      ]);
    } catch (error) {
      console.error('加载餐厅失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">周边餐厅推荐</span>
          <span className="text-xs text-white/50">({restaurants.length}家)</span>
        </div>
        <button className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
          查看更多 <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 横向滑动卡片 */}
      {loading ? (
        <div className="text-center py-4 text-white/60 text-sm">加载中...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {restaurants.map((restaurant, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-48 bg-white/50 backdrop-blur-md rounded-xl overflow-hidden border border-white/30 hover:border-green-400/50 transition-all duration-300 group"
            >
              {/* 餐厅图片 */}
              <div className="h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white/20" />
                </div>
                {/* 评分标签 */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-white font-semibold">{restaurant.rating}</span>
                </div>
              </div>

              {/* 餐厅信息 */}
              <div className="p-3">
                <h4 className="text-sm font-semibold text-white truncate mb-1">
                  {restaurant.name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{restaurant.address}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-xs">
                    {restaurant.type}
                  </span>
                </div>
                
                {/* 添加按钮 */}
                <button
                  onClick={() => onAddToItinerary?.(restaurant)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  加入行程
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

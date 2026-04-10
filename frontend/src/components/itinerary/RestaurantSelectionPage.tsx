// 餐厅选择页面组件 - 每天规划完景点后选择餐厅
import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Star, MapPin, Check, ChevronRight } from 'lucide-react';
import { message } from 'antd';

interface RestaurantSelectionPageProps {
  day: number;
  date: string;
  spots: Array<{ name: string; location: string }>;
  selectedRestaurants?: Record<number, any>;
  onRestaurantSelect: (day: number, restaurant: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function RestaurantSelectionPage({
  day,
  date,
  spots,
  selectedRestaurants = {},
  onRestaurantSelect,
  onNext,
  onBack
}: RestaurantSelectionPageProps) {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedRestaurant = selectedRestaurants[day];

  useEffect(() => {
    loadRestaurants();
  }, [spots]);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      // 模拟数据
      setRestaurants([
        { name: '老北京炸酱面', type: '中式快餐', rating: 4.5, distance: '500m', price: '¥30/人' },
        { name: '川味观', type: '川菜', rating: 4.7, distance: '800m', price: '¥80/人' },
        { name: '绿茶餐厅', type: '创意菜', rating: 4.6, distance: '1.2km', price: '¥60/人' },
        { name: '海底捞', type: '火锅', rating: 4.8, distance: '1.5km', price: '¥120/人' },
        { name: '西贝莜面村', type: '西北菜', rating: 4.5, distance: '900m', price: '¥70/人' },
      ]);
    } catch (error) {
      console.error('加载餐厅失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              第{day}天 · 餐厅选择
            </h2>
            <p className="text-sm text-white/60">{date}</p>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-sm">根据今日景点推荐</span>
          </div>
        </div>
      </div>

      {/* 餐厅列表 */}
      {loading ? (
        <div className="text-center py-8 text-white/60">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {restaurants.map((restaurant, index) => (
            <button
              key={index}
              onClick={() => onRestaurantSelect(day, restaurant)}
              className={`bg-white/60 backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300 text-left ${
                selectedRestaurant?.name === restaurant.name
                  ? 'border-green-400/50 shadow-lg ring-2 ring-green-400/30'
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              {/* 餐厅信息 */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-white truncate flex-1">
                  {restaurant.name}
                </h3>
                {selectedRestaurant?.name === restaurant.name && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* 标签 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-xs">
                  {restaurant.type}
                </span>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{restaurant.rating}</span>
                </div>
              </div>

              {/* 距离和价格 */}
              <div className="flex items-center gap-3 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{restaurant.distance}</span>
                </div>
                <span>{restaurant.price}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-all duration-300"
        >
          返回修改景点
        </button>
        
        <button
          onClick={onNext}
          disabled={!selectedRestaurant}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedRestaurant ? '下一步' : '请选择餐厅'}
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </div>
  );
}

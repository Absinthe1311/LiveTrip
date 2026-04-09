// 热门目的地页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, Users } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getFavorites, removeFavorite } from '../api/client';
import { message } from 'antd';

interface Spot {
  id: string;
  name: string;
  city: string;
  category: string;
  rating: number;
  description: string;
  imageUrl?: string;
  isFavorite?: boolean;
}

export default function DestinationsGlass() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSpots();
  }, []);

  const loadSpots = async () => {
    try {
      const response = await getFavorites();
      if (response && response.data) {
        setSpots(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setSpots(response);
      }
    } catch (error) {
      console.error('加载景点失败:', error);
      message.error('加载景点失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (spotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (favorites.has(spotId)) {
        await removeFavorite(spotId);
        const newFavorites = new Set(favorites);
        newFavorites.delete(spotId);
        setFavorites(newFavorites);
        message.success('已取消收藏');
      } else {
        message.success('请使用收藏功能');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">热门目的地</h1>
          <div className="flex items-center gap-4">
            <select className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white outline-none">
              <option value="">全部城市</option>
              <option value="北京">北京</option>
              <option value="上海">上海</option>
              <option value="成都">成都</option>
              <option value="杭州">杭州</option>
            </select>
            <select className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white outline-none">
              <option value="">全部类型</option>
              <option value="景点">景点</option>
              <option value="美食">美食</option>
              <option value="住宿">住宿</option>
            </select>
          </div>
        </div>

        {/* 景点列表 */}
        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : spots.length === 0 ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-white mb-2">暂无景点数据</h3>
              <p className="text-white/60">请稍后再试</p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {spots.map((spot) => (
              <GlassCard
                key={spot.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/destination/${spot.id}`)}
              >
                {/* 景点图片 */}
                <div className="relative h-48 bg-gradient-to-br from-livetrip-primary to-livetrip-accent">
                  {spot.imageUrl && (
                    <img
                      src={spot.imageUrl}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={(e) => handleToggleFavorite(spot.id, e)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 ${favorites.has(spot.id) ? 'text-red-500 fill-red-500' : 'text-white'}`}
                    />
                  </button>
                </div>

                {/* 景点信息 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{spot.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-white/80">{spot.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white/60 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{spot.city}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-sm">{spot.category}</span>
                  </div>

                  <p className="text-sm text-white/60 line-clamp-2">{spot.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}

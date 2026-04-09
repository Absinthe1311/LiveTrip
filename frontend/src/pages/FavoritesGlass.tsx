// 我的收藏页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, Trash2 } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getFavorites, removeFavorite } from '../api/client';
import { message } from 'antd';

interface FavoriteItem {
  id: string;
  spotId: string;
  name: string;
  city: string;
  category: string;
  rating: number;
  imageUrl?: string;
}

export default function FavoritesGlass() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await getFavorites();
      if (response && response.data) {
        setFavorites(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setFavorites(response);
      }
    } catch (error) {
      console.error('加载收藏失败:', error);
      message.error('加载收藏失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFavorite(id);
      message.success('已取消收藏');
      setFavorites(favorites.filter((item) => item.id !== id));
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">我的收藏</h1>
          <span className="text-white/60">共 {favorites.length} 个收藏</span>
        </div>

        {/* 收藏列表 */}
        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : favorites.length === 0 ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold text-white mb-2">还没有收藏</h3>
              <p className="text-white/60 mb-4">去发现感兴趣的景点吧！</p>
              <button
                onClick={() => navigate('/destinations')}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                浏览景点
              </button>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {favorites.map((item) => (
              <GlassCard
                key={item.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/destination/${item.spotId}`)}
              >
                {/* 图片 */}
                <div className="relative h-48 bg-gradient-to-br from-livetrip-primary to-livetrip-accent">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={(e) => handleRemove(item.id, e)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* 信息 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">{item.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-white/80">{item.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{item.city}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-sm">{item.category}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}

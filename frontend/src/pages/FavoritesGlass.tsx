// 我的收藏页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { SpotCard } from '../components/SpotCard';
import { getFavorites, removeFavorite } from '../api/client';
import { message } from 'antd';

interface FavoriteItem {
  id: string;
  spotId: string;
  userId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  spot: {
    id: string;
    amapId: string;
    name: string;
    location: string;
    address: string | null;
    city: string;
    category: string | null;
    ticketPrice: number | null;
    openTime: string | null;
    rating: number | null;
    description: string | null;
    isOutdoor: boolean | null;
    source: string;
    coverImage?: string | null;
    images?: Array<{ url: string }>;
  };
}

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
  return 'bg-amber-500/20 text-amber-300';
};

// 生成描述文字
const generateDescription = (name: string, category?: string, city?: string) => {
  return `${name}是一处值得探访的${category || '景点'}，位于${city || '中国'}，为游客提供独特的游览体验。`;
};

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
      console.log('📦 收藏数据:', response);
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

  const handleRemove = async (spotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFavorite(spotId);
      message.success('已取消收藏');
      setFavorites(favorites.filter((item) => item.spotId !== spotId));
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <GlassLayout showSearch={false}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((item) => {
              // 获取图片URL
              const imageUrl = item.spot.coverImage ||
                (item.spot.images && item.spot.images.length > 0 ? item.spot.images[0].url : '') ||
                '';

              return (
                <div key={item.id} className="relative group">
                  <SpotCard
                    spot={{
                      id: item.spot.id,
                      name: item.spot.name,
                      image: imageUrl,
                      rating: item.spot.rating || 4.5,
                      description: item.spot.description || '',
                      openTime: item.spot.openTime || '全天开放',
                      ticketPrice: item.spot.ticketPrice || 0,
                      category: item.spot.category || '',
                      city: item.spot.city,
                      address: item.spot.address || '',
                    }}
                    getTagColor={getTagColor}
                    generateDescription={generateDescription}
                    isFavorited={true} // 在收藏页面中，始终显示为已收藏
                  />
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => handleRemove(item.spotId, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 transition-colors z-10"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}

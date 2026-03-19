// 我的收藏页面 - 展示收藏的景点
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, Star, MapPin, Trash2 } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { getFavorites, removeFavorite } from '../api/client';

interface FavoriteSpot {
  id: string;
  spotId: string;
  name: string;
  city: string;
  rating: number;
  description: string;
  category: string;
  ticketPrice: number;
  image?: string;
  notes?: string;
  createdAt: string;
  iotData?: {
    crowdLevel: number;
    temperature: number;
    rainProbability: number;
    isOpen: boolean;
  };
  openTime?: string;
}

export default function Favorites() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      console.log('📦 从后端API加载收藏数据...');
      const response = await getFavorites(true); // 包含IoT数据

      if (response.success && response.data) {
        console.log('✅ 收藏数据加载成功:', response.data);
        console.log('📊 收藏数量:', response.data.length);

        // 转换数据格式以匹配前端界面
        const formattedFavorites: FavoriteSpot[] = response.data.map((fav: any) => ({
          id: fav.id,
          spotId: fav.spotId,
          name: fav.spot.name,
          city: fav.spot.city,
          rating: fav.spot.rating || 4.5,
          description: fav.spot.description || '暂无描述',
          category: fav.spot.category || '景点',
          ticketPrice: fav.spot.ticketPrice || 0,
          image: '', // 后端暂未返回图片URL
          notes: fav.notes || '',
          createdAt: fav.createdAt,
          iotData: fav.spot.iotData, // IoT数据
          openTime: fav.spot.openTime || '全天开放',
        }));

        setFavorites(formattedFavorites);
      } else {
        console.log('⚠️ 后端返回失败:', response);
        setFavorites([]);
      }
    } catch (error) {
      console.error('❌ 加载收藏失败:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (spotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFavorite(spotId);
      setFavorites(prev => prev.filter(f => (f.spotId || f.id) !== spotId));
    } catch (error) {
      console.error('❌ 取消收藏失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[240px] h-full flex items-center px-5 border-r border-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center"><span className="text-lg">✈️</span></div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索目的地、景点、攻略…" className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">ZL</div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>Zhang Lei</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isLargeScreen={isLargeScreen} currentPage={location.pathname} />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-semibold text-foreground">我的收藏</h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              共收藏 {favorites.length} 个景点
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">暂无收藏</h3>
              <p className="text-[14px] text-muted-foreground mb-6">
                去热门目的地探索你感兴趣的景点吧
              </p>
              <button
                onClick={() => navigate('/destinations')}
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                探索热门景点
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((spot) => (
                <div
                  key={spot.id}
                  onClick={() => navigate(`/destination/${spot.spotId || spot.id}`)}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gray-200">
                    {spot.image ? (
                      <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-livetrip-primary/10 to-emerald-400/10">
                        🏛️
                      </div>
                    )}
                    <button
                      onClick={(e) => handleRemoveFavorite(spot.spotId || spot.id, e)}
                      className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">
                        {spot.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-[13px] text-foreground">{spot.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                      <span className="text-[12px] text-muted-foreground">·</span>
                      <span className="text-[12px] text-muted-foreground">{spot.category}</span>
                      {spot.city && (
                        <>
                          <span className="text-[12px] text-muted-foreground">·</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[12px] text-muted-foreground">{spot.city}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">
                      {spot.description}
                    </p>

                    {/* IoT数据显示 */}
                    {spot.iotData && (
                      <div className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full ${spot.iotData.rainProbability > 50 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          🌡️ {spot.iotData.temperature}°C
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${spot.iotData.crowdLevel > 60 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          👥 人流{spot.iotData.crowdLevel > 60 ? '较多' : '较少'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${spot.iotData.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {spot.iotData.isOpen ? '🔓 开放' : '🔒 关闭'}
                        </span>
                      </div>
                    )}

                    {spot.ticketPrice > 0 && (
                      <div className="flex items-center gap-1 text-[13px] text-primary font-medium">
                        <span>¥{spot.ticketPrice}</span>
                        <span className="text-muted-foreground font-normal">/人</span>
                      </div>
                    )}

                    <div className="text-[11px] text-muted-foreground mt-1">
                      开放时间: {spot.openTime || '全天开放'}
                    </div>

                    {spot.notes && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[12px] text-muted-foreground">
                          <span className="font-medium">备注：</span>
                          {spot.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

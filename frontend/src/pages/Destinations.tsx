// 热门目的地页面 - 按城市分组展示景点
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, Star, MapPin } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { getFavorites, addFavorite, removeFavorite } from '../api/client';

interface HotSpot {
  id: string;
  name: string;
  city: string;
  rating: number;
  description: string;
  category: string;
  ticketPrice: number;
  image?: string;
  isHot: boolean;
}

interface HotCity {
  city: string;
  count: number;
  avgRating: number;
  spots: HotSpot[];
}

const cityIcons: Record<string, string> = {
  '北京市': '🏛️',
  '上海市': '🌃',
  '成都市': '🐼',
  '杭州市': '🏞️',
  '厦门市': '🌊',
  '西安市': '🏔️',
  '广州市': '🌸',
  '深圳市': '🏙️',
  '武汉市': '🌊',
};

export default function Destinations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [hotCities, setHotCities] = useState<HotCity[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载热门景点和收藏列表
      const [spotsResponse, favoritesResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api'}/hot-spots`),
        getFavorites().catch(() => null),
      ]);

      // 处理热门景点数据
      if (spotsResponse.ok) {
        const result = await spotsResponse.json();
        if (result.success && result.data) {
          // 按城市分组
          const cityMap: Record<string, HotCity> = {};
          result.data.forEach((spot: HotSpot) => {
            if (!spot.city) return;

            if (!cityMap[spot.city]) {
              cityMap[spot.city] = {
                city: spot.city,
                count: 0,
                avgRating: 0,
                spots: [],
              };
            }

            cityMap[spot.city].count++;
            cityMap[spot.city].avgRating += spot.rating || 0;
            cityMap[spot.city].spots.push(spot);
          });

          // 计算平均评分
          const cities = Object.values(cityMap).map(city => ({
            ...city,
            avgRating: city.count > 0 ? city.avgRating / city.count : 0,
          }));

          setHotCities(cities);
        }
      }

      // 处理收藏数据
      if (favoritesResponse?.success && favoritesResponse.data) {
        const favoriteIds = new Set(favoritesResponse.data.map((f: any) => f.spotId || f.id));
        setFavorites(favoriteIds);
      }
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (spotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (favorites.has(spotId)) {
        await removeFavorite(spotId);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(spotId);
          return newSet;
        });
      } else {
        await addFavorite(spotId);
        setFavorites(prev => new Set(prev).add(spotId));
      }
    } catch (error) {
      console.error('❌ 收藏操作失败:', error);
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
            <Heart className="h-5 w-5 text-muted-foreground" />
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
            <h1 className="font-serif text-2xl font-semibold text-foreground">热门目的地</h1>
            <p className="text-[15px] text-muted-foreground mt-1">探索精选热门景点，开启你的精彩旅程</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <div className="space-y-10">
              {hotCities.map((cityData) => (
                <div key={cityData.city || 'unknown'}>
                  {/* City Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{cityIcons[cityData.city] || '🏙️'}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {(cityData.city || '未知城市').replace('市', '')}
                      </h2>
                      <p className="text-[13px] text-muted-foreground">
                        {cityData.count || 0} 个热门景点 · 平均评分 {(cityData.avgRating || 0).toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Spots Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(cityData.spots || []).map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => navigate(`/destination/${spot.id}`)}
                        className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      >
                        {/* Image */}
                        <div className="relative h-40 bg-gray-200">
                          {spot.image ? (
                            <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              {cityIcons[cityData.city] || '🏛️'}
                            </div>
                          )}
                          {spot.isHot && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[11px] px-2 py-1 rounded-full font-medium">
                              热门
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors">
                              {spot.name || '未知景点'}
                            </h3>
                            <button
                              onClick={(e) => handleToggleFavorite(spot.id, e)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  favorites.has(spot.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-[13px] text-foreground">{(spot.rating || 0).toFixed(1)}</span>
                            </div>
                            <span className="text-[12px] text-muted-foreground">·</span>
                            <span className="text-[12px] text-muted-foreground">{spot.category || '景点'}</span>
                          </div>

                          <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">
                            {spot.description || '暂无描述'}
                          </p>

                          {spot.ticketPrice > 0 && (
                            <div className="flex items-center gap-1 text-[13px] text-primary font-medium">
                              <span>¥{spot.ticketPrice}</span>
                              <span className="text-muted-foreground font-normal">/人</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {hotCities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">暂无热门景点数据</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

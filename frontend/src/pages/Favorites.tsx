// 我的收藏页面 - 基于 V0 设计重构
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Globe, PenLine, List, MapPin, ChevronRight, Plus } from "lucide-react";
import { getFavorites, removeFavorite } from '../api/client';
import { Sidebar } from '../components/SharedSidebar';

export default function Favorites() {
  const navigate = useNavigate();
  const location = useLocation();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    loadFavorites();
    
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (spotId: string) => {
    try {
      const response = await removeFavorite(spotId);
      if (response.success) {
        loadFavorites();
      }
    } catch (error) {
      console.error('移除收藏失败:', error);
    }
  };

  const getCrowdLevelStyle = (level: number) => {
    if (level < 0.3) return { bg: 'bg-secondary', text: 'text-primary', border: 'border-primary/20', label: '人流低' };
    if (level < 0.7) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-500/25', label: '人流中' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500/25', label: '人流高' };
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center">
              <span className="text-lg">✈️</span>
            </div>
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

      {/* Overlay for mobile */}
      {sidebarOpen && !isLargeScreen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-14 bottom-0 w-[220px] bg-white border-r border-border z-40 flex flex-col transition-transform duration-300 ${isLargeScreen ? 'translate-x-0' : (sidebarOpen ? 'translateX(0)' : '-translate-x-full')}`}>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-4">
            <h3 className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">主菜单</h3>
            <ul className="space-y-0.5">
              <li><button onClick={() => { navigate('/'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"><HomeIcon className="h-4 w-4" /><span>首页</span></button></li>
              <li><button onClick={() => { navigate('/plan'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"><Plus className="h-4 w-4" /><span>创建行程</span></button></li>
              <li><button onClick={() => { navigate('/destinations'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"><Globe className="h-4 w-4" /><span>热门目的地</span></button></li>
              <li><button onClick={() => { navigate('/favorites'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-medium bg-secondary transition-colors relative"><span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" /><Heart className="h-4 w-4" /><span>我的收藏</span></button></li>
            </ul>
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-sm font-medium">ZL</div>
            <div className="flex-1 text-left"><p className="text-sm font-medium text-foreground">Zhang Lei</p><p className="text-[11px] text-muted-foreground">旅行达人 · Lv.4</p></div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <div className="mb-3.5">
            <h1 className="font-serif text-xl font-semibold text-foreground">我的收藏</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">已收藏 {favorites.length} 处景点</p>
          </div>

          {/* Favorites Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favorites.map((place: any) => {
                const crowdStyle = place.iotData ? getCrowdLevelStyle(place.iotData.crowdLevel) : null;
                return (
                  <div key={place.id} className="bg-card border border-border rounded-lg overflow-hidden transition-all hover:border-primary cursor-pointer">
                    {/* Image */}
                    <div className="relative h-[88px] bg-gray-200">
                      <img src={place.coverImage || `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=70`} alt={place.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Body */}
                    <div className="p-2.5 px-3">
                      {/* Top Row */}
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-[13px] font-medium text-foreground">{place.name}</h3>
                        <button onClick={() => handleRemove(place.id)} className="text-[11px] text-red-400 hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors">移除</button>
                      </div>

                      {/* Location */}
                      <p className="text-[11px] text-muted-foreground mb-2">📍 {place.city}</p>

                      {/* IoT Chips */}
                      {place.iotData && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border ${crowdStyle?.bg} ${crowdStyle?.text} ${crowdStyle?.border}`}>
                            {crowdStyle?.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-500/20">
                            {place.iotData.temperature}°C
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {favorites.length === 0 && (
                <div className="text-center py-12 col-span-2">
                  <p className="text-muted-foreground">暂无收藏景点</p>
                  <button onClick={() => navigate('/destinations')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">探索景点</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

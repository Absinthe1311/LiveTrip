// 当前行程页面 - 时间轴 + 地图布局
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, List, MapPin, ChevronRight, Navigation, Route, Search as SearchIcon } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';

const itineraryItems = [
  {
    id: 1,
    time: "09:00",
    title: "浅草寺",
    tags: ["寺庙", "历史"],
    status: "completed",
    crowdLevel: "人流低",
    weather: "16°C 晴",
  },
  {
    id: 2,
    time: "12:00",
    title: "浅草寿司大本店",
    info: "推荐午餐、人均¥80、步行5分钟",
    status: "completed",
  },
  {
    id: 3,
    time: "14:00",
    title: "上野公园（赏樱）",
    tags: ["樱花", "公园"],
    status: "current",
    crowdLevel: "人流较多",
    weather: "16°C",
  },
  {
    id: 4,
    time: "18:00",
    title: "上野磯丸水産",
    info: "推荐晚餐、人均¥150、步行3分钟",
    status: "pending",
  },
  {
    id: 5,
    time: "20:00",
    title: "秋叶原电器街",
    tags: ["购物", "科技"],
    status: "pending",
    crowdLevel: "人流低",
  },
];

export default function Today() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { dot: 'bg-primary', bg: 'bg-blue-50', border: '' };
      case 'current':
        return { dot: 'bg-amber-500', bg: 'bg-white', border: 'border-2 border-amber-500' };
      case 'pending':
        return { dot: 'bg-gray-300', bg: 'bg-blue-50', border: '' };
      default:
        return { dot: 'bg-gray-300', bg: '', border: '' };
    }
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
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage={location.pathname}
      />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        {/* Page Header */}
        <div className="bg-white border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground">东京深度游</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Day 1 · 2026年3月20日（周五）</p>
            </div>
            <button className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
              切换行程
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Itinerary Timeline */}
            <div className="space-y-3">
              {itineraryItems.map((item, index) => {
                const statusStyle = getStatusStyle(item.status);
                return (
                  <div key={item.id} className="flex gap-4">
                    {/* Time */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-foreground">{item.time}</span>
                      <div className={`w-3 h-3 rounded-full ${statusStyle.dot} my-2`} />
                      {index < itineraryItems.length - 1 && <div className="w-0.5 h-full bg-border" />}
                    </div>

                    {/* Card */}
                    <div className={`flex-1 bg-card border border-border rounded-lg p-3.5 ${statusStyle.bg} ${statusStyle.border}`}>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                        {item.status === 'current' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                            ▶ 正在进行
                          </span>
                        )}
                      </div>

                      {item.info && (
                        <p className="text-xs text-muted-foreground mb-2">{item.info}</p>
                      )}

                      {item.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {(item.crowdLevel || item.weather) && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.crowdLevel && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${
                              item.crowdLevel.includes('低') 
                                ? 'bg-secondary text-primary border-primary/20' 
                                : 'bg-amber-100 text-amber-700 border-amber-500/25'
                            }`}>
                              {item.crowdLevel}
                            </span>
                          )}
                          {item.weather && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-500/20">
                              {item.weather}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Map */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Map Header */}
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">今日地图</h3>
                <span className="text-xs text-muted-foreground">东京·台东区</span>
              </div>

              {/* Map Content */}
              <div className="h-[400px] bg-gradient-to-br from-green-50 to-blue-50 relative flex items-center justify-center">
                {/* Placeholder Map */}
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-sm text-muted-foreground">地图视图</p>
                  <p className="text-xs text-muted-foreground mt-1">高德地图 · 景点路线</p>
                </div>

                {/* Map Markers (示意) */}
                <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                  📍
                </div>
                <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                  🌸
                </div>
              </div>

              {/* Map Controls */}
              <div className="p-3 border-t border-border flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs text-foreground">
                  <Navigation className="w-4 h-4" />
                  导航
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs text-foreground">
                  <Route className="w-4 h-4" />
                  路线
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs text-foreground">
                  <SearchIcon className="w-4 h-4" />
                  搜索
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

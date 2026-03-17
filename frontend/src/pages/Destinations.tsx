// 热门目的地页面 - 基于 V0 设计重构
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, Star } from "lucide-react";
import { getHotDestinations } from '../api/client';
import { Sidebar } from '../components/SharedSidebar';

export default function Destinations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    loadDestinations();
    
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const response = await getHotDestinations();
      if (response.success && response.data) {
        setDestinations(response.data);
      }
    } catch (error) {
      console.error('加载热门目的地失败:', error);
      // 使用默认数据
      setDestinations([
        { id: '1', name: '东京', city: '东京', rating: 4.9, days: '7天推荐', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=75' },
        { id: '2', name: '京都', city: '京都', rating: 4.8, days: '5天推荐', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=75' },
        { id: '3', name: '巴厘岛', city: '巴厘岛', rating: 4.7, days: '6天推荐', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=75' },
        { id: '4', name: '巴黎', city: '巴黎', rating: 4.8, days: '8天推荐', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=75' },
        { id: '5', name: '巴塞罗那', city: '巴塞罗那', rating: 4.7, days: '7天推荐', image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=400&q=75' },
      ]);
    } finally {
      setLoading(false);
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
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Hero Banner */}
          <div className="relative h-[140px] rounded-2xl overflow-hidden mb-5 cursor-pointer group">
            <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=80" alt="Hot Destinations" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f4a32]/90 to-[#0f4a32]/40" />
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <h2 className="font-serif text-[22px] font-semibold text-white mb-1">探索热门目的地</h2>
              <p className="text-xs text-white/75 max-w-md">基于 AI 推荐与 IoT 实时人气数据，为你精选全球旅行胜地</p>
            </div>
          </div>

          {/* Destination Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {destinations.map(dest => (
                <div key={dest.id} onClick={() => navigate(`/destination/${dest.id}`)} className="bg-card border border-border rounded-lg overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer">
                  <div className="relative h-[110px] bg-gray-200">
                    <img src={dest.image || `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=75`} alt={dest.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3.5">
                    <h3 className="font-medium text-foreground mb-1">{dest.name || dest.city}</h3>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                      <span>{dest.days || '5-7天推荐'}</span>
                      <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-current" />
                        {dest.rating || 4.8}
                      </span>
                    </div>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-secondary text-primary">
                      🌟 热门推荐
                    </span>
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

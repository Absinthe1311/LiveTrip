// 首页 - LiveTrip 智能旅行规划（基于 V0 设计重构）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Star, TrendingUp, Menu, Search, Bell, Heart, Home as HomeIcon, Sparkles, Globe, PenLine, List, MapPin, ChevronRight, Users } from "lucide-react";
import { getUserTrips, getFavoriteCount } from '../api/client';
import { popularDestinations } from '../data/popularDestinations';

// ==================== 未登录态视图 ====================
function GuestView() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div 
          className="w-[240px] h-full flex items-center px-5 border-r border-border shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center mr-2">
            <span className="text-lg">✈️</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">
              LiveTrip
            </span>
            <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">
              AI · IoT · Travel
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索目的地、景点、攻略…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-livetrip-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-livetrip-primary-dark transition-colors ml-2"
          >
            登录
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800 p-6">
        <div className="text-center text-white max-w-3xl">
          <h1 className="text-5xl font-bold mb-4 font-serif">
            LiveTrip 智能旅行规划
          </h1>
          <p className="text-lg opacity-90 mb-8 leading-relaxed">
            基于人工智能和物联网技术的智能行程规划系统，能够根据用户偏好、实时物联网数据动态优化旅行行程
          </p>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-livetrip-accent text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
          >
            开始你的旅程
          </button>
          {/* 测试登录按钮 - 仅用于开发测试 */}
          <button 
            onClick={() => {
              // 模拟登录
              const testUser = {
                id: 'test-user-1',
                username: 'Zhang Lei',
                role: 'user'
              };
              localStorage.setItem('user', JSON.stringify(testUser));
              localStorage.setItem('token', 'test-token-123');
              window.location.reload();
            }}
            className="mt-4 bg-white/20 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-white/30 transition-all"
          >
            测试登录（开发模式）
          </button>
        </div>
      </section>
    </div>
  );
}

// ==================== 已登录态工作台视图 ====================
function WorkspaceView() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [hotDestinations, setHotDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    loadData();
    
    // 检测屏幕宽度
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [tripsResponse, favoritesResponse] = await Promise.all([
        getUserTrips().catch(() => null),
        getFavoriteCount().catch(() => null),
      ]);

      // 处理行程数据
      let trips: any[] = [];
      let completedCount = 0;
      if (tripsResponse?.success && tripsResponse.data) {
        trips = tripsResponse.data;
        completedCount = trips.filter((t: any) => t.status === 'completed').length;
      }

      // 处理收藏数据
      let favoriteCount = 0;
      if (favoritesResponse?.success && favoritesResponse.data) {
        favoriteCount = favoritesResponse.data.count || 0;
      }

      // 设置统计数据
      setStatsData([
        {
          label: "行程总数",
          value: trips.length,
          change: trips.length > 0 ? `本月新增 ${trips.filter((t: any) => {
            const created = new Date(t.createdAt);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }).length}` : null,
          trend: "up",
        },
        {
          label: "已完成",
          value: completedCount,
          change: null,
          trend: null,
        },
        {
          label: "收藏景点",
          value: favoriteCount,
          change: favoriteCount > 0 ? `共 ${favoriteCount} 个` : null,
          trend: "up",
        },
      ]);

      // 设置最近行程（最多显示3个）
      setRecentTrips(trips.slice(0, 3));

      // 使用城市级别的热门目的地数据
      setHotDestinations(popularDestinations);
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
      // 出错时使用默认数据
      setStatsData([
        { label: "行程总数", value: 0, change: null, trend: null },
        { label: "已完成", value: 0, change: null, trend: null },
        { label: "收藏景点", value: 0, change: null, trend: null },
      ]);
      setRecentTrips([]);
      setHotDestinations(popularDestinations);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${start.getMonth() + 1}月${start.getDate()}日 — ${end.getMonth() + 1}月${end.getDate()}日 (${days}天)`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-secondary text-primary';
      case 'planning':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'planning': return '规划中';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        {/* Logo Section */}
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center">
              <span className="text-lg">✈️</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">
                LiveTrip
              </span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">
                AI · IoT · Travel
              </span>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索目的地、景点、攻略…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button 
            onClick={() => navigate('/favorites')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">
              ZL
            </div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>
              Zhang Lei
            </span>
            {/* 退出登录按钮 */}
            <button
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.reload();
              }}
              className={`ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors ${isLargeScreen ? 'block' : 'hidden'}`}
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-14 bottom-0 w-[240px] bg-white border-r border-border z-40 flex flex-col transition-transform duration-300 ${isLargeScreen ? 'translate-x-0' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')}`}>
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Section: 主菜单 */}
          <div className="mb-4">
            <h3 className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              主菜单
            </h3>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => { navigate('/'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <HomeIcon className="h-4 w-4" />
                  <span>首页</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/plan'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>创建行程</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/ai-features'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>AI 功能</span>
                  <span className="ml-auto bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    新
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/destinations'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>热门目的地</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/favorites'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  <span>我的收藏</span>
                  <span className="ml-auto bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
                    12
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Section: 社区 */}
          <div className="mb-4">
            <h3 className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              社区
            </h3>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => { navigate('/blogs'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <PenLine className="h-4 w-4" />
                  <span>旅行博客</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Section: 我的旅行 */}
          <div className="mb-4">
            <h3 className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              我的旅行
            </h3>
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => { navigate('/my-trips'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <List className="h-4 w-4" />
                  <span>我的行程</span>
                  <span className="ml-auto bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
                    {statsData[0]?.value || 0}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/today'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span>当前行程</span>
                  <span className="ml-auto bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    今
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/collab'); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span>协同规划</span>
                  <span className="ml-auto bg-livetrip-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    新
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-sm font-medium">
              ZL
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">
                Zhang Lei
              </p>
              <p className="text-[11px] text-muted-foreground">
                旅行达人 · Lv.4
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 py-7 lg:px-7">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hero Section */}
              <section className="relative h-[220px] w-full rounded-xl overflow-hidden">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80')",
                  }}
                />
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to right, rgba(15,74,50,0.85) 0%, rgba(15,74,50,0.5) 50%, transparent 100%)",
                  }}
                />
                {/* Content */}
                <div className="relative h-full flex items-end justify-between p-6">
                  <div className="text-white">
                    <p className="text-xs uppercase tracking-wider text-white/80 mb-1">
                      欢迎回来
                    </p>
                    <h1 className="text-3xl font-serif font-semibold leading-tight">
                      你好，今天去哪儿？
                    </h1>
                    <p className="text-sm text-white/80 mt-2">
                      你有 {statsData[0]?.value || 0} 个行程{statsData[0]?.value > 0 ? '正在规划中' : ''}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/plan')}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 py-3 shadow-lg flex items-center gap-2 text-base font-medium"
                    style={{
                      boxShadow: "0 4px 14px rgba(245, 166, 35, 0.4)",
                    }}
                  >
                    <Plus className="h-5 w-5" />
                    规划新行程
                  </button>
                </div>
              </section>

              {/* Stats Row */}
              <section className="grid grid-cols-3 gap-4">
                {statsData.map((stat, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-5">
                    <p className="text-[15px] text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-medium text-foreground mt-1">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="text-[13px] text-primary flex items-center mt-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change}
                      </p>
                    )}
                  </div>
                ))}
              </section>

              {/* Recent Trips Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">最近行程</h2>
                  <button 
                    onClick={() => navigate('/my-trips')}
                    className="text-[15px] text-primary hover:text-primary/80 flex items-center transition-colors"
                  >
                    查看全部 <ArrowRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
                <div className="space-y-3">
                  {recentTrips.map((trip, index) => (
                    <div
                      key={index}
                      onClick={() => navigate(`/trip/${trip.id}`)}
                      className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:border-l-primary hover:border-l-2 hover:translate-x-0.5 transition-all cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        <img
                          src={`https://images.unsplash.com/photo-${1540959733332 + index * 1000000}?w=100&q=70`}
                          alt={trip.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-foreground truncate">
                          {trip.title || trip.destination}
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                          {formatDateRange(trip.startDate, trip.endDate)} · ¥{trip.totalBudget.toLocaleString()}
                        </p>
                      </div>
                      {/* Status Pill */}
                      <span className={`text-[13px] px-3 py-1.5 rounded-full flex-shrink-0 ${getStatusStyle(trip.status)}`}>
                        {getStatusText(trip.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Hot Destinations Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">热门目的地</h2>
                  <button 
                    onClick={() => navigate('/destinations')}
                    className="text-[15px] text-primary hover:text-primary/80 flex items-center transition-colors"
                  >
                    更多 <ArrowRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
                {/* Horizontal Scroll Container */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {hotDestinations.map((dest, index) => (
                    <div
                      key={index}
                      onClick={() => navigate(`/destination/${dest.id}`)}
                      className="w-40 flex-shrink-0 bg-card border border-border rounded-lg overflow-hidden hover:-translate-y-0.5 transition-transform cursor-pointer"
                    >
                      {/* Image */}
                      <div className="h-[100px] overflow-hidden">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="font-medium text-foreground">{dest.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center text-xs text-amber-500">
                            <Star className="h-3 w-3 mr-0.5 fill-current" />
                            {dest.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dest.days}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ==================== 主组件 ====================
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录（同时检查 user 和 token）
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!user && !!token);
  }, []);

  // 根据登录状态渲染不同视图
  return isLoggedIn ? <WorkspaceView /> : <GuestView />;
}

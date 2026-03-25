// 今日行程页面
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, List, MapPin, ChevronRight, Navigation, Route, Search as SearchIcon, ChevronDown, Calendar, DollarSign, Clock, Share2, FileText, CheckCircle, Camera, Map, X, Briefcase, Sun, Moon, Cloud, CloudRain, Snowflake, Thermometer, Users, CalendarDays } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { getUserTrips, getTripById, getIoTData, getPackingProgress } from '../api/client';
import PackingListDrawer from '../components/trip/PackingListDrawer';

export default function Today() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packingListVisible, setPackingListVisible] = useState(false);
  const [packingProgress, setPackingProgress] = useState({ total: 0, packed: 0, percentage: 0 });
  const [currentWeather, setCurrentWeather] = useState<any>(null);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadCurrentTrip();
  }, []);

  const loadCurrentTrip = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取用户的所有行程
      const tripsResponse = await getUserTrips();
      if (!tripsResponse.success || !tripsResponse.data) {
        setError('获取行程列表失败');
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 查找当前正在进行的行程（状态为 planning 且日期包含今天）
      const currentTrip = tripsResponse.data.find((trip: any) => {
        if (trip.status !== 'planning') return false;
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
      });

      if (!currentTrip) {
        // 如果没有找到当前行程，查找最近的一个规划中的行程
        const planningTrips = tripsResponse.data.filter((trip: any) => trip.status === 'planning');
        if (planningTrips.length > 0) {
          // 按开始日期排序，取最近的
          planningTrips.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          const response = await getTripById(planningTrips[0].id);
          if (response.success && response.data) {
            setTrip(response.data);
            setCurrentWeather({
              temperature: 22,
              condition: 'sunny',
              humidity: 65,
              wind: 12
            });
          }
        } else {
          setError('暂无行程，请先创建行程');
        }
      } else {
        setTrip(currentTrip);
        setCurrentWeather({
          temperature: 22,
          condition: 'sunny',
          humidity: 65,
          wind: 12
        });
        loadPackingProgress(currentTrip.id);
      }
    } catch (error: any) {
      console.error('加载行程数据失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录');
      } else {
        setError('加载失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPackingProgress = async (tripId: string) => {
    try {
      const result = await getPackingProgress(tripId);
      if (result.success && result.data) {
        setPackingProgress(result.data);
      }
    } catch (error) {
      console.error('加载打包进度失败:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'snowy': return <Snowflake className="w-6 h-6 text-blue-300" />;
      default: return <Thermometer className="w-6 h-6 text-orange-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-livetrip-primary mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {error || '行程不存在'}
          </h3>
          <button
            onClick={() => navigate('/my-trips')}
            className="px-6 py-2 bg-livetrip-primary text-white rounded-lg hover:bg-livetrip-primary-dark transition-colors"
          >
            返回我的行程
          </button>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">{error}</h3>
          <button
            onClick={() => navigate('/my-trips')}
            className="px-6 py-2 bg-livetrip-primary text-white rounded-lg hover:bg-livetrip-primary-dark transition-colors"
          >
            返回我的行程
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Header */}
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
          <button 
            onClick={() => setPackingListVisible(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            title="打包清单"
          >
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            {packingProgress.percentage > 0 && packingProgress.percentage < 100 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
            )}
            {packingProgress.percentage === 100 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">U</div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>User</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isLargeScreen={isLargeScreen} currentPage="/today" />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-4xl mx-auto px-6 py-6 lg:px-7">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-serif text-xl font-semibold text-foreground">今日行程</h1>
              <button
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="text-sm text-livetrip-primary hover:underline"
              >
                查看完整行程 →
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground">{formatDate(trip.startDate)}</p>
          </div>

          {/* Weather Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-livetrip-primary" />
                今日天气
              </h3>
              <span className="text-sm text-muted-foreground">{trip.destination}</span>
            </div>
            <div className="flex items-center gap-6">
              {getWeatherIcon(currentWeather?.condition)}
              <div>
                <div className="text-3xl font-bold text-foreground">{currentWeather?.temperature}°C</div>
                <div className="text-sm text-muted-foreground">湿度 {currentWeather?.humidity}%</div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-foreground">12 km/h</div>
                  <div className="text-xs text-muted-foreground">风速</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">优</div>
                  <div className="text-xs text-muted-foreground">空气</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">适宜</div>
                  <div className="text-xs text-muted-foreground">出行</div>
                </div>
              </div>
            </div>
          </div>

          {/* Packing Progress Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-livetrip-primary" />
                打包进度
              </h3>
              <button
                onClick={() => setPackingListVisible(true)}
                className="text-sm text-livetrip-primary hover:underline"
              >
                查看清单 →
              </button>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">已完成 {packingProgress.packed}/{packingProgress.total} 项</span>
                <span className={`text-sm font-medium ${
                  packingProgress.percentage === 100 ? 'text-green-600' : 
                  packingProgress.percentage >= 50 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {packingProgress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    packingProgress.percentage === 100 ? 'bg-green-500' : 
                    packingProgress.percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${packingProgress.percentage}%` }}
                ></div>
              </div>
            </div>
            {packingProgress.percentage < 100 && (
              <p className="text-xs text-muted-foreground">还有 {packingProgress.total - packingProgress.packed} 项物品未打包</p>
            )}
            {packingProgress.percentage === 100 && (
              <p className="text-xs text-green-600 font-medium">✓ 所有物品已准备就绪！</p>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-livetrip-primary" />
              今日安排
            </h3>
            {trip.days && trip.days.length > 0 && trip.days[0].itineraryItems.length > 0 ? (
              <div className="space-y-4">
                {trip.days[0].itineraryItems.map((item: any, index: number) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(item.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-medium text-foreground mb-1">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {item.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.address}
                          </span>
                        )}
                        {item.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ¥{item.cost}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">今日暂无行程安排</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Packing List Drawer */}
      <PackingListDrawer
        visible={packingListVisible}
        onClose={() => setPackingListVisible(false)}
        tripId={trip?.id || ''}
      />
    </div>
  );
}

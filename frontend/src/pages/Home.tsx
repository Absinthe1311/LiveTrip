// 首页 - LiveTrip 智能旅行规划（最终优化版）

// 人工修复：GLM-4, 2026-4-21
// 修复问题：
// 1. 删除不存在的TotalTravelCard组件导入
// 2. 该组件在components/home/index.ts中未导出
// 3. 修复TypeScript编译错误：Module has no exported member 'TotalTravelCard'
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Home as HomeIcon,
  Plus,
  Sparkles,
  Globe,
  Heart,
  PenLine,
  List,
  MapPin,
  Users,
  Search,
  Bell,
  Settings,
  Sun,
  RefreshCw,
} from 'lucide-react';
import {
  GlassCard,
  PackingList,
  BudgetCard,
  WeatherCard,
  CalendarCard,
  UpcomingTourCard,
  MapWidget,
  SearchBar,
} from '../components/home';
import { API_BASE_URL } from '../config/api';
import LandingHeroSection from '../components/common/LandingHeroSection';
import UserProfileEditModal from '../components/user/UserProfileEditModal';
import SettingsModal from '../components/common/SettingsModal';
import GlobalSidebar from '../components/layout/GlobalSidebar';
import { NotificationBell } from '../components/notification/NotificationBell';
import { useHomepageData } from '../hooks/useHomepageData';

// ==================== 未登录态视图 ====================
function GuestView() {
  return <LandingHeroSection />;
}

// ==================== 已登录态工作台视图（最终优化版） ====================
function WorkspaceView() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // 使用自定义Hook获取数据
  const {
    loading,
    error,
    packingItems,
    packingProgress,
    togglePacked,
    weatherData,
    selectedCity,
    destinationCities,
    changeCity,
    budgetData,
    tripStats,
    upcomingTrips,
    tripDates,
    currentTripId,
    footprintCities,
    hotDestinations,
    searchResults,
    search,
    refreshCache,
  } = useHomepageData();

  // 调试信息
  useEffect(() => {
    console.log('=== Homepage Data Debug ===');
    console.log('destinationCities:', destinationCities);
    console.log('weatherData:', weatherData);
    console.log('upcomingTrips:', upcomingTrips);
    console.log('footprintCities:', footprintCities);
    console.log('========================');
  }, [destinationCities, weatherData, upcomingTrips, footprintCities]);

  // 背景图更换功能状态
  const [bgImage, setBgImage] = useState<string>('/homepage-bg.jpg');

  // 用户信息编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 设置弹窗
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 从 localStorage 读取保存的背景图
  useEffect(() => {
    const savedBg = localStorage.getItem('customBgImage');
    if (savedBg) {
      setBgImage(savedBg);
    }
  }, []);

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // 退出登录后刷新页面，显示未登录态（Landing Page）
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 - 使用裁剪后的图片，完美铺满屏幕 */}
      <div className="fixed inset-0">
        <img
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
        />
      </div>

      {/* 背景遮罩 - 降低模糊度以提高清晰度 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* 主容器 */}
      <div className="relative min-h-screen flex">
        {/* 全局侧边栏 */}
        <GlobalSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* 中间核心区 (60%) - 包含用户信息和搜索 */}
        <main className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'ml-[15%]' : ''}`}>
          <div className="max-w-full h-full flex flex-col">
            {/* 顶部栏 - 搜索框（使用SearchBar组件的功能） */}
            <div className="mb-6 relative z-50">
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  {/* 搜索框 - 使用SearchBar的功能 */}
                  <div className="flex-1">
                    <SearchBar
                      onSearch={search}
                      hotDestinations={hotDestinations}
                      searchResults={searchResults}
                    />
                  </div>

                  {/* 功能图标组 */}
                  <div className="flex items-center gap-2">
                    {/* 刷新按钮 */}
                    <button
                      onClick={refreshCache}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="刷新数据"
                    >
                      <RefreshCw
                        className={`h-5 w-5 text-white/80 ${loading ? 'animate-spin' : ''}`}
                      />
                    </button>

                    {/* 通知按钮 */}
                    <NotificationBell />

                    {/* 设置按钮 */}
                    <button
                      onClick={() => setSettingsModalOpen(true)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Settings className="h-5 w-5 text-white/80" />
                    </button>

                    {/* 主题切换按钮 - Light/Dark */}
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                      <Sun className="h-4 w-4 text-white/80" />
                      <span className="text-xs font-medium text-white/80">Light</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* 第一行卡片 - 重新调整布局 */}
            <div className="grid grid-cols-3 gap-6 mb-4">
              {/* Packing List 卡片 - 缩短宽度 */}
              <div className="col-span-1">
                <PackingList
                  packingItems={packingItems}
                  onItemToggle={togglePacked}
                  onPackingClick={() => currentTripId && navigate(`/trip/${currentTripId}`)}
                />
              </div>

              {/* Weather 卡片 - 放在中间 */}
              <WeatherCard
                city={weatherData?.city}
                temperature={weatherData?.temperature}
                condition={weatherData?.condition}
                humidity={weatherData?.humidity}
                windSpeed={weatherData?.windSpeed}
                pressure={weatherData?.pressure}
                onCityChange={changeCity}
                destinationCities={destinationCities}
              />

              {/* Budget 卡片 - 缩短高度 */}
              <BudgetCard
                title="行程预算"
                totalBudget={budgetData?.total}
                budgetItems={
                  budgetData
                    ? [
                        {
                          category: '交通',
                          amount: budgetData.transportation,
                          percentage: (budgetData.transportation / budgetData.total) * 100 || 0,
                          color: 'bg-red-500',
                        },
                        {
                          category: '住宿',
                          amount: budgetData.accommodation,
                          percentage: (budgetData.accommodation / budgetData.total) * 100 || 0,
                          color: 'bg-yellow-500',
                        },
                        {
                          category: '餐饮',
                          amount: budgetData.food,
                          percentage: (budgetData.food / budgetData.total) * 100 || 0,
                          color: 'bg-blue-500',
                        },
                        {
                          category: '门票',
                          amount: budgetData.tickets,
                          percentage: (budgetData.tickets / budgetData.total) * 100 || 0,
                          color: 'bg-green-500',
                        },
                      ]
                    : undefined
                }
              />
            </div>

            {/* 第二行 - 我的足迹地图（大面积） */}
            <div className="flex-1">
              <MapWidget
                cities={footprintCities}
                onCityClick={useCallback(
                  (city: any) => {
                    // 点击城市标记，跳转到该城市的第一个行程
                    if (city.tripIds.length > 0) {
                      navigate(`/trip/${city.tripIds[0]}`);
                    }
                  },
                  [navigate]
                )}
              />
            </div>
          </div>
        </main>

        {/* 右侧边栏 (25%) - 正确顺序 */}
        <aside
          className={`w-[25%] min-w-[300px] max-w-[400px] p-6 flex flex-col gap-4 ${
            sidebarOpen ? 'block' : 'hidden'
          }`}
        >
          {/* 用户信息卡片 */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              {/* 头像 */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-lg font-semibold">
                {userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userProfile?.nickname?.[0] || userProfile?.username?.[0] || 'U'}</span>
                )}
              </div>

              {/* 用户信息 */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  {userProfile?.nickname || userProfile?.username || '用户'}
                </div>
                <div className="text-xs text-white/60">
                  {userProfile?.bio || '这个人很懒，什么都没写'}
                </div>
              </div>

              {/* 编辑按钮 */}
              <button
                onClick={() => setEditModalOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <PenLine className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* 统计信息 */}
            <div className="mt-4 flex items-center justify-around text-center">
              <div>
                <div className="text-lg font-semibold text-white">
                  {userProfile?.totalTrips || 0}
                </div>
                <div className="text-xs text-white/60">行程</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {userProfile?.totalCities || 0}
                </div>
                <div className="text-xs text-white/60">城市</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <div className="text-lg font-semibold text-white">
                  {userProfile?.completedTrips || 0}
                </div>
                <div className="text-xs text-white/60">已完成</div>
              </div>
            </div>
          </GlassCard>

          {/* 月历组件 */}
          <CalendarCard
            year={new Date().getFullYear()}
            month={new Date().getMonth() + 1}
            tripDates={tripDates}
          />

          {/* 即将出行 */}
          <UpcomingTourCard
            tours={upcomingTrips.map((trip) => ({
              id: trip.id,
              city: trip.destination,
              country: '中国',
              flag: 'CN',
              date: new Date(trip.startDate).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
              }),
              temperature: 20,
              condition: '晴',
              coverImage: undefined, // 后续可以添加城市图片
              onClick: () => navigate(`/trip/${trip.id}`),
            }))}
          />
        </aside>

        {/* 用户信息编辑弹窗 */}
        <UserProfileEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={userProfile || {}}
          onUpdate={fetchUserProfile}
        />

        {/* 设置弹窗 */}
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          onLogout={handleLogout}
          bgImage={bgImage}
          onBgChange={(url) => {
            setBgImage(url);
            localStorage.setItem('customBgImage', url);
          }}
          onBgRemove={() => {
            setBgImage('/homepage-bg.jpg');
            localStorage.removeItem('customBgImage');
          }}
        />
      </div>
    </div>
  );
}

// ==================== 主组件 ====================
function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!user && !!token);
  }, []);

  return isLoggedIn ? <WorkspaceView /> : <GuestView />;
}

export default Home;

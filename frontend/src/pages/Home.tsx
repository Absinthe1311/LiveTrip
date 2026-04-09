// 首页 - LiveTrip 智能旅行规划（最终优化版）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Home as HomeIcon, Plus, Sparkles, Globe, Heart, PenLine, List, MapPin, Users, Search, Bell, Settings, Sun } from "lucide-react";
import {
  GlassCard,
  PackingList,
  BudgetCard,
  WeatherCard,
  CalendarCard,
  UpcomingTourCard,
  LogoutButton,
  TotalTravelCard
} from '../components/home';

// ==================== 未登录态视图 ====================
function GuestView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div
          className="w-[240px] h-full flex items-center justify-center px-5 border-r border-border shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <img
            src="/logo.png"
            alt="LiveTrip Logo"
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="搜索目的地、景点、攻略…"
              className="w-full h-10 pl-4 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button
            onClick={() => navigate('/auth')}
            className="bg-livetrip-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-livetrip-primary-dark transition-colors"
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

// ==================== 已登录态工作台视图（最终优化版） ====================
function WorkspaceView() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/homepage-bg.jpg')",
        }}
      />

      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xl" />

      {/* 主容器 */}
      <div className="relative min-h-screen flex">
        {/* 左侧导航栏 (15%) */}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-[15%] min-w-[200px] max-w-[240px] bg-white/5 backdrop-blur-xl border-r border-white/20 z-40 flex flex-col transition-transform duration-300 ${
            isLargeScreen ? 'translate-x-0' : (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
          }`}
        >
          {/* 品牌区 - 使用logo图片 */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="/logo.png"
                alt="LiveTrip Logo"
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {/* 主菜单 */}
            <div className="mb-4">
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                主菜单
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { navigate('/'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span>首页</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/plan'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>创建行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/ai-features'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>AI 功能</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/destinations'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>热门目的地</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/favorites'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>我的收藏</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 社区 */}
            <div className="mb-4">
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                社区
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { navigate('/blogs'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <PenLine className="h-4 w-4" />
                    <span>旅行博客</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 我的旅行 */}
            <div className="mb-4">
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                我的旅行
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { navigate('/my-trips'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <List className="h-4 w-4" />
                    <span>我的行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/today'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>当前行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { navigate('/collab'); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>协同规划</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* 退出按钮（左下角） */}
          <div className="p-3 border-t border-white/10">
            <LogoutButton />
          </div>
        </aside>

        {/* 中间核心区 (60%) - 包含用户信息和搜索 */}
        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            isLargeScreen ? 'ml-[15%]' : ''
          }`}
        >
          <div className="max-w-full h-full flex flex-col">
            {/* 顶部栏 - 搜索框 */}
            <div className="mb-6">
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  {/* 搜索框 */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="搜索目的地、景点、攻略…"
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                  </div>

                  {/* 功能图标组 */}
                  <div className="flex items-center gap-2">
                    {/* 通知按钮 */}
                    <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Bell className="h-5 w-5 text-white/80" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* 设置按钮 */}
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
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
                <PackingList />
              </div>

              {/* Weather 卡片 - 放在中间 */}
              <WeatherCard />

              {/* Budget 卡片 - 缩短高度 */}
              <BudgetCard />
            </div>

            {/* 第二行 - Most Visited 地图（大面积） */}
            <div className="flex-1">
              <GlassCard className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Most Visited in 2024
                  </h3>
                  <select className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-white/30">
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                </div>

                {/* 地图区域 */}
                <div className="flex-1 bg-white/5 rounded-lg flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <p className="text-4xl mb-4">🌍</p>
                    <p className="text-white/60 text-lg">
                      世界地图预览
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      （待实现 - 将显示旅行足迹地图）
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-white/60">Last Visited</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-white/60">Next Tour</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-white/60">Favorite</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>

        {/* 右侧边栏 (25%) - 正确顺序 */}
        <aside
          className={`w-[25%] min-w-[300px] max-w-[400px] p-6 space-y-4 ${
            isLargeScreen ? 'block' : 'hidden'
          }`}
        >
          {/* 用户信息卡片 */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              {/* 头像 */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-lg font-semibold">
                Z
              </div>

              {/* 用户信息 */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  Zhang Lei
                </div>
                <div className="text-xs text-white/60">
                  Premium User
                </div>
              </div>

              {/* 更多选项 */}
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Settings className="h-4 w-4 text-white/60" />
              </button>
            </div>
          </GlassCard>

          {/* Total Travel 卡片 */}
          <TotalTravelCard />

          {/* 月历组件 */}
          <CalendarCard />

          {/* 即将出行 */}
          <UpcomingTourCard />
        </aside>

        {/* 移动端遮罩 */}
        {sidebarOpen && !isLargeScreen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

// ==================== 主组件 ====================
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!user && !!token);
  }, []);

  return isLoggedIn ? <WorkspaceView /> : <GuestView />;
}

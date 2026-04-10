// 沉浸式毛玻璃布局组件 - 用于所有页面
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Plus, Sparkles, Globe, Heart, PenLine, List, MapPin, Users, Search, Bell, Settings, Sun } from "lucide-react";
import { GlassCard, LogoutButton } from './home';

interface GlassLayoutProps {
  children: ReactNode;
  showSearch?: boolean;
}

export default function GlassLayout({ children, showSearch = true }: GlassLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/homepage-bg.jpg')",
        }}
      />

      {/* 背景遮罩 - 降低模糊度以提高清晰度 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* 主容器 */}
      <div className="relative min-h-screen flex">
        {/* 左侧导航栏 (15%) */}
        <aside className="fixed left-0 top-0 bottom-0 w-[15%] min-w-[200px] max-w-[240px] bg-white/5 backdrop-blur-xl border-r border-white/20 z-40 flex flex-col">
          {/* 品牌区 */}
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
                    onClick={() => navigate('/')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span>首页</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/plan')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>创建行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/ai-features')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>AI 功能</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/destinations')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>热门目的地</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/favorites')}
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
                    onClick={() => navigate('/blogs')}
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
                    onClick={() => navigate('/my-trips')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <List className="h-4 w-4" />
                    <span>我的行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/today')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>当前行程</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/collab')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>协同规划</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* 退出按钮 */}
          <div className="p-3 border-t border-white/10">
            <LogoutButton />
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 ml-[15%] p-6">
          {/* 顶部栏 */}
          {showSearch && (
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

                    {/* 主题切换按钮 */}
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                      <Sun className="h-4 w-4 text-white/80" />
                      <span className="text-xs font-medium text-white/80">Light</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* 页面内容 */}
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

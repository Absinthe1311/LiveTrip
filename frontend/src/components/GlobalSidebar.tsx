// 全局侧边栏组件 - 支持隐藏/显示功能，统一所有页面样式
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Plus,
  Sparkles,
  Globe,
  Heart,
  PenLine,
  List,
  MapPin,
  Users,
  Menu,
  X,
} from 'lucide-react';

interface GlobalSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function GlobalSidebar({ isOpen, onToggle }: GlobalSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (!isLargeScreen) {
      onToggle();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && !isLargeScreen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[15%] min-w-[200px] max-w-[240px] bg-white/10 backdrop-blur-xl border-r border-white/20 z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 品牌区 */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/logo.png"
              alt="LiveTrip Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          {/* 第一部分：主页 */}
          <div className="mb-6">
            <h3 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
              主页
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavClick('/')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span>首页</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 第二部分：探索 */}
          <div className="mb-6">
            <h3 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
              探索
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavClick('/destinations')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/destinations')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Globe className="h-5 w-5" />
                  <span>热门目的地</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/favorites')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/favorites')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Heart className="h-5 w-5" />
                  <span>我的收藏</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/blogs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/blogs')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <PenLine className="h-5 w-5" />
                  <span>旅行博客</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 第三部分：我的旅行 */}
          <div className="mb-6">
            <h3 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
              我的旅行
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavClick('/plan')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/plan')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  <span>创建行程</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/collab')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/collab')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>协同规划</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/my-trips')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/my-trips')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <List className="h-5 w-5" />
                  <span>我的行程</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavClick('/today')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/today')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  <span>当前行程</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 第四部分：AI功能 */}
          <div className="mb-6">
            <h3 className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">
              AI 功能
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavClick('/ai-features')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                    isActive('/ai-features')
                      ? 'bg-[#145F39]/30 text-white border-l-2 border-[#145F39]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                  <span>AI 功能</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* 底部隐藏按钮 */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onToggle}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/10 rounded-xl transition-all duration-300"
            title="隐藏侧边栏"
          >
            <X className="h-5 w-5" />
            <span>隐藏侧边栏</span>
          </button>
        </div>
      </aside>

      {/* 切换按钮（当侧边栏隐藏时显示） */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-50 p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      )}
    </>
  );
}

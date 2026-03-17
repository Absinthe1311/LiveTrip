// 统一的侧边栏组件 - 确保所有页面显示完整的导航
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Plus, Sparkles, Globe, Heart, PenLine, List, MapPin, ChevronRight } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLargeScreen: boolean;
  currentPage?: string;
}

export function Sidebar({ isOpen, onClose, isLargeScreen, currentPage }: SidebarProps) {
  const navigate = useNavigate();

  const isActive = (path: string) => currentPage === path;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-14 bottom-0 w-[240px] bg-white border-r border-border z-40 flex flex-col transition-transform duration-300 ${
          isLargeScreen ? 'translate-x-0' : (isOpen ? 'translate-x-0' : '-translate-x-full')
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-5">
          {/* 主菜单 */}
          <div className="mb-5">
            <h3 className="px-5 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              主菜单
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { navigate('/'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <HomeIcon className="h-5 w-5" />
                  <span>首页</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/plan'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/plan') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/plan') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <Plus className="h-5 w-5" />
                  <span>创建行程</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/ai-features'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/ai-features') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/ai-features') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <Sparkles className="h-5 w-5" />
                  <span>AI 功能</span>
                  <span className="ml-auto bg-primary text-white text-[11px] px-2 py-1 rounded-full font-medium">
                    新
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/destinations'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/destinations') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/destinations') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <Globe className="h-5 w-5" />
                  <span>热门目的地</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/favorites'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/favorites') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/favorites') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <Heart className="h-5 w-5" />
                  <span>我的收藏</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 社区 */}
          <div className="mb-5">
            <h3 className="px-5 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              社区
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { navigate('/blogs'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/blogs') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/blogs') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <PenLine className="h-5 w-5" />
                  <span>旅行博客</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 我的旅行 */}
          <div className="mb-5">
            <h3 className="px-5 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              我的旅行
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { navigate('/my-trips'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/my-trips') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/my-trips') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <List className="h-5 w-5" />
                  <span>我的行程</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/today'); onClose(); }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/today') 
                      ? 'text-primary font-medium bg-secondary' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/today') && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                  <MapPin className="h-5 w-5" />
                  <span>当前行程</span>
                  <span className="ml-auto bg-accent text-white text-[11px] px-2 py-1 rounded-full font-medium">
                    今
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer User Card */}
        <div className="p-4 border-t border-border">
          <button className="w-full flex items-center gap-3.5 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white text-sm font-semibold">
              ZL
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-foreground">Zhang Lei</p>
              <p className="text-[12px] text-muted-foreground">旅行达人 · Lv.4</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </aside>
    </>
  );
}

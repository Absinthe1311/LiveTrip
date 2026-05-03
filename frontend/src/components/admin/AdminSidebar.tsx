// 管理员侧边栏组件
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, CheckSquare, Home, LogOut, ChevronRight } from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLargeScreen: boolean;
  currentPage?: string;
}

export function AdminSidebar({ isOpen, onClose, isLargeScreen, currentPage }: AdminSidebarProps) {
  const navigate = useNavigate();

  const isActive = (path: string) => currentPage === path;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // 获取当前用户信息
  const userStr = localStorage.getItem('user');
  let username = 'Admin';
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      username = user.username || 'Admin';
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !isLargeScreen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-14 bottom-0 w-[240px] bg-white border-r border-border z-40 flex flex-col transition-transform duration-300 ${
          isLargeScreen ? 'translate-x-0' : isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-5">
          {/* 管理功能 */}
          <div className="mb-5">
            <h3 className="px-5 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              管理功能
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    navigate('/admin/spots');
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/admin/spots')
                      ? 'text-primary font-medium bg-secondary'
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/admin/spots') && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  )}
                  <ImageIcon className="h-5 w-5" />
                  <span>景点图片管理</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/admin/review');
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 text-[15px] transition-colors relative ${
                    isActive('/admin/review')
                      ? 'text-primary font-medium bg-secondary'
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {isActive('/admin/review') && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  )}
                  <CheckSquare className="h-5 w-5" />
                  <span>图片审核</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 返回用户界面 */}
          <div className="mb-5">
            <h3 className="px-5 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              导航
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    navigate('/');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3.5 px-5 py-3 text-[15px] text-muted-foreground hover:bg-gray-50 transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span>返回首页</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer User Card */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white text-sm font-semibold">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-medium text-foreground">{username}</p>
              <p className="text-[12px] text-muted-foreground">管理员</p>
            </div>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </aside>
    </>
  );
}

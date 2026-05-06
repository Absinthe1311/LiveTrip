// 顶部栏组件 - 统一的搜索框、通知、设置、个人信息
import React from 'react';
import { Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import GlassCard from './GlassCard';

interface TopBarProps {
  username?: string;
  isDarkMode?: boolean;
  onSearch?: (value: string) => void;
  onNotification?: () => void;
  onSettings?: () => void;
  onThemeToggle?: () => void;
  onProfile?: () => void;
  className?: string;
}

export default function TopBar({
  username = 'Zhang Lei',
  isDarkMode = false,
  onSearch,
  onNotification,
  onSettings,
  onThemeToggle,
  onProfile,
  className = ''
}: TopBarProps) {
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const getAvatarInitials = () => {
    return username?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <GlassCard className={`p-3 ${className}`}>
      <div className="flex items-center gap-4">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="搜索目的地、景点、攻略…"
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
          />
        </div>

        {/* 功能图标组 */}
        <div className="flex items-center gap-2">
          {/* 通知按钮 */}
          <button
            onClick={onNotification}
            className="relative p-2.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            <Bell className="h-5 w-5 text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* 设置按钮 */}
          <button
            onClick={onSettings}
            className="p-2.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            <Settings className="h-5 w-5 text-white" />
          </button>

          {/* 主题切换按钮 */}
          <button
            onClick={onThemeToggle}
            className="p-2.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
          >
            {isDarkMode ? (
              <Moon className="h-5 w-5 text-white" />
            ) : (
              <Sun className="h-5 w-5 text-white" />
            )}
          </button>
        </div>

        {/* 用户信息 */}
        <div
          onClick={onProfile}
          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
        >
          {/* 头像 */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-sm font-semibold">
            {getAvatarInitials()}
          </div>

          {/* 用户名 */}
          <span className="text-sm font-medium text-white">
            {username}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

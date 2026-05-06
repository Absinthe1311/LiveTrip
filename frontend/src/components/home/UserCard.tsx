// 用户卡片组件 - 右上角显示（参考 Dribbble 设计稿）
import React, { useState } from 'react';
import { ChevronDown, LogOut, Settings, User, HelpCircle } from 'lucide-react';

interface UserCardProps {
  username: string;
  level?: string;
  isPremium?: boolean;
  avatar?: string;
  onLogout?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

export default function UserCard({
  username,
  level = '旅行达人',
  isPremium = false,
  avatar,
  onLogout,
  onProfile,
  onSettings,
  onHelp
}: UserCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 获取用户首字母作为头像
  const getAvatarInitials = () => {
    return username?.charAt(0)?.toUpperCase() || 'U';
  };

  // 处理退出登录
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // 默认退出逻辑
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.reload();
    }
    setIsDropdownOpen(false);
  };

  // 处理个人资料点击
  const handleProfile = () => {
    if (onProfile) {
      onProfile();
    }
    setIsDropdownOpen(false);
  };

  // 处理设置点击
  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    }
    setIsDropdownOpen(false);
  };

  // 处理帮助点击
  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      {/* 用户卡片 */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {/* 头像 */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
          {avatar ? (
            <img src={avatar} alt={username} className="w-full h-full rounded-full object-cover" />
          ) : (
            getAvatarInitials()
          )}
        </div>

        {/* 用户信息 */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white leading-tight">
            {username}
          </span>
          <div className="flex items-center gap-1.5">
            {isPremium && (
              <span className="text-[10px] text-amber-400 font-medium">
                Premium
              </span>
            )}
            {level && (
              <span className="text-[10px] text-white/70">
                {level}
              </span>
            )}
          </div>
        </div>

        {/* 下拉箭头 */}
        <ChevronDown
          className={`h-4 w-4 text-white/70 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* 下拉菜单 */}
      {isDropdownOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* 菜单内容 */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* 菜单项 */}
            <div className="py-1">
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4 text-gray-500" />
                <span>个人资料</span>
              </button>

              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                <span>设置</span>
              </button>

              <button
                onClick={handleHelp}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-gray-500" />
                <span>帮助</span>
              </button>

              <div className="border-t border-gray-200 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 退出按钮组件 - 左下角显示（参考 Dribbble 设计稿）
import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onLogout?: () => void;
  className?: string;
}

export default function LogoutButton({
  onLogout,
  className = ''
}: LogoutButtonProps) {
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
  };

  return (
    <button
      onClick={handleLogout}
      className={`w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300 group ${className}`}
    >
      <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" />
      <span className="text-sm font-medium text-red-400 group-hover:text-red-300 transition-colors">
        Logout
      </span>
    </button>
  );
}

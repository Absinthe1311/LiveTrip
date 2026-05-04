/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 路由守卫 - 保护需要登录的路由
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  // 未登录则跳转到登录页
  if (!userStr || !token) {
    return <Navigate to="/auth" replace />;
  }

  const user = JSON.parse(userStr);

  // 管理员不能访问普通用户页面
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

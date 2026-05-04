/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 玻璃拟态卡片组件 - 通用的毛玻璃效果容器
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  onClick,
}: GlassCardProps) {
  // 基础玻璃拟态样式
  const baseStyles = 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl';

  // 悬浮效果
  const hoverStyles = hover
    ? 'hover:scale-[1.02] transition-transform duration-300 cursor-pointer'
    : '';

  // 点击效果
  const clickStyles = onClick ? 'active:scale-[0.98]' : '';

  // 组合所有样式
  const combinedStyles = `${baseStyles} ${hoverStyles} ${clickStyles} ${className}`.trim();

  return (
    <div
      className={combinedStyles}
      onClick={onClick}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {children}
    </div>
  );
}

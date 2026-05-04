// 可全屏地图组件 - 支持原地展开和收起（同时上下和左右拉伸）
import React, { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenMapProps {
  children: React.ReactNode;
  title?: string;
  defaultHeight?: string;
  fullscreenHeight?: string;
  defaultWidth?: string;
  fullscreenWidth?: string;
}

export default function FullscreenMap({
  children,
  title = '路线地图',
  defaultHeight = 'h-48',
  fullscreenHeight = 'h-[600px]',
  defaultWidth = 'w-full',
  fullscreenWidth = 'w-full',
}: FullscreenMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={`bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${
        isFullscreen ? 'ring-2 ring-green-400/50' : ''
      }`}
    >
      {/* 地图标题条 */}
      <div className="bg-black/30 backdrop-blur-sm px-4 py-2 border-b border-white/20 flex items-center justify-between">
        <span className="text-sm text-white font-medium">{title}</span>

        {/* 全屏按钮 */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors group"
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-white/60 group-hover:text-white" />
          ) : (
            <Maximize2 className="w-4 h-4 text-white/60 group-hover:text-white" />
          )}
        </button>
      </div>

      {/* 地图容器 - 动态高度和宽度 */}
      <div
        className={`${isFullscreen ? fullscreenHeight : defaultHeight} ${isFullscreen ? fullscreenWidth : defaultWidth} relative transition-all duration-500`}
      >
        {children}
      </div>
    </div>
  );
}

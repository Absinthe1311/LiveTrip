// 内联备选景点组件 - 展开在景点卡片下方
import React, { useState } from 'react';
import { Star, X, Plus } from 'lucide-react';

interface InlineAlternativeAttractionsProps {
  alternatives: any[];
  onClose: () => void;
  onReplace: (attraction: any) => void;
}

export default function InlineAlternativeAttractions({
  alternatives,
  onClose,
  onReplace
}: InlineAlternativeAttractionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleReplace = async (attraction: any) => {
    setLoadingId(attraction.id);
    try {
      onReplace(attraction);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 border-l-2 border-amber-400/40 ml-6 mt-2 transition-all duration-300">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/60">备选景点</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 text-white/40" />
        </button>
      </div>

      {/* 备选卡片网格 */}
      <div className="grid grid-cols-2 gap-3">
        {alternatives.map((attraction) => (
          <div
            key={attraction.id}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 hover:bg-white/15 hover:border-white/30 transition-all duration-300"
          >
            {/* 顶部：名称 + 评分 */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h5 className="text-sm font-semibold text-white truncate flex-1">
                {attraction.name}
              </h5>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-amber-400">
                  {attraction.rating?.toFixed(1) || '4.5'}
                </span>
              </div>
            </div>

            {/* 分类标签 */}
            {attraction.type && (
              <div className="mb-2">
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white/60">
                  {attraction.type}
                </span>
              </div>
            )}

            {/* 替换按钮 */}
            <button
              onClick={() => handleReplace(attraction)}
              disabled={loadingId === attraction.id}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-1.5 rounded-lg text-center mt-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {loadingId === attraction.id ? '替换中...' : '+ 替换此景点'}
            </button>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {alternatives.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-white/40">暂无备选景点</p>
        </div>
      )}
    </div>
  );
}

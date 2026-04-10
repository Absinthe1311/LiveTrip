// 详细备选景点组件 - 展示更详细的备选景点信息
import React, { useState, useEffect } from 'react';
import { Star, X, MapPin, Wallet, Clock, Image as ImageIcon } from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface DetailedAlternativeAttractionsProps {
  alternatives: any[];
  onClose: () => void;
  onReplace: (attraction: any) => void;
  city?: string;
}

export default function DetailedAlternativeAttractions({
  alternatives,
  onClose,
  onReplace,
  city
}: DetailedAlternativeAttractionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // 加载备选景点图片
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      for (const alt of alternatives) {
        try {
          const response = await getSpotCoverImage(alt.name, city);
          if (response.success && response.data?.imageUrl) {
            urls[alt.id] = response.data.imageUrl;
          }
        } catch (error) {
          console.error(`加载备选景点图片失败 (${alt.name}):`, error);
        }
      }
      setImageUrls(urls);
    };

    if (alternatives.length > 0) {
      loadImages();
    }
  }, [alternatives, city]);

  const handleReplace = async (attraction: any) => {
    setLoadingId(attraction.id);
    try {
      onReplace(attraction);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 border-l-2 border-amber-400/40 ml-6 mt-3 transition-all duration-300">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">备选景点</span>
          <span className="text-xs text-white/40">({alternatives.length}个)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {/* 备选卡片网格 - 2列布局 */}
      <div className="grid grid-cols-2 gap-4">
        {alternatives.map((attraction) => (
          <div
            key={attraction.id}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300"
          >
            {/* 图片区域 */}
            <div className="relative h-24 bg-gradient-to-br from-amber-500/10 to-amber-600/10">
              {imageUrls[attraction.id] ? (
                <img
                  src={imageUrls[attraction.id]}
                  alt={attraction.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-6 h-6 text-white/20" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* 信息区域 */}
            <div className="p-3 space-y-2">
              {/* 名称 */}
              <h5 className="text-sm font-semibold text-white truncate">
                {attraction.name}
              </h5>

              {/* 标签 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 评分 */}
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-amber-400">
                    {attraction.rating?.toFixed(1) || '4.5'}
                  </span>
                </div>

                {/* 分类 */}
                {attraction.type && (
                  <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white/60">
                    {attraction.type}
                  </span>
                )}

                {/* 价格 */}
                {attraction.estimated_cost && attraction.estimated_cost > 0 ? (
                  <span className="bg-green-500/20 text-green-300 rounded-full px-2 py-0.5 text-xs">
                    ¥{attraction.estimated_cost}
                  </span>
                ) : (
                  <span className="bg-green-500/20 text-green-300 rounded-full px-2 py-0.5 text-xs">
                    免费
                  </span>
                )}
              </div>

              {/* 描述 */}
              {attraction.description && (
                <p className="text-xs text-white/50 line-clamp-2">
                  {attraction.description}
                </p>
              )}

              {/* 替换按钮 */}
              <button
                onClick={() => handleReplace(attraction)}
                disabled={loadingId === attraction.id}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-3 py-2 rounded-lg text-center hover:shadow-lg transition-all duration-300 disabled:opacity-50 font-medium"
              >
                {loadingId === attraction.id ? '替换中...' : '替换此景点'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {alternatives.length === 0 && (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-white/40">暂无备选景点</p>
        </div>
      )}
    </div>
  );
}

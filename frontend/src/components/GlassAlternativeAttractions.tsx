// Glass风格备选景点组件
import React, { useState } from 'react';
import { Star, MapPin, Plus, X } from 'lucide-react';
import type { AttractionItem } from '../api/client';

interface AlternativeAttractionsProps {
  originalAttraction: AttractionItem;
  alternatives: Array<{
    id: string;
    name: string;
    description: string;
    location: string;
    estimated_cost: number;
    type?: string;
    address?: string;
    rating?: number;
    iotData?: {
      crowdLevel: number;
      temperature: number;
      rainProbability: number;
      isOpen: boolean;
    };
  }>;
  onClose: () => void;
  onReplace: (newAttraction: any) => void;
  city?: string;
  dayIndex?: number;
  attractionIndex?: number;
}

// Glass风格备选景点卡片
function GlassAlternativeCard({ attraction, onReplace }: {
  attraction: any;
  onReplace: (newAttraction: any) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleReplace = async () => {
    setLoading(true);
    onReplace(attraction);
    setLoading(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300">
      {/* 景点图片区域 */}
      <div className="h-32 bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center relative overflow-hidden">
        <MapPin className="w-12 h-12 text-white/20" />
        {/* 类型标签 */}
        {attraction.type && (
          <div className="absolute top-2 left-2 bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white/70">
            {attraction.type}
          </div>
        )}
      </div>

      {/* 景点信息 */}
      <div className="p-4">
        {/* 标题和评分 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-base font-semibold text-white truncate flex-1">
            {attraction.name}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-amber-400">
              {attraction.rating?.toFixed(1) || '4.5'}
            </span>
          </div>
        </div>

        {/* 描述 */}
        {attraction.description && (
          <p className="text-xs text-white/60 line-clamp-2 mb-3">
            {attraction.description}
          </p>
        )}

        {/* 标签组 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {attraction.estimated_cost && attraction.estimated_cost > 0 && (
            <span className="bg-amber-500/20 rounded-full px-2 py-0.5 text-xs text-amber-400">
              ¥{attraction.estimated_cost}
            </span>
          )}
          {attraction.iotData && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              attraction.iotData.isOpen
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {attraction.iotData.isOpen ? '开放中' : '已关闭'}
            </span>
          )}
        </div>

        {/* 添加按钮 */}
        <button
          onClick={handleReplace}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
          <span>{loading ? '添加中...' : '添加到行程'}</span>
        </button>
      </div>
    </div>
  );
}

export default function GlassAlternativeAttractions({
  originalAttraction,
  alternatives,
  onClose,
  onReplace,
  city,
  dayIndex,
  attractionIndex
}: AlternativeAttractionsProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">备选景点</h3>
          <p className="text-sm text-white/60">
            为 "{originalAttraction.name}" 找到 {alternatives.length} 个备选
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* 备选景点列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {alternatives.map((attraction, index) => (
          <GlassAlternativeCard
            key={attraction.id || index}
            attraction={attraction}
            onReplace={onReplace}
          />
        ))}
      </div>

      {/* 空状态 */}
      {alternatives.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">暂无备选景点</p>
        </div>
      )}
    </div>
  );
}

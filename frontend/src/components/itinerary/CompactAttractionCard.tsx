// 紧凑景点卡片组件 - 中栏时间线
import React, { useState, useEffect } from 'react';
import { MapPin, Building2, UtensilsCrossed, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getSpotCoverImage } from '../../api/client';

interface CompactAttractionCardProps {
  item: any;
  index: number;
  city?: string;
  onShowAlternatives: () => void;
  showAlternatives: boolean;
}

// 根据分类获取图标
const getCategoryIcon = (category?: string) => {
  if (!category) return MapPin;
  const cat = category.toLowerCase();
  if (cat.includes('博物馆') || cat.includes('展览') || cat.includes('文化')) return Building2;
  if (cat.includes('餐厅') || cat.includes('美食') || cat.includes('餐饮')) return UtensilsCrossed;
  return MapPin;
};

export default function CompactAttractionCard({
  item,
  index,
  city,
  onShowAlternatives,
  showAlternatives
}: CompactAttractionCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!item.name) return;
      setImageLoading(true);
      try {
        const response = await getSpotCoverImage(item.name, city);
        if (response.success && response.data?.imageUrl) {
          setImageUrl(response.data.imageUrl);
        }
      } catch (error) {
        console.error(`加载景点图片失败 (${item.name}):`, error);
      } finally {
        setImageLoading(false);
      }
    };
    loadImage();
  }, [item.name, city]);

  const CategoryIcon = getCategoryIcon((item as any).category);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
      <div className="flex gap-3">
        {/* 左侧缩略图/图标 */}
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
          {imageLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b border-amber-400" />
          ) : imageUrl ? (
            <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <CategoryIcon className="w-6 h-6 text-amber-400" />
          )}
        </div>

        {/* 右侧信息区 */}
        <div className="flex-1 min-w-0">
          {/* 第一行：名称 + 时间 */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-base font-semibold text-white truncate">{item.name}</h4>
            <div className="flex items-center gap-1 text-xs text-white/60 flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span>{item.time}</span>
            </div>
          </div>

          {/* 第二行：描述 */}
          {item.description && (
            <p className="text-sm text-white/60 line-clamp-2 mt-1">{item.description}</p>
          )}

          {/* 第三行：标签 + 备选按钮 */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(item as any).category && (
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white/70">
                  {(item as any).category}
                </span>
              )}
              {(!item.estimated_cost || item.estimated_cost === 0) && (
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white/70">
                  免费
                </span>
              )}
            </div>
            <button
              onClick={onShowAlternatives}
              className="text-xs text-amber-400 hover:underline flex-shrink-0"
            >
              备选景点 {showAlternatives ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

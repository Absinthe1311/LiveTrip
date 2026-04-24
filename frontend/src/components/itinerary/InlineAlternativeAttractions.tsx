// 内联备选景点组件 - 展开在景点卡片下方，使用紧凑版卡片样式
import React, { useState } from 'react';
import { X } from 'lucide-react';
import CompactAlternativeSpotCard from './CompactAlternativeSpotCard';

interface InlineAlternativeAttractionsProps {
  alternatives: any[];
  originalItem: any;
  city?: string;
  onClose: () => void;
  onReplace: (attraction: any, originalItem: any) => void;
}

export default function InlineAlternativeAttractions({
  alternatives,
  originalItem,
  city,
  onClose,
  onReplace
}: InlineAlternativeAttractionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleReplace = async (attraction: any) => {
    setLoadingId(attraction.id);
    try {
      onReplace(attraction, originalItem);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 border-l-4 border-amber-400/50 ml-6 mt-3 transition-all duration-300 shadow-lg">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-white/80">备选景点</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* 备选卡片网格 - 使用紧凑版卡片 */}
      <div className="grid grid-cols-2 gap-4">
        {alternatives.map((attraction, index) => (
          <CompactAlternativeSpotCard
            key={attraction.id || index}
            item={{
              ...attraction,
              index: index + 1,
              iotData: attraction.iotData // 传递IoT数据
            }}
            city={city}
            onReplace={() => handleReplace(attraction)}
            imageUrl={attraction.image} // 传递图片URL
          />
        ))}
      </div>

      {/* 空状态 */}
      {alternatives.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-white/40">暂无备选景点</p>
        </div>
      )}
    </div>
  );
}

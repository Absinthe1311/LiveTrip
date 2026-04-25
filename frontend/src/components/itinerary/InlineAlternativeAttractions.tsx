// 内联备选景点组件 - 展开在景点卡片下方，使用紧凑版卡片样式
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CompactAlternativeSpotCard from './CompactAlternativeSpotCard';
import { batchGetSpotImagesByIds } from '../../api/client';

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
  const [spotImages, setSpotImages] = useState<Record<string, string>>({});

  // 加载备选景点图片
  useEffect(() => {
    const loadImages = async () => {
      if (alternatives.length === 0) return;

      // 收集所有景点ID
      const spotIds = alternatives
        .map(alt => alt.spotId || alt.id)
        .filter(id => id);

      if (spotIds.length === 0) return;

      try {
        console.log('📸 加载备选景点图片，景点数:', spotIds.length);
        const response = await batchGetSpotImagesByIds(spotIds);
        
        if (response.success && response.data) {
          const imageMap: Record<string, string> = {};
          response.data.forEach((item: any) => {
            if (item.image) {
              imageMap[item.spotId] = item.image;
            }
          });
          setSpotImages(imageMap);
          console.log('✅ 备选景点图片加载成功:', Object.keys(imageMap).length);
        }
      } catch (error) {
        console.error('❌ 加载备选景点图片失败:', error);
      }
    };

    loadImages();
  }, [alternatives]);

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
        {alternatives.map((attraction, index) => {
          const spotId = attraction.spotId || attraction.id;
          const imageUrl = spotImages[spotId] || attraction.image; // 优先使用加载的图片
          
          return (
            <CompactAlternativeSpotCard
              key={spotId || index}
              item={{
                ...attraction,
                index: index + 1,
                iotData: attraction.iotData // 传递IoT数据
              }}
              city={city}
              onReplace={() => handleReplace(attraction)}
              imageUrl={imageUrl} // 传递图片URL
            />
          );
        })}
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

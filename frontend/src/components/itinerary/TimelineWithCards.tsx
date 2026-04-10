// 时间轴和景点卡片整体部件 - 框在一起更协调
import React, { useState, useEffect, useRef } from 'react';
import ImprovedTimeline from './ImprovedTimeline';
import ImprovedSpotCard from './ImprovedSpotCard';
import InlineAlternativeAttractions from './InlineAlternativeAttractions';
import { AttractionItem } from '../../api/client';

interface TimelineWithCardsProps {
  attractions: AttractionItem[];
  city?: string;
  iotData: any[];
  spotImages?: Record<string, string>; // 景点图片映射
  onShowAlternatives: (item: AttractionItem, city?: string) => void;
  expandedAlternatives: Record<string, any[]>;
  loadingAlternatives: Record<string, boolean>;
  handleCloseAlternatives: (item: AttractionItem) => void;
  handleReplaceAttraction: (params: any) => void;
}

export default function TimelineWithCards({
  attractions,
  city,
  iotData,
  spotImages = {},
  onShowAlternatives,
  expandedAlternatives,
  loadingAlternatives,
  handleCloseAlternatives,
  handleReplaceAttraction
}: TimelineWithCardsProps) {
  const [cardHeights, setCardHeights] = useState<number[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // 获取景点的IoT数据
  const getAttractionIoTData = (item: AttractionItem, allIoTData: any[]) => {
    return allIoTData.find(data => data.spotName === item.name);
  };

  // 处理卡片高度变化
  const handleCardHeightChange = (index: number, height: number) => {
    setCardHeights(prev => {
      const newHeights = [...prev];
      newHeights[index] = height;
      return newHeights;
    });
  };

  return (
    <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/30 shadow-2xl">
      {/* 整体部件标题 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm font-semibold text-white/60">今日行程</span>
        <span className="text-xs text-white/40">({attractions.length}个景点)</span>
      </div>

      {/* 时间轴和景点卡片 */}
      <div className="flex gap-4">
        {/* 左侧：时间轴 */}
        <div className="flex-shrink-0">
          <ImprovedTimeline
            timeSlots={attractions.map(item => item.time)}
            currentIndex={currentCardIndex}
            cardHeights={cardHeights}
          />
        </div>

        {/* 右侧：景点卡片列表 */}
        <div className="flex-1 min-w-0 space-y-6">
          {attractions.map((item, index) => {
            const attractionKey = `${item.name}-${item.time}`;
            const alternatives = expandedAlternatives[attractionKey];
            const isLoading = loadingAlternatives[attractionKey];
            const itemIoTData = getAttractionIoTData(item, iotData);

            return (
              <div key={index}>
                {/* 改进的景点卡片 */}
                <ImprovedSpotCard
                  item={item}
                  index={index}
                  city={city}
                  imageUrl={spotImages[item.id || item.spotId || '']} // 传入图片URL
                  onShowAlternatives={() => {
                    if (expandedAlternatives[attractionKey]) {
                      handleCloseAlternatives(item);
                    } else {
                      onShowAlternatives(item, city);
                    }
                  }}
                  showAlternatives={!!expandedAlternatives[attractionKey]}
                  iotData={itemIoTData}
                  isHovered={currentCardIndex === index}
                  onHeightChange={handleCardHeightChange}
                />

                {/* 备选景点 */}
                {expandedAlternatives[attractionKey] && (
                  <InlineAlternativeAttractions
                    alternatives={alternatives || []}
                    onClose={() => handleCloseAlternatives(item)}
                    onReplace={(newItem) => {
                      handleReplaceAttraction(newItem);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 时间轴和景点卡片整体部件 - 支持拖拽排序
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ImprovedTimeline from './Timeline';
import ImprovedSpotCard from './SpotCardV2';
import InlineAlternativeAttractions from './InlineAlternativeAttractions';
import { AttractionItem } from '../../api/client';

interface TimelineWithCardsProps {
  attractions: AttractionItem[];
  city?: string;
  iotData: any[];
  spotImages?: Record<string, string>;
  onShowAlternatives: (item: AttractionItem, city?: string) => void;
  expandedAlternatives: Record<string, any[]>;
  loadingAlternatives: Record<string, boolean>;
  handleCloseAlternatives: (item: AttractionItem) => void;
  handleReplaceAttraction: (newItem: any, originalItem: any) => void;
  onAttractionsReorder?: (newAttractions: AttractionItem[]) => void;
}

// 可拖拽的景点卡片包装器
function SortableSpotCardWrapper({
  item,
  index,
  city,
  imageUrl,
  onShowAlternatives,
  showAlternatives,
  iotData,
  isHovered,
  onHeightChange,
  alternatives,
  isLoading,
  handleCloseAlternatives,
  handleReplaceAttraction
}: {
  item: AttractionItem;
  index: number;
  city?: string;
  imageUrl?: string;
  onShowAlternatives: () => void;
  showAlternatives: boolean;
  iotData?: any;
  isHovered: boolean;
  onHeightChange: (index: number, height: number) => void;
  alternatives?: any[];
  isLoading?: boolean;
  handleCloseAlternatives: (item: AttractionItem) => void;
  handleReplaceAttraction: (newItem: any, originalItem: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="group relative">
        {/* 拖拽手柄 */}
        <div className="absolute -left-2 top-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* 改进的景点卡片 */}
        <ImprovedSpotCard
          item={item}
          index={index}
          city={city}
          imageUrl={imageUrl}
          onShowAlternatives={onShowAlternatives}
          showAlternatives={showAlternatives}
          iotData={iotData}
          isHovered={isHovered}
          onHeightChange={onHeightChange}
        />

        {/* 备选景点 */}
        {showAlternatives && alternatives && (
          <InlineAlternativeAttractions
            alternatives={alternatives}
            originalItem={item}
            onClose={() => handleCloseAlternatives(item)}
            onReplace={(newItem) => {
              handleReplaceAttraction(newItem, item);
            }}
          />
        )}
      </div>
    </div>
  );
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
  handleReplaceAttraction,
  onAttractionsReorder
}: TimelineWithCardsProps) {
  const [cardHeights, setCardHeights] = useState<number[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 拖拽阈值，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;

      const newAttractions = arrayMove(attractions, oldIndex, newIndex);

      // 通知父组件数组顺序已改变
      if (onAttractionsReorder) {
        onAttractionsReorder(newAttractions);
      }
    }
  };

  // 获取景点的IoT数据
  const getAttractionIoTData = (item: AttractionItem, allIoTData: any[]) => {
    return allIoTData.find(data => data.name === item.name || data.spotName === item.name);
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
        <span className="text-xs text-white/30 ml-2">（可拖拽调整顺序）</span>
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

        {/* 右侧：可拖拽的景点卡片列表 */}
        <div className="flex-1 min-w-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={attractions.map((_, index) => index)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {attractions.map((item, index) => {
                  const attractionKey = `${item.name}-${item.time}`;
                  const alternatives = expandedAlternatives[attractionKey];
                  const isLoading = loadingAlternatives[attractionKey];
                  const itemIoTData = getAttractionIoTData(item, iotData);

                  return (
                    <SortableSpotCardWrapper
                      key={index}
                      item={item}
                      index={index}
                      city={city}
                      imageUrl={spotImages[item.spotId || '']}
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
                      alternatives={alternatives}
                      isLoading={isLoading}
                      handleCloseAlternatives={handleCloseAlternatives}
                      handleReplaceAttraction={handleReplaceAttraction}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}




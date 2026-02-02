import { useState } from 'react';
import { Typography } from 'antd';
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
import AttractionCard from '../components/AttractionCard';
import BudgetChart from '../components/BudgetChart';
import { mockItineraryData, mockBudgetData, DayItinerary, ItineraryItem } from '../data/mockItinerary';

const { Title } = Typography;

// 可拖拽的景点卡片包装组件
function SortableAttractionCard({ item, index }: { item: ItineraryItem; index: number }) {
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
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AttractionCard
        time={item.time}
        name={item.name}
        desc={item.desc}
      />
    </div>
  );
}

// 解析时间段并计算分钟数
function parseTimeRange(timeRange: string): { start: number; end: number; duration: number } {
  const [start, end] = timeRange.split('-').map(t => {
    const [hours, minutes] = t.trim().split(':').map(Number);
    return hours * 60 + minutes;
  });
  return { start, end, duration: end - start };
}

// 将分钟数转换为时间字符串
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 根据新顺序重新分配时间段
function recalculateTimeSlots(items: ItineraryItem[]): ItineraryItem[] {
  if (items.length === 0) return items;

  const newItems = [...items];
  const totalDuration = newItems.reduce((sum, item) => {
    const { duration } = parseTimeRange(item.time);
    return sum + duration;
  }, 0);

  const firstItem = parseTimeRange(items[0].time);
  const lastItem = parseTimeRange(items[items.length - 1].time);

  const totalAvailableTime = lastItem.end - firstItem.start;
  const gaps = totalAvailableTime - totalDuration;

  const gapPerItem = gaps / (items.length + 1);

  let currentTime = firstItem.start;

  return newItems.map(item => {
    const { duration } = parseTimeRange(item.time);
    const start = currentTime + gapPerItem;
    const end = start + duration;
    currentTime = end;

    return {
      ...item,
      time: `${minutesToTime(start)}-${minutesToTime(end)}`,
    };
  });
}

export default function Itinerary() {
  const [itineraryData, setItineraryData] = useState<DayItinerary[]>(mockItineraryData);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItineraryData((items) => {
        const oldIndex = active.id as number;
        const newIndex = over.id as number;

        const newItems = [...items];
        const dayItems = [...newItems[dayIndex].items];
        const reorderedItems = arrayMove(dayItems, oldIndex, newIndex);

        // 重新分配时间段
        newItems[dayIndex] = {
          ...newItems[dayIndex],
          items: recalculateTimeSlots(reorderedItems),
        };

        return newItems;
      });
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Title level={2} style={{
        textAlign: 'center',
        marginBottom: '32px',
        color: '#333'
      }}>
        我的行程
      </Title>

      <div style={{ marginBottom: '40px' }}>
        {itineraryData.map((day, dayIndex) => (
          <div key={day.day} style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '16px 24px',
              borderRadius: '8px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                marginRight: '16px'
              }}>
                第{day.day}天
              </div>
              <div style={{
                fontSize: '16px',
                opacity: 0.95
              }}>
                {day.date}
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event, dayIndex)}
            >
              <SortableContext
                items={day.items.map((_, index) => index)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{
                  position: 'relative',
                  paddingLeft: '32px'
                }}>
                  {/* 时间轴 */}
                  <div style={{
                    position: 'absolute',
                    left: '8px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: 'linear-gradient(to bottom, #667eea 0%, #764ba2 100%)'
                  }} />

                  {day.items.map((item, index) => (
                    <div key={index} style={{
                      position: 'relative',
                      marginBottom: '24px'
                    }}>
                      {/* 时间轴节点 */}
                      <div style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '20px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#667eea',
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 3px #667eea'
                      }} />
                      <SortableAttractionCard item={item} index={index} />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>

      <BudgetChart data={mockBudgetData} />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Typography, Button, Modal, message } from 'antd';
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
import { useAppStore } from '../store';
import { FullItinerary, AttractionItem } from '../api/client';
import { adjustItinerary, getIoTData } from '../api/client';

const { Title } = Typography;

// 可拖拽的景点卡片包装组件
function SortableAttractionCard({ item, index, onShowAlternatives }: { item: AttractionItem; index: number; onShowAlternatives: (item: AttractionItem) => void }) {
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
        desc={item.description}
        onShowAlternatives={() => onShowAlternatives(item)}
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
  const currentItinerary = useAppStore((state) => state.currentItinerary);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState<AttractionItem | null>(null);
  const [adjustResult, setAdjustResult] = useState<any>(null);

  // 从 store 加载行程数据
  useEffect(() => {
    console.log('📍 Itinerary 页面加载');
    console.log('📦 Store 中的行程数据:', currentItinerary);
    
    if (currentItinerary) {
      console.log('✅ 找到行程数据，设置到页面状态');
      setItineraryData(currentItinerary);
    } else {
      console.warn('⚠️  Store 中没有行程数据');
    }
  }, [currentItinerary]);

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

    if (over && active.id !== over.id && itineraryData) {
      setItineraryData((items) => {
        const oldIndex = active.id as number;
        const newIndex = over.id as number;

        const newItems = { ...items };
        const dayItems = [...newItems.itinerary[dayIndex].attractions];
        const reorderedItems = arrayMove(dayItems, oldIndex, newIndex);

        // 重新分配时间段
        newItems.itinerary[dayIndex] = {
          ...newItems.itinerary[dayIndex],
          attractions: recalculateTimeSlots(reorderedItems),
        };

        return newItems;
      });
    }
  };

  // 显示备选景点
  const handleShowAlternatives = async (item: AttractionItem) => {
    setSelectedAttraction(item);
    setAdjustResult(null);

    try {
      // 获取 IoT 数据
      const iotResponse = await getIoTData();
      const spot = iotResponse.data.spots.find((s: any) => s.name === item.name);

      if (!spot) {
        message.warning('未找到该景点的 IoT 数据');
        return;
      }

      // 判断调整原因
      let reason: 'crowd' | 'weather' | 'closed' = 'crowd';
      if (spot.rainProbability > 70) {
        reason = 'weather';
      } else if (!spot.isOpen) {
        reason = 'closed';
      }

      // 调用调整接口
      if (itineraryData) {
        const response = await adjustItinerary({
          itinerary: itineraryData,
          reason,
          targetAttractionId: spot.id,
        });

        if (response.success) {
          setAdjustResult(response.data);
          setAdjustModalVisible(true);
        } else {
          message.info(response.data.message || '无需调整');
        }
      }
    } catch (error: any) {
      console.error('❌ 调整行程失败:', error);
      message.error(error.response?.data?.error || '调整行程失败，请稍后重试');
    }
  };

  // 应用调整
  const handleApplyAdjustment = () => {
    if (adjustResult && adjustResult.adjustedItinerary) {
      setItineraryData(adjustResult.adjustedItinerary);
      setCurrentItinerary(adjustResult.adjustedItinerary);
      setAdjustModalVisible(false);
      message.success('行程调整成功！');
    }
  };

  if (!itineraryData) {
    return (
      <div style={{
        padding: '100px 24px',
        textAlign: 'center',
        color: '#999'
      }}>
        <h2>暂无行程数据</h2>
        <p>请先在规划页面生成行程</p>
      </div>
    );
  }

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
        {itineraryData.itinerary.map((day, dayIndex) => (
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
                items={day.attractions.map((_, index) => index)}
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

                  {day.attractions.map((item, index) => (
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
                      <SortableAttractionCard 
                        item={item} 
                        index={index} 
                        onShowAlternatives={handleShowAlternatives}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>

      {/* 预算图表 */}
      <BudgetChart data={[
        { category: '交通', amount: itineraryData.budget_breakdown.transportation },
        { category: '住宿', amount: itineraryData.budget_breakdown.accommodation },
        { category: '餐饮', amount: itineraryData.budget_breakdown.dining },
        { category: '门票', amount: itineraryData.budget_breakdown.tickets },
      ]} />

      {/* 调整建议弹窗 */}
      <Modal
        title="行程调整建议"
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAdjustModalVisible(false)}>
            取消
          </Button>,
          <Button key="apply" type="primary" onClick={handleApplyAdjustment}>
            应用调整
          </Button>,
        ]}
      >
        {adjustResult && adjustResult.adjustments.length > 0 && (
          <div>
            <p><strong>调整原因：</strong>{adjustResult.message}</p>
            <p><strong>原景点：</strong>{adjustResult.adjustments[0].originalAttraction.name}</p>
            <p><strong>新景点：</strong>{adjustResult.adjustments[0].newAttraction.name}</p>
            <p><strong>景点描述：</strong>{adjustResult.adjustments[0].newAttraction.description}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

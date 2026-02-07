import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Modal, message, Row, Col, Dropdown, Avatar, Spin } from 'antd';
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
import { EnvironmentOutlined } from '@ant-design/icons';
import AttractionCard from '../components/AttractionCard';
import BudgetChart from '../components/BudgetChart';
import { useAppStore } from '../store';
import { FullItinerary, AttractionItem } from '../api/client';
import { adjustItinerary, getIoTData, saveTrip } from '../api/client';
import AMapLoader from '@amap/amap-jsapi-loader';

const { Title } = Typography;

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
  }
}

// 地图组件
function DayMap({ day }: { day: any }) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const polylinesRef = React.useRef<any[]>([]);
  const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
  const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

  useEffect(() => {
    if (!mapContainer.current || !amapKey || !day || !day.attractions) return;

    // 设置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: amapSecret,
    };

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale']
    }).then((AMap) => {
      // 计算中心点
      const coordinates = day.attractions.map((item: any) =>
        item.location.split(',').map(Number)
      );

      const centerLng = coordinates.reduce((sum: number, coords: number[]) => sum + coords[0], 0) / coordinates.length;
      const centerLat = coordinates.reduce((sum: number, coords: number[]) => sum + coords[1], 0) / coordinates.length;

      const map = new AMap.Map(mapContainer.current, {
        zoom: 14,
        center: [centerLng, centerLat],
        viewMode: '2D',
        mapStyle: 'amap://styles/normal',
        features: ['bg', 'road', 'building', 'point'], // 显示背景、道路、建筑、兴趣点
        showLabel: true, // 显示文字标注
        showIndoorMap: false, // 不显示室内地图
      });

      mapRef.current = map;

      // 添加工具栏
      map.addControl(new AMap.ToolBar({
        position: {
          top: '10px',
          right: '10px'
        }
      }));

      // 添加比例尺
      map.addControl(new AMap.Scale());

      // 添加景点标记
      day.attractions.forEach((item: any, index: number) => {
        const coords = item.location.split(',').map(Number);

        const marker = new AMap.Marker({
          position: coords,
          title: item.name,
          content: `
            <div style="
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: bold;
              font-size: 14px;
            ">
              ${index + 1}
            </div>
          `,
          offset: new AMap.Pixel(-18, -18),
          zIndex: 100
        });

        // 点击标记显示信息窗口
        marker.on('click', () => {
          const infoWindow = new AMap.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${item.name}</h3>
                <p style="margin: 4px 0; color: #667eea; font-weight: 500;">${item.time}</p>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">${item.description || ''}</p>
              </div>
            `,
            offset: new AMap.Pixel(0, -30)
          });
          infoWindow.open(map, coords);
        });

        map.add(marker);
        markersRef.current.push(marker);
      });

      // 添加景点之间的路线
      if (day.attractions.length > 1) {
        const path = day.attractions.map((item: any) =>
          item.location.split(',').map(Number)
        );

        const polyline = new AMap.Polyline({
          path: path,
          borderWeight: 2,
          strokeColor: '#667eea',
          lineJoin: 'round',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          strokeStyle: 'solid',
          zIndex: 50
        });

        map.add(polyline);
        polylinesRef.current.push(polyline);
      }

      // 自适应显示所有标记
      map.setFitView();

    }).catch((e) => {
      console.error('高德地图加载失败:', e);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, [day, amapKey]);

  return (
    <div style={{
      width: '100%',
      height: '500px',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      {!amapKey && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          zIndex: 1000
        }}>
          高德地图 Key 未配置
        </div>
      )}
    </div>
  );
}

// 可拖拽的景点卡片包装组件
function SortableAttractionCard({ 
  item, 
  index, 
  onShowAlternatives,
  onTimeChange 
}: { 
  item: AttractionItem; 
  index: number; 
  onShowAlternatives: (item: AttractionItem) => void;
  onTimeChange?: (index: number, newTime: string) => void;
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
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : undefined,
  };

  // 计算推荐游玩时长（从时间段中提取）
  const recommendedDuration = (() => {
    const { duration } = parseTimeRange(item.time);
    return duration;
  })();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AttractionCard
        time={item.time}
        name={item.name}
        desc={item.description}
        onShowAlternatives={() => onShowAlternatives(item)}
        onTimeChange={(newTime) => onTimeChange?.(index, newTime)}
        recommendedDuration={recommendedDuration}
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

// 将分钟数转换为时间字符串，处理跨天情况
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours % 24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 检查时间是否在合理范围内（00:00 - 23:59）
function isValidTime(minutes: number): boolean {
  return minutes >= 0 && minutes < 24 * 60;
}

// 根据新顺序重新分配时间段
// 修复：使用固定的起始时间（早上 9:00），而不是第一个景点的时间
function recalculateTimeSlots(items: AttractionItem[]): AttractionItem[] {
  if (items.length === 0) return items;

  const newItems = [...items];

  // 使用固定的起始时间（早上 9:00）
  const START_TIME = 9 * 60; // 9:00 = 540 分钟

  // 定义景点之间的间隔时间(分钟)
  const TRAVEL_TIME = 30; // 景点之间移动时间 30 分钟
  const LUNCH_TIME = 60; // 午餐时间 60 分钟

  let currentTime = START_TIME;

  return newItems.map((item, index) => {
    const { duration } = parseTimeRange(item.time);
    
    // 如果时间超过一天限制，停止计算
    if (!isValidTime(currentTime)) {
      return {
        ...item,
        time: '时间超出范围',
      };
    }

    const start = currentTime;
    const end = start + duration;

    // 计算下一个景点的开始时间
    // 如果是上午最后一个景点(假设12:00左右),添加午餐时间
    const nextStart = end + TRAVEL_TIME;

    // 检查是否需要添加午餐时间
    // 如果当前景点结束时间在 11:30-13:30 之间,添加午餐时间
    if (end >= 11 * 60 + 30 && end <= 13 * 60 + 30) {
      currentTime = end + LUNCH_TIME;
    } else {
      currentTime = nextStart;
    }

    // 如果结束时间超过 23:59，显示警告
    if (end >= 24 * 60) {
      return {
        ...item,
        time: `${minutesToTime(start)}-${minutesToTime(end)} (跨天)`,
      };
    }

    return {
      ...item,
      time: `${minutesToTime(start)}-${minutesToTime(end)}`,
    };
  });
}

export default function Itinerary() {
  const navigate = useNavigate();
  const currentItinerary = useAppStore((state) => state.currentItinerary);
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustResult, setAdjustResult] = useState<any>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // 从 store 加载行程数据
  useEffect(() => {
    console.log('📍 Itinerary 页面加载');
    console.log('📦 Store 中的行程数据:', currentItinerary);
    
    if (currentItinerary) {
      console.log('✅ 找到行程数据，设置到页面状态');
      setItineraryData(currentItinerary);
    } else {
      console.warn('⚠️  Store 中没有行程数据，显示空状态');
    }
  }, [currentItinerary]);

  // 确认行程并返回主页
  const handleConfirmItinerary = async () => {
    setConfirming(true);

    try {
      console.log('💾 保存行程到数据库...');

      // 保存行程到数据库
      const response = await saveTrip({
        summary: itineraryData.summary,
        itinerary: itineraryData,
        total_cost: itineraryData.total_cost,
        budget_breakdown: itineraryData.budget_breakdown,
      });

      if (response.success) {
        console.log('✅ 行程保存成功:', response.data);
        message.success('行程已保存');
        navigate('/');
      } else {
        console.error('❌ 行程保存失败:', response.error);
        message.error('行程保存失败');
        setConfirming(false);
      }
    } catch (error: any) {
      console.error('❌ 保存行程失败:', error);
      message.error('保存行程失败，请稍后重试');
      setConfirming(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    window.location.href = '/';
  };

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
        if (!items) return items;

        const oldIndex = active.id as number;
        const newIndex = over.id as number;

        const newItems = { ...items };
        if (!newItems.itinerary) return newItems;

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

  // 处理时间修改
  const handleTimeChange = (dayIndex: number, attractionIndex: number, newTime: string) => {
    if (!itineraryData) return;

    setItineraryData((items) => {
      if (!items) return items;

      const newItems = { ...items };
      if (!newItems.itinerary) return newItems;

      // 更新指定景点的时间
      newItems.itinerary[dayIndex].attractions[attractionIndex] = {
        ...newItems.itinerary[dayIndex].attractions[attractionIndex],
        time: newTime,
      };

      return newItems;
    });
  };

  // 显示备选景点
  const handleShowAlternatives = async (item: AttractionItem) => {
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
      maxWidth: '1600px',
      margin: '0 auto',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <Title level={2} style={{
          margin: 0,
          color: '#333'
        }}>
          我的行程
        </Title>
      </div>

      <Row gutter={24}>
        <Col span={showMap ? 14 : 24}>
          <div style={{ marginBottom: '40px' }}>
            {itineraryData.itinerary.map((day, dayIndex) => (
              <div key={day.day} style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
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
                  <Button
                    type="primary"
                    icon={<EnvironmentOutlined />}
                    onClick={() => {
                      setSelectedDayIndex(dayIndex);
                      setShowMap(!showMap);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderColor: 'rgba(255,255,255,0.4)',
                      color: '#fff'
                    }}
                  >
                    {showMap && selectedDayIndex === dayIndex ? '隐藏地图' : '查看地图'}
                  </Button>
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
                        onTimeChange={(attrIndex, newTime) => handleTimeChange(dayIndex, attrIndex, newTime)}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ))}
      </div>
        </Col>

        {/* 右侧地图 */}
        {showMap && selectedDayIndex !== null && (
          <Col span={10}>
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '24px'
            }}>
              <h3 style={{
                marginBottom: '16px',
                color: '#333',
                fontSize: '18px',
                fontWeight: 600
              }}>
                第{itineraryData.itinerary[selectedDayIndex].day}天行程地图
              </h3>
              <DayMap day={itineraryData.itinerary[selectedDayIndex]} />
            </div>
          </Col>
        )}
      </Row>

      {/* 预算图表 */}
      <BudgetChart data={[
        { category: '交通', amount: itineraryData.budget_breakdown.transportation },
        { category: '住宿', amount: itineraryData.budget_breakdown.accommodation },
        { category: '餐饮', amount: itineraryData.budget_breakdown.dining },
        { category: '门票', amount: itineraryData.budget_breakdown.tickets },
      ]} />

      {/* 确认按钮 */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
        borderRadius: '12px',
        border: '1px solid #667eea30',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '16px',
          color: '#333',
          marginBottom: '16px',
          margin: 0
        }}>
          💡 确认后行程将保存到数据库
        </p>
        <Button
          type="primary"
          size="large"
          loading={confirming}
          onClick={handleConfirmItinerary}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            minWidth: '200px'
          }}
        >
          确认并返回主页
        </Button>
      </div>

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

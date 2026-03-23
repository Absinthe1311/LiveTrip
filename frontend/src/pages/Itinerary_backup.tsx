import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Modal, message, Row, Col, Dropdown, Avatar, Spin, Tag, Popconfirm } from 'antd';
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
import { EnvironmentOutlined, CheckCircleOutlined, EditOutlined, CameraOutlined } from '@ant-design/icons';
import AttractionCard from '../components/AttractionCard';
import AlternativeAttractions from '../components/AlternativeAttractions';
import BudgetChart from '../components/BudgetChart';
import HotelRecommendations from '../components/HotelRecommendations';
import RestaurantRecommendations from '../components/RestaurantRecommendations';
import ShareButton from '../components/ShareButton';
import PDFExportButton from '../components/PDFExportButton';
import SpotImageUploadModal from '../components/SpotImageUploadModal';
import { useAppStore } from '../store';
import { FullItinerary, AttractionItem, calculateRealTimeBudget, completeTrip } from '../api/client';
import { adjustItinerary, getIoTData, saveTrip, updateAlternativeRelations } from '../api/client';
import { Hotel, Restaurant, DayRestaurantRecommendation } from '../api/recommendationApi';
import AMapLoader from '@amap/amap-jsapi-loader';
import { alternativeRecommender } from '../services/alternativeRecommender';

const { Title } = Typography;

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
  }
}

// 地图组件
function DayMap({ day, hotel, restaurant }: { day: any; hotel?: Hotel | null; restaurant?: Restaurant | null }) {
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
      // 计算中心点（包含酒店和餐厅位置）
      const coordinates = day.attractions.map((item: any) =>
        item.location.split(',').map(Number)
      );
      
      // 如果有酒店，也加入中心点计算
      if (hotel?.location) {
        coordinates.push(hotel.location.split(',').map(Number));
      }
      
      // 如果有餐厅，也加入中心点计算
      if (restaurant?.location) {
        coordinates.push(restaurant.location.split(',').map(Number));
      }

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

      // 添加餐厅标记（如果有）
      if (restaurant?.location) {
        const restaurantCoords = restaurant.location.split(',').map(Number);
        
        const restaurantMarker = new AMap.Marker({
          position: restaurantCoords,
          title: restaurant.name,
          content: `
            <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: bold;
              font-size: 16px;
            ">
              🍽️
            </div>
          `,
          offset: new AMap.Pixel(-20, -20),
          zIndex: 140
        });

        // 点击餐厅标记显示信息窗口
        restaurantMarker.on('click', () => {
          const infoWindow = new AMap.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🍽️ ${restaurant.name}</h3>
                <p style="margin: 4px 0; color: #52c41a; font-weight: 500;">${restaurant.type || '餐厅'}</p>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">${restaurant.address || ''}</p>
                ${restaurant.rating ? `<p style="margin: 4px 0; color: #faad14; font-size: 13px;">⭐ ${restaurant.rating}分</p>` : ''}
              </div>
            `,
            offset: new AMap.Pixel(0, -30)
          });
          infoWindow.open(map, restaurantCoords);
        });

        map.add(restaurantMarker);
        markersRef.current.push(restaurantMarker);
      }

      // 添加酒店标记（如果有）
      if (hotel?.location) {
        const hotelCoords = hotel.location.split(',').map(Number);
        
        const hotelMarker = new AMap.Marker({
          position: hotelCoords,
          title: hotel.name,
          content: `
            <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: bold;
              font-size: 16px;
            ">
              🏨
            </div>
          `,
          offset: new AMap.Pixel(-20, -20),
          zIndex: 150
        });

        // 点击酒店标记显示信息窗口
        hotelMarker.on('click', () => {
          const infoWindow = new AMap.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🏨 ${hotel.name}</h3>
                <p style="margin: 4px 0; color: #ff6b6b; font-weight: 500;">${hotel.type || '酒店'}</p>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">${hotel.address || ''}</p>
                ${hotel.rating ? `<p style="margin: 4px 0; color: #faad14; font-size: 13px;">⭐ ${hotel.rating}分</p>` : ''}
              </div>
            `,
            offset: new AMap.Pixel(0, -30)
          });
          infoWindow.open(map, hotelCoords);
        });

        map.add(hotelMarker);
        markersRef.current.push(hotelMarker);
      }

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
  }, [day, amapKey, hotel, restaurant]);

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
  dayIndex,
  attractionIndex,
  onShowAlternatives,
  onTimeChange,
  city,
  iotData
}: { 
  item: AttractionItem; 
  index: number; 
  dayIndex: number;
  attractionIndex: number;
  onShowAlternatives: (item: AttractionItem, city?: string) => void;
  onTimeChange?: (index: number, newTime: string) => void;
  city?: string;
  iotData?: any[];
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
        onShowAlternatives={() => onShowAlternatives(item, city)}
        onTimeChange={(newTime) => onTimeChange?.(index, newTime)}
        recommendedDuration={recommendedDuration}
        iotData={getAttractionIoTData(item, iotData)}
        item={item}
      />
    </div>
  );
}

// 获取景点的IoT数据
function getAttractionIoTData(attraction: AttractionItem, iotDataList: any[]): any {
  if (!iotDataList || iotDataList.length === 0) {
    return null;
  }
  
  // 通过景点名称匹配IoT数据
  const iotData = iotDataList.find((data: any) => data.name === attraction.name);
  
  if (!iotData) {
    return null;
  }
  
  return {
    crowdLevel: iotData.crowdLevel,
    temperature: iotData.temperature,
    rainProbability: iotData.rainProbability,
    isOpen: iotData.isOpen,
  };
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
  const completeTripInStore = useAppStore((state) => state.completeTrip);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustResult, setAdjustResult] = useState<any>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tripId, setTripId] = useState<string>(''); // 行程ID(保存后才有)
  const [isSavedTrip, setIsSavedTrip] = useState(false); // 是否是已保存的行程
  const [tripStatus, setTripStatus] = useState<'planning' | 'completed'>('planning'); // 行程状态
  const [completing, setCompleting] = useState(false); // 完成行程中
  const [uploadModalVisible, setUploadModalVisible] = useState(false); // 上传图片弹窗
  const [selectedSpot, setSelectedSpot] = useState<AttractionItem | null>(null); // 选中的景点

  // 备选景点相关状态
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, any>>({});
  const [iotData, setIotData] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<Record<string, boolean>>({});

  // 酒店推荐相关状态
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hotelRecommendations, setHotelRecommendations] = useState<Hotel[]>([]); // 所有酒店推荐

  // 餐厅推荐相关状态
  const [selectedRestaurants, setSelectedRestaurants] = useState<Record<number, Restaurant | null>>({});
  const [restaurantRecommendations, setRestaurantRecommendations] = useState<DayRestaurantRecommendation[]>([]); // 所有餐厅推荐
  const [hotelRecommendationLoaded, setHotelRecommendationLoaded] = useState(false); // 酒店推荐是否已加载完成

  // 预算相关状态
  const [budgetInfo, setBudgetInfo] = useState<any>(null);

  // 从 store 加载行程数据
  useEffect(() => {
    console.log('📍 Itinerary 页面加载');
    console.log('📦 Store 中的行程数据:', currentItinerary);

    if (currentItinerary) {
      console.log('✅ 找到行程数据，设置到页面状态');
      setItineraryData(currentItinerary);

      // 检查是否是已保存的行程
      if (currentItinerary.isSavedTrip) {
        setIsSavedTrip(true);
        if (currentItinerary.tripId) {
          setTripId(currentItinerary.tripId);
        }
      }

      // 检查行程状态（是否已完成）
      if (currentItinerary.status === 'completed') {
        setTripStatus('completed');
      }

      // 从行程数据中恢复酒店信息
      if (currentItinerary.hotel) {
        console.log('🏨 恢复酒店信息:', currentItinerary.hotel);
        setSelectedHotel(currentItinerary.hotel);
      }

      // 从行程数据中恢复餐厅信息
      if (currentItinerary.restaurants) {
        console.log('🍽️ 恢复餐厅信息:', currentItinerary.restaurants);
        const restaurantsMap: Record<number, Restaurant | null> = {};
        currentItinerary.restaurants.forEach((r: any) => {
          if (r.selectedRestaurant) {
            restaurantsMap[r.day] = r.selectedRestaurant;
          }
        });
        setSelectedRestaurants(restaurantsMap);
      }

      // 加载IoT数据
      loadIoTData();

      // 计算实时预算
      calculateBudget();
    } else {
      console.warn('⚠️  Store 中没有行程数据，显示空状态');
    }
  }, [currentItinerary]);

  // 加载IoT数据
  const loadIoTData = async () => {
    try {
      console.log('📡 加载IoT数据...');
      const response = await getIoTData();
      if (response.success && response.data) {
        setIotData(response.data.spots);
        console.log('✅ IoT数据加载成功，景点数量:', response.data.spots.length);
      }
    } catch (error) {
      console.error('❌ 加载IoT数据失败:', error);
    }
  };

  // 计算实时预算
  const calculateBudget = async () => {
    if (!itineraryData) return;

    try {
      console.log('💰 计算实时预算...');

      const days = itineraryData.itinerary.length;
      const totalBudget = itineraryData.summary?.budget || itineraryData.total_cost || 10000;
      const groupSize = itineraryData.summary?.group_size || 1;

      // 收集所有景点费用
      const spots = itineraryData.itinerary.flatMap(day =>
        day.attractions.map(attr => ({
          estimated_cost: attr.estimated_cost || 0,
        }))
      );

      const response = await calculateRealTimeBudget({
        totalBudget,
        days,
        groupSize,
        hotel: selectedHotel,
        restaurants: selectedRestaurants,
        spots,
      });

      if (response.success && response.data) {
        setBudgetInfo(response.data);
        console.log('✅ 实时预算计算完成:', response.data);
      }
    } catch (error: any) {
      console.error('❌ 计算实时预算失败:', error);
    }
  };

  // 当酒店或餐厅选择变化时，重新计算预算
  useEffect(() => {
    calculateBudget();
  }, [selectedHotel, selectedRestaurants]);

  // 确认行程并返回主页
  const handleConfirmItinerary = async () => {
    setConfirming(true);

    try {
      console.log('💾 保存行程到数据库...');
      console.log('🏨 选中的酒店:', selectedHotel);
      console.log('🍽️ 选中的餐厅:', selectedRestaurants);

      // 构建餐厅数据
      const restaurantsData = itineraryData.itinerary.map((day) => ({
        day: day.day,
        selectedRestaurant: selectedRestaurants[day.day] || null,
      }));

      // 保存行程到数据库（包含酒店和餐厅信息及推荐缓存）
      const response = await saveTrip({
        summary: itineraryData.summary,
        itinerary: itineraryData,
        total_cost: itineraryData.total_cost,
        budget_breakdown: itineraryData.budget_breakdown,
        hotel: selectedHotel,
        restaurants: restaurantsData,
        hotelRecommendations: hotelRecommendations, // 添加酒店推荐缓存
        restaurantRecommendations: restaurantRecommendations, // 添加餐厅推荐缓存
      });

      if (response.success) {
        console.log('✅ 行程保存成功:', response.data);
        message.success('行程已保存');
        // 设置tripId(用于分享功能)
        if (response.data.tripId) {
          setTripId(response.data.tripId);
        }
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

  // 显示备选景点列表
  const handleShowAlternatives = async (item: AttractionItem, city?: string) => {
    console.log('🔍 handleShowAlternatives 接收到 item:', item);
    console.log('🔍 item.name:', item.name);
    
    const attractionKey = `${item.name}-${item.time}`;
    
    console.log('🔍 attractionKey:', attractionKey);
    
    // 如果已经展开，则收起
    if (expandedAlternatives[attractionKey]) {
      setExpandedAlternatives(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[attractionKey];
        return newExpanded;
      });
      return;
    }

    // 展开备选列表
    setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: true }));
    
    try {
      console.log('🔍 查看备选景点:', item.name);
      console.log('   城市:', city || '未指定');
      
      // 获取行程中所有景点的名称（用于排除）
      const allSpotNames = itineraryData.itinerary.flatMap(day => 
        day.attractions.map(attr => attr.name)
      );
      
      console.log('   行程中的景点:', allSpotNames.join(', '));
      
      // 使用推荐服务获取备选景点
      const recommendations = await alternativeRecommender.getRecommendations(
        item, 
        iotData, 
        city,
        allSpotNames // 传递行程中的景点名称列表
      );
      
      console.log('✅ 获取到备选景点:', recommendations.length);
      
      setExpandedAlternatives(prev => ({
        ...prev,
        [attractionKey]: recommendations
      }));
    } catch (error: any) {
      console.error('❌ 获取备选景点失败:', error);
      message.error('获取备选景点失败，请稍后重试');
    } finally {
      setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: false }));
    }
  };

  // 关闭备选列表
  const handleCloseAlternatives = (item: AttractionItem) => {
    const attractionKey = `${item.name}-${item.time}`;
    setExpandedAlternatives(prev => {
      const newExpanded = { ...prev };
      delete newExpanded[attractionKey];
      return newExpanded;
    });
  };

  // 替换景点
  const handleReplaceAttraction = async (params: any, originalItemParam?: any, newItemParam?: any) => {
    let dayIndex: number, attractionIndex: number, originalItem: AttractionItem, newItem: any, skipConfirm: boolean;

    console.log('🔍 handleReplaceAttraction 接收到的参数:', params);

    // 判断调用方式
    if (typeof params === 'object' && params.dayIndex !== undefined) {
      // 新方式：handleReplaceAttraction({ dayIndex, attractionIndex, originalItem, newItem, skipConfirm })
      dayIndex = params.dayIndex;
      attractionIndex = params.attractionIndex;
      originalItem = params.originalItem;
      newItem = params.newItem;
      skipConfirm = params.skipConfirm;
      console.log('🔍 解构后的参数:');
      console.log('   dayIndex:', dayIndex);
      console.log('   attractionIndex:', attractionIndex);
      console.log('   originalItem:', originalItem);
      console.log('   newItem:', newItem);
      console.log('   skipConfirm:', skipConfirm);
    } else {
      // 旧方式：handleReplaceAttraction(dayIndex, attractionIndex, originalItem, newAttraction)
      dayIndex = params;
      attractionIndex = originalItemParam;
      originalItem = originalItemParam;
      newItem = newItemParam;
      skipConfirm = false;
    }

    console.log('🔄 替换景点:', originalItem.name, '->', newItem.name);
    console.log('   新景点ID:', newItem.id);
    console.log('   新景点完整对象:', newItem);
    console.log('   跳过确认弹窗:', skipConfirm);

    const executeReplacement = async () => {
      try {
        if (!itineraryData) return;

        // 更新行程数据
        const newItineraryData = { ...itineraryData };
        const day = newItineraryData.itinerary[dayIndex];

        // 替换景点
        day.attractions[attractionIndex] = {
          ...day.attractions[attractionIndex], // 保留原始数据
          name: newItem.name,
          description: newItem.description,
          estimated_cost: newItem.estimated_cost,
          location: newItem.location,
        };

        console.log('🔄 替换后的景点对象:', day.attractions[attractionIndex]);

        // 重新计算时间段
        day.attractions = recalculateTimeSlots(day.attractions);

        console.log('🔄 重新计算时间段后的 attractions:', day.attractions);

        setItineraryData(newItineraryData);
        setCurrentItinerary(newItineraryData);

        // 更新备选关系
        if (newItem.id && itineraryData.summary?.destination) {
          try {
            console.log('🔄 更新备选关系...');
            await updateAlternativeRelations(
              originalItem.name, // 这里使用名称作为oldSpotId（因为AttractionItem没有id）
              newItem.id,
              itineraryData.summary.destination
            );
            console.log('✅ 备选关系更新成功');
          } catch (error) {
            console.error('⚠️  更新备选关系失败:', error);
            // 不影响主流程，继续执行
          }
        }

        // 收起备选列表
        handleCloseAlternatives(originalItem);

        message.success('景点替换成功！');
      } catch (error: any) {
        console.error('❌ 替换景点失败:', error);
        message.error('替换景点失败，请稍后重试');
      }
    };

    // 根据 skipConfirm 决定是否显示确认弹窗
    if (skipConfirm) {
      // 直接执行替换，不显示弹窗
      executeReplacement();
    } else {
      // 显示确认弹窗
      Modal.confirm({
        title: '确认替换景点',
        content: (
          <div>
            <p>确认将 <strong>{originalItem.name}</strong> 替换为 <strong>{newItem.name}</strong> 吗？</p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
              替换后，系统会自动调整该景点的建议游玩时间
            </p>
          </div>
        ),
        okText: '确认替换',
        cancelText: '取消',
        onOk: executeReplacement,
      });
    }
  };

  // 应用调整（保留原有功能）
  const handleApplyAdjustment = () => {
    if (adjustResult && adjustResult.adjustedItinerary) {
      setItineraryData(adjustResult.adjustedItinerary);
      setCurrentItinerary(adjustResult.adjustedItinerary);
      setAdjustModalVisible(false);
      message.success('行程调整成功！');
    }
  };

  // 完成行程
  const handleCompleteTrip = async () => {
    if (!tripId) {
      message.error('请先保存行程');
      return;
    }

    setCompleting(true);
    try {
      const response = await completeTrip(tripId);
      if (response.success) {
        setTripStatus('completed');
        completeTripInStore();
        message.success('行程已完成！现在可以写游记和上传图片了');
      }
    } catch (error: any) {
      console.error('❌ 完成行程失败:', error);
      message.error(error.response?.data?.message || '完成行程失败');
    } finally {
      setCompleting(false);
    }
  };

  // 打开上传图片弹窗
  const handleOpenUploadModal = (spot: AttractionItem) => {
    setSelectedSpot(spot);
    setUploadModalVisible(true);
  };

  // 写游记
  const handleWriteBlog = () => {
    navigate('/blog/create');
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
      minHeight: 'auto',
      paddingBottom: '100px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Title level={2} style={{
            margin: 0,
            color: '#333'
          }}>
            我的行程
          </Title>
          {isSavedTrip && (
            <Tag color={tripStatus === 'completed' ? 'success' : 'processing'}>
              {tripStatus === 'completed' ? '已完成' : '规划中'}
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {tripId && <ShareButton tripId={tripId} />}
          {itineraryData && (
            <PDFExportButton tripData={{
              id: tripId,
              title: itineraryData.summary?.destination ? `${itineraryData.summary.destination}之旅` : '我的行程',
              destination: itineraryData.summary?.destination || '',
              startDate: itineraryData.summary?.start_date || '',
              endDate: itineraryData.summary?.end_date || '',
              totalBudget: itineraryData.summary?.budget || itineraryData.total_cost || 0,
              days: itineraryData.itinerary.map(day => ({
                dayNumber: day.day,
                date: day.date,
                itineraryItems: day.attractions.map(attr => ({
                  name: attr.name,
                  type: attr.type || 'attraction',
                  category: attr.category,
                  description: attr.description,
                  startTime: `${day.date} ${attr.time.split('-')[0]}`,
                  endTime: `${day.date} ${attr.time.split('-')[1]}`,
                  address: attr.address,
                  cost: attr.estimated_cost || 0,
                  longitude: attr.location ? parseFloat(attr.location.split(',')[0]) : undefined,
                  latitude: attr.location ? parseFloat(attr.location.split(',')[1]) : undefined,
                })),
                restaurantName: selectedRestaurants[day.day]?.name,
                restaurantAddress: selectedRestaurants[day.day]?.address,
                restaurantLocation: selectedRestaurants[day.day]?.location, // 餐厅位置坐标(用于地图显示)
                restaurantType: selectedRestaurants[day.day]?.type,
                restaurantRating: selectedRestaurants[day.day]?.rating,
              })),
              budget: itineraryData.budget_breakdown ? {
                transportation: itineraryData.budget_breakdown.transportation || 0,
                accommodation: itineraryData.budget_breakdown.accommodation || 0,
                food: itineraryData.budget_breakdown.dining || 0,
                tickets: itineraryData.budget_breakdown.tickets || 0,
                shopping: 0,
                other: 0,
              } : undefined,
              hotel: selectedHotel ? {
                name: selectedHotel.name,
                address: selectedHotel.address,
                location: selectedHotel.location, // 酒店位置坐标(用于地图显示)
                type: selectedHotel.type,
                rating: selectedHotel.rating,
              } : undefined,
            }} />
          )}
        </div>
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
                        dayIndex={dayIndex}
                        attractionIndex={index}
                        city={itineraryData.summary?.destination}
                        onShowAlternatives={handleShowAlternatives}
                        onTimeChange={(attrIndex, newTime) => handleTimeChange(dayIndex, attrIndex, newTime)}
                        iotData={iotData}
                      />

                      {/* 图片上传按钮（仅已完成行程显示） */}
                      {tripStatus === 'completed' && (
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            type="default"
                            size="small"
                            icon={<CameraOutlined />}
                            onClick={() => handleOpenUploadModal(item)}
                          >
                            上传图片
                          </Button>
                        </div>
                      )}
                      
                      {/* 备选景点展示区域 */}
                      {(() => {
                        const attractionKey = `${item.name}-${item.time}`;
                        const alternatives = expandedAlternatives[attractionKey];
                        const isLoading = loadingAlternatives[attractionKey];

                        if (!alternatives && !isLoading) return null;

                        return (
                          <div style={{ marginTop: '16px' }}>
                            {isLoading ? (
                              <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                background: '#f9f9f9',
                                borderRadius: '8px'
                              }}>
                                <Spin tip="加载备选景点..." />
                              </div>
                            ) : (
                              <AlternativeAttractions
                                originalAttraction={item}
                                alternatives={alternatives}
                                onClose={() => handleCloseAlternatives(item)}
                                onReplace={(params) => {
                                  // 判断参数类型
                                  if (params && typeof params === 'object' && params.newItem) {
                                    // 从收藏列表调用：params = {originalItem, newItem, dayIndex, attractionIndex, skipConfirm}
                                    handleReplaceAttraction(params);
                                  } else {
                                    // 从备选列表调用：params = 景点对象
                                    handleReplaceAttraction({
                                      dayIndex,
                                      attractionIndex: index,
                                      originalItem: item,
                                      newItem: params
                                    });
                                  }
                                }}
                                city={itineraryData.summary?.destination}
                                dayIndex={dayIndex}
                                attractionIndex={index}
                              />
                            )}
                          </div>
                        );
                      })()}
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
              <DayMap 
                day={itineraryData.itinerary[selectedDayIndex]} 
                hotel={selectedHotel} 
                restaurant={selectedRestaurants[itineraryData.itinerary[selectedDayIndex].day]} 
              />
            </div>
          </Col>
        )}
      </Row>

      {/* 酒店推荐 */}
      {itineraryData.itinerary && itineraryData.summary?.budget && (
        <HotelRecommendations
          spots={itineraryData.itinerary.flatMap(day => 
            day.attractions.map(attr => ({
              name: attr.name,
              location: attr.location,
            }))
          )}
          budget={itineraryData.summary.budget}
          selectedHotel={selectedHotel}
          onSelect={(hotel) => setSelectedHotel(hotel)}
          onSkip={() => {
            setSelectedHotel(null);
            message.info('已跳过酒店选择');
          }}
          showSkip={true}
          onLoadComplete={() => setHotelRecommendationLoaded(true)}
          onLoadData={(hotels) => setHotelRecommendations(hotels)}
          days={itineraryData.itinerary.length}
          tripId={tripId || itineraryData.tripId}
        />
      )}

      {/* 餐厅推荐 */}
      {itineraryData.itinerary && (
        <RestaurantRecommendations
          days={itineraryData.itinerary.map(day => ({
            day: day.day,
            date: day.date,
            spots: day.attractions.map(attr => ({
              name: attr.name,
              location: attr.location,
            })),
          }))}
          selectedRestaurants={selectedRestaurants}
          onSelect={(day, restaurant) => {
            setSelectedRestaurants(prev => ({
              ...prev,
              [day]: restaurant,
            }));
          }}
          onSkip={(day) => {
            setSelectedRestaurants(prev => ({
              ...prev,
              [day]: null,
            }));
            message.info(`第${day}天: 已跳过餐厅选择`);
          }}
          showSkip={true}
          disabled={!hotelRecommendationLoaded}
          groupSize={itineraryData.summary?.groupSize || 1}
          tripId={tripId || itineraryData.tripId}
          onLoadData={(recommendations) => setRestaurantRecommendations(recommendations)}
        />
      )}

      {/* 预算图表 */}
      <BudgetChart 
        data={[
          { category: '交通', amount: itineraryData.budget_breakdown.transportation },
          { category: '住宿', amount: itineraryData.budget_breakdown.accommodation },
          { category: '餐饮', amount: itineraryData.budget_breakdown.dining },
          { category: '门票', amount: itineraryData.budget_breakdown.tickets },
        ]}
        totalBudget={itineraryData.summary?.budget || itineraryData.total_cost || 10000}
        actualBudget={budgetInfo}
        warningMessage={budgetInfo?.warningMessage}
        warningLevel={budgetInfo?.warningLevel || 0}
      />

      {/* 底部操作按钮 */}
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
          {isSavedTrip ? (
            tripStatus === 'completed' ? '✅ 行程已完成，可以上传图片和写游记了' : '查看行程详情'
          ) : '💡 确认后行程将保存到数据库'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* 已完成行程显示写游记按钮 */}
          {tripStatus === 'completed' && (
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={handleWriteBlog}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                minWidth: '150px'
              }}
            >
              写游记
            </Button>
          )}

          {/* 规划中行程显示完成按钮 */}
          {isSavedTrip && tripStatus === 'planning' && (
            <Popconfirm
              title="确认完成行程？"
              description="完成后将无法再修改行程，但可以上传图片和写游记"
              onConfirm={handleCompleteTrip}
              okText="确认完成"
              cancelText="取消"
            >
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                loading={completing}
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  minWidth: '150px'
                }}
              >
                完成行程
              </Button>
            </Popconfirm>
          )}

          {/* 返回首页按钮 */}
          <Button
            type="default"
            size="large"
            onClick={() => navigate('/')}
            style={{
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              minWidth: '150px'
            }}
          >
            返回首页
          </Button>

          {/* 确认并保存按钮（仅未保存时显示） */}
          {!isSavedTrip && (
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
              确认并保存
            </Button>
          )}
        </div>
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

      {/* 上传图片弹窗 */}
      <SpotImageUploadModal
        visible={uploadModalVisible}
        spot={selectedSpot}
        tripId={tripId}
        city={itineraryData.summary?.destination}
        onClose={() => {
          setUploadModalVisible(false);
          setSelectedSpot(null);
        }}
        onSuccess={() => {
          message.success('图片上传成功，等待审核');
        }}
      />
    </div>
  );
}

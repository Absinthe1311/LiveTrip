// 行程详情页面 - 查看和编辑已保存的行程
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Rate, Button, Spin, Empty, message, Typography, Divider, Image, Space, Popconfirm, Row, Col, Modal } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, CalendarOutlined, ShareAltOutlined, EditOutlined, CheckCircleOutlined, CameraOutlined } from '@ant-design/icons';
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
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AttractionCard from '../components/AttractionCard';
import AlternativeAttractions from '../components/AlternativeAttractions';
import BudgetChart from '../components/BudgetChart';
import ShareButton from '../components/ShareButton';
import PDFExportButton from '../components/PDFExportButton';
import SpotImageUploadModal from '../components/SpotImageUploadModal';
import { getTripById, completeTrip, getIoTData, updateAlternativeRelations } from '../api/client';
import { FullItinerary, AttractionItem } from '../api/client';
import { alternativeRecommender } from '../services/alternativeRecommender';
import AMapLoader from '@amap/amap-jsapi-loader';

const { Title, Text, Paragraph } = Typography;

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

// 地图组件
function DayMap({ day, hotel, restaurant }: { day: any; hotel?: any; restaurant?: any }) {
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
        features: ['bg', 'road', 'building', 'point'],
        showLabel: true,
        showIndoorMap: false,
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
  iotData,
  tripStatus,
  onOpenUploadModal
}: { 
  item: AttractionItem; 
  index: number; 
  dayIndex: number;
  attractionIndex: number;
  onShowAlternatives: (item: AttractionItem, city?: string) => void;
  onTimeChange?: (index: number, newTime: string) => void;
  city?: string;
  iotData?: any[];
  tripStatus: 'planning' | 'completed';
  onOpenUploadModal: (spot: AttractionItem) => void;
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
      
      {/* 图片上传按钮（仅已完成行程显示） */}
      {tripStatus === 'completed' && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="default"
            size="small"
            icon={<CameraOutlined />}
            onClick={() => onOpenUploadModal(item)}
          >
            上传图片
          </Button>
        </div>
      )}
    </div>
  );
}

// 获取景点的IoT数据
function getAttractionIoTData(attraction: AttractionItem, iotDataList: any[]): any {
  if (!iotDataList || iotDataList.length === 0) {
    return null;
  }
  
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

// 将分钟数转换为时间字符串
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours % 24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 检查时间是否在合理范围内
function isValidTime(minutes: number): boolean {
  return minutes >= 0 && minutes < 24 * 60;
}

// 根据新顺序重新分配时间段
function recalculateTimeSlots(items: AttractionItem[]): AttractionItem[] {
  if (items.length === 0) return items;

  const newItems = [...items];
  const START_TIME = 9 * 60; // 9:00
  const TRAVEL_TIME = 30;
  const LUNCH_TIME = 60;

  let currentTime = START_TIME;

  return newItems.map((item) => {
    const { duration } = parseTimeRange(item.time);
    
    if (!isValidTime(currentTime)) {
      return {
        ...item,
        time: '时间超出范围',
      };
    }

    const start = currentTime;
    const end = start + duration;

    if (end >= 11 * 60 + 30 && end <= 13 * 60 + 30) {
      currentTime = end + LUNCH_TIME;
    } else {
      currentTime = end + TRAVEL_TIME;
    }

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

// 数据库格式转换为前端格式
function convertDbToItinerary(trip: any): FullItinerary {
  const itinerary = trip.days.map((day: any) => ({
    day: day.dayNumber,
    date: new Date(day.date).toISOString().split('T')[0],
    attractions: day.itineraryItems.map((item: any) => {
      // 将DateTime时间转换为时间字符串
      const startDateTime = new Date(item.startTime);
      const endDateTime = new Date(item.endTime);
      const startTime = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
      const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
      
      return {
        name: item.name,
        time: `${startTime}-${endTime}`,
        location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
        estimated_cost: item.cost || 0,
        description: item.description || item.type || '',
        type: item.type || '景点',
        address: item.address || '',
        spotId: item.spotId,
      };
    }),
    daily_cost: day.itineraryItems.reduce((sum: number, item: any) => sum + item.cost, 0),
  }));

  return {
    itinerary,
    total_cost: trip.totalBudget || 0,
    budget_breakdown: {
      transportation: trip.budget?.transportation || 0,
      accommodation: trip.budget?.accommodation || 0,
      dining: trip.budget?.food || 0,
      tickets: trip.budget?.tickets || 0,
    },
    summary: {
      destination: trip.destination,
      start_date: new Date(trip.startDate).toISOString().split('T')[0],
      end_date: new Date(trip.endDate).toISOString().split('T')[0],
      budget: trip.totalBudget || 0,
      days: itinerary.length,
    },
  };
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 基础状态
  const [trip, setTrip] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState<'planning' | 'completed'>('planning');
  const [completing, setCompleting] = useState(false);
  
  // 地图状态
  const [showMap, setShowMap] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  
  // 备选景点状态
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, any>>({});
  const [iotData, setIotData] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<Record<string, boolean>>({});
  
  // 上传图片状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<AttractionItem | null>(null);
  
  // 酒店和餐厅状态
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Record<number, Restaurant | null>>({});
  const [budgetInfo, setBudgetInfo] = useState<any>(null);
  const [hotelRecommendationLoaded, setHotelRecommendationLoaded] = useState(false);

  useEffect(() => {
    if (id) {
      loadTripDetail(id);
    }
  }, [id]);

  const loadTripDetail = async (tripId: string) => {
    setLoading(true);
    try {
      const response = await getTripById(tripId);
      if (response.success && response.data) {
        const tripData = response.data;
        setTrip(tripData);
        setItineraryData(convertDbToItinerary(tripData));
        setTripStatus(tripData.status);
        console.log('✅ 行程详情加载成功:', tripData);
        
        // 加载IoT数据
        loadIoTData();
      } else {
        message.error('加载行程失败');
      }
    } catch (error) {
      console.error('加载行程失败:', error);
      message.error('加载行程失败');
    } finally {
      setLoading(false);
    }
  };

  const loadIoTData = async () => {
    try {
      const response = await getIoTData();
      if (response.success && response.data) {
        setIotData(response.data.spots);
      }
    } catch (error) {
      console.error('加载IoT数据失败:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDays = () => {
    if (!trip) return 0;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // 拖拽传感器配置
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

  // 拖拽结束处理
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

        newItems.itinerary[dayIndex] = {
          ...newItems.itinerary[dayIndex],
          attractions: recalculateTimeSlots(reorderedItems),
        };

        return newItems;
      });
      
      message.success('景点顺序已更新');
    }
  };

  // 显示备选景点
  const handleShowAlternatives = async (item: AttractionItem, city?: string) => {
    const attractionKey = `${item.name}-${item.time}`;
    
    if (expandedAlternatives[attractionKey]) {
      setExpandedAlternatives(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[attractionKey];
        return newExpanded;
      });
      return;
    }

    setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: true }));
    
    try {
      const allSpotNames = itineraryData?.itinerary.flatMap(day => 
        day.attractions.map(attr => attr.name)
      ) || [];
      
      const recommendations = await alternativeRecommender.getRecommendations(
        item, 
        iotData, 
        city,
        allSpotNames
      );
      
      setExpandedAlternatives(prev => ({
        ...prev,
        [attractionKey]: recommendations
      }));
    } catch (error: any) {
      console.error('获取备选景点失败:', error);
      message.error('获取备选景点失败');
    } finally {
      setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: false }));
    }
  };

  // 替换景点
  const handleReplaceAttraction = async (params: any) => {
    const { dayIndex, attractionIndex, originalItem, newItem } = params;

    if (!itineraryData) return;

    const newItineraryData = { ...itineraryData };
    const day = newItineraryData.itinerary[dayIndex];

    day.attractions[attractionIndex] = {
      ...day.attractions[attractionIndex],
      name: newItem.name,
      description: newItem.description,
      estimated_cost: newItem.estimated_cost,
      location: newItem.location,
    };

    day.attractions = recalculateTimeSlots(day.attractions);

    setItineraryData(newItineraryData);

    if (newItem.id && itineraryData.summary?.destination) {
      try {
        await updateAlternativeRelations(
          originalItem.name,
          newItem.id,
          itineraryData.summary.destination
        );
      } catch (error) {
        console.error('更新备选关系失败:', error);
      }
    }

    setExpandedAlternatives(prev => {
      const newExpanded = { ...prev };
      delete newExpanded[`${originalItem.name}-${originalItem.time}`];
      return newExpanded;
    });

    message.success('景点替换成功！');
  };

  // 完成行程
  const handleCompleteTrip = async () => {
    if (!id) return;

    setCompleting(true);
    try {
      const response = await completeTrip(id);
      if (response.success) {
        setTripStatus('completed');
        message.success('行程已完成！现在可以上传图片和写游记了');
      }
    } catch (error: any) {
      console.error('完成行程失败:', error);
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="加载行程详情..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip || !itineraryData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Empty description="行程不存在" />
        </div>
        <Footer />
      </div>
    );
  }

  // 准备酒店数据
  const hotel = trip.hotelName ? {
    name: trip.hotelName,
    address: trip.hotelAddress,
    location: trip.hotelLocation,
    type: trip.hotelType,
    rating: trip.hotelRating,
  } : null;

  // 准备餐厅数据
  const getRestaurantForDay = (dayNumber: number) => {
    const day = trip.days?.find((d: any) => d.dayNumber === dayNumber);
    if (day?.restaurantName) {
      return {
        name: day.restaurantName,
        address: day.restaurantAddress,
        location: day.restaurantLocation,
        type: day.restaurantType,
        rating: day.restaurantRating,
      };
    }
    return null;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div style={{ flex: 1, padding: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%', background: '#f5f5f5' }}>
        {/* 行程标题 */}
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0 }}>{trip.title}</Title>
              {trip.description && (
                <Paragraph type="secondary" style={{ margin: '8px 0 0' }}>{trip.description}</Paragraph>
              )}
            </div>
            <Space>
              {id && <ShareButton tripId={id} />}
              <PDFExportButton tripData={{
                id: trip.id,
                title: trip.title,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                totalBudget: trip.totalBudget,
                days: trip.days?.map((day: any) => ({
                  dayNumber: day.dayNumber,
                  date: day.date,
                  itineraryItems: day.itineraryItems,
                  restaurantName: day.restaurantName,
                  restaurantAddress: day.restaurantAddress,
                  restaurantLocation: day.restaurantLocation,
                  restaurantType: day.restaurantType,
                  restaurantRating: day.restaurantRating,
                })),
                budget: trip.budget,
                hotelName: trip.hotelName,
                hotelAddress: trip.hotelAddress,
                hotelLocation: trip.hotelLocation,
                hotelType: trip.hotelType,
                hotelRating: trip.hotelRating,
              }} />
            </Space>
          </div>
        </Card>

        {/* 行程概览 */}
        <Card title="行程概览" style={{ marginBottom: '24px' }}>
          <Descriptions column={4}>
            <Descriptions.Item label="目的地">
              <Tag color="blue">{trip.destination}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="出发日期">
              <CalendarOutlined style={{ marginRight: 8 }} />
              {formatDate(trip.startDate)}
            </Descriptions.Item>
            <Descriptions.Item label="返回日期">
              <CalendarOutlined style={{ marginRight: 8 }} />
              {formatDate(trip.endDate)}
            </Descriptions.Item>
            <Descriptions.Item label="行程天数">
              {calculateDays()} 天
            </Descriptions.Item>
            <Descriptions.Item label="总预算">
              <DollarOutlined style={{ marginRight: 8 }} />
              ¥{trip.totalBudget?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={tripStatus === 'completed' ? 'success' : 'processing'}>
                {tripStatus === 'completed' ? '已完成' : '规划中'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 酒店信息 */}
        {hotel && (
          <Card title="住宿酒店" style={{ marginBottom: '24px' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="酒店名称">{hotel.name}</Descriptions.Item>
              <Descriptions.Item label="地址">
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {hotel.address}
              </Descriptions.Item>
              {hotel.type && <Descriptions.Item label="类型">{hotel.type}</Descriptions.Item>}
              {hotel.rating && <Descriptions.Item label="评分"><Rate disabled defaultValue={hotel.rating} /></Descriptions.Item>}
            </Descriptions>
          </Card>
        )}

        {/* 每日行程 */}
        <Row gutter={24}>
          <Col span={showMap ? 14 : 24}>
            {itineraryData.itinerary.map((day, dayIndex) => (
              <Card
                key={day.day}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>第 {day.day} 天 - {formatDate(day.date)}</span>
                    <Button
                      type="primary"
                      icon={<EnvironmentOutlined />}
                      onClick={() => {
                        setSelectedDayIndex(dayIndex);
                        setShowMap(!showMap);
                      }}
                      style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderColor: '#667eea',
                        color: '#667eea'
                      }}
                    >
                      {showMap && selectedDayIndex === dayIndex ? '隐藏地图' : '查看地图'}
                    </Button>
                  </div>
                }
                style={{ marginBottom: '24px' }}
              >
                {/* 拖拽排序区域 */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, dayIndex)}
                >
                  <SortableContext
                    items={day.attractions.map((_, index) => index)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ position: 'relative', paddingLeft: '32px' }}>
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
                        <div key={index} style={{ position: 'relative', marginBottom: '24px' }}>
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
                            iotData={iotData}
                            tripStatus={tripStatus}
                            onOpenUploadModal={handleOpenUploadModal}
                          />

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
                                    onClose={() => {
                                      setExpandedAlternatives(prev => {
                                        const newExpanded = { ...prev };
                                        delete newExpanded[attractionKey];
                                        return newExpanded;
                                      });
                                    }}
                                    onReplace={(params) => {
                                      handleReplaceAttraction({
                                        dayIndex,
                                        attractionIndex: index,
                                        originalItem: item,
                                        newItem: params
                                      });
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

                {/* 餐厅信息 */}
                {getRestaurantForDay(day.day) && (
                  <>
                    <Divider />
                    <Title level={5}>午餐餐厅</Title>
                    <Card size="small">
                      <Text strong>{getRestaurantForDay(day.day).name}</Text>
                      {getRestaurantForDay(day.day).address && (
                        <Text type="secondary" style={{ marginLeft: 16 }}>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {getRestaurantForDay(day.day).address}
                        </Text>
                      )}
                    </Card>
                  </>
                )}
              </Card>
            ))}
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
                  hotel={hotel} 
                  restaurant={getRestaurantForDay(itineraryData.itinerary[selectedDayIndex].day)} 
                />
              </div>
            </Col>
          )}
        </Row>

        {/* 预算图表 */}
        <BudgetChart 
          data={[
            { category: '交通', amount: itineraryData.budget_breakdown.transportation },
            { category: '住宿', amount: itineraryData.budget_breakdown.accommodation },
            { category: '餐饮', amount: itineraryData.budget_breakdown.dining },
            { category: '门票', amount: itineraryData.budget_breakdown.tickets },
          ]}
          totalBudget={trip.totalBudget || 0}
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
            {tripStatus === 'completed' ? '✅ 行程已完成，可以上传图片和写游记了' : '💡 拖拽景点卡片可调整顺序'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
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
            {tripStatus === 'planning' && (
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

            {/* 返回按钮 */}
            <Button
              type="default"
              size="large"
              onClick={() => navigate('/my-trips')}
              style={{
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                minWidth: '150px'
              }}
            >
              返回我的行程
            </Button>
          </div>
        </div>
      </div>

      <Footer />

      {/* 上传图片弹窗 */}
      <SpotImageUploadModal
        visible={uploadModalVisible}
        spot={selectedSpot}
        tripId={id}
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

// 行程详情页面 - 新UI设计
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, List, MapPin, ChevronRight, Navigation, Route, Search as SearchIcon, ChevronDown, Calendar, DollarSign, Clock, Share2, FileText, CheckCircle, Camera, Map, X } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { getTripById, completeTrip, getIoTData, updateAlternativeRelations } from '../api/client';
import { FullItinerary, AttractionItem } from '../api/client';
import { alternativeRecommender } from '../services/alternativeRecommender';
import AMapLoader from '@amap/amap-jsapi-loader';
import ShareButton from '../components/ShareButton';
import PDFExportButton from '../components/PDFExportButton';
import SpotImageUploadModal from '../components/SpotImageUploadModal';
import AlternativeAttractions from '../components/AlternativeAttractions';
import BudgetChart from '../components/BudgetChart';
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

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

// 辅助函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatShortDate = (date: string) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const calculateDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

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

// 数据库格式转换为前端格式
function convertDbToItinerary(trip: any): FullItinerary {
  const itinerary = trip.days.map((day: any) => ({
    day: day.dayNumber,
    date: new Date(day.date).toISOString().split('T')[0],
    attractions: day.itineraryItems.map((item: any) => {
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

// 地图组件
function DayMap({ day, hotel, restaurant }: { day: any; hotel?: any; restaurant?: any }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
  const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

  useEffect(() => {
    if (!mapContainer.current || !amapKey || !day || !day.attractions) return;

    window._AMapSecurityConfig = {
      securityJsCode: amapSecret,
    };

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale']
    }).then((AMap) => {
      const coordinates = day.attractions.map((item: any) =>
        item.location.split(',').map(Number)
      );
      
      if (hotel?.location) {
        coordinates.push(hotel.location.split(',').map(Number));
      }
      
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
      map.addControl(new AMap.ToolBar({ position: { top: '10px', right: '10px' } }));
      map.addControl(new AMap.Scale());

      // 添加餐厅标记
      if (restaurant?.location) {
        const restaurantCoords = restaurant.location.split(',').map(Number);
        const restaurantMarker = new AMap.Marker({
          position: restaurantCoords,
          title: restaurant.name,
          content: `<div style="width: 40px; height: 40px; background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 16px;">🍽️</div>`,
          offset: new AMap.Pixel(-20, -20),
          zIndex: 140
        });
        map.add(restaurantMarker);
        markersRef.current.push(restaurantMarker);
      }

      // 添加酒店标记
      if (hotel?.location) {
        const hotelCoords = hotel.location.split(',').map(Number);
        const hotelMarker = new AMap.Marker({
          position: hotelCoords,
          title: hotel.name,
          content: `<div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 16px;">🏨</div>`,
          offset: new AMap.Pixel(-20, -20),
          zIndex: 150
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
          content: `<div style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 14px;">${index + 1}</div>`,
          offset: new AMap.Pixel(-18, -18),
          zIndex: 100
        });
        map.add(marker);
        markersRef.current.push(marker);
      });

      // 添加路线
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
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

// 可拖拽的景点卡片
function SortableAttractionCard({ 
  item, 
  index,
  onShowAlternatives,
  city,
  iotData,
  tripStatus,
  onOpenUploadModal
}: { 
  item: AttractionItem; 
  index: number;
  onShowAlternatives: (item: AttractionItem, city?: string) => void;
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
    zIndex: isDragging ? 1000 : 1,
  };

  const iotInfo = getAttractionIoTData(item, iotData || []);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className={`bg-white rounded-lg p-4 border border-border hover:shadow-md transition-all ${isDragging ? 'shadow-xl' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{item.time}</span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShowAlternatives(item, city)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-muted-foreground hover:text-foreground"
              title="查看备选景点"
            >
              <Navigation className="h-4 w-4" />
            </button>
            {tripStatus === 'completed' && (
              <button
                onClick={() => onOpenUploadModal(item)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-muted-foreground hover:text-foreground"
                title="上传图片"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {item.description && (
          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
        )}
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {item.estimated_cost > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ¥{item.estimated_cost}
            </span>
          )}
          {iotInfo && (
            <>
              {iotInfo.crowdLevel !== undefined && (
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${iotInfo.crowdLevel > 70 ? 'bg-red-500' : iotInfo.crowdLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                  拥挤度: {iotInfo.crowdLevel}%
                </span>
              )}
              {iotInfo.temperature !== undefined && (
                <span>{iotInfo.temperature}°C</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  const [trip, setTrip] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState<'planning' | 'completed'>('planning');
  const [completing, setCompleting] = useState(false);
  
  const [showMap, setShowMap] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, any>>({});
  const [iotData, setIotData] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<Record<string, boolean>>({});
  
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<AttractionItem | null>(null);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
        loadIoTData();
      } else {
        console.error('加载行程失败');
      }
    } catch (error) {
      console.error('加载行程失败:', error);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

        newItems.itinerary[dayIndex] = {
          ...newItems.itinerary[dayIndex],
          attractions: recalculateTimeSlots(reorderedItems),
        };

        return newItems;
      });
    }
  };

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
    } finally {
      setLoadingAlternatives(prev => ({ ...prev, [attractionKey]: false }));
    }
  };

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
  };

  const handleCompleteTrip = async () => {
    if (!id) return;

    setCompleting(true);
    try {
      const response = await completeTrip(id);
      if (response.success) {
        setTripStatus('completed');
      }
    } catch (error: any) {
      console.error('完成行程失败:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleOpenUploadModal = (spot: AttractionItem) => {
    setSelectedSpot(spot);
    setUploadModalVisible(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载行程详情...</p>
        </div>
      </div>
    );
  }

  if (!trip || !itineraryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">行程不存在</h3>
          <button
            onClick={() => navigate('/my-trips')}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            返回我的行程
          </button>
        </div>
      </div>
    );
  }

  const hotel = trip.hotelName ? {
    name: trip.hotelName,
    address: trip.hotelAddress,
    location: trip.hotelLocation,
    type: trip.hotelType,
    rating: trip.hotelRating,
  } : null;

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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div 
          className="w-[240px] h-full flex items-center px-5 border-r border-border shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center mr-2">
            <span className="text-lg">✈️</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
            <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <h1 className="text-base font-semibold text-foreground">{trip.title}</h1>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={() => navigate('/favorites')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">U</div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isLargeScreen={isLargeScreen} currentPage={location.pathname} />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-foreground font-serif">{trip.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${tripStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {tripStatus === 'completed' ? '已完成' : '规划中'}
                  </span>
                </div>
                {trip.description && (
                  <p className="text-sm text-muted-foreground mb-4">{trip.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </div>

          {/* Trip Overview */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              行程概览
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">目的地</p>
                <p className="text-base font-semibold text-foreground">{trip.destination}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">行程天数</p>
                <p className="text-base font-semibold text-foreground">{calculateDays(trip.startDate, trip.endDate)} 天</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">出发日期</p>
                <p className="text-base font-semibold text-foreground">{formatShortDate(trip.startDate)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-1">总预算</p>
                <p className="text-base font-semibold text-foreground">¥{trip.totalBudget?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          {/* Hotel Info */}
          {hotel && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-xl">🏨</span>
                住宿酒店
              </h2>
              <div className="bg-white rounded-lg p-4 border border-border">
                <h3 className="text-base font-semibold text-foreground mb-2">{hotel.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {hotel.type && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">类型</p>
                      <p className="text-foreground">{hotel.type}</p>
                    </div>
                  )}
                  {hotel.address && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">地址</p>
                      <p className="text-foreground">{hotel.address}</p>
                    </div>
                  )}
                  {hotel.rating && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">评分</p>
                      <p className="text-foreground">⭐ {hotel.rating}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Day Selector */}
          {itineraryData.itinerary.length > 1 && (
            <div className="bg-white rounded-lg border border-border p-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto">
                {itineraryData.itinerary.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDayIndex(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      index === selectedDayIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                    }`}
                  >
                    Day {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Daily Itinerary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Timeline */}
            <div className="space-y-4">
              {itineraryData.itinerary[selectedDayIndex] && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      第 {itineraryData.itinerary[selectedDayIndex].day} 天 - {formatShortDate(itineraryData.itinerary[selectedDayIndex].date)}
                    </h2>
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                    >
                      <Map className="h-4 w-4" />
                      {showMap ? '隐藏地图' : '查看地图'}
                    </button>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, selectedDayIndex)}
                  >
                    <SortableContext
                      items={itineraryData.itinerary[selectedDayIndex].attractions.map((_, index) => index)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {itineraryData.itinerary[selectedDayIndex].attractions.map((item, index) => (
                          <div key={index}>
                            <SortableAttractionCard
                              item={item}
                              index={index}
                              city={itineraryData.summary?.destination}
                              onShowAlternatives={handleShowAlternatives}
                              iotData={iotData}
                              tripStatus={tripStatus}
                              onOpenUploadModal={handleOpenUploadModal}
                            />

                            {/* Alternatives */}
                            {(() => {
                              const attractionKey = `${item.name}-${item.time}`;
                              const alternatives = expandedAlternatives[attractionKey];
                              const isLoading = loadingAlternatives[attractionKey];

                              if (!alternatives && !isLoading) return null;

                              return (
                                <div className="mt-3">
                                  {isLoading ? (
                                    <div className="p-8 text-center bg-gray-50 rounded-lg">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
                                          dayIndex: selectedDayIndex,
                                          attractionIndex: index,
                                          originalItem: item,
                                          newItem: params
                                        });
                                      }}
                                      city={itineraryData.summary?.destination}
                                      dayIndex={selectedDayIndex}
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

                  {/* Restaurant */}
                  {(() => {
                    const restaurant = getRestaurantForDay(itineraryData.itinerary[selectedDayIndex].day);
                    return restaurant && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🍽️</span>
                          <h3 className="text-sm font-semibold text-foreground">午餐餐厅</h3>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            {restaurant.name}
                          </h4>
                          {restaurant.address && (
                            <p className="text-xs text-muted-foreground">
                              📍 {restaurant.address}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Right: Map */}
            {showMap && itineraryData.itinerary[selectedDayIndex] && (
              <div className="lg:sticky lg:top-20">
                <div className="bg-white rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    第{itineraryData.itinerary[selectedDayIndex].day}天行程地图
                  </h3>
                  <DayMap 
                    day={itineraryData.itinerary[selectedDayIndex]} 
                    hotel={hotel} 
                    restaurant={getRestaurantForDay(itineraryData.itinerary[selectedDayIndex].day)} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Budget Chart */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <BudgetChart 
              data={[
                { category: '交通', amount: itineraryData.budget_breakdown.transportation },
                { category: '住宿', amount: itineraryData.budget_breakdown.accommodation },
                { category: '餐饮', amount: itineraryData.budget_breakdown.dining },
                { category: '门票', amount: itineraryData.budget_breakdown.tickets },
              ]}
              totalBudget={trip.totalBudget || 0}
            />
          </div>

          {/* Action Buttons */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {tripStatus === 'completed' ? '✅ 行程已完成，可以上传图片和写游记了' : '💡 拖拽景点卡片可调整顺序'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {tripStatus === 'completed' && (
                <button
                  onClick={() => navigate('/blog/create')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PenLine className="h-4 w-4" />
                  写游记
                </button>
              )}
              {tripStatus === 'planning' && (
                <button
                  onClick={handleCompleteTrip}
                  disabled={completing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  {completing ? '处理中...' : '完成行程'}
                </button>
              )}
              <button
                onClick={() => navigate('/my-trips')}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-foreground rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回我的行程
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <SpotImageUploadModal
        visible={uploadModalVisible}
        spot={selectedSpot}
        tripId={id || ''}
        city={itineraryData.summary?.destination || ''}
        onClose={() => {
          setUploadModalVisible(false);
          setSelectedSpot(null);
        }}
        onSuccess={() => {
          console.log('图片上传成功，等待审核');
        }}
      />
    </div>
  );
}

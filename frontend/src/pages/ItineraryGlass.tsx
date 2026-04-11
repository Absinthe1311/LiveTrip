// 行程规划页面 - 毛玻璃风格重构版
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, message, Spin } from 'antd';
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
import {
  MapPin, Calendar, Wallet, Cloud, Sun, CloudRain, Clock, Share2, Download,
  Building2, UtensilsCrossed, Star, Heart, ChevronRight, Sparkles, CheckCircle,
  Camera, X, Map, Check, AlertCircle, PenLine, Home as HomeIcon
} from "lucide-react";
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import MetricCard from '../components/itinerary/MetricCard';
import BudgetDistribution from '../components/itinerary/BudgetDistribution';
import DayNavigationPanel from '../components/itinerary/DayNavigationPanel';
import DailyExpenseDistribution from '../components/itinerary/DailyExpenseDistribution';
import CompactAttractionCard from '../components/itinerary/CompactAttractionCard';
import InlineAlternativeAttractions from '../components/itinerary/InlineAlternativeAttractions';
import LargeAttractionCard from '../components/itinerary/LargeAttractionCard';
import DetailedAlternativeAttractions from '../components/itinerary/DetailedAlternativeAttractions';
import EditableTimeSlot from '../components/itinerary/EditableTimeSlot';
import TwoStageAttractionCard from '../components/itinerary/TwoStageAttractionCard';
import RestaurantSuggestionPlaceholder from '../components/itinerary/RestaurantSuggestionPlaceholder';
import HorizontalRestaurantRecommendations from '../components/itinerary/HorizontalRestaurantRecommendations';
import HotelDrawer from '../components/itinerary/HotelDrawer';
import AttractionCard from '../components/AttractionCard';
import GlassAlternativeAttractions from '../components/GlassAlternativeAttractions';
import BudgetChart from '../components/BudgetChart';
import HotelRecommendations from '../components/HotelRecommendations';
import RestaurantRecommendations from '../components/RestaurantRecommendations';
import SpotImageUploadModal from '../components/SpotImageUploadModal';
import { useAppStore } from '../store';
import { FullItinerary, AttractionItem, calculateRealTimeBudget, completeTrip } from '../api/client';
import { adjustItinerary, getIoTData, saveTrip, updateAlternativeRelations, getSpotCoverImage } from '../api/client';
import { Hotel, Restaurant, DayRestaurantRecommendation } from '../api/recommendationApi';
import AMapLoader from '@amap/amap-jsapi-loader';
import { alternativeRecommender } from '../services/alternativeRecommender';

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

// 地图组件
interface DayMapProps {
  day: any;
  hotel?: Hotel | null;
  restaurant?: Restaurant | null;
  showHotel?: boolean;
  showRestaurant?: boolean;
  candidateHotels?: Hotel[];
  candidateRestaurants?: Restaurant[];
}

function DayMap({
  day,
  hotel,
  restaurant,
  showHotel = true,
  showRestaurant = true,
  candidateHotels = [],
  candidateRestaurants = []
}: DayMapProps) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const polylinesRef = React.useRef<any[]>([]);
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
        mapStyle: 'amap://styles/dark',
        features: ['bg', 'road', 'building', 'point'],
        showLabel: true,
        showIndoorMap: false,
      });

      mapRef.current = map;

      map.addControl(new AMap.ToolBar({
        position: {
          top: '10px',
          right: '10px'
        }
      }));

      map.addControl(new AMap.Scale());

      // 添加餐厅标记（根据showRestaurant参数控制）
      if (showRestaurant && restaurant?.location) {
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
              <div style="padding: 12px; min-width: 200px; background: rgba(0,0,0,0.8); color: white; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🍽️ ${restaurant.name}</h3>
                <p style="margin: 4px 0; color: #52c41a; font-weight: 500;">${restaurant.type || '餐厅'}</p>
                <p style="margin: 4px 0; color: #ccc; font-size: 13px;">${restaurant.address || ''}</p>
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

      // 添加待选餐厅标记
      if (candidateRestaurants && candidateRestaurants.length > 0) {
        candidateRestaurants.forEach((candRest, index) => {
          if (candRest.location) {
            const candCoords = candRest.location.split(',').map(Number);
            const candMarker = new AMap.Marker({
              position: candCoords,
              title: candRest.name,
              content: `
                <div style="
                  width: 36px;
                  height: 36px;
                  background: linear-gradient(135deg, #a0d911 0%, #73d13d 100%);
                  border-radius: 50%;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  cursor: pointer;
                  display: flex;
              align-items: center;
                  justify-content: center;
                  color: #fff;
                  font-weight: bold;
                  font-size: 14px;
                ">
                  🍽️
                </div>
              `,
              offset: new AMap.Pixel(-18, -18),
              zIndex: 130
            });

            candMarker.on('click', () => {
              const infoWindow = new AMap.InfoWindow({
                content: `
                  <div style="padding: 12px; min-width: 200px; background: rgba(0,0,0,0.8); color: white; border-radius: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🍽️ ${candRest.name}</h3>
                    <p style="margin: 4px 0; color: #a0d911; font-weight: 500;">${candRest.type || '餐厅'}</p>
                    <p style="margin: 4px 0; color: #ccc; font-size: 13px;">${candRest.address || ''}</p>
                    ${candRest.rating ? `<p style="margin: 4px 0; color: #faad14; font-size: 13px;">⭐ ${candRest.rating}分</p>` : ''}
                  </div>
                `,
                offset: new AMap.Pixel(0, -30)
              });
              infoWindow.open(map, candCoords);
            });

            map.add(candMarker);
            markersRef.current.push(candMarker);
          }
        });
      }

      // 添加酒店标记（根据showHotel参数控制）
      if (showHotel && hotel?.location) {
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
              <div style="padding: 12px; min-width: 200px; background: rgba(0,0,0,0.8); color: white; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🏨 ${hotel.name}</h3>
                <p style="margin: 4px 0; color: #ff6b6b; font-weight: 500;">${hotel.type || '酒店'}</p>
                <p style="margin: 4px 0; color: #ccc; font-size: 13px;">${hotel.address || ''}</p>
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

      // 添加待选酒店标记
      if (candidateHotels && candidateHotels.length > 0) {
        candidateHotels.forEach((candHotel, index) => {
          if (candHotel.location) {
            const candCoords = candHotel.location.split(',').map(Number);
            const candMarker = new AMap.Marker({
              position: candCoords,
              title: candHotel.name,
              content: `
                <div style="
                  width: 36px;
                  height: 36px;
                  background: linear-gradient(135deg, #ff9c6e 0%, #ff7a45 100%);
                  border-radius: 50%;
                  border: 2px solid #fff;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #fff;
                  font-weight: bold;
                  font-size: 14px;
                ">
                  🏨
                </div>
              `,
              offset: new AMap.Pixel(-18, -18),
              zIndex: 140
            });

            candMarker.on('click', () => {
              const infoWindow = new AMap.InfoWindow({
                content: `
                  <div style="padding: 12px; min-width: 200px; background: rgba(0,0,0,0.8); color: white; border-radius: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">🏨 ${candHotel.name}</h3>
                    <p style="margin: 4px 0; color: #ff9c6e; font-weight: 500;">${candHotel.type || '酒店'}</p>
                    <p style="margin: 4px 0; color: #ccc; font-size: 13px;">${candHotel.address || ''}</p>
                    ${candHotel.rating ? `<p style="margin: 4px 0; color: #faad14; font-size: 13px;">⭐ ${candHotel.rating}分</p>` : ''}
                  </div>
                `,
                offset: new AMap.Pixel(0, -30)
              });
              infoWindow.open(map, candCoords);
            });

            map.add(candMarker);
            markersRef.current.push(candMarker);
          }
        });
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
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
              <div style="padding: 12px; min-width: 200px; background: rgba(0,0,0,0.8); color: white; border-radius: 8px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${item.name}</h3>
                <p style="margin: 4px 0; color: #f59e0b; font-weight: 500;">${item.time}</p>
                <p style="margin: 4px 0; color: #ccc; font-size: 13px;">${item.description || ''}</p>
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
          strokeColor: '#f59e0b',
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
  }, [day, amapKey, hotel, restaurant, showHotel, showRestaurant, candidateHotels, candidateRestaurants]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <div
        ref={mapContainer}
        className="w-full h-full"
      />
      {!amapKey && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white z-50">
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
    zIndex: isDragging ? 1000 : 1,
  };

  const recommendedDuration = (() => {
    const { duration } = parseTimeRange(item.time);
    return duration;
  })();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!item.name) return;

      setImageLoading(true);
      try {
        const response = await getSpotCoverImage(item.name, city);
        if (response.success && response.data?.imageUrl) {
          setImageUrl(response.data.imageUrl);
        }
      } catch (error) {
        console.error(`加载景点图片失败 (${item.name}):`, error);
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [item.name, city]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg hover:bg-white/15 hover:border-white/30 transition-all duration-300 ${isDragging ? 'shadow-2xl scale-105' : ''}`}>
        <div className="flex items-center gap-3 py-3 px-4">
          {/* 左侧小图 */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-amber-400"></div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white/40" />
              </div>
            )}
          </div>

          {/* 中间信息 */}
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-white truncate mb-1">
              {item.name}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 时间标签 */}
              <span className="flex items-center gap-1 text-xs text-white/60">
                <Clock className="w-3 h-3 text-amber-400" />
                {item.time}
              </span>
              {/* 分类标签 */}
              {(item as any).category && (
                <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs text-white/70">
                  {(item as any).category}
                </span>
              )}
              {/* 费用标签 */}
              {item.estimated_cost && item.estimated_cost > 0 && (
                <span className="bg-amber-500/20 rounded-full px-2 py-0.5 text-xs text-amber-400">
                  ¥{item.estimated_cost}
                </span>
              )}
            </div>
          </div>

          {/* 右侧按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowAlternatives(item, city);
            }}
            className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>
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
  const START_TIME = 9 * 60;
  const TRAVEL_TIME = 30;
  const LUNCH_TIME = 60;

  let currentTime = START_TIME;

  return newItems.map((item, index) => {
    const { duration } = parseTimeRange(item.time);

    if (!isValidTime(currentTime)) {
      return {
        ...item,
        time: '时间超出范围',
      };
    }

    const start = currentTime;
    const end = start + duration;
    const nextStart = end + TRAVEL_TIME;

    if (end >= 11 * 60 + 30 && end <= 13 * 60 + 30) {
      currentTime = end + LUNCH_TIME;
    } else {
      currentTime = nextStart;
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

export default function ItineraryGlass() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentItinerary = useAppStore((state) => state.currentItinerary);
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);
  const completeTripInStore = useAppStore((state) => state.completeTrip);

  // 状态管理
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustResult, setAdjustResult] = useState<any>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [showMap, setShowMap] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tripId, setTripId] = useState<string>('');
  const [isSavedTrip, setIsSavedTrip] = useState(false);
  const [tripStatus, setTripStatus] = useState<'planning' | 'completed'>('planning');
  const [completing, setCompleting] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<AttractionItem | null>(null);

  // 备选景点相关状态
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, any>>({});
  const [iotData, setIotData] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<Record<string, boolean>>({});

  // 酒店推荐相关状态
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hotelRecommendations, setHotelRecommendations] = useState<Hotel[]>([]);

  // 餐厅推荐相关状态
  const [selectedRestaurants, setSelectedRestaurants] = useState<Record<number, Restaurant | null>>({});
  const [restaurantRecommendations, setRestaurantRecommendations] = useState<DayRestaurantRecommendation[]>([]);
  const [hotelRecommendationLoaded, setHotelRecommendationLoaded] = useState(false);

  // 地图显示控制状态
  const [showRestaurantOnMap, setShowRestaurantOnMap] = useState(false);
  const [showHotelOnMap, setShowHotelOnMap] = useState(false);
  const [candidateRestaurantsVisible, setCandidateRestaurantsVisible] = useState<Record<number, Restaurant[]>>({});
  const [candidateHotelsVisible, setCandidateHotelsVisible] = useState<Hotel[]>([]);
  const [selectingRestaurantForDay, setSelectingRestaurantForDay] = useState<number | null>(null);
  const [selectingHotel, setSelectingHotel] = useState(false);

  // 地图显示模式：'attractions' | 'restaurant' | 'hotel'
  const [mapDisplayMode, setMapDisplayMode] = useState<'attractions' | 'restaurant' | 'hotel'>('attractions');

  // 预算相关状态
  const [budgetInfo, setBudgetInfo] = useState<any>(null);

  // Tab状态
  const [activeTab, setActiveTab] = useState<'itinerary' | 'hotel' | 'restaurant' | 'budget'>('itinerary');

  // 从 store 加载行程数据
  useEffect(() => {
    console.log('📍 ItineraryGlass 页面加载');
    console.log('📦 Store 中的行程数据:', currentItinerary);

    if (currentItinerary) {
      console.log('✅ 找到行程数据，设置到页面状态');
      setItineraryData(currentItinerary);

      if (currentItinerary.isSavedTrip) {
        setIsSavedTrip(true);
        if (currentItinerary.tripId) {
          setTripId(currentItinerary.tripId);
        }
      }

      if (currentItinerary.status === 'completed') {
        setTripStatus('completed');
      }

      if (currentItinerary.hotel) {
        console.log('🏨 恢复酒店信息:', currentItinerary.hotel);
        setSelectedHotel(currentItinerary.hotel);
      }

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

      loadIoTData();
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
      const groupSize = (itineraryData.summary as any)?.group_size || 1;

      const spots = itineraryData.itinerary.flatMap(day =>
        day.attractions.map(attr => ({
          estimated_cost: attr.estimated_cost || 0,
        }))
      );

      const response = await calculateRealTimeBudget({
        totalBudget,
        days,
        hotel: selectedHotel,
        restaurants: selectedRestaurants,
        spots: spots || [],
      } as any);

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

      const restaurantsData = itineraryData!.itinerary.map((day) => ({
        day: day.day,
        selectedRestaurant: selectedRestaurants[day.day] || null,
      }));

      const response = await saveTrip({
        summary: itineraryData!.summary,
        itinerary: itineraryData!,
        total_cost: itineraryData!.total_cost,
        budget_breakdown: itineraryData!.budget_breakdown,
        hotel: selectedHotel,
        restaurants: restaurantsData,
        hotelRecommendations: hotelRecommendations,
        restaurantRecommendations: restaurantRecommendations,
      });

      if (response.success) {
        console.log('✅ 行程保存成功:', response.data);
        message.success('行程已保存');
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

      newItems.itinerary[dayIndex].attractions[attractionIndex] = {
        ...newItems.itinerary[dayIndex].attractions[attractionIndex],
        time: newTime,
      };

      return newItems;
    });
  };

  // 显示备选景点列表
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
      const allSpotNames = itineraryData!.itinerary.flatMap(day =>
        day.attractions.map(attr => attr.name)
      );

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

    if (typeof params === 'object' && params.dayIndex !== undefined) {
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
      dayIndex = params;
      attractionIndex = originalItemParam;
      originalItem = originalItemParam;
      newItem = newItemParam;
      skipConfirm = false;
    }

    console.log('🔄 替换景点:', originalItem?.name, '->', newItem.name);

    const executeReplacement = async () => {
      try {
        if (!itineraryData) return;

        console.log('✅ 开始执行替换操作');

        const newItineraryData = { ...itineraryData };
        const day = newItineraryData.itinerary[dayIndex];

        // 如果没有提供originalItem，从当前行程中获取
        if (!originalItem) {
          originalItem = day.attractions[attractionIndex];
        }

        day.attractions[attractionIndex] = {
          ...day.attractions[attractionIndex],
          name: newItem.name,
          description: newItem.description,
          estimated_cost: newItem.estimated_cost,
          location: newItem.location,
          // 保留原有的时间
          time: day.attractions[attractionIndex].time,
        };

        console.log('🔄 替换后的景点对象:', day.attractions[attractionIndex]);

        day.attractions = recalculateTimeSlots(day.attractions);

        setItineraryData(newItineraryData);
        setCurrentItinerary(newItineraryData);

        if (newItem.id && itineraryData.summary?.destination) {
          try {
            await updateAlternativeRelations(
              originalItem.name,
              newItem.id,
              itineraryData.summary.destination
            );
            console.log('✅ 备选关系更新成功');
          } catch (error) {
            console.error('⚠️  更新备选关系失败:', error);
          }
        }

        handleCloseAlternatives(originalItem);

        message.success('景点替换成功！');
        console.log('✅ 景点替换完成');
      } catch (error: any) {
        console.error('❌ 替换景点失败:', error);
        message.error('替换景点失败，请稍后重试');
      }
    };

    if (skipConfirm) {
      executeReplacement();
    } else {
      Modal.confirm({
        title: '确认替换景点',
        content: (
          <div>
            <p>确认将 <strong>{originalItem?.name || '当前景点'}</strong> 替换为 <strong>{newItem.name}</strong> 吗？</p>
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

  // 应用调整
  const handleApplyAdjustment = () => {
    if (adjustResult && adjustResult.adjustedItinerary) {
      setItineraryData(adjustResult.adjustedItinerary);
      setCurrentItinerary(adjustResult.adjustedItinerary);
      setAdjustModalVisible(false);
      message.success('行程调整成功！');
    }
  };

  // 打开餐厅选择模式
  const handleOpenRestaurantSelection = (dayNumber: number) => {
    console.log('🍽️ 打开餐厅选择模式 - 第', dayNumber, '天');

    setSelectingRestaurantForDay(dayNumber);
    setShowRestaurantOnMap(true);
    setMapDisplayMode('restaurant');

    // 获取当天的餐厅推荐
    const dayRecommendations = restaurantRecommendations.find(r => r.day === dayNumber);
    if (dayRecommendations && dayRecommendations.restaurants) {
      console.log('✅ 使用餐厅推荐数据:', dayRecommendations.restaurants.length, '个');
      setCandidateRestaurantsVisible(prev => ({
        ...prev,
        [dayNumber]: dayRecommendations.restaurants
      }));
    } else {
      // 如果没有推荐，使用模拟数据
      console.log('⚠️  使用模拟餐厅数据');
      const currentDay = itineraryData?.itinerary.find(d => d.day === dayNumber);
      const centerLocation = currentDay?.attractions[0]?.location || '116.397428,39.90923';

      const mockRestaurants = [
        {
          name: '老北京炸酱面',
          type: '中式快餐',
          rating: 4.5,
          address: '距离500m',
          location: centerLocation,
          tel: '010-12345678',
          distance: 500
        },
        {
          name: '川味观',
          type: '川菜',
          rating: 4.7,
          address: '距离800m',
          location: centerLocation,
          tel: '010-87654321',
          distance: 800
        },
        {
          name: '绿茶餐厅',
          type: '创意菜',
          rating: 4.6,
          address: '距离1.2km',
          location: centerLocation,
          tel: '010-11112222',
          distance: 1200
        }
      ];

      console.log('✅ 模拟餐厅数据:', mockRestaurants);
      setCandidateRestaurantsVisible(prev => ({
        ...prev,
        [dayNumber]: mockRestaurants
      }));
    }
  };

  // 选择餐厅
  const handleSelectRestaurant = (dayNumber: number, restaurant: Restaurant) => {
    console.log('🍽️ 选择餐厅:', restaurant.name, '第', dayNumber, '天');

    setSelectedRestaurants(prev => {
      const newSelected = {
        ...prev,
        [dayNumber]: restaurant
      };
      console.log('✅ 更新已选餐厅:', newSelected);
      return newSelected;
    });

    // 清除其他待选餐厅，只保留选中的
    setCandidateRestaurantsVisible(prev => {
      const newVisible = {
        ...prev,
        [dayNumber]: [restaurant]
      };
      console.log('✅ 更新待选餐厅（只保留选中）:', newVisible);
      return newVisible;
    });

    message.success(`已选择: ${restaurant.name}`);

    // 延迟关闭选择模式
    setTimeout(() => {
      console.log('🔄 关闭餐厅选择模式');
      setSelectingRestaurantForDay(null);
      setShowRestaurantOnMap(false);
    }, 1500); // 增加延迟时间，让用户看到选择效果
  };

  // 关闭餐厅选择模式
  const handleCloseRestaurantSelection = () => {
    console.log('🔄 关闭餐厅选择模式');
    setSelectingRestaurantForDay(null);
    setShowRestaurantOnMap(false);
    setMapDisplayMode('attractions');
    setCandidateRestaurantsVisible(prev => {
      const newVisible = { ...prev };
      delete newVisible[selectedDayIndex + 1]; // 清除当前天的待选餐厅
      return newVisible;
    });
  };

  // 打开酒店选择模式
  const handleOpenHotelSelection = () => {
    console.log('🏨 打开酒店选择模式');
    console.log('   酒店推荐列表:', hotelRecommendations);

    setSelectingHotel(true);
    setShowHotelOnMap(true);
    setMapDisplayMode('hotel');

    // 使用酒店推荐列表
    if (hotelRecommendations && hotelRecommendations.length > 0) {
      console.log('✅ 使用酒店推荐列表:', hotelRecommendations.length, '个');
      setCandidateHotelsVisible(hotelRecommendations);
    } else {
      // 如果没有推荐，使用模拟数据
      console.log('⚠️  使用模拟酒店数据');
      const centerLocation = itineraryData?.itinerary[0]?.attractions[0]?.location || '116.397428,39.90923';

      const mockHotels = [
        {
          name: '北京饭店',
          type: '五星级酒店',
          rating: 4.8,
          address: '距离市中心500m',
          location: centerLocation,
          tel: '010-12345678',
          avgDistance: 0.5,
          distanceDetails: [0.5]
        },
        {
          name: '王府井希尔顿酒店',
          type: '五星级酒店',
          rating: 4.7,
          address: '距离市中心800m',
          location: centerLocation,
          tel: '010-87654321',
          avgDistance: 0.8,
          distanceDetails: [0.8]
        },
        {
          name: '如家快捷酒店',
          type: '经济型酒店',
          rating: 4.3,
          address: '距离市中心1.2km',
          location: centerLocation,
          tel: '010-11112222',
          avgDistance: 1.2,
          distanceDetails: [1.2]
        }
      ];
      console.log('✅ 模拟酒店数据:', mockHotels);
      setCandidateHotelsVisible(mockHotels);
    }
  };

  // 选择酒店
  const handleSelectHotel = (hotel: Hotel) => {
    console.log('🏨 选择酒店:', hotel.name);

    setSelectedHotel(hotel);

    // 清除其他待选酒店，只保留选中的
    setCandidateHotelsVisible([hotel]);

    message.success(`已选择: ${hotel.name}`);

    // 延迟关闭选择模式
    setTimeout(() => {
      console.log('🔄 关闭酒店选择模式');
      setSelectingHotel(false);
      setShowHotelOnMap(false);
    }, 1500); // 增加延迟时间，让用户看到选择效果
  };

  // 关闭酒店选择模式
  const handleCloseHotelSelection = () => {
    console.log('🔄 关闭酒店选择模式');
    setSelectingHotel(false);
    setShowHotelOnMap(false);
    setMapDisplayMode('attractions');
    setCandidateHotelsVisible([]);
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

  // 计算距今倒计时
  const calculateDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 计算总景点数量
  const calculateTotalAttractions = () => {
    if (!itineraryData) return 0;
    return itineraryData.itinerary.reduce((total, day) => total + day.attractions.length, 0);
  };

  // 计算预算使用百分比
  const calculateBudgetPercentage = () => {
    if (!itineraryData || !budgetInfo) return 0;
    const totalBudget = itineraryData.summary?.budget || itineraryData.total_cost || 0;
    const usedBudget = budgetInfo.totalSpent || 0;
    return totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
  };

  if (!itineraryData) {
    return (
      <GlassLayout showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">暂无行程数据</h2>
            <p className="text-white/60">请先在规划页面生成行程</p>
          </div>
        </div>
      </GlassLayout>
    );
  }

  return (
    <GlassLayout showSearch={false}>
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">我的行程</h1>
              {isSavedTrip && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tripStatus === 'completed'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {tripStatus === 'completed' ? '已完成' : '规划中'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tripId && (
                <button
                  onClick={() => message.info('分享功能')}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all duration-300"
                >
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
              )}
            </div>
          </div>

          {/* 顶部摘要卡片组 - 满宽压缩 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">出行日期</p>
                <p className="text-lg font-bold text-white truncate">{itineraryData.summary?.start_date || '未设置'}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">总预算</p>
                <p className="text-lg font-bold text-white truncate">¥{(itineraryData.summary?.budget || itineraryData.total_cost || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">目的地天气</p>
                <p className="text-lg font-bold text-white truncate">{itineraryData.summary?.destination || '未设置'}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">行程总览</p>
                <p className="text-lg font-bold text-white truncate">{itineraryData.itinerary.length}天 · {calculateTotalAttractions()}景点</p>
              </div>
            </div>
          </div>

          {/* Tab切换栏 - 已移除，简化界面 */}
        </div>

        {/* 主内容区 - 根据Tab显示不同内容 */}
        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            {/* 顶部日期切换栏 */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {itineraryData.itinerary.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`flex-shrink-0 flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedDayIndex === index
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-2 border-amber-400/50 shadow-lg shadow-amber-500/20 text-amber-400'
                      : 'bg-white/5 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">第{day.day}天</div>
                    <div className="text-xs opacity-70">{day.date}</div>
                  </div>
                  <div className="bg-white/10 rounded-full px-2 py-0.5 text-xs">
                    {day.attractions.length}景点
                  </div>
                </button>
              ))}
            </div>

            {/* 当日行程内容 */}
            <div className="flex gap-4">
              {/* 左栏：时间轴 */}
              <div className="w-20 flex-shrink-0">
                {itineraryData.itinerary[selectedDayIndex] && (
                  <div className="relative">
                    {/* 渐变竖线 */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-green-500 to-green-600 opacity-40 rounded-full" />
                    
                    {/* 时间节点 */}
                    <div className="space-y-32 pt-4">
                      {itineraryData.itinerary[selectedDayIndex].attractions.map((item, index) => (
                        <EditableTimeSlot
                          key={index}
                          time={item.time}
                          index={index}
                          onTimeChange={(newTime) => handleTimeChange(selectedDayIndex, index, newTime)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 中栏：景点卡片列表 */}
              <div className="flex-1 min-w-0">
                {itineraryData.itinerary[selectedDayIndex] && (
                  <div className="space-y-4">
                    {itineraryData.itinerary[selectedDayIndex].attractions.map((item, index, array) => {
                      const attractionKey = `${item.name}-${item.time}`;
                      const alternatives = expandedAlternatives[attractionKey];
                      const isLoading = loadingAlternatives[attractionKey];
                      const itemIoTData = getAttractionIoTData(item, iotData);

                      // 判断是否需要显示餐厅建议（在11:00-13:00之间）
                      const showRestaurantSuggestion = index < array.length - 1 &&
                        item.time.includes('11:') || item.time.includes('12:');

                      return (
                        <div key={index}>
                          {/* 两段式景点卡片 */}
                          <TwoStageAttractionCard
                            item={item}
                            index={index}
                            city={itineraryData.summary?.destination}
                            onShowAlternatives={() => {
                              if (expandedAlternatives[attractionKey]) {
                                handleCloseAlternatives(item);
                              } else {
                                handleShowAlternatives(item, itineraryData.summary?.destination);
                              }
                            }}
                            showAlternatives={!!expandedAlternatives[attractionKey]}
                            iotData={itemIoTData}
                            onTimeEdit={(newTime) => handleTimeChange(selectedDayIndex, index, newTime)}
                          />

                          {/* 详细备选景点 */}
                          {expandedAlternatives[attractionKey] && (
                            <DetailedAlternativeAttractions
                              alternatives={alternatives || []}
                              onClose={() => handleCloseAlternatives(item)}
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

                          {/* 餐厅建议占位符 */}
                          {showRestaurantSuggestion && (
                            <RestaurantSuggestionPlaceholder
                              time="12:00-13:00"
                              onClick={() => {
                                // 触发餐厅选择模式
                                const currentDay = itineraryData.itinerary[selectedDayIndex].day;
                                handleOpenRestaurantSelection(currentDay);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 右栏：大地图 + 预算 */}
              <div className="w-[60%] flex-shrink-0 space-y-4 sticky top-4 h-fit">
                {/* 交互式大地图 */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-xl">
                  {/* 地图标题条 */}
                  <div className="bg-black/30 backdrop-blur-sm px-4 py-2 border-b border-white/20">
                    <span className="text-sm text-white font-medium">
                      {itineraryData.itinerary[selectedDayIndex]?.date || ''} · 路线地图
                    </span>
                  </div>
                  {/* 地图容器 - 放大 */}
                  <div className="h-[500px] relative">
                    {itineraryData.itinerary[selectedDayIndex] && (
                      <DayMap
                        day={itineraryData.itinerary[selectedDayIndex]}
                        hotel={showHotelOnMap ? selectedHotel : null}
                        restaurant={showRestaurantOnMap ? selectedRestaurants[itineraryData.itinerary[selectedDayIndex].day] : null}
                        showHotel={showHotelOnMap}
                        showRestaurant={showRestaurantOnMap}
                        candidateHotels={selectingHotel ? candidateHotelsVisible : []}
                        candidateRestaurants={selectingRestaurantForDay === itineraryData.itinerary[selectedDayIndex].day
                          ? candidateRestaurantsVisible[itineraryData.itinerary[selectedDayIndex].day] || []
                          : []
                        }
                      />
                    )}
                  </div>
                </div>

                {/* 餐厅选择面板 */}
                {selectingRestaurantForDay === itineraryData.itinerary[selectedDayIndex].day && (
                  <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">选择餐厅</span>
                        <span className="text-xs text-white/50">第{selectingRestaurantForDay}天午餐</span>
                      </div>
                      <button
                        onClick={handleCloseRestaurantSelection}
                        className="text-xs text-white/60 hover:text-white flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        关闭
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(candidateRestaurantsVisible[selectingRestaurantForDay] || []).map((restaurant, index) => {
                        const isSelected = selectedRestaurants[selectingRestaurantForDay]?.name === restaurant.name;
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectRestaurant(selectingRestaurantForDay, restaurant)}
                            className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                              isSelected
                                ? 'bg-green-500/20 border-green-400/50 shadow-lg shadow-green-500/20'
                                : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-lg mb-1">🍽️</div>
                              <div className="text-xs font-semibold text-white truncate">{restaurant.name}</div>
                              <div className="text-xs text-white/60 mt-1">{restaurant.type}</div>
                              {restaurant.rating && (
                                <div className="text-xs text-amber-400 mt-1">⭐ {restaurant.rating}</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 酒店选择面板 */}
                {selectingHotel && (
                  <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">选择酒店</span>
                        <span className="text-xs text-white/50">住宿推荐</span>
                      </div>
                      <button
                        onClick={handleCloseHotelSelection}
                        className="text-xs text-white/60 hover:text-white flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        关闭
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {candidateHotelsVisible.map((hotel, index) => {
                        const isSelected = selectedHotel?.name === hotel.name;
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectHotel(hotel)}
                            className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                              isSelected
                                ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/20'
                                : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-lg mb-1">🏨</div>
                              <div className="text-xs font-semibold text-white truncate">{hotel.name}</div>
                              <div className="text-xs text-white/60 mt-1">{hotel.type}</div>
                              {hotel.rating && (
                                <div className="text-xs text-amber-400 mt-1">⭐ {hotel.rating}</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 紧凑预算分布 */}
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">预算分布</span>
                    <span className="text-xs text-white/50">
                      ¥{budgetInfo?.totalSpent || 0} / ¥{itineraryData.summary?.budget || itineraryData.total_cost || 0}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { label: '交通', value: itineraryData.budget_breakdown.transportation, color: 'bg-blue-500' },
                      { label: '住宿', value: itineraryData.budget_breakdown.accommodation, color: 'bg-purple-500' },
                      { label: '餐饮', value: itineraryData.budget_breakdown.dining, color: 'bg-amber-500' },
                      { label: '门票', value: itineraryData.budget_breakdown.tickets, color: 'bg-green-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 text-center">
                        <div className={`${item.color} h-2 rounded-full mb-1`} style={{ opacity: 0.6 }} />
                        <div className="text-xs text-white/60">{item.label}</div>
                        <div className="text-sm font-semibold text-white">¥{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 酒店Tab */}
        {activeTab === 'hotel' && itineraryData.itinerary && itineraryData.summary?.budget && (
          <div className="mb-8">
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
              tripId={tripId || (itineraryData as any).tripId}
            />
          </div>
        )}

        {/* 餐厅Tab */}
        {activeTab === 'restaurant' && itineraryData.itinerary && (
          <div className="mb-8">
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
              groupSize={(itineraryData.summary as any)?.groupSize || 1}
              tripId={tripId || (itineraryData as any).tripId}
              onLoadData={(recommendations) => setRestaurantRecommendations(recommendations)}
            />
          </div>
        )}

        {/* 费用Tab */}
        {activeTab === 'budget' && (
          <div className="mb-8">
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
          </div>
        )}

        {/* 底部操作按钮 - 简化设计 */}
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          {/* 状态提示 */}
          {isSavedTrip && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-sm text-white/60">
              {tripStatus === 'completed' ? '✅ 已完成' : '📝 规划中'}
            </div>
          )}

          {/* 主要操作按钮 */}
          {!isSavedTrip && (
            <button
              onClick={handleConfirmItinerary}
              disabled={confirming}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
              <span>{confirming ? '保存中...' : '保存行程'}</span>
            </button>
          )}

          {/* 完成行程按钮 */}
          {isSavedTrip && tripStatus === 'planning' && (
            <button
              onClick={() => {
                Modal.confirm({
                  title: '确认完成行程？',
                  content: '完成后将无法再修改行程，但可以上传图片和写游记',
                  okText: '确认完成',
                  cancelText: '取消',
                  onOk: handleCompleteTrip,
                });
              }}
              disabled={completing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              <CheckCircle className="h-5 w-5" />
              <span>{completing ? '处理中...' : '完成行程'}</span>
            </button>
          )}

          {/* 写游记按钮 */}
          {tripStatus === 'completed' && (
            <button
              onClick={handleWriteBlog}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <PenLine className="h-5 w-5" />
              <span>写游记</span>
            </button>
          )}
        </div>
      </div>

      {/* 调整建议弹窗 */}
      <Modal
        title="行程调整建议"
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        onOk={handleApplyAdjustment}
        okText="应用调整"
        cancelText="取消"
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

      {/* 浮动AI按钮 */}
      <button
        onClick={() => navigate('/ai-features')}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/40 hover:scale-110 hover:shadow-xl transition-all duration-300 animate-pulse"
        style={{ animationDuration: '3s' }}
      >
        <Sparkles className="w-7 h-7 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </button>

      {/* 酒店选择抽屉 */}
      <HotelDrawer
        selectedHotel={selectedHotel}
        onHotelSelect={(hotel) => setSelectedHotel(hotel)}
        onHotelRemove={() => {
          setSelectedHotel(null);
          message.info('已取消酒店选择');
        }}
        onOpenSelection={handleOpenHotelSelection}
      />
    </GlassLayout>
  );
}

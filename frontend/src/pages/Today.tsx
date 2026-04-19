// 当前行程页面 - 三栏布局：左侧时间线、中间景点详情、右侧地图和预算
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, Clock, CheckCircle, ChevronLeft, ChevronRight, Star, Wallet, 
  ArrowRight, X, Plus, Minus, Cloud, Users, Package, Thermometer, 
  Droplets, Navigation, Edit, Calendar, Check, ChevronDown, Utensils,
  Image as ImageIcon
} from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import { GlassCard } from '../components/home';
import { 
  getTripById, 
  getUserTrips, 
  completeTrip, 
  getPackingList,
  initializePackingList,
  updatePackingItem,
  getSpotCoverImage,
  batchGetSpotImagesByIds,
  apiClient,
  AttractionItem,
  PackingItem
} from '../api/client';
import { message, Modal, Input } from 'antd';
import AMapLoader from '@amap/amap-jsapi-loader';

// 行程数据类型
interface TripData {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  actualBudget: number;
  status: string;
  days: DayData[];
  budget?: BudgetData;
}

interface DayData {
  id: string;
  dayNumber: number;
  date: string;
  notes?: string;
  itineraryItems: ItineraryItemData[];
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLocation?: string;
}

interface ItineraryItemData {
  id: string;
  name: string;
  type: string;
  category?: string;
  description?: string;
  startTime: string;
  endTime: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cost: number;
  spotId?: string;
}

interface BudgetData {
  transportation: number;
  accommodation: number;
  food: number;
  tickets: number;
  shopping: number;
  other: number;
}

// 高德地图类型声明
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

export default function TodayGlass() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripIdFromUrl = searchParams.get('tripId');
  
  const [tripsList, setTripsList] = useState<TripData[]>([]);
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedAttraction, setSelectedAttraction] = useState<ItineraryItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTripSelector, setShowTripSelector] = useState(false);
  
  // 打包清单
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  
  // 预算编辑
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetEdit, setBudgetEdit] = useState({ spent: 0, note: '' });
  
  // 已访问景点状态
  const [visitedAttractions, setVisitedAttractions] = useState<Set<string>>(new Set());
  
  // 景点图片
  const [spotImages, setSpotImages] = useState<Record<string, string>>({});
  const [spotImagesByName, setSpotImagesByName] = useState<Record<string, string>>({});
  const [citySpotLookup, setCitySpotLookup] = useState<{
    byId: Record<string, [number, number]>;
    byName: Record<string, [number, number]>;
  }>({ byId: {}, byName: {} });
  
  // 地图相关
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylinesRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
  const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

  // 加载用户行程列表
  useEffect(() => {
    loadUserTrips();
  }, []);

  // 当行程列表加载完成后，选择最近日期的行程
  useEffect(() => {
    if (tripsList.length > 0) {
      if (tripIdFromUrl) {
        const trip = tripsList.find(t => t.id === tripIdFromUrl);
        if (trip) {
          setCurrentTrip(trip);
          loadPackingList(trip.id);
        }
      } else {
        const nearestTrip = findNearestTrip(tripsList);
        setCurrentTrip(nearestTrip);
        loadPackingList(nearestTrip.id);
      }
    }
  }, [tripsList, tripIdFromUrl]);

  // 加载景点图片（使用批量API，更高效）
  useEffect(() => {
    if (!currentTrip?.days) return;
    
    const loadImages = async () => {
      // 收集所有景点ID
      const spotIds = new Set<string>();
      const nameFallbacks = new Set<string>();
      for (const day of currentTrip.days) {
        for (const item of day.itineraryItems) {
          if (item.spotId) {
            if (!spotImages[item.spotId]) {
              spotIds.add(item.spotId);
            }
          } else if (item.name && !spotImagesByName[item.name]) {
            nameFallbacks.add(item.name);
          }
        }
      }
      
      const idsToLoad = Array.from(spotIds);
      
      try {
        if (idsToLoad.length > 0) {
          // 使用批量API获取图片
          const response = await batchGetSpotImagesByIds(idsToLoad);

          // 兼容后端实际返回结构：{ success, data: { images, count } }
          const imageMap = response?.data?.images || response?.images || response?.data || {};

          if (response?.success && imageMap && Object.keys(imageMap).length > 0) {
            setSpotImages(prev => ({ ...prev, ...imageMap }));
          }

          // 对批量接口未命中的景点，按名称走封面图兜底
          for (const day of currentTrip.days) {
            for (const item of day.itineraryItems) {
              if (!item.name) continue;
              if (!item.spotId) continue;
              if (imageMap[item.spotId]) continue;
              if (spotImagesByName[item.name]) continue;
              nameFallbacks.add(item.name);
            }
          }
        }

        if (nameFallbacks.size > 0) {
          const namesToLoad = Array.from(nameFallbacks);
          const fallbackResults = await Promise.allSettled(
            namesToLoad.map((name) => getSpotCoverImage(name, currentTrip.destination))
          );

          const fallbackMap: Record<string, string> = {};
          fallbackResults.forEach((result, index) => {
            if (result.status !== 'fulfilled') return;
            const imageUrl = result.value?.data?.imageUrl;
            if (!imageUrl) return;
            fallbackMap[namesToLoad[index]] = imageUrl;
          });

          if (Object.keys(fallbackMap).length > 0) {
            setSpotImagesByName(prev => ({ ...prev, ...fallbackMap }));
          }
        }
      } catch (e) {
        console.error('加载景点图片失败:', e);
      }
    };
    
    loadImages();
  }, [currentTrip, spotImages, spotImagesByName]);

  // 加载当前城市景点坐标，用于修复历史行程中缺失的 latitude/longitude 字段
  useEffect(() => {
    if (!currentTrip?.destination) {
      setCitySpotLookup({ byId: {}, byName: {} });
      return;
    }

    const loadCitySpots = async () => {
      try {
        const response = await apiClient.get(`/spots/city/${encodeURIComponent(currentTrip.destination)}`, {
          params: { limit: 500 },
        });

        const spots = response?.data?.data || [];
        const byId: Record<string, [number, number]> = {};
        const byName: Record<string, [number, number]> = {};

        spots.forEach((spot: any) => {
          if (!spot?.location || typeof spot.location !== 'string') return;
          const [lng, lat] = spot.location.split(',').map(Number);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
          byId[spot.id] = [lng, lat];
          if (spot.name) {
            byName[spot.name] = [lng, lat];
          }
        });

        setCitySpotLookup({ byId, byName });
      } catch (error) {
        console.warn('加载城市景点坐标失败，将仅使用行程内坐标:', error);
        setCitySpotLookup({ byId: {}, byName: {} });
      }
    };

    loadCitySpots();
  }, [currentTrip?.destination]);

  const getItemCoordinates = (item: ItineraryItemData): [number, number] | null => {
    const hasDirectCoords = Number.isFinite(item.longitude) && Number.isFinite(item.latitude) &&
      item.longitude !== 0 && item.latitude !== 0;

    if (hasDirectCoords) {
      return [item.longitude as number, item.latitude as number];
    }

    if (item.spotId && citySpotLookup.byId[item.spotId]) {
      return citySpotLookup.byId[item.spotId];
    }

    if (item.name && citySpotLookup.byName[item.name]) {
      return citySpotLookup.byName[item.name];
    }

    return null;
  };

  const getAttractionImage = (item: ItineraryItemData): string | null => {
    if (item.spotId && spotImages[item.spotId]) {
      return spotImages[item.spotId];
    }
    if (item.name && spotImagesByName[item.name]) {
      return spotImagesByName[item.name];
    }
    return null;
  };

  // 初始化地图
  useEffect(() => {
    // 地图容器在 currentTrip 分支内渲染，必须等行程数据就绪后再初始化
    if (!amapKey || !currentTrip) return;

    const initTimer = setTimeout(() => {
      window._AMapSecurityConfig = {
        securityJsCode: amapSecret,
      };

      AMapLoader.load({
        key: amapKey,
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.Marker', 'AMap.Polyline', 'AMap.Geocoder']
      }).then((AMap) => {
        const container = document.getElementById('today-map');
        if (!container) {
          console.warn('today-map 容器未就绪，跳过本次地图初始化');
          return;
        }

        const map = new AMap.Map(container, {
          zoom: 12,
          center: [116.397428, 39.90923],
          viewMode: '2D',
          mapStyle: 'amap://styles/normal',
          features: ['bg', 'road', 'building', 'point'],
          showLabel: true,
        });

        map.addControl(new AMap.ToolBar({ position: 'RB' }));
        map.addControl(new AMap.Scale());

        mapRef.current = map;
        setMapLoaded(true);
      }).catch((error) => {
        console.error('地图初始化失败:', error);
      });
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  }, [amapKey, amapSecret, currentTrip]);

  // 更新地图标记
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !currentTrip?.days) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    const currentDay = currentTrip.days[selectedDayIndex];
    if (!currentDay || !currentDay.itineraryItems) return;

    const bounds: any[] = [];
    currentDay.itineraryItems.forEach((item, index) => {
      const coords = getItemCoordinates(item);
      if (!coords) return;

      const [lng, lat] = coords;
      bounds.push([lng, lat]);

      const isSelected = selectedAttraction?.id === item.id;
      const isVisited = visitedAttractions.has(item.id);
      const markerColor = isVisited ? '#9CA3AF' : (isSelected ? '#F59E0B' : '#3B82F6');
      
      const markerContent = `
        <div style="
          background: ${markerColor};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          ${isSelected ? 'transform: scale(1.2);' : ''}
          ${isVisited ? 'opacity: 0.6;' : ''}
        ">
          ${isVisited ? '✓' : index + 1}
        </div>
      `;

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: markerContent,
        offset: new window.AMap.Pixel(-16, -16),
        extData: item,
      });

      marker.on('click', () => {
        setSelectedAttraction(item);
      });

      marker.setMap(mapRef.current);
      markersRef.current.set(item.id, marker);
    });

    if (bounds.length > 1) {
      const polyline = new window.AMap.Polyline({
        path: bounds,
        strokeColor: '#F59E0B',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
        showDir: true,
      });
      polyline.setMap(mapRef.current);
      polylinesRef.current.push(polyline);
    }

    if (bounds.length > 0) {
      mapRef.current.setFitView();
    }
  }, [currentTrip, selectedDayIndex, selectedAttraction, mapLoaded, visitedAttractions, citySpotLookup]);

  const loadUserTrips = async () => {
    try {
      setLoading(true);
      const response = await getUserTrips();
      if (response.success && response.data) {
        setTripsList(response.data);
      }
    } catch (error) {
      console.error('加载行程列表失败:', error);
      message.error('加载行程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPackingList = async (tripId: string) => {
    try {
      const response = await getPackingList(tripId);
      if (response.success && response.data) {
        setPackingItems(response.data);
      } else {
        const initResponse = await initializePackingList(tripId);
        if (initResponse.success && initResponse.data) {
          setPackingItems(initResponse.data);
        }
      }
    } catch (error) {
      console.error('加载打包清单失败:', error);
    }
  };

  const findNearestTrip = (trips: TripData[]): TripData => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const sortedTrips = [...trips].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
    
    const upcomingTrip = sortedTrips.find(trip => trip.startDate >= today);
    if (upcomingTrip) return upcomingTrip;
    
    const pastTrips = sortedTrips.filter(trip => trip.startDate < today);
    if (pastTrips.length > 0) return pastTrips[pastTrips.length - 1];
    
    return sortedTrips[0];
  };

  const handleTripChange = (trip: TripData) => {
    setCurrentTrip(trip);
    setSelectedDayIndex(0);
    setSelectedAttraction(null);
    setShowTripSelector(false);
    loadPackingList(trip.id);
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    try {
      await completeTrip(currentTrip.id);
      message.success('行程已完成');
      loadUserTrips();
    } catch (error) {
      console.error('完成行程失败:', error);
      message.error('完成行程失败');
    }
  };

  const handleMarkVisited = (attractionId: string) => {
    setVisitedAttractions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attractionId)) {
        newSet.delete(attractionId);
      } else {
        newSet.add(attractionId);
      }
      return newSet;
    });
  };

  const handlePackingToggle = async (item: PackingItem) => {
    try {
      await updatePackingItem(item.id, { isPacked: !item.isPacked });
      setPackingItems(items => 
        items.map(i => i.id === item.id ? { ...i, isPacked: !i.isPacked } : i)
      );
    } catch (error) {
      console.error('更新打包状态失败:', error);
    }
  };

  // 获取景点状态（已访问/进行中/未开始）
  const getAttractionStatus = (item: ItineraryItemData, index: number, items: ItineraryItemData[]) => {
    const itemId = item.id;
    
    // 已访问
    if (visitedAttractions.has(itemId)) {
      return { status: 'visited', label: '已访问', color: 'gray' };
    }
    
    const now = new Date();
    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    
    // 进行中（当前时间在开始和结束之间）
    if (now >= startTime && now <= endTime) {
      return { status: 'inProgress', label: '进行中', color: 'amber' };
    }
    
    // 未开始
    return { status: 'pending', label: '未开始', color: 'green' };
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      month: date.getMonth() + 1,
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const calculateBudget = () => {
    if (!currentTrip?.budget) {
      return { spent: 0, remaining: currentTrip?.totalBudget || 0 };
    }
    const spent = currentTrip.budget.tickets + currentTrip.budget.food + 
                  currentTrip.budget.accommodation + currentTrip.budget.transportation +
                  currentTrip.budget.shopping + currentTrip.budget.other;
    return {
      spent,
      remaining: (currentTrip.totalBudget || 0) - spent
    };
  };

  const budget = calculateBudget();

  return (
    <GlassLayout showSearch={false}>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* 顶部行程选择器和日期选择 */}
        {currentTrip && (
          <div className="flex-shrink-0 mb-4 space-y-3">
            {/* 行程选择器 */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <button
                  onClick={() => setShowTripSelector(!showTripSelector)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-between hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-amber-500" />
                    <div className="text-left">
                      <div className="font-semibold">{currentTrip.title || currentTrip.destination}</div>
                      <div className="text-xs text-white/60">
                        {formatDateShort(currentTrip.startDate).month}月{formatDateShort(currentTrip.startDate).day}日 - {formatDateShort(currentTrip.endDate).month}月{formatDateShort(currentTrip.endDate).day}日
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showTripSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {showTripSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 max-h-64 overflow-y-auto">
                    {tripsList.map(trip => (
                      <button
                        key={trip.id}
                        onClick={() => handleTripChange(trip)}
                        className={`w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-center gap-3 ${
                          trip.id === currentTrip.id ? 'bg-amber-50' : ''
                        }`}
                      >
                        <MapPin className="h-4 w-4 text-amber-500" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{trip.title || trip.destination}</div>
                          <div className="text-xs text-gray-500">
                            {formatDateShort(trip.startDate).month}月{formatDateShort(trip.startDate).day}日 - {formatDateShort(trip.endDate).month}月{formatDateShort(trip.endDate).day}日
                          </div>
                        </div>
                        {trip.id === currentTrip.id && <Check className="h-4 w-4 text-amber-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 日期选择器 */}
            {currentTrip.days && currentTrip.days.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {currentTrip.days.map((day, index) => {
                  const dateInfo = formatDateShort(day.date);
                  const isSelected = index === selectedDayIndex;
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayIndex(index)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                        isSelected 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                          : 'bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-white/90'}`}>
                          {dateInfo.day}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
                          周{dateInfo.weekday}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 主内容区域 - 三栏布局 */}
        {currentTrip ? (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* 左侧：时间线 */}
            <div className="w-72 flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  今日行程
                </h3>
                {currentTrip.days?.[selectedDayIndex]?.itineraryItems && (
                  <p className="text-sm text-white/60 mt-1">
                    共 {currentTrip.days[selectedDayIndex].itineraryItems.length} 个景点
                  </p>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {currentTrip.days?.[selectedDayIndex] ? (
                  <div className="space-y-0">
                    {currentTrip.days[selectedDayIndex].itineraryItems.map((item, index, items) => {
                      const { status, label, color } = getAttractionStatus(item, index, items);
                      const isSelected = selectedAttraction?.id === item.id;
                      const time = formatTime(item.startTime);
                      const isVisited = status === 'visited';
                      const isInProgress = status === 'inProgress';
                      const isLast = index === items.length - 1;
                      
                      return (
                        <div key={item.id} className="flex items-start gap-3">
                          {/* 时间节点和连接线 */}
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div
                              className={`rounded-full z-10 transition-all duration-300 flex-shrink-0 flex items-center justify-center ${
                                isVisited
                                  ? 'w-5 h-5 bg-gray-400 ring-2 ring-gray-400/40'
                                  : isInProgress
                                    ? 'w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-600 ring-4 ring-amber-400/40 shadow-lg shadow-amber-500/50 animate-pulse'
                                    : 'w-4 h-4 bg-gradient-to-br from-green-400 to-green-600'
                              }`}
                            >
                              {isVisited && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 h-16 flex-shrink-0 ${
                                isVisited 
                                  ? 'bg-gray-400/40' 
                                  : isInProgress 
                                    ? 'bg-gradient-to-b from-amber-400/60 to-amber-600/60'
                                    : 'bg-gradient-to-b from-green-400/60 to-green-600/60'
                              }`} />
                            )}
                          </div>
                          
                          {/* 时间和内容 */}
                          <div 
                            onClick={() => setSelectedAttraction(item)}
                            className={`flex-1 pb-4 cursor-pointer group transition-all ${
                              isVisited ? 'opacity-50' : isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                            }`}
                          >
                            <div className={`bg-white/60 backdrop-blur-xl rounded-xl px-4 py-2 border transition-all duration-300 mb-2 ${
                              isSelected 
                                ? 'border-amber-400/50 shadow-lg scale-105' 
                                : isInProgress
                                  ? 'border-amber-400/30 shadow-md'
                                  : 'border-white/30 hover:border-white/50'
                            }`}>
                              <div className="text-base font-bold text-white whitespace-nowrap">{time}</div>
                            </div>
                            <div className={`text-sm ${isVisited ? 'text-white/40 line-through' : 'text-white/80'} truncate`}>
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isVisited 
                                  ? 'bg-gray-500/20 text-gray-400' 
                                  : isInProgress
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-white/10 text-white/60'
                              }`}>
                                {label}
                              </span>
                              {!isVisited && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkVisited(item.id);
                                  }}
                                  className="text-xs text-amber-400 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  标记已访问
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* 餐厅信息 */}
                    {currentTrip.days[selectedDayIndex].restaurantName && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                              <Utensils className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="bg-orange-500/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-orange-400/30">
                              <div className="text-sm font-semibold text-white">{currentTrip.days[selectedDayIndex].restaurantName}</div>
                              {currentTrip.days[selectedDayIndex].restaurantAddress && (
                                <div className="text-xs text-white/60 mt-1">{currentTrip.days[selectedDayIndex].restaurantAddress}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white/60 py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>暂无行程安排</p>
                  </div>
                )}
              </div>
            </div>

            {/* 中间：景点详情 */}
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  景点详情
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {selectedAttraction ? (
                  <div className="space-y-4">
                    {/* 景点卡片 */}
                    <div className="bg-white/80 backdrop-blur-xl border-2 border-white/50 rounded-3xl overflow-hidden shadow-xl">
                      {/* 景点图片 */}
                      <div className="relative h-56 bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                        {getAttractionImage(selectedAttraction) ? (
                          <img 
                            src={getAttractionImage(selectedAttraction) as string} 
                            alt={selectedAttraction.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-16 w-16 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h4 className="text-2xl font-bold text-white">{selectedAttraction.name}</h4>
                          {selectedAttraction.category && (
                            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm text-white">
                              {selectedAttraction.category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 景点信息 */}
                      <div className="p-6 space-y-4">
                        {/* 时间 */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">游玩时间</div>
                            <div className="font-semibold text-gray-800">
                              {formatTime(selectedAttraction.startTime)} - {formatTime(selectedAttraction.endTime)}
                            </div>
                          </div>
                        </div>
                        
                        {/* 地址 */}
                        {selectedAttraction.address && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">地址</div>
                              <div className="font-medium text-gray-800">{selectedAttraction.address}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* 费用 */}
                        {selectedAttraction.cost > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                              <Wallet className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">门票费用</div>
                              <div className="font-semibold text-amber-600">¥{selectedAttraction.cost}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* 描述 */}
                        {selectedAttraction.description && (
                          <div className="pt-4 border-t border-gray-100">
                            <h5 className="font-semibold text-gray-800 mb-2">景点介绍</h5>
                            <p className="text-gray-600 leading-relaxed">{selectedAttraction.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      {/* 返回按钮 */}
                      <button
                        onClick={() => setSelectedAttraction(null)}
                        className="py-3 px-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="h-5 w-5" />
                        返回
                      </button>
                      <button
                        onClick={() => {
                          const coords = getItemCoordinates(selectedAttraction);
                          if (coords) {
                            mapRef.current?.setCenter(coords);
                            mapRef.current?.setZoom(15);
                          }
                        }}
                        className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation className="h-5 w-5" />
                        在地图上查看
                      </button>
                      <button
                        onClick={() => handleMarkVisited(selectedAttraction.id)}
                        className={`py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                          visitedAttractions.has(selectedAttraction.id)
                            ? 'bg-gray-500 text-white'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        <CheckCircle className="h-5 w-5" />
                        {visitedAttractions.has(selectedAttraction.id) ? '已访问' : '标记已访问'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/60 py-12">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>请从左侧时间线选择景点</p>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：地图和实时看板 */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
              {/* 地图 */}
              <div className="h-64 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden relative">
                <div id="today-map" className="w-full h-full"></div>
                <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                  <button
                    onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
                    className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Plus className="h-4 w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
                    className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Minus className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
              </div>
              
              {/* 实时看板 */}
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-amber-500" />
                    实时看板
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* 打包清单 */}
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-white">打包清单</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">
                          {packingItems.filter(i => i.isPacked).length}/{packingItems.length}
                        </span>
                        <button 
                          onClick={() => setShowPackingModal(true)}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {packingItems.length > 0 ? (
                        packingItems.slice(0, 5).map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handlePackingToggle(item)}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <div className={`w-4 h-4 rounded border transition-all ${
                              item.isPacked 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-white/40 group-hover:border-white/60'
                            }`}>
                              {item.isPacked && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <span className={`text-sm transition-all ${
                              item.isPacked ? 'text-white/40 line-through' : 'text-white/80'
                            }`}>{item.itemName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-white/40 py-4">
                          <p className="text-sm">暂无打包清单</p>
                        </div>
                      )}
                      {packingItems.length > 5 && (
                        <button 
                          onClick={() => setShowPackingModal(true)}
                          className="w-full text-xs text-amber-400 hover:text-amber-300 pt-1"
                        >
                          查看全部 ({packingItems.length - 5} 项)
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 预算管理 */}
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-white">预算管理</span>
                      </div>
                      <button 
                        onClick={() => {
                          setBudgetEdit({ spent: budget.spent, note: '' });
                          setShowBudgetModal(true);
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        编辑
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">总预算</span>
                        <span className="text-sm font-semibold text-white">¥{(currentTrip.totalBudget || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">已花费</span>
                        <span className="text-sm font-semibold text-amber-400">¥{budget.spent.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">剩余预算</span>
                        <span className={`text-sm font-semibold ${budget.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ¥{budget.remaining.toFixed(0)}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full transition-all"
                          style={{ width: `${Math.min((budget.spent / (currentTrip.totalBudget || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <GlassCard className="p-8 text-center max-w-md">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">还没有行程</h3>
              <p className="text-white/60 mb-4">创建一个新行程开始您的旅行吧！</p>
              <button
                onClick={() => navigate('/plan')}
                className="px-6 py-3 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
              >
                创建行程
              </button>
            </GlassCard>
          </div>
        )}

        {/* 右下角浮动按钮 */}
        {currentTrip && (
          <div className="fixed bottom-8 right-8 z-30 flex flex-col gap-2">
            <button
              onClick={handleCompleteTrip}
              className="px-4 py-2 rounded-lg bg-green-500/90 backdrop-blur-md text-white hover:bg-green-600 transition-colors shadow-lg flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              完成行程
            </button>
            <button
              onClick={() => navigate(`/trip/${currentTrip.id}`)}
              className="px-4 py-2 rounded-lg bg-amber-500/90 backdrop-blur-md text-white hover:bg-amber-600 transition-colors shadow-lg flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              查看详情
            </button>
          </div>
        )}

        {/* 打包清单编辑弹窗 */}
        <Modal
          title="打包清单"
          open={showPackingModal}
          onCancel={() => setShowPackingModal(false)}
          footer={null}
        >
          <div className="space-y-3">
            {packingItems.map(item => (
              <div 
                key={item.id}
                onClick={() => handlePackingToggle(item)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className={`w-5 h-5 rounded border-2 transition-all ${
                  item.isPacked 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {item.isPacked && <CheckCircle className="w-5 h-5 text-white" />}
                </div>
                <span className={item.isPacked ? 'text-gray-400 line-through' : ''}>{item.itemName}</span>
              </div>
            ))}
          </div>
        </Modal>

        {/* 预算编辑弹窗 */}
        <Modal
          title="预算管理"
          open={showBudgetModal}
          onCancel={() => setShowBudgetModal(false)}
          footer={null}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总预算</label>
              <Input 
                value={currentTrip?.totalBudget || 0}
                disabled
                prefix="¥"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">已花费</label>
              <Input 
                value={budgetEdit.spent}
                onChange={(e) => setBudgetEdit({ ...budgetEdit, spent: Number(e.target.value) })}
                prefix="¥"
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">剩余预算</label>
              <Input 
                value={(currentTrip?.totalBudget || 0) - budgetEdit.spent}
                disabled
                prefix="¥"
              />
            </div>
          </div>
        </Modal>

        {/* 加载状态 */}
        {loading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          </div>
        )}
      </div>
    </GlassLayout>
  );
}









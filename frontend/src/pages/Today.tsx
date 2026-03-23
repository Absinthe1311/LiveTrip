// 当前行程页面 - 连接后端接口
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, PenLine, List, MapPin, ChevronRight, Navigation, Route, Search as SearchIcon, ChevronDown } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { getUserTrips, getTripById } from '../api/client';
import AMapLoader from '@amap/amap-jsapi-loader';
import ShareButton from '../components/ShareButton';
import PDFExportButton from '../components/PDFExportButton';

// 高德地图类型定义
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: any;
  }
}

interface Trip {
  id: string;
  summary: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'ongoing' | 'completed';
  itinerary: DayItinerary[];
  hotel?: any;
  restaurants?: any[];
}

interface DayItinerary {
  day: number;
  date: string;
  attractions: Attraction[];
  dailyCost: number;
  restaurant?: {
    name: string;
    address?: string;
    location?: string;
    tel?: string;
    type?: string;
    rating?: number;
  };
}

interface Attraction {
  id: string;
  name: string;
  time: string;
  category: string;
  tags?: string[];
  location: string;
  ticketPrice?: number;
  status?: 'completed' | 'current' | 'pending';
  crowdLevel?: string;
  weather?: string;
  description?: string;
}

export default function Today() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTripSelector, setShowTripSelector] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      console.log('📝 开始加载行程列表...');
      const response = await getUserTrips();

      if (response.success && response.data) {
        console.log('✅ 行程列表加载成功:', response.data);
        const allTrips = response.data;

        // 过滤出未完成的行程
        const uncompletedTrips = allTrips.filter((trip: any) =>
          trip.status === 'planning' || trip.status === 'ongoing'
        );

        console.log(`📊 过滤后的未完成行程数量: ${uncompletedTrips.length}`);

        // 转换为前端期望的格式
        const formattedTrips: Trip[] = uncompletedTrips.map((trip: any) => {
          // 将后端的days数据转换为itinerary格式
          const itinerary: DayItinerary[] = trip.days.map((day: any) => ({
            day: day.dayNumber,
            date: new Date(day.date).toISOString().split('T')[0],
            attractions: day.itineraryItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              time: new Date(item.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
              address: item.address || '',
              ticketPrice: item.cost || 0,
              category: item.category || '景点',
              status: 'pending' as const,
              description: item.description || '',
            })),
            dailyCost: day.itineraryItems.reduce((sum: number, item: any) => sum + (item.cost || 0), 0),
            restaurant: day.restaurantName ? {
              name: day.restaurantName,
              address: day.restaurantAddress,
              location: day.restaurantLocation,
              tel: day.restaurantTel,
              type: day.restaurantType,
              rating: day.restaurantRating,
            } : undefined,
          }));

          return {
            id: trip.id,
            summary: trip.title || trip.destination,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            status: trip.status,
            itinerary,
            hotel: trip.hotelName ? {
              name: trip.hotelName,
              address: trip.hotelAddress,
              location: trip.hotelLocation,
              tel: trip.hotelTel,
              type: trip.hotelType,
              rating: trip.hotelRating,
            } : undefined,
            restaurants: trip.days
              .filter((day: any) => day.restaurantName)
              .map((day: any) => ({
                dayNumber: day.dayNumber,
                name: day.restaurantName,
                address: day.restaurantAddress,
                location: day.restaurantLocation,
                tel: day.restaurantTel,
                type: day.restaurantType,
                rating: day.restaurantRating,
              })),
          };
        });

        setTrips(formattedTrips);

        // 如果有未完成的行程，默认选择第一个
        if (formattedTrips.length > 0) {
          console.log('✅ 设置默认行程:', formattedTrips[0]);
          setCurrentTrip(formattedTrips[0]);

          // 找到当前日期对应的行程天数
          const today = new Date().toISOString().split('T')[0];
          const itinerary = formattedTrips[0].itinerary || [];

          if (itinerary.length > 0) {
            const dayIndex = itinerary.findIndex((day: DayItinerary) =>
              day.date === today
            );
            setCurrentDayIndex(dayIndex >= 0 ? dayIndex : 0);
            console.log(`📅 当前日期: ${today}, 选择的天数: Day ${currentDayIndex + 1}`);
          } else {
            setCurrentDayIndex(0);
          }
        } else {
          console.log('⚠️ 没有找到未完成的行程');
        }
      } else {
        console.error('❌ 行程列表加载失败:', response);
      }
    } catch (error) {
      console.error('❌ 加载行程失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrip = async (tripId: string) => {
    try {
      console.log('🔄 切换行程:', tripId);
      const response = await getTripById(tripId);

      if (response.success && response.data) {
        console.log('✅ 行程详情加载成功:', response.data);

        // 转换为前端期望的格式
        const trip = response.data;
        const itinerary: DayItinerary[] = trip.days.map((day: any) => ({
          day: day.dayNumber,
          date: new Date(day.date).toISOString().split('T')[0],
          attractions: day.itineraryItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            time: new Date(item.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
            address: item.address || '',
            ticketPrice: item.cost || 0,
            category: item.category || '景点',
            status: 'pending' as const,
            description: item.description || '',
          })),
          dailyCost: day.itineraryItems.reduce((sum: number, item: any) => sum + (item.cost || 0), 0),
          restaurant: day.restaurantName ? {
            name: day.restaurantName,
            address: day.restaurantAddress,
            location: day.restaurantLocation,
            tel: day.restaurantTel,
            type: day.restaurantType,
            rating: day.restaurantRating,
          } : undefined,
        }));

        const formattedTrip: Trip = {
          id: trip.id,
          summary: trip.title || trip.destination,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          status: trip.status,
          itinerary,
          hotel: trip.hotelName ? {
            name: trip.hotelName,
            address: trip.hotelAddress,
            location: trip.hotelLocation,
            tel: trip.hotelTel,
            type: trip.hotelType,
            rating: trip.hotelRating,
          } : undefined,
          restaurants: trip.days
            .filter((day: any) => day.restaurantName)
            .map((day: any) => ({
              dayNumber: day.dayNumber,
              name: day.restaurantName,
              address: day.restaurantAddress,
              location: day.restaurantLocation,
              tel: day.restaurantTel,
              type: day.restaurantType,
              rating: day.restaurantRating,
            })),
        };

        setCurrentTrip(formattedTrip);
        setCurrentDayIndex(0);
        setShowTripSelector(false);
        console.log('✅ 行程切换成功');
      } else {
        console.error('❌ 行程详情加载失败:', response);
      }
    } catch (error) {
      console.error('❌ 切换行程失败:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { dot: 'bg-primary', bg: 'bg-blue-50', border: '' };
      case 'current':
        return { dot: 'bg-amber-500', bg: 'bg-white', border: 'border-2 border-amber-500' };
      case 'pending':
        return { dot: 'bg-gray-300', bg: 'bg-blue-50', border: '' };
      default:
        return { dot: 'bg-gray-300', bg: '', border: '' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  };

  const currentDayItinerary = currentTrip?.itinerary?.[currentDayIndex];

  // 地图组件
  const DayMap = ({ dayItinerary, hotel, restaurant }: { dayItinerary?: DayItinerary; hotel?: any; restaurant?: any }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylinesRef = useRef<any[]>([]);
    const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
    const amapSecret = import.meta.env.VITE_AMAP_JS_SECRET;

    useEffect(() => {
      if (!mapContainer.current || !amapKey || !dayItinerary || !dayItinerary.attractions || dayItinerary.attractions.length === 0) return;

      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: amapSecret,
      };

      AMapLoader.load({
        key: amapKey,
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale']
      }).then((AMap) => {
        // 提取所有景点的坐标（如果有location字段）
        const coordinates = dayItinerary.attractions
          .filter((item: Attraction) => item.location && item.location !== '未知位置')
          .map((item: Attraction) => {
            // 尝试解析location，格式可能是 "116.397428,39.90923" 或其他格式
            const coords = item.location.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              return coords;
            }
            return null;
          })
          .filter((coords): coords is number[] => coords !== null);

        // 如果有酒店，也加入坐标列表
        if (hotel?.location) {
          const hotelCoords = hotel.location.split(',').map(Number);
          if (hotelCoords.length === 2 && !isNaN(hotelCoords[0]) && !isNaN(hotelCoords[1])) {
            coordinates.push(hotelCoords);
          }
        }

        // 如果有餐厅，也加入坐标列表
        if (restaurant?.location) {
          const restaurantCoords = restaurant.location.split(',').map(Number);
          if (restaurantCoords.length === 2 && !isNaN(restaurantCoords[0]) && !isNaN(restaurantCoords[1])) {
            coordinates.push(restaurantCoords);
          }
        }

        if (coordinates.length === 0) {
          console.warn('⚠️ 没有有效的坐标数据，无法显示地图');
          return;
        }

        // 计算中心点
        const centerLng = coordinates.reduce((sum: number, coords: number[]) => sum + coords[0], 0) / coordinates.length;
        const centerLat = coordinates.reduce((sum: number, coords: number[]) => sum + coords[1], 0) / coordinates.length;

        const map = new AMap.Map(mapContainer.current, {
          zoom: 13,
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
          position: { top: '110px', right: '40px' }
        }));
        map.addControl(new AMap.Scale());

        // 添加餐厅标记（如果有）
        if (restaurant?.location) {
          const restaurantCoords = restaurant.location.split(',').map(Number);
          if (restaurantCoords.length === 2 && !isNaN(restaurantCoords[0]) && !isNaN(restaurantCoords[1])) {
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
        }

        // 添加酒店标记（如果有）
        if (hotel?.location) {
          const hotelCoords = hotel.location.split(',').map(Number);
          if (hotelCoords.length === 2 && !isNaN(hotelCoords[0]) && !isNaN(hotelCoords[1])) {
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
        }

        // 添加景点标记
        dayItinerary.attractions.forEach((item: Attraction, index: number) => {
          if (!item.location || item.location === '未知位置') return;

          const coords = item.location.split(',').map(Number);
          if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

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

        // 绘制景点之间的路线
        const attractionCoords = dayItinerary.attractions
          .filter((item: Attraction) => item.location && item.location !== '未知位置')
          .map((item: Attraction) => {
            const coords = item.location.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              return coords;
            }
            return null;
          })
          .filter((coords): coords is number[] => coords !== null);

        if (attractionCoords.length > 1) {
          const polyline = new AMap.Polyline({
            path: attractionCoords,
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

        console.log('✅ 地图加载成功');
      }).catch((error) => {
        console.error('❌ 地图加载失败:', error);
      });

      return () => {
        // 清理地图
        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }
        markersRef.current = [];
        polylinesRef.current = [];
      };
    }, [dayItinerary, hotel, restaurant, amapKey, amapSecret]);

    if (!dayItinerary || !dayItinerary.attractions || dayItinerary.attractions.length === 0) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无景点信息</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '500px' }} />
    );
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[240px] h-full flex items-center px-5 border-r border-border shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}>
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center"><span className="text-lg">✈️</span></div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">LiveTrip</span>
              <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">AI · IoT · Travel</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="搜索目的地、景点、攻略…" className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none outline-none text-sm focus:ring-2 focus:ring-livetrip-primary/20 transition-all" />
          </div>
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-xs font-medium">ZL</div>
            <span className={`text-sm font-medium text-livetrip-primary-dark ${isLargeScreen ? 'block' : 'hidden'}`}>Zhang Lei</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isLargeScreen={isLargeScreen} currentPage={location.pathname} />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-muted-foreground">加载中...</span>
          </div>
        ) : !currentTrip ? (
          <div className="text-center py-16">
            <MapPin className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">暂无当前行程</h3>
            <p className="text-[14px] text-muted-foreground mb-6">
              创建一个新的行程开始你的旅行吧
            </p>
            <button
              onClick={() => navigate('/plan')}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              创建行程
            </button>
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="bg-white border-b border-border px-6 py-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                  <h1 className="font-serif text-lg font-semibold text-foreground">
                    {currentTrip.summary || currentTrip.destination}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Day {currentDayIndex + 1} · {currentDayItinerary ? formatDate(currentDayItinerary.date) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* 分享和PDF导出按钮 */}
                  {currentTrip?.id && (
                    <>
                      <ShareButton tripId={currentTrip.id} style={{ fontSize: '12px', padding: '4px 12px', height: '32px' }} />
                      <PDFExportButton 
                        tripData={{
                          id: currentTrip.id,
                          title: currentTrip.summary || currentTrip.destination,
                          destination: currentTrip.destination,
                          startDate: currentTrip.startDate,
                          endDate: currentTrip.endDate,
                          totalBudget: 0,
                          days: currentTrip.itinerary?.map((day) => ({
                            dayNumber: day.day,
                            date: day.date,
                            itineraryItems: day.attractions?.map((item) => ({
                              name: item.name,
                              type: item.category || '景点',
                              description: item.description || item.category || '',
                              startTime: `${day.date} ${item.time}`,
                              endTime: `${day.date} ${item.time}`,
                              address: '',
                              cost: item.ticketPrice || 0,
                              longitude: item.location ? parseFloat(item.location.split(',')[0]) : undefined,
                              latitude: item.location ? parseFloat(item.location.split(',')[1]) : undefined,
                            })) || [],
                            restaurantName: day.restaurant?.name,
                            restaurantAddress: day.restaurant?.address,
                            restaurantLocation: day.restaurant?.location,
                            restaurantType: day.restaurant?.type,
                            restaurantRating: day.restaurant?.rating,
                          })) || [],
                          hotel: currentTrip.hotel ? {
                            name: currentTrip.hotel.name,
                            address: currentTrip.hotel.address,
                            location: currentTrip.hotel.location,
                            type: currentTrip.hotel.type,
                            rating: currentTrip.hotel.rating,
                          } : undefined,
                        }}
                        style={{ fontSize: '12px', padding: '4px 12px', height: '32px' }}
                      />
                    </>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowTripSelector(!showTripSelector)}
                      className="px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      切换行程
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {/* Trip Selector Dropdown */}
                    {showTripSelector && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-10">
                        {trips.map((trip) => (
                          <button
                            key={trip.id}
                            onClick={() => handleSelectTrip(trip.id)}
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 transition-colors ${
                              trip.id === currentTrip.id ? 'bg-blue-50 text-primary' : ''
                            }`}
                          >
                            {trip.summary || trip.destination}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Day Selector */}
            {currentTrip.itinerary && currentTrip.itinerary.length > 1 && (
              <div className="bg-white border-b border-border px-6 py-2">
                <div className="max-w-6xl mx-auto flex items-center gap-2">
                  {currentTrip.itinerary.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDayIndex(index)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        index === currentDayIndex
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

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Itinerary Timeline */}
                <div className="space-y-3">
                  {currentDayItinerary?.attractions?.map((item, index) => {
                    const statusStyle = getStatusStyle(item.status || 'pending');
                    return (
                      <div key={item.id || index} className="flex gap-4">
                        {/* Time */}
                        <div className="w-12 text-right">
                          <span className="text-xs font-medium text-foreground">{item.time}</span>
                        </div>

                        {/* Timeline Dot */}
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full ${statusStyle.dot}`}></div>
                          {index < (currentDayItinerary.attractions?.length || 0) - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1"></div>
                          )}
                        </div>

                        {/* Content Card */}
                        <div className={`flex-1 rounded-lg p-3.5 ${statusStyle.bg} ${statusStyle.border}`}>
                          <div className="flex items-start justify-between mb-1.5">
                            <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
                            {item.status === 'current' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                进行中
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Info */}
                          {(item.description || item.category) && (
                            <p className="text-xs text-muted-foreground mb-2">{item.description || item.category}</p>
                          )}

                          {/* IoT Data */}
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            {item.crowdLevel && (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {item.crowdLevel}
                              </span>
                            )}
                            {item.weather && (
                              <span>{item.weather}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!currentDayItinerary?.attractions ||
                   currentDayItinerary.attractions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">当天暂无行程安排</p>
                    </div>
                  ) : null}

                  {/* 酒店信息 */}
                  {currentTrip?.hotel && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🏨</span>
                        <h3 className="text-sm font-semibold text-foreground">住宿酒店</h3>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground mb-1">
                              {currentTrip.hotel.name}
                            </h4>
                            {currentTrip.hotel.type && (
                              <p className="text-xs text-red-600 font-medium mb-1">
                                {currentTrip.hotel.type}
                              </p>
                            )}
                            {currentTrip.hotel.address && (
                              <p className="text-xs text-muted-foreground mb-1">
                                📍 {currentTrip.hotel.address}
                              </p>
                            )}
                            {currentTrip.hotel.tel && (
                              <p className="text-xs text-muted-foreground">
                                📞 {currentTrip.hotel.tel}
                              </p>
                            )}
                          </div>
                          {currentTrip.hotel.rating && (
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded">
                              <span className="text-xs text-amber-600">⭐</span>
                              <span className="text-xs font-medium text-foreground">
                                {currentTrip.hotel.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 餐厅信息 */}
                  {currentDayItinerary?.restaurant && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🍽️</span>
                        <h3 className="text-sm font-semibold text-foreground">午餐餐厅</h3>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground mb-1">
                              {currentDayItinerary.restaurant.name}
                            </h4>
                            {currentDayItinerary.restaurant.type && (
                              <p className="text-xs text-green-600 font-medium mb-1">
                                {currentDayItinerary.restaurant.type}
                              </p>
                            )}
                            {currentDayItinerary.restaurant.address && (
                              <p className="text-xs text-muted-foreground mb-1">
                                📍 {currentDayItinerary.restaurant.address}
                              </p>
                            )}
                            {currentDayItinerary.restaurant.tel && (
                              <p className="text-xs text-muted-foreground">
                                📞 {currentDayItinerary.restaurant.tel}
                              </p>
                            )}
                          </div>
                          {currentDayItinerary.restaurant.rating && (
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded">
                              <span className="text-xs text-amber-600">⭐</span>
                              <span className="text-xs font-medium text-foreground">
                                {currentDayItinerary.restaurant.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Map */}
                <div className="bg-card border border-border rounded-lg overflow-hidden h-[500px]">
                  <DayMap
                    dayItinerary={currentDayItinerary}
                    hotel={currentTrip?.hotel}
                    restaurant={currentDayItinerary?.restaurant}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * 公开行程页面 - 只读视图
 * 用于展示分享的行程，UI风格与TripDetail保持一致
 *
 * AI辅助生成：GLM-5，2026年4月22日
 * 内容说明：实现分享行程的只读查看页面，复用TripDetail的UI组件和样式，
 *          支持景点图片加载、地图显示、酒店餐厅信息展示等功能
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Spin, Button } from 'antd';
import { MapPin, Calendar, Wallet, Cloud, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import TimelineWithCards from '../components/itinerary/TimelineWithCards';
import FullscreenMap from '../components/itinerary/FullscreenMap';
import DayMap from '../components/itinerary/DayMap';
import { getSharedTrip, batchgetSpotImgsByIds } from '../api/client';
import { FullItinerary } from '../api/client';

// 辅助函数
const formatShortDate = (date: string) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

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
        spotId: item.spotId,
        name: item.name,
        time: `${startTime}-${endTime}`,
        location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
        estimated_cost: item.cost || 0,
        description: item.description || item.type || '',
        type: item.type || '景点',
        address: item.address || '',
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

export default function SharedTripPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [spotImages, setSpotImages] = useState<Record<string, string>>({});

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  useEffect(() => {
    if (token) {
      loadSharedTrip(token);
    }
  }, [token]);

  const loadSharedTrip = async (shareToken: string) => {
    setLoading(true);
    try {
      const response = await getSharedTrip(shareToken);
      if (response.success && response.data) {
        const tripData = response.data;
        setTrip(tripData);
        const convertedItinerary = convertDbToItinerary(tripData);
        setItineraryData(convertedItinerary);
        console.log('✅ 分享行程加载成功:', tripData);

        // 加载景点图片
        loadSpotImagesForItinerary(convertedItinerary);
      } else {
        setError(response.error || '加载行程失败');
        message.error(response.error || '加载行程失败');
      }
    } catch (error: any) {
      console.error('加载分享行程失败:', error);
      const errorMsg = error.response?.data?.error || '加载行程失败，请稍后重试';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 加载景点图片
  const loadSpotImagesForItinerary = async (itinerary: FullItinerary) => {
    try {
      const spotIds: string[] = [];
      itinerary.itinerary.forEach((day) => {
        day.attractions.forEach((attraction) => {
          if (attraction.spotId) {
            spotIds.push(attraction.spotId);
          }
        });
      });

      if (spotIds.length === 0) {
        console.log('⚠️ 没有景点ID，跳过图片加载');
        return;
      }

      console.log(`📸 批量获取 ${spotIds.length} 个景点的图片`);
      const response = await batchgetSpotImgsByIds(spotIds);

      if (response.success && response.data) {
        console.log(`✅ 成功加载 ${Object.keys(response.data.images).length} 个景点的图片`);
        setSpotImages(response.data.images);
      }
    } catch (error) {
      console.error('批量获取景点图片失败:', error);
    }
  };

  // 计算总景点数
  const calculateTotalAttractions = () => {
    if (!itineraryData) return 0;
    return itineraryData.itinerary.reduce((sum, day) => sum + day.attractions.length, 0);
  };

  // 获取酒店信息
  const hotel = trip
    ? {
        name: trip.hotelName,
        address: trip.hotelAddress,
        location: trip.hotelLocation,
        type: trip.hotelType,
        rating: trip.hotelRating,
        avgDistance: 0,
        distanceDetails: [],
      }
    : null;

  // 获取餐厅信息
  const getRestaurantForDay = (dayNumber: number) => {
    if (!trip || !trip.days) return null;
    const day = trip.days.find((d: any) => d.dayNumber === dayNumber);
    if (!day || !day.restaurantName) return null;
    return {
      name: day.restaurantName,
      address: day.restaurantAddress,
      location: day.restaurantLocation,
      type: day.restaurantType,
      rating: day.restaurantRating,
      distance: 0,
    };
  };

  // 加载状态
  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '100px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" tip="正在加载行程信息..." />
        <div style={{ marginTop: 16, color: '#fff' }}>
          <p>如果加载时间过长，请检查分享链接是否有效</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !trip || !itineraryData) {
    return (
      <div
        style={{
          padding: '100px 20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>😔 {error || '行程不存在'}</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px' }}>
            该分享链接可能已失效或行程已被删除
          </p>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/')}
            style={{ borderRadius: '8px' }}
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GlassLayout showSearch={false}>
      <div className="max-w-7xl mx-auto pb-20">
        {/* 顶部操作栏 */}
        <div className="mb-6">
          <Button
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/')}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
          >
            返回首页
          </Button>
        </div>

        {/* 封面图片 */}
        {trip.coverImage && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <img src={trip.coverImage} alt={trip.title} className="w-full h-64 object-cover" />
          </div>
        )}

        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-white">{trip.title}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-400/30">
              只读分享
            </span>
          </div>

          {/* 顶部摘要卡片组 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">出行日期</p>
                <p className="text-lg font-bold text-white truncate">
                  {itineraryData.summary?.start_date || '未设置'}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">总预算</p>
                <p className="text-lg font-bold text-white truncate">
                  ¥
                  {(
                    itineraryData.summary?.budget ||
                    itineraryData.total_cost ||
                    0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">目的地</p>
                <p className="text-lg font-bold text-white truncate">
                  {itineraryData.summary?.destination || '未设置'}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-white/60">行程总览</p>
                <p className="text-lg font-bold text-white truncate">
                  {itineraryData.itinerary.length}天 · {calculateTotalAttractions()}景点
                </p>
              </div>
            </div>
          </div>

          {/* 行程描述 */}
          {trip.description && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6">
              <p className="text-white/80">{trip.description}</p>
            </div>
          )}
        </div>

        {/* 每日行程内容 */}
        {itineraryData.itinerary.map((day, dayIndex) => (
          <div key={dayIndex} className="mb-8">
            {/* 日期标题 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-4">
              <h2 className="text-xl font-bold text-white">
                第 {day.day} 天 - {day.date}
              </h2>
            </div>

            <div className="flex gap-4">
              {/* 左栏：景点列表 */}
              <div className="flex-1 min-w-0">
                <TimelineWithCards
                  attractions={day.attractions}
                  city={itineraryData.summary?.destination}
                  iotData={[]}
                  spotImages={spotImages}
                  onShowAlternatives={() => {}}
                  expandedAlternatives={{}}
                  loadingAlternatives={{}}
                  handleCloseAlternatives={() => {}}
                  handleReplaceAttraction={() => {}}
                  onAttractionsReorder={() => {}}
                  readOnly={true}
                />

                {/* 餐厅信息 */}
                {(() => {
                  const restaurant = getRestaurantForDay(day.day);
                  return (
                    restaurant && (
                      <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🍽️</span>
                          <h3 className="text-sm font-semibold text-white">午餐餐厅</h3>
                        </div>
                        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-white mb-1">{restaurant.name}</h4>
                          {restaurant.address && (
                            <p className="text-xs text-white/60">📍 {restaurant.address}</p>
                          )}
                          {restaurant.rating && (
                            <div className="text-xs text-amber-400 mt-1">
                              ⭐ {restaurant.rating}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  );
                })()}
              </div>

              {/* 右栏：地图 + 预算 */}
              <div className="w-[40%] flex-shrink-0 space-y-4 sticky top-4 h-fit">
                {/* 地图 */}
                <FullscreenMap
                  title={`${day.date} · 路线地图`}
                  defaultHeight="h-48"
                  fullscreenHeight="h-[600px]"
                  defaultWidth="w-full"
                  fullscreenWidth="w-full"
                >
                  <DayMap
                    day={day}
                    hotel={hotel}
                    restaurant={getRestaurantForDay(day.day)}
                    showAllRestaurants={false}
                    showAllDays={false}
                    allDays={[]}
                    restaurantRecommendations={[]}
                    hotelRecommendations={[]}
                  />
                </FullscreenMap>
              </div>
            </div>
          </div>
        ))}

        {/* 酒店信息 */}
        {hotel && hotel.name && (
          <div className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏨</span>
              <h2 className="text-xl font-bold text-white">住宿信息</h2>
            </div>
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">{hotel.name}</h3>
              {hotel.address && <p className="text-sm text-white/60 mb-2">📍 {hotel.address}</p>}
              {hotel.type && (
                <span className="inline-block px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs mr-2">
                  {hotel.type}
                </span>
              )}
              {hotel.rating && (
                <span className="inline-block text-amber-400 text-sm">⭐ {hotel.rating}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassLayout>
  );
}

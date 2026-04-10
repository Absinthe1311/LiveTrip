// 当前行程页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Navigation, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getTripById, completeTrip, getUserTrips } from '../api/client';
import { message } from 'antd';
import { FullItinerary } from '../api/client';

interface TripListItem {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: string;
}

export default function TodayGlass() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  
  const [itineraryData, setItineraryData] = useState<FullItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tripsList, setTripsList] = useState<TripListItem[]>([]);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);

  useEffect(() => {
    loadUserTrips();
  }, []);

  useEffect(() => {
    if (tripId) {
      loadTripData(tripId);
    } else if (tripsList.length > 0 && currentTripIndex < tripsList.length) {
      loadTripData(tripsList[currentTripIndex].id);
    }
  }, [tripId, tripsList, currentTripIndex]);

  const loadUserTrips = async () => {
    try {
      const response = await getUserTrips();
      if (response.success && response.data) {
        setTripsList(response.data);
        // 默认加载第一个行程
        if (response.data.length > 0 && !tripId) {
          loadTripData(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('加载行程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTripData = async (id: string) => {
    try {
      setLoading(true);
      const data = await getTripById(id);
      if (data.success && data.data) {
        setItineraryData(data.data);
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

  const handlePreviousTrip = () => {
    if (currentTripIndex > 0) {
      setCurrentTripIndex(currentTripIndex - 1);
    }
  };

  const handleNextTrip = () => {
    if (currentTripIndex < tripsList.length - 1) {
      setCurrentTripIndex(currentTripIndex + 1);
    }
  };

  const handleTripSelect = (index: number) => {
    setCurrentTripIndex(index);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const handleCompleteTrip = async () => {
    if (!tripId) {
      message.warning('请先创建行程');
      return;
    }
    try {
      await completeTrip(tripId);
      message.success('行程已完成');
    } catch (error) {
      console.error('完成行程失败:', error);
      message.error('完成行程失败');
    }
  };

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">当前行程</h1>
            <p className="text-white/60 mt-1">查看和管理您的旅行计划</p>
          </div>
          {itineraryData && (
            <div className="flex items-center gap-4">
              {tripId && (
                <button
                  onClick={handleCompleteTrip}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  完成行程
                </button>
              )}
              <button
                onClick={() => navigate('/plan')}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                修改行程
              </button>
            </div>
          )}
        </div>

        {/* 行程选择器 */}
        {tripsList.length > 0 && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousTrip}
                disabled={currentTripIndex === 0}
                className={`p-2 rounded-lg transition-colors ${
                  currentTripIndex === 0
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-2">
                {tripsList.map((trip, index) => (
                  <button
                    key={trip.id}
                    onClick={() => handleTripSelect(index)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      index === currentTripIndex
                        ? 'bg-livetrip-primary text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {trip.destination || trip.title}
                    </div>
                    <div className="text-xs text-white/60">
                      {formatDate(trip.startDate)}
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleNextTrip}
                disabled={currentTripIndex === tripsList.length - 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentTripIndex === tripsList.length - 1
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </GlassCard>
        )}

        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : !itineraryData ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">还没有当前行程</h3>
              <p className="text-white/60 mb-4">创建一个新行程开始您的旅行吧！</p>
              <button
                onClick={() => navigate('/plan')}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                创建行程
              </button>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* 行程信息卡片 */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">行程概览</h2>
                {tripId && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar className="h-5 w-5" />
                    <span>{formatDate(itineraryData.summary?.start_date || '')} - {formatDate(itineraryData.summary?.end_date || '')}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-white/60 mb-1">目的地</div>
                  <div className="text-lg font-semibold text-white">{itineraryData.summary?.destination || '未知'}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">天数</div>
                  <div className="text-lg font-semibold text-white">{itineraryData.itinerary?.length || 0} 天</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">总费用</div>
                  <div className="text-lg font-semibold text-white">¥{itineraryData.total_cost?.toFixed(0) || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">状态</div>
                  <div className="text-lg font-semibold text-green-400">进行中</div>
                </div>
              </div>
            </GlassCard>

            {/* 每天的行程 */}
            {itineraryData.itinerary && itineraryData.itinerary.map((day, dayIndex) => (
              <GlassCard key={dayIndex} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">第 {dayIndex + 1} 天行程</h2>
                    <p className="text-white/60 mt-1">
                      {day.date && formatDate(day.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin className="h-5 w-5" />
                    <span>{itineraryData.summary?.destination}</span>
                  </div>
                </div>

                {/* 景点列表 */}
                <div className="space-y-4">
                  {day.attractions && day.attractions.map((attraction: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-livetrip-primary/20 flex items-center justify-center">
                        <span className="text-livetrip-primary font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-1">{attraction.name}</h4>
                        <div className="flex items-center gap-4 text-white/60 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{attraction.time || '待定'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{attraction.location || attraction.city}</span>
                          </div>
                        </div>
                        {attraction.description && (
                          <p className="text-sm text-white/60 mt-2">{attraction.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </>
        )}
      </div>
    </GlassLayout>
  );
}

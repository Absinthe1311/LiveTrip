// 当前行程页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Navigation, CheckCircle } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getTripById } from '../api/client';
import { message } from 'antd';

interface ItineraryItem {
  id: string;
  name: string;
  location: string;
  startTime: string;
  endTime: string;
  type: string;
  completed: boolean;
}

interface DaySchedule {
  dayNumber: number;
  date: string;
  items: ItineraryItem[];
}

export default function TodayGlass() {
  const navigate = useNavigate();
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    loadCurrentTrip();
  }, []);

  const loadCurrentTrip = async () => {
    try {
      // 从 localStorage 获取当前行程
      const tripData = localStorage.getItem('currentItinerary');
      if (tripData) {
        const trip = JSON.parse(tripData);
        setCurrentTrip(trip);
      }
    } catch (error) {
      console.error('加载行程失败:', error);
      message.error('加载行程失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
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
          {currentTrip && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/60">
                <Calendar className="h-5 w-5" />
                <span>{currentTrip.data?.summary?.startDate} - {currentTrip.data?.summary?.endDate}</span>
              </div>
              <button
                onClick={() => navigate('/plan')}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                修改行程
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : !currentTrip ? (
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
          <div className="grid grid-cols-4 gap-6">
            {/* 左侧：日期选择 */}
            <div className="col-span-1">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">行程日期</h3>
                <div className="space-y-2">
                  {currentTrip.data?.days?.map((day: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDay(index)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        currentDay === index
                          ? 'bg-livetrip-primary text-white'
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium">第 {index + 1} 天</div>
                      <div className="text-sm text-white/60">{formatDate(day.date)}</div>
                    </button>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* 右侧：行程详情 */}
            <div className="col-span-3">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      第 {currentDay + 1} 天行程
                    </h2>
                    <p className="text-white/60 mt-1">
                      {currentTrip.data?.days?.[currentDay]?.date &&
                        formatDate(currentTrip.data.days[currentDay].date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin className="h-5 w-5" />
                    <span>{currentTrip.data?.summary?.destination}</span>
                  </div>
                </div>

                {/* 景点列表 */}
                <div className="space-y-4">
                  {currentTrip.data?.days?.[currentDay]?.attractions?.map((attraction: any, index: number) => (
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
                      <button className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Navigation className="h-5 w-5 text-white/60" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 餐厅推荐 */}
                {currentTrip.data?.days?.[currentDay]?.restaurant && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">餐厅推荐</h3>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">
                            {currentTrip.data.days[currentDay].restaurant.name}
                          </h4>
                          <p className="text-sm text-white/60 mt-1">
                            {currentTrip.data.days[currentDay].restaurant.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-white/80">
                            {currentTrip.data.days[currentDay].restaurant.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </GlassLayout>
  );
}

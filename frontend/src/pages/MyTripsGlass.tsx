// 我的行程页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, MoreVertical, Trash2, Share2 } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getUserTrips, deleteTrip } from '../api/client';
import { message, Dropdown } from 'antd';

// 后端返回的 Trip 数据结构（days 是数组）
interface BackendTrip {
  id: string;
  userId: string;
  title: string;
  description?: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  totalBudget?: number;
  days: Array<any>; // 后端返回的是 Day 对象数组
  budget?: any;
  createdAt?: string;
  updatedAt?: string;
}

// 前端使用的 Trip 数据结构（days 是数字）
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  travelers: number;
  coverImage?: string;
  status: 'planning' | 'ongoing' | 'completed';
}

// 将后端 Trip 转换为前端 Trip
const transformTrip = (backendTrip: BackendTrip): Trip => {
  return {
    id: backendTrip.id,
    title: backendTrip.title,
    destination: backendTrip.destination,
    startDate: new Date(backendTrip.startDate).toLocaleDateString('zh-CN'),
    endDate: new Date(backendTrip.endDate).toLocaleDateString('zh-CN'),
    days: Array.isArray(backendTrip.days) ? backendTrip.days.length : 0,
    travelers: 1, // 暂时默认为1人
    status: backendTrip.status as 'planning' | 'ongoing' | 'completed',
  };
};

export default function MyTripsGlass() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await getUserTrips();
      console.log('API Response:', response);

      // 后端返回格式: { success: true, data: Trip[] }
      if (response && response.success && Array.isArray(response.data)) {
        console.log('✅ 成功获取行程列表，数量:', response.data.length);

        // 转换数据格式
        const transformedTrips = response.data.map(transformTrip);
        console.log('转换后的行程数据:', transformedTrips);

        setTrips(transformedTrips);
      } else {
        console.log('❌ 响应格式不正确');
        setTrips([]);
      }
    } catch (error) {
      console.error('加载行程失败:', error);
      message.error('加载行程失败');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    try {
      const response = await deleteTrip(tripId);
      if (response.success) {
        message.success('行程已删除');
        loadTrips();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return '规划中';
      case 'ongoing': return '进行中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">我的行程</h1>
          <button
            onClick={() => navigate('/plan')}
            className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
          >
            创建新行程
          </button>
        </div>

        {/* 行程列表 */}
        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : trips.length === 0 ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-white mb-2">还没有行程</h3>
              <p className="text-white/60 mb-4">开始规划你的第一次旅行吧！</p>
              <button
                onClick={() => navigate('/plan')}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                创建行程
              </button>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {trips.map((trip) => (
              <GlassCard
                key={trip.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                {/* 封面图片 */}
                <div className="relative h-48 bg-gradient-to-br from-livetrip-primary to-livetrip-accent">
                  {trip.coverImage && (
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                </div>

                {/* 行程信息 */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{trip.title}</h3>
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{trip.destination}</span>
                      </div>
                    </div>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'share',
                            icon: <Share2 className="h-4 w-4" />,
                            label: '分享',
                          },
                          {
                            key: 'delete',
                            icon: <Trash2 className="h-4 w-4" />,
                            label: '删除',
                            danger: true,
                          },
                        ],
                        onClick: (e) => {
                          e.domEvent.stopPropagation();
                          if (e.key === 'delete') {
                            handleDelete(trip.id);
                          }
                        },
                      }}
                      trigger={['click']}
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-white/60" />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="flex items-center gap-6 text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{trip.days} 天</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{trip.travelers} 人</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{trip.startDate}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </GlassLayout>
  );
}

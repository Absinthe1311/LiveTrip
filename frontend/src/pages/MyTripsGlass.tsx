// 我的行程页面 - 毛玻璃风格版本
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, MoreVertical, Trash2, Share2, Search, Filter, FileText, Share as ShareIcon, Trash, Plane } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { getUserTrips, deleteTrip, getTripById, shareTrip } from '../api/client';
import { message, Dropdown, Modal, Checkbox } from 'antd';
import { generateTripPDF } from '../utils/pdfGenerator';

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
  coverImage?: string;
  collabRoom?: any; // 协同房间信息
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
  isCollab: boolean; // 是否为协同行程
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
    coverImage: backendTrip.coverImage || undefined,
    status: backendTrip.status as 'planning' | 'ongoing' | 'completed',
    isCollab: !!backendTrip.collabRoom, // 如果有协同房间，则为协同行程
  };
};

export default function MyTripsGlass() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'normal' | 'collab'>('all'); // 行程分类标签
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const [selectedDestination, setSelectedDestination] = useState<string>(''); // 选中的目的地
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set()); // 选中的行程ID
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // 删除确认弹窗
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false); // 全部删除确认弹窗

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

  // 获取所有不重复的目的地
  const destinations = useMemo(() => {
    const destSet = new Set(trips.map(trip => trip.destination));
    return Array.from(destSet).sort();
  }, [trips]);

  // 根据当前标签、搜索和筛选过滤行程
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // 按标签筛选
      if (activeTab === 'normal' && trip.isCollab) return false;
      if (activeTab === 'collab' && !trip.isCollab) return false;

      // 按搜索关键词筛选
      if (searchQuery && !trip.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 按目的地筛选
      if (selectedDestination && trip.destination !== selectedDestination) {
        return false;
      }

      return true;
    });
  }, [trips, activeTab, searchQuery, selectedDestination]);

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

  // 批量删除选中的行程
  const handleBatchDelete = async () => {
    if (selectedTrips.size === 0) {
      message.warning('请先选择要删除的行程');
      return;
    }

    try {
      for (const tripId of selectedTrips) {
        await deleteTrip(tripId);
      }
      message.success(`成功删除 ${selectedTrips.size} 个行程`);
      setSelectedTrips(new Set());
      setDeleteModalVisible(false);
      loadTrips();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 删除所有行程
  const handleDeleteAll = async () => {
    try {
      for (const trip of trips) {
        await deleteTrip(trip.id);
      }
      message.success('成功删除所有行程');
      setDeleteAllModalVisible(false);
      loadTrips();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 切换行程选中状态
  const toggleTripSelection = (tripId: string) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedTrips(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTrips.size === filteredTrips.length) {
      setSelectedTrips(new Set());
    } else {
      setSelectedTrips(new Set(filteredTrips.map(trip => trip.id)));
    }
  };

  // 导出PDF
  const handleExportPDF = async (tripId: string) => {
    try {
      message.loading('正在生成PDF...', 0);
      const response = await getTripById(tripId);
      if (response.success) {
        const tripData = response.data;
        await generateTripPDF(tripData);
        message.destroy();
        message.success('PDF导出成功');
      } else {
        message.destroy();
        message.error('获取行程数据失败');
      }
    } catch (error) {
      message.destroy();
      message.error('PDF导出失败');
    }
  };

  // 分享行程
  const handleShare = async (tripId: string) => {
    try {
      const response = await shareTrip(tripId);
      if (response.success) {
        // 复制链接到剪贴板
        await navigator.clipboard.writeText(response.data.shareUrl);
        message.success('分享链接已复制到剪贴板');
      } else {
        message.error('生成分享链接失败');
      }
    } catch (error) {
      message.error('分享失败');
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
    <GlassLayout showSearch={false}>
      <div className="space-y-6">
        {/* 页面标题和批量操作 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">我的行程</h1>
            {filteredTrips.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTrips.size === filteredTrips.length && filteredTrips.length > 0}
                  indeterminate={selectedTrips.size > 0 && selectedTrips.size < filteredTrips.length}
                  onChange={toggleSelectAll}
                  className="text-white"
                >
                  <span className="text-white/70 text-sm">
                    {selectedTrips.size > 0 ? `已选 ${selectedTrips.size} 个` : '全选'}
                  </span>
                </Checkbox>
                {selectedTrips.size > 0 && (
                  <>
                    <button
                      onClick={() => setDeleteModalVisible(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
                    >
                      删除选中
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {trips.length > 0 && (
            <button
              onClick={() => setDeleteAllModalVisible(true)}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all duration-300"
            >
              清空所有行程
            </button>
          )}
        </div>

        {/* 搜索和筛选栏 */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索行程名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
              />
            </div>

            {/* 目的地筛选 */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="pl-12 pr-8 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">全部目的地</option>
                {destinations.map((dest) => (
                  <option key={dest} value={dest} className="bg-gray-800">
                    {dest}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* 行程分类标签 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            全部行程
          </button>
          <button
            onClick={() => setActiveTab('normal')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'normal'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            普通行程
          </button>
          <button
            onClick={() => setActiveTab('collab')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'collab'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            协同行程
          </button>
        </div>

        {/* 行程列表 */}
        {loading ? (
          <GlassCard className="p-8">
            <div className="text-center text-white/60">加载中...</div>
          </GlassCard>
        ) : filteredTrips.length === 0 ? (
          <GlassCard className="p-8">
            <div className="text-center">
              <Plane className="h-16 w-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {trips.length === 0 ? '还没有行程' : '没有找到匹配的行程'}
              </h3>
              <p className="text-white/60 mb-4">
                {trips.length === 0 ? '开始规划你的第一次旅行吧！' : '尝试调整搜索或筛选条件'}
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <GlassCard
                key={trip.id}
                className="p-0 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform relative"
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                {/* 选择框 */}
                <div
                  className="absolute top-4 left-4 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedTrips.has(trip.id)}
                    onChange={() => toggleTripSelection(trip.id)}
                    className="!bg-white/20 backdrop-blur-md rounded"
                  />
                </div>

                {/* 封面图片 */}
                <div className="relative h-56 bg-gradient-to-br from-livetrip-primary to-livetrip-accent">
                  {trip.coverImage ? (
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">🏞️</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {trip.isCollab && (
                      <span className="px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-medium">
                        协同
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                </div>

                {/* 行程信息 */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 truncate">{trip.title}</h3>
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs truncate">{trip.destination}</span>
                      </div>
                    </div>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'pdf',
                            icon: <FileText className="h-4 w-4" />,
                            label: '导出PDF',
                          },
                          {
                            key: 'share',
                            icon: <ShareIcon className="h-4 w-4" />,
                            label: '分享行程',
                          },
                          {
                            key: 'delete',
                            icon: <Trash className="h-4 w-4" />,
                            label: '删除',
                            danger: true,
                          },
                        ],
                        onClick: (e) => {
                          e.domEvent.stopPropagation();
                          if (e.key === 'delete') {
                            handleDelete(trip.id);
                          } else if (e.key === 'pdf') {
                            handleExportPDF(trip.id);
                          } else if (e.key === 'share') {
                            handleShare(trip.id);
                          }
                        },
                      }}
                      trigger={['click']}
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                      >
                        <MoreVertical className="h-4 w-4 text-white/60" />
                      </button>
                    </Dropdown>
                  </div>

                  <div className="flex items-center gap-4 text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">{trip.days} 天</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs">{trip.travelers} 人</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">{trip.startDate}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* 删除选中行程确认弹窗 */}
        <Modal
          title="确认删除"
          open={deleteModalVisible}
          onOk={handleBatchDelete}
          onCancel={() => setDeleteModalVisible(false)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <p>确定要删除选中的 {selectedTrips.size} 个行程吗？此操作不可恢复。</p>
        </Modal>

        {/* 删除所有行程确认弹窗 */}
        <Modal
          title="确认清空"
          open={deleteAllModalVisible}
          onOk={handleDeleteAll}
          onCancel={() => setDeleteAllModalVisible(false)}
          okText="清空"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <p>确定要删除所有行程吗？此操作不可恢复。</p>
        </Modal>
      </div>
    </GlassLayout>
  );
}

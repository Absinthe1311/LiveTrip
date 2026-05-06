// 协同规划入口页面 - 用户填写基本信息并创建协同房间
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Users, MapPin, Calendar, DollarSign, Clock, ArrowRight, Loader } from 'lucide-react';
import { Sidebar } from '../../components/SharedSidebar';
import { createCollabRoom } from '../../api/collabApi';
import { saveTrip } from '../../api/client';

export default function CollabEntry() {
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表单数据
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(5000);
  const [groupSize, setGroupSize] = useState(2);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 计算天数
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  const days = calculateDays();

  // 设置默认日期（明天开始，玩3天）
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 2);
    
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async () => {
    // 验证
    if (!destination.trim()) {
      setError('请输入目的地');
      return;
    }
    if (!startDate || !endDate) {
      setError('请选择出发和返回日期');
      return;
    }
    if (days <= 0) {
      setError('返回日期必须晚于出发日期');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 构建符合后端API期望的数据格式
      const start = new Date(startDate);
      
      // 生成每天的日期
      const dayDates = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        dayDates.push(date.toISOString().split('T')[0]);
      }

      const tripData = {
        summary: {
          origin: '出发地',
          destination: destination,
          start_date: startDate,
          end_date: endDate,
          budget: budget,
        },
        itinerary: {
          itinerary: dayDates.map((date, index) => ({
            day: index + 1,
            date: date,
            attractions: [],
          })),
        },
        total_cost: budget,
        budget_breakdown: {
          transportation: budget * 0.3,
          accommodation: budget * 0.4,
          dining: budget * 0.2,
          tickets: budget * 0.1,
        },
        hotel: null,
        hotelRecommendations: [],
        restaurantRecommendations: [],
        restaurants: [],
      };

      const tripResponse = await saveTrip(tripData);
      
      if (!tripResponse.success) {
        throw new Error(tripResponse.error 
      }

      const tripId = tripResponse.data.tripId;

      // 创建协同房间
      const roomResponse = await createCollabRoom(tripId);
      
      if (roomResponse.success) {
        // 跳转到协同房间
        navigate(`/collab/room/${roomResponse.data.room.id}`);
      } else {
        throw new Error(roomResponse.error 
      }
    } catch (err: any) {
      console.error('创建协同规划失败:', err);
      setError(err.message 
    } finally {
      setLoading(false);
    }
  };

  // 热门目的地
  const popularDestinations = [
    { name: '北京', emoji: '🏛️' },
    { name: '上海', emoji: '🌃' },
    { name: '杭州', emoji: '🌸' },
    { name: '成都', emoji: '🐼' },
    { name: '西安', emoji: '🏯' },
    { name: '广州', emoji: '🌺' },
    { name: '深圳', emoji: '🏙️' },
    { name: '重庆', emoji: '🌶️' },
  ];

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="text-xl font-bold text-livetrip-primary">LiveTrip</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">协同规划</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>邀请朋友一起规划行程</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage="/collab"
      />

      {/* Main Content */}
      <main className={`pt-14 ${isLargeScreen ? 'pl-[240px]' : ''} min-h-screen`}>
        <div className="max-w-3xl mx-auto p-6">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-livetrip-primary/10 mb-4">
              <Users className="h-8 w-8 text-livetrip-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">创建协同规划房间</h2>
            <p className="text-gray-600">填写基本信息，邀请朋友一起规划完美行程</p>
          </div>

          {/* 表单区域 */}
          <div className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-6">
            {/* 目的地 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                目的地
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="输入城市名称，如：北京、上海、杭州"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
              />
              {/* 热门目的地 */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">热门目的地：</p>
                <div className="flex flex-wrap gap-2">
                  {popularDestinations.map((dest) => (
                    <button
                      key={dest.name}
                      onClick={() => setDestination(dest.name)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        destination === dest.name
                          ? 'bg-livetrip-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {dest.emoji} {dest.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 日期选择 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  出发日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  返回日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                />
              </div>
            </div>

            {/* 显示天数 */}
            {days > 0 && (
              <div className="flex items-center gap-2 text-sm text-livetrip-primary bg-livetrip-primary/5 px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span>共 <strong>{days}</strong> 天行程</span>
              </div>
            )}

            {/* 预算 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                预算（元）
              </label>
              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>¥1,000</span>
                <span className="text-livetrip-primary font-medium">¥{budget.toLocaleString()}</span>
                <span>¥20,000</span>
              </div>
            </div>

            {/* 人数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                参与人数
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setGroupSize(num)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      groupSize === num
                        ? 'bg-livetrip-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num}人
                  </button>
                ))}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-livetrip-primary text-white rounded-lg font-medium hover:bg-livetrip-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  创建协同房间
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>

          {/* 说明区域 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">💡 使用说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 创建房间后，您将自动成为房间主持人（Host）</li>
              <li>• 您可以邀请朋友加入房间，一起规划行程</li>
              <li>• 每个人可以在地图上绘制自己的建议路线</li>
              <li>• 主持人可以查看景点统计，确定最终路线</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

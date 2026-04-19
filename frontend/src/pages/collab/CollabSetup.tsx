// 协同规划设置页面 - 填写必要信息后创建协同房间（毛玻璃风格）
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Users, Sparkles, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { message } from 'antd';
import GlassLayout from '../../components/layout/GlassLayout';
import { GlassCard } from '../../components/home';
import { createCollabRoom } from '../../api/collabApi';
import { API_BASE_URL } from '../../config/api';

interface FormData {
  roomName: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
}

export default function CollabSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    roomName: '',
    destination: '',
    startDate: '',
    endDate: '',
    groupSize: 2,
  });

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateStep1 = () => {
    if (!formData.roomName.trim()) {
      message.warning('请输入房间名称');
      return false;
    }
    if (!formData.destination.trim()) {
      message.warning('请输入目的地');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.startDate) {
      message.warning('请选择出发日期');
      return false;
    }
    if (!formData.endDate) {
      message.warning('请选择返回日期');
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      message.warning('返回日期必须晚于出发日期');
      return false;
    }
    if (formData.groupSize < 2) {
      message.warning('人数至少为2人');
      return false;
    }
    if (formData.groupSize > 20) {
      message.warning('人数最多为20人');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 创建空的行程数据
      const emptyTripData = {
        title: formData.roomName, // 使用用户输入的房间名称
        customization: {
          tripName: formData.roomName, // 使用用户输入的房间名称
          tripDescription: `协同规划 - ${formData.destination}`,
        },
        summary: {
          origin: '',
          destination: formData.destination,
          start_date: formData.startDate,
          end_date: formData.endDate,
          travelers: formData.groupSize,
          budget: 10000,
          preferences: []
        },
        itinerary: {
          itinerary: []
        },
        total_cost: 0,
        budget_breakdown: {
          transportation: 0,
          accommodation: 0,
          dining: 0,
          tickets: 0
        },
        hotel: null,
        hotelRecommendations: [],
        restaurantRecommendations: [],
        restaurants: []
      };

      // 使用apiClient创建行程
      const saveResponse = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(emptyTripData),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.error || '创建行程失败');
      }

      const tripId = saveData.data?.tripId;

      if (!tripId) {
        throw new Error('行程ID为空');
      }

      // 用新创建的行程ID创建协同房间
      const roomResponse = await createCollabRoom(tripId);

      if (roomResponse.success) {
        message.success('协同房间创建成功');
        // 进入房间
        const roomId = roomResponse.data.room?.id || roomResponse.data.id;
        navigate(`/collab/room/${roomId}`);
      } else {
        throw new Error(roomResponse.error || '创建协同房间失败');
      }
    } catch (error: any) {
      console.error('创建协同房间失败:', error);
      setError(error.response?.data?.error || error.message || '创建协同房间失败，请重试');
      message.error(error.response?.data?.error || error.message || '创建协同房间失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  return (
    <GlassLayout>
      <div className="max-w-2xl mx-auto py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-livetrip-primary/20 mb-4">
            <Sparkles className="h-8 w-8 text-livetrip-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">创建协同规划房间</h1>
          <p className="text-white/60">填写必要信息，邀请朋友一起规划行程</p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-livetrip-primary' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-livetrip-primary text-white' : 'bg-white/10'}`}>
              1
            </div>
            <span className="font-medium">基本信息</span>
          </div>
          <div className={`w-12 h-0.5 transition-all ${step >= 2 ? 'bg-livetrip-primary' : 'bg-white/20'}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-livetrip-primary' : 'text-white/40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-livetrip-primary text-white' : 'bg-white/10'}`}>
              2
            </div>
            <span className="font-medium">行程详情</span>
          </div>
        </div>

        <GlassCard className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {/* 房间名称 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  房间名称
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.roomName}
                    onChange={(e) => handleInputChange('roomName', e.target.value)}
                    placeholder="例如：北京三日游"
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-livetrip-primary/0 via-livetrip-primary/20 to-livetrip-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </div>

              {/* 目的地 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <Navigation className="inline h-4 w-4 mr-2" />
                  目的地
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    placeholder="输入目的地城市（如：北京、上海、杭州）"
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-livetrip-primary/0 via-livetrip-primary/20 to-livetrip-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
                <p className="text-xs text-white/50 mt-2">目的地将用于获取该城市的景点信息</p>
              </div>

              {/* 下一步按钮 */}
              <button
                onClick={handleNext}
                className="relative w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                  下一步
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* 日期选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    出发日期
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    返回日期
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                </div>
              </div>

              {calculateDays() > 0 && (
                <div className="text-center py-3 bg-livetrip-primary/10 rounded-xl border border-livetrip-primary/20">
                  <span className="text-livetrip-primary font-semibold">
                    行程共 {calculateDays()} 天
                  </span>
                </div>
              )}

              {/* 人数选择 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  <Users className="inline h-4 w-4 mr-2" />
                  出行人数
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleInputChange('groupSize', Math.max(2, formData.groupSize - 1))}
                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={formData.groupSize}
                    onChange={(e) => handleInputChange('groupSize', parseInt(e.target.value) || 2)}
                    min={2}
                    max={20}
                    className="flex-1 px-6 py-5 text-lg text-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                  <button
                    onClick={() => handleInputChange('groupSize', Math.min(20, formData.groupSize + 1))}
                    className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-2">包括您在内，至少2人，最多20人</p>
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handlePrev}
                  className="py-4 rounded-xl bg-white/10 text-white font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="relative py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg border border-white/20 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        创建房间
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </GlassLayout>
  );
}



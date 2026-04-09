// 创建行程页面 - 毛玻璃风格版本（优化版）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ChevronLeft, ChevronRight, MapPin, Navigation, Calendar, Wallet, Users, Heart, ArrowRight, ArrowLeft, User, HeartHandshake, UsersRound, Mountain, Utensils, Camera, Building, TreePine, Waves, ShoppingBag, Dumbbell, Droplets, Moon, Sun, Palette, Landmark, Ticket, Coffee, Store, ChefHat, CreditCard, Gem, Crown, Briefcase, Building2, Locate, X } from "lucide-react";
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { createPlan } from '../api/client';
import { useAppStore } from '../store';
import AIAdvisorGlass from '../components/AIAdvisorGlass';
import { popularDestinations } from '../data/popularDestinations';

const steps = [
  { id: 1, label: "出发地", icon: MapPin },
  { id: 2, label: "目的地", icon: Navigation },
  { id: 3, label: "行程日期", icon: Calendar },
  { id: 4, label: "预算范围", icon: Wallet },
  { id: 5, label: "群体类型", icon: Users },
  { id: 6, label: "兴趣偏好", icon: Heart },
];

export default function PlanGlass() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDrawerOpen, setAIDrawerOpen] = useState(false);
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);

  // 用户输入的状态
  const [formData, setFormData] = useState<Record<string, any>>({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    preferences: [],
    minBudget: 5000,
    maxBudget: 20000,
    groupSize: 1,
    groupType: 'solo',
    hasChildren: false,
    hasElderly: false,
    pace: 'moderate',
    energy_level: 'medium',
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        origin: formData.origin,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: Math.round((formData.minBudget + formData.maxBudget) / 2),
        preferences: {
          interests: (formData.preferences || []).join(','),
        },
      };

      const response = await createPlan(request);

      if (response.success) {
        setCurrentItinerary(response.data);
        navigate('/itinerary');
      } else {
        setError('行程规划失败，请稍后重试');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || '行程规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">选择出发地</h3>
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="输入出发城市"
                  className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-livetrip-primary/0 via-livetrip-primary/20 to-livetrip-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
              
              {/* 自动定位按钮 */}
              <button
                onClick={async () => {
                  try {
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(async (position) => {
                        const { latitude, longitude } = position.coords;
                        // 使用高德地图逆地理编码获取城市名
                        const response = await fetch(
                          `https://restapi.amap.com/v3/geocode/regeo?key=${import.meta.env.VITE_AMAP_KEY || 'YOUR_AMAP_KEY'}&location=${longitude},${latitude}`
                        );
                        const data = await response.json();
                        if (data.regeocode?.addressComponent?.city) {
                          setFormData({ ...formData, origin: data.regeocode.addressComponent.city });
                        } else if (data.regeocode?.addressComponent?.province) {
                          setFormData({ ...formData, origin: data.regeocode.addressComponent.province });
                        }
                      });
                    }
                  } catch (error) {
                    console.error('自动定位失败:', error);
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 hover:bg-amber-500/20 transition-all duration-300"
              >
                <Locate className="w-5 h-5" />
                <span>使用当前位置</span>
              </button>
            </div>
          </GlassCard>
        );
      case 1:
        return (
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">选择目的地</h3>
            <div className="space-y-6">
              <div className="relative group">
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="输入目的地城市"
                  className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-livetrip-primary/0 via-livetrip-primary/20 to-livetrip-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>

              {/* 热门目的地推荐 */}
              <div>
                <p className="text-sm text-white/60 mb-4 font-medium">热门目的地</p>
                <div className="grid grid-cols-3 gap-3">
                  {popularDestinations.slice(0, 9).map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => setFormData({ ...formData, destination: dest.name })}
                      className={`p-3 rounded-xl border transition-all duration-300 text-left ${
                        formData.destination === dest.name
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-lg mb-1">{dest.icon}</div>
                      <div className="text-sm font-medium text-white">{dest.name}</div>
                      <div className="text-xs text-white/60">{dest.days}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        );
      case 2:
        return (
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">选择行程日期</h3>
            <div className="space-y-4">
              {/* 日期输入框 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="block text-sm text-white/60 mb-3 font-medium">开始日期</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="relative group">
                  <label className="block text-sm text-white/60 mb-3 font-medium">结束日期</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              {formData.startDate && formData.endDate && (
                <div className="text-center py-4 rounded-xl bg-amber-500/10 border border-amber-400/20">
                  <span className="text-amber-400 font-medium text-lg">
                    共 {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} 天行程
                  </span>
                </div>
              )}
            </div>
          </GlassCard>
        );
      case 3:
        return (
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">设置预算范围</h3>
            <div className="space-y-6">
              {/* 预设选项 */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '经济', min: 5000, max: 10000, icon: Wallet, desc: '实惠出行' },
                  { label: '适中', min: 10000, max: 15000, icon: CreditCard, desc: '品质之旅' },
                  { label: '舒适', min: 15000, max: 20000, icon: Gem, desc: '尊享体验' },
                  { label: '豪华', min: 20000, max: 25000, icon: Crown, desc: '极致享受' },
                ].map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.label}
                      onClick={() => setFormData({ ...formData, minBudget: option.min, maxBudget: option.max })}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.minBudget === option.min && formData.maxBudget === option.max
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <IconComponent className="w-6 h-6 text-white mb-2 mx-auto" />
                      <div className="text-base font-semibold text-white mb-1">{option.label}</div>
                      <div className="text-xs text-white/60 mb-2">{option.desc}</div>
                      <div className="text-xs text-white/80">¥{(option.min / 10000).toFixed(1)}-{(option.max / 10000).toFixed(1)}万</div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义输入 */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/60 mb-4 font-medium">或自定义预算范围</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <label className="block text-sm text-white/60 mb-3">最低预算 (¥)</label>
                    <input
                      type="number"
                      value={formData.minBudget}
                      onChange={(e) => setFormData({ ...formData, minBudget: Number(e.target.value) })}
                      className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-sm text-white/60 mb-3">最高预算 (¥)</label>
                    <input
                      type="number"
                      value={formData.maxBudget}
                      onChange={(e) => setFormData({ ...formData, maxBudget: Number(e.target.value) })}
                      className="w-full px-6 py-5 text-lg rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      case 4:
        return (
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">选择群体类型</h3>
            <div className="space-y-6">
              {/* 预设类型 */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { type: 'solo', label: '独自旅行', icon: User, desc: '一个人的自由探索', count: 1 },
                  { type: 'couple', label: '情侣出行', icon: HeartHandshake, desc: '浪漫双人之旅', count: 2 },
                  { type: 'family', label: '家庭亲子', icon: Users, desc: '温馨家庭时光', count: 4 },
                  { type: 'friends', label: '好友结伴', icon: UsersRound, desc: '欢乐朋友聚会', count: 3 },
                  { type: 'business', label: '商务出行', icon: Briefcase, desc: '工作差旅安排', count: 2 },
                  { type: 'team', label: '团队建设', icon: Building2, desc: '公司团建活动', count: 10 },
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => setFormData({ ...formData, groupType: item.type, groupSize: item.count })}
                      className={`p-5 rounded-xl border-2 transition-all duration-300 text-left ${
                        formData.groupType === item.type
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
                          : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <IconComponent className="w-7 h-7 text-white mb-2" />
                      <div className="text-base font-semibold text-white mb-1">{item.label}</div>
                      <div className="text-xs text-white/60">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义人数 */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/60 mb-4 font-medium">或自定义人数</p>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-white/80">人数：</label>
                  <input
                    type="number"
                    value={formData.groupSize}
                    onChange={(e) => {
                      const size = Number(e.target.value);
                      setFormData({ ...formData, groupSize: size, groupType: 'custom' });
                    }}
                    min="1"
                    className="flex-1 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 focus:bg-white/15 focus:border-amber-400/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)] focus:outline-none"
                  />
                  <span className="text-sm text-white/80">人</span>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      case 5:
        return (
          <GlassCard className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">选择兴趣偏好</h3>
            <div className="space-y-6">
              {/* 文化探索 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Landmark className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-white/60">文化探索</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: '历史文化', icon: Building },
                    { label: '艺术展览', icon: Palette },
                    { label: '博物馆', icon: Ticket },
                    { label: '古建筑', icon: Landmark },
                    { label: '民俗体验', icon: Camera },
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          const prefs = formData.preferences as string[];
                          const newPrefs = prefs.includes(item.label)
                            ? prefs.filter((p) => p !== item.label)
                            : [...prefs, item.label];
                          setFormData({ ...formData, preferences: newPrefs });
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                          (formData.preferences as string[]).includes(item.label)
                            ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400/50 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 自然风光 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Mountain className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-white/60">自然风光</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: '自然风光', icon: TreePine },
                    { label: '山川湖泊', icon: Mountain },
                    { label: '海滨沙滩', icon: Waves },
                    { label: '森林草原', icon: TreePine },
                    { label: '日出日落', icon: Sun },
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          const prefs = formData.preferences as string[];
                          const newPrefs = prefs.includes(item.label)
                            ? prefs.filter((p) => p !== item.label)
                            : [...prefs, item.label];
                          setFormData({ ...formData, preferences: newPrefs });
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                          (formData.preferences as string[]).includes(item.label)
                            ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400/50 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 美食体验 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-white/60">美食体验</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: '美食体验', icon: Utensils },
                    { label: '特色小吃', icon: Coffee },
                    { label: '高档餐厅', icon: ChefHat },
                    { label: '当地市场', icon: Store },
                    { label: '烹饪课程', icon: ChefHat },
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          const prefs = formData.preferences as string[];
                          const newPrefs = prefs.includes(item.label)
                            ? prefs.filter((p) => p !== item.label)
                            : [...prefs, item.label];
                          setFormData({ ...formData, preferences: newPrefs });
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                          (formData.preferences as string[]).includes(item.label)
                            ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400/50 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 休闲娱乐 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-white/60">休闲娱乐</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: '购物娱乐', icon: ShoppingBag },
                    { label: '户外运动', icon: Dumbbell },
                    { label: '温泉SPA', icon: Droplets },
                    { label: '夜生活', icon: Moon },
                    { label: '摄影打卡', icon: Camera },
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          const prefs = formData.preferences as string[];
                          const newPrefs = prefs.includes(item.label)
                            ? prefs.filter((p) => p !== item.label)
                            : [...prefs, item.label];
                          setFormData({ ...formData, preferences: newPrefs });
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 ${
                          (formData.preferences as string[]).includes(item.label)
                            ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400/50 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <GlassLayout>
      {/* 动态背景光影效果 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-livetrip-primary/5 via-transparent to-livetrip-accent/5 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-livetrip-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-livetrip-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto py-8 space-y-8">
        {/* 步骤指示器 - 渐进式高亮设计 */}
        <GlassCard className="p-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  {/* 步骤圆圈 */}
                  <div className="flex flex-col items-center">
                    <div className={`
                      relative w-14 h-14 rounded-full flex items-center justify-center
                      transition-all duration-500
                      ${index === currentStep 
                        ? 'bg-livetrip-primary scale-110 shadow-lg shadow-livetrip-primary/50' 
                        : index < currentStep
                          ? 'bg-livetrip-primary/30 border-2 border-livetrip-primary'
                          : 'bg-white/10 border-2 border-white/20'
                      }
                    `}>
                      {index < currentStep ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <StepIcon className={`
                          w-6 h-6 transition-all duration-300
                          ${index <= currentStep ? 'text-white' : 'text-white/40'}
                        `} />
                      )}
                    </div>
                    
                    {/* 步骤标签 */}
                    <span className={`
                      mt-3 text-sm font-medium transition-all duration-300
                      ${index === currentStep ? 'text-white' : 'text-white/50'}
                    `}>
                      {step.label}
                    </span>
                  </div>
                  
                  {/* 连接线 */}
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-3 transition-all duration-500
                      ${index < currentStep ? 'bg-livetrip-primary' : 'bg-white/20'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 步骤内容 */}
        <div className="space-y-6">
          {renderStepContent()}

          {/* 错误提示 */}
          {error && (
            <GlassCard className="p-4 border-l-4 border-red-500">
              <p className="text-red-400">{error}</p>
            </GlassCard>
          )}

          {/* 导航按钮 - 升级设计 */}
          <div className="flex gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 font-medium hover:bg-white/15 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              上一步
            </button>
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="relative flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-lg border border-amber-400/30 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative flex items-center gap-2">
                  下一步
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="relative flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg border border-amber-500/30 shadow-lg shadow-amber-600/30 hover:shadow-xl hover:shadow-amber-600/40 hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      生成行程
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 浮动 AI 悬浮聊天窗口 */}
      {aiDrawerOpen && (
        <div
          className="fixed z-50"
          style={{
            bottom: '100px',
            right: '32px',
            width: '380px',
            maxHeight: '500px',
          }}
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '500px' }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-base font-semibold text-white">AI 旅行顾问</span>
              </div>
              <button
                onClick={() => setAIDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto" style={{ minHeight: '300px' }}>
              <AIAdvisorGlass
                destination={formData.destination}
                startDate={formData.startDate}
                endDate={formData.endDate}
                budget={Math.round((formData.minBudget + formData.maxBudget) / 2)}
                defaultMode="advisor"
              />
            </div>
          </div>
        </div>
      )}

      {/* 浮动 AI 按钮 */}
      <button
        onClick={() => setAIDrawerOpen(!aiDrawerOpen)}
        className={`fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group ${
          aiDrawerOpen 
            ? 'bg-white/20 backdrop-blur-md border-2 border-white/30 scale-90' 
            : 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/40 hover:scale-110 hover:shadow-xl animate-pulse'
        }`}
        style={!aiDrawerOpen ? { animationDuration: '3s' } : {}}
      >
        <Sparkles className={`w-7 h-7 text-white transition-transform duration-300 ${aiDrawerOpen ? 'rotate-180' : 'group-hover:rotate-12'}`} />
        {!aiDrawerOpen && (
          <span className="absolute -top-12 right-0 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/20">
            AI 旅行顾问
          </span>
        )}
      </button>
    </GlassLayout>
  );
}

// 创建行程页面 - 毛玻璃风格版本
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { createPlan } from '../api/client';
import { useAppStore } from '../store';
import AIAdvisorGlass from '../components/AIAdvisorGlass';

const steps = [
  { id: 1, label: "出发地", icon: "📍" },
  { id: 2, label: "目的地", icon: "🎯" },
  { id: 3, label: "行程日期", icon: "📅" },
  { id: 4, label: "预算范围", icon: "💰" },
  { id: 5, label: "群体类型", icon: "👥" },
  { id: 6, label: "兴趣偏好", icon: "🎨" },
];

export default function PlanGlass() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">选择出发地</h3>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder="输入出发城市"
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </GlassCard>
        );
      case 1:
        return (
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">选择目的地</h3>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="输入目的地城市"
              className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </GlassCard>
        );
      case 2:
        return (
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">选择行程日期</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">开始日期</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">结束日期</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>
            </div>
          </GlassCard>
        );
      case 3:
        return (
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">设置预算范围</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">最低预算 (¥)</label>
                <input
                  type="number"
                  value={formData.minBudget}
                  onChange={(e) => setFormData({ ...formData, minBudget: Number(e.target.value) })}
                  className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">最高预算 (¥)</label>
                <input
                  type="number"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({ ...formData, maxBudget: Number(e.target.value) })}
                  className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>
            </div>
          </GlassCard>
        );
      case 4:
        return (
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">选择群体类型</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">群体类型</label>
                <select
                  value={formData.groupType}
                  onChange={(e) => setFormData({ ...formData, groupType: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                >
                  <option value="solo">独自旅行</option>
                  <option value="couple">情侣</option>
                  <option value="family">家庭</option>
                  <option value="friends">朋友</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">人数</label>
                <input
                  type="number"
                  value={formData.groupSize}
                  onChange={(e) => setFormData({ ...formData, groupSize: Number(e.target.value) })}
                  min="1"
                  className="w-full h-12 px-4 rounded-lg bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
                />
              </div>
            </div>
          </GlassCard>
        );
      case 5:
        return (
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">选择兴趣偏好</h3>
            <div className="grid grid-cols-3 gap-3">
              {['历史文化', '自然风光', '美食体验', '购物娱乐', '户外运动', '艺术展览'].map((pref) => (
                <button
                  key={pref}
                  onClick={() => {
                    const prefs = formData.preferences as string[];
                    const newPrefs = prefs.includes(pref)
                      ? prefs.filter((p) => p !== pref)
                      : [...prefs, pref];
                    setFormData({ ...formData, preferences: newPrefs });
                  }}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    (formData.preferences as string[]).includes(pref)
                      ? 'bg-livetrip-primary border-livetrip-primary text-white'
                      : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 步骤指示器 */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep ? 'bg-livetrip-primary text-white' : 'bg-white/10 text-white/60'
                }`}>
                  {index < currentStep ? <Check className="h-5 w-5" /> : step.icon}
                </div>
                <span className={`ml-2 text-sm ${index <= currentStep ? 'text-white' : 'text-white/60'}`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-livetrip-primary' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 步骤内容 */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {renderStepContent()}

            {/* 错误提示 */}
            {error && (
              <GlassCard className="p-4 mt-4 border-l-4 border-red-500">
                <p className="text-red-400">{error}</p>
              </GlassCard>
            )}

            {/* 导航按钮 */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex-1 h-12 rounded-lg bg-white/10 border border-white/20 text-white text-[15px] font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                上一步
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 h-12 rounded-lg bg-livetrip-primary text-white text-[15px] font-medium hover:bg-livetrip-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 h-12 rounded-lg bg-livetrip-accent text-white text-[15px] font-medium hover:bg-livetrip-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
                </button>
              )}
            </div>
          </div>

          {/* AI 助手 */}
          <div className="col-span-1">
            <GlassCard className="p-6">
              <AIAdvisorGlass
                destination={formData.destination}
                startDate={formData.startDate}
                endDate={formData.endDate}
                budget={Math.round((formData.minBudget + formData.maxBudget) / 2)}
              />
            </GlassCard>
          </div>
        </div>
      </div>
    </GlassLayout>
  );
}

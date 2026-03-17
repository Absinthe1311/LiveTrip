// 创建行程页面 - 完整功能实现
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Heart, Home as HomeIcon, Plus, Globe, Check, Send, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar } from '../components/SharedSidebar';
import { createPlan } from '../api/client';
import { useAppStore } from '../store';
import LocationInput from '../components/LocationInput';
import DateRangeInput from '../components/DateRangeInput';
import BudgetRangeInput from '../components/BudgetRangeInput';
import PreferenceInput from '../components/PreferenceInput';
import AIAdvisor from '../components/AIAdvisor';

const steps = [
  { id: 1, label: "出发地", icon: "📍" },
  { id: 2, label: "目的地", icon: "🎯" },
  { id: 3, label: "行程日期", icon: "📅" },
  { id: 4, label: "预算范围", icon: "💰" },
  { id: 5, label: "兴趣偏好", icon: "🎨" },
];

export default function Plan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
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
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 从路由状态中获取预填充的数据
  useEffect(() => {
    if (location.state) {
      const { destination } = location.state as { destination?: string };
      if (destination) {
        setFormData(prev => ({
          ...prev,
          destination: destination
        }));
        console.log('📍 预填充目的地:', destination);
      }
    }
  }, [location.state]);

  const handleNext = () => {
    setError(null);
    // 验证当前步骤
    if (currentStep === 0 && !formData.origin) {
      setError('请选择出发地');
      return;
    }
    if (currentStep === 1 && !formData.destination) {
      setError('请选择目的地');
      return;
    }
    if (currentStep === 2 && (!formData.startDate || !formData.endDate)) {
      setError('请选择行程日期');
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleGenerate = async () => {
    // 验证所有必填项
    if (!formData.origin) {
      setError('请选择出发地');
      setCurrentStep(0);
      return;
    }
    if (!formData.destination) {
      setError('请选择目的地');
      setCurrentStep(1);
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('请选择行程日期');
      setCurrentStep(2);
      return;
    }
    if (formData.preferences.length === 0) {
      setError('请选择至少一个兴趣偏好');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 计算平均预算
      const avgBudget = Math.round((formData.minBudget + formData.maxBudget) / 2);

      // 构建请求参数
      const request = {
        origin: formData.origin,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: avgBudget,
        preferences: {
          interests: formData.preferences.join(','),
        },
      };

      console.log('📝 发送行程规划请求:', request);

      // 调用后端 API
      const response = await createPlan(request);

      if (response.success) {
        console.log('✅ 行程规划成功:', response.data);

        // 保存到 Zustand store
        console.log('💾 正在保存行程数据到 Store...');
        setCurrentItinerary(response.data);
        console.log('✅ 行程数据已保存到 Store');

        // 跳转到行程页面显示推荐结果
        console.log('🚀 准备跳转到行程页面...');
        navigate('/itinerary');
      } else {
        setError('行程规划失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('❌ 行程规划失败:', error);
      setError(error.response?.data?.error || '行程规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <LocationInput
            title="选择出发地"
            placeholder="输入出发城市"
            value={formData.origin}
            onChange={(value) => setFormData({ ...formData, origin: value })}
            showLocationButton={true}
          />
        );
      case 1:
        return (
          <LocationInput
            title="选择目的地"
            placeholder="输入目的地城市"
            value={formData.destination}
            onChange={(value) => setFormData({ ...formData, destination: value })}
            showPopularDestinations={true}
          />
        );
      case 2:
        return (
          <DateRangeInput
            startDate={formData.startDate}
            endDate={formData.endDate}
            onChange={(startDate, endDate) =>
              setFormData({ ...formData, startDate, endDate })
            }
          />
        );
      case 3:
        return (
          <BudgetRangeInput
            minBudget={formData.minBudget}
            maxBudget={formData.maxBudget}
            onChange={(minBudget, maxBudget) =>
              setFormData({ ...formData, minBudget, maxBudget })
            }
          />
        );
      case 4:
        return (
          <PreferenceInput
            value={formData.preferences}
            onChange={(preferences) =>
              setFormData({ ...formData, preferences })
            }
          />
        );
      default:
        return null;
    }
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
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isLargeScreen={isLargeScreen}
        currentPage={location.pathname}
      />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-semibold text-foreground">开始规划您的完美旅程</h1>
            <p className="text-[15px] text-muted-foreground mt-1">只需几步，AI 为您定制专属行程</p>
          </div>

          <div className="flex gap-6">
            {/* Left: Form */}
            <div className="flex-1">
              {/* Progress Bar */}
              <div className="bg-card border border-border rounded-lg p-5 mb-6">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                          index < currentStep 
                            ? "bg-primary text-white" 
                            : index === currentStep 
                              ? "bg-secondary text-primary border-2 border-primary" 
                              : "bg-muted text-muted-foreground border border-border"
                        }`}>
                          {index < currentStep ? <Check className="w-5 h-5" /> : step.icon}
                        </div>
                        <span className={`text-[13px] mt-2 font-medium ${
                          index <= currentStep ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-3 ${
                          index < currentStep ? "bg-primary" : "bg-border"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="bg-card border border-border rounded-lg p-6 mb-6 min-h-[300px]">
                {renderStepContent()}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-[15px]">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`flex-1 h-12 rounded-lg border border-border text-[15px] font-medium transition-colors flex items-center justify-center gap-2 ${
                    currentStep === 0 
                      ? 'opacity-50 cursor-not-allowed text-muted-foreground' 
                      : 'hover:bg-gray-50 text-foreground'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  上一步
                </button>
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 h-12 rounded-lg bg-primary text-white text-[15px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    下一步
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-1 h-12 rounded-lg bg-accent text-white text-[15px] font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Right: AI Advisor */}
            <div className="w-[350px] hidden lg:block space-y-4">
              <AIAdvisor
                destination={formData.destination}
                startDate={formData.startDate}
                endDate={formData.endDate}
                budget={Math.round((formData.minBudget + formData.maxBudget) / 2)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

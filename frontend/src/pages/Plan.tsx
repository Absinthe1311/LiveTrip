// 规划页面 - 优化后的行程规划界面
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, message } from 'antd';
import { createPlan } from '../api/client';
import { useAppStore } from '../store';
import PageHeader from '../components/PageHeader';
import CompactProgressBar from '../components/CompactProgressBar';
import LocationSearch from '../components/LocationSearch';
import DateRangePicker from '../components/DateRangePicker';
import BudgetRangeSlider from '../components/BudgetRangeSlider';
import PreferenceCards from '../components/PreferenceCards';
import TravelAdvisor from '../components/TravelAdvisor';

export default function Plan() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
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

  const steps = [
    { title: '出发地', icon: '📍' },
    { title: '目的地', icon: '🎯' },
    { title: '行程日期', icon: '📅' },
    { title: '预算范围', icon: '💰' },
    { title: '兴趣偏好', icon: '🎨' },
  ];

  const handleNext = () => {
    // 验证当前步骤
    if (currentStep === 0 && !formData.origin) {
      message.warning('请选择出发地');
      return;
    }
    if (currentStep === 1 && !formData.destination) {
      message.warning('请选择目的地');
      return;
    }
    if (currentStep === 2 && (!formData.startDate || !formData.endDate)) {
      message.warning('请选择行程日期');
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleGenerate = async () => {
    // 验证所有必填项
    if (!formData.origin) {
      message.warning('请选择出发地');
      setCurrentStep(0);
      return;
    }
    if (!formData.destination) {
      message.warning('请选择目的地');
      setCurrentStep(1);
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      message.warning('请选择行程日期');
      setCurrentStep(2);
      return;
    }
    if (formData.preferences.length === 0) {
      message.warning('请选择至少一个兴趣偏好');
      setCurrentStep(4);
      return;
    }

    setLoading(true);

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

        message.success('行程生成成功！');

        // 跳转到行程页面
        console.log('🚀 准备跳转到行程页面...');
        navigate('/itinerary');
      } else {
        message.error('行程规划失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('❌ 行程规划失败:', error);
      message.error(error.response?.data?.error || '行程规划失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <LocationSearch
            title="出发地"
            placeholder=""
            value={formData.origin}
            onChange={(value) => setFormData({ ...formData, origin: value })}
            showLocationButton={true}
          />
        );
      case 1:
        return (
          <LocationSearch
            title="目的地"
            placeholder=""
            value={formData.destination}
            onChange={(value) => setFormData({ ...formData, destination: value })}
            showPopularDestinations={true}
          />
        );
      case 2:
        return (
          <DateRangePicker
            startDate={formData.startDate}
            endDate={formData.endDate}
            onChange={(startDate, endDate) =>
              setFormData({ ...formData, startDate, endDate })
            }
          />
        );
      case 3:
        return (
          <BudgetRangeSlider
            minBudget={formData.minBudget}
            maxBudget={formData.maxBudget}
            onChange={(minBudget, maxBudget) =>
              setFormData({ ...formData, minBudget, maxBudget })
            }
          />
        );
      case 4:
        return (
          <PreferenceCards
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
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <PageHeader
        title="开始规划您的完美旅程"
        subtitle="只需几步，AI 为您定制专属行程"
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* 左侧：规划表单 */}
          <div style={{ flex: 1 }}>
            <CompactProgressBar current={currentStep} steps={steps} />

            <div style={{ marginBottom: '24px' }}>
              {renderStepContent()}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <Button
                size="large"
                disabled={currentStep === 0}
                onClick={handlePrev}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              >
                上一步
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={handleGenerate}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  生成行程
                </Button>
              )}
            </div>
          </div>

          {/* 右侧：AI顾问 */}
          <div style={{ width: '400px' }}>
            <TravelAdvisor
              planContext={{
                origin: formData.origin,
                destination: formData.destination,
                startDate: formData.startDate,
                endDate: formData.endDate,
                budget: Math.round((formData.minBudget + formData.maxBudget) / 2),
                groupSize: 1, // 默认1人，后续可以从表单获取
                preferences: formData.preferences,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

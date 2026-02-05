// 问答页面 - 渐进式问答收集用户偏好
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Steps, message, Input, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { createPlan } from '../api/client';
import { useAppStore } from '../store';

export default function Plan() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);

  // 用户输入的状态
  const [formData, setFormData] = useState<Record<string, any>>({
    destination: '',
    startDate: '',
    endDate: '',
    duration: '',
    travelers: '',
    budget: '',
    preferences: {
      interests: '',
      pace: '',
      energyLevel: '',
    },
  });

  const questions = [
    {
      key: 'destination',
      title: '目的地',
      placeholder: '例如：北京、云南、日本东京',
    },
    {
      key: 'startDate',
      title: '出发日期',
      type: 'date',
    },
    {
      key: 'endDate',
      title: '返程日期',
      type: 'date',
    },
    {
      key: 'duration',
      title: '旅行天数',
      placeholder: '例如：7天6晚',
    },
    {
      key: 'travelers',
      title: '出行人数',
      placeholder: '例如：2人',
    },
    {
      key: 'budget',
      title: '预算范围',
      placeholder: '例如：5000-8000元',
    },
    {
      key: 'interests',
      title: '兴趣偏好',
      placeholder: '例如：历史文化、美食、自然风光',
    },
    {
      key: 'pace',
      title: '出行节奏',
      placeholder: '例如：慢游、适中、紧凑',
    },
    {
      key: 'energyLevel',
      title: '体力值',
      placeholder: '例如：轻松、中等、充沛',
    },
  ];

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleGenerate = async () => {
    setLoading(true);

    try {
      // 构建请求参数
      const request = {
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        travelers: parseInt(formData.travelers) || 1,
        budget: formData.budget ? parseInt(formData.budget.replace(/[^0-9]/g, '')) : undefined,
        preferences: {
          interests: formData.preferences.interests,
          pace: formData.preferences.pace,
          energy_level: formData.preferences.energyLevel,
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

        // 验证保存是否成功
        setTimeout(() => {
          const savedItinerary = useAppStore.getState().currentItinerary;
          console.log('🔍 验证 Store 中的数据:', savedItinerary);
        }, 100);

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
    const question = questions[currentStep];
    const { key, title, placeholder, type } = question;

    return (
      <Card>
        <h2>{title}</h2>
        {type === 'date' ? (
          <DatePicker
            placeholder={placeholder}
            value={formData[key] ? dayjs(formData[key]) : null}
            onChange={(date) => {
              setFormData({
                ...formData,
                [key]: date ? date.format('YYYY-MM-DD') : '',
              });
            }}
            style={{ marginBottom: '24px', width: '100%' }}
          />
        ) : (
          <Input
            placeholder={placeholder}
            value={
              key === 'startDate' || key === 'endDate'
                ? formData[key as string]
                : formData[
                    key === 'interests' || key === 'pace' || key === 'energyLevel'
                      ? 'preferences'
                      : key
                  ][key === 'startDate' || key === 'endDate' ? '' : '.']
            }
            onChange={(e) => {
              const value = e.target.value;
              if (key === 'startDate' || key === 'endDate') {
                setFormData({ ...formData, [key]: value });
              } else if (key === 'interests' || key === 'pace' || key === 'energyLevel') {
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    [key]: value,
                  },
                });
              } else {
                setFormData({ ...formData, [key]: value });
              }
            }}
            style={{ marginBottom: '24px' }}
          />
        )}
        <div>
          <Button disabled={currentStep === 0} onClick={handlePrev}>
            上一步
          </Button>
          {currentStep < questions.length - 1 && (
            <Button type="primary" onClick={handleNext} style={{ marginLeft: 8 }}>
              下一步
            </Button>
          )}
          {currentStep === questions.length - 1 && (
            <Button type="primary" loading={loading} onClick={handleGenerate} style={{ marginLeft: 8 }}>
              生成行程
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>开始规划</h1>
      <Steps current={currentStep} items={questions.map((q) => ({ title: q.title }))} />
      <div style={{ marginTop: '24px' }}>{renderStepContent()}</div>
    </div>
  );
}

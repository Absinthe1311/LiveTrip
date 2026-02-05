// 问答页面 - 渐进式问答收集用户偏好
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Steps, message, Input, DatePicker, Select, Radio } from 'antd';
import dayjs from 'dayjs';
import { createPlan } from '../api/client';
import { useAppStore } from '../store';

// 预设的旅行偏好
const TRAVEL_PREFERENCES = [
  { label: '历史文化', value: '历史文化' },
  { label: '自然风光', value: '自然风光' },
  { label: '美食探索', value: '美食探索' },
  { label: '城市体验', value: '城市体验' },
  { label: '休闲度假', value: '休闲度假' },
  { label: '户外探险', value: '户外探险' },
  { label: '购物娱乐', value: '购物娱乐' },
  { label: '艺术文化', value: '艺术文化' },
];

// 预算区间选项
const BUDGET_RANGES = [
  { label: '5000-10000元', value: '5000-10000' },
  { label: '10000-20000元', value: '10000-20000' },
  { label: '20000-30000元', value: '20000-30000' },
  { label: '30000-50000元', value: '30000-50000' },
  { label: '50000元以上', value: '50000+' },
];

export default function Plan() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);

  // 用户输入的状态
  const [formData, setFormData] = useState<Record<string, any>>({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    preferences: '',
    budgetRange: '',
  });

  const questions = [
    {
      key: 'origin',
      title: '出发地',
      placeholder: '例如：上海、广州、深圳',
    },
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
      key: 'preferences',
      title: '旅行偏好',
      type: 'select',
      options: TRAVEL_PREFERENCES,
    },
    {
      key: 'budgetRange',
      title: '预算范围',
      type: 'radio',
      options: BUDGET_RANGES,
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
      // 解析预算区间
      let budget: number | undefined;
      if (formData.budgetRange) {
        if (formData.budgetRange === '50000+') {
          budget = 50000;
        } else {
          const parts = formData.budgetRange.split('-');
          if (parts.length === 2) {
            budget = parseInt(parts[1]);
          }
        }
      }

      // 构建请求参数
      const request = {
        origin: formData.origin,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget,
        preferences: {
          interests: formData.preferences,
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
    const { key, title, placeholder, type, options } = question;

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
        ) : type === 'select' ? (
          <Select
            placeholder={placeholder}
            value={formData[key] || undefined}
            onChange={(value) => {
              setFormData({
                ...formData,
                [key]: value,
              });
            }}
            options={options || []}
            style={{ marginBottom: '24px', width: '100%' }}
          />
        ) : type === 'radio' ? (
          <Radio.Group
            value={formData[key] || undefined}
            onChange={(e) => {
              setFormData({
                ...formData,
                [key]: e.target.value,
              });
            }}
            style={{ marginBottom: '24px', width: '100%' }}
          >
            {(options || []).map((option: any) => (
              <Radio key={option.value} value={option.value} style={{ display: 'block', marginBottom: '8px' }}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        ) : (
          <Input
            placeholder={placeholder}
            value={formData[key]}
            onChange={(e) => {
              setFormData({
                ...formData,
                [key]: e.target.value,
              });
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

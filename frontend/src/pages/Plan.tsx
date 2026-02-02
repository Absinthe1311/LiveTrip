// 问答页面 - 渐进式问答收集用户偏好
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Steps, message, Input } from 'antd';

export default function Plan() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const handleGenerate = () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setLoading(false);
      message.success('行程生成成功！');
      // 保存到Zustand store
      navigate('/itinerary');
    }, 2000);
  };

  const renderStepContent = () => {
    const question = questions[currentStep];
    const { key, title, placeholder } = question;

    return (
      <Card>
        <h2>{title}</h2>
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

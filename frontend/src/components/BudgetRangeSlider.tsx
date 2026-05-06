import { useState, useEffect } from 'react';
import { Slider, InputNumber, Card, Row, Col, Button, Space, Tag } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

interface BudgetRangeSliderProps {
  minBudget?: number;
  maxBudget?: number;
  onChange: (minBudget: number, maxBudget: number) => void;
}

const QUICK_BUDGETS = [
  { label: '5k', value: 5000 },
  { label: '1万', value: 10000 },
  { label: '2万', value: 20000 },
  { label: '3万', value: 30000 },
  { label: '5万', value: 50000 },
];

const BUDGET_MARKS = {
  5000: '5k',
  10000: '1万',
  20000: '2万',
  30000: '3万',
  50000: '5万+',
};

export default function BudgetRangeSlider({
  minBudget = 5000,
  maxBudget = 20000,
  onChange
}: BudgetRangeSliderProps) {
  const [budgetRange, setBudgetRange] = useState<[number, number]>([minBudget, maxBudget]);

  useEffect(() => {
    setBudgetRange([minBudget, maxBudget]);
  }, [minBudget, maxBudget]);

  const handleSliderChange = (values: [number, number]) => {
    setBudgetRange(values);
    onChange(values[0], values[1]);
  };

  const handleMinChange = (value: number | null) => {
    if (value !== null && value <= budgetRange[1]) {
      const newRange: [number, number] = [value, budgetRange[1]];
      setBudgetRange(newRange);
      onChange(newRange[0], newRange[1]);
    }
  };

  const handleMaxChange = (value: number | null) => {
    if (value !== null && value >= budgetRange[0]) {
      const newRange: [number, number] = [budgetRange[0], value];
      setBudgetRange(newRange);
      onChange(newRange[0], newRange[1]);
    }
  };

  const handleQuickSelect = (budget: number) => {
    const newMax = Math.max(budget, budgetRange[0]);
    const newRange: [number, number] = [budgetRange[0], newMax];
    setBudgetRange(newRange);
    onChange(newRange[0], newRange[1]);
  };

  const getBudgetLevel = () => {
    const avg = (budgetRange[0] + budgetRange[1]) / 2;
    if (avg < 10000) return { label: '经济型', color: '#52c41a' };
    if (avg < 20000) return { label: '舒适型', color: '#1890ff' };
    if (avg < 30000) return { label: '豪华型', color: '#722ed1' };
    return { label: '奢华型', color: '#eb2f96' };
  };

  const budgetLevel = getBudgetLevel();

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarOutlined style={{ color: '#667eea' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>预算范围</span>
        </div>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '12px',
          fontWeight: 500
        }}>
          快速选择:
        </div>
        <Space wrap>
          {QUICK_BUDGETS.map(budget => (
            <Button
              key={budget.label}
              size="small"
              onClick={() => handleQuickSelect(budget.value)}
              style={{
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
              }}
            >
              {budget.label}
            </Button>
          ))}
        </Space>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '16px',
          fontWeight: 500
        }}>
          自定义范围:
        </div>
        <Slider
          range
          min={5000}
          max={50000}
          step={1000}
          value={budgetRange}
          onChange={handleSliderChange as any}
          marks={BUDGET_MARKS}
          tooltip={{
            formatter: (value) => `¥${value?.toLocaleString()}`
          }}
          style={{ marginBottom: '24px' }}
        />
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              最低预算
            </div>
            <InputNumber
              style={{ width: '100%' }}
              min={5000}
              max={budgetRange[1]}
              step={1000}
              value={budgetRange[0]}
              onChange={handleMinChange}
              formatter={(value) => `¥ ${value?.toLocaleString()}`}
              parser={(value) => value?.replace(/¥\s?|(,*)/g, '') as unknown as number}
              size="large"
            />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              最高预算
            </div>
            <InputNumber
              style={{ width: '100%' }}
              min={budgetRange[0]}
              max={100000}
              step={1000}
              value={budgetRange[1]}
              onChange={handleMaxChange}
              formatter={(value) => `¥ ${value?.toLocaleString()}`}
              parser={(value) => value?.replace(/¥\s?|(,*)/g, '') as unknown as number}
              size="large"
            />
          </Col>
        </Row>
      </div>

      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
        borderRadius: '8px',
        border: '1px solid #667eea30'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              当前预算范围
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#667eea'
            }}>
              ¥{budgetRange[0].toLocaleString()} - ¥{budgetRange[1].toLocaleString()}
            </div>
          </div>
          <Tag
            color={budgetLevel.color}
            style={{
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600
            }}
          >
            {budgetLevel.label}
          </Tag>
        </div>
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#999'
        }}>
          平均预算: ¥{Math.round((budgetRange[0] + budgetRange[1]) / 2).toLocaleString()}
        </div>
      </div>
    </Card>
  );
}

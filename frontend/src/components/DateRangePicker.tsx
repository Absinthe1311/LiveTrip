import { useState, useEffect } from 'react';
import { DatePicker, Card, Row, Col, Button, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate: string, endDate: string) => void;
}

const QUICK_OPTIONS = [
  { label: '本周', days: 7 },
  { label: '下周', days: 7 },
  { label: '本月', days: 30 },
  { label: '下月', days: 30 },
];

export default function DateRangePicker({
  startDate,
  endDate,
  onChange
}: DateRangePickerProps) {
  const [dates, setDates] = useState<[Dayjs | null, Dayjs | null]>([
    startDate ? dayjs(startDate) : null,
    endDate ? dayjs(endDate) : null
  ]);

  useEffect(() => {
    setDates([
      startDate ? dayjs(startDate) : null,
      endDate ? dayjs(endDate) : null
    ]);
  }, [startDate, endDate]);

  const handleDateChange = (values: [Dayjs | null, Dayjs | null]) => {
    setDates(values);
    if (values[0] && values[1]) {
      onChange(
        values[0].format('YYYY-MM-DD'),
        values[1].format('YYYY-MM-DD')
      );
    }
  };

  const handleQuickSelect = (days: number) => {
    const start = dayjs();
    const end = dayjs().add(days, 'day');
    
    setDates([start, end]);
    onChange(
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD')
    );
  };

  const calculateDays = () => {
    if (dates[0] && dates[1]) {
      // 计算游玩天数：天数差 + 1（因为出发当天也算一天）
      const dayDiff = dates[1].diff(dates[0], 'day');
      return dayDiff + 1;
    }
    return 0;
  };

  const formatDate = (date: Dayjs | null) => {
    if (!date) return '请选择日期';
    return date.format('YYYY年MM月DD日');
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#667eea' }} />
          <span style={{ fontSize: '18px', fontWeight: 600 }}>行程日期</span>
        </div>
      }
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ marginBottom: '24px' }}>
        <RangePicker
          value={dates}
          onChange={handleDateChange as any}
          style={{ width: '100%' }}
          size="large"
          format="YYYY-MM-DD"
          placeholder={['选择出发日期', '选择返回日期']}
          disabledDate={(current) => {
            // 禁用过去的日期
            return current && current < dayjs().startOf('day');
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <Card
          size="small"
          style={{
            textAlign: 'center',
            background: '#f5f7fa',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
            📅 出发日期
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
            {formatDate(dates[0])}
          </div>
        </Card>
        <Card
          size="small"
          style={{
            textAlign: 'center',
            background: '#f5f7fa',
            border: '1px solid #e8e8e8'
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
            📅 返回日期
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
            {formatDate(dates[1])}
          </div>
        </Card>
      </div>

      {calculateDays() > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
          borderRadius: '8px',
          border: '1px solid #667eea30'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            📊 游玩天数
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#667eea',
            marginBottom: '4px'
          }}>
            {calculateDays()}天
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {calculateDays() >= 7 ? '适合深度游' : '适合短途游'}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '12px',
          fontWeight: 500
        }}>
          快速选择:
        </div>
        <Space wrap>
          {QUICK_OPTIONS.map(option => (
            <Button
              key={option.label}
              size="small"
              onClick={() => handleQuickSelect(option.days)}
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
              {option.label}
            </Button>
          ))}
        </Space>
      </div>
    </Card>
  );
}

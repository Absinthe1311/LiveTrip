import React, { useState, useEffect } from 'react';
import { Card, Button, TimePicker, Space, Tooltip } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

interface AttractionCardProps {
  time: string;
  name: string;
  desc: string;
  onShowAlternatives?: () => void;
  onTimeChange?: (newTime: string) => void;
  recommendedDuration?: number; // 推荐游玩时长（分钟）
}

export default function AttractionCard({ 
  time, 
  name, 
  desc, 
  onShowAlternatives, 
  onTimeChange,
  recommendedDuration 
}: AttractionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);

  // 解析时间段
  useEffect(() => {
    const [start, end] = time.split('-').map(t => {
      const [hours, minutes] = t.trim().split(':').map(Number);
      return dayjs().hour(hours).minute(minutes);
    });
    setStartTime(start);
    setEndTime(end);
  }, [time]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (startTime && endTime) {
      const newTime = `${startTime.format('HH:mm')}-${endTime.format('HH:mm')}`;
      onTimeChange?.(newTime);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    // 恢复原始时间
    const [start, end] = time.split('-').map(t => {
      const [hours, minutes] = t.trim().split(':').map(Number);
      return dayjs().hour(hours).minute(minutes);
    });
    setStartTime(start);
    setEndTime(end);
    setIsEditing(false);
  };

  // 计算当前游玩时长
  const currentDuration = startTime && endTime ? endTime.diff(startTime, 'minute') : 0;

  return (
    <Card
      hoverable
      style={{
        marginBottom: 16,
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <Space direction="vertical" style={{ marginBottom: 8 }}>
              <TimePicker
                value={startTime}
                onChange={(value) => setStartTime(value)}
                format="HH:mm"
                placeholder="开始时间"
                style={{ width: 120 }}
              />
              <TimePicker
                value={endTime}
                onChange={(value) => setEndTime(value)}
                format="HH:mm"
                placeholder="结束时间"
                style={{ width: 120 }}
              />
              <div style={{ fontSize: '12px', color: '#999' }}>
                当前时长: {currentDuration} 分钟
                {recommendedDuration && (
                  <span style={{ marginLeft: 8 }}>
                    | 推荐时长: {recommendedDuration} 分钟
                  </span>
                )}
              </div>
            </Space>
          ) : (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 8
              }}>
                <div style={{
                  color: '#1890ff',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  {time}
                </div>
                {onTimeChange && (
                  <Tooltip title="修改时间">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      size="small"
                      onClick={handleEdit}
                      style={{
                        padding: '0 4px',
                        color: '#999',
                        fontSize: '12px'
                      }}
                    />
                  </Tooltip>
                )}
              </div>
              {recommendedDuration && (
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: 8
                }}>
                  推荐游玩时长: {recommendedDuration} 分钟
                </div>
              )}
            </>
          )}
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            {name}
          </h3>
          <p style={{
            margin: 0,
            color: '#666',
            lineHeight: '1.6',
            fontSize: '14px'
          }}>
            {desc}
          </p>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginLeft: 16
        }}>
          {isEditing ? (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleSave}
              >
                保存
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancel}
              >
                取消
              </Button>
            </Space>
          ) : (
            onShowAlternatives && (
              <Button
                type="link"
                style={{
                  padding: '4px 8px',
                  fontSize: '13px',
                  color: '#1890ff',
                  whiteSpace: 'nowrap'
                }}
                onClick={onShowAlternatives}
              >
                查看备选
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  );
}

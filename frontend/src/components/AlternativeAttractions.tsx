import React, { useState, useEffect } from 'react';
import { Card, Rate, Button, Tag, Spin, Alert, Modal } from 'antd';
import { CloseOutlined, SwapOutlined, ThunderboltOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { AttractionItem } from '../api/client';

interface AlternativeAttractionsProps {
  originalAttraction: AttractionItem;
  alternatives: Array<{
    id: string;
    name: string;
    description: string;
    location: string;
    estimated_cost: number;
    type?: string;
    address?: string;
    iotData?: {
      crowdLevel: number;
      temperature: number;
      rainProbability: number;
      isOpen: boolean;
    };
  }>;
  onClose: () => void;
  onReplace: (originalId: string, newAttraction: any) => void;
}

// IoT数据评估组件
function IoTDataDisplay({ iotData }: { iotData?: any }) {
  if (!iotData) {
    return null;
  }

  const { crowdLevel, temperature, rainProbability, isOpen } = iotData;

  // 评估天气状况
  const getWeatherStatus = () => {
    if (rainProbability > 80) return { icon: '⛈️', text: '暴雨', color: 'red', level: 'severe' };
    if (rainProbability > 50) return { icon: '🌧️', text: '中雨', color: 'orange', level: 'warning' };
    if (rainProbability > 20) return { icon: '🌦️', text: '小雨', color: 'yellow', level: 'info' };
    return { icon: '☀️', text: '晴天', color: 'green', level: 'good' };
  };

  // 评估人流情况
  const getCrowdStatus = () => {
    if (crowdLevel > 90) return { icon: '👥', text: '极度拥挤', color: 'red', level: 'severe' };
    if (crowdLevel > 60) return { icon: '👥', text: '人流较多', color: 'orange', level: 'warning' };
    if (crowdLevel > 40) return { icon: '👥', text: '人流适中', color: 'yellow', level: 'info' };
    return { icon: '👥', text: '人流较少', color: 'green', level: 'good' };
  };

  // 评估开放状态
  const getOpenStatus = () => {
    if (!isOpen) return { icon: '🔒', text: '已关闭', color: 'red', level: 'severe' };
    return { icon: '🔓', text: '正常开放', color: 'green', level: 'good' };
  };

  const weather = getWeatherStatus();
  const crowd = getCrowdStatus();
  const open = getOpenStatus();

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Tag icon={<ThunderboltOutlined />} color={weather.color}>
          {weather.icon} {weather.text} {temperature}°C
        </Tag>
        <Tag icon={<TeamOutlined />} color={crowd.color}>
          {crowd.icon} {crowd.text}
        </Tag>
        <Tag icon={<CheckCircleOutlined />} color={open.color}>
          {open.icon} {open.text}
        </Tag>
      </div>
    </div>
  );
}

// 备选景点卡片
function AlternativeCard({ attraction, originalAttraction, onReplace }: {
  attraction: any;
  originalAttraction: AttractionItem;
  onReplace: (newAttraction: any) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleReplace = async () => {
    setLoading(true);
    onReplace(attraction);
    setLoading(false);
  };

  return (
    <Card
      hoverable
      style={{
        minWidth: '280px',
        maxWidth: '280px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s',
        flexShrink: 0
      }}
      bodyStyle={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 景点图片区域 */}
      <div style={{
        height: '160px',
        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        position: 'relative'
      }}>
        <span>🏛️</span>
      </div>

      {/* 景点信息 */}
      <div style={{ padding: '16px', flex: 1 }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#333',
          margin: 0
        }}>
          {attraction.name}
        </h4>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <Rate disabled value={4.5} style={{ fontSize: '12px' }} />
          <span style={{ fontSize: '12px', color: '#666' }}>
            4.5分
          </span>
        </div>

        <p style={{
          fontSize: '13px',
          color: '#666',
          marginBottom: '12px',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0
        }}>
          {attraction.description}
        </p>

        {/* IoT数据展示 */}
        <IoTDataDisplay iotData={attraction.iotData} />

        {/* 距离和门票信息 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: '12px', color: '#999' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ClockCircleOutlined />
              <span>门票价格</span>
            </div>
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ff4d4f'
          }}>
            {attraction.estimated_cost === 0 ? '免费' : `¥${attraction.estimated_cost}`}
          </div>
        </div>

        {/* 替换按钮 */}
        <Button
          type="primary"
          icon={<SwapOutlined />}
          onClick={handleReplace}
          loading={loading}
          style={{
            width: '100%',
            marginTop: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px'
          }}
        >
          替换此景点
        </Button>
      </div>
    </Card>
  );
}

// 主组件
export default function AlternativeAttractions({
  originalAttraction,
  alternatives,
  onClose,
  onReplace
}: AlternativeAttractionsProps) {
  if (alternatives.length === 0) {
    return (
      <Alert
        message="暂无备选景点"
        description="当前没有可替换的景点，请稍后再试"
        type="info"
        showIcon
        style={{ marginTop: '16px' }}
      />
    );
  }

  return (
    <div style={{
      marginTop: '16px',
      padding: '20px',
      background: '#f9f9f9',
      borderRadius: '12px',
      border: '1px solid #e8e8e8'
    }}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <SwapOutlined style={{ color: '#667eea' }} />
          备选景点推荐
          <Tag color="blue">{alternatives.length}个选项</Tag>
        </h4>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ fontSize: '14px' }}
        >
          收起备选
        </Button>
      </div>

      {/* 备选景点列表 - 横向滚动 */}
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '8px',
        WebkitOverflowScrolling: 'touch' // iOS平滑滚动
      }}>
        {alternatives.map((attraction, index) => (
          <AlternativeCard
            key={index}
            attraction={attraction}
            originalAttraction={originalAttraction}
            onReplace={onReplace}
          />
        ))}
      </div>
    </div>
  );
}

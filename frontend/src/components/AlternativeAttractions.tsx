import React, { useState, useEffect } from 'react';
import { Card, Rate, Button, Tag, Spin, Alert, Modal, Tabs } from 'antd';
import { CloseOutlined, SwapOutlined, ThunderboltOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined, HeartOutlined } from '@ant-design/icons';
import type { AttractionItem } from '../api/client';
import FavoritesList from './FavoritesList';
import { addFavorite, updateAlternativeRelations } from '../api/client';

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
  onReplace: (newAttraction: any) => void;
  city?: string;
  dayIndex?: number;
  attractionIndex?: number;
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

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px'
        }}>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleReplace}
            loading={loading}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            替换
          </Button>
        </div>
      </div>
    </Card>
  );
}

// 主组件
export default function AlternativeAttractions({
  originalAttraction,
  alternatives,
  onClose,
  onReplace,
  city,
  dayIndex,
  attractionIndex
}: AlternativeAttractionsProps) {
  const [activeTab, setActiveTab] = useState('alternatives');
  const [addingToFavorites, setAddingToFavorites] = useState<string | null>(null);

  const handleAddFavorite = async (spotId: string) => {
    setAddingToFavorites(spotId);
    try {
      const response = await addFavorite(spotId);
      if (response.success) {
        Modal.success({
          title: '收藏成功',
          content: '景点已添加到收藏列表',
        });

        // 触发收藏更新事件，通知Navbar更新收藏数量
        window.dispatchEvent(new Event('favoritesUpdated'));
      }
    } catch (error) {
      console.error('❌ 添加收藏失败:', error);
      Modal.error({
        title: '收藏失败',
        content: '添加收藏失败，请重试',
      });
    } finally {
      setAddingToFavorites(null);
    }
  };

  const handleAddToAlternativesFromFavorites = async (favorite: any) => {
    console.log('🔍 handleAddToAlternativesFromFavorites 接收到 favorite:', favorite);
    console.log('🔍 favorite.spot:', favorite.spot);
    console.log('🔍 favorite.spot.id:', favorite.spot?.id);

    // 确保 favorite.spot 存在
    if (!favorite.spot || !favorite.spot.id) {
      console.error('❌ favorite.spot 不存在或无效');
      Modal.error({
        title: '添加失败',
        content: '收藏景点数据无效',
      });
      return;
    }

    try {
      // 步骤1：将收藏景点添加到备选关系数据库中
      console.log('🔄 步骤1: 将收藏景点添加到备选关系数据库...');
      console.log('   原景点名称:', originalAttraction.name);
      console.log('   收藏景点ID:', favorite.spot.id);
      console.log('   城市:', city || '');

      // 需要先获取原景点的ID
      let originalSpotId = originalAttraction.name; // 临时使用名称
      try {
        // 尝试通过名称获取景点ID
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spots/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: originalAttraction.name,
            city: city || '',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.id) {
            originalSpotId = data.data.id;
            console.log('✅ 找到原景点ID:', originalSpotId);
          }
        }
      } catch (error) {
        console.error('❌ 获取原景点ID失败:', error);
      }

      // 尝试更新备选关系，如果失败则继续（可能关系已存在）
      try {
        await updateAlternativeRelations(
          originalSpotId, // 原景点ID
          favorite.spot.id, // 收藏景点ID
          city || ''
        );
        console.log('✅ 步骤1完成: 备选关系已更新');
      } catch (error: any) {
        console.warn('⚠️  备选关系更新失败（可能关系已存在）:', error.message);
        console.log('✅ 步骤1完成: 跳过备选关系更新，继续执行');
      }

      // 步骤2：生成IoT数据（如果不存在）
      let iotData = favorite.spot.iotData;
      if (!iotData) {
        console.log('🔄 步骤2: 生成IoT数据...');
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/spots/${favorite.spotId}/iot/generate`, {
            method: 'POST',
          });

          if (response.ok) {
            const iotDataResponse = await response.json();
            iotData = iotDataResponse.data;
          }
        } catch (error) {
          console.error('❌ 生成IoT数据失败:', error);
          iotData = null;
        }
      }
      console.log('✅ 步骤2完成: IoT数据已准备');

      // 步骤3：创建替换对象
      console.log('🔄 步骤3: 创建替换对象...');
      const newAlternative = {
        id: favorite.spot.id,
        name: favorite.spot.name,
        description: favorite.spot.description || '',
        location: favorite.spot.location,
        estimated_cost: favorite.spot.ticketPrice || 0,
        type: favorite.spot.category || '',
        address: favorite.spot.address || '',
        iotData: iotData,
      };
      console.log('✅ 步骤3完成: 替换对象已创建');

      // 步骤4：执行替换（同其他备选景点）
      console.log('🔄 步骤4: 执行替换...');
      if (dayIndex !== undefined && attractionIndex !== undefined) {
        onReplace({
          originalItem: originalAttraction,
          newItem: newAlternative,
          dayIndex,
          attractionIndex,
          skipConfirm: true
        });
      } else {
        onReplace({
          ...newAlternative,
          skipConfirm: true
        });
      }
      console.log('✅ 步骤4完成: 替换已执行');

      Modal.success({
        title: '添加成功',
        content: '已将收藏景点添加到行程',
      });
    } catch (error) {
      console.error('❌ 添加到备选失败:', error);
      Modal.error({
        title: '添加失败',
        content: '添加到备选失败，请重试',
      });
    }
  };

  if (alternatives.length === 0 && activeTab === 'alternatives') {
    return (
      <Alert
        message="暂无备选景点"
        description="当前没有可替换的景点，请尝试从收藏列表添加"
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

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'alternatives',
            label: `系统推荐 (${alternatives.length})`,
            children: (
              <div style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch'
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
            ),
          },
          {
            key: 'favorites',
            label: '我的收藏',
            children: (
              <FavoritesList
                onAddToAlternatives={handleAddToAlternativesFromFavorites}
                targetCity={city || ''}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

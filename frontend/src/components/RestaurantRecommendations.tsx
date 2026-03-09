// 餐厅推荐组件 - 按天展示推荐的餐厅列表供用户选择
import { useState, useEffect } from 'react';
import { Card, Spin, Empty, Tag, Rate, Button, message, Tabs } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, StarOutlined } from '@ant-design/icons';
import { Restaurant, DayRestaurantRecommendation, getRestaurantRecommendations } from '../api/recommendationApi';

interface RestaurantRecommendationsProps {
  days: Array<{
    day: number;
    date: string;
    spots: Array<{
      name: string;
      location: string;
    }>;
  }>;
  onSelect?: (day: number, restaurant: Restaurant | null) => void;
  selectedRestaurants?: Record<number, Restaurant | null>;
  onSkip?: (day: number) => void;
  showSkip?: boolean;
  disabled?: boolean; // 新增：是否禁用（等待酒店推荐完成）
  groupSize?: number; // 新增：人数，用于计算预估费用
  tripId?: string; // 新增：行程ID,用于使用数据库缓存
}

export default function RestaurantRecommendations({
  days,
  onSelect,
  selectedRestaurants = {},
  onSkip,
  showSkip = true,
  disabled = false,
  groupSize = 1, // 默认1人
  tripId, // 行程ID
}: RestaurantRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<DayRestaurantRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('0');

  useEffect(() => {
    // 只有当没有被禁用时才获取餐厅推荐
    if (days.length > 0 && !disabled) {
      fetchRestaurants();
    }
  }, [days, disabled]);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getRestaurantRecommendations(days, tripId);

      if (response.success && response.data) {
        setRecommendations(response.data);
        // 显示数据来源
        if (response.fromCache) {
          console.log('✅ [数据库缓存] 使用数据库缓存的餐厅推荐');
        } else {
          console.log(`✅ [高德API] 获取到 ${response.data.length} 天的餐厅推荐`);
        }
      } else {
        setError(response.error || '获取餐厅推荐失败');
        message.error(response.error || '获取餐厅推荐失败');
      }
    } catch (err: any) {
      console.error('❌ 获取餐厅推荐失败:', err);
      setError(err.message || '网络错误，请稍后重试');
      message.error('获取餐厅推荐失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (day: number, restaurant: Restaurant) => {
    if (onSelect) {
      onSelect(day, restaurant);
      message.success(`第${day}天: 已选择 ${restaurant.name}`);
    }
  };

  const handleSkip = (day: number) => {
    if (onSkip) {
      onSkip(day);
    }
  };

  // 渲染单个餐厅卡片
  const renderRestaurantCard = (restaurant: Restaurant, day: number, index: number) => {
    const isSelected = selectedRestaurants[day]?.name === restaurant.name &&
                       selectedRestaurants[day]?.location === restaurant.location;

    return (
      <Card
        key={`${restaurant.name}-${index}`}
        hoverable
        onClick={() => handleSelect(day, restaurant)}
        style={{
          borderRadius: '8px',
          border: isSelected ? '2px solid #52c41a' : '1px solid #e8e8e8',
          boxShadow: isSelected ? '0 4px 12px rgba(82, 196, 26, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
        styles={{ body: { padding: '16px' } }}
      >
        {/* 餐厅名称和类型 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <h4 style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {restaurant.name}
            </h4>
            {isSelected && (
              <Tag color="green" style={{ marginLeft: '8px' }}>已选</Tag>
            )}
          </div>
          <Tag color="orange">{restaurant.type}</Tag>
        </div>

        {/* 评分 */}
        {restaurant.rating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <StarOutlined style={{ color: '#faad14' }} />
            <Rate disabled defaultValue={restaurant.rating} style={{ fontSize: '12px' }} />
            <span style={{ color: '#666', fontSize: '13px' }}>{restaurant.rating}分</span>
          </div>
        )}

        {/* 地址 */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          marginBottom: '8px',
          color: '#666',
          fontSize: '12px',
        }}>
          <EnvironmentOutlined style={{ marginTop: '2px', color: '#999' }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {restaurant.address}
          </span>
        </div>

        {/* 联系电话 */}
        {restaurant.tel && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            color: '#666',
            fontSize: '12px',
          }}>
            <PhoneOutlined style={{ color: '#999' }} />
            <span>{restaurant.tel}</span>
          </div>
        )}

        {/* 距离 */}
        <div style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: '#f6ffed',
          borderRadius: '4px',
        }}>
          <span style={{ color: '#52c41a', fontSize: '12px', fontWeight: 500 }}>
            距中心点 {restaurant.distance}m
          </span>
        </div>

        {/* 预估费用 */}
        {onSelect && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#fff7e6',
            borderRadius: '6px',
            border: '1px solid #ffd591',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: '#fa8c16', fontSize: '13px' }}>预估费用</span>
              <span style={{
                color: '#fa8c16',
                fontWeight: 600,
                fontSize: '14px',
              }}>
                ¥{estimateRestaurantPrice(restaurant)}/人 × {groupSize}人 = ¥{estimateRestaurantPrice(restaurant) * groupSize}元
              </span>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // 估算餐厅价格
  const estimateRestaurantPrice = (restaurant: Restaurant): number => {
    const type = restaurant.type.toLowerCase();

    if (type.includes('小吃') || type.includes('快餐') || type.includes('面食')) {
      return 30; // 小吃/快餐：30元/人
    } else if (type.includes('中餐') || type.includes('家常菜')) {
      return 80; // 中餐/家常菜：80元/人
    } else if (type.includes('火锅') || type.includes('烧烤')) {
      return 120; // 火锅/烧烤：120元/人
    } else if (type.includes('海鲜')) {
      return 150; // 海鲜：150元/人
    } else if (type.includes('日料') || type.includes('西餐')) {
      return 200; // 日料/西餐：200元/人
    } else {
      return 60; // 其他类型：默认60元/人
    }
  };

  // 渲染某一天的餐厅推荐
  const renderDayRestaurants = (dayRecommendation: DayRestaurantRecommendation) => {
    const hasRestaurants = dayRecommendation.restaurants.length > 0;

    return (
      <div>
        {/* 中心点信息 */}
        {dayRecommendation.centerSpot && (
          <div style={{
            marginBottom: '12px',
            padding: '8px 12px',
            background: '#f5f7fa',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#666',
          }}>
            <EnvironmentOutlined style={{ marginRight: '6px', color: '#667eea' }} />
            以 <strong>{dayRecommendation.centerSpot}</strong> 为中心搜索
          </div>
        )}

        {/* 餐厅列表 */}
        {hasRestaurants ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px',
            marginBottom: '12px',
          }}>
            {dayRecommendation.restaurants.map((restaurant, index) =>
              renderRestaurantCard(restaurant, dayRecommendation.day, index)
            )}
          </div>
        ) : (
          <Empty description="该天暂无餐厅推荐" style={{ padding: '20px 0' }} />
        )}

        {/* 跳过按钮 */}
        {showSkip && onSkip && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Button
              onClick={() => handleSkip(dayRecommendation.day)}
              type="text"
              style={{ color: '#666' }}
            >
              跳过，暂不选择餐厅
            </Button>
          </div>
        )}
      </div>
    );
  };

  // 渲染加载状态
  if (loading) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🍽️</span>
            <span>餐厅推荐（午餐）</span>
          </div>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="正在搜索附近餐厅..." size="large" />
        </div>
      </Card>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🍽️</span>
            <span>餐厅推荐（午餐）</span>
          </div>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Empty description={error} />
          <Button type="primary" onClick={fetchRestaurants} style={{ marginTop: '16px' }}>
            重新获取
          </Button>
        </div>
      </Card>
    );
  }

  // 渲染空状态
  if (recommendations.length === 0) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🍽️</span>
            <span>餐厅推荐（午餐）</span>
          </div>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <Empty description="暂无餐厅推荐" />
      </Card>
    );
  }

  // 生成Tab项
  const tabItems = recommendations.map((dayRec, index) => ({
    key: String(index),
    label: (
      <span>
        第{dayRec.day}天
        {selectedRestaurants[dayRec.day] && (
          <Tag color="green" style={{ marginLeft: '6px', fontSize: '10px' }}>已选</Tag>
        )}
      </span>
    ),
    children: renderDayRestaurants(dayRec),
  }));

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🍽️</span>
            <span>餐厅推荐（午餐）</span>
            <Tag color="orange" style={{ marginLeft: '8px' }}>
              {recommendations.length} 天
            </Tag>
          </div>
          <Button size="small" onClick={fetchRestaurants}>
            刷新
          </Button>
        </div>
      }
      style={{ marginBottom: '24px', borderRadius: '12px' }}
      styles={{ body: { padding: '16px' } }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="small"
      />
    </Card>
  );
}

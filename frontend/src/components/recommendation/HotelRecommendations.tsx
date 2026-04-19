// 酒店推荐组件 - 展示推荐的酒店列表供用户选择
import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Spin, Empty, Tag, Rate, Button, message } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, StarOutlined, CloseOutlined } from '@ant-design/icons';
import { Hotel, getHotelRecommendations } from '../../api/recommendationApi';

interface HotelRecommendationsProps {
  spots: Array<{
    name: string;
    location: string;
  }>;
  budget: number;
  onSelect?: (hotel: Hotel | null) => void;
  selectedHotel?: Hotel | null;
  onSkip?: () => void;
  showSkip?: boolean;
  onLoadComplete?: () => void; // 加载完成回调
  onLoadData?: (hotels: Hotel[]) => void; // 新增：加载推荐数据回调
  days?: number;
  tripId?: string;
}

export default function HotelRecommendations({
  spots,
  budget,
  onSelect,
  selectedHotel,
  onSkip,
  showSkip = true,
  onLoadComplete,
  onLoadData, // 新增
  days = 3, // 默认3天
  tripId, // 行程ID
}: HotelRecommendationsProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 使用 ref 防止重复请求
  const lastRequestKeyRef = useRef<string>('');
  const isRequestingRef = useRef(false);

  // 使用 useMemo 缓存 spots 的序列化值，避免每次渲染创建新数组导致 useEffect 重复触发
  const spotsKey = useMemo(() => JSON.stringify(spots), [spots]);

  useEffect(() => {
    // 生成请求唯一标识
    const requestKey = `${spotsKey}-${budget}-${tripId || 'no-trip'}`;
    
    // 如果是相同的请求，或者正在请求中，则跳过
    if (lastRequestKeyRef.current === requestKey || isRequestingRef.current) {
      return;
    }
    
    if (spots.length > 0 && budget > 0) {
      lastRequestKeyRef.current = requestKey;
      fetchHotels();
    }
  }, [spotsKey, budget, tripId]);

  const fetchHotels = async () => {
    // 防止重复请求
    if (isRequestingRef.current) {
      return;
    }
    
    isRequestingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await getHotelRecommendations(spots, budget, tripId);

      if (response.success && response.data) {
        setHotels(response.data);
        // 通知父组件推荐数据
        if (onLoadData) {
          onLoadData(response.data);
        }
        // 通知父组件加载完成
        if (onLoadComplete) {
          onLoadComplete();
        }
      } else {
        setError(response.error || '获取酒店推荐失败');
        message.error(response.error || '获取酒店推荐失败');
        // 即使失败也通知父组件
        if (onLoadComplete) {
          onLoadComplete();
        }
      }
    } catch (err: any) {
      console.error('❌ 获取酒店推荐失败:', err);
      setError(err.message || '网络错误，请稍后重试');
      message.error('获取酒店推荐失败，请稍后重试');
    } finally {
      setLoading(false);
      isRequestingRef.current = false;
    }
  };

  const handleSelect = (hotel: Hotel) => {
    if (onSelect) {
      onSelect(hotel);
      message.success(`已选择: ${hotel.name}`);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // 估算酒店价格
  const estimateHotelPrice = (hotel: Hotel): number => {
    const type = hotel.type.toLowerCase();
    
    if (type.includes('经济') || type.includes('快捷')) {
      return 200;
    } else if (type.includes('舒适') || type.includes('商务') || type.includes('三星')) {
      return 400;
    } else if (type.includes('高档') || type.includes('标准') || type.includes('四星')) {
      return 600;
    } else if (type.includes('豪华') || type.includes('五星')) {
      return 1000;
    } else {
      return 350;
    }
  };

  const getDays = (): number => {
    return days;
  };

  // 获取档次对应的颜色
  const getTierColor = (type: string): string => {
    if (type.includes('豪华')) return 'gold';
    if (type.includes('高档')) return 'purple';
    if (type.includes('舒适')) return 'blue';
    if (type.includes('经济')) return 'green';
    return 'default';
  };

  // 渲染加载状态
  if (loading) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏨</span>
            <span>酒店推荐</span>
          </div>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin tip="正在搜索附近酒店..." size="large" />
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
            <span style={{ fontSize: '18px' }}>🏨</span>
            <span>酒店推荐</span>
          </div>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Empty description={error} />
          <Button type="primary" onClick={fetchHotels} style={{ marginTop: '16px' }}>
            重新获取
          </Button>
        </div>
      </Card>
    );
  }

  // 渲染空状态
  if (hotels.length === 0) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏨</span>
            <span>酒店推荐</span>
          </div>
        }
        style={{ marginBottom: '24px', borderRadius: '12px' }}
      >
        <Empty description="暂无符合条件的酒店推荐" />
        {showSkip && onSkip && (
          <Button type="primary" onClick={handleSkip} style={{ marginTop: '16px' }}>
            跳过，暂不选择酒店
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏨</span>
            <span>酒店推荐</span>
            <Tag color="blue" style={{ marginLeft: '8px' }}>
              {hotels.length} 家可选
            </Tag>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="small" onClick={fetchHotels}>
              刷新
            </Button>
          </div>
        </div>
      }
      style={{ marginBottom: '24px', borderRadius: '12px' }}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '16px',
      }}>
        {hotels.map((hotel, index) => {
          const isSelected = selectedHotel?.name === hotel.name && selectedHotel?.location === hotel.location;

          return (
            <Card
              key={`${hotel.name}-${index}`}
              hoverable
              onClick={() => handleSelect(hotel)}
              style={{
                borderRadius: '8px',
                border: isSelected ? '2px solid #667eea' : '1px solid #e8e8e8',
                boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              styles={{ body: { padding: '16px' } }}
            >
              {/* 酒店名称和档次 */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {hotel.name}
                  </h3>
                  {isSelected && (
                    <Tag color="green" style={{ marginLeft: '8px' }}>已选</Tag>
                  )}
                </div>
                <Tag color={getTierColor(hotel.type)}>{hotel.type}</Tag>
              </div>

              {/* 评分 */}
              {hotel.rating && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Rate disabled defaultValue={hotel.rating} style={{ fontSize: '14px' }} />
                  <span style={{ color: '#666', fontSize: '14px' }}>{hotel.rating}分</span>
                </div>
              )}

              {/* 地址 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '8px',
                color: '#666',
                fontSize: '13px',
              }}>
                <EnvironmentOutlined style={{ marginTop: '3px', color: '#999' }} />
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {hotel.address}
                </span>
              </div>

              {/* 联系电话 */}
              {hotel.tel && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  color: '#666',
                  fontSize: '13px',
                }}>
                  <PhoneOutlined style={{ color: '#999' }} />
                  <span>{hotel.tel}</span>
                </div>
              )}

              {/* 平均距离 */}
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#f5f7fa',
                borderRadius: '6px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>出行便利度</span>
                  <span style={{
                    color: '#667eea',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}>
                    平均 {hotel.avgDistance} km
                  </span>
                </div>
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
                      约 ¥{estimateHotelPrice(hotel)} × {getDays()}天 = ¥{estimateHotelPrice(hotel) * getDays()}元
                    </span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 跳过按钮 */}
      {showSkip && onSkip && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button onClick={handleSkip} type="text" style={{ color: '#666' }}>
            跳过，暂不选择酒店
          </Button>
        </div>
      )}
    </Card>
  );
}



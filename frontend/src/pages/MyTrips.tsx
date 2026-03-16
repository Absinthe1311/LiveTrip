import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Button, Empty, Spin, message, Typography, Tag, Space } from 'antd';
import { PlusOutlined, CalendarOutlined, EnvironmentOutlined, DollarOutlined, HomeOutlined } from '@ant-design/icons';
import { getUserTrips, deleteTrip } from '../api/client';
import { useAppStore } from '../store';

const { Title, Text } = Typography;

export default function MyTrips() {
  const navigate = useNavigate();
  const setCurrentItinerary = useAppStore((state) => state.setCurrentItinerary);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await getUserTrips();
      if (response.success && response.data) {
        setTrips(response.data);
        console.log('✅ 加载行程列表成功:', response.data);
      }
    } catch (error: any) {
      console.error('❌ 加载行程列表失败:', error);
      message.error('加载行程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrip = (trip: any) => {
    // 直接跳转到行程详情页面
    navigate(`/trip/${trip.id}`);
  };

  const handleDeleteTrip = async (tripId: string) => {
    setDeleting(tripId);
    try {
      const response = await deleteTrip(tripId);
      if (response.success) {
        message.success('行程删除成功');
        loadTrips();
      }
    } catch (error: any) {
      console.error('❌ 删除行程失败:', error);
      message.error('删除行程失败');
    } finally {
      setDeleting(null);
    }
  };

  // 将数据库行程格式转换为前端格式
  const convertTripToItinerary = (trip: any): any => {
    const itinerary: any[] = [];
    const restaurants: any[] = [];
    
    if (trip.days) {
      trip.days.forEach((day: any) => {
        const attractions: any[] = [];
        
        if (day.itineraryItems) {
          day.itineraryItems.forEach((item: any) => {
            // 将DateTime时间转换为时间字符串
            const startDateTime = new Date(item.startTime);
            const endDateTime = new Date(item.endTime);
            const startTime = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
            const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;
            
            attractions.push({
              name: item.name,
              time: `${startTime}-${endTime}`,
              location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
              longitude: item.longitude, // 保留原始经度(用于PDF地图显示)
              latitude: item.latitude,   // 保留原始纬度(用于PDF地图显示)
              estimated_cost: item.cost || 0,
              description: item.description || item.type || '',
              type: item.type || '景点',
              address: item.address || '',
            });
          });
        }

        itinerary.push({
          day: day.dayNumber,
          date: new Date(day.date).toISOString().split('T')[0],
          attractions,
          daily_cost: attractions.reduce((sum: number, attr: any) => sum + attr.estimated_cost, 0),
        });

        // 转换餐厅信息
        if (day.restaurantName) {
          restaurants.push({
            day: day.dayNumber,
            selectedRestaurant: {
              name: day.restaurantName,
              address: day.restaurantAddress,
              location: day.restaurantLocation,
              tel: day.restaurantTel,
              type: day.restaurantType,
              rating: day.restaurantRating,
            },
          });
        } else {
          restaurants.push({
            day: day.dayNumber,
            selectedRestaurant: null,
          });
        }
      });
    }

    // 转换酒店信息
    const hotel = trip.hotelName ? {
      name: trip.hotelName,
      address: trip.hotelAddress,
      location: trip.hotelLocation,
      tel: trip.hotelTel,
      type: trip.hotelType,
      rating: trip.hotelRating,
    } : null;

    return {
      id: trip.id,
      itinerary,
      total_cost: trip.totalBudget || 0,
      budget_breakdown: {
        transportation: trip.budget?.transportation || 0,
        accommodation: trip.budget?.accommodation || 0,
        dining: trip.budget?.food || 0,
        tickets: trip.budget?.tickets || 0,
      },
      summary: {
        destination: trip.destination,
        start_date: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
        end_date: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
        budget: trip.totalBudget || 0,
        days: itinerary.length,
      },
      hotel, // 添加酒店信息
      restaurants, // 添加餐厅信息
    };
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日 (${days}天)`;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fa'
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#333' }}>
              我的行程
            </Title>
            <Text type="secondary">
              共 {trips.length} 个行程
            </Text>
          </div>
          <Space>
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              返回首页
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/plan')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              创建新行程
            </Button>
          </Space>
        </div>

        {trips.length === 0 ? (
          <Card>
            <Empty
              description="暂无行程"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/plan')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                创建第一个行程
              </Button>
            </Empty>
          </Card>
        ) : (
          <List
            grid={{
              gutter: 24,
              xs: 1,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 3,
              xxl: 3,
            }}
            dataSource={trips}
            renderItem={(trip) => (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                  }}
                  bodyStyle={{ padding: '24px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0, color: '#333' }}>
                      {trip.title}
                    </Title>
                    {trip.description && (
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {trip.description}
                      </Text>
                    )}
                  </div>

                  <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <EnvironmentOutlined style={{ color: '#667eea' }} />
                      <Text style={{ fontSize: '14px' }}>
                        {trip.destination}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarOutlined style={{ color: '#667eea' }} />
                      <Text style={{ fontSize: '14px' }}>
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarOutlined style={{ color: '#667eea' }} />
                      <Text style={{ fontSize: '14px' }}>
                        预算: ¥{trip.totalBudget?.toLocaleString() || 0}
                      </Text>
                    </div>
                  </Space>

                  <div style={{ marginBottom: '16px' }}>
                    <Tag color={trip.status === 'planning' ? 'blue' : 'green'}>
                      {trip.status === 'planning' ? '规划中' : trip.status}
                    </Tag>
                    {trip.aiGenerated && (
                      <Tag color="purple">AI生成</Tag>
                    )}
                  </div>

                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button
                      type="primary"
                      onClick={() => handleViewTrip(trip)}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '6px'
                      }}
                    >
                      查看详情
                    </Button>
                    <Button
                      danger
                      loading={deleting === trip.id}
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      删除
                    </Button>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}

// 首页 - LiveTrip 智能旅行规划
// 根据用户登录状态展示不同视图：未登录态展示营销落地页，已登录态展示工作台视图
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Empty, Spin, message, Typography, Statistic, Space } from 'antd';
import { PlusOutlined, CalendarOutlined, EnvironmentOutlined, FileTextOutlined, RightOutlined, FireOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CoreFeatures from '../components/CoreFeatures';
import PopularDestinations from '../components/PopularDestinations';
import Footer from '../components/Footer';
import { getUserTrips, getFavoriteCount } from '../api/client';
import { destinationsData } from '../data/destinationsData';

const { Title, Text } = Typography;

// ==================== 未登录态视图 ====================
function GuestView() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <HeroSection />
      <CoreFeatures />
      <PopularDestinations />
      <Footer />
    </div>
  );
}

// ==================== 已登录态工作台视图 ====================
function WorkspaceView() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [tripCount, setTripCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取当前用户信息
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    // 加载数据
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载行程列表和收藏数量
      const [tripsResponse, favoritesResponse] = await Promise.all([
        getUserTrips(),
        getFavoriteCount()
      ]);

      if (tripsResponse.success && tripsResponse.data) {
        setTrips(tripsResponse.data);
        setTripCount(tripsResponse.data.length);
      }

      if (favoritesResponse.success && favoritesResponse.data) {
        setFavoriteCount(favoritesResponse.data.count || 0);
      }
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期范围
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日 (${days}天)`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f7fa'
        }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  // 获取热门目的地数据（前4个）
  const popularDestinations = Object.values(destinationsData).slice(0, 4);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* 欢迎区域 */}
      <div style={{
        minHeight: '120px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <Title level={2} style={{ margin: 0, color: '#fff', fontSize: '28px' }}>
            你好，{currentUser?.username || '旅行者'}，准备好你的下一次旅行了吗？
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginTop: '8px', display: 'block' }}>
            LiveTrip 智能旅行规划，让每一次旅行都成为美好回忆
          </Text>
        </div>
      </div>

      {/* 主体内容区域 */}
      <div style={{
        flex: 1,
        background: '#f5f7fa',
        padding: '32px 48px',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            {/* 左栏（60%） */}
            <Col xs={24} lg={14} xl={14}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 创建新行程入口 */}
                <Card
                  hoverable
                  onClick={() => navigate('/plan')}
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: '48px 32px' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                      ✈️
                    </div>
                    <Title level={2} style={{ margin: 0, color: '#fff', fontSize: '32px', marginBottom: '12px' }}>
                      创建新行程
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px' }}>
                      输入目的地，AI 为你生成完整行程
                    </Text>
                  </div>
                </Card>

                {/* 最近的行程列表 */}
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={3} style={{ margin: 0, color: '#333' }}>
                        我的行程
                      </Title>
                      <Button
                        type="link"
                        onClick={() => navigate('/my-trips')}
                        style={{ color: '#667eea', padding: 0 }}
                      >
                        查看全部 <RightOutlined />
                      </Button>
                    </div>
                  }
                >
                  {trips.length === 0 ? (
                    <Empty
                      description="还没有行程，马上创建第一个吧"
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
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {trips.slice(0, 3).map((trip) => (
                        <Card
                          key={trip.id}
                          hoverable
                          size="small"
                          style={{
                            borderRadius: '8px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s'
                          }}
                          bodyStyle={{ padding: '16px' }}
                          onClick={() => {
                            // 将行程转换为前端格式并跳转到行程详情页
                            convertTripToItinerary(trip);
                            // 这里需要使用 store 的 setCurrentItinerary，暂时先跳转
                            navigate('/my-trips');
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <Title level={4} style={{ margin: 0, color: '#333', marginBottom: '8px', fontSize: '16px' }}>
                                {trip.title || trip.destination}
                              </Title>
                              <Space direction="vertical" size="small">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <EnvironmentOutlined style={{ color: '#667eea', fontSize: '14px' }} />
                                  <Text style={{ fontSize: '14px', color: '#666' }}>
                                    {trip.destination}
                                  </Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <CalendarOutlined style={{ color: '#667eea', fontSize: '14px' }} />
                                  <Text style={{ fontSize: '14px', color: '#666' }}>
                                    {formatDateRange(trip.startDate, trip.endDate)}
                                  </Text>
                                </div>
                              </Space>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </Space>
                  )}
                </Card>
              </Space>
            </Col>

            {/* 右栏（40%） */}
            <Col xs={24} lg={10} xl={10}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 数据概览 */}
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  title={
                    <Title level={4} style={{ margin: 0, color: '#333' }}>
                      数据概览
                    </Title>
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="共创建行程"
                        value={tripCount}
                        prefix={<FileTextOutlined />}
                        valueStyle={{ color: '#667eea', fontSize: '28px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="收藏景点"
                        value={favoriteCount}
                        prefix={<EnvironmentOutlined />}
                        valueStyle={{ color: '#667eea', fontSize: '28px' }}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 热门目的地（精简版） */}
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Title level={4} style={{ margin: 0, color: '#333' }}>
                        <FireOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                        热门目的地
                      </Title>
                      <Button
                        type="link"
                        onClick={() => navigate('/destinations')}
                        style={{ color: '#667eea', padding: 0 }}
                      >
                        查看更多 <RightOutlined />
                      </Button>
                    </div>
                  }
                >
                  <Row gutter={[16, 16]}>
                    {popularDestinations.map((destination) => (
                      <Col xs={12} sm={12} key={destination.id}>
                        <Card
                          hoverable
                          size="small"
                          style={{
                            borderRadius: '8px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s',
                            textAlign: 'center'
                          }}
                          bodyStyle={{ padding: '16px' }}
                          onClick={() => navigate(`/destination/${destination.id}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
                          }}
                        >
                          <div style={{
                            fontSize: '40px',
                            marginBottom: '8px'
                          }}>
                            {destination.icon}
                          </div>
                          <Title level={5} style={{ margin: 0, color: '#333', fontSize: '16px', marginBottom: '8px' }}>
                            {destination.name}
                          </Title>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Text style={{ fontSize: '13px', color: '#666' }}>
                              {destination.days}天
                            </Text>
                            <Text style={{ fontSize: '13px', color: '#666' }}>
                              ¥{destination.budget}
                            </Text>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// 将数据库行程格式转换为前端格式
function convertTripToItinerary(trip: any): any {
  const itinerary: any[] = [];
  const restaurants: any[] = [];

  if (trip.days) {
    trip.days.forEach((day: any) => {
      const attractions: any[] = [];

      if (day.itineraryItems) {
        day.itineraryItems.forEach((item: any) => {
          const startDateTime = new Date(item.startTime);
          const endDateTime = new Date(item.endTime);
          const startTime = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
          const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

          attractions.push({
            name: item.name,
            time: `${startTime}-${endTime}`,
            location: item.longitude && item.latitude ? `${item.longitude},${item.latitude}` : '',
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
    tripId: trip.id,
    isSavedTrip: true,
    status: trip.status || 'planning', // 添加行程状态
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
    hotel,
    restaurants,
  };
}

// ==================== 主组件 ====================
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  // 根据登录状态渲染不同视图
  return isLoggedIn ? <WorkspaceView /> : <GuestView />;
}

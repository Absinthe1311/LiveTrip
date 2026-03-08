/**
 * 公开行程页面
 * 用于展示分享的行程(只读视图)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Spin,
  Empty,
  Tag,
  Row,
  Col,
  Divider,
  message,
  Space,
  Image,
} from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CopyOutlined,
  ArrowLeftOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { getSharedTrip, cloneSharedTrip } from '../api/client';
import { generateDayMapScreenshot } from '../utils/mapScreenshot';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface ItineraryItem {
  name: string;
  type: string;
  category?: string;
  description?: string;
  startTime: string;
  endTime: string;
  address?: string;
  cost: number;
  latitude?: number;
  longitude?: number;
}

interface DayData {
  dayNumber: number;
  date: string;
  notes?: string;
  itineraryItems: ItineraryItem[];
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantType?: string;
  restaurantRating?: number;
}

interface TripData {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  days: DayData[];
  budget?: {
    transportation: number;
    accommodation: number;
    food: number;
    tickets: number;
    shopping: number;
    other: number;
  };
  hotelName?: string;
  hotelAddress?: string;
  hotelType?: string;
  hotelRating?: number;
}

const SharedTrip: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [error, setError] = useState<string>('');
  const [dayMapUrls, setDayMapUrls] = useState<Record<number, string>>({});
  const [mapsLoading, setMapsLoading] = useState(true);

  // 获取公开行程
  useEffect(() => {
    const fetchTrip = async () => {
      if (!token) {
        setError('分享链接无效');
        setLoading(false);
        return;
      }

      try {
        const response = await getSharedTrip(token);
        if (response.success) {
          setTrip(response.data);
          setLoading(false); // 行程数据加载完成

          // 为每一天生成地图截图
          const mapUrls: Record<number, string> = {};
          setMapsLoading(true); // 开始加载地图

          for (const day of response.data.days) {
            // 检查该天是否有坐标数据
            const hasCoordinates = day.itineraryItems.some((item: any) => item.longitude && item.latitude);

            if (hasCoordinates) {
              try {
                // 准备单日行程数据
                const dayData = {
                  dayNumber: day.dayNumber,
                  itineraryItems: day.itineraryItems.map((item: any) => ({
                    name: item.name,
                    longitude: item.longitude,
                    latitude: item.latitude,
                  })),
                  restaurantName: day.restaurantName,
                  restaurantLocation: day.restaurantLocation,
                };

                // 准备酒店信息 - 修复: 使用扁平化字段
                const hotelInfo = response.data.hotelLocation ? {
                  name: response.data.hotelName,
                  location: response.data.hotelLocation,
                } : undefined;

                console.log(`🗺️ 生成第${day.dayNumber}天地图, 酒店:`, hotelInfo);

                const mapUrl = await generateDayMapScreenshot(dayData, hotelInfo, 800, 500);
                mapUrls[day.dayNumber] = mapUrl;
              } catch (mapError) {
                console.error(`第${day.dayNumber}天地图生成失败:`, mapError);
              }
            }
          }

          setDayMapUrls(mapUrls);
          setMapsLoading(false); // 地图加载完成
        } else {
          setError(response.error || '获取行程失败');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('获取公开行程失败:', err);
        setError(err.response?.data?.error || '获取行程失败,请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [token]);

  // 复刻行程
  const handleClone = async () => {
    if (!token) return;

    // 检查是否登录(这里简化处理,实际应该检查登录状态)
    const userId = localStorage.getItem('userId');
    if (!userId) {
      message.warning('请先登录后再复刻行程');
      navigate('/auth');
      return;
    }

    setCloning(true);
    try {
      const response = await cloneSharedTrip(token);
      if (response.success) {
        message.success('行程复刻成功');
        // 跳转到新行程页面
        navigate(`/itinerary?id=${response.data.tripId}`);
      } else {
        message.error(response.error || '复刻失败');
      }
    } catch (err: any) {
      console.error('复刻行程失败:', err);
      message.error(err.response?.data?.error || '复刻失败,请稍后重试');
    } finally {
      setCloning(false);
    }
  };

  // 返回首页
  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Empty description={error || '行程不存在'} />
        <Button type="primary" onClick={handleBack} style={{ marginTop: 20 }}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回首页
        </Button>
        <Button
          type="primary"
          icon={<CopyOutlined />}
          onClick={handleClone}
          loading={cloning}
        >
          复刻此行程
        </Button>
      </div>

      {/* 行程标题 */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 16 }}>
          {trip.title}
        </Title>
        <Space size="large" wrap>
          <Text>
            <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {trip.destination}
          </Text>
          <Text>
            <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {dayjs(trip.startDate).format('YYYY-MM-DD')} 至 {dayjs(trip.endDate).format('YYYY-MM-DD')}
          </Text>
          <Text>
            <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            总预算: ¥{trip.totalBudget.toLocaleString()}
          </Text>
        </Space>
      </Card>

      {/* 酒店信息 */}
      {trip.hotelName && (
        <Card title="🏨 住宿信息" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Text strong style={{ fontSize: 16 }}>{trip.hotelName}</Text>
              {trip.hotelRating && (
                <Tag color="gold" style={{ marginLeft: 8 }}>
                  ⭐ {trip.hotelRating}
                </Tag>
              )}
            </Col>
            {trip.hotelAddress && (
              <Col span={24}>
                <Text type="secondary">
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  {trip.hotelAddress}
                </Text>
              </Col>
            )}
            {trip.hotelType && (
              <Col span={24}>
                <Tag>{trip.hotelType}</Tag>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* 每日行程 */}
      {trip.days.map((day, dayIndex) => (
        <div key={dayIndex}>
          {/* 每日地图 */}
          {mapsLoading ? (
            <Card
              title={
                <span>
                  <CompassOutlined style={{ marginRight: 8 }} />
                  第 {day.dayNumber} 天行程路线图
                </span>
              }
              style={{ marginBottom: 24 }}
            >
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" tip="地图生成中,请稍候..." />
              </div>
            </Card>
          ) : dayMapUrls[day.dayNumber] ? (
            <Card
              title={
                <span>
                  <CompassOutlined style={{ marginRight: 8 }} />
                  第 {day.dayNumber} 天行程路线图
                </span>
              }
              style={{ marginBottom: 24 }}
            >
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={dayMapUrls[day.dayNumber]}
                  alt={`第${day.dayNumber}天地图`}
                  style={{ maxWidth: '100%', borderRadius: 8 }}
                  placeholder={<Spin />}
                />
              </div>
            </Card>
          ) : null}

          {/* 每日行程详情 */}
          <Card
            title={`第 ${day.dayNumber} 天 - ${dayjs(day.date).format('YYYY年MM月DD日')}`}
            style={{ marginBottom: 24 }}
          >
          {/* 景点列表 */}
          {day.itineraryItems.map((item, itemIndex) => (
            <Card
              key={itemIndex}
              type="inner"
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: 16 }}
            >
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                  {item.category && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>{item.category}</Tag>
                  )}
                </Col>
                <Col span={24}>
                  <Space split={<Divider type="vertical" />}>
                    <Text type="secondary">
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      {dayjs(item.startTime).format('HH:mm')} - {dayjs(item.endTime).format('HH:mm')}
                    </Text>
                    {item.cost > 0 && (
                      <Text type="secondary">
                        <DollarOutlined style={{ marginRight: 8 }} />
                        ¥{item.cost}
                      </Text>
                    )}
                  </Space>
                </Col>
                {item.address && (
                  <Col span={24}>
                    <Text type="secondary">
                      <EnvironmentOutlined style={{ marginRight: 8 }} />
                      {item.address}
                    </Text>
                  </Col>
                )}
                {item.description && (
                  <Col span={24}>
                    <Paragraph
                      type="secondary"
                      style={{ marginBottom: 0 }}
                      ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                    >
                      {item.description}
                    </Paragraph>
                  </Col>
                )}
              </Row>
            </Card>
          ))}

          {/* 餐厅信息 */}
          {day.restaurantName && (
            <Card type="inner" style={{ marginTop: 16 }}>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Text strong style={{ fontSize: 16 }}>
                    🍽️ {day.restaurantName}
                  </Text>
                  {day.restaurantRating && (
                    <Tag color="gold" style={{ marginLeft: 8 }}>
                      ⭐ {day.restaurantRating}
                    </Tag>
                  )}
                </Col>
                {day.restaurantAddress && (
                  <Col span={24}>
                    <Text type="secondary">
                      <EnvironmentOutlined style={{ marginRight: 8 }} />
                      {day.restaurantAddress}
                    </Text>
                  </Col>
                )}
                {day.restaurantType && (
                  <Col span={24}>
                    <Tag>{day.restaurantType}</Tag>
                  </Col>
                )}
              </Row>
            </Card>
          )}
        </Card>
        </div>
      ))}

      {/* 预算汇总 */}
      {trip.budget && (
        <Card title="💰 预算汇总" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {trip.budget.transportation > 0 && (
              <Col span={12}>
                <Text>🚗 交通: ¥{trip.budget.transportation.toLocaleString()}</Text>
              </Col>
            )}
            {trip.budget.accommodation > 0 && (
              <Col span={12}>
                <Text>🏨 住宿: ¥{trip.budget.accommodation.toLocaleString()}</Text>
              </Col>
            )}
            {trip.budget.food > 0 && (
              <Col span={12}>
                <Text>🍽️ 餐饮: ¥{trip.budget.food.toLocaleString()}</Text>
              </Col>
            )}
            {trip.budget.tickets > 0 && (
              <Col span={12}>
                <Text>🎫 门票: ¥{trip.budget.tickets.toLocaleString()}</Text>
              </Col>
            )}
            {trip.budget.shopping > 0 && (
              <Col span={12}>
                <Text>🛍️ 购物: ¥{trip.budget.shopping.toLocaleString()}</Text>
              </Col>
            )}
            {trip.budget.other > 0 && (
              <Col span={12}>
                <Text>📦 其他: ¥{trip.budget.other.toLocaleString()}</Text>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default SharedTrip;

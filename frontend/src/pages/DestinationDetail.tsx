/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：页面重构
 */
﻿import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Rate,
  Tag,
  Spin,
  Row,
  Col,
  Select,
  Space,
  message,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  FireOutlined,
  CalendarOutlined,
  DollarOutlined,
  StarOutlined,
} from '@ant-design/icons';
import DestinationAttractionCard from '../components/spot/DestinationAttractionCard';
import ReviewList from '../components/review/ReviewList';
import type { DestinationDetail, Attraction } from '../types/destination';
import { destinationsData } from '../data/destinationsData';
import { getFavorites, addFavorite, removeFavorite, checkFavorite, syncSpot } from '../api/client';

const { Title, Paragraph, Text } = Typography;

export default function DestinationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);

  useEffect(() => {
    // 加载目的地数据
    const loadData = async () => {
      setLoading(true);
      try {
        if (id && destinationsData[id]) {
          // 使用硬编码的数据作为基础
          const baseDestination = destinationsData[id];

          // 从后端API获取热门景点列表
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/destinations/${baseDestination.name}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              console.log(`✅ 从后端API获取到 ${data.data.length} 个热门景点`);

              // 将API返回的景点数据转换为前端格式
              const attractions: Attraction[] = data.data.map((item: any) => ({
                id: item.id || `api-${Date.now()}-${Math.random()}`,
                spotId: item.id, // 保存spotId用于收藏判断
                name: item.name,
                image: item.image || '', // 使用API返回的图片URL
                rating: item.rating || 4.5,
                description: item.description || item.type || '热门景点',
                openTime: item.openTime || '全天开放', // 使用API返回的开放时间
                ticketPrice: item.ticketPrice || (item.cost ? parseInt(item.cost) : 0),
                category: item.category || item.type || '景点',
                location: item.location, // 保留真实坐标
              }));

              // 更新目的地数据
              setDestination({
                ...baseDestination,
                attractions,
              });
            } else {
              // API调用失败，使用硬编码数据
              console.warn('⚠️  API调用失败，使用硬编码数据');
              setDestination(baseDestination);
            }
          } else {
            // API调用失败，使用硬编码数据
            console.warn('⚠️  API调用失败，使用硬编码数据');
            setDestination(baseDestination);
          }
        } else {
          setDestination(null);
        }
      } catch (error) {
        console.error('❌ 加载目的地数据失败:', error);
        // 出错时使用硬编码数据
        if (id && destinationsData[id]) {
          setDestination(destinationsData[id]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // 加载收藏数据（从后端数据库）
    loadFavoritesFromBackend();
  }, [id]);

  // 从后端数据库加载收藏数据
  const loadFavoritesFromBackend = async () => {
    try {
      const response = await getFavorites(true);
      if (response.success && response.data) {
        console.log('✅ 收藏数据加载成功:', response.data);
        setFavorites(response.data);
      }
    } catch (error) {
      console.error('❌ 加载收藏失败:', error);
      // 不显示错误提示，避免干扰用户
    }
  };

  // 切换收藏状态（使用后端数据库）
  const handleToggleFavorite = async (attraction: Attraction) => {
    try {
      const spotId = (attraction as any).spotId;

      if (!spotId) {
        message.error('景点ID缺失，无法收藏');
        return;
      }

      // 检查是否已收藏
      const isFavorited = favorites.some((fav: any) => fav.spotId === spotId);

      if (isFavorited) {
        // 取消收藏
        await removeFavorite(spotId);
        message.success('已取消收藏');
      } else {
        // 添加收藏
        await addFavorite(spotId, attraction.description);
        message.success('收藏成功');
      }

      // 重新加载收藏数据
      await loadFavoritesFromBackend();

      // 触发收藏更新事件，通知Navbar更新收藏数量
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error: any) {
      console.error('❌ 切换收藏失败:', error);
      message.error(error.message || '收藏操作失败，请检查后端服务是否启动');
    }
  };

  // 将景点信息同步到后端数据库
  const syncAttractionToBackend = async (attraction: Attraction): Promise<string> => {
    try {
      const cityName = destination?.name || '未知';

      console.log(`🔄 同步景点到后端: ${attraction.name}, ${cityName}`);

      // 使用景点数据中的真实坐标（如果有）
      const location = (attraction as any).location || '0,0';

      // 调用后端API同步景点
      const response = await syncSpot({
        name: attraction.name,
        city: cityName,
        category: attraction.category,
        ticketPrice: attraction.ticketPrice,
        openTime: attraction.openTime,
        rating: attraction.rating,
        description: attraction.description,
        isOutdoor: true, // 默认为户外景点
        location: location, // 使用真实坐标
      });

      if (response.success && response.data) {
        console.log(`✅ 景点同步成功: ${response.data.id}`);
        return response.data.id;
      } else {
        throw new Error(response.error || '同步失败');
      }
    } catch (error: any) {
      console.error('❌ 同步景点到后端失败:', error);
      throw new Error(error.message || '同步失败，请检查后端服务是否启动');
    }
  };

  // 智能规划行程
  const handlePlanTrip = () => {
    if (destination) {
      navigate('/plan', {
        state: {
          destination: destination.name,
          days: destination.days,
        },
      });
    }
  };

  // 过滤景点
  const getFilteredAttractions = (): Attraction[] => {
    if (!destination) return [];

    if (filter === 'all') {
      return destination.attractions;
    }

    return destination.attractions.filter((attr) => attr.category === filter);
  };

  // 获取所有分类
  const getCategories = (): string[] => {
    if (!destination) return [];

    const categories = new Set(destination.attractions.map((attr) => attr.category));
    return Array.from(categories);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f7fa',
        }}
      >
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!destination) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f7fa',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>未找到目的地信息</Title>
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const filteredAttractions = getFilteredAttractions();
  const categories = getCategories();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* 顶部概览区 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '60px 48px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景装饰 */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '600px',
            height: '600px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          {/* 返回按钮 */}
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              color: '#fff',
              marginBottom: '24px',
              fontSize: '16px',
            }}
          >
            返回
          </Button>

          {/* 目的地图标和名称 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div
              style={{
                fontSize: '80px',
                background: 'rgba(255, 255, 255, 0.2)',
                width: '120px',
                height: '120px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {destination.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
              >
                <Title level={1} style={{ color: '#fff', margin: 0, fontSize: '48px' }}>
                  {destination.name}
                </Title>
                <Tag
                  icon={<FireOutlined />}
                  color="red"
                  style={{
                    background: 'rgba(255, 77, 79, 0.2)',
                    border: '1px solid rgba(255, 77, 79, 0.5)',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '4px 12px',
                  }}
                >
                  热门
                </Tag>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}
              >
                <Rate disabled value={destination.rating} style={{ fontSize: '20px' }} />
                <Text style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>
                  {destination.rating.toFixed(1)}
                </Text>
              </div>

              <Paragraph
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: 0,
                  maxWidth: '800px',
                }}
              >
                {destination.description}
              </Paragraph>
            </div>
          </div>

          {/* 关键标签 */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              marginTop: '32px',
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>最佳旅游季节</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{destination.bestSeason}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>推荐游玩天数</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{destination.days} 天</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>人均预算</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>¥{destination.budget}</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '16px 24px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>用户评分</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>
                    {destination.rating.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 标签 */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {destination.tags.map((tag, index) => (
              <Tag
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '6px 16px',
                  borderRadius: '16px',
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      {/* 景点推荐区 */}
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, color: '#333' }}>
              必去景点推荐
            </Title>
            <Text style={{ fontSize: '16px', color: '#666' }}>
              共 {filteredAttractions.length} 个景点
            </Text>
          </div>

          {/* 分类筛选 */}
          <Space>
            <Select
              value={filter}
              onChange={setFilter}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: '全部景点' },
                ...categories.map((cat) => ({ value: cat, label: cat })),
              ]}
            />
          </Space>
        </div>

        {/* 景点列表 - 固定3x3布局 */}
        <Row gutter={[24, 24]}>
          {filteredAttractions.map((attraction) => {
            // 检查是否已收藏（通过spotId匹配）
            const isFavorited = favorites.some(
              (fav: any) => fav.spotId === (attraction as any).spotId
            );

            return (
              <Col span={8} key={attraction.id}>
                <DestinationAttractionCard
                  attraction={attraction}
                  isFavorite={isFavorited}
                  onToggleFavorite={handleToggleFavorite}
                />
              </Col>
            );
          })}
        </Row>
      </div>

      {/* 评价区域 */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px' }}>
        <Divider />
        <div style={{ marginBottom: '24px' }}>
          <Title level={3} style={{ marginBottom: '16px' }}>
            景点评价
          </Title>
          <Select
            placeholder="选择景点查看评价"
            style={{ width: 300 }}
            value={selectedAttraction?.id}
            onChange={(value) => {
              const attraction = destination?.attractions.find((a) => a.id === value);
              setSelectedAttraction(attraction || null);
            }}
            options={
              destination?.attractions.map((a) => ({
                label: a.name,
                value: a.id,
              })) || []
            }
          />
        </div>

        {selectedAttraction ? (
          <ReviewList spotId={selectedAttraction.id} spotName={selectedAttraction.name} />
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              background: '#f5f5f5',
              borderRadius: '8px',
              color: '#999',
            }}
          >
            请选择一个景点查看和提交评价
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#fff',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.1)',
          padding: '20px 48px',
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            onClick={handlePlanTrip}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 600,
              padding: '12px 48px',
              height: 'auto',
            }}
          >
            🎯 智能规划行程
          </Button>
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#999' }}>
            自动填充出发地和目的地，一键生成专属行程
          </div>
        </div>
      </div>
    </div>
  );
}

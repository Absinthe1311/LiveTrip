import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Rate, Tag, Spin, Row, Col, Select, Space } from 'antd';
import { ArrowLeftOutlined, FireOutlined, CalendarOutlined, DollarOutlined, StarOutlined } from '@ant-design/icons';
import DestinationAttractionCard from '../components/DestinationAttractionCard';
import type { DestinationDetail, Attraction } from '../types/destination';
import { destinationsData } from '../data/destinationsData';

const { Title, Paragraph, Text } = Typography;

export default function DestinationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // 加载目的地数据
    const loadData = () => {
      setLoading(true);
      // 模拟网络延迟
      setTimeout(() => {
        if (id && destinationsData[id]) {
          setDestination(destinationsData[id]);
        }
        setLoading(false);
      }, 500);
    };

    loadData();
  }, [id]);

  // 从localStorage加载收藏数据
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteAttractions');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // 保存收藏到localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem('favoriteAttractions', JSON.stringify(Array.from(newFavorites)));
  };

  // 切换收藏状态
  const handleToggleFavorite = (attractionId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(attractionId)) {
      newFavorites.delete(attractionId);
    } else {
      newFavorites.add(attractionId);
    }
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  // 智能规划行程
  const handlePlanTrip = () => {
    if (destination) {
      navigate('/plan', {
        state: {
          destination: destination.name,
          days: destination.days
        }
      });
    }
  };

  // 过滤景点
  const getFilteredAttractions = (): Attraction[] => {
    if (!destination) return [];

    if (filter === 'all') {
      return destination.attractions;
    }

    return destination.attractions.filter(attr => attr.category === filter);
  };

  // 获取所有分类
  const getCategories = (): string[] => {
    if (!destination) return [];

    const categories = new Set(destination.attractions.map(attr => attr.category));
    return Array.from(categories);
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

  if (!destination) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fa'
      }}>
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
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 48px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          {/* 返回按钮 */}
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              color: '#fff',
              marginBottom: '24px',
              fontSize: '16px'
            }}
          >
            返回
          </Button>

          {/* 目的地图标和名称 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{
              fontSize: '80px',
              background: 'rgba(255, 255, 255, 0.2)',
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {destination.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
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
                    padding: '4px 12px'
                  }}
                >
                  热门
                </Tag>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <Rate disabled value={destination.rating} style={{ fontSize: '20px' }} />
                <Text style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>
                  {destination.rating.toFixed(1)}
                </Text>
              </div>

              <Paragraph style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: 0, maxWidth: '800px' }}>
                {destination.description}
              </Paragraph>
            </div>
          </div>

          {/* 关键标签 */}
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            marginTop: '32px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '16px 24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>最佳旅游季节</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{destination.bestSeason}</div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '16px 24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>推荐游玩天数</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{destination.days} 天</div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '16px 24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>人均预算</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>¥{destination.budget}</div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '16px 24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarOutlined style={{ fontSize: '20px' }} />
                <div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>用户评分</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{destination.rating.toFixed(1)}</div>
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
                  borderRadius: '16px'
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
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
                ...categories.map(cat => ({ value: cat, label: cat }))
              ]}
            />
          </Space>
        </div>

        {/* 景点列表 */}
        <Row gutter={[24, 24]}>
          {filteredAttractions.map((attraction) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={attraction.id}>
              <DestinationAttractionCard
                attraction={attraction}
                isFavorite={favorites.has(attraction.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            </Col>
          ))}
        </Row>
      </div>

      {/* 底部操作区 */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#fff',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.1)',
        padding: '20px 48px',
        zIndex: 100
      }}>
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
              height: 'auto'
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

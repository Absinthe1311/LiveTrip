import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Empty, Spin, message, Typography, Tag, Rate, Button } from 'antd';
import { HeartFilled, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { destinationsData } from '../data/destinationsData';
import type { Attraction } from '../types/destination';

const { Title } = Typography;

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteAttractions, setFavoriteAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  // 从localStorage加载收藏数据
  const loadFavorites = () => {
    setLoading(true);
    try {
      const savedFavorites = localStorage.getItem('favoriteAttractions');
      console.log('📦 localStorage中的收藏数据:', savedFavorites);
      console.log('📦 数据类型:', typeof savedFavorites);

      if (savedFavorites) {
        const favoriteIds = new Set(JSON.parse(savedFavorites));
        console.log('🔍 收藏的景点ID:', Array.from(favoriteIds));
        console.log('🔍 收藏的景点ID数量:', favoriteIds.size);
        setFavorites(favoriteIds);

        // 根据收藏的ID获取景点详情
        const attractions: Attraction[] = [];
        let totalDestinations = 0;
        let totalAttractions = 0;

        Object.values(destinationsData).forEach(destination => {
          totalDestinations++;
          destination.attractions.forEach(attraction => {
            totalAttractions++;
            if (favoriteIds.has(attraction.id)) {
              attractions.push({
                ...attraction,
                cityName: destination.name // 添加城市名称
              });
            }
          });
        });

        console.log('🗺️ 总目的地数量:', totalDestinations);
        console.log('🏛️ 总景点数量:', totalAttractions);
        console.log('✅ 找到的收藏景点:', attractions);
        console.log('📊 收藏景点数量:', attractions.length);
        setFavoriteAttractions(attractions);
      } else {
        console.log('⚠️ localStorage中没有收藏数据');
        setFavoriteAttractions([]);
      }
    } catch (error) {
      console.error('❌ 加载收藏失败:', error);
      message.error('加载收藏失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消收藏
  const handleRemoveFavorite = (attractionId: string) => {
    const newFavorites = new Set(favorites);
    newFavorites.delete(attractionId);
    setFavorites(newFavorites);

    // 更新localStorage
    localStorage.setItem('favoriteAttractions', JSON.stringify(Array.from(newFavorites)));

    // 更新显示的景点列表
    setFavoriteAttractions(prev => prev.filter(attr => attr.id !== attractionId));

    message.success('已取消收藏');
  };

  // 查看目的地详情
  const handleViewDestination = (destinationId: string) => {
    navigate(`/destination/${destinationId}`);
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
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 页面头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              style={{ marginBottom: '16px' }}
            >
              返回
            </Button>
            <Title level={2} style={{ margin: 0, color: '#333' }}>
              <HeartFilled style={{ color: '#ff4d4f', marginRight: '8px' }} />
              我的收藏
            </Title>
            <p style={{ color: '#666', marginTop: '8px', margin: 0 }}>
              共 {favoriteAttractions.length} 个收藏景点
            </p>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadFavorites}
            loading={loading}
          >
            刷新
          </Button>
        </div>

        {/* 收藏列表 */}
        {favoriteAttractions.length === 0 ? (
          <Card>
            <Empty
              description="暂无收藏景点"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={() => navigate('/')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                去探索热门目的地
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {favoriteAttractions.map((attraction) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={attraction.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    overflow: 'hidden'
                  }}
                  bodyStyle={{
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* 景点图片区域 */}
                  <div style={{
                    height: '200px',
                    background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px',
                    position: 'relative'
                  }}>
                    <span>🏛️</span>

                    {/* 城市标签 */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px'
                    }}>
                      <Tag color="blue">{(attraction as any).cityName}</Tag>
                    </div>

                    {/* 取消收藏按钮 */}
                    <Button
                      type="text"
                      icon={<HeartFilled />}
                      onClick={() => handleRemoveFavorite(attraction.id)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255, 77, 79, 0.1)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff4d4f',
                        fontSize: '18px'
                      }}
                      title="取消收藏"
                    />
                  </div>

                  {/* 景点信息 */}
                  <div style={{
                    padding: '20px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: '#333'
                    }}>
                      {attraction.name}
                    </h3>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Rate disabled value={attraction.rating} style={{ fontSize: '14px' }} />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {attraction.rating.toFixed(1)}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '12px',
                      lineHeight: '1.5',
                      flex: 1
                    }}>
                      {attraction.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <div>开放时间: {attraction.openTime}</div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ff4d4f'
                      }}>
                        {attraction.ticketPrice === 0 ? '免费' : `¥${attraction.ticketPrice}`}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

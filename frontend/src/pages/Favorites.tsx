import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Empty, Spin, message, Typography, Tag, Rate, Button } from 'antd';
import { HeartFilled, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { getFavorites, removeFavorite } from '../api/client';

const { Title } = Typography;

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  // 从后端API加载收藏数据
  const loadFavorites = async () => {
    setLoading(true);
    try {
      console.log('📦 从后端API加载收藏数据...');
      const response = await getFavorites(true); // 包含IoT数据

      if (response.success && response.data) {
        console.log('✅ 收藏数据加载成功:', response.data);
        console.log('📊 收藏数量:', response.data.length);
        setFavorites(response.data);
      } else {
        console.log('⚠️ 后端返回失败:', response);
        setFavorites([]);
      }
    } catch (error) {
      console.error('❌ 加载收藏失败:', error);
      message.error('加载收藏失败，请检查后端服务是否启动');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // 取消收藏
  const handleRemoveFavorite = async (spotId: string) => {
    try {
      const response = await removeFavorite(spotId);
      if (response.success) {
        message.success('已取消收藏');
        // 重新加载收藏列表
        await loadFavorites();

        // 触发收藏更新事件，通知Navbar更新收藏数量
        window.dispatchEvent(new Event('favoritesUpdated'));
      } else {
        message.error(response.error || '取消收藏失败');
      }
    } catch (error) {
      console.error('❌ 取消收藏失败:', error);
      message.error('取消收藏失败');
    }
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
              共 {favorites.length} 个收藏景点
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
        {favorites.length === 0 ? (
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
            {favorites.map((favorite) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={favorite.id}>
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
                      <Tag color="blue">{favorite.spot.city}</Tag>
                    </div>

                    {/* 取消收藏按钮 */}
                    <Button
                      type="text"
                      icon={<HeartFilled />}
                      onClick={() => handleRemoveFavorite(favorite.spotId)}
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
                      {favorite.spot.name}
                    </h3>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Rate disabled value={favorite.spot.rating || 4.5} style={{ fontSize: '14px' }} />
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {(favorite.spot.rating || 4.5).toFixed(1)}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '12px',
                      lineHeight: '1.5',
                      flex: 1
                    }}>
                      {favorite.spot.description || '暂无描述'}
                    </p>

                    {/* IoT数据显示 */}
                    {favorite.spot.iotData && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '12px'
                      }}>
                        <Tag color={favorite.spot.iotData.rainProbability > 50 ? 'orange' : 'green'}>
                          🌡️ {favorite.spot.iotData.temperature}°C
                        </Tag>
                        <Tag color={favorite.spot.iotData.crowdLevel > 60 ? 'orange' : 'green'}>
                          👥 人流{favorite.spot.iotData.crowdLevel > 60 ? '较多' : '较少'}
                        </Tag>
                        <Tag color={favorite.spot.iotData.isOpen ? 'green' : 'red'}>
                          {favorite.spot.iotData.isOpen ? '🔓 开放' : '🔒 关闭'}
                        </Tag>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <div>开放时间: {favorite.spot.openTime || '全天'}</div>
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ff4d4f'
                      }}>
                        {favorite.spot.ticketPrice === 0 ? '免费' : `¥${favorite.spot.ticketPrice}`}
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

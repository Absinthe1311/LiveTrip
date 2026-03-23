import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Rate, Spin, Empty } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface HotCity {
  city: string;
  count: number;
  avgRating: number;
  spots: HotSpot[];
}

interface HotSpot {
  id: string;
  name: string;
  city: string;
  rating: number;
  description: string;
  category: string;
  ticketPrice: number;
}

interface Destination {
  id: string;
  name: string;
  icon: string;
  days: number;
  budget: number;
  bestSeason: string;
  rating: number;
  description: string;
}

// 城市图标映射
const cityIcons: Record<string, string> = {
  '北京市': '🏛️',
  '上海市': '🌃',
  '成都市': '🐼',
  '杭州市': '🏞️',
  '厦门市': '🌊',
  '西安市': '🏔️',
  '武汉市': '🌸',
  '三亚': '🏖️',
};

// 城市推荐天数映射
const cityDays: Record<string, number> = {
  '北京市': 3,
  '上海市': 2,
  '成都市': 4,
  '杭州市': 3,
  '厦门市': 2,
  '西安市': 4,
  '武汉市': 3,
  '三亚': 3,
};

// 城市预算映射
const cityBudget: Record<string, number> = {
  '北京市': 2000,
  '上海市': 1800,
  '成都市': 2200,
  '杭州市': 1900,
  '厦门市': 1700,
  '西安市': 2100,
  '武汉市': 1800,
  '三亚': 2500,
};

// 城市推荐季节映射
const cityBestSeason: Record<string, string> = {
  '北京市': '春秋',
  '上海市': '全年',
  '成都市': '春秋',
  '杭州市': '春秋',
  '厦门市': '春秋',
  '西安市': '春秋',
  '武汉市': '春秋',
  '三亚': '冬春',
};

interface DestinationCardProps {
  destination: Destination;
  delay: number;
  onClick: () => void;
}

function DestinationCard({ destination, delay, onClick }: DestinationCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        overflow: 'hidden'
      }}
      bodyStyle={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* 目的地图标/图片区域 */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px',
        position: 'relative'
      }}>
        {destination.icon}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#ff4d4f',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <FireOutlined />
          热门
        </div>
      </div>

      {/* 目的地信息 */}
      <div style={{
        padding: '24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          fontSize: '22px',
          fontWeight: 600,
          marginBottom: '12px',
          color: '#333'
        }}>
          {destination.name}
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Rate disabled value={destination.rating} style={{ fontSize: '14px' }} />
          <span style={{ fontSize: '14px', color: '#666' }}>
            {destination.rating.toFixed(1)}
          </span>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '16px',
          lineHeight: '1.6',
          flex: 1
        }}>
          {destination.description}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px',
          background: '#f5f7fa',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              游玩天数
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
              {destination.days}天
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              人均预算
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
              ¥{destination.budget}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
              推荐季节
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
              {destination.bestSeason}
            </div>
          </div>
        </div>

        <Button
          type="primary"
          block
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            height: '40px',
            fontWeight: 600
          }}
        >
          查看详情
        </Button>
      </div>
    </Card>
  );
}

export default function PopularDestinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotCities();
  }, []);

  const loadHotCities = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';
      const response = await fetch(`${apiBaseUrl}/hot-spots/cities`);

      if (!response.ok) {
        throw new Error('获取热门城市失败');
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log('🎉 热门城市数据:', result.data);

        // 转换为Destination格式
        const formattedDestinations: Destination[] = result.data.map((city: HotCity, index: number) => ({
          id: `city_${index}`,
          name: city.city.replace('市', ''), // 移除"市"后缀
          icon: cityIcons[city.city] || '🏙️',
          days: cityDays[city.city] || 3,
          budget: cityBudget[city.city] || 2000,
          bestSeason: cityBestSeason[city.city] || '全年',
          rating: city.avgRating || 4.5,
          description: `${city.city}热门景点，共${city.count}个精选景点等你探索`,
        }));

        setDestinations(formattedDestinations);
      } else {
        console.warn('⚠️ 后端返回的数据格式不正确:', result);
        throw new Error('数据格式不正确');
      }
    } catch (error) {
      console.error('❌ 加载热门城市失败:', error);
      // 使用默认数据作为降级方案
      console.log('🔄 使用默认数据作为降级方案');
      setDestinations([
        { id: '1', name: '北京', icon: '🏛️', days: 3, budget: 2000, bestSeason: '春秋', rating: 4.8, description: '探索千年古都，感受历史文化的魅力' },
        { id: '2', name: '上海', icon: '🌃', days: 2, budget: 1800, bestSeason: '全年', rating: 4.7, description: '现代化国际大都市，外滩夜景令人陶醉' },
        { id: '3', name: '成都', icon: '🐼', days: 4, budget: 2200, bestSeason: '春秋', rating: 4.9, description: '天府之国，美食之都' },
        { id: '4', name: '杭州', icon: '🏞️', days: 3, budget: 1900, bestSeason: '春秋', rating: 4.8, description: '人间天堂，西湖美景' },
        { id: '5', name: '厦门', icon: '🌊', days: 2, budget: 1700, bestSeason: '春秋', rating: 4.7, description: '海上花园，浪漫之都' },
        { id: '6', name: '西安', icon: '🏔️', days: 4, budget: 2100, bestSeason: '春秋', rating: 4.8, description: '十三朝古都，丝绸之路起点' },
        { id: '7', name: '武汉', icon: '🌸', days: 3, budget: 1800, bestSeason: '春秋', rating: 4.6, description: '江城武汉，樱花之城' },
        { id: '8', name: '三亚', icon: '🏖️', days: 3, budget: 2500, bestSeason: '冬春', rating: 4.7, description: '热带天堂，椰风海韵' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationClick = (destination: Destination) => {
    // 跳转到目的地详情页
    navigate(`/destination/${destination.id}`);
  };

  if (loading) {
    return (
      <div style={{
        padding: '100px 48px',
        background: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" tip="加载热门目的地..." />
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div style={{
        padding: '100px 48px',
        background: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Empty description="暂无热门目的地" />
      </div>
    );
  }

  return (
    <div style={{
      padding: '100px 48px',
      background: '#f5f7fa'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '64px'
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '16px',
          color: '#333'
        }}>
          热门目的地
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#666',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          精选热门旅游目的地，为您提供快速规划模板
        </p>
      </div>

      <Row gutter={[32, 32]}>
        {destinations.map((destination, index) => (
          <Col xs={24} sm={12} lg={8} key={destination.id}>
            <DestinationCard
              destination={destination}
              delay={index * 150}
              onClick={() => handleDestinationClick(destination)}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}

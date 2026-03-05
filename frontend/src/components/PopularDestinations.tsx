import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Rate } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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

  const destinations: Destination[] = [
    {
      id: '1',
      name: '北京',
      icon: '🏛️',
      days: 3,
      budget: 2000,
      bestSeason: '春秋',
      rating: 4.8,
      description: '探索千年古都，感受历史文化的魅力。故宫、长城、天坛，每一个景点都承载着厚重的历史。'
    },
    {
      id: '2',
      name: '上海',
      icon: '🌃',
      days: 2,
      budget: 1800,
      bestSeason: '全年',
      rating: 4.7,
      description: '现代化国际大都市，外滩夜景令人陶醉。迪士尼乐园、豫园、南京路，体验都市繁华。'
    },
    {
      id: '3',
      name: '成都',
      icon: '🐼',
      days: 4,
      budget: 2200,
      bestSeason: '春秋',
      rating: 4.9,
      description: '天府之国，美食之都。看大熊猫、品川菜、逛宽窄巷子，享受悠闲慢生活。'
    },
    {
      id: '4',
      name: '杭州',
      icon: '🏞️',
      days: 3,
      budget: 1900,
      bestSeason: '春秋',
      rating: 4.8,
      description: '人间天堂，西湖美景。断桥残雪、雷峰夕照，诗情画意的美景让人流连忘返。'
    },
    {
      id: '5',
      name: '厦门',
      icon: '🌊',
      days: 2,
      budget: 1700,
      bestSeason: '春秋',
      rating: 4.7,
      description: '海上花园，浪漫之都。鼓浪屿、曾厝垵、环岛路，感受海风拂面的惬意。'
    },
    {
      id: '6',
      name: '西安',
      icon: '🏔️',
      days: 4,
      budget: 2100,
      bestSeason: '春秋',
      rating: 4.8,
      description: '十三朝古都，丝绸之路起点。兵马俑、大雁塔、回民街，穿越千年历史。'
    }
  ];

  const handleDestinationClick = (destination: Destination) => {
    // 跳转到目的地详情页
    navigate(`/destination/${destination.id}`);
  };

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

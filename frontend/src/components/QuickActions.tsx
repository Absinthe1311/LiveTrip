import { useState, useEffect } from 'react';
import { Card, Row, Col, Badge } from 'antd';
import { FileTextOutlined, UnorderedListOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  delay: number;
  badge?: string | number;
  disabled?: boolean;
}

function ActionCard({ icon, title, subtitle, onClick, delay, badge, disabled }: ActionCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card
      hoverable={!disabled}
      style={{
        height: '100%',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#f5f5f5' : '#fff'
      }}
      bodyStyle={{
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
    >
      <Badge count={badge} offset={[-10, 10]}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          opacity: disabled ? 0.5 : 1
        }}>
          {icon}
        </div>
      </Badge>
      <h3 style={{
        fontSize: '22px',
        fontWeight: 600,
        marginBottom: '8px',
        color: disabled ? '#999' : '#333'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '16px',
        color: disabled ? '#bbb' : '#666',
        marginBottom: 0
      }}>
        {subtitle}
      </p>
    </Card>
  );
}

export default function QuickActions() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tripCount, setTripCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    // 检查用户是否已登录
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);

    // 这里可以添加获取行程数量和收藏数量的逻辑
    // 暂时使用模拟数据
    if (user) {
      setTripCount(3); // 模拟数据
      setFavoriteCount(12); // 模拟数据
    }
  }, []);

  const actions = [
    {
      icon: <FileTextOutlined />,
      title: '创建新行程',
      subtitle: '快速开始规划',
      onClick: () => navigate('/plan'),
      delay: 0
    },
    {
      icon: <UnorderedListOutlined />,
      title: '我的行程',
      subtitle: isLoggedIn ? `${tripCount} 个行程` : '查看历史行程',
      onClick: () => isLoggedIn ? navigate('/itinerary') : navigate('/auth'),
      delay: 200,
      badge: isLoggedIn ? tripCount : undefined
    },
    {
      icon: <StarOutlined />,
      title: '收藏夹',
      subtitle: isLoggedIn ? `${favoriteCount} 个景点` : '收藏的景点',
      onClick: () => isLoggedIn ? navigate('/favorites') : navigate('/auth'),
      delay: 400,
      badge: isLoggedIn ? favoriteCount : undefined
    }
  ];

  return (
    <div style={{
      padding: '80px 48px',
      background: '#fff'
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
          快速操作
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#666',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          快速访问常用功能，提高操作效率
        </p>
      </div>

      <Row gutter={[32, 32]}>
        {actions.map((action, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <ActionCard {...action} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

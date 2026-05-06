import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ThunderboltOutlined, SyncOutlined, AimOutlined } from '@ant-design/icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  techHighlights: string[];
  delay: number;
}

function FeatureCard({ icon, title, description, techHighlights, delay }: FeatureCardProps) {
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
        border: '2px solid transparent'
      }}
      bodyStyle={{
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        e.currentTarget.style.borderColor = '#667eea';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{
        fontSize: '64px',
        marginBottom: '24px',
        animation: 'pulse 2s infinite'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '24px',
        fontWeight: 600,
        marginBottom: '16px',
        color: '#333'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '16px',
        color: '#666',
        marginBottom: '24px',
        lineHeight: '1.6'
      }}>
        {description}
      </p>
      <div style={{
        marginTop: 'auto',
        width: '100%'
      }}>
        {techHighlights.map((highlight, index) => (
          <div
            key={index}
            style={{
              fontSize: '14px',
              color: '#999',
              marginBottom: '8px',
              padding: '8px 12px',
              background: '#f5f5f5',
              borderRadius: '6px'
            }}
          >
            {highlight}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function CoreFeatures() {
  const features = [
    {
      icon: <ThunderboltOutlined />,
      title: '一键生成行程',
      description: '输入目的地和天数，AI 自动为您生成完整行程',
      techHighlights: ['AI 智能算法', '大数据分析', '个性化推荐'],
      delay: 0
    },
    {
      icon: <SyncOutlined />,
      title: '智能实时调整',
      description: '基于实时人流、天气数据，自动调整行程安排',
      techHighlights: ['IoT 实时数据', '智能决策算法', '动态调整机制'],
      delay: 200
    },
    {
      icon: <AimOutlined />,
      title: '个性化定制',
      description: '根据您的喜好、预算、时间，定制专属行程',
      techHighlights: ['用户画像分析', '偏好学习算法', '推荐优化引擎'],
      delay: 400
    }
  ];

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
          核心特色
        </h2>
        <p style={{
          fontSize: '18px',
          color: '#666',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          让旅行更智能、更便捷、更个性化
        </p>
      </div>

      <Row gutter={[32, 32]}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <FeatureCard {...feature} />
          </Col>
        ))}
      </Row>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

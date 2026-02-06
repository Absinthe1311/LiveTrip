import { Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  showBackButton = true
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '40px 48px',
        borderRadius: '0 0 20px 20px',
        marginBottom: '24px',
        position: 'relative'
      }}
    >
      {showBackButton && (
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <ArrowLeftOutlined />
        </button>
      )}
      
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '12px',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '18px',
              opacity: 0.95,
              margin: 0
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// 首页 - 显示"智能旅行规划"
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '24px'
    }}>
      <h1 style={{
        fontSize: '48px',
        fontWeight: 700,
        marginBottom: '16px',
        textShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        智能旅行规划
      </h1>
      <p style={{
        fontSize: '18px',
        marginBottom: '32px',
        opacity: 0.9,
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        基于人工智能和物联网技术的智能行程规划系统
      </p>
      <Button
        type="primary"
        size="large"
        onClick={() => navigate('/plan')}
        style={{
          fontSize: '18px',
          height: '50px',
          padding: '0 40px',
          borderRadius: '25px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}
      >
        开始规划
      </Button>
    </div>
  );
}

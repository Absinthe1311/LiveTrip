// 首页 - 显示"智能旅行规划"
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查用户是否已登录
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const handleStart = () => {
    if (isLoggedIn) {
      navigate('/plan');
    } else {
      navigate('/auth');
    }
  };

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
      <Space size="middle">
        <Button
          type="primary"
          size="large"
          onClick={handleStart}
          style={{
            fontSize: '18px',
            height: '50px',
            padding: '0 40px',
            borderRadius: '25px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          {isLoggedIn ? '开始规划' : '登录/注册'}
        </Button>
        {isLoggedIn && (
          <Button
            size="large"
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setIsLoggedIn(false);
              window.location.reload();
            }}
            style={{
              fontSize: '18px',
              height: '50px',
              padding: '0 40px',
              borderRadius: '25px',
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.4)',
              color: '#fff'
            }}
          >
            退出登录
          </Button>
        )}
      </Space>
    </div>
  );
}

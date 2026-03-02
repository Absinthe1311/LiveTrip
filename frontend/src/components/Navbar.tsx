import { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFavorites } from '../api/client';

const { Header } = Layout;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    // 检查用户是否已登录
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, [location]);

  // 加载收藏数量
  const loadFavoritesCount = async () => {
    try {
      const response = await getFavorites();
      console.log('🔍 Navbar 收藏响应:', response);
      console.log('🔍 Navbar 收藏数据:', response.data);
      console.log('🔍 Navbar 收藏数量:', response.count);
      console.log('🔍 Navbar 收藏数据长度:', response.data?.length);

      if (response.success) {
        // 优先使用 count 字段，如果没有则使用 data 数组长度
        const count = response.count !== undefined ? response.count : (response.data?.length || 0);
        setFavoritesCount(count);
      }
    } catch (error) {
      console.error('❌ 加载收藏数量失败:', error);
    }
  };

  useEffect(() => {
    // 加载收藏数量
    loadFavoritesCount();
  }, [location]);

  // 监听收藏数量更新事件
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      console.log('🔍 收到收藏更新事件，重新加载收藏数量');
      loadFavoritesCount();
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: 'home',
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: 'itinerary',
      label: '我的行程',
      onClick: () => navigate('/itinerary'),
    },
    {
      key: 'favorites',
      label: (
        <Badge count={favoritesCount} size="small" offset={[10, 0]}>
          <span>我的收藏</span>
        </Badge>
      ),
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'destinations',
      label: '热门目的地',
      onClick: () => navigate('/destinations'),
    },
    {
      key: 'help',
      label: '帮助',
      onClick: () => navigate('/help'),
    },
  ];

  return (
    <Header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: '64px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer'
      }} onClick={() => navigate('/')}>
        <span style={{
          fontSize: '24px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginRight: '8px'
        }}>
          🌍
        </span>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#333'
        }}>
          LiveTrip
        </span>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname === '/' ? 'home' : location.pathname.slice(1)]}
        items={menuItems}
        style={{
          flex: 1,
          justifyContent: 'center',
          border: 'none',
          background: 'transparent'
        }}
      />

      <div>
        {isLoggedIn && currentUser ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '20px',
              background: '#f5f5f5',
              transition: 'all 0.3s'
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
            >
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>
                {currentUser.username}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            onClick={() => navigate('/auth')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '20px',
              height: '36px',
              padding: '0 20px'
            }}
          >
            登录/注册
          </Button>
        )}
      </div>
    </Header>
  );
}

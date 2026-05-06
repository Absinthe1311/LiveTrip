import { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  PictureOutlined,
  SettingOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header } = Layout;

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 检查用户是否已登录
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/auth');
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
      key: 'back-to-user',
      icon: <HomeOutlined />,
      label: '返回用户界面',
      onClick: () => navigate('/'),
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
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      onClick: () => navigate('/admin'),
    },
    {
      key: 'spot-images',
      icon: <PictureOutlined />,
      label: '景点配图管理',
      onClick: () => navigate('/admin/spot-images'),
    },
  ];

  const getCurrentPath = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    if (path.startsWith('/admin/spot-images')) return 'spot-images';
    return '';
  };

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '64px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/admin')}
      >
        <span
          style={{
            fontSize: '24px',
            fontWeight: 700,
            marginRight: '8px',
          }}
        >
          🔧
        </span>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'white',
          }}
        >
          LiveTrip 管理后台
        </span>
      </div>

      <Menu
        mode="horizontal"
        selectedKeys={[getCurrentPath()]}
        items={menuItems}
        style={{
          flex: 1,
          justifyContent: 'center',
          border: 'none',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.85)',
        }}
      />

      <div>
        {currentUser ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')
              }
            >
              <Avatar size="small" icon={<UserOutlined />} style={{ background: 'white' }} />
              <span style={{ fontSize: '14px', color: 'white', fontWeight: 500 }}>
                {currentUser.username}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            onClick={() => navigate('/auth')}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '20px',
              height: '36px',
              padding: '0 20px',
            }}
          >
            登录
          </Button>
        )}
      </div>
    </Header>
  );
}

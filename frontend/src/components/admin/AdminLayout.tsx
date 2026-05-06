import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Button, Badge } from 'antd';
import {
  PictureOutlined,
  AuditOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getPendingImages } from '../../api/adminApi';

const { Sider, Header, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  // 加载待审核数量
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const response = await getPendingImages(1, 1);
        if (response.success && response.data) {
          setPendingCount(response.data.total || 0);
        }
      } catch (error) {
        console.error('加载待审核数量失败:', error);
      }
    };
    loadPendingCount();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const menuItems = [
    {
      key: '/admin/spots',
      icon: <PictureOutlined />,
      label: '景点图片管理',
    },
    {
      key: '/admin/review',
      icon: (
        <Badge count={pendingCount} size="small" offset={[6, 0]}>
          <AuditOutlined />
        </Badge>
      ),
      label: '审核待处理',
    },
  ];

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/admin/review')) {
      return '/admin/review';
    }
    return '/admin/spots';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="dark"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ fontSize: collapsed ? 20 : 24 }}>🔧</span>
          {!collapsed && (
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                marginLeft: 8,
              }}
            >
              管理后台
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {currentUser && (
              <>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ fontWeight: 500 }}>{currentUser.username}</span>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </>
            )}
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

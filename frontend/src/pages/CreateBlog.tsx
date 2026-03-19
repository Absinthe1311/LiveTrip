import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import BlogEditor from '../components/BlogEditor';
import Navbar from '../components/Navbar';

export default function CreateBlog() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // 从 localStorage 获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserId(user.id || user.userId || '');
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }

    // 如果没有用户信息，尝试从 userId 获取
    if (!userId) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, []);

  const handleSuccess = () => {
    navigate('/blogs');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingTop: '64px' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/blogs')}
          >
            返回博客列表
          </Button>
        </div>

        <Card
          title="创建新的旅行博客"
          style={{ maxWidth: 900, margin: '0 auto' }}
        >
          <BlogEditor
            visible={true}
            userId={userId}
            onCancel={() => navigate('/blogs')}
            onSuccess={handleSuccess}
          />
        </Card>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BlogDetail from '../components/BlogDetail';
import Navbar from '../components/Navbar';

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
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

  const handleBack = () => {
    navigate('/blogs');
  };

  const handleSuccess = () => {
    navigate('/blogs');
  };

  if (!id) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingTop: '64px' }}>
        <Navbar />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', textAlign: 'center' }}>
          <p>博客不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingTop: '64px' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        <BlogDetail
          postId={id}
          userId={userId}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}

// Blog创建页面 - 毛玻璃风格
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BlogEditorGlass from '../components/BlogEditorGlass';

export default function BlogCreateGlass() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('id');

  // 获取当前用户
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id || 'default-user';

  // 检查登录状态
  useEffect(() => {
    if (!user) {
      // 可以跳转到登录页面或显示提示
      console.warn('用户未登录');
    }
  }, [user]);

  return (
    <BlogEditorGlass
      postId={postId || undefined}
      userId={userId}
    />
  );
}

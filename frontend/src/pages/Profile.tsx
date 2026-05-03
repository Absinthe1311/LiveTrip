// 个人信息编辑页面
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Mail, Camera, Save, Loader, LogOut } from 'lucide-react';
import { Sidebar } from '../components/layout/SharedSidebar';
import { apiClient } from '../api/client';

export default function Profile() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 用户信息
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    } catch (err) {
      console.error('加载用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError('用户名不能为空');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.put(
        '/auth/profile',
        {
          username: username.trim(),
          email: email.trim(),
          avatar: avatar.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // 更新localStorage中的用户信息
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        setSuccess('保存成功！');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('保存失败:', err);
      setError(err.response?.data?.error || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 生成随机头像
  const generateAvatar = () => {
    const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}${Date.now()}`;
    setAvatar(randomAvatar);
  };

  return (
    <div className="min-h-screen bg-livetrip-background">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div className="w-[220px] h-full flex items-center px-4 border-r border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 ${isLargeScreen ? 'hidden' : 'block'}`}
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-bold text-livetrip-primary">LiveTrip</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">个人信息</h1>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLargeScreen={isLargeScreen}
        currentPage="/profile"
      />

      {/* Main Content */}
      <main className={`pt-14 ${isLargeScreen ? 'pl-[240px]' : ''} min-h-screen`}>
        <div className="max-w-2xl mx-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader className="h-8 w-8 animate-spin text-livetrip-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-border shadow-sm p-6 space-y-6">
              {/* 头像 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="头像"
                      className="w-20 h-20 rounded-full border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-livetrip-primary to-emerald-400 flex items-center justify-center text-white text-2xl font-medium">
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={generateAvatar}
                    className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-border hover:bg-gray-50 transition-colors"
                    title="生成随机头像"
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{username}</p>
                  <p className="text-sm text-gray-500">点击相机图标生成随机头像</p>
                </div>
              </div>

              {/* 用户名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                />
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                />
              </div>

              {/* 头像URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Camera className="inline h-4 w-4 mr-1" />
                  头像URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="请输入头像URL或点击生成"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 成功提示 */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}

              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-livetrip-primary text-white rounded-lg font-medium hover:bg-livetrip-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    保存修改
                  </>
                )}
              </button>

              {/* 退出登录按钮 */}
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  navigate('/auth');
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                退出登录
              </button>

              {/* 测试提示 */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-900 mb-2">💡 多账号测试提示</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• 使用隐身窗口测试不同账号（Ctrl+Shift+N）</li>
                  <li>• 或使用不同浏览器（Chrome、Firefox、Edge）</li>
                  <li>• 同一浏览器的所有窗口共享登录状态</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 登录注册页面 - 基于 V0 设计风格
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { App } from 'antd';

export default function Auth() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        username: formData.username,
        password: formData.password,
      });

      if (response.data.success) {
        const { user, token } = response.data.data;

        // 保存到 localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);

        message.success('登录成功！');

        // 根据角色跳转
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error('❌ 登录失败:', error);
      message.error(error.response?.data?.error || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      message.error('密码至少需要6个字符');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        const { user, token } = response.data.data;

        // 保存到 localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);

        message.success('注册成功！');

        // 根据角色跳转
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error('❌ 注册失败:', error);
      message.error(error.response?.data?.error || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-livetrip-primary to-emerald-600 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">✈️</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-serif font-bold text-white">LiveTrip</h1>
              <p className="text-xs text-white/80">AI · IoT · Travel</p>
            </div>
          </div>
          <p className="text-white/90 text-sm">
            {isLogin ? '欢迎回来，继续你的旅程' : '加入我们，开启智能旅行'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isLogin ? 'bg-white text-livetrip-primary shadow-sm' : 'text-gray-600'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isLogin ? 'bg-white text-livetrip-primary shadow-sm' : 'text-gray-600'
              }`}
            >
              注册
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="请输入用户名"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20 focus:border-livetrip-primary transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-600 mb-1.5 block">
                {isLogin ? '用户名 / 邮箱' : '邮箱'}
              </label>
              <input
                type={isLogin ? 'text' : 'email'}
                value={isLogin ? formData.username : formData.email}
                onChange={(e) => setFormData({ ...formData, [isLogin ? 'username' : 'email']: e.target.value })}
                placeholder={isLogin ? '请输入用户名或邮箱' : '请输入邮箱'}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20 focus:border-livetrip-primary transition-all"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1.5 block">密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入密码"
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20 focus:border-livetrip-primary transition-all"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">确认密码</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="请再次输入密码"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-livetrip-primary/20 focus:border-livetrip-primary transition-all"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300" />
                  记住我
                </label>
                <button type="button" className="text-livetrip-primary hover:underline">
                  忘记密码？
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-livetrip-primary text-white rounded-lg text-sm font-medium hover:bg-livetrip-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isLogin ? '登录中...' : '注册中...') : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">或</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social Login */}
          <div className="space-y-2">
            <button className="w-full h-10 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <span>📱</span>
              使用微信登录
            </button>
            <button className="w-full h-10 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <span>📧</span>
              使用邮箱登录
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-xs mt-6">
          登录即表示同意我们的
          <button className="text-white hover:underline mx-1">服务条款</button>
          和
          <button className="text-white hover:underline mx-1">隐私政策</button>
        </p>
      </div>
    </div>
  );
}

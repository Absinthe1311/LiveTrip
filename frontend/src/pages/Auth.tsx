/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：页面重构
 */

// 登录注册页面 - 基于 LoginPage 设计
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { App } from 'antd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side with flower wreath image */}
      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="/images/login-bg.png"
          alt="Flower wreath with sky view"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay text in the center - two lines stacked vertically */}
        <div className="relative z-10 text-center -mt-8 max-w-[280px] lg:max-w-[320px]">
          <p
            className="text-4xl lg:text-5xl font-semibold tracking-wide leading-snug"
            style={{
              fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
              color: '#F5F5F5',
              textShadow: '0px 4px 12px rgba(139, 69, 19, 0.8), 0px 0px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            Live to see,
            <br />
            Live to go.
          </p>
        </div>
      </div>

      {/* Right side with login form */}
      <div
        className="flex flex-col items-center justify-center p-8"
        style={{
          background: 'linear-gradient(135deg, #fef3e2 0%, #fde8d0 50%, #f9d5b7 100%)',
        }}
      >
        <div
          className="w-full max-w-md space-y-8"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            padding: '48px',
          }}
        >
          <div className="text-center">
            {/* LiveTrip Logo */}
            <div className="mb-6 flex justify-center">
              <img
                src="/images/login-logo.png"
                alt="LiveTrip Logo"
                width={220}
                height={73}
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl text-gray-600">欢迎来到 LiveTrip</h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex mb-6 bg-white/40 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-md text-base font-medium transition-all ${
                isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-md text-base font-medium transition-all ${
                !isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-base text-gray-600" htmlFor="username">
                  用户名
                </label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="请输入用户名"
                  className="w-full p-3 text-base border rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-base text-gray-600" htmlFor="email">
                {isLogin ? '用户名或邮箱' : '邮箱'}
              </label>
              <Input
                id="email"
                type={isLogin ? 'text' : 'email'}
                value={isLogin ? formData.username : formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, [isLogin ? 'username' : 'email']: e.target.value })
                }
                placeholder={isLogin ? '请输入用户名或邮箱' : '请输入邮箱'}
                className="w-full p-3 text-base border rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-base text-gray-600" htmlFor="password">
                密码
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入密码"
                className="w-full p-3 text-base border rounded-lg"
              />
              {isLogin && (
                <div className="text-right">
                  <button type="button" className="text-sm text-gray-500 hover:text-gray-700">
                    忘记密码?
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-base text-gray-600" htmlFor="confirmPassword">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="请再次输入密码"
                  className="w-full p-3 text-base border rounded-lg"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30"
            >
              {loading ? (isLogin ? '登录中...' : '注册中...') : isLogin ? '登录' : '注册'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              {isLogin ? (
                <>
                  还没有账号？{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    创建账号
                  </button>
                </>
              ) : (
                <>
                  已有账号？{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    去登录
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

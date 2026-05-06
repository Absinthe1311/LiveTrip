import axios from 'axios';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api',
  timeout: 60000, // 增加到60秒，避免分享行程加载超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 导出 apiClient 供其他模块复用
export { apiClient };

// 请求拦截器 - 添加 token 和 userId 到请求头
apiClient.interceptors.request.use(
  (config) => {
    // 添加 token 到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加 userId 到请求头 (用于权限验证)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['x-user-id'] = user.id;
        }
      } catch (e) {
        console.warn('解析用户信息失败:', e);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }

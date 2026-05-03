/**
 * API 配置文件
 * 统一管理所有 API 和 Socket 连接地址
 *
 * 使用说明：
 * - 开发环境：使用 .env 文件中的配置
 * - 生产环境：使用 .env.production 文件中的配置
 * - 所有硬编码的地址都应该替换为使用此文件的导出变量
 */

// API 基础地址（用于所有 fetch 请求）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Socket.io 连接地址（用于 WebSocket 连接）
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// 导出默认配置
export default {
  API_BASE_URL,
  SOCKET_URL,
};

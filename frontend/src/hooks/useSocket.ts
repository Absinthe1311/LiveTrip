// Socket.io Hook - 提供WebSocket连接
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = (): Socket | null => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    // 如果socket不存在或已断开，创建新连接
    if (!socket || !socket.connected) {
      socket = io('http://localhost:3003', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('✅ Socket.io 已连接');
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket.io 已断开');
      });

      socket.on('error', (error: any) => {
        console.error('Socket.io 错误:', error);
      });
    }

    setSocketInstance(socket);

    // 清理函数 - 不断开连接，保持单例
    return () => {
      // 不在这里断开连接，保持socket单例
    };
  }, []);

  return socketInstance;
};

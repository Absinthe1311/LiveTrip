// Socket.io 服务 - 处理WebSocket实时通信
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../lib/prisma';

const prisma = getPrismaClient();

// Socket.io 服务器实例
let io: SocketIOServer;

// 用户Socket映射（userId -> socketId）
const userSocketMap = new Map<string, string>();

// Socket房间映射（socketId -> roomId）
const socketRoomMap = new Map<string, string>();

/**
 * 初始化Socket.io服务器
 * @param server HTTP服务器实例
 */
export const initSocketIO = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('认证失败：缺少token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'livetrip-secret-key-2024') as any;
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('认证失败：token无效'));
    }
  });

  // 连接事件
  io.on('connection', (socket: Socket) => {
    console.log(`✅ 用户 ${socket.data.username} 已连接 (Socket ID: ${socket.id})`);

    // 保存用户Socket映射
    userSocketMap.set(socket.data.userId, socket.id);

    // ==================== 房间相关事件 ====================

    /**
     * 加入协同房间
     */
    socket.on('join_room', async (data: { roomId: string; userId: string }) => {
      try {
        const { roomId, userId } = data;

        // 验证用户身份
        if (userId !== socket.data.userId) {
          socket.emit('error', { message: '用户身份验证失败' });
          return;
        }

        // 检查用户是否是房间成员
        const member = await prisma.tripMember.findUnique({
          where: {
            roomId_userId: { roomId, userId },
          },
        });

        if (!member) {
          socket.emit('error', { message: '无权加入该房间' });
          return;
        }

        // 加入Socket.io房间
        socket.join(roomId);
        socketRoomMap.set(socket.id, roomId);

        // 广播成员加入事件给房间其他人
        socket.to(roomId).emit('member:join', {
          userId,
          username: socket.data.username,
          timestamp: new Date(),
        });

        console.log(`👤 用户 ${socket.data.username} 加入了房间 ${roomId}`);
      } catch (error) {
        console.error('❌ 加入房间失败:', error);
        socket.emit('error', { message: '加入房间失败' });
      }
    });

    /**
     * 离开协同房间
     */
    socket.on('leave_room', (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;

      // 离开Socket.io房间
      socket.leave(roomId);
      socketRoomMap.delete(socket.id);

      // 广播成员离开事件
      socket.to(roomId).emit('member:leave', {
        userId,
        username: socket.data.username,
        timestamp: new Date(),
      });

      console.log(`👋 用户 ${socket.data.username} 离开了房间 ${roomId}`);
    });

    // ==================== 光标相关事件 ====================

    /**
     * 光标移动
     */
    socket.on('cursor:move', (data: { roomId: string; userId: string; lat: number; lng: number }) => {
      const { roomId, userId, lat, lng } = data;

      // 广播光标更新给房间其他人
      socket.to(roomId).emit('cursor:update', {
        userId,
        lat,
        lng,
        timestamp: new Date(),
      });
    });

    // ==================== 草案相关事件 ====================

    /**
     * 草案更新
     */
    socket.on('draft:update', (data: {
      roomId: string;
      userId: string;
      dayNumber: number;
      spotSequence: string[];
      polylineData: any;
    }) => {
      const { roomId, userId, dayNumber, spotSequence, polylineData } = data;

      // 广播草案变化给房间其他人
      socket.to(roomId).emit('draft:changed', {
        userId,
        dayNumber,
        spotSequence,
        polylineData,
        timestamp: new Date(),
      });
    });

    /**
     * 草案提交
     */
    socket.on('draft:submitted', (data: { roomId: string; userId: string; dayNumber: number }) => {
      const { roomId, userId, dayNumber } = data;

      // 广播草案提交事件给房间所有人
      io.to(roomId).emit('draft:submitted', {
        userId,
        dayNumber,
        timestamp: new Date(),
      });
    });

    // ==================== 房间状态相关事件 ====================

    /**
     * 房间锁定
     */
    socket.on('room:lock', (data: { roomId: string }) => {
      const { roomId } = data;

      // 广播房间锁定事件给房间所有人
      io.to(roomId).emit('room:lock', {
        timestamp: new Date(),
      });
    });

    // ==================== 消息相关事件 ====================

    /**
     * 新消息
     */
    socket.on('message:new', (data: { roomId: string; message: any }) => {
      const { roomId, message } = data;

      // 广播新消息给房间所有人
      io.to(roomId).emit('message:new', message);
    });

    // ==================== 断开连接 ====================

    socket.on('disconnect', () => {
      console.log(`❌ 用户 ${socket.data.username} 已断开连接 (Socket ID: ${socket.id})`);

      // 清理映射
      userSocketMap.delete(socket.data.userId);

      // 如果用户在某个房间中，广播离开事件
      const roomId = socketRoomMap.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('member:leave', {
          userId: socket.data.userId,
          username: socket.data.username,
          timestamp: new Date(),
        });
        socketRoomMap.delete(socket.id);
      }
    });
  });

  return io;
};

/**
 * 获取Socket.io服务器实例
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io未初始化');
  }
  return io;
};

/**
 * 向指定房间广播事件
 */
export const broadcastToRoom = (roomId: string, event: string, data: any) => {
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

/**
 * 向指定用户发送事件
 */
export const sendToUser = (userId: string, event: string, data: any) => {
  const socketId = userSocketMap.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

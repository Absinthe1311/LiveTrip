// Socket.io客户端服务 - 处理协同规划的实时通信
import { io, Socket } from 'socket.io-client';
import { useCollabStore } from '../store/collabStore';

// Socket实例
let socket: Socket | null = null;

/**
 * 连接到Socket.io服务器
 * @param token JWT token
 */
export const connectSocket = (token: string) => {
  if (socket?.connected) {
    console.log('Socket已连接');
    return;
  }

  socket = io('http://localhost:3003', {
    auth: { token },
    transports: ['websocket'],
  });

  // 连接事件
  socket.on('connect', () => {
    console.log('✅ Socket已连接');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket已断开');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket连接错误:', error.message);
  });

  // ==================== 房间事件 ====================

  /**
   * 成员加入
   */
  socket.on('member:join', async (data: { userId: string; username: string; timestamp: Date }) => {
    console.log('👤 成员加入:', data);
    const store = useCollabStore.getState();
    store.addOnlineUser(data.userId);
    
    // 重新获取房间信息（包含成员列表）
    if (store.currentRoom) {
      try {
        const response = await fetch(`http://localhost:3003/api/collab/rooms/${store.currentRoom.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const roomData = await response.json();
          store.setMembers(roomData.data.members || []);
        }
      } catch (error) {
        console.error('获取成员列表失败:', error);
      }
    }
  });

  /**
   * 成员离开
   */
  socket.on('member:leave', async (data: { userId: string; username: string; timestamp: Date }) => {
    console.log('👋 成员离开:', data);
    const store = useCollabStore.getState();
    store.removeOnlineUser(data.userId);
    store.removeCursor(data.userId);
    
    // 重新获取房间信息（包含成员列表）
    if (store.currentRoom) {
      try {
        const response = await fetch(`http://localhost:3003/api/collab/rooms/${store.currentRoom.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const roomData = await response.json();
          store.setMembers(roomData.data.members || []);
        }
      } catch (error) {
        console.error('获取成员列表失败:', error);
      }
    }
  });

  // ==================== 光标事件 ====================

  /**
   * 光标更新
   */
  socket.on('cursor:update', (data: { userId: string; lat: number; lng: number; timestamp: Date }) => {
    const store = useCollabStore.getState();
    store.updateCursor(data.userId, {
      userId: data.userId,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date(data.timestamp),
    });
  });

  // ==================== 草案事件 ====================

  /**
   * 草案变化
   */
  socket.on('draft:changed', (data: {
    userId: string;
    dayNumber: number;
    spotSequence: string[];
    polylineData: any;
    timestamp: Date;
  }) => {
    console.log('📝 草案变化:', data);
    // 可以选择显示其他人的草案预览
  });

  /**
   * 草案提交
   */
  socket.on('draft:submitted', (data: { userId: string; dayNumber: number; timestamp: Date }) => {
    console.log('✅ 草案已提交:', data);
    // 可以显示通知
  });

  // ==================== 房间状态事件 ====================

  /**
   * 房间锁定
   */
  socket.on('room:lock', (_data: { timestamp: Date }) => {
    console.log('🔒 房间已锁定');
    const store = useCollabStore.getState();
    if (store.currentRoom) {
      store.setCurrentRoom({
        ...store.currentRoom,
        phase: 'LOCKED',
      });
    }
  });

  // ==================== 消息事件 ====================

  /**
   * 新消息
   */
  socket.on('message:new', (message: any) => {
    const store = useCollabStore.getState();
    store.addMessage(message);
  });

  /**
   * 错误事件
   */
  socket.on('error', (data: { message: string }) => {
    console.error('Socket错误:', data.message);
  });
};

/**
 * 断开Socket连接
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * 加入协同房间
 * @param roomId 房间ID
 * @param userId 用户ID
 */
export const joinRoom = (roomId: string, userId: string) => {
  if (socket) {
    socket.emit('join_room', { roomId, userId });
  }
};

/**
 * 离开协同房间
 * @param roomId 房间ID
 * @param userId 用户ID
 */
export const leaveRoom = (roomId: string, userId: string) => {
  if (socket) {
    socket.emit('leave_room', { roomId, userId });
  }
};

/**
 * 发送光标移动事件
 * @param roomId 房间ID
 * @param userId 用户ID
 * @param lat 纬度
 * @param lng 经度
 */
export const moveCursor = (roomId: string, userId: string, lat: number, lng: number) => {
  if (socket) {
    socket.emit('cursor:move', { roomId, userId, lat, lng });
  }
};

/**
 * 发送草案更新事件
 * @param roomId 房间ID
 * @param userId 用户ID
 * @param dayNumber 天数
 * @param spotSequence 景点序列
 * @param polylineData 路线数据
 */
export const updateDraft = (
  roomId: string,
  userId: string,
  dayNumber: number,
  spotSequence: string[],
  polylineData: any
) => {
  if (socket) {
    socket.emit('draft:update', { roomId, userId, dayNumber, spotSequence, polylineData });
  }
};

/**
 * 发送草案提交事件
 * @param roomId 房间ID
 * @param userId 用户ID
 * @param dayNumber 天数
 */
export const submitDraftEvent = (roomId: string, userId: string, dayNumber: number) => {
  if (socket) {
    socket.emit('draft:submitted', { roomId, userId, dayNumber });
  }
};

/**
 * 发送房间锁定事件
 * @param roomId 房间ID
 */
export const lockRoomEvent = (roomId: string) => {
  if (socket) {
    socket.emit('room:lock', { roomId });
  }
};

/**
 * 发送新消息事件
 * @param roomId 房间ID
 * @param message 消息对象
 */
export const newMessageEvent = (roomId: string, message: any) => {
  if (socket) {
    socket.emit('message:new', { roomId, message });
  }
};

/**
 * 获取Socket实例
 */
export const getSocket = () => socket;

// 通知铃铛组件 - 在首页显示消息图标
import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { fetNotifs, markAsRead, readAll, Notification } from '@/api/notification';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import apiClient from '@/api/client';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();

  // 加载通知列表
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await fetNotifs({ limit: 10 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadNotifications();
  }, []);

  // 监听WebSocket实时通知
  useEffect(() => {
    if (!socket) return;

    socket.on('sensor:alert', (data: any) => {
      console.log('收到环境感知通知:', data);

      // 显示Toast通知
      if (data.level === 'danger') {
        toast.error(data.title, {
          description: data.content,
          duration: 10000,
          action: {
            label: '查看',
            onClick: () => setIsOpen(true),
          },
        });
      } else if (data.level === 'warning') {
        toast.warning(data.title, {
          description: data.content,
          duration: 8000,
          action: {
            label: '查看',
            onClick: () => setIsOpen(true),
          },
        });
      } else {
        toast.info(data.title, {
          description: data.content,
          duration: 5000,
        });
      }

      // 重新加载通知列表
      loadNotifications();
    });

    return () => {
      socket.off('sensor:alert');
    };
  }, [socket]);

  // 标记单个通知为已读
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    try {
      await readAll();
      await loadNotifications();
    } catch (error) {
      console.error('标记所有已读失败:', error);
    }
  };

  // 删除单个通知
  const handledelNotif = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发标记已读
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      await loadNotifications();
      toast.success('通知已删除');
    } catch (error) {
      console.error('删除通知失败:', error);
      toast.error('删除失败');
    }
  };

  // 清空所有通知
  const handleflushNotifs = async () => {
    try {
      await apiClient.delete('/notifications/clear-all');
      await loadNotifications();
      toast.success('所有通知已清空');
    } catch (error) {
      console.error('清空通知失败:', error);
      toast.error('清空失败');
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="relative">
      {/* 铃铛图标 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <Bell className="w-5 h-5 text-white" />
        {/* 未读数量徽章 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉面板 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />

          {/* 通知面板 */}
          <div className="absolute right-0 top-12 w-96 max-h-[500px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl z-[9999] overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">消息通知</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    全部已读
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleflushNotifs}
                    className="text-sm text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"
                    title="清空所有通知"
                  >
                    <Trash2 className="w-4 h-4" />
                    清空
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* 通知列表 */}
            <div className="overflow-y-auto max-h-[380px]">
              {loading ? (
                <div className="p-10 text-center text-white/60">加载中...</div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-white/60">暂无通知</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group ${
                      !notification.isRead ? 'bg-white/5' : ''
                    }`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 未读标记 */}
                      {!notification.isRead && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-white mb-1.5">
                          {notification.title}
                        </div>
                        <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
                          {notification.content}
                        </div>
                        <div className="text-xs text-white/40 mt-3">
                          {formatTime(notification.createdAt)}
                        </div>
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => handledelNotif(notification.id, e)}
                        className="p-1.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                        title="删除通知"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/60 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 底部 */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-white/10 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // 可以跳转到通知详情页
                  }}
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  查看全部通知
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

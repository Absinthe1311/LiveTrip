// 协同规划入口页面 - 毛玻璃风格版本
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Clock, CheckCircle, UserPlus, Lock, Unlock, ChevronRight } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';
import { createCollabRoom, joinCollabRoom } from '../api/collabApi';
import { message } from 'antd';

interface CollabRoom {
  id: string;
  name: string;
  tripId: string;
  hostId: string;
  memberCount: number;
  isLocked: boolean;
  createdAt: string;
}

export default function CollabEntryGlass() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<CollabRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinToken, setJoinToken] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  useEffect(() => {
    loadUserRooms();
  }, []);

  const loadUserRooms = async () => {
    try {
      setLoading(true);
      // TODO: 调用获取用户房间列表的API
      // 暂时设置为空数组，等API实现后再启用
      setRooms([]);
    } catch (error) {
      console.error('加载房间列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    // 跳转到创建房间页面
    navigate('/collab/create');
  };

  const handleJoinRoom = async () => {
    if (!joinToken.trim()) {
      message.warning('请输入房间邀请码');
      return;
    }

    try {
      const response = await joinCollabRoom(joinToken.trim());
      if (response.success) {
        message.success('成功加入房间');
        navigate(`/collab/room/${response.data.id}`);
      } else {
        message.error(response.error || '加入房间失败');
      }
    } catch (error: any) {
      console.error('加入房间失败:', error);
      message.error(error.response?.data?.error || '加入房间失败');
    }
  };

  const handleRoomClick = (roomId: string) => {
    navigate(`/collab/room/${roomId}`);
  };

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">协同规划</h1>
          <p className="text-white/60 text-lg">与朋友一起规划完美的旅行</p>
        </div>

        {/* 使用说明 */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold text-white mb-4">使用说明</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-livetrip-primary text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">创建房间</h4>
                <p className="text-sm text-white/60">创建协同房间并设置基本信息</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-livetrip-primary text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">邀请朋友</h4>
                <p className="text-sm text-white/60">分享邀请码给朋友加入房间</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-livetrip-primary text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">协同规划</h4>
                <p className="text-sm text-white/60">多人实时协作规划行程</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-6">
          <GlassCard
            className="p-8 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={handleCreateRoom}
          >
            <div className="text-center">
              <div className="inline-flex p-6 rounded-2xl bg-livetrip-primary/20 mb-6">
                <Plus className="h-12 w-12 text-livetrip-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">创建协同房间</h2>
              <p className="text-white/60 mb-6">创建一个新的协同规划房间，邀请朋友一起规划行程</p>
              <button className="px-8 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors">
                开始创建
              </button>
            </div>
          </GlassCard>

          <GlassCard
            className="p-8 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setShowJoinInput(!showJoinInput)}
          >
            <div className="text-center">
              <div className="inline-flex p-6 rounded-2xl bg-livetrip-accent/20 mb-6">
                <UserPlus className="h-12 w-12 text-livetrip-accent" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">加入协同房间</h2>
              <p className="text-white/60 mb-6">输入房间邀请码，加入朋友的协同规划</p>
              <button className="px-8 py-3 rounded-lg bg-livetrip-accent text-white font-medium hover:bg-livetrip-accent/90 transition-colors">
                加入房间
              </button>
            </div>
          </GlassCard>
        </div>

        {/* 加入房间输入框 */}
        {showJoinInput && (
          <GlassCard className="p-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="请输入房间邀请码"
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-livetrip-primary"
              />
              <button
                onClick={handleJoinRoom}
                className="px-6 py-3 rounded-lg bg-livetrip-primary text-white font-medium hover:bg-livetrip-primary/90 transition-colors"
              >
                加入
              </button>
              <button
                onClick={() => {
                  setShowJoinInput(false);
                  setJoinToken('');
                }}
                className="px-6 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                取消
              </button>
            </div>
          </GlassCard>
        )}

        {/* 房间列表 */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">我的房间</h3>
            <button
              onClick={loadUserRooms}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              刷新
            </button>
          </div>

          {loading ? (
            <div className="text-center text-white/60 py-8">加载中...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-white/60">还没有加入任何协同房间</p>
              <p className="text-white/40 text-sm mt-2">创建房间或加入朋友的房间开始协同规划</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick(room.id)}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-livetrip-primary/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-livetrip-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{room.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {room.memberCount} 人
                        </span>
                        <span className="flex items-center gap-1">
                          {room.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          {room.isLocked ? '已锁定' : '开放'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/60" />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </GlassLayout>
  );
}

// 协同规划入口页面 - 毛玻璃风格版本
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import GlassLayout from '../components/layout/GlassLayout';
import { GlassCard } from '../components/home';
import { joinCollabRoom } from '../api/collabApi';
import { message } from 'antd';

export default function CollabEntryGlass() {
  const navigate = useNavigate();
  const [joinToken, setJoinToken] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreateRoom = () => {
    // 跳转到协同规划设置页面
    navigate('/collab/setup');
  };

  const handleJoinRoom = async () => {
    if (!joinToken.trim()) {
      message.warning('请输入房间邀请码或邀请链接');
      return;
    }

    try {
      // 解析 token：用户可能输入的是完整链接或单独的 token
      let token = joinToken.trim();

      // 如果输入的是完整链接，提取 token 参数
      if (token.includes('token=')) {
        const urlParams = new URLSearchParams(token.split('?')[1]);
        token = urlParams.get('token') || '';
      }

      if (!token) {
        message.error('无效的邀请链接或邀请码');
        return;
      }

      console.log('📝 解析后的 token:', token);

      const response = await joinCollabRoom(token);
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

  return (
    <GlassLayout showSearch={false}>
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
              <div className="inline-flex p-6 rounded-2xl bg-livetrap-accent/20 mb-6">
                <UserPlus className="h-12 w-12 text-livetrip-accent" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">加入协同房间</h2>
              <p className="text-white/60 mb-6">输入邀请链接或邀请码，加入朋友的协同规划</p>
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
                placeholder="请输入邀请链接或邀请码（如：http://localhost:5173/collab/join?token=xxx）"
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
      </div>
    </GlassLayout>
  );
}

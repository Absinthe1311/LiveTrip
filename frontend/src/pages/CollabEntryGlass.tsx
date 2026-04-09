// 协同规划入口页面 - 毛玻璃风格版本
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Clock, CheckCircle } from 'lucide-react';
import GlassLayout from '../components/GlassLayout';
import { GlassCard } from '../components/home';

export default function CollabEntryGlass() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: '实时协作',
      description: '多人同时编辑行程，实时同步更新',
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: '历史记录',
      description: '查看所有修改历史，随时回退',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: '投票决策',
      description: '对景点、餐厅进行投票，民主决策',
    },
  ];

  return (
    <GlassLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">协同规划</h1>
          <p className="text-white/60 text-lg">与朋友一起规划完美的旅行</p>
        </div>

        {/* 功能介绍 */}
        <div className="grid grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <GlassCard key={index} className="p-6 text-center">
              <div className="inline-flex p-4 rounded-xl bg-livetrip-primary/20 text-livetrip-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/60">{feature.description}</p>
            </GlassCard>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-6">
          <GlassCard
            className="p-8 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/collab/create')}
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
            onClick={() => navigate('/collab/join')}
          >
            <div className="text-center">
              <div className="inline-flex p-6 rounded-2xl bg-livetrip-accent/20 mb-6">
                <Search className="h-12 w-12 text-livetrip-accent" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">加入协同房间</h2>
              <p className="text-white/60 mb-6">输入房间码或邀请链接，加入朋友的协同规划</p>
              <button className="px-8 py-3 rounded-lg bg-livetrip-accent text-white font-medium hover:bg-livetrip-accent/90 transition-colors">
                加入房间
              </button>
            </div>
          </GlassCard>
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
                <p className="text-sm text-white/60">分享房间码或邀请链接给朋友</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-livetrip-primary text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">协同规划</h4>
                <p className="text-sm text-white/60">大家一起编辑行程，实时同步</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </GlassLayout>
  );
}

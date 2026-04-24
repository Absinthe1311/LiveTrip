import React, { useState, useEffect } from 'react';
import { Bell, Cloud, Users, TrendingUp, MapPin, X } from 'lucide-react';

interface IoTDemoNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  level: 'info' | 'warning' | 'danger';
  spotName: string;
  timestamp: Date;
}

// 演示数据
const DEMO_DATA: IoTDemoNotification[] = [
  {
    id: '1',
    type: 'crowd_increase',
    title: '故宫博物院',
    content: '拥挤度上升28%，建议提前到达',
    level: 'warning',
    spotName: '故宫博物院',
    timestamp: new Date()
  },
  {
    id: '2',
    type: 'weather_change',
    title: '颐和园',
    content: '降雨概率65%，建议携带雨具',
    level: 'warning',
    spotName: '颐和园',
    timestamp: new Date(Date.now() - 5 * 60000)
  },
  {
    id: '3',
    type: 'trend_warning',
    title: '天坛公园',
    content: '拥挤度持续上升，建议尽快前往',
    level: 'warning',
    spotName: '天坛公园',
    timestamp: new Date(Date.now() - 10 * 60000)
  }
];

export function IoTDemoShowcase() {
  const [isVisible, setIsVisible] = useState(true);
  const [activeNotification, setActiveNotification] = useState(0);

  // 自动轮播通知
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNotification((prev) => (prev + 1) % DEMO_DATA.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const currentNotification = DEMO_DATA[activeNotification];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'danger': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'danger': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crowd_increase': return <Users className="w-5 h-5" />;
      case 'weather_change': return <Cloud className="w-5 h-5" />;
      case 'trend_warning': return <TrendingUp className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      {/* 主卡片 */}
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-5 py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white">IoT实时监控</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* 通知内容 */}
        <div className="p-5">
          <div className={`rounded-xl p-4 border ${getLevelBg(currentNotification.level)}`}>
            <div className="flex items-start gap-3">
              <div className={getLevelColor(currentNotification.level)}>
                {getTypeIcon(currentNotification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-medium text-white">
                    {currentNotification.title}
                  </span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {currentNotification.content}
                </p>
                <div className="text-xs text-white/40 mt-2">
                  {currentNotification.timestamp.toLocaleTimeString('zh-CN')}
                </div>
              </div>
            </div>
          </div>

          {/* 指示器 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {DEMO_DATA.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveNotification(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeNotification
                    ? 'bg-white w-6'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 功能亮点 */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">393</div>
              <div className="text-xs text-white/60">景点监控</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">15分</div>
              <div className="text-xs text-white/60">更新频率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">9种</div>
              <div className="text-xs text-white/60">微气候</div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-5 py-3 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>💡 点击通知铃铛查看更多</span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              实时更新中
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 简化版：用于首页Hero区域的IoT功能展示
export function IoTHeroShowcase() {
  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/20 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">IoT实时监控</h3>
          <p className="text-sm text-white/60">智能感知，实时提醒</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 演示项1 */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Users className="w-5 h-5 text-yellow-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">拥挤度监控</div>
            <div className="text-xs text-white/60">实时检测景点人流状态</div>
          </div>
          <div className="text-xs text-yellow-400">+28%</div>
        </div>

        {/* 演示项2 */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Cloud className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">天气预警</div>
            <div className="text-xs text-white/60">微气候精准预测</div>
          </div>
          <div className="text-xs text-blue-400">65%</div>
        </div>

        {/* 演示项3 */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-white">趋势分析</div>
            <div className="text-xs text-white/60">智能预测状态变化</div>
          </div>
          <div className="text-xs text-green-400">上升</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">已监控景点</span>
          <span className="font-semibold text-white">393个</span>
        </div>
      </div>
    </div>
  );
}

/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：组件重构
 */

// 景点统计面板 - 显示各景点的出现次数
import { SpotStat } from '../../store/collabStore';
import { BarChart3, TrendingUp } from 'lucide-react';

interface SpotStatsPanelProps {
  stats: SpotStat[];
  onClose: () => void;
}

export default function SpotStatsPanel({ stats, onClose }: SpotStatsPanelProps) {
  // 按出现次数排序
  const sortedStats = [...stats].sort((a, b) => b.count - a.count);

  // 计算最大次数用于显示比例
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  // 获取颜色
  const getColor = (count: number) => {
    if (count >= 4) return 'bg-red-500';
    if (count === 3) return 'bg-orange-500';
    if (count === 2) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getTextColor = (count: number) => {
    if (count >= 4) return 'text-red-600';
    if (count === 3) return 'text-orange-600';
    if (count === 2) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-livetrip-primary" />
            <h3 className="text-lg font-semibold">景点统计</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {sortedStats.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无统计数据</div>
          ) : (
            <div className="space-y-3">
              {/* 图例 */}
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gray-400"></div>
                  <span>1次</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>2次</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-500"></div>
                  <span>3次</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span>4次+</span>
                </div>
              </div>

              {/* 统计列表 */}
              {sortedStats.map((stat, index) => (
                <div
                  key={stat.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* 排名 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-livetrip-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-livetrip-primary">{index + 1}</span>
                  </div>

                  {/* 景点名称 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{stat.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.category || '景点'}</p>
                  </div>

                  {/* 柱状图 */}
                  <div className="flex-shrink-0 w-32">
                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getColor(stat.count)} transition-all`}
                        style={{ width: `${(stat.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 次数 */}
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className={`text-lg font-bold ${getTextColor(stat.count)}`}>
                      {stat.count}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">次</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>共 {stats.length} 个景点被选择</span>
            </div>
            <div>总计 {stats.reduce((sum, s) => sum + s.count, 0)} 次选择</div>
          </div>
        </div>
      </div>
    </div>
  );
}

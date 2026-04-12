// 图层控制!组件 - 控制地图上显示哪些用户的草案图层
import { useState } from 'react';
import { Eye, EyeOff, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { TripMember } from '../../store/collabStore';

interface LayerControlProps {
  members: TripMember[];
  visibleLayers: Set<string>;
  onToggleLayer: (userId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export default function LayerControl({
  members,
  visibleLayers,
  onToggleLayer,
  onShowAll,
  onHideAll,
}: LayerControlProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 根据userId生成颜色
  const getUserColor = (userId: string): string => {
    const colors = [
      '#3B82F6', // 蓝色
      '#EF4444', // 红色
      '#10B981', // 绿色
      '#F59E0B', // 橙色
      '#8B5CF6', // 紫色
      '#EC4899', // 粉色
      '#06B6D4', // 青色
      '#84CC16', // 黄绿色
    ];
    
    // 简单的hash函数
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">图层控制</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">
            {visibleLayers.size}/{members.length} 可见
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/60" />
          )}
        </div>
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {/* 快捷操作 */}
          <div className="flex gap-2 p-3 border-b border-white/10 bg-white/5">
            <button
              onClick={onShowAll}
              className="flex-1 px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-1 text-white/80"
            >
              <Eye className="h-3 w-3" />
              全部显示
            </button>
            <button
              onClick={onHideAll}
              className="flex-1 px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-1 text-white/80"
            >
              <EyeOff className="h-3 w-3" />
              全部隐藏
            </button>
          </div>

          {/* 成员列表 */}
          <div className="max-h-[200px] overflow-y-auto">
            {members.map((member) => {
              const isVisible = visibleLayers.has(member.userId);
              const color = getUserColor(member.userId);
              
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => onToggleLayer(member.userId)}
                >
                  {/* 颜色标识 */}
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                  />
                  
                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member.user.username}
                    </p>
                    <p className="text-xs text-white/50">
                      {member.role === 'HOST' ? '主持人' : '协作者'}
                    </p>
                  </div>
                  
                  {/* 可见性图标 */}
                  {isVisible ? (
                    <Eye className="h-4 w-4 text-amber-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-white/40" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

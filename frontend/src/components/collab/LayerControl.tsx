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
    <div className="bg-white rounded-lg border border-border shadow-sm">
      {/* 标题栏 */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-livetrip-primary" />
          <span className="text-sm font-medium">图层控制</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {visibleLayers.size}/{members.length} 可见
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* 快捷操作 */}
          <div className="flex gap-2 p-3 border-b border-border bg-gray-50">
            <button
              onClick={onShowAll}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-border rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="h-3 w-3" />
              全部显示
            </button>
            <button
              onClick={onHideAll}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-border rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
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
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onToggleLayer(member.userId)}
                >
                  {/* 颜色标识 */}
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  
                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.role === 'HOST' ? '主持人' : '协作者'}
                    </p>
                  </div>
                  
                  {/* 可见性图标 */}
                  {isVisible ? (
                    <Eye className="h-4 w-4 text-livetrip-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
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

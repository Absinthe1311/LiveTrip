// Packing List 组件 - 单独显示行李清单
import React from 'react';
import GlassCard from './GlassCard';
import { ArrowRight, Circle, CircleCheck } from 'lucide-react';

interface PackingItem {
  id: string;
  name: string;
  packed: boolean;
  category: string;
}

interface PackingListProps {
  packingItems?: PackingItem[];
  onPackingClick?: () => void;
  onItemToggle?: (itemId: string) => void;
  className?: string;
}

const defaultPackingItems: PackingItem[] = [
  { id: '1', name: '护照', packed: true, category: '证件' },
  { id: '2', name: '身份证', packed: true, category: '证件' },
  { id: '3', name: '充电器', packed: false, category: '电子' },
  { id: '4', name: '转换插头', packed: false, category: '电子' },
  { id: '5', name: '防晒霜', packed: false, category: '个人护理' },
];

export default function PackingList({
  packingItems = defaultPackingItems,
  onPackingClick,
  onItemToggle,
  className = ''
}: PackingListProps) {
  const packedCount = packingItems.filter(item => item.packed).length;
  const progress = (packedCount / packingItems.length) * 100;

  return (
    <GlassCard className={`p-5 ${className}`} onClick={onPackingClick}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/70">
            行李清单
          </span>
        </div>
        <span className="text-xs text-white/60">
          {packedCount}/{packingItems.length}
        </span>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 打包列表 */}
      <div className="space-y-2 mb-3">
        {packingItems.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onItemToggle?.(item.id);
            }}
          >
            {item.packed ? (
              <CircleCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-white/40 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                item.packed
                  ? 'text-white/40 line-through'
                  : 'text-white/90'
              }`}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* 查看详情按钮 */}
      <button className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors group">
        <span>管理清单</span>
        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
      </button>
    </GlassCard>
  );
}

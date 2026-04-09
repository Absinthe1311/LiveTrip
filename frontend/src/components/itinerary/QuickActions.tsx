// 快速操作按钮组组件
import React from 'react';
import { Share2, Download, Pencil, Heart } from 'lucide-react';

interface QuickActionsProps {
  onShare?: () => void;
  onExport?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
  showEdit?: boolean;
  showFavorite?: boolean;
}

export default function QuickActions({
  onShare,
  onExport,
  onEdit,
  onFavorite,
  showEdit = true,
  showFavorite = true
}: QuickActionsProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>

      <div className="space-y-3">
        {/* 分享行程 */}
        {onShare && (
          <button
            onClick={onShare}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300"
          >
            <Share2 className="w-5 h-5 text-amber-400" />
            <span className="font-medium">分享行程</span>
          </button>
        )}

        {/* 导出PDF */}
        {onExport && (
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300"
          >
            <Download className="w-5 h-5 text-amber-400" />
            <span className="font-medium">导出 PDF</span>
          </button>
        )}

        {/* 编辑行程 */}
        {showEdit && onEdit && (
          <button
            onClick={onEdit}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300"
          >
            <Pencil className="w-5 h-5 text-amber-400" />
            <span className="font-medium">编辑行程</span>
          </button>
        )}

        {/* 收藏 */}
        {showFavorite && onFavorite && (
          <button
            onClick={onFavorite}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-white/30 transition-all duration-300"
          >
            <Heart className="w-5 h-5 text-amber-400" />
            <span className="font-medium">收藏行程</span>
          </button>
        )}
      </div>
    </div>
  );
}

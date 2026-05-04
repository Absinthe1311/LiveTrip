// 空状态组件 - 用于博客列表、详情等场景
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, FolderOpen, PenLine } from 'lucide-react';
import { GlassCard } from '../home';

interface EmptyStateProps {
  type?: 'blogs' | 'search' | 'favorites' | 'drafts';
  title?: string;
  description?: string;
  showAction?: boolean;
  actionText?: string;
  actionPath?: string;
}

export default function EmptyState({
  type = 'blogs',
  title,
  description,
  showAction = true,
  actionText,
  actionPath,
}: EmptyStateProps) {
  const navigate = useNavigate();

  const configs = {
    blogs: {
      icon: <FileText className="w-16 h-16 text-amber-400/50" />,
      title: '还没有博客',
      description: '分享你的旅行故事，记录每一次精彩旅程',
      actionText: '写博客',
      actionPath: '/blog/create',
    },
    search: {
      icon: <Search className="w-16 h-16 text-amber-400/50" />,
      title: '没有找到相关博客',
      description: '试试其他关键词或浏览全部博客',
      actionText: '查看全部',
      actionPath: '/blogs',
    },
    favorites: {
      icon: <FolderOpen className="w-16 h-16 text-amber-400/50" />,
      title: '还没有收藏的博客',
      description: '浏览博客并收藏你喜欢的内容',
      actionText: '浏览博客',
      actionPath: '/blogs',
    },
    drafts: {
      icon: <PenLine className="w-16 h-16 text-amber-400/50" />,
      title: '没有草稿',
      description: '开始写作并保存为草稿',
      actionText: '写博客',
      actionPath: '/blog/create',
    },
  };

  const config = configs[type];

  return (
    <GlassCard className="p-12" hover={false}>
      <div className="text-center">
        {/* 图标 */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* 背景光晕 */}
            <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-3xl" />
            {/* 图标 */}
            <div className="relative">{config.icon}</div>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-2xl font-bold text-white mb-3">{title || config.title}</h3>

        {/* 描述 */}
        <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
          {description || config.description}
        </p>

        {/* 操作按钮 */}
        {showAction && (
          <button
            onClick={() => navigate(actionPath || config.actionPath)}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {actionText || config.actionText}
          </button>
        )}

        {/* 提示信息 */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-white/40">
            💡 提示：博客支持富文本编辑、图片上传、标签管理等功能
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// 迷你空状态（用于侧边栏、小卡片等）
export function MiniEmptyState({
  icon,
  text,
  className = '',
}: {
  icon?: React.ReactNode;
  text: string;
  className?: string;
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="flex justify-center mb-3">
        {icon || <FileText className="w-8 h-8 text-white/30" />}
      </div>
      <p className="text-sm text-white/50">{text}</p>
    </div>
  );
}

// 加载错误状态
export function ErrorState({
  title = '加载失败',
  description = '抱歉，数据加载出现问题',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <GlassCard className="p-12" hover={false}>
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/60 mb-6">{description}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-all"
          >
            重试
          </button>
        )}
      </div>
    </GlassCard>
  );
}

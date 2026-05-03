// 骨架屏加载组件 - 用于博客列表加载状态

// AI辅助生成：GLM-4, 2026-4-21
// 删除时间轴骨架屏组件（BlogTimelineSkeleton）
// 原因：时间轴视图功能已删除，相关骨架屏不再需要

// 人工修复：GLM-4, 2026-4-21
// 修复问题：无编译错误，代码直接可用
import { GlassCard } from '../home';

// 博客卡片骨架屏
export function BlogCardSkeleton() {
  return (
    <GlassCard className="p-0 overflow-hidden" hover={false}>
      {/* 封面图片骨架 */}
      <div className="h-48 bg-white/5 animate-pulse" />

      {/* 内容骨架 */}
      <div className="p-6 space-y-4">
        {/* 标题骨架 */}
        <div className="h-6 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-6 bg-white/10 rounded-lg animate-pulse w-3/4" />

        {/* 摘要骨架 */}
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
        </div>

        {/* 元信息骨架 */}
        <div className="flex items-center gap-4 pt-4">
          <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-24" />
        </div>

        {/* 统计骨架 */}
        <div className="flex items-center gap-6 pt-4 border-t border-white/10">
          <div className="h-4 bg-white/5 rounded animate-pulse w-12" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-12" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-12" />
        </div>
      </div>
    </GlassCard>
  );
}

// 博客详情骨架屏
export function BlogDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* 封面骨架 */}
      <div className="h-96 bg-white/5 rounded-xl animate-pulse" />

      {/* 内容骨架 */}
      <GlassCard className="p-8" hover={false}>
        {/* 标题骨架 */}
        <div className="h-12 bg-white/10 rounded-lg animate-pulse mb-6" />

        {/* 元信息骨架 */}
        <div className="flex items-center gap-6 mb-6">
          <div className="h-5 bg-white/5 rounded animate-pulse w-24" />
          <div className="h-5 bg-white/5 rounded animate-pulse w-32" />
          <div className="h-5 bg-white/5 rounded animate-pulse w-20" />
        </div>

        {/* 标签骨架 */}
        <div className="flex gap-2 mb-6">
          <div className="h-8 bg-white/5 rounded-lg animate-pulse w-16" />
          <div className="h-8 bg-white/5 rounded-lg animate-pulse w-20" />
          <div className="h-8 bg-white/5 rounded-lg animate-pulse w-18" />
        </div>

        {/* 内容骨架 */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-5 bg-white/5 rounded animate-pulse" />
          ))}
        </div>

        {/* 统计骨架 */}
        <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10">
          <div className="h-6 bg-white/5 rounded animate-pulse w-16" />
          <div className="h-6 bg-white/5 rounded animate-pulse w-16" />
          <div className="h-6 bg-white/5 rounded animate-pulse w-16" />
        </div>
      </GlassCard>
    </div>
  );
}

// 列表骨架屏（多个卡片）
export function BlogListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <BlogCardSkeleton key={index} />
      ))}
    </div>
  );
}

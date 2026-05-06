// 测试优化后的景点卡片
import OptimizedSpotCard from '../components/OptimizedSpotCard';

export default function TestOptimizedCard() {
  // 巧克力博物馆的数据
  const chocolateMuseum = {
    id: 'test-1',
    name: '巧克巧蔻·巧克力博物馆(北京馆)',
    image: 'https://res.cloudinary.com/dbfuvkopc/image/upload/v1775751451/spot-images/e7tdxjlqg5uv3jrkkxqp.jpg',
    rating: 4.5,
    description: '', // 留空，使用自动生成的描述
    openTime: '09:00-18:00',
    ticketPrice: 0,
    category: '科教文化服务;博物馆;博物馆',
    city: '北京',
    address: '廊坊头条2号院5号楼1层01号',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          优化后的景点卡片预览
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 优化后的卡片 */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">优化后</h2>
            <OptimizedSpotCard {...chocolateMuseum} />
          </div>
          
          {/* 对比说明 */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">优化要点</h2>
            <ul className="space-y-3 text-white/80 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span><strong>多色系标签</strong>：根据分类自动分配颜色（博物馆=紫色，公园=绿色等）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span><strong>描述文字</strong>：自动生成生动描述，支持"Read More"展开</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span><strong>收藏功能</strong>：右上角红心按钮，点击后变红</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span><strong>信息层级</strong>：标题→地址→标签→描述→评分/价格</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span><strong>视觉优化</strong>：图片底部渐变遮罩，信息区分隔线</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <h3 className="text-amber-400 font-medium mb-2">标签颜色映射</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">博物馆</span>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300">公园</span>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">风景名胜</span>
                <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300">寺庙</span>
                <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300">广场</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 酒店选择抽屉组件 - 右上角常驻图标
import React, { useState } from 'react';
import { Building2, X, Star, MapPin, Wallet, Phone, ChevronRight } from 'lucide-react';
import { Hotel } from '../../api/recommendationApi';

interface HotelDrawerProps {
  selectedHotel?: Hotel | null;
  onHotelSelect?: (hotel: Hotel) => void;
  onHotelRemove?: () => void;
}

export default function HotelDrawer({
  selectedHotel,
  onHotelSelect,
  onHotelRemove
}: HotelDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 常驻图标 - 右上角 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/40 hover:scale-110 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        title="我的下榻处"
      >
        <Building2 className="w-6 h-6 text-white" />
        {selectedHotel && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        )}
      </button>

      {/* 抽屉 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* 抽屉内容 */}
          <div className="fixed right-0 top-0 bottom-0 w-96 bg-white/80 backdrop-blur-xl border-l border-white/30 z-50 shadow-2xl overflow-y-auto">
            {/* 头部 */}
            <div className="sticky top-0 bg-white/60 backdrop-blur-xl border-b border-white/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  <h2 className="text-lg font-bold text-white">我的下榻处</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* 内容区 */}
            <div className="p-6 space-y-4">
              {selectedHotel ? (
                <>
                  {/* 已选酒店 */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-400/50 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">
                        {selectedHotel.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-white font-semibold">
                          {selectedHotel.rating}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{selectedHotel.address || selectedHotel.type}</span>
                      </div>
                      {selectedHotel.tel && (
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Phone className="w-4 h-4 text-purple-400" />
                          <span>{selectedHotel.tel}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={onHotelRemove}
                        className="flex-1 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                      >
                        取消选择
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 text-white text-sm font-medium transition-colors"
                      >
                        确认
                      </button>
                    </div>
                  </div>

                  {/* 提示信息 */}
                  <div className="bg-white/30 rounded-xl p-4 text-center">
                    <p className="text-sm text-white/60">
                      酒店已设置为全天住宿点
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* 未选择酒店 */}
                  <div className="text-center py-8">
                    <Building2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      尚未选择酒店
                    </h3>
                    <p className="text-sm text-white/60 mb-4">
                      请在"酒店"标签页中选择您的住宿
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-2 rounded-lg bg-purple-500/30 hover:bg-purple-500/40 text-white text-sm font-medium transition-colors"
                    >
                      前往选择
                    </button>
                  </div>
                </>
              )}

              {/* 酒店推荐列表（可选） */}
              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">推荐酒店</h4>
                  <button className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    查看更多 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {/* 这里可以添加推荐酒店列表 */}
                  <div className="text-center py-4 text-white/40 text-xs">
                    暂无推荐
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

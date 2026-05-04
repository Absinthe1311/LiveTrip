// 图片审核页面 - 新UI设计
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Heart,
  Home as HomeIcon,
  Plus,
  Globe,
  PenLine,
  List,
  MapPin,
  ChevronRight,
  Navigation,
  Route,
  Search as SearchIcon,
  ChevronDown,
  Image as ImageIcon,
  Check,
  X,
  Eye,
  Clock,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { getPendingImages, reviewImage } from '../../api/adminApi';
import type { PendingImageItem } from '../../types/admin';

export default function ReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const [images, setImages] = useState<PendingImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPendingImages(page, pageSize);
      if (response.success && response.data) {
        setImages(response.data.items || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('加载待审核图片失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleApprove = async (imageId: string) => {
    setReviewing(imageId);
    try {
      const response = await reviewImage(imageId, 'approve');
      if (response.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setTotal((prev) => prev - 1);
      }
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setReviewing(null);
    }
  };

  const handleReject = async (imageId: string) => {
    const note = rejectNote[imageId];
    if (!note || note.trim() === '') {
      return;
    }
    setReviewing(imageId);
    try {
      const response = await reviewImage(imageId, 'reject', note);
      if (response.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        setTotal((prev) => prev - 1);
        setRejectNote((prev) => {
          const newNotes = { ...prev };
          delete newNotes[imageId];
          return newNotes;
        });
        setShowRejectModal(null);
      }
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setReviewing(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50 flex items-center shadow-subtle">
        <div
          className="w-[240px] h-full flex items-center px-5 border-r border-border shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 bg-livetrip-primary rounded-lg flex items-center justify-center mr-2">
            <span className="text-lg">✈️</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-livetrip-primary-dark font-serif">
              LiveTrip
            </span>
            <span className="text-[10px] text-livetrip-primary font-medium tracking-wide">
              Admin
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <h1 className="text-base font-semibold text-foreground">待审核图片</h1>
        </div>

        <div className="flex items-center gap-1 px-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate('/favorites')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Heart className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLargeScreen={isLargeScreen}
        currentPage={location.pathname}
      />

      {/* Main Content */}
      <main className={`pt-14 min-h-screen ${isLargeScreen ? 'lg:pl-[240px]' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Stats */}
          <div className="bg-white rounded-lg border border-border p-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-muted-foreground">共 {total} 张待审核</span>
            </div>
          </div>

          {/* Images Grid */}
          {loading ? (
            <div className="bg-white rounded-lg border border-border p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="bg-white rounded-lg border border-border p-12 text-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">暂无待审核图片</h3>
              <p className="text-sm text-muted-foreground">所有图片都已审核完成</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {images.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.cloudinaryUrl}
                        alt={item.spotName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {item.spotName}
                      </h3>
                      <div className="space-y-1 mb-4">
                        <p className="text-xs text-muted-foreground">
                          上传者：{item.uploaderName} ({item.uploaderEmail})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          上传时间：{formatTime(item.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={reviewing === item.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          {reviewing === item.id ? '处理中...' : '通过'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(item.id)}
                          disabled={reviewing === item.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          拒绝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > pageSize && (
                <div className="bg-white rounded-lg border border-border p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg border border-border hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                      disabled={page >= Math.ceil(total / pageSize)}
                      className="px-4 py-2 rounded-lg border border-border hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">拒绝原因</h2>
              <button
                onClick={() => setShowRejectModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={rejectNote[showRejectModal] || ''}
                onChange={(e) =>
                  setRejectNote((prev) => ({ ...prev, [showRejectModal]: e.target.value }))
                }
                placeholder="请输入拒绝原因（必填）"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectNote[showRejectModal]?.trim() || reviewing === showRejectModal}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {reviewing === showRejectModal ? '处理中...' : '确认拒绝'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

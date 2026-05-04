// 景点图片管理页面 - 新UI设计
import { useState, useEffect } from 'react';
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
  Upload,
  Trash2,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import {
  getAdminSpots,
  getSpotImages,
  deleteAdminImage,
  uploadAdminImage,
} from '../../api/adminApi';
import type { AdminSpotListItem, SpotImageItem } from '../../types/admin';

export default function SpotManagePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const [spots, setSpots] = useState<AdminSpotListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<AdminSpotListItem | null>(null);
  const [images, setImages] = useState<SpotImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved');

  useEffect(() => {
    const checkScreenSize = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadSpots = async () => {
    setLoading(true);
    try {
      const response = await getAdminSpots(1, 100);
      if (response.success && response.data) {
        setSpots(response.data.items || []);
      }
    } catch (error) {
      console.error('加载景点列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpots();
  }, []);

  const filteredSpots = spots.filter((spot) =>
    spot.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const handleManageImages = async (spot: AdminSpotListItem) => {
    setSelectedSpot(spot);
    setModalVisible(true);
    setImagesLoading(true);
    try {
      const response = await getSpotImages(spot.id);
      if (response.success && response.data) {
        const allImages: SpotImageItem[] = [
          ...(response.data.approved || []).map((img) => ({ ...img, status: 'approved' as const })),
          ...(response.data.pending || []).map((img) => ({ ...img, status: 'pending' as const })),
          ...(response.data.rejected || []).map((img) => ({ ...img, status: 'rejected' as const })),
        ];
        setImages(allImages);
      }
    } catch (error) {
      console.error('加载图片列表失败:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await deleteAdminImage(imageId);
      if (response.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSpot) return;

    setUploading(true);
    try {
      const response = await uploadAdminImage(selectedSpot.id, file);
      if (response.success) {
        const imagesResponse = await getSpotImages(selectedSpot.id);
        if (imagesResponse.success && imagesResponse.data) {
          const allImages: SpotImageItem[] = [
            ...(imagesResponse.data.approved || []).map((img) => ({
              ...img,
              status: 'approved' as const,
            })),
            ...(imagesResponse.data.pending || []).map((img) => ({
              ...img,
              status: 'pending' as const,
            })),
            ...(imagesResponse.data.rejected || []).map((img) => ({
              ...img,
              status: 'rejected' as const,
            })),
          ];
          setImages(allImages);
        }
      }
    } catch (error) {
      console.error('上传图片失败:', error);
    } finally {
      setUploading(false);
    }
  };

  const approvedImages = images.filter((img) => img.status === 'approved');
  const pendingImages = images.filter((img) => img.status === 'pending');
  const rejectedImages = images.filter((img) => img.status === 'rejected');

  const currentImages =
    activeTab === 'approved'
      ? approvedImages
      : activeTab === 'pending'
        ? pendingImages
        : rejectedImages;

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
          <h1 className="text-base font-semibold text-foreground">景点图片管理</h1>
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
          {/* Search */}
          <div className="bg-white rounded-lg border border-border p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索景点名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Spots Table */}
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        景点名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        城市
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        已审核
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        待审核
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        封面图
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSpots.map((spot) => (
                      <tr key={spot.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-foreground">{spot.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-muted-foreground">{spot.city}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {spot.approvedImageCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {spot.pendingImageCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {spot.pendingImageCount}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {spot.coverImageUrl ? (
                            <img
                              src={spot.coverImageUrl}
                              alt=""
                              className="w-16 h-12 object-cover rounded"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">暂无</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleManageImages(spot)}
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                          >
                            管理图片
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Management Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedSpot?.name} - 图片管理
              </h2>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setSelectedSpot(null);
                  setImages([]);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {imagesLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex items-center gap-2 mb-6">
                    <button
                      onClick={() => setActiveTab('approved')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'approved'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                      }`}
                    >
                      已审核 ({approvedImages.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'pending'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                      }`}
                    >
                      待审核 ({pendingImages.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('rejected')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'rejected'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                      }`}
                    >
                      已拒绝 ({rejectedImages.length})
                    </button>
                  </div>

                  {/* Upload Button (only for approved tab) */}
                  {activeTab === 'approved' && (
                    <div className="mb-6">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
                        <Upload className="h-4 w-4" />
                        {uploading ? '上传中...' : '上传新图片'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Images Grid */}
                  {currentImages.length === 0 ? (
                    <div className="p-12 text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">暂无图片</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {currentImages.map((img) => (
                        <div
                          key={img.id}
                          className="bg-gray-50 rounded-lg border border-border overflow-hidden"
                        >
                          <div className="aspect-[4/3] overflow-hidden">
                            <img
                              src={img.cloudinaryUrl}
                              alt=""
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-3">
                            {activeTab === 'approved' && (
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                              >
                                <Trash2 className="h-4 w-4" />
                                删除
                              </button>
                            )}
                            {activeTab !== 'approved' && img.uploaderName && (
                              <p className="text-xs text-muted-foreground text-center">
                                上传者: {img.uploaderName}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

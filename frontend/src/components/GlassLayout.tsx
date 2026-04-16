// 沉浸式毛玻璃布局组件 - 用于所有页面
import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Plus, Sparkles, Globe, Heart, PenLine, List, MapPin, Users, Search, Bell, Settings, Sun, Image as ImageIcon } from "lucide-react";
import { GlassCard, LogoutButton } from './home';
import ImageCropper from './ImageCropper';
import GlobalSidebar from './GlobalSidebar';
import { API_BASE_URL } from '../config/api';

interface GlassLayoutProps {
  children: ReactNode;
  showSearch?: boolean;
}

export default function GlassLayout({ children, showSearch = true }: GlassLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bgImage, setBgImage] = useState<string>('/homepage-bg.jpg');
  const [showBgInput, setShowBgInput] = useState(false);
  const [bgUrl, setBgUrl] = useState<string>('');
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 判断是否在首页
  const isHomePage = location.pathname === '/';

  // 从 localStorage 读取保存的背景图
  useEffect(() => {
    const savedBg = localStorage.getItem('customBgImage');
    if (savedBg) {
      setBgImage(savedBg);
    }
  }, []);

  // 处理背景图更改
  const handleBgChange = () => {
    if (bgUrl.trim()) {
      setBgImage(bgUrl.trim());
      localStorage.setItem('customBgImage', bgUrl.trim());
      setShowBgInput(false);
      setBgUrl('');
    }
  };

  // 处理背景图上传
  const handleBgUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 JPG、PNG、GIF、WebP 格式的图片');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('图片大小不能超过 10MB');
      return;
    }

    // 打开裁剪器
    setSelectedFile(file);
    setCropperVisible(true);
    setShowBgInput(false);
  };

  // 处理裁剪确认
  const handleCropConfirm = async (croppedImage: string) => {
    try {
      // 将base64转换为Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // 上传裁剪后的图片
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();

      if (result.success) {
        const imageUrl = result.data.url;
        setBgImage(imageUrl);
        localStorage.setItem('customBgImage', imageUrl);
        setCropperVisible(false);
        setSelectedFile(null);
      } else {
        alert(result.error || '图片上传失败');
      }
    } catch (error) {
      console.error('背景图上传失败:', error);
      alert('图片上传失败，请重试');
    }
  };

  // 处理裁剪取消
  const handleCropCancel = () => {
    setCropperVisible(false);
    setSelectedFile(null);
  };

  // 重置为默认背景
  const handleResetBg = () => {
    setBgImage('/homepage-bg.jpg');
    localStorage.removeItem('customBgImage');
    setShowBgInput(false);
    setBgUrl('');
  };

  return (
    <div className="min-h-screen relative">
      {/* 全屏背景 - 使用裁剪后的图片，完美铺满屏幕 */}
      <div
        className="fixed inset-0"
      >
        <img
          src={bgImage}
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      </div>

      {/* 背景遮罩 - 降低模糊度以提高清晰度 */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* 主容器 */}
      <div className="relative min-h-screen flex">
        {/* 全局侧边栏 */}
        <GlobalSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* 主内容区 */}
        <main className={`flex-1 p-6 transition-all duration-300 ${
          sidebarOpen ? 'ml-[15%]' : ''
        }`}>
          {/* 顶部栏 */}
          {showSearch && (
            <div className="mb-6">
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  {/* 搜索框 */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="搜索目的地、景点、攻略…"
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    />
                  </div>

                  {/* 功能图标组 */}
                  <div className="flex items-center gap-2">
                    {/* 通知按钮 */}
                    <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Bell className="h-5 w-5 text-white/80" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* 设置按钮 */}
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Settings className="h-5 w-5 text-white/80" />
                    </button>

                    {/* 主题切换按钮 */}
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                      <Sun className="h-4 w-4 text-white/80" />
                      <span className="text-xs font-medium text-white/80">Light</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* 页面内容 */}
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* 图片裁剪器 */}
      <ImageCropper
        visible={cropperVisible}
        imageFile={selectedFile}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}

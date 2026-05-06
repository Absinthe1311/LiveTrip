// 设置弹窗组件
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, LogOut, Sun, Moon } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  bgImage: string;
  onBgChange: (url: string) => void;
  onBgRemove: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onLogout,
  bgImage,
  onBgChange,
  onBgRemove,
}: SettingsModalProps) {
  const [bgUrl, setBgUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  if (!isOpen) return null;

  // 处理背景图URL更改
  const handleBgUrlChange = () => {
    if (bgUrl.trim()) {
      onBgChange(bgUrl.trim());
      setBgUrl('');
    }
  };

  // 处理背景图上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // 处理裁剪确认
  const handleCropConfirm = async (croppedImage: string) => {
    setUploading(true);
    try {
      // 将base64转换为Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      // 上传裁剪后的图片到Cloudinary
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch('http://localhost:3003/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();

      if (result.success) {
        const imageUrl = result.data.url;
        onBgChange(imageUrl);
        setCropperVisible(false);
        setSelectedFile(null);
        alert('背景图上传成功！');
      } else {
        alert(result.error 
      }
    } catch (error) {
      console.error('背景图上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 处理裁剪取消
  const handleCropCancel = () => {
    setCropperVisible(false);
    setSelectedFile(null);
  };

  // 处理重置背景
  const handleResetBg = () => {
    onBgRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-50 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 主题设置 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">主题</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'bg-amber-500/20 border-amber-400/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <Sun className="h-5 w-5 text-white" />
                <span className="text-white font-medium">浅色模式</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-amber-500/20 border-amber-400/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <Moon className="h-5 w-5 text-white" />
                <span className="text-white font-medium">深色模式</span>
              </button>
            </div>
          </div>

          {/* 背景图设置 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">背景图</h3>
            <div className="space-y-3">
              {/* 当前背景预览 */}
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/20">
                <img
                  src={bgImage}
                  alt="当前背景"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">当前背景</span>
                </div>
              </div>

              {/* URL输入 */}
              <div className="space-y-2">
                <label className="text-sm text-white/60">图片URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bgUrl}
                    onChange={(e) => setBgUrl(e.target.value)}
                    placeholder="输入图片URL..."
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
                  />
                  <button
                    onClick={handleBgUrlChange}
                    disabled={!bgUrl.trim()}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    应用
                  </button>
                </div>
              </div>

              {/* 上传本地图片 */}
              <div className="space-y-2">
                <label className="text-sm text-white/60">上传本地图片</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="bg-upload-input-settings"
                  ref={fileInputRef}
                />
                <label
                  htmlFor="bg-upload-input-settings"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>选择本地图片</span>
                </label>
                <p className="text-xs text-white/40">
                  支持 JPG、PNG、GIF、WebP 格式，最大 10MB
                </p>
              </div>

              {/* 重置按钮 */}
              <button
                onClick={handleResetBg}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white/60 hover:bg-white/10 transition-colors"
              >
                重置为默认背景
              </button>
            </div>
          </div>

          {/* 账号设置 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">账号</h3>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* 图片裁剪器 */}
      <ImageCropper
        visible={cropperVisible}
        imageFile={selectedFile}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />

      {/* 上传中提示 */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
              <p className="text-white font-medium">正在上传背景图...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
